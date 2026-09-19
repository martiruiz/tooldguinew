'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, X, Calendar, Search, MoreHorizontal, Edit2, Trash2, ChevronLeft, ChevronRight, FileText, Film, Zap, Layers, Video, PenLine, Mail, Mic, BarChart2, Globe } from 'lucide-react'
import { getInitials } from '@/lib/utils'
import { ClientSearchSelect } from '@/components/ui/ClientSearchSelect'
import { createContentItem, updateContentItem, deleteContentItem, moveContentItem } from '@/app/(app)/contingut/actions'

// ── Chip Selectors ──
function FormatChips({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="chips-wrap">
      {FORMAT_ITEMS.map(f => (
        <button key={f.label} type="button"
          className={`chip${value === f.label ? ' chip--active' : ''}`}
          onClick={() => onChange(value === f.label ? '' : f.label)}>
          {f.icon}{f.label}
        </button>
      ))}
    </div>
  )
}

function ChannelChips({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="chips-wrap">
      {CHANNEL_ITEMS.map(c => (
        <button key={c.label} type="button"
          className={`chip chip--brand${value === c.label ? ' chip--active' : ''}`}
          style={value === c.label ? { '--brand-color': c.color, background: c.color, borderColor: c.color, color: 'white' } as React.CSSProperties : {}}
          onClick={() => onChange(value === c.label ? '' : c.label)}>
          {c.icon}{c.label}
        </button>
      ))}
    </div>
  )
}

// ── Assignee Picker ──
function AssigneePicker({ value, onChange, profiles }: {
  value: string
  onChange: (v: string) => void
  profiles: Props['profiles']
}) {
  return (
    <div className="ap-grid">
      <button type="button"
        className={`ap-item${!value ? ' ap-item--active' : ''}`}
        onClick={() => onChange('')}>
        <div className="ap-avatar ap-avatar--none">—</div>
        <span className="ap-name">Cap</span>
      </button>
      {profiles.map(p => {
        const sel = value === p.id
        return (
          <button key={p.id} type="button"
            className={`ap-item${sel ? ' ap-item--active' : ''}`}
            onClick={() => onChange(sel ? '' : p.id)}>
            <div className="ap-avatar" style={{ background: sel ? '#1B2B4B' : avColor(p.full_name) }}>
              {p.avatar_url
                ? <img src={p.avatar_url} alt={p.full_name} style={{ width:'100%',height:'100%',objectFit:'cover' }}/>
                : getInitials(p.full_name)}
            </div>
            <span className="ap-name">{p.full_name.split(' ')[0]}</span>
          </button>
        )
      })}
    </div>
  )
}

// ── Premium Date Picker ──
const DAYS_CA = ['dl', 'dt', 'dc', 'dj', 'dv', 'ds', 'dg']
const MONTHS_CA = ['Gener','Febrer','Març','Abril','Maig','Juny','Juliol','Agost','Setembre','Octubre','Novembre','Desembre']

function DatePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const today = new Date(); today.setHours(0,0,0,0)
  const selected = value ? new Date(value + 'T00:00:00') : null
  const [view, setView] = useState(() => {
    const d = selected || today
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  const prevMonth = () => setView(v => v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 })
  const nextMonth = () => setView(v => v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 })

  const startOffset = (new Date(view.year, view.month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate()
  const cells: (number | null)[] = [...Array(startOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  const selectDay = (d: number) => {
    const iso = `${view.year}-${String(view.month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    onChange(iso)
    setOpen(false)
  }

  const displayValue = selected
    ? selected.toLocaleDateString('ca-ES', { day: 'numeric', month: 'short', year: 'numeric' })
    : ''

  return (
    <div>
      <button type="button" className={`dp-trigger${open ? ' dp-trigger--open' : ''}`} onClick={() => setOpen(o => !o)}>
        <Calendar size={14} style={{ color: selected ? '#1B2B4B' : '#9CA3AF', flexShrink: 0 }} />
        <span style={{ color: selected ? '#111827' : '#9CA3AF', fontSize: 13.5, flex: 1, textAlign: 'left' }}>
          {displayValue || 'Selecciona data'}
        </span>
        {selected && (
          <span role="button" className="dp-clear-x" onClick={e => { e.stopPropagation(); onChange(''); }}>×</span>
        )}
      </button>

      {open && (
        <div className="dp-inline">
          <div className="dp-header">
            <button type="button" className="dp-nav" onClick={prevMonth}><ChevronLeft size={15} /></button>
            <span className="dp-month-label">{MONTHS_CA[view.month]} {view.year}</span>
            <button type="button" className="dp-nav" onClick={nextMonth}><ChevronRight size={15} /></button>
          </div>

          <div className="dp-grid">
            {DAYS_CA.map(d => <div key={d} className="dp-weekday">{d}</div>)}
            {cells.map((d, i) => {
              if (!d) return <div key={`e${i}`} />
              const thisDate = new Date(view.year, view.month, d); thisDate.setHours(0,0,0,0)
              const isToday = thisDate.getTime() === today.getTime()
              const isSel = selected && thisDate.getTime() === selected.getTime()
              return (
                <button key={d} type="button"
                  className={`dp-day${isToday ? ' dp-today' : ''}${isSel ? ' dp-selected' : ''}`}
                  onClick={() => selectDay(d)}>{d}</button>
              )
            })}
          </div>

          <div className="dp-footer">
            <button type="button" className="dp-foot-btn dp-foot-clear" onClick={() => { onChange(''); setOpen(false) }}>Esborra</button>
            <button type="button" className="dp-foot-btn dp-foot-today" onClick={() => {
              onChange(today.toISOString().slice(0,10))
              setOpen(false)
            }}>Avui</button>
          </div>
        </div>
      )}
    </div>
  )
}

export type ContentStatus = 'idea' | 'produccio' | 'revisio' | 'publicat'

const COLUMNS: { key: ContentStatus; label: string; color: string; bg: string }[] = [
  { key: 'idea',      label: 'Idea',        color: '#6B7280', bg: '#F9FAFB' },
  { key: 'produccio', label: 'En producció', color: '#D97706', bg: '#FFFBEB' },
  { key: 'revisio',   label: 'En revisió',  color: '#2563EB', bg: '#EFF6FF' },
  { key: 'publicat',  label: 'Publicat',    color: '#16A34A', bg: '#F0FDF4' },
]

// Social brand SVG icons
const IcoInstagram = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="ig-g" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#F58529"/>
        <stop offset="50%" stopColor="#DD2A7B"/>
        <stop offset="100%" stopColor="#8134AF"/>
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="20" height="20" rx="6" stroke="url(#ig-g)" strokeWidth="2"/>
    <circle cx="12" cy="12" r="4.5" stroke="url(#ig-g)" strokeWidth="2"/>
    <circle cx="17.5" cy="6.5" r="1.2" fill="#DD2A7B"/>
  </svg>
)
const IcoLinkedIn = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="#0077B5">
    <rect x="2" y="2" width="20" height="20" rx="4"/>
    <path d="M7 10h2v7H7zm1-1.5a1.2 1.2 0 110-2.4 1.2 1.2 0 010 2.4zm3.5 1.5h2v1s.7-1.2 2.2-1.2c1.8 0 2.8 1.1 2.8 3.2V17h-2v-3.5c0-.9-.4-1.5-1.3-1.5s-1.7.7-1.7 1.7V17h-2v-7z" fill="white"/>
  </svg>
)
const IcoTikTok = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M19.6 7.2A4.6 4.6 0 0115 2.6h-2.8v12.7a2.3 2.3 0 11-1.9-2.3V10a5.1 5.1 0 105.1 5.1V9.5a7.3 7.3 0 004.2 1.3V8a4.6 4.6 0 01-.9-.8z" fill="#010101"/>
    <path d="M18.7 6.4A4.6 4.6 0 0114.1 1.8h-2.8v12.7a2.3 2.3 0 11-1.9-2.3V9.2A5.1 5.1 0 1014.6 14V8.7a7.3 7.3 0 004.1 1.1V7a4.6 4.6 0 01-.9-.6z" fill="#EE1D52"/>
    <path d="M19.6 8.8v2.8a7.3 7.3 0 01-4.2-1.3v5.8A5.1 5.1 0 1110.3 11V9.3a2.3 2.3 0 011.9 2.3 2.3 2.3 0 01-2.3 2.3 2.3 2.3 0 01-2.3-2.3 2.3 2.3 0 012.3-2.3v-3a5.1 5.1 0 100 10.2V9.2a7.3 7.3 0 004.2 1.3V7.2a4.6 4.6 0 003.5 1.6z" fill="#69C9D0"/>
  </svg>
)
const IcoYouTube = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="#FF0000">
    <path d="M22.5 6.7a2.8 2.8 0 00-2-2C18.9 4.3 12 4.3 12 4.3s-6.9 0-8.5.4a2.8 2.8 0 00-2 2C1.1 8.3 1.1 12 1.1 12s0 3.7.4 5.3a2.8 2.8 0 002 2c1.6.4 8.5.4 8.5.4s6.9 0 8.5-.4a2.8 2.8 0 002-2c.4-1.6.4-5.3.4-5.3s0-3.7-.4-5.3z"/>
    <path d="M9.8 15.5V8.5l6.4 3.5-6.4 3.5z" fill="white"/>
  </svg>
)
const IcoX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="#14171A">
    <path d="M18.3 3h3.3l-7.2 8.2L23 21h-6.6l-5.2-6.8L5 21H1.7l7.7-8.8L1 3h6.8l4.7 6.2L18.3 3zm-1.2 16.2h1.8L7 4.8H5.1l12 14.4z"/>
  </svg>
)
const IcoFacebook = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="#1877F2">
    <circle cx="12" cy="12" r="10"/>
    <path d="M15.5 8h-2c-.3 0-.5.2-.5.5V10h2.5l-.4 2.5H13V19h-2.5v-6.5H9V10h1.5V8.5C10.5 6.6 11.6 5.5 13.5 5.5c.8 0 2 .1 2 .1V8z" fill="white"/>
  </svg>
)

const FORMAT_ITEMS: { label: string; icon: React.ReactNode }[] = [
  { label: 'Post',       icon: <FileText size={13}/> },
  { label: 'Reel',       icon: <Film size={13}/> },
  { label: 'Story',      icon: <Zap size={13}/> },
  { label: 'Carrusel',   icon: <Layers size={13}/> },
  { label: 'Video',      icon: <Video size={13}/> },
  { label: 'Blog',       icon: <PenLine size={13}/> },
  { label: 'Email',      icon: <Mail size={13}/> },
  { label: 'Podcast',    icon: <Mic size={13}/> },
  { label: 'Infografia', icon: <BarChart2 size={13}/> },
  { label: 'Altre',      icon: <Plus size={13}/> },
]

const CHANNEL_ITEMS: { label: string; icon: React.ReactNode; color: string }[] = [
  { label: 'Instagram',  icon: <IcoInstagram/>,  color: '#DD2A7B' },
  { label: 'LinkedIn',   icon: <IcoLinkedIn/>,   color: '#0077B5' },
  { label: 'TikTok',     icon: <IcoTikTok/>,     color: '#010101' },
  { label: 'YouTube',    icon: <IcoYouTube/>,    color: '#FF0000' },
  { label: 'Twitter/X',  icon: <IcoX/>,          color: '#14171A' },
  { label: 'Facebook',   icon: <IcoFacebook/>,   color: '#1877F2' },
  { label: 'Web',        icon: <Globe size={13}/>, color: '#059669' },
  { label: 'Newsletter', icon: <Mail size={13}/>, color: '#D97706' },
  { label: 'Altre',      icon: <Plus size={13}/>, color: '#6B7280' },
]

// Keep for backward compat with card tags
const FORMATS = FORMAT_ITEMS.map(f => f.label)
const CHANNELS = CHANNEL_ITEMS.map(c => c.label)

export interface ContentItem {
  id: string
  title: string
  status: ContentStatus
  format?: string | null
  channel?: string | null
  client_id?: string | null
  assigned_to?: string | null
  due_date?: string | null
  notes?: string | null
  created_at: string
  client?: { id: string; name: string; logo_url?: string | null } | null
  assignee?: { id: string; full_name: string; avatar_url?: string | null } | null
}

interface Props {
  items: ContentItem[]
  clients: { id: string; name: string; logo_url?: string | null }[]
  profiles: { id: string; full_name: string; avatar_url?: string | null }[]
  currentUserId: string
}

function avColor(name: string) {
  const colors = ['#254067','#7C3AED','#059669','#D97706','#DC2626','#2563EB','#0891B2','#65A30D']
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) % colors.length
  return colors[Math.abs(h)]
}

function Av({ name, url, size = 24 }: { name: string; url?: string | null; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: url ? undefined : avColor(name), flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 700, color: 'white' }}>
      {url ? <img src={url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : getInitials(name)}
    </div>
  )
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  const today = new Date(); today.setHours(0,0,0,0)
  const dd = new Date(d); dd.setHours(0,0,0,0)
  const diff = Math.round((dd.getTime() - today.getTime()) / 86400000)
  if (diff === 0) return 'Avui'
  if (diff === 1) return 'Demà'
  if (diff === -1) return 'Ahir'
  return d.toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' })
}

function isOverdue(due: string) {
  return new Date(due).setHours(0,0,0,0) < new Date().setHours(0,0,0,0)
}

// ── Item Card ──
function ItemCard({
  item, onEdit, onDelete, onMove, columns
}: {
  item: ContentItem
  onEdit: (item: ContentItem) => void
  onDelete: (id: string) => void
  onMove: (id: string, status: ContentStatus) => void
  columns: typeof COLUMNS
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const col = columns.find(c => c.key === item.status)
  const overdue = item.due_date && isOverdue(item.due_date) && item.status !== 'publicat'

  return (
    <div className="ci-card" onClick={() => onEdit(item)}>
      <div className="ci-card-top">
        <span className="ci-title">{item.title}</span>
        <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          <button className="ci-menu-btn" onClick={() => setMenuOpen(o => !o)}><MoreHorizontal size={14} /></button>
          {menuOpen && (
            <div className="ci-menu-drop">
              {columns.filter(c => c.key !== item.status).map(c => (
                <button key={c.key} className="ci-menu-item" onClick={() => { onMove(item.id, c.key); setMenuOpen(false) }}>
                  → {c.label}
                </button>
              ))}
              <div className="ci-menu-sep" />
              <button className="ci-menu-item" onClick={() => { onEdit(item); setMenuOpen(false) }}>
                <Edit2 size={12} /> Editar
              </button>
              <button className="ci-menu-item ci-menu-item--del" onClick={() => { onDelete(item.id); setMenuOpen(false) }}>
                <Trash2 size={12} /> Eliminar
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="ci-tags">
        {item.format && <span className="ci-tag">{item.format}</span>}
        {item.channel && <span className="ci-tag ci-tag--ch">{item.channel}</span>}
      </div>

      <div className="ci-card-footer">
        <div className="ci-meta">
          {item.client && (
            <span className="ci-client" title={item.client.name}>
              {item.client.logo_url
                ? <img src={item.client.logo_url} alt="" className="ci-client-logo" />
                : <div className="ci-client-av" style={{ background: avColor(item.client.name) }}>{item.client.name.slice(0,1)}</div>}
              <span className="ci-client-name">{item.client.name}</span>
            </span>
          )}
          {item.due_date && (
            <span className={`ci-date${overdue ? ' ci-date--overdue' : ''}`}>
              <Calendar size={10} />{fmtDate(item.due_date)}
            </span>
          )}
        </div>
        {item.assignee && (
          <Av name={item.assignee.full_name} url={item.assignee.avatar_url} size={22} />
        )}
      </div>
    </div>
  )
}

// ── Item Form Modal ──
function ItemModal({
  item, clients, profiles, currentUserId, onSave, onClose
}: {
  item: Partial<ContentItem> | null
  clients: Props['clients']
  profiles: Props['profiles']
  currentUserId: string
  onSave: (data: Partial<ContentItem>) => void
  onClose: () => void
}) {
  const isNew = !item?.id
  const [form, setForm] = useState({
    title: item?.title || '',
    status: item?.status || 'idea' as ContentStatus,
    format: item?.format || '',
    channel: item?.channel || '',
    client_id: item?.client_id || '',
    assigned_to: item?.assigned_to || '',
    due_date: item?.due_date || '',
    notes: item?.notes || '',
  })

  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }))
  const valid = form.title.trim().length > 0

  return (
    <div className="ci-modal-bg" onClick={onClose}>
      <div className="ci-modal" onClick={e => e.stopPropagation()}>
        <div className="ci-modal-hdr">
          <span className="ci-modal-title">{isNew ? 'Nou contingut' : 'Editar contingut'}</span>
          <button className="ci-modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="ci-modal-body">
          <div className="ci-field">
            <label>Títol *</label>
            <input className="ci-input" placeholder="Títol del contingut..." value={form.title} onChange={set('title')} autoFocus />
          </div>
          <div className="ci-field">
            <label>Estat</label>
            <div className="chips-wrap">
              {COLUMNS.map(c => (
                <button key={c.key} type="button"
                  className={`chip chip--status${form.status === c.key ? ' chip--status-active' : ''}`}
                  style={form.status === c.key ? { background: c.color, borderColor: c.color, color: 'white' } : { borderColor: c.color, color: c.color }}
                  onClick={() => setForm(f => ({ ...f, status: c.key }))}>
                  <span className="chip-dot" style={{ background: c.color, opacity: form.status === c.key ? 0 : 1 }} />
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div className="ci-field">
            <label>Data entrega</label>
            <DatePicker value={form.due_date} onChange={v => setForm(f => ({ ...f, due_date: v }))} />
          </div>
          <div className="ci-field">
            <label>Format</label>
            <FormatChips value={form.format} onChange={v => setForm(f => ({ ...f, format: v }))} />
          </div>
          <div className="ci-field">
            <label>Canal</label>
            <ChannelChips value={form.channel} onChange={v => setForm(f => ({ ...f, channel: v }))} />
          </div>
          <div className="ci-field">
            <label>Client</label>
            <ClientSearchSelect
              clients={clients}
              value={form.client_id}
              onChange={(id) => setForm(f => ({ ...f, client_id: id }))}
              placeholder="Cerca client..."
              emptyLabel="Sense client"
            />
          </div>
          <div className="ci-field">
            <label>Assignat a</label>
            <AssigneePicker
              value={form.assigned_to}
              onChange={v => setForm(f => ({ ...f, assigned_to: v }))}
              profiles={profiles}
            />
          </div>
          <div className="ci-field">
            <label>Notes</label>
            <textarea className="ci-textarea" rows={3} placeholder="Notes, idea, referència..." value={form.notes} onChange={set('notes')} />
          </div>
        </div>

        <div className="ci-modal-footer">
          <button className="ci-btn-sec" onClick={onClose}>Cancel·lar</button>
          <button className="ci-btn-pri" onClick={() => valid && onSave(form)} disabled={!valid}>
            {isNew ? 'Crear' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Client Filter Picker ──
function ClientFilterPicker({ clients, value, onChange }: {
  clients: { id: string; name: string; logo_url?: string | null }[]
  value: string
  onChange: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const selected = clients.find(c => c.id === value)
  const filtered = q ? clients.filter(c => c.name.toLowerCase().includes(q.toLowerCase())) : clients

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setQ('') } }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const select = (id: string) => { onChange(id); setOpen(false); setQ('') }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="cfp-trigger" onClick={() => { setOpen(o => !o); setTimeout(() => inputRef.current?.focus(), 50) }}>
        {selected ? (
          <>
            {selected.logo_url
              ? <img src={selected.logo_url} alt="" className="cfp-logo" />
              : <div className="cfp-av" style={{ background: avColor(selected.name) }}>{selected.name.slice(0,1)}</div>}
            <span className="cfp-name">{selected.name}</span>
            <button className="cfp-clear" onClick={e => { e.stopPropagation(); onChange('') }}>✕</button>
          </>
        ) : (
          <span className="cfp-placeholder">Tots els clients</span>
        )}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 'auto', opacity: 0.35, flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}><path d="M6 9l6 6 6-6"/></svg>
      </button>

      {open && (
        <div className="cfp-drop">
          <div className="cfp-search-row">
            <Search size={12} style={{ color: '#9CA3AF', flexShrink: 0 }} />
            <input ref={inputRef} className="cfp-search" placeholder="Cerca client..." value={q} onChange={e => setQ(e.target.value)} />
            {q && <button className="cfp-clear-q" onClick={() => setQ('')}>×</button>}
          </div>
          <div className="cfp-grid">
            <button className={`cfp-item${!value ? ' cfp-item--sel' : ''}`} onClick={() => select('')}>
              <div className="cfp-item-av cfp-item-av--all">★</div>
              <span className="cfp-item-name">Tots</span>
            </button>
            {filtered.map(c => (
              <button key={c.id} className={`cfp-item${c.id === value ? ' cfp-item--sel' : ''}`} onClick={() => select(c.id)}>
                {c.logo_url
                  ? <img src={c.logo_url} alt="" className="cfp-item-logo" />
                  : <div className="cfp-item-av" style={{ background: avColor(c.name) }}>{c.name.slice(0,1)}</div>}
                <span className="cfp-item-name">{c.name}</span>
                {c.id === value && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#254067" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
              </button>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .cfp-trigger {
          display: flex; align-items: center; gap: 7px;
          height: 34px; padding: 0 10px;
          border: 1px solid #E5E7EB; border-radius: 8px;
          background: white; cursor: pointer; font-family: inherit;
          font-size: 13px; color: #374151; min-width: 140px; max-width: 200px;
          transition: border-color 0.15s;
        }
        .cfp-trigger:hover { border-color: #9CA3AF; }
        .cfp-logo { width: 18px; height: 18px; border-radius: 4px; object-fit: cover; flex-shrink: 0; }
        .cfp-av { width: 18px; height: 18px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 800; color: white; flex-shrink: 0; }
        .cfp-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12.5px; }
        .cfp-placeholder { flex: 1; color: #9CA3AF; font-size: 12.5px; white-space: nowrap; }
        .cfp-clear { background: none; border: none; cursor: pointer; color: #9CA3AF; font-size: 13px; padding: 0 2px; line-height: 1; flex-shrink: 0; }
        .cfp-clear:hover { color: #374151; }

        .cfp-drop {
          position: absolute; top: calc(100% + 6px); left: 0;
          width: 320px; background: white;
          border: 1px solid #E5E7EB; border-radius: 12px;
          box-shadow: 0 12px 40px rgba(0,0,0,0.14), 0 4px 12px rgba(0,0,0,0.06);
          z-index: 400; overflow: hidden;
        }
        .cfp-search-row {
          display: flex; align-items: center; gap: 7px;
          padding: 8px 12px; border-bottom: 1px solid #F3F4F6;
        }
        .cfp-search {
          flex: 1; border: none; outline: none;
          font-size: 13px; color: #111827; font-family: inherit; background: none;
        }
        .cfp-clear-q { background: none; border: none; cursor: pointer; color: #9CA3AF; font-size: 16px; padding: 0; }

        .cfp-grid {
          display: grid; grid-template-columns: repeat(2, 1fr);
          gap: 3px; padding: 8px; max-height: 300px; overflow-y: auto;
        }
        .cfp-item {
          display: flex; align-items: center; gap: 8px;
          padding: 7px 9px; border: none; background: none;
          cursor: pointer; border-radius: 8px; text-align: left;
          font-family: inherit; transition: background 0.1s; min-width: 0;
        }
        .cfp-item:hover { background: #F5F7FB; }
        .cfp-item--sel { background: #EFF6FF; }
        .cfp-item-logo { width: 22px; height: 22px; border-radius: 5px; object-fit: cover; flex-shrink: 0; }
        .cfp-item-av {
          width: 22px; height: 22px; border-radius: 5px;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 800; color: white; flex-shrink: 0;
        }
        .cfp-item-av--all { background: #F3F4F6; color: #9CA3AF; font-size: 10px; }
        .cfp-item-name {
          font-size: 12px; color: #111827; flex: 1;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0;
        }
      `}</style>
    </div>
  )
}

// ── Member Filter Picker ──
function MemberFilterPicker({ profiles, value, onChange }: {
  profiles: { id: string; full_name: string; avatar_url?: string | null }[]
  value: string
  onChange: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const selected = profiles.find(p => p.id === value)
  const filtered = q ? profiles.filter(p => p.full_name.toLowerCase().includes(q.toLowerCase())) : profiles

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setQ('') } }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const select = (id: string) => { onChange(id); setOpen(false); setQ('') }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="mfp-trigger" onClick={() => { setOpen(o => !o); setTimeout(() => inputRef.current?.focus(), 50) }}>
        {selected ? (
          <>
            {selected.avatar_url
              ? <img src={selected.avatar_url} alt="" className="mfp-logo" />
              : <div className="mfp-av" style={{ background: avColor(selected.full_name) }}>{selected.full_name.slice(0,1)}</div>}
            <span className="mfp-name">{selected.full_name.split(' ')[0]}</span>
            <button className="mfp-clear" onClick={e => { e.stopPropagation(); onChange('') }}>✕</button>
          </>
        ) : (
          <span className="mfp-placeholder">Tots els membres</span>
        )}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 'auto', opacity: 0.35, flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}><path d="M6 9l6 6 6-6"/></svg>
      </button>

      {open && (
        <div className="mfp-drop">
          <div className="mfp-search-row">
            <Search size={12} style={{ color: '#9CA3AF', flexShrink: 0 }} />
            <input ref={inputRef} className="mfp-search" placeholder="Cerca membre..." value={q} onChange={e => setQ(e.target.value)} />
            {q && <button className="mfp-clear-q" onClick={() => setQ('')}>×</button>}
          </div>
          <div className="mfp-list">
            <button className={`mfp-item${!value ? ' mfp-item--sel' : ''}`} onClick={() => select('')}>
              <div className="mfp-item-av mfp-item-av--all">★</div>
              <span className="mfp-item-name">Tots els membres</span>
              {!value && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#254067" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
            </button>
            {filtered.map(p => (
              <button key={p.id} className={`mfp-item${p.id === value ? ' mfp-item--sel' : ''}`} onClick={() => select(p.id)}>
                {p.avatar_url
                  ? <img src={p.avatar_url} alt="" className="mfp-item-logo" />
                  : <div className="mfp-item-av" style={{ background: avColor(p.full_name) }}>{p.full_name.slice(0,1)}</div>}
                <span className="mfp-item-name">{p.full_name}</span>
                {p.id === value && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#254067" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
              </button>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .mfp-trigger {
          display: flex; align-items: center; gap: 7px;
          height: 34px; padding: 0 10px;
          border: 1px solid #E5E7EB; border-radius: 8px;
          background: white; cursor: pointer; font-family: inherit;
          font-size: 13px; color: #374151; min-width: 140px; max-width: 200px;
          transition: border-color 0.15s;
        }
        .mfp-trigger:hover { border-color: #9CA3AF; }
        .mfp-logo { width: 22px; height: 22px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
        .mfp-av { width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 800; color: white; flex-shrink: 0; }
        .mfp-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12.5px; }
        .mfp-placeholder { flex: 1; color: #9CA3AF; font-size: 12.5px; white-space: nowrap; }
        .mfp-clear { background: none; border: none; cursor: pointer; color: #9CA3AF; font-size: 13px; padding: 0 2px; line-height: 1; flex-shrink: 0; }
        .mfp-clear:hover { color: #374151; }

        .mfp-drop {
          position: absolute; top: calc(100% + 6px); left: 0;
          width: 240px; background: white;
          border: 1px solid #E5E7EB; border-radius: 12px;
          box-shadow: 0 12px 40px rgba(0,0,0,0.14), 0 4px 12px rgba(0,0,0,0.06);
          z-index: 400; overflow: hidden;
        }
        .mfp-search-row {
          display: flex; align-items: center; gap: 7px;
          padding: 8px 12px; border-bottom: 1px solid #F3F4F6;
        }
        .mfp-search {
          flex: 1; border: none; outline: none;
          font-size: 13px; color: #111827; font-family: inherit; background: none;
        }
        .mfp-clear-q { background: none; border: none; cursor: pointer; color: #9CA3AF; font-size: 16px; padding: 0; }

        .mfp-list {
          display: flex; flex-direction: column;
          gap: 2px; padding: 6px; max-height: 280px; overflow-y: auto;
        }
        .mfp-item {
          display: flex; align-items: center; gap: 10px;
          padding: 7px 10px; border: none; background: none;
          cursor: pointer; border-radius: 8px; text-align: left;
          font-family: inherit; transition: background 0.1s; min-width: 0;
        }
        .mfp-item:hover { background: #F5F7FB; }
        .mfp-item--sel { background: #EFF6FF; }
        .mfp-item-logo { width: 26px; height: 26px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
        .mfp-item-av {
          width: 26px; height: 26px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 800; color: white; flex-shrink: 0;
        }
        .mfp-item-av--all { background: #F3F4F6; color: #9CA3AF; font-size: 10px; }
        .mfp-item-name {
          font-size: 13px; color: #111827; flex: 1;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0;
        }
      `}</style>
    </div>
  )
}

// ── Main Component ──
export function ContentPipeline({ items: initialItems, clients, profiles, currentUserId }: Props) {
  const [items, setItems] = useState<ContentItem[]>(initialItems)
  const [filterClient, setFilterClient] = useState('')
  const [filterAssignee, setFilterAssignee] = useState('')
  const [search, setSearch] = useState('')
  const [editItem, setEditItem] = useState<Partial<ContentItem> | null | false>(false)
  const [loading, setLoading] = useState(false)

  const filtered = items.filter(it => {
    if (filterClient && it.client_id !== filterClient) return false
    if (filterAssignee && it.assigned_to !== filterAssignee) return false
    if (search && !it.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const byStatus = (s: ContentStatus) => filtered.filter(it => it.status === s)

  const handleSave = async (data: Partial<ContentItem>) => {
    setLoading(true)
    const isNew = !editItem || !(editItem as ContentItem).id
    const payload = {
      title: data.title ?? '',
      status: data.status || 'idea',
      format: data.format || null,
      channel: data.channel || null,
      client_id: data.client_id || null,
      assigned_to: data.assigned_to || null,
      due_date: data.due_date || null,
      notes: data.notes || null,
    }
    const clientObj = data.client_id ? clients.find(c => c.id === data.client_id) || null : null
    const assigneeObj = data.assigned_to ? profiles.find(p => p.id === data.assigned_to) || null : null

    try {
      if (isNew) {
        const created = await createContentItem(payload)
        const newItem: ContentItem = {
          id: created?.id ?? crypto.randomUUID(),
          created_at: created?.created_at ?? new Date().toISOString(),
          title: payload.title,
          status: payload.status as ContentStatus,
          format: payload.format,
          channel: payload.channel,
          client_id: payload.client_id,
          assigned_to: payload.assigned_to,
          due_date: payload.due_date,
          notes: payload.notes,
          client: clientObj,
          assignee: assigneeObj,
        }
        setItems(prev => [newItem, ...prev])
      } else {
        const id = (editItem as ContentItem).id
        await updateContentItem(id, payload)
        setItems(prev => prev.map(it => it.id === id ? {
          ...it, ...payload,
          status: payload.status as ContentStatus,
          client: clientObj,
          assignee: assigneeObj,
        } : it))
      }
    } catch (err: any) {
      console.error('[ContentPipeline] save error:', err)
      alert(`Error: ${err.message}`)
    }
    setLoading(false)
    setEditItem(false)
  }

  const handleMove = async (id: string, status: ContentStatus) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, status } : it))
    try { await moveContentItem(id, status) } catch (err) { console.error(err) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar aquest contingut?')) return
    setItems(prev => prev.filter(it => it.id !== id))
    try { await deleteContentItem(id) } catch (err) { console.error(err) }
  }

  return (
    <div className="cp-root">
      {/* Toolbar */}
      <div className="cp-toolbar">
        <div className="cp-search-wrap">
          <Search size={13} style={{ color: '#9CA3AF', flexShrink: 0 }} />
          <input className="cp-search" placeholder="Cerca contingut..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <ClientFilterPicker clients={clients} value={filterClient} onChange={setFilterClient} />
        <MemberFilterPicker profiles={profiles} value={filterAssignee} onChange={setFilterAssignee} />
        <button className="cp-btn-new" onClick={() => setEditItem({})}>
          <Plus size={14} /> Nou contingut
        </button>
      </div>

      {/* Kanban board */}
      <div className="cp-board">
        {COLUMNS.map(col => {
          const colItems = byStatus(col.key)
          return (
            <div key={col.key} className="cp-col">
              <div className="cp-col-hdr">
                <div className="cp-col-dot" style={{ background: col.color }} />
                <span className="cp-col-label" style={{ color: col.color }}>{col.label}</span>
                <span className="cp-col-count">{colItems.length}</span>
                <button className="cp-col-add" onClick={() => setEditItem({ status: col.key })} title="Nou">
                  <Plus size={13} />
                </button>
              </div>
              <div className="cp-col-body">
                {colItems.length === 0 && (
                  <div className="cp-empty" onClick={() => setEditItem({ status: col.key })}>
                    <Plus size={14} style={{ opacity: 0.3 }} />
                  </div>
                )}
                {colItems.map(it => (
                  <ItemCard
                    key={it.id}
                    item={it}
                    columns={COLUMNS}
                    onEdit={setEditItem}
                    onDelete={handleDelete}
                    onMove={handleMove}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {editItem !== false && (
        <ItemModal
          item={editItem}
          clients={clients}
          profiles={profiles}
          currentUserId={currentUserId}
          onSave={handleSave}
          onClose={() => setEditItem(false)}
        />
      )}

      <style jsx global>{`
        /* Layout */
        .cp-root { display: flex; flex-direction: column; height: calc(100vh - 60px); padding: 20px 24px; gap: 16px; overflow: hidden; }

        /* Toolbar */
        .cp-toolbar { display: flex; align-items: center; gap: 10px; flex-shrink: 0; flex-wrap: wrap; }
        .cp-search-wrap { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 180px; background: white; border: 1.5px solid #E5E7EB; border-radius: 9px; padding: 0 12px; height: 36px; }
        .cp-search { flex: 1; border: none; outline: none; font-size: 13px; font-family: inherit; background: transparent; color: #111827; }
        .cp-filter-sel { height: 36px; padding: 0 10px; border: 1.5px solid #E5E7EB; border-radius: 9px; font-size: 13px; font-family: inherit; color: #374151; background: white; cursor: pointer; outline: none; }
        .cp-btn-new { display: flex; align-items: center; gap: 6px; height: 36px; padding: 0 16px; background: #1B2B4B; color: white; border: none; border-radius: 9px; font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; white-space: nowrap; }
        .cp-btn-new:hover { background: #254067; }

        /* Board */
        .cp-board { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; flex: 1; min-height: 0; }
        .cp-col { display: flex; flex-direction: column; background: #F8F9FB; border-radius: 14px; min-height: 0; overflow: hidden; }

        @media (max-width: 900px) {
          .cp-root { overflow-x: hidden; padding: 14px 16px 90px; }
          .cp-board { display: flex !important; flex-direction: row; overflow-x: auto; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; padding-bottom: 8px; flex: none; min-height: 0; height: calc(100vh - 160px); }
          .cp-col { min-width: 240px; max-width: 240px; scroll-snap-align: start; flex-shrink: 0; height: 100%; }
          .cp-col-body { flex: 1; overflow-y: auto; }
        }
        .cp-col-hdr { display: flex; align-items: center; gap: 8px; padding: 14px 14px 10px; flex-shrink: 0; }
        .cp-col-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .cp-col-label { font-size: 12.5px; font-weight: 700; letter-spacing: 0.3px; text-transform: uppercase; }
        .cp-col-count { font-size: 12px; color: #9CA3AF; background: #E5E7EB; border-radius: 10px; padding: 1px 7px; margin-left: 2px; }
        .cp-col-add { margin-left: auto; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border: none; background: none; cursor: pointer; color: #9CA3AF; border-radius: 6px; transition: background 0.1s; }
        .cp-col-add:hover { background: #E5E7EB; color: #374151; }
        .cp-col-body { flex: 1; overflow-y: auto; padding: 4px 10px 10px; display: flex; flex-direction: column; gap: 8px; }

        /* Empty */
        .cp-empty { border: 1.5px dashed #D1D5DB; border-radius: 10px; padding: 20px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #D1D5DB; transition: border-color 0.15s; }
        .cp-empty:hover { border-color: #9CA3AF; color: #9CA3AF; }

        /* Card */
        .ci-card { background: white; border-radius: 10px; padding: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.07); cursor: pointer; transition: box-shadow 0.15s, transform 0.1s; }
        .ci-card:hover { box-shadow: 0 3px 12px rgba(0,0,0,0.12); transform: translateY(-1px); }
        .ci-card-top { display: flex; align-items: flex-start; gap: 6px; margin-bottom: 8px; }
        .ci-title { flex: 1; font-size: 13px; font-weight: 600; color: #111827; line-height: 1.4; word-break: break-word; }
        .ci-menu-btn { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border: none; background: none; cursor: pointer; color: #9CA3AF; border-radius: 5px; flex-shrink: 0; }
        .ci-menu-btn:hover { background: #F3F4F6; color: #374151; }
        .ci-menu-drop { position: absolute; top: 100%; right: 0; min-width: 150px; background: white; border: 1px solid #E5E7EB; border-radius: 9px; box-shadow: 0 6px 20px rgba(0,0,0,0.12); z-index: 100; padding: 4px; }
        .ci-menu-item { display: flex; align-items: center; gap: 7px; width: 100%; padding: 7px 10px; border: none; background: none; cursor: pointer; font-size: 12.5px; color: #374151; font-family: inherit; border-radius: 6px; text-align: left; }
        .ci-menu-item:hover { background: #F3F4F6; }
        .ci-menu-item--del { color: #DC2626; }
        .ci-menu-item--del:hover { background: #FEF2F2; }
        .ci-menu-sep { height: 1px; background: #F3F4F6; margin: 4px 0; }
        .ci-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px; }
        .ci-tag { font-size: 11px; padding: 2px 8px; background: #F1F3F5; color: #4B5563; border-radius: 20px; font-weight: 500; }
        .ci-tag--ch { background: #EFF6FF; color: #2563EB; }
        .ci-card-footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .ci-meta { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; flex-wrap: wrap; }
        .ci-client { display: flex; align-items: center; gap: 5px; min-width: 0; }
        .ci-client-logo { width: 16px; height: 16px; border-radius: 3px; object-fit: cover; flex-shrink: 0; }
        .ci-client-av { width: 16px; height: 16px; border-radius: 3px; display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: 800; color: white; flex-shrink: 0; }
        .ci-client-name { font-size: 11.5px; color: #6B7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 90px; }
        .ci-date { display: flex; align-items: center; gap: 3px; font-size: 11px; color: #6B7280; white-space: nowrap; }
        .ci-date--overdue { color: #DC2626; font-weight: 600; }

        /* Chip Selectors */
        .chips-wrap { display: flex; flex-wrap: wrap; gap: 6px; }
        .chip { display: flex; align-items: center; gap: 5px; padding: 5px 11px; border: 1.5px solid #E5E7EB; border-radius: 20px; background: white; font-size: 12.5px; font-weight: 500; color: #374151; font-family: inherit; cursor: pointer; transition: all 0.12s; white-space: nowrap; line-height: 1; }
        .chip:hover { border-color: #1B2B4B; color: #1B2B4B; background: #F0F3F8; }
        .chip--active { background: #1B2B4B; border-color: #1B2B4B; color: white; }
        .chip--brand.chip--active { background: var(--brand-color, #1B2B4B); border-color: var(--brand-color, #1B2B4B); color: white; }
        .chip--brand.chip--active svg { filter: brightness(0) invert(1); }
        .chip-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; transition: opacity 0.1s; }
        .chip--status { border-radius: 20px; font-weight: 600; }
        .chip--status-active { }

        /* Assignee Picker */
        .ap-grid { display: flex; flex-wrap: wrap; gap: 8px; }
        .ap-item { display: flex; flex-direction: column; align-items: center; gap: 5px; padding: 8px 10px; border: 1.5px solid #E5E7EB; border-radius: 12px; background: white; cursor: pointer; font-family: inherit; transition: all 0.12s; min-width: 54px; }
        .ap-item:hover { border-color: #1B2B4B; background: #F0F3F8; }
        .ap-item--active { border-color: #1B2B4B; background: #EEF2FA; }
        .ap-avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: white; overflow: hidden; flex-shrink: 0; }
        .ap-avatar--none { background: #E5E7EB; color: #9CA3AF; font-size: 16px; font-weight: 400; }
        .ap-name { font-size: 11px; font-weight: 600; color: #374151; white-space: nowrap; max-width: 60px; overflow: hidden; text-overflow: ellipsis; }

        /* Date Picker */
        .dp-trigger { display: flex; align-items: center; gap: 8px; width: 100%; height: 38px; padding: 0 12px; border: 1.5px solid #E5E7EB; border-radius: 8px; background: white; cursor: pointer; font-family: inherit; transition: border-color 0.15s; text-align: left; }
        .dp-trigger:hover, .dp-trigger--open { border-color: #1B2B4B; }
        .dp-clear-x { margin-left: auto; font-size: 16px; color: #9CA3AF; line-height: 1; cursor: pointer; padding: 0 2px; }
        .dp-clear-x:hover { color: #374151; }
        .dp-inline { margin-top: 8px; background: white; border-radius: 14px; border: 1.5px solid #E5E7EB; padding: 14px; animation: dp-in 0.15s ease; }
        @keyframes dp-in { from { opacity:0; transform:translateY(-4px) } to { opacity:1; transform:translateY(0) } }
        .dp-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .dp-nav { width: 28px; height: 28px; border: none; background: #F3F4F6; border-radius: 7px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #374151; transition: background 0.1s; }
        .dp-nav:hover { background: #E5E7EB; }
        .dp-month-label { font-size: 13.5px; font-weight: 700; color: #111827; }
        .dp-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
        .dp-weekday { font-size: 10.5px; font-weight: 600; color: #9CA3AF; text-align: center; padding: 3px 0 7px; text-transform: uppercase; letter-spacing: 0.3px; }
        .dp-day { width: 100%; aspect-ratio: 1; border: none; background: none; border-radius: 7px; font-size: 12.5px; color: #374151; cursor: pointer; font-family: inherit; font-weight: 500; display: flex; align-items: center; justify-content: center; transition: background 0.1s, color 0.1s; }
        .dp-day:hover { background: #F3F4F6; }
        .dp-today { color: #1B2B4B; font-weight: 700; position: relative; }
        .dp-today::after { content: ''; position: absolute; bottom: 3px; left: 50%; transform: translateX(-50%); width: 4px; height: 4px; border-radius: 50%; background: #1B2B4B; }
        .dp-selected { background: #1B2B4B !important; color: white !important; font-weight: 700; box-shadow: 0 2px 8px rgba(27,43,75,0.3); }
        .dp-selected::after { display: none; }
        .dp-footer { display: flex; justify-content: space-between; margin-top: 12px; padding-top: 10px; border-top: 1px solid #F3F4F6; }
        .dp-foot-btn { border: none; background: none; cursor: pointer; font-size: 12.5px; font-family: inherit; font-weight: 600; padding: 5px 9px; border-radius: 7px; transition: background 0.1s; }
        .dp-foot-clear { color: #6B7280; }
        .dp-foot-clear:hover { background: #F3F4F6; }
        .dp-foot-today { color: #1B2B4B; }
        .dp-foot-today:hover { background: #EFF2F8; }

        /* Modal */
        .ci-modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 900; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .ci-modal { background: white; border-radius: 16px; width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
        .ci-modal-hdr { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 16px; border-bottom: 1px solid #F3F4F6; position: sticky; top: 0; background: white; z-index: 1; border-radius: 16px 16px 0 0; }
        .ci-modal-title { font-size: 16px; font-weight: 700; color: #111827; }
        .ci-modal-close { width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border: none; background: none; cursor: pointer; color: #6B7280; border-radius: 6px; }
        .ci-modal-close:hover { background: #F3F4F6; }
        .ci-modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; }
        .ci-modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 24px; border-top: 1px solid #F3F4F6; }
        .ci-field { display: flex; flex-direction: column; gap: 6px; }
        .ci-field label { font-size: 12.5px; font-weight: 600; color: #374151; }
        .ci-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .ci-input { height: 36px; padding: 0 12px; border: 1.5px solid #E5E7EB; border-radius: 8px; font-size: 13.5px; font-family: inherit; color: #111827; outline: none; transition: border-color 0.15s; }
        .ci-input:focus { border-color: #1B2B4B; }
        .ci-select { height: 36px; padding: 0 10px; border: 1.5px solid #E5E7EB; border-radius: 8px; font-size: 13.5px; font-family: inherit; color: #111827; background: white; outline: none; cursor: pointer; }
        .ci-textarea { padding: 10px 12px; border: 1.5px solid #E5E7EB; border-radius: 8px; font-size: 13px; font-family: inherit; color: #111827; outline: none; resize: vertical; transition: border-color 0.15s; }
        .ci-textarea:focus { border-color: #1B2B4B; }
        .ci-btn-pri { height: 36px; padding: 0 20px; background: #1B2B4B; color: white; border: none; border-radius: 9px; font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; }
        .ci-btn-pri:disabled { opacity: 0.5; cursor: not-allowed; }
        .ci-btn-sec { height: 36px; padding: 0 16px; background: transparent; color: #6B7280; border: 1.5px solid #E5E7EB; border-radius: 9px; font-size: 13px; font-family: inherit; cursor: pointer; }

      `}</style>
    </div>
  )
}
