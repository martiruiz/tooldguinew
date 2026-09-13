'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

interface DateInputProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
  style?: React.CSSProperties
  className?: string
}

const DAYS = ['dl', 'dt', 'dc', 'dj', 'dv', 'ds', 'dg']
const MONTHS = [
  'Gener', 'Febrer', 'Març', 'Abril', 'Maig', 'Juny',
  'Juliol', 'Agost', 'Setembre', 'Octubre', 'Novembre', 'Desembre',
]

function parseDate(value: string): Date | null {
  if (!value) return null
  const d = new Date(value + 'T12:00:00')
  return isNaN(d.getTime()) ? null : d
}

function toYMD(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatDisplay(value: string): string {
  const d = parseDate(value)
  if (!d) return ''
  return d.toLocaleDateString('ca-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

function getDaysInMonth(year: number, month: number): Date[] {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  // Monday=0
  let startDow = first.getDay() - 1
  if (startDow < 0) startDow = 6
  const days: Date[] = []
  for (let i = 0; i < startDow; i++) {
    const d = new Date(year, month, 1 - (startDow - i))
    days.push(d)
  }
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(new Date(year, month, d))
  }
  // Fill trailing
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    days.push(new Date(year, month + 1, i))
  }
  return days
}

export function DateInput({ value, onChange, disabled, style, className }: DateInputProps) {
  const [open, setOpen] = useState(false)
  const selected = parseDate(value)
  const today = new Date()

  const [view, setView] = useState<{ year: number; month: number }>(() => {
    const base = selected || today
    return { year: base.getFullYear(), month: base.getMonth() }
  })

  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    if (open) {
      const base = selected || today
      setView({ year: base.getFullYear(), month: base.getMonth() })
    }
  }, [open])

  const prevMonth = useCallback(() => {
    setView(v => {
      if (v.month === 0) return { year: v.year - 1, month: 11 }
      return { year: v.year, month: v.month - 1 }
    })
  }, [])

  const nextMonth = useCallback(() => {
    setView(v => {
      if (v.month === 11) return { year: v.year + 1, month: 0 }
      return { year: v.year, month: v.month + 1 }
    })
  }, [])

  const selectDay = useCallback((d: Date) => {
    const ymd = toYMD(d)
    const syntheticEvent = {
      target: { value: ymd },
    } as React.ChangeEvent<HTMLInputElement>
    onChange(syntheticEvent)
    setOpen(false)
  }, [onChange])

  const clearDate = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    const syntheticEvent = {
      target: { value: '' },
    } as React.ChangeEvent<HTMLInputElement>
    onChange(syntheticEvent)
    setOpen(false)
  }, [onChange])

  const days = getDaysInMonth(view.year, view.month)
  const todayYMD = toYMD(today)
  const selectedYMD = value

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: 'relative', display: 'inline-block', width: '100%', ...style }}
    >
      {/* Trigger */}
      <div
        onClick={() => !disabled && setOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          height: 36,
          padding: '0 10px',
          border: `1px solid ${open ? '#1B2B4B60' : '#E8E8E8'}`,
          borderRadius: 8,
          background: disabled ? '#FAFAFA' : 'white',
          cursor: disabled ? 'default' : 'pointer',
          userSelect: 'none',
          transition: 'border-color 0.15s',
        }}
      >
        <Calendar size={14} style={{ color: '#9CA3AF', flexShrink: 0 }} />
        <span style={{
          flex: 1,
          fontSize: 13.5,
          color: value ? '#0a0a0a' : '#9CA3AF',
          fontFamily: 'inherit',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {value ? formatDisplay(value) : 'Selecciona data'}
        </span>
        {value && !disabled && (
          <span
            onClick={clearDate}
            style={{ color: '#9CA3AF', fontSize: 14, lineHeight: 1, cursor: 'pointer', flexShrink: 0 }}
          >
            ×
          </span>
        )}
      </div>

      {/* Dropdown calendar */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          zIndex: 1000,
          background: 'white',
          border: '1px solid #E8E8E8',
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          padding: '14px 14px 10px',
          width: 268,
          fontFamily: 'inherit',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <button
              onClick={prevMonth}
              style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 6, display: 'flex', alignItems: 'center', color: '#374151' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#F3F4F6')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <ChevronLeft size={15} />
            </button>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#111827', letterSpacing: '0.01em' }}>
              {MONTHS[view.month]} {view.year}
            </span>
            <button
              onClick={nextMonth}
              style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 6, display: 'flex', alignItems: 'center', color: '#374151' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#F3F4F6')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Day names */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#9CA3AF', padding: '2px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {days.map((d, i) => {
              const ymd = toYMD(d)
              const isCurrentMonth = d.getMonth() === view.month
              const isSelected = ymd === selectedYMD
              const isToday = ymd === todayYMD

              return (
                <button
                  key={i}
                  onClick={() => selectDay(d)}
                  style={{
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: 7,
                    height: 32,
                    fontSize: 12.5,
                    fontWeight: isSelected ? 700 : isToday ? 600 : 400,
                    fontFamily: 'inherit',
                    background: isSelected ? '#1B2B4B' : 'none',
                    color: isSelected
                      ? 'white'
                      : isToday
                        ? '#1B2B4B'
                        : isCurrentMonth
                          ? '#111827'
                          : '#D1D5DB',
                    outline: isToday && !isSelected ? '1.5px solid #1B2B4B30' : 'none',
                    outlineOffset: -1,
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) e.currentTarget.style.background = '#F3F4F6'
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) e.currentTarget.style.background = 'none'
                  }}
                >
                  {d.getDate()}
                </button>
              )
            })}
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTop: '1px solid #F3F4F6' }}>
            <button
              onClick={clearDate}
              style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 12, color: '#9CA3AF', padding: '2px 6px', borderRadius: 6, fontFamily: 'inherit' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#374151' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#9CA3AF' }}
            >
              Esborra
            </button>
            <button
              onClick={() => selectDay(today)}
              style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 12, color: '#1B2B4B', fontWeight: 600, padding: '2px 6px', borderRadius: 6, fontFamily: 'inherit' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#F3F4F6' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
            >
              Avui
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
