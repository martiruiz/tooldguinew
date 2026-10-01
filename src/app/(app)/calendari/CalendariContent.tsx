'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  CalendarDays, Flag, Disc3, Trophy, Plus, X, Pencil, Trash2,
  MapPin, Users, ChevronDown, ChevronUp, Check, AlertCircle,
  Package, MonitorPlay, BookOpen, UserPlus, Save, CalendarRange,
  ArrowRight, Clock,
} from 'lucide-react'

/* ─── Types ─────────────────────────────────────────────────────────── */
interface ImportantDate {
  id: string; title: string; date: string; description?: string; color: string
  priority?: 'alta' | 'mitjana' | 'opcional'; deadline?: string; client_id?: string
  created_at?: string
}
interface Album {
  id: string; tournament_name: string; date_start: string; date_end?: string
  album_type: 'physical' | 'digital' | 'both'; notes?: string; price?: number
}
interface Tournament {
  id: string; name: string; date_start: string; date_end?: string; location?: string; notes?: string
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
  const [albumModal, setAlbumModal] = useState<Partial<Album>|null>(null)
  const [tournamentModal, setTournamentModal] = useState<Partial<Tournament>|null>(null)
  const [staffModal, setStaffModal] = useState<{tournamentId:string; existing?:TournamentStaff}|null>(null)

  /* Dates view filters */
  const [filterClient, setFilterClient] = useState<string|null>(null) // null = all
  const [filterPriority, setFilterPriority] = useState<string|null>(null)

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
    const payload = { title:d.title, date:d.date, description:d.description, color:d.color??'#4f6ef7', priority:d.priority??'mitjana', deadline:d.deadline??null, client_id:d.client_id??null }
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
    const payload = { tournament_name:a.tournament_name, date_start:a.date_start, date_end:a.date_end, album_type:a.album_type??'both', notes:a.notes, price:a.price }
    const { error } = a.id
      ? await supabase.from('cal_albums').update(payload).eq('id', a.id)
      : await supabase.from('cal_albums').insert(payload)
    if (error) { setError(error.message); return }
    setAlbumModal(null); await refresh('albums')
  }
  const deleteAlbum = async (id: string) => {
    await supabase.from('cal_albums').delete().eq('id', id); await refresh('albums')
  }

  /* CRUD: Tournaments */
  const saveTournament = async (t: Partial<Tournament>) => {
    if (!t.name || !t.date_start) return
    setError(null)
    const payload = { name:t.name, date_start:t.date_start, date_end:t.date_end, location:t.location, notes:t.notes }
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
    if (filterClient && d.client_id !== filterClient) return false
    if (filterPriority && d.priority !== filterPriority) return false
    return true
  })

  /* Next upcoming date */
  const todayStr = today()
  const nextDate = filteredDates.find(d => d.date >= todayStr)

  /* Tabs */
  const tabs = [
    { key:'dates',       label:'Dates importants', Icon:Flag,     count:dates.length },
    { key:'albums',      label:'Àlbums',           Icon:Disc3,    count:albums.length },
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
            <div style={{ display:'flex', alignItems:'center', gap:16, background:'#fafafa', border:'1.5px solid #e5e7eb', borderRadius:12, padding:'14px 20px', marginBottom:24 }}>
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
          <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:28, flexWrap:'wrap' }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontSize:12, fontWeight:600, color:'#9ca3af' }}>Client</span>
              {[null, ...clients.map(c => c.id)].map((cid, i) => {
                const col = cid ? CLIENT_PALETTE[(i-1) % CLIENT_PALETTE.length] : '#6b7280'
                const name = cid ? (clients.find(c=>c.id===cid)?.name ?? '') : 'Tots'
                const active = filterClient === cid
                return (
                  <button key={cid??'all'} onClick={() => setFilterClient(active ? null : cid)}
                    style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 12px', borderRadius:20, border:`1.5px solid ${active ? col : '#e5e7eb'}`, background:active ? `${col}14` : '#fff', color:active ? col : '#6b7280', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all .12s', whiteSpace:'nowrap' }}>
                    <span style={{ width:7, height:7, borderRadius:'50%', background:col, display:'inline-block', flexShrink:0 }}/>
                    {name}
                  </button>
                )
              })}
            </div>
            <div style={{ width:1, height:20, background:'#e5e7eb' }}/>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontSize:12, fontWeight:600, color:'#9ca3af' }}>Prioritat</span>
              {(Object.entries(PRIORITY_CFG) as [string, typeof PRIORITY_CFG.alta][]).map(([k, cfg]) => {
                const active = filterPriority === k
                return (
                  <button key={k} onClick={() => setFilterPriority(active ? null : k)}
                    style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 12px', borderRadius:20, border:`1.5px solid ${active ? cfg.color : '#e5e7eb'}`, background:active ? cfg.bg : '#fff', color:active ? cfg.color : '#6b7280', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all .12s' }}>
                    <span style={{ width:7, height:7, borderRadius:'50%', background:cfg.color, display:'inline-block' }}/>
                    {cfg.label}
                  </button>
                )
              })}
            </div>
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
              const hasAny = monthDates.length > 0
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

          {/* List by month */}
          {filteredDates.length === 0 ? (
            <EmptyState icon={CalendarDays} label="Cap data important registrada"/>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:32 }}>
              {CAL_MONTHS.map(({ year, month }) => {
                const monthItems = filteredDates.filter(d => {
                  const [dy, dm] = d.date.split('-').map(Number)
                  return dy === year && dm === month + 1
                })
                if (monthItems.length === 0) return null
                const highCount = monthItems.filter(d => d.priority === 'alta').length
                return (
                  <div key={`list-${year}-${month}`}>
                    <div style={{ display:'flex', alignItems:'center', gap:12, paddingBottom:12, borderBottom:'2px solid #111827', marginBottom:0 }}>
                      <span style={{ fontSize:20, fontWeight:800, color:'#111827', letterSpacing:'-.02em', textTransform:'uppercase' }}>{MONTHS_CA[month]} {year}</span>
                      {highCount > 0 && <span style={{ fontSize:12, color:'#6b7280' }}>{highCount} d&apos;alta prioritat</span>}
                    </div>
                    {monthItems.map((d, idx) => {
                      const dt = new Date(d.date + 'T12:00:00')
                      const dayNum = dt.getDate()
                      const dayName = dt.toLocaleDateString('ca-ES', { weekday:'short' }).toUpperCase().replace('.','')
                      const pCfg = d.priority ? PRIORITY_CFG[d.priority] : PRIORITY_CFG.opcional
                      const cCol = clientColor(d.client_id)
                      const cName = d.client_id ? clientName(d.client_id) : null
                      return (
                        <div key={d.id} style={{ display:'flex', gap:20, padding:'20px 0', borderBottom: idx < monthItems.length-1 ? '1px solid #f0f0f0' : 'none' }}>
                          {/* Day number */}
                          <div style={{ width:52, flexShrink:0, textAlign:'center' }}>
                            <div style={{ fontSize:36, fontWeight:900, color:'#111827', lineHeight:1 }}>{dayNum}</div>
                            <div style={{ fontSize:11, fontWeight:700, color:'#9ca3af', marginTop:2 }}>{dayName}</div>
                          </div>
                          {/* Content */}
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
                          {/* Deadline */}
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
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
            <div>
              <h2 style={{ fontSize:20, fontWeight:700, color:'#111827', margin:0 }}>Calendari d&apos;àlbums</h2>
              <p style={{ fontSize:13, color:'#6b7280', margin:'4px 0 0' }}>Tornejos on venem àlbums físics, digitals o ambdós.</p>
            </div>
            <button onClick={() => setAlbumModal({ album_type:'both', date_start:today() })}
              style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 18px', borderRadius:10, border:'none', background:'#111827', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              <Plus size={15}/>Nou àlbum
            </button>
          </div>
          {albums.length === 0 ? <EmptyState icon={Disc3} label="Cap àlbum registrat"/> : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {albums.map(a => {
                const typeInfo = ALBUM_TYPES.find(t => t.key === a.album_type) ?? ALBUM_TYPES[2]
                return (
                  <div key={a.id} style={{ display:'flex', alignItems:'center', gap:16, background:'#fff', border:'1px solid #f0f0f0', borderRadius:12, padding:'14px 18px', boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
                    <div style={{ width:38, height:38, borderRadius:10, background:'#f8fafc', border:'1px solid #e5e7eb', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <typeInfo.Icon size={18} color="#4b5563"/>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:14, fontWeight:700, color:'#111827' }}>{a.tournament_name}</div>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:3 }}>
                        <span style={{ fontSize:11, color:'#6b7280' }}>{formatDate(a.date_start)}{a.date_end && a.date_end !== a.date_start ? ` → ${formatDate(a.date_end)}` : ''}</span>
                        <span style={{ fontSize:11, fontWeight:700, background:'#f3f4f6', color:'#374151', borderRadius:6, padding:'2px 8px' }}>{typeInfo.label.toUpperCase()}</span>
                        {a.price && <span style={{ fontSize:11, color:'#059669', fontWeight:700 }}>{a.price.toFixed(2)} €</span>}
                      </div>
                      {a.notes && <div style={{ fontSize:12, color:'#9ca3af', marginTop:2 }}>{a.notes}</div>}
                    </div>
                    <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                      <IconBtn icon={Pencil} onClick={() => setAlbumModal(a)}/>
                      <IconBtn icon={Trash2} onClick={() => deleteAlbum(a.id)} danger/>
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
                      <div style={{ width:40, height:40, borderRadius:10, background:'linear-gradient(135deg,#f8fafc,#f1f5f9)', border:'1px solid #e5e7eb', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <Trophy size={18} color="#4b5563"/>
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
      {albumModal && <AlbumModal initial={albumModal} onSave={saveAlbum} onClose={() => setAlbumModal(null)}/>}
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
    deadline:initial.deadline??'', client_id:initial.client_id??'', id:initial.id
  })
  const [saving, setSaving] = useState(false)
  const handleSave = async () => { setSaving(true); await onSave({ ...form, deadline:form.deadline||undefined, client_id:form.client_id||undefined }); setSaving(false) }

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
          <label style={labelStyle}>Descripció (opcional)</label>
          <textarea style={{ ...fieldStyle, resize:'vertical', minHeight:72 }} value={form.description} onChange={e => setForm(p=>({...p,description:e.target.value}))} placeholder="Idea de peça, context..."/>
        </div>
        <ModalFooter onClose={onClose} onSave={handleSave} saving={saving}/>
      </div>
    </Modal>
  )
}

/* ─── Modal: Album ───────────────────────────────────────────────────── */
function AlbumModal({ initial, onSave, onClose }: { initial:Partial<Album>; onSave:(a:Partial<Album>)=>Promise<void>; onClose:()=>void }) {
  const [form, setForm] = useState({ tournament_name:initial.tournament_name??'', date_start:initial.date_start??today(), date_end:initial.date_end??'', album_type:initial.album_type??'both' as Album['album_type'], notes:initial.notes??'', price:initial.price??'' as number|'', id:initial.id })
  const [saving, setSaving] = useState(false)
  const handleSave = async () => { setSaving(true); await onSave({ ...form, price:form.price!==''?Number(form.price):undefined }); setSaving(false) }
  return (
    <Modal title={form.id?'Editar àlbum':'Nou àlbum'} onClose={onClose}>
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <div>
          <label style={labelStyle}>Nom del torneig</label>
          <input style={fieldStyle} value={form.tournament_name} onChange={e => setForm(p=>({...p,tournament_name:e.target.value}))} placeholder="Ex: Copa Asobal 2026..."/>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div><label style={labelStyle}>Data inici</label><input type="date" style={fieldStyle} value={form.date_start} onChange={e => setForm(p=>({...p,date_start:e.target.value}))}/></div>
          <div><label style={labelStyle}>Data fi (opcional)</label><input type="date" style={fieldStyle} value={form.date_end} onChange={e => setForm(p=>({...p,date_end:e.target.value}))}/></div>
        </div>
        <div>
          <label style={labelStyle}>Tipus d&apos;àlbum</label>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
            {ALBUM_TYPES.map(t => (
              <button key={t.key} onClick={() => setForm(p=>({...p,album_type:t.key as Album['album_type']}))}
                style={{ padding:'10px 8px', borderRadius:10, border:`1.5px solid ${form.album_type===t.key?'#111827':'#e5e7eb'}`, background:form.album_type===t.key?'#111827':'#fff', color:form.album_type===t.key?'#fff':'#6b7280', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                <t.Icon size={16}/>{t.label}
              </button>
            ))}
          </div>
        </div>
        <div><label style={labelStyle}>Preu (€, opcional)</label><input type="number" style={fieldStyle} value={form.price} onChange={e => setForm(p=>({...p,price:e.target.value===''?'':parseFloat(e.target.value)}))} placeholder="0.00" min="0" step="0.01"/></div>
        <div><label style={labelStyle}>Notes (opcional)</label><textarea style={{ ...fieldStyle, resize:'vertical', minHeight:64 }} value={form.notes} onChange={e => setForm(p=>({...p,notes:e.target.value}))} placeholder="Observacions..."/></div>
        <ModalFooter onClose={onClose} onSave={handleSave} saving={saving}/>
      </div>
    </Modal>
  )
}

/* ─── Modal: Tournament ──────────────────────────────────────────────── */
function TournamentModal({ initial, onSave, onClose }: { initial:Partial<Tournament>; onSave:(t:Partial<Tournament>)=>Promise<void>; onClose:()=>void }) {
  const [form, setForm] = useState({ name:initial.name??'', date_start:initial.date_start??today(), date_end:initial.date_end??'', location:initial.location??'', notes:initial.notes??'', id:initial.id })
  const [saving, setSaving] = useState(false)
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
