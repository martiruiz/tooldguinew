'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, Calendar, Clock, X } from 'lucide-react'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const DAYS_CA = ['dl', 'dt', 'dc', 'dj', 'dv', 'ds', 'dg']
const MONTHS_CA = [
  'Gener', 'Febrer', 'Març', 'Abril', 'Maig', 'Juny',
  'Juliol', 'Agost', 'Setembre', 'Octubre', 'Novembre', 'Desembre',
]

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  const d = new Date(year, month, 1).getDay()
  return (d + 6) % 7
}

function formatDisplay(value: string): string {
  if (!value) return ''
  const [datePart, timePart] = value.split('T')
  if (!datePart) return ''
  const [y, m, d] = datePart.split('-')
  const month = MONTHS_CA[parseInt(m) - 1]?.slice(0, 3)
  return `${parseInt(d)} ${month} ${y}${timePart ? ` · ${timePart.slice(0, 5)}` : ''}`
}

interface PanelPos { top?: number; bottom?: number; left: number; width: number }

export function DateTimePicker({ value, onChange, placeholder = 'Selecciona data...' }: Props) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'date' | 'time'>('date')
  const [panelPos, setPanelPos] = useState<PanelPos>({ top: 0, left: 0, width: 260 })
  const [mounted, setMounted] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setMounted(true) }, [])

  const parsed = value ? (() => {
    const [datePart, timePart] = value.split('T')
    const [y, m, d] = datePart.split('-').map(Number)
    return { year: y, month: m - 1, day: d, time: timePart?.slice(0, 5) || '09:00' }
  })() : null

  const [viewYear, setViewYear] = useState(parsed?.year ?? new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(parsed?.month ?? new Date().getMonth())

  useEffect(() => {
    if (parsed) { setViewYear(parsed.year); setViewMonth(parsed.month) }
  }, [value])

  const calcPos = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const panelH = 340
    const spaceBelow = window.innerHeight - rect.bottom
    if (spaceBelow >= panelH) {
      setPanelPos({ top: rect.bottom + 6, left: rect.left, width: Math.max(rect.width, 272) })
    } else {
      setPanelPos({ bottom: window.innerHeight - rect.top + 6, left: rect.left, width: Math.max(rect.width, 272) })
    }
  }, [])

  const handleOpen = () => {
    calcPos()
    setOpen(v => !v)
  }

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        panelRef.current && !panelRef.current.contains(target)
      ) setOpen(false)
    }
    const scrollHandler = () => { calcPos() }
    document.addEventListener('mousedown', handler)
    window.addEventListener('scroll', scrollHandler, true)
    window.addEventListener('resize', scrollHandler)
    return () => {
      document.removeEventListener('mousedown', handler)
      window.removeEventListener('scroll', scrollHandler, true)
      window.removeEventListener('resize', scrollHandler)
    }
  }, [open, calcPos])

  const selectDay = (day: number) => {
    const m = String(viewMonth + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    const time = parsed?.time || '09:00'
    onChange(`${viewYear}-${m}-${d}T${time}`)
  }

  const setTime = (time: string) => {
    if (!parsed) return
    const m = String(parsed.month + 1).padStart(2, '0')
    const d = String(parsed.day).padStart(2, '0')
    onChange(`${parsed.year}-${m}-${d}T${time}`)
  }

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
    setOpen(false)
  }

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const today = new Date()
  const todayY = today.getFullYear()
  const todayM = today.getMonth()
  const todayD = today.getDate()

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    left: panelPos.left,
    width: panelPos.width,
    zIndex: 99999,
    background: 'white',
    border: '1px solid #E8E8E8',
    borderRadius: 12,
    boxShadow: '0 12px 40px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.06)',
    overflow: 'hidden',
    ...(panelPos.top !== undefined ? { top: panelPos.top } : { bottom: panelPos.bottom }),
  }

  const panel = mounted && open ? createPortal(
    <div ref={panelRef} style={panelStyle}>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #F0F0F0' }}>
        {(['date', 'time'] as const).map(tab => (
          <button
            key={tab}
            type="button"
            disabled={tab === 'time' && !parsed}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, height: 36, border: 'none', background: 'none', cursor: tab === 'time' && !parsed ? 'not-allowed' : 'pointer',
              fontSize: 12, fontWeight: activeTab === tab ? 700 : 500,
              color: activeTab === tab ? '#1B2B4B' : '#9CA3AF',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              borderBottom: activeTab === tab ? '2px solid #1B2B4B' : '2px solid transparent',
              marginBottom: -1, fontFamily: 'inherit', opacity: tab === 'time' && !parsed ? 0.4 : 1,
              transition: 'all 0.15s',
            }}
          >
            {tab === 'date' ? <Calendar size={12} /> : <Clock size={12} />}
            {tab === 'date' ? 'Data' : 'Hora'}
          </button>
        ))}
      </div>

      {activeTab === 'date' && (
        <div style={{ padding: '12px 14px 12px' }}>
          {/* Month nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <button type="button" onClick={prevMonth} style={navBtnStyle}><ChevronLeft size={14} /></button>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0a0a0a', letterSpacing: '-0.01em' }}>
              {MONTHS_CA[viewMonth]} {viewYear}
            </span>
            <button type="button" onClick={nextMonth} style={navBtnStyle}><ChevronRight size={14} /></button>
          </div>

          {/* Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {DAYS_CA.map(d => (
              <div key={d} style={{
                height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 600, color: '#B0B0B0', textTransform: 'uppercase', letterSpacing: '0.04em',
              }}>{d}</div>
            ))}
            {cells.map((day, i) => {
              if (!day) return <div key={`e${i}`} />
              const isToday = day === todayD && viewMonth === todayM && viewYear === todayY
              const isSelected = !!(parsed && day === parsed.day && viewMonth === parsed.month && viewYear === parsed.year)
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => { selectDay(day); setActiveTab('time') }}
                  style={{
                    height: 30, width: '100%', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    borderRadius: 6, fontSize: 12.5, fontWeight: isSelected || isToday ? 700 : 400,
                    background: isSelected ? '#1B2B4B' : 'transparent',
                    color: isSelected ? 'white' : isToday ? '#1B2B4B' : '#333',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative', transition: 'all 0.1s',
                  }}
                  onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = '#F0F4FF' }}
                  onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  {day}
                  {isToday && !isSelected && (
                    <span style={{
                      position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)',
                      width: 4, height: 4, borderRadius: '50%', background: '#1B2B4B',
                    }} />
                  )}
                </button>
              )
            })}
          </div>

          {/* Shortcuts */}
          <div style={{ display: 'flex', gap: 6, marginTop: 10, paddingTop: 10, borderTop: '1px solid #F5F5F5' }}>
            {[
              { label: 'Avui', delta: 0 },
              { label: 'Demà', delta: 1 },
              { label: '+1 setmana', delta: 7 },
            ].map(({ label, delta }) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  const t = new Date(); t.setDate(t.getDate() + delta)
                  const y = t.getFullYear()
                  const m = String(t.getMonth() + 1).padStart(2, '0')
                  const d = String(t.getDate()).padStart(2, '0')
                  const time = parsed?.time || '09:00'
                  onChange(`${y}-${m}-${d}T${time}`)
                  setViewYear(t.getFullYear()); setViewMonth(t.getMonth())
                }}
                style={shortcutStyle}
              >{label}</button>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'time' && parsed && (
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Hora del deadline
          </p>
          <input
            type="time"
            value={parsed.time}
            onChange={e => setTime(e.target.value)}
            style={{
              height: 40, padding: '0 12px', border: '1.5px solid #E8E8E8', borderRadius: 8,
              fontSize: 20, fontWeight: 700, color: '#0a0a0a', background: '#FAFAFA',
              outline: 'none', fontFamily: 'inherit', letterSpacing: '0.04em', width: '100%',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = '#1B2B4B'; e.currentTarget.style.background = 'white' }}
            onBlur={e => { e.currentTarget.style.borderColor = '#E8E8E8'; e.currentTarget.style.background = '#FAFAFA' }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5 }}>
            {['08:00', '09:00', '10:00', '12:00', '14:00', '16:00', '17:00', '18:00'].map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTime(t)}
                style={{
                  height: 28, border: `1px solid ${parsed.time === t ? '#1B2B4B' : '#E8E8E8'}`,
                  borderRadius: 6, background: parsed.time === t ? '#1B2B4B' : 'white',
                  color: parsed.time === t ? 'white' : '#555', fontSize: 11.5,
                  cursor: 'pointer', fontFamily: 'inherit', fontWeight: parsed.time === t ? 600 : 400,
                  transition: 'all 0.12s',
                }}
                onMouseEnter={e => { if (parsed.time !== t) { (e.currentTarget as HTMLElement).style.borderColor = '#1B2B4B'; (e.currentTarget as HTMLElement).style.color = '#1B2B4B' } }}
                onMouseLeave={e => { if (parsed.time !== t) { (e.currentTarget as HTMLElement).style.borderColor = '#E8E8E8'; (e.currentTarget as HTMLElement).style.color = '#555' } }}
              >{t}</button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            style={{
              height: 34, width: '100%', background: '#1B2B4B', color: 'white', border: 'none',
              borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#253d6d' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#1B2B4B' }}
          >Confirmar</button>
        </div>
      )}
    </div>,
    document.body
  ) : null

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        style={{
          width: '100%', height: 38, padding: '0 10px',
          border: `1.5px solid ${open ? '#1B2B4B' : '#E8E8E8'}`,
          borderRadius: 7, fontSize: 13,
          color: value ? '#0a0a0a' : '#9CA3AF',
          background: open ? 'white' : '#FAFAFA',
          outline: 'none', fontFamily: 'inherit', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 7, textAlign: 'left',
          transition: 'border-color 0.15s, background 0.15s',
        }}
      >
        <Calendar size={13} color="#9CA3AF" style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {value ? formatDisplay(value) : placeholder}
        </span>
        {value && (
          <span
            onClick={clear}
            style={{ display: 'flex', alignItems: 'center', color: '#B0B0B0', flexShrink: 0, padding: 2, borderRadius: 3 }}
          >
            <X size={11} />
          </span>
        )}
      </button>
      {panel}
    </>
  )
}

const navBtnStyle: React.CSSProperties = {
  width: 26, height: 26, border: '1px solid #E8E8E8', borderRadius: 6,
  background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center',
  justifyContent: 'center', color: '#555',
}

const shortcutStyle: React.CSSProperties = {
  height: 26, padding: '0 10px', border: '1px solid #E8E8E8', borderRadius: 6,
  background: 'white', fontSize: 11.5, color: '#555', cursor: 'pointer', fontFamily: 'inherit',
}
