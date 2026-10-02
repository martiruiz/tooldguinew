'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  CalendarDays, Flag, Disc3, Trophy, Plus, X, Pencil, Trash2,
  MapPin, Users, ChevronDown, ChevronUp, Check, AlertCircle,
  Package, MonitorPlay, BookOpen, UserPlus, Save, CalendarRange,
  ArrowRight, Clock, Upload,
} from 'lucide-react'

/* ─── Types ─────────────────────────────────────────────────────────── */
interface ImportantDate {
  id: string; title: string; date: string; description?: string; color: string
  priority?: 'alta' | 'mitjana' | 'opcional'; deadline?: string; client_id?: string
  created_at?: string; category?: string
}
interface Album {
  id: string; tournament_name: string; date_start: string; date_end?: string
  album_type: 'physical' | 'digital' | 'both'; notes?: string; price?: number
  sale_start?: string; sale_end?: string; comm_sent?: boolean; graphics_done?: boolean
}
interface Tournament {
  id: string; name: string; date_start: string; date_end?: string; location?: string; notes?: string; logo_url?: string
  album_type?: string; album_price?: number; sale_start?: string; sale_end?: string
  comm_sent?: boolean; graphics_done?: boolean; album_notes?: string
  album_min?: number; album_sold?: number
}
interface TournamentStaff {
  id: string; tournament_id: string; person_name: string; role: string
}
interface ClientEntry { id: string; name: string; logo_url?: string }

/* ─── Constants ──────────────────────────────────────────────────────── */
const CLIENT_PALETTE = ['#0d9488','#2563eb','#dc2626','#ea580c','#7c3aed','#db2777','#ca8a04','#059669','#0891b2','#4338ca']
const DAYS_CA = ['DL','DT','DC','DJ','DV','DS','DG']
const MONTHS_CA = ['Gener','Febrer','Març','Abril','Maig','Juny','Juliol','Agost','Setembre','Octubre','Novembre','Desembre']
const PRIORITY_CFG = {
  alta:     { label: 'Alta',     color: '#dc2626', bg: '#fef2f2' },
  mitjana:  { label: 'Mitjana',  color: '#d97706', bg: '#fffbeb' },
  opcional: { label: 'Opcional', color: '#6b7280', bg: '#f3f4f6' },
}
const ALBUM_TYPES = [
  { key: 'physical', label: 'Físic',           Icon: Package },
  { key: 'digital',  label: 'Digital',         Icon: MonitorPlay },
  { key: 'both',     label: 'Físic + Digital', Icon: Disc3 },
]

const TOURNAMENT_COLOR = '#f59e0b' // amber for tournament dots in calendar

const ALBUM_STEPS = [
  { key: 'graphics_done', label: 'Grafismes fets' },
  { key: 'comm_sent',     label: 'Comunicació enviada' },
  { key: 'sale_start',    label: 'Venda llançada' },
  { key: 'sale_end',      label: 'Venda tancada' },
] as const

function albumProgressPct(a: Album, todayStr: string): number {
  let done = 0
  if (a.graphics_done)                            done++
  if (a.comm_sent)                                done++
  if (a.sale_start && a.sale_start <= todayStr)   done++
  if (a.sale_end   && a.sale_end   <= todayStr)   done++
  return done / 4
}

function progressColor(pct: number): string {
  if (pct === 0)    return '#ef4444'
  if (pct <= 0.25)  return '#f97316'
  if (pct <= 0.5)   return '#f59e0b'
  if (pct <= 0.75)  return '#84cc16'
  return '#22c55e'
}

/* ─── Calendar range: Sep 2026 → Dec 2027 ───────────────────────────── */
const CAL_MONTHS: { year: number; month: number }[] = []
for (let y = 2026; y <= 2027; y++) {
  const start = y === 2026 ? 8 : 0
  const end   = y === 2027 ? 12 : 12
  for (let m = start; m < end; m++) CAL_MONTHS.push({ year: y, month: m })
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfWeek(year: number, month: number) {
  // Monday = 0 … Sunday = 6
  return (new Date(year, month, 1).getDay() + 6) % 7
}
function toISO(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
}
function formatDate(d: string) {
  if (!d) return ''
  const dt = new Date(d + 'T12:00:00')
  return dt.toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' })
}
function today() { return new Date().toISOString().split('T')[0] }

/* ─── Supabase hook ──────────────────────────────────────────────────── */
function useSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/* ─── Modal Wrapper ──────────────────────────────────────────────────── */
function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(10,14,26,0.55)', backdropFilter:'blur(4px)' }}>
      <div style={{ background:'#fff', borderRadius:16, boxShadow:'0 24px 80px rgba(0,0,0,0.18)', width:'100%', maxWidth: wide ? 620 : 520, padding:'28px 32px', position:'relative', maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
          <span style={{ fontSize:17, fontWeight:700, color:'#111827' }}>{title}</span>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, border:'none', background:'#f3f4f6', color:'#6b7280', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={16}/></button>
        </div>
        {children}
      </div>
    </div>
  )
}

const fieldStyle: React.CSSProperties = { width:'100%', padding:'9px 12px', borderRadius:8, border:'1.5px solid #e5e7eb', fontSize:14, fontFamily:'inherit', outline:'none', color:'#111827', background:'#fafafa', boxSizing:'border-box' }
const labelStyle: React.CSSProperties = { fontSize:11, fontWeight:700, color:'#6b7280', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:5, display:'block' }

/* ══════════════════════════════════════════════════════════════════════ */
export function CalendariContent({
  initialImportantDates, initialAlbums, initialTournaments, initialStaff, clients, currentUserId: _uid,
}: {
  initialImportantDates: ImportantDate[]
  initialAlbums: Album[]
  initialTournaments: Tournament[]
  initialStaff: TournamentStaff[]
  clients: ClientEntry[]
  currentUserId: string
}) {
  const supabase = useSupabase()
  const [tab, setTab] = useState<'dates'|'albums'|'tournaments'>('dates')
  const [dates, setDates] = useState<ImportantDate[]>(initialImportantDates)
  const [albums, setAlbums] = useState<Album[]>(initialAlbums)
  const [tournaments, setTournaments] = useState<Tournament[]>(initialTournaments)
  const [staff, setStaff] = useState<TournamentStaff[]>(initialStaff)
  const [error, setError] = useState<string|null>(null)
  const [expandedTournament, setExpandedTournament] = useState<string|null>(null)

  /* Modals */
  const [dateModal, setDateModal] = useState<Partial<ImportantDate>|null>(null)
  const [albumModal, setAlbumModal] = useState<Tournament|null>(null)
  const [tournamentModal, setTournamentModal] = useState<Partial<Tournament>|null>(null)
  const [staffModal, setStaffModal] = useState<{tournamentId:string; existing?:TournamentStaff}|null>(null)

  /* Dates view filters */
  const [filterYear, setFilterYear] = useState<number|null>(null)
  const [filterMonth, setFilterMonth] = useState<number|null>(null) // 0-based
  const [filterCategory, setFilterCategory] = useState<string|null>(null)

  /* Client color map */
  const clientColor = useCallback((clientId: string|undefined): string => {
    if (!clientId) return '#6b7280'
    const idx = clients.findIndex(c => c.id === clientId)
    return idx >= 0 ? CLIENT_PALETTE[idx % CLIENT_PALETTE.length] : '#6b7280'
  }, [clients])

  const clientName = useCallback((clientId: string|undefined): string => {
    if (!clientId) return 'Tots els clients'
    return clients.find(c => c.id === clientId)?.name ?? 'Desconegut'
  }, [clients])

  /* Realtime */
  useEffect(() => {
    const ch = supabase.channel('calendari-sync')
      .on('postgres_changes', { event:'*', schema:'public', table:'cal_important_dates' }, () => refresh('dates'))
      .on('postgres_changes', { event:'*', schema:'public', table:'cal_albums' }, () => refresh('albums'))
      .on('postgres_changes', { event:'*', schema:'public', table:'cal_tournaments' }, () => refresh('tournaments'))
      .on('postgres_changes', { event:'*', schema:'public', table:'cal_tournament_staff' }, () => refresh('staff'))
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refresh = useCallback(async (table: 'dates'|'albums'|'tournaments'|'staff') => {
    if (table === 'dates') {
      const { data } = await supabase.from('cal_important_dates').select('*').order('date', { ascending:true })
      if (data) setDates(data)
    } else if (table === 'albums') {
      const { data } = await supabase.from('cal_albums').select('*').order('date_start', { ascending:true })
      if (data) setAlbums(data)
    } else if (table === 'tournaments') {
      const { data } = await supabase.from('cal_tournaments').select('*').order('date_start', { ascending:true })
      if (data) setTournaments(data)
    } else {
      const { data } = await supabase.from('cal_tournament_staff').select('*').order('created_at', { ascending:true })
      if (data) setStaff(data)
    }
  }, [supabase])

  /* CRUD: Dates */
  const saveDate = async (d: Partial<ImportantDate>) => {
    if (!d.title || !d.date) return
    setError(null)
    const payload = { title:d.title, date:d.date, description:d.description, color:d.color??'#4f6ef7', priority:d.priority??'mitjana', deadline:d.deadline??null, client_id:d.client_id??null, category:d.category??null }
    const { error } = d.id
      ? await supabase.from('cal_important_dates').update(payload).eq('id', d.id)
      : await supabase.from('cal_important_dates').insert(payload)
    if (error) { setError(error.message); return }
    setDateModal(null); await refresh('dates')
  }
  const deleteDate = async (id: string) => {
    await supabase.from('cal_important_dates').delete().eq('id', id); await refresh('dates')
  }

  /* CRUD: Albums */
  const saveAlbum = async (a: Partial<Album>) => {
    if (!a.tournament_name || !a.date_start) return
    setError(null)
    const payload = { tournament_name:a.tournament_name, date_start:a.date_start, date_end:a.date_end, album_type:a.album_type??'both', notes:a.notes, price:a.price, sale_start:a.sale_start||null, sale_end:a.sale_end||null, comm_sent:a.comm_sent??false, graphics_done:a.graphics_done??false }
    const { error } = a.id
      ? await supabase.from('cal_albums').update(payload).eq('id', a.id)
      : await supabase.from('cal_albums').insert(payload)
    if (error) { setError(error.message); return }
    setAlbumModal(null); await refresh('albums')
  }
  const deleteAlbum = async (id: string) => {
    await supabase.from('cal_albums').delete().eq('id', id); await refresh('albums')
  }
  const toggleAlbumField = async (id: string, field: 'comm_sent'|'graphics_done', value: boolean) => {
    await supabase.from('cal_tournaments').update({ [field]: value }).eq('id', id)
    await refresh('tournaments')
  }
  const saveAlbumData = async (t: Partial<Tournament>) => {
    if (!t.id) return
    const payload = { album_type: t.album_type??'both', album_price: t.album_price??null, sale_start: t.sale_start||null, sale_end: t.sale_end||null, album_notes: t.album_notes||null, album_min: t.album_min??null, album_sold: t.album_sold??0 }
    await supabase.from('cal_tournaments').update(payload).eq('id', t.id)
    setAlbumModal(null); await refresh('tournaments')
  }

  /* CRUD: Tournaments */
  const saveTournament = async (t: Partial<Tournament>) => {
    if (!t.name || !t.date_start) return
    setError(null)
    const payload = { name:t.name, date_start:t.date_start, date_end:t.date_end, location:t.location, notes:t.notes, logo_url:t.logo_url }
    const { error } = t.id
      ? await supabase.from('cal_tournaments').update(payload).eq('id', t.id)
      : await supabase.from('cal_tournaments').insert(payload)
    if (error) { setError(error.message); return }
    setTournamentModal(null); await refresh('tournaments')
  }
  const deleteTournament = async (id: string) => {
    await supabase.from('cal_tournament_staff').delete().eq('tournament_id', id)
    await supabase.from('cal_tournaments').delete().eq('id', id)
    await refresh('tournaments'); await refresh('staff')
  }

  /* CRUD: Staff */
  const saveStaff = async (s: { tournamentId:string; person_name:string; role:string; id?:string }) => {
    if (!s.person_name || !s.role) return
    setError(null)
    const payload = { person_name:s.person_name, role:s.role }
    const { error } = s.id
      ? await supabase.from('cal_tournament_staff').update(payload).eq('id', s.id)
      : await supabase.from('cal_tournament_staff').insert({ ...payload, tournament_id:s.tournamentId })
    if (error) { setError(error.message); return }
    setStaffModal(null); await refresh('staff')
  }
  const deleteStaff = async (id: string) => {
    await supabase.from('cal_tournament_staff').delete().eq('id', id); await refresh('staff')
  }

  /* Filtered dates for current tab view */
  const filteredDates = dates.filter(d => {
    if (filterYear) { const y = parseInt(d.date.split('-')[0]); if (y !== filterYear) return false }
    if (filterMonth !== null) { const m = parseInt(d.date.split('-')[1]) - 1; if (m !== filterMonth) return false }
    if (filterCategory && d.category !== filterCategory) return false
    return true
  })
  /* Derived: unique categories in data */
  const allCategories = Array.from(new Set(dates.map(d => d.category).filter(Boolean))) as string[]

  /* Next upcoming date */
  const todayStr = today()
  const nextDate = filteredDates.find(d => d.date >= todayStr)

  /* Tabs */
  const tabs = [
    { key:'dates',       label:'Dates importants', Icon:Flag,     count:dates.length },
    { key:'albums',      label:'Àlbums',           Icon:Disc3,    count:tournaments.length },
    { key:'tournaments', label:'Tornejos',         Icon:Trophy,   count:tournaments.length },
  ] as const

  return (
    <div style={{ padding:'32px 36px', maxWidth:1200, margin:'0 auto', fontFamily:'inherit' }}>

      {error && (
        <div style={{ display:'flex', alignItems:'center', gap:10, background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:10, padding:'12px 16px', marginBottom:20, color:'#dc2626', fontSize:14 }}>
          <AlertCircle size={16}/><span>{error}</span>
          <button onClick={() => setError(null)} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:'#dc2626' }}><X size={14}/></button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:32, background:'#f1f5f9', borderRadius:12, padding:4, width:'fit-content' }}>
        {tabs.map(({ key, label, Icon, count }) => {
          const active = tab === key
          return (
            <button key={key} onClick={() => setTab(key)}
              style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 18px', borderRadius:9, border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight:active?700:500, color:active?'#111827':'#6b7280', background:active?'#fff':'transparent', boxShadow:active?'0 1px 4px rgba(0,0,0,0.10)':'none', transition:'all .15s' }}>
              <Icon size={15} strokeWidth={active?2.5:2}/>
              {label}
              <span style={{ fontSize:11, fontWeight:700, background:active?'#111827':'#e2e8f0', color:active?'#fff':'#6b7280', borderRadius:20, padding:'1px 7px', minWidth:20, textAlign:'center' }}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* ═══════════════ TAB: Dates importants ═══════════════════════════ */}
      {tab === 'dates' && (
        <section>
          {/* Header */}
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 }}>
            <div>
              <p style={{ fontSize:11, fontWeight:700, color:'#9ca3af', letterSpacing:'.1em', textTransform:'uppercase', margin:'0 0 6px' }}>
                Calendari de dates importants · Oct 2026 – Des 2027
              </p>
              <h2 style={{ fontSize:28, fontWeight:800, color:'#111827', margin:0, letterSpacing:'-.02em', lineHeight:1.15 }}>
                Dates importants
              </h2>
            </div>
            <button onClick={() => setDateModal({ color:'#4f6ef7', date:today(), priority:'mitjana' })}
              style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 20px', borderRadius:10, border:'none', background:'#111827', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', flexShrink:0, marginTop:4 }}>
              <Plus size={15}/>Nova data
            </button>
          </div>

          {/* Next upcoming banner */}
          {nextDate && (
            <div style={{ display:'flex', alignItems:'center', gap:16, background:'#fafafa', border:'1.5px solid #e5e7eb', borderRadius:12, padding:'14px 20px', marginBottom:12 }}>
              <span style={{ fontSize:10, fontWeight:800, color:'#6b7280', letterSpacing:'.1em', textTransform:'uppercase', whiteSpace:'nowrap' }}>Pròxima data</span>
              <div style={{ width:1, height:24, background:'#e5e7eb' }}/>
              <span style={{ fontSize:15, fontWeight:700, color:'#111827' }}>{nextDate.title}</span>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginLeft:'auto', flexShrink:0 }}>
                <span style={{ fontSize:13, color:'#6b7280' }}>{formatDate(nextDate.date)}</span>
                {nextDate.client_id && (
                  <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, fontWeight:700, color:clientColor(nextDate.client_id), background:`${clientColor(nextDate.client_id)}14`, borderRadius:20, padding:'3px 10px' }}>
                    <span style={{ width:6, height:6, borderRadius:'50%', background:clientColor(nextDate.client_id), display:'inline-block' }}/>
                    {clientName(nextDate.client_id)}
                  </span>
                )}
                {nextDate.deadline && (
                  <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'#6b7280' }}>
                    <Clock size={11}/>Llest abans del {formatDate(nextDate.deadline)}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Filter bar */}
          <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:28 }}>
            {/* Year */}
            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
              <span style={{ fontSize:11, fontWeight:700, color:'#9ca3af', letterSpacing:'.06em', textTransform:'uppercase', minWidth:52 }}>Any</span>
              {[null, 2026, 2027].map(y => {
                const active = filterYear === y
                return (
                  <button key={y??'all'} onClick={() => setFilterYear(active ? null : y)}
                    style={{ padding:'4px 14px', borderRadius:20, border:`1.5px solid ${active ? '#111827' : '#e5e7eb'}`, background:active ? '#111827' : '#fff', color:active ? '#fff' : '#6b7280', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all .12s' }}>
                    {y ?? 'Tots'}
                  </button>
                )
              })}
            </div>
            {/* Month */}
            <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
              <span style={{ fontSize:11, fontWeight:700, color:'#9ca3af', letterSpacing:'.06em', textTransform:'uppercase', minWidth:52 }}>Mes</span>
              {[null, ...Array.from({length:12},(_,i)=>i)].map(m => {
                const active = filterMonth === m
                const label = m === null ? 'Tots' : MONTHS_CA[m].slice(0,3)
                return (
                  <button key={m??'all'} onClick={() => setFilterMonth(active ? null : m)}
                    style={{ padding:'4px 10px', borderRadius:20, border:`1.5px solid ${active ? '#2563eb' : '#e5e7eb'}`, background:active ? '#eff6ff' : '#fff', color:active ? '#2563eb' : '#6b7280', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all .12s' }}>
                    {label}
                  </button>
                )
              })}
            </div>
            {/* Category */}
            {allCategories.length > 0 && (
              <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                <span style={{ fontSize:11, fontWeight:700, color:'#9ca3af', letterSpacing:'.06em', textTransform:'uppercase', minWidth:52 }}>Esport</span>
                {[null, ...allCategories].map(cat => {
                  const active = filterCategory === cat
                  return (
                    <button key={cat??'all'} onClick={() => setFilterCategory(active ? null : cat)}
                      style={{ padding:'4px 12px', borderRadius:20, border:`1.5px solid ${active ? '#7c3aed' : '#e5e7eb'}`, background:active ? '#f5f3ff' : '#fff', color:active ? '#7c3aed' : '#6b7280', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all .12s' }}>
                      {cat ?? 'Tot'}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Mini calendar grids */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:16, marginBottom:40 }}>
            {CAL_MONTHS.map(({ year, month }) => {
              const daysCount = getDaysInMonth(year, month)
              const startCol = getFirstDayOfWeek(year, month)
              const monthDates = filteredDates.filter(d => {
                const [dy, dm] = d.date.split('-').map(Number)
                return dy === year && dm === month + 1
              })
              const dotsMap: Record<number, string[]> = {}
              monthDates.forEach(d => {
                const day = parseInt(d.date.split('-')[2])
                if (!dotsMap[day]) dotsMap[day] = []
                dotsMap[day].push(clientColor(d.client_id))
              })
              // Add tournament dots (amber)
              tournaments.forEach(t => {
                const addTournDot = (dateStr?: string) => {
                  if (!dateStr) return
                  const [ty, tm, td] = dateStr.split('-').map(Number)
                  if (ty === year && tm === month + 1) {
                    if (!dotsMap[td]) dotsMap[td] = []
                    if (!dotsMap[td].includes(TOURNAMENT_COLOR)) dotsMap[td].push(TOURNAMENT_COLOR)
                  }
                }
                addTournDot(t.date_start)
                if (t.date_end && t.date_end !== t.date_start) addTournDot(t.date_end)
              })
              const hasAny = monthDates.length > 0 || tournaments.some(t => {
                const inMonth = (d?: string) => { if (!d) return false; const [ty,tm] = d.split('-').map(Number); return ty===year && tm===month+1 }
                return inMonth(t.date_start) || inMonth(t.date_end)
              })
              return (
                <div key={`${year}-${month}`} style={{ background:'#fff', border:'1px solid #f0f0f0', borderRadius:14, padding:'16px 14px', boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                    <span style={{ fontSize:13, fontWeight:800, color:'#111827', letterSpacing:'-.01em', textTransform:'uppercase' }}>{MONTHS_CA[month]}</span>
                    {hasAny && <span style={{ fontSize:10, fontWeight:700, background:'#f3f4f6', color:'#6b7280', borderRadius:8, padding:'2px 7px' }}>{monthDates.length}</span>}
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'1px 0' }}>
                    {DAYS_CA.map(d => (
                      <div key={d} style={{ textAlign:'center', fontSize:9, fontWeight:700, color:'#9ca3af', paddingBottom:4, letterSpacing:'.03em' }}>{d}</div>
                    ))}
                    {Array.from({ length: startCol }).map((_, i) => <div key={`e${i}`}/>)}
                    {Array.from({ length: daysCount }).map((_, i) => {
                      const day = i + 1
                      const iso = toISO(year, month, day)
                      const dots = dotsMap[day] ?? []
                      const isToday = iso === todayStr
                      return (
                        <div key={day} style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'2px 0' }}>
                          <span style={{ fontSize:11, fontWeight: dots.length ? 700 : 400, color: isToday ? '#2563eb' : dots.length ? '#111827' : '#6b7280', width:22, height:22, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'50%', background: isToday ? '#eff6ff' : 'transparent', border: isToday ? '1.5px solid #bfdbfe' : 'none' }}>
                            {day}
                          </span>
                          {dots.length > 0 && (
                            <div style={{ display:'flex', gap:2, marginTop:1 }}>
                              {dots.slice(0,3).map((col, ci) => (
                                <span key={ci} style={{ width:4, height:4, borderRadius:'50%', background:col, display:'inline-block' }}/>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* List by month — dates + tournaments merged */}
          {filteredDates.length === 0 && tournaments.length === 0 ? (
            <EmptyState icon={CalendarDays} label="Cap data important registrada"/>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:32 }}>
              {CAL_MONTHS.map(({ year, month }) => {
                const monthItems = filteredDates.filter(d => {
                  const [dy, dm] = d.date.split('-').map(Number)
                  return dy === year && dm === month + 1
                })
                const monthTournaments = tournaments.filter(t => {
                  const [ty, tm] = t.date_start.split('-').map(Number)
                  return ty === year && tm === month + 1
                })
                if (monthItems.length === 0 && monthTournaments.length === 0) return null
                const highCount = monthItems.filter(d => d.priority === 'alta').length
                // Merge and sort by date
                type Entry = { sortKey: string; type: 'date'|'tournament'; d?: typeof monthItems[0]; t?: Tournament }
                const entries: Entry[] = [
                  ...monthItems.map(d => ({ sortKey: d.date, type:'date' as const, d })),
                  ...monthTournaments.map(t => ({ sortKey: t.date_start, type:'tournament' as const, t })),
                ].sort((a,b) => a.sortKey.localeCompare(b.sortKey))
                return (
                  <div key={`list-${year}-${month}`}>
                    <div style={{ display:'flex', alignItems:'center', gap:12, paddingBottom:12, borderBottom:'2px solid #111827', marginBottom:0 }}>
                      <span style={{ fontSize:20, fontWeight:800, color:'#111827', letterSpacing:'-.02em', textTransform:'uppercase' }}>{MONTHS_CA[month]} {year}</span>
                      {highCount > 0 && <span style={{ fontSize:12, color:'#6b7280' }}>{highCount} d&apos;alta prioritat</span>}
                      {monthTournaments.length > 0 && <span style={{ fontSize:11, fontWeight:700, background:'#fef3c7', color:'#92400e', borderRadius:8, padding:'2px 8px' }}>{monthTournaments.length} {monthTournaments.length===1?'torneig':'tornejos'}</span>}
                    </div>
                    {entries.map(({ type, d, t }, idx) => {
                      if (type === 'date' && d) {
                        const dt = new Date(d.date + 'T12:00:00')
                        const dayNum = dt.getDate()
                        const dayName = dt.toLocaleDateString('ca-ES', { weekday:'short' }).toUpperCase().replace('.','')
                        const pCfg = d.priority ? PRIORITY_CFG[d.priority] : PRIORITY_CFG.opcional
                        const cCol = clientColor(d.client_id)
                        const cName = d.client_id ? clientName(d.client_id) : null
                        return (
                          <div key={d.id} style={{ display:'flex', gap:20, padding:'20px 0', borderBottom: idx < entries.length-1 ? '1px solid #f0f0f0' : 'none' }}>
                            <div style={{ width:52, flexShrink:0, textAlign:'center' }}>
                              <div style={{ fontSize:36, fontWeight:900, color:'#111827', lineHeight:1 }}>{dayNum}</div>
                              <div style={{ fontSize:11, fontWeight:700, color:'#9ca3af', marginTop:2 }}>{dayName}</div>
                            </div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontSize:16, fontWeight:700, color:'#111827', marginBottom:4 }}>{d.title}</div>
                              {d.description && <div style={{ fontSize:13, color:'#6b7280', lineHeight:1.5, marginBottom:8 }}>{d.description}</div>}
                              <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                                {cName && (
                                  <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, fontWeight:700, color:cCol, background:`${cCol}14`, border:`1px solid ${cCol}30`, borderRadius:20, padding:'3px 10px' }}>
                                    <span style={{ width:6, height:6, borderRadius:'50%', background:cCol, display:'inline-block' }}/>
                                    {cName}
                                  </span>
                                )}
                                <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:700, color:pCfg.color, background:pCfg.bg, border:`1px solid ${pCfg.color}30`, borderRadius:20, padding:'3px 10px' }}>
                                  Prioritat {pCfg.label.toLowerCase()}
                                </span>
                              </div>
                            </div>
                            <div style={{ flexShrink:0, textAlign:'right' }}>
                              {d.deadline && (
                                <div>
                                  <div style={{ fontSize:11, color:'#9ca3af', fontWeight:500, marginBottom:3 }}>Llest abans de</div>
                                  <div style={{ fontSize:16, fontWeight:800, color:'#111827' }}>
                                    {new Date(d.deadline+'T12:00:00').toLocaleDateString('ca-ES', { day:'numeric', month:'short' })}
                                  </div>
                                </div>
                              )}
                              <div style={{ display:'flex', gap:4, marginTop:8, justifyContent:'flex-end' }}>
                                <IconBtn icon={Pencil} onClick={() => setDateModal(d)}/>
                                <IconBtn icon={Trash2} onClick={() => deleteDate(d.id)} danger/>
                              </div>
                            </div>
                          </div>
                        )
                      }
                      if (type === 'tournament' && t) {
                        const dt = new Date(t.date_start + 'T12:00:00')
                        const dayNum = dt.getDate()
                        const dayName = dt.toLocaleDateString('ca-ES', { weekday:'short' }).toUpperCase().replace('.','')
                        return (
                          <div key={t.id} style={{ display:'flex', gap:20, padding:'20px 0', borderBottom: idx < entries.length-1 ? '1px solid #f0f0f0' : 'none' }}>
                            <div style={{ width:52, flexShrink:0, textAlign:'center' }}>
                              <div style={{ fontSize:36, fontWeight:900, color:TOURNAMENT_COLOR, lineHeight:1 }}>{dayNum}</div>
                              <div style={{ fontSize:11, fontWeight:700, color:'#9ca3af', marginTop:2 }}>{dayName}</div>
                            </div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                                {t.logo_url
                                  ? <img src={t.logo_url} alt="" style={{ width:22, height:22, objectFit:'contain', borderRadius:4 }}/>
                                  : <Trophy size={15} color={TOURNAMENT_COLOR}/>
                                }
                                <span style={{ fontSize:16, fontWeight:700, color:'#111827' }}>{t.name}</span>
                              </div>
                              <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                                {t.date_end && t.date_end !== t.date_start && (
                                  <span style={{ fontSize:12, color:'#6b7280' }}>fins al {formatDate(t.date_end)}</span>
                                )}
                                {t.location && <span style={{ fontSize:11, color:'#6b7280', display:'flex', alignItems:'center', gap:3 }}><MapPin size={10}/>{t.location}</span>}
                                <span style={{ fontSize:11, fontWeight:700, background:'#fef3c7', color:'#92400e', borderRadius:20, padding:'2px 9px' }}>Torneig</span>
                              </div>
                            </div>
                          </div>
                        )
                      }
                      return null
                    })}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* ═══════════════ TAB: Àlbums ══════════════════════════════════════ */}
      {tab === 'albums' && (
        <section>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 }}>
            <div>
              <p style={{ fontSize:11, fontWeight:700, color:'#9ca3af', letterSpacing:'.1em', textTransform:'uppercase', margin:'0 0 6px' }}>Un àlbum per torneig</p>
              <h2 style={{ fontSize:28, fontWeight:800, color:'#111827', margin:0, letterSpacing:'-.02em' }}>Àlbums</h2>
            </div>
          </div>
          {tournaments.length === 0 ? <EmptyState icon={Disc3} label="Cap torneig registrat"/> : (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {tournaments.map(t => {
                const albumT = t.album_type ?? 'both'
                const typeInfo = ALBUM_TYPES.find(x => x.key === albumT) ?? ALBUM_TYPES[2]
                // Adapt the album fields from the Tournament
                const albumLike = { graphics_done: t.graphics_done, comm_sent: t.comm_sent, sale_start: t.sale_start, sale_end: t.sale_end }
                const pct = albumProgressPct(albumLike as any, todayStr)
                const pColor = progressColor(pct)
                const pctInt = Math.round(pct * 100)
                const daysToEvent = t.date_start ? Math.ceil((new Date(t.date_start+'T12:00:00').getTime() - new Date(todayStr+'T12:00:00').getTime()) / 86400000) : null

                const stepStatus = [
                  { label:'Grafismes', done: !!t.graphics_done, active: !t.graphics_done },
                  { label:'Comunicació', done: !!t.comm_sent, active: !!t.graphics_done && !t.comm_sent },
                  { label:'Venda llançada', done: !!(t.sale_start && t.sale_start <= todayStr), active: !!(t.comm_sent && !(t.sale_start && t.sale_start <= todayStr)) },
                  { label:'Venda tancada', done: !!(t.sale_end && t.sale_end <= todayStr), active: !!(t.sale_start && t.sale_start <= todayStr && !(t.sale_end && t.sale_end <= todayStr)) },
                ]

                return (
                  <div key={t.id} style={{ background:'#fff', border:'1px solid #f0f0f0', borderRadius:14, padding:'18px 20px', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
                    {/* Header row */}
                    <div style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom:14 }}>
                      <div style={{ width:40, height:40, borderRadius:10, background:'linear-gradient(135deg,#f8fafc,#f1f5f9)', border:'1px solid #e5e7eb', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, overflow:'hidden' }}>
                        {t.logo_url
                          ? <img src={t.logo_url} alt="" style={{ width:'100%', height:'100%', objectFit:'contain', padding:4 }}/>
                          : <typeInfo.Icon size={18} color="#4b5563"/>
                        }
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:15, fontWeight:700, color:'#111827' }}>{t.name}</div>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:3, flexWrap:'wrap' }}>
                          <span style={{ fontSize:11, color:'#6b7280' }}>{formatDate(t.date_start)}{t.date_end && t.date_end !== t.date_start ? ` → ${formatDate(t.date_end)}` : ''}</span>
                          <span style={{ fontSize:10, fontWeight:700, background:'#f3f4f6', color:'#374151', borderRadius:6, padding:'2px 7px' }}>{typeInfo.label.toUpperCase()}</span>
                          {t.album_price && <span style={{ fontSize:11, color:'#059669', fontWeight:700 }}>{Number(t.album_price).toFixed(2)} €</span>}
                          {daysToEvent !== null && daysToEvent >= 0 && (
                            <span style={{ fontSize:10, fontWeight:700, background: daysToEvent <= 14 ? '#fef2f2' : '#f0fdf4', color: daysToEvent <= 14 ? '#dc2626' : '#166534', borderRadius:6, padding:'2px 7px' }}>
                              {daysToEvent === 0 ? 'Avui!' : `${daysToEvent}d`}
                            </span>
                          )}
                          {daysToEvent !== null && daysToEvent < 0 && (
                            <span style={{ fontSize:10, fontWeight:700, background:'#f3f4f6', color:'#6b7280', borderRadius:6, padding:'2px 7px' }}>Finalitzat</span>
                          )}
                        </div>
                      </div>
                      <IconBtn icon={Pencil} onClick={() => setAlbumModal(t)}/>
                    </div>

                    {/* Progress bar */}
                    <div style={{ marginBottom:12 }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:5 }}>
                        <span style={{ fontSize:11, fontWeight:700, color:'#6b7280', letterSpacing:'.05em', textTransform:'uppercase' }}>Procés de venda</span>
                        <span style={{ fontSize:11, fontWeight:800, color: pColor }}>{pctInt}%</span>
                      </div>
                      <div style={{ height:8, borderRadius:99, background:'#f3f4f6', overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${pctInt}%`, background:`linear-gradient(90deg, #ef4444, ${pColor})`, borderRadius:99, transition:'width .3s ease' }}/>
                      </div>
                    </div>

                    {/* Steps */}
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6 }}>
                      {stepStatus.map((s, i) => (
                        <div key={i} style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 8px', borderRadius:8, background: s.done ? '#f0fdf4' : s.active ? '#fffbeb' : '#f8fafc', border:`1px solid ${s.done ? '#bbf7d0' : s.active ? '#fde68a' : '#f0f0f0'}` }}>
                          <div style={{ width:14, height:14, borderRadius:'50%', background: s.done ? '#22c55e' : s.active ? '#f59e0b' : '#e5e7eb', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                            {s.done && <Check size={9} color="#fff" strokeWidth={3}/>}
                          </div>
                          <span style={{ fontSize:10, fontWeight:600, color: s.done ? '#166534' : s.active ? '#92400e' : '#9ca3af', lineHeight:1.2 }}>{s.label}</span>
                        </div>
                      ))}
                    </div>

                    {/* Sales counter */}
                    {(t.album_min != null || (t.album_sold ?? 0) > 0) && (() => {
                      const sold = t.album_sold ?? 0
                      const min = t.album_min ?? 0
                      const salesPct = min > 0 ? Math.min(100, Math.round((sold / min) * 100)) : 100
                      const ok = min === 0 || sold >= min
                      const barColor = ok ? '#22c55e' : sold >= min * 0.7 ? '#f59e0b' : '#ef4444'
                      return (
                        <div style={{ marginTop:10, background: ok ? '#f0fdf4' : '#fef9ec', border:`1px solid ${ok ? '#bbf7d0' : '#fde68a'}`, borderRadius:10, padding:'10px 12px' }}>
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                            <span style={{ fontSize:11, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'.05em' }}>Àlbums venuts</span>
                            <span style={{ fontSize:13, fontWeight:800, color: barColor }}>
                              {sold}{min > 0 ? ` / ${min} mínim` : ' venuts'}
                              {min > 0 && <span style={{ fontSize:11, fontWeight:600, color:'#9ca3af', marginLeft:6 }}>{ok ? '✓ Cobert' : `${min - sold} per cobrir`}</span>}
                            </span>
                          </div>
                          {min > 0 && (
                            <div style={{ height:6, borderRadius:99, background:'#e5e7eb', overflow:'hidden' }}>
                              <div style={{ height:'100%', width:`${salesPct}%`, background:barColor, borderRadius:99, transition:'width .3s ease' }}/>
                            </div>
                          )}
                        </div>
                      )
                    })()}

                    {/* Quick toggles */}
                    <div style={{ display:'flex', gap:8, marginTop:10 }}>
                      <button onClick={() => toggleAlbumField(t.id, 'graphics_done', !t.graphics_done)}
                        style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:7, border:`1.5px solid ${t.graphics_done ? '#22c55e' : '#e5e7eb'}`, background: t.graphics_done ? '#f0fdf4' : '#fff', color: t.graphics_done ? '#166534' : '#6b7280', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                        <div style={{ width:13, height:13, borderRadius:4, background: t.graphics_done ? '#22c55e' : '#e5e7eb', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          {t.graphics_done && <Check size={9} color="#fff" strokeWidth={3}/>}
                        </div>
                        Grafismes fets
                      </button>
                      <button onClick={() => toggleAlbumField(t.id, 'comm_sent', !t.comm_sent)}
                        style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:7, border:`1.5px solid ${t.comm_sent ? '#22c55e' : '#e5e7eb'}`, background: t.comm_sent ? '#f0fdf4' : '#fff', color: t.comm_sent ? '#166534' : '#6b7280', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                        <div style={{ width:13, height:13, borderRadius:4, background: t.comm_sent ? '#22c55e' : '#e5e7eb', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          {t.comm_sent && <Check size={9} color="#fff" strokeWidth={3}/>}
                        </div>
                        Comunicació enviada
                      </button>
                      {t.sale_start && (
                        <span style={{ fontSize:11, color:'#6b7280', display:'flex', alignItems:'center', gap:3, marginLeft:'auto' }}>
                          Venda: {formatDate(t.sale_start)}{t.sale_end ? ` → ${formatDate(t.sale_end)}` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* ═══════════════ TAB: Tornejos ════════════════════════════════════ */}
      {tab === 'tournaments' && (
        <section>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
            <div>
              <h2 style={{ fontSize:20, fontWeight:700, color:'#111827', margin:0 }}>Calendari de tornejos</h2>
              <p style={{ fontSize:13, color:'#6b7280', margin:'4px 0 0' }}>Tornejos amb l&apos;equip assignat i les funcions de cada persona.</p>
            </div>
            <button onClick={() => setTournamentModal({ date_start:today() })}
              style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 18px', borderRadius:10, border:'none', background:'#111827', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              <Plus size={15}/>Nou torneig
            </button>
          </div>
          {tournaments.length === 0 ? <EmptyState icon={Trophy} label="Cap torneig registrat"/> : (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {tournaments.map(t => {
                const tournamentStaff = staff.filter(s => s.tournament_id === t.id)
                const expanded = expandedTournament === t.id
                return (
                  <div key={t.id} style={{ background:'#fff', border:'1px solid #f0f0f0', borderRadius:14, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:14, padding:'16px 18px', cursor:'pointer' }} onClick={() => setExpandedTournament(expanded ? null : t.id)}>
                      <div style={{ width:40, height:40, borderRadius:10, background:'linear-gradient(135deg,#f8fafc,#f1f5f9)', border:'1px solid #e5e7eb', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, overflow:'hidden' }}>
                        {t.logo_url
                          ? <img src={t.logo_url} alt="" style={{ width:'100%', height:'100%', objectFit:'contain', padding:4 }}/>
                          : <Trophy size={18} color="#4b5563"/>
                        }
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:15, fontWeight:700, color:'#111827' }}>{t.name}</div>
                        <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:3 }}>
                          <span style={{ fontSize:12, color:'#6b7280', display:'flex', alignItems:'center', gap:4 }}>
                            <CalendarRange size={11}/>{formatDate(t.date_start)}{t.date_end && t.date_end !== t.date_start ? ` → ${formatDate(t.date_end)}` : ''}
                          </span>
                          {t.location && <span style={{ fontSize:12, color:'#6b7280', display:'flex', alignItems:'center', gap:4 }}><MapPin size={11}/>{t.location}</span>}
                          <span style={{ fontSize:11, fontWeight:700, background:'#f3f4f6', color:'#374151', borderRadius:6, padding:'2px 8px', display:'flex', alignItems:'center', gap:4 }}>
                            <Users size={10}/>{tournamentStaff.length} persones
                          </span>
                        </div>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }} onClick={e => e.stopPropagation()}>
                        <IconBtn icon={Pencil} onClick={() => setTournamentModal(t)}/>
                        <IconBtn icon={Trash2} onClick={() => deleteTournament(t.id)} danger/>
                        <div style={{ width:1, height:20, background:'#e5e7eb', margin:'0 2px' }}/>
                        <button onClick={() => setExpandedTournament(expanded ? null : t.id)}
                          style={{ width:30, height:30, borderRadius:8, border:'none', background:'#f3f4f6', color:'#6b7280', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          {expanded ? <ChevronUp size={15}/> : <ChevronDown size={15}/>}
                        </button>
                      </div>
                    </div>
                    {expanded && (
                      <div style={{ borderTop:'1px solid #f0f0f0', padding:'16px 18px' }}>
                        {t.notes && (
                          <div style={{ fontSize:13, color:'#6b7280', background:'#f8fafc', borderRadius:8, padding:'10px 14px', marginBottom:14, lineHeight:1.5 }}>
                            <BookOpen size={12} style={{ marginRight:6, verticalAlign:'middle' }}/>{t.notes}
                          </div>
                        )}
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                          <span style={{ fontSize:12, fontWeight:700, color:'#374151', letterSpacing:'.05em', textTransform:'uppercase' }}>Equip assignat</span>
                          <button onClick={() => setStaffModal({ tournamentId:t.id })}
                            style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:8, border:'1.5px dashed #d1d5db', background:'transparent', color:'#6b7280', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                            <UserPlus size={13}/>Afegir persona
                          </button>
                        </div>
                        {tournamentStaff.length === 0 ? (
                          <div style={{ textAlign:'center', padding:'20px 0', color:'#9ca3af', fontSize:13 }}>Cap persona assignada</div>
                        ) : (
                          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:8 }}>
                            {tournamentStaff.map(s => (
                              <div key={s.id} style={{ display:'flex', alignItems:'center', gap:10, background:'#f8fafc', border:'1px solid #e5e7eb', borderRadius:10, padding:'10px 12px' }}>
                                <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#e0e7ff,#c7d2fe)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:13, fontWeight:700, color:'#4338ca' }}>
                                  {s.person_name.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ flex:1, minWidth:0 }}>
                                  <div style={{ fontSize:13, fontWeight:700, color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.person_name}</div>
                                  <div style={{ fontSize:11, color:'#6b7280', marginTop:1 }}>{s.role}</div>
                                </div>
                                <div style={{ display:'flex', gap:4 }}>
                                  <IconBtn icon={Pencil} onClick={() => setStaffModal({ tournamentId:t.id, existing:s })} size={13}/>
                                  <IconBtn icon={Trash2} onClick={() => deleteStaff(s.id)} danger size={13}/>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* Modals */}
      {dateModal && <DateModal initial={dateModal} clients={clients} clientColor={clientColor} onSave={saveDate} onClose={() => setDateModal(null)}/>}
      {albumModal && <AlbumModal initial={albumModal as Tournament} onSave={saveAlbumData} onClose={() => setAlbumModal(null)}/>}
      {tournamentModal && <TournamentModal initial={tournamentModal} onSave={saveTournament} onClose={() => setTournamentModal(null)}/>}
      {staffModal && <StaffModal tournamentId={staffModal.tournamentId} existing={staffModal.existing} onSave={saveStaff} onClose={() => setStaffModal(null)}/>}
    </div>
  )
}

/* ─── Empty State ──────────────────────────────────────────────────── */
function EmptyState({ icon:Icon, label }: { icon:React.ElementType; label:string }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'64px 0', color:'#9ca3af', gap:12 }}>
      <Icon size={36} strokeWidth={1.2}/><span style={{ fontSize:14 }}>{label}</span>
    </div>
  )
}

/* ─── Icon Button ──────────────────────────────────────────────────── */
function IconBtn({ icon:Icon, onClick, danger, size=14 }: { icon:React.ElementType; onClick:()=>void; danger?:boolean; size?:number }) {
  return (
    <button onClick={onClick} style={{ width:28, height:28, borderRadius:7, border:'none', background:danger?'rgba(239,68,68,0.08)':'#f3f4f6', color:danger?'#ef4444':'#6b7280', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all .12s' }}>
      <Icon size={size}/>
    </button>
  )
}

/* ─── Modal: Date ────────────────────────────────────────────────────── */
function DateModal({ initial, clients, clientColor, onSave, onClose }: {
  initial: Partial<ImportantDate>; clients: ClientEntry[]
  clientColor: (id:string|undefined) => string
  onSave: (d:Partial<ImportantDate>) => Promise<void>; onClose: ()=>void
}) {
  const [form, setForm] = useState({
    title:initial.title??'', date:initial.date??today(), description:initial.description??'',
    color:initial.color??'#4f6ef7', priority:initial.priority??'mitjana' as ImportantDate['priority'],
    deadline:initial.deadline??'', client_id:initial.client_id??'', category:initial.category??'', id:initial.id
  })
  const [saving, setSaving] = useState(false)
  const handleSave = async () => { setSaving(true); await onSave({ ...form, deadline:form.deadline||undefined, client_id:form.client_id||undefined, category:form.category||undefined }); setSaving(false) }

  const CATEGORY_SUGGESTIONS = ['Futbol','Bàsquet','Handbol','Waterpolo','Community Manager','Atletisme','Ciclisme','Tennis','Natació','Rugbi','Golf','F1']

  return (
    <Modal title={form.id ? 'Editar data' : 'Nova data important'} onClose={onClose} wide>
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <div>
          <label style={labelStyle}>Títol</label>
          <input style={fieldStyle} value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))} placeholder="Nom de l'event o fita..."/>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div>
            <label style={labelStyle}>Data</label>
            <input type="date" style={fieldStyle} value={form.date} onChange={e => setForm(p=>({...p,date:e.target.value}))}/>
          </div>
          <div>
            <label style={labelStyle}>Llest abans de (opcional)</label>
            <input type="date" style={fieldStyle} value={form.deadline} onChange={e => setForm(p=>({...p,deadline:e.target.value}))}/>
          </div>
        </div>
        <div>
          <label style={labelStyle}>Client</label>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {[{ id:'', name:'Tots els clients' }, ...clients].map((c, i) => {
              const col = c.id ? CLIENT_PALETTE[(i-1) % CLIENT_PALETTE.length] : '#6b7280'
              const active = form.client_id === c.id
              return (
                <button key={c.id||'all'} onClick={() => setForm(p=>({...p,client_id:c.id}))}
                  style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:20, border:`1.5px solid ${active?col:'#e5e7eb'}`, background:active?`${col}14`:'#fff', color:active?col:'#6b7280', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                  <span style={{ width:6, height:6, borderRadius:'50%', background:col, display:'inline-block' }}/>
                  {c.name}
                </button>
              )
            })}
          </div>
        </div>
        <div>
          <label style={labelStyle}>Prioritat</label>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
            {(Object.entries(PRIORITY_CFG) as [string, typeof PRIORITY_CFG.alta][]).map(([k,cfg]) => (
              <button key={k} onClick={() => setForm(p=>({...p,priority:k as ImportantDate['priority']}))}
                style={{ padding:'8px', borderRadius:9, border:`1.5px solid ${form.priority===k?cfg.color:'#e5e7eb'}`, background:form.priority===k?cfg.bg:'#fff', color:form.priority===k?cfg.color:'#6b7280', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                <span style={{ width:7, height:7, borderRadius:'50%', background:cfg.color, display:'inline-block' }}/>{cfg.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label style={labelStyle}>Esport / Categoria (opcional)</label>
          <input style={fieldStyle} value={form.category} onChange={e => setForm(p=>({...p,category:e.target.value}))} placeholder="Ex: Futbol, Bàsquet, Community Manager..."/>
          <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginTop:7 }}>
            {CATEGORY_SUGGESTIONS.map(s => (
              <button key={s} onClick={() => setForm(p=>({...p,category:s}))}
                style={{ padding:'3px 10px', borderRadius:20, border:`1.5px solid ${form.category===s?'#7c3aed':'#e5e7eb'}`, background:form.category===s?'#f5f3ff':'#fff', color:form.category===s?'#7c3aed':'#6b7280', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label style={labelStyle}>Descripció (opcional)</label>
          <textarea style={{ ...fieldStyle, resize:'vertical', minHeight:72 }} value={form.description} onChange={e => setForm(p=>({...p,description:e.target.value}))} placeholder="Idea de peça, context..."/>
        </div>
        <ModalFooter onClose={onClose} onSave={handleSave} saving={saving}/>
      </div>
    </Modal>
  )
}

/* ─── Modal: Album (edita dades d'àlbum d'un Tournament) ─────────────── */
function AlbumModal({ initial, onSave, onClose }: { initial:Tournament; onSave:(t:Partial<Tournament>)=>Promise<void>; onClose:()=>void }) {
  const [form, setForm] = useState({
    album_type: initial.album_type??'both',
    album_price: initial.album_price??'' as number|'',
    sale_start: initial.sale_start??'',
    sale_end: initial.sale_end??'',
    album_notes: initial.album_notes??'',
    album_min: initial.album_min??'' as number|'',
    album_sold: initial.album_sold??'' as number|'',
    id: initial.id,
  })
  const [saving, setSaving] = useState(false)
  const handleSave = async () => {
    setSaving(true)
    await onSave({
      ...form,
      album_price: form.album_price !== '' ? Number(form.album_price) : undefined,
      album_min: form.album_min !== '' ? Number(form.album_min) : undefined,
      album_sold: form.album_sold !== '' ? Number(form.album_sold) : 0,
    })
    setSaving(false)
  }
  return (
    <Modal title={`Àlbum · ${initial.name}`} onClose={onClose}>
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <div>
          <label style={labelStyle}>Tipus d&apos;àlbum</label>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
            {ALBUM_TYPES.map(t => (
              <button key={t.key} onClick={() => setForm(p=>({...p,album_type:t.key}))}
                style={{ padding:'10px 8px', borderRadius:10, border:`1.5px solid ${form.album_type===t.key?'#111827':'#e5e7eb'}`, background:form.album_type===t.key?'#111827':'#fff', color:form.album_type===t.key?'#fff':'#6b7280', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                <t.Icon size={16}/>{t.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ background:'#f8fafc', borderRadius:10, padding:'14px 16px' }}>
          <label style={{ ...labelStyle, marginBottom:10 }}>Dates de venda</label>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div><label style={labelStyle}>Llançament venda</label><input type="date" style={fieldStyle} value={form.sale_start} onChange={e => setForm(p=>({...p,sale_start:e.target.value}))}/></div>
            <div><label style={labelStyle}>Tancament venda</label><input type="date" style={fieldStyle} value={form.sale_end} onChange={e => setForm(p=>({...p,sale_end:e.target.value}))}/></div>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div><label style={labelStyle}>Preu (€, opcional)</label><input type="number" style={fieldStyle} value={form.album_price} onChange={e => setForm(p=>({...p,album_price:e.target.value===''?'':parseFloat(e.target.value)}))} placeholder="0.00" min="0" step="0.01"/></div>
          <div><label style={labelStyle}>Mínim per ser rentable</label><input type="number" style={fieldStyle} value={form.album_min} onChange={e => setForm(p=>({...p,album_min:e.target.value===''?'':parseInt(e.target.value)}))} placeholder="Ex: 50" min="0" step="1"/></div>
        </div>
        <div>
          <label style={labelStyle}>Àlbums venuts fins avui</label>
          <input type="number" style={fieldStyle} value={form.album_sold} onChange={e => setForm(p=>({...p,album_sold:e.target.value===''?'':parseInt(e.target.value)}))} placeholder="0" min="0" step="1"/>
        </div>
        <div><label style={labelStyle}>Notes (opcional)</label><textarea style={{ ...fieldStyle, resize:'vertical', minHeight:64 }} value={form.album_notes} onChange={e => setForm(p=>({...p,album_notes:e.target.value}))} placeholder="Observacions..."/></div>
        <ModalFooter onClose={onClose} onSave={handleSave} saving={saving}/>
      </div>
    </Modal>
  )
}

/* ─── Modal: Tournament ──────────────────────────────────────────────── */
function TournamentModal({ initial, onSave, onClose }: { initial:Partial<Tournament>; onSave:(t:Partial<Tournament>)=>Promise<void>; onClose:()=>void }) {
  const [form, setForm] = useState({ name:initial.name??'', date_start:initial.date_start??today(), date_end:initial.date_end??'', location:initial.location??'', notes:initial.notes??'', id:initial.id, logo_url:initial.logo_url??'' })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !form.id) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('tournamentId', form.id)
    const res = await fetch('/api/tournaments/upload-logo', { method:'POST', body:fd })
    const json = await res.json()
    if (json.url) setForm(p => ({ ...p, logo_url: json.url }))
    setUploading(false)
  }

  const handleSave = async () => { setSaving(true); await onSave(form); setSaving(false) }
  return (
    <Modal title={form.id?'Editar torneig':'Nou torneig'} onClose={onClose}>
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <div><label style={labelStyle}>Nom del torneig</label><input style={fieldStyle} value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} placeholder="Ex: Final Four Asobal..."/></div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div><label style={labelStyle}>Data inici</label><input type="date" style={fieldStyle} value={form.date_start} onChange={e => setForm(p=>({...p,date_start:e.target.value}))}/></div>
          <div><label style={labelStyle}>Data fi (opcional)</label><input type="date" style={fieldStyle} value={form.date_end} onChange={e => setForm(p=>({...p,date_end:e.target.value}))}/></div>
        </div>
        <div><label style={labelStyle}>Ubicació (opcional)</label><input style={fieldStyle} value={form.location} onChange={e => setForm(p=>({...p,location:e.target.value}))} placeholder="Ciutat o recinte..."/></div>
        <div><label style={labelStyle}>Notes (opcional)</label><textarea style={{ ...fieldStyle, resize:'vertical', minHeight:72 }} value={form.notes} onChange={e => setForm(p=>({...p,notes:e.target.value}))} placeholder="Informació addicional..."/></div>

        {/* Logo upload — only available when editing an existing tournament */}
        {form.id && (
          <div>
            <label style={labelStyle}>Logo del torneig</label>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:52, height:52, borderRadius:10, border:'1.5px solid #e5e7eb', background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
                {form.logo_url
                  ? <img src={form.logo_url} alt="" style={{ width:'100%', height:'100%', objectFit:'contain', padding:4 }}/>
                  : <Trophy size={20} color="#9ca3af"/>
                }
              </div>
              <label style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 16px', borderRadius:9, border:'1.5px dashed #d1d5db', background:'transparent', color:'#6b7280', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                <Upload size={14}/>
                {uploading ? 'Pujant...' : form.logo_url ? 'Canviar logo' : 'Pujar logo'}
                <input type="file" accept="image/*" style={{ display:'none' }} onChange={handleLogoChange} disabled={uploading}/>
              </label>
            </div>
          </div>
        )}
        {!form.id && (
          <div style={{ fontSize:12, color:'#9ca3af', background:'#f8fafc', borderRadius:8, padding:'8px 12px' }}>
            Desa el torneig primer per poder pujar el logo.
          </div>
        )}

        <ModalFooter onClose={onClose} onSave={handleSave} saving={saving}/>
      </div>
    </Modal>
  )
}

/* ─── Modal: Staff ───────────────────────────────────────────────────── */
function StaffModal({ tournamentId, existing, onSave, onClose }: { tournamentId:string; existing?:TournamentStaff; onSave:(s:{tournamentId:string;person_name:string;role:string;id?:string})=>Promise<void>; onClose:()=>void }) {
  const [form, setForm] = useState({ person_name:existing?.person_name??'', role:existing?.role??'' })
  const [saving, setSaving] = useState(false)
  const handleSave = async () => { setSaving(true); await onSave({ tournamentId, person_name:form.person_name, role:form.role, id:existing?.id }); setSaving(false) }
  return (
    <Modal title={existing?"Editar persona":"Afegir persona a l'equip"} onClose={onClose}>
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <div><label style={labelStyle}>Nom de la persona</label><input style={fieldStyle} value={form.person_name} onChange={e => setForm(p=>({...p,person_name:e.target.value}))} placeholder="Nom i cognom..."/></div>
        <div><label style={labelStyle}>Funció / Rol</label><input style={fieldStyle} value={form.role} onChange={e => setForm(p=>({...p,role:e.target.value}))} placeholder="Ex: Fotògraf, Càmera, Disseny, Editor..."/></div>
        <ModalFooter onClose={onClose} onSave={handleSave} saving={saving}/>
      </div>
    </Modal>
  )
}

/* ─── Modal Footer ───────────────────────────────────────────────────── */
function ModalFooter({ onClose, onSave, saving }: { onClose:()=>void; onSave:()=>void; saving:boolean }) {
  return (
    <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}>
      <button onClick={onClose} style={{ padding:'9px 20px', borderRadius:9, border:'1.5px solid #e5e7eb', background:'#fff', color:'#374151', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Cancel·lar</button>
      <button onClick={onSave} disabled={saving} style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 20px', borderRadius:9, border:'none', background:saving?'#6b7280':'#111827', color:'#fff', fontSize:13, fontWeight:700, cursor:saving?'not-allowed':'pointer', fontFamily:'inherit' }}>
        {saving ? <><div style={{ width:13, height:13, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', animation:'spin .7s linear infinite' }}/>Guardant...</> : <><Save size={14}/>Guardar</>}
      </button>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
