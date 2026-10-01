'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  CalendarDays, Flag, Disc3, Trophy, Plus, X, Pencil, Trash2,
  MapPin, Users, ChevronDown, ChevronUp, Check, AlertCircle,
  Package, MonitorPlay, BookOpen, UserPlus, Save, CalendarRange,
} from 'lucide-react'

/* ─── Types ─────────────────────────────────────────────────────────── */
interface ImportantDate {
  id: string; title: string; date: string; description?: string; color: string; created_at?: string
}
interface Album {
  id: string; tournament_name: string; date_start: string; date_end?: string
  album_type: 'physical' | 'digital' | 'both'; notes?: string; price?: number; created_at?: string
}
interface Tournament {
  id: string; name: string; date_start: string; date_end?: string
  location?: string; notes?: string; created_at?: string
}
interface TournamentStaff {
  id: string; tournament_id: string; person_name: string; role: string; created_at?: string
}

const DATE_COLORS = [
  { key: '#4f6ef7', label: 'Blau' },
  { key: '#16a34a', label: 'Verd' },
  { key: '#dc2626', label: 'Vermell' },
  { key: '#d97706', label: 'Ambre' },
  { key: '#7c3aed', label: 'Violeta' },
  { key: '#0891b2', label: 'Cian' },
]

const ALBUM_TYPES = [
  { key: 'physical', label: 'Físic',    Icon: Package },
  { key: 'digital',  label: 'Digital',  Icon: MonitorPlay },
  { key: 'both',     label: 'Físic + Digital', Icon: Disc3 },
]

function useSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function formatDate(d: string) {
  if (!d) return ''
  const dt = new Date(d + 'T12:00:00')
  return dt.toLocaleDateString('ca-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

function today() { return new Date().toISOString().split('T')[0] }

/* ─── Shared Modal Wrapper ──────────────────────────────────────────── */
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,14,26,0.55)', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 24px 80px rgba(0,0,0,0.18)', width: '100%', maxWidth: 520, padding: '28px 32px', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>{title}</span>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: '#f3f4f6', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

/* ─── Input / Textarea helpers ──────────────────────────────────────── */
const fieldStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 14, fontFamily: 'inherit', outline: 'none', color: '#111827', background: '#fafafa', boxSizing: 'border-box' }
const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#6b7280', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 5, display: 'block' }

/* ─── Main Component ─────────────────────────────────────────────────── */
export function CalendariContent({
  initialImportantDates, initialAlbums, initialTournaments, initialStaff,
}: {
  initialImportantDates: ImportantDate[]
  initialAlbums: Album[]
  initialTournaments: Tournament[]
  initialStaff: TournamentStaff[]
  currentUserId: string
}) {
  const supabase = useSupabase()
  const [tab, setTab] = useState<'dates' | 'albums' | 'tournaments'>('dates')
  const [dates, setDates] = useState<ImportantDate[]>(initialImportantDates)
  const [albums, setAlbums] = useState<Album[]>(initialAlbums)
  const [tournaments, setTournaments] = useState<Tournament[]>(initialTournaments)
  const [staff, setStaff] = useState<TournamentStaff[]>(initialStaff)
  const [error, setError] = useState<string | null>(null)
  const [expandedTournament, setExpandedTournament] = useState<string | null>(null)

  /* ── Modals ── */
  const [dateModal, setDateModal] = useState<Partial<ImportantDate> | null>(null)
  const [albumModal, setAlbumModal] = useState<Partial<Album> | null>(null)
  const [tournamentModal, setTournamentModal] = useState<Partial<Tournament> | null>(null)
  const [staffModal, setStaffModal] = useState<{ tournamentId: string; existing?: TournamentStaff } | null>(null)

  /* ── Realtime ── */
  useEffect(() => {
    const ch = supabase.channel('calendari-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cal_important_dates' }, () => refresh('dates'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cal_albums' }, () => refresh('albums'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cal_tournaments' }, () => refresh('tournaments'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cal_tournament_staff' }, () => refresh('staff'))
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  const refresh = useCallback(async (table: 'dates' | 'albums' | 'tournaments' | 'staff') => {
    if (table === 'dates') {
      const { data } = await supabase.from('cal_important_dates').select('*').order('date', { ascending: true })
      if (data) setDates(data)
    } else if (table === 'albums') {
      const { data } = await supabase.from('cal_albums').select('*').order('date_start', { ascending: true })
      if (data) setAlbums(data)
    } else if (table === 'tournaments') {
      const { data } = await supabase.from('cal_tournaments').select('*').order('date_start', { ascending: true })
      if (data) setTournaments(data)
    } else {
      const { data } = await supabase.from('cal_tournament_staff').select('*').order('created_at', { ascending: true })
      if (data) setStaff(data)
    }
  }, [supabase])

  /* ── CRUD: Important Dates ── */
  const saveDate = async (d: Partial<ImportantDate>) => {
    if (!d.title || !d.date) return
    setError(null)
    if (d.id) {
      const { error } = await supabase.from('cal_important_dates').update({ title: d.title, date: d.date, description: d.description, color: d.color }).eq('id', d.id)
      if (error) { setError(error.message); return }
    } else {
      const { error } = await supabase.from('cal_important_dates').insert({ title: d.title, date: d.date, description: d.description, color: d.color ?? '#4f6ef7' })
      if (error) { setError(error.message); return }
    }
    setDateModal(null)
    await refresh('dates')
  }

  const deleteDate = async (id: string) => {
    await supabase.from('cal_important_dates').delete().eq('id', id)
    await refresh('dates')
  }

  /* ── CRUD: Albums ── */
  const saveAlbum = async (a: Partial<Album>) => {
    if (!a.tournament_name || !a.date_start) return
    setError(null)
    if (a.id) {
      const { error } = await supabase.from('cal_albums').update({ tournament_name: a.tournament_name, date_start: a.date_start, date_end: a.date_end, album_type: a.album_type, notes: a.notes, price: a.price }).eq('id', a.id)
      if (error) { setError(error.message); return }
    } else {
      const { error } = await supabase.from('cal_albums').insert({ tournament_name: a.tournament_name, date_start: a.date_start, date_end: a.date_end, album_type: a.album_type ?? 'both', notes: a.notes, price: a.price })
      if (error) { setError(error.message); return }
    }
    setAlbumModal(null)
    await refresh('albums')
  }

  const deleteAlbum = async (id: string) => {
    await supabase.from('cal_albums').delete().eq('id', id)
    await refresh('albums')
  }

  /* ── CRUD: Tournaments ── */
  const saveTournament = async (t: Partial<Tournament>) => {
    if (!t.name || !t.date_start) return
    setError(null)
    if (t.id) {
      const { error } = await supabase.from('cal_tournaments').update({ name: t.name, date_start: t.date_start, date_end: t.date_end, location: t.location, notes: t.notes }).eq('id', t.id)
      if (error) { setError(error.message); return }
    } else {
      const { error } = await supabase.from('cal_tournaments').insert({ name: t.name, date_start: t.date_start, date_end: t.date_end, location: t.location, notes: t.notes })
      if (error) { setError(error.message); return }
    }
    setTournamentModal(null)
    await refresh('tournaments')
  }

  const deleteTournament = async (id: string) => {
    await supabase.from('cal_tournament_staff').delete().eq('tournament_id', id)
    await supabase.from('cal_tournaments').delete().eq('id', id)
    await refresh('tournaments')
    await refresh('staff')
  }

  /* ── CRUD: Staff ── */
  const saveStaff = async (s: { tournamentId: string; person_name: string; role: string; id?: string }) => {
    if (!s.person_name || !s.role) return
    setError(null)
    if (s.id) {
      const { error } = await supabase.from('cal_tournament_staff').update({ person_name: s.person_name, role: s.role }).eq('id', s.id)
      if (error) { setError(error.message); return }
    } else {
      const { error } = await supabase.from('cal_tournament_staff').insert({ tournament_id: s.tournamentId, person_name: s.person_name, role: s.role })
      if (error) { setError(error.message); return }
    }
    setStaffModal(null)
    await refresh('staff')
  }

  const deleteStaff = async (id: string) => {
    await supabase.from('cal_tournament_staff').delete().eq('id', id)
    await refresh('staff')
  }

  /* ── Tabs ── */
  const tabs = [
    { key: 'dates',       label: 'Dates importants',  Icon: Flag,         count: dates.length },
    { key: 'albums',      label: "Àlbums",            Icon: Disc3,        count: albums.length },
    { key: 'tournaments', label: 'Tornejos',          Icon: Trophy,       count: tournaments.length },
  ] as const

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1100, margin: '0 auto', fontFamily: 'inherit' }}>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: '#dc2626', fontSize: 14 }}>
          <AlertCircle size={16} /><span>{error}</span>
          <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><X size={14} /></button>
        </div>
      )}

      {/* SQL hint if tables missing */}
      {error?.includes('does not exist') && (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px', marginBottom: 24, fontSize: 12, color: '#475569' }}>
          <strong style={{ display: 'block', marginBottom: 8 }}>Crea les taules a Supabase amb aquest SQL:</strong>
          <pre style={{ background: '#1e293b', color: '#e2e8f0', borderRadius: 8, padding: 16, overflow: 'auto', lineHeight: 1.6 }}>{SQL_HINT}</pre>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 32, background: '#f1f5f9', borderRadius: 12, padding: 4, width: 'fit-content' }}>
        {tabs.map(({ key, label, Icon, count }) => {
          const active = tab === key
          return (
            <button key={key} onClick={() => setTab(key)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: active ? 700 : 500, color: active ? '#111827' : '#6b7280', background: active ? '#fff' : 'transparent', boxShadow: active ? '0 1px 4px rgba(0,0,0,0.10)' : 'none', transition: 'all .15s' }}>
              <Icon size={15} strokeWidth={active ? 2.5 : 2} />
              {label}
              <span style={{ fontSize: 11, fontWeight: 700, background: active ? '#111827' : '#e2e8f0', color: active ? '#fff' : '#6b7280', borderRadius: 20, padding: '1px 7px', minWidth: 20, textAlign: 'center' }}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* ── TAB: Dates importants ─────────────────────────────── */}
      {tab === 'dates' && (
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>Dates importants</h2>
              <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>Esdeveniments, fites i terminis clau de l&apos;organització.</p>
            </div>
            <button onClick={() => setDateModal({ color: '#4f6ef7', date: today() })}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 10, border: 'none', background: '#111827', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              <Plus size={15} />Nova data
            </button>
          </div>

          {dates.length === 0 ? (
            <EmptyState icon={CalendarDays} label="Cap data important registrada" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {dates.map(d => (
                <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#fff', border: '1px solid #f0f0f0', borderRadius: 12, padding: '14px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{d.title}</div>
                    {d.description && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{d.description}</div>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', background: '#f3f4f6', borderRadius: 8, padding: '4px 10px' }}>{formatDate(d.date)}</span>
                    <IconBtn icon={Pencil} onClick={() => setDateModal(d)} />
                    <IconBtn icon={Trash2} onClick={() => deleteDate(d.id)} danger />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── TAB: Àlbums ─────────────────────────────────────── */}
      {tab === 'albums' && (
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>Calendari d&apos;àlbums</h2>
              <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>Tornejos on venem àlbums físics, digitals o ambdós.</p>
            </div>
            <button onClick={() => setAlbumModal({ album_type: 'both', date_start: today() })}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 10, border: 'none', background: '#111827', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              <Plus size={15} />Nou àlbum
            </button>
          </div>

          {albums.length === 0 ? (
            <EmptyState icon={Disc3} label="Cap àlbum registrat" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {albums.map(a => {
                const typeInfo = ALBUM_TYPES.find(t => t.key === a.album_type) ?? ALBUM_TYPES[2]
                return (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#fff', border: '1px solid #f0f0f0', borderRadius: 12, padding: '14px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: '#f8fafc', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <typeInfo.Icon size={18} color="#4b5563" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{a.tournament_name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 3 }}>
                        <span style={{ fontSize: 11, color: '#6b7280' }}>{formatDate(a.date_start)}{a.date_end && a.date_end !== a.date_start ? ` → ${formatDate(a.date_end)}` : ''}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, background: '#f3f4f6', color: '#374151', borderRadius: 6, padding: '2px 8px' }}>{typeInfo.label.toUpperCase()}</span>
                        {a.price && <span style={{ fontSize: 11, color: '#059669', fontWeight: 700 }}>{a.price.toFixed(2)} €</span>}
                      </div>
                      {a.notes && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{a.notes}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <IconBtn icon={Pencil} onClick={() => setAlbumModal(a)} />
                      <IconBtn icon={Trash2} onClick={() => deleteAlbum(a.id)} danger />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* ── TAB: Tornejos ──────────────────────────────────────── */}
      {tab === 'tournaments' && (
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>Calendari de tornejos</h2>
              <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>Tornejos amb l&apos;equip assignat i les funcions de cada persona.</p>
            </div>
            <button onClick={() => setTournamentModal({ date_start: today() })}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 10, border: 'none', background: '#111827', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              <Plus size={15} />Nou torneig
            </button>
          </div>

          {tournaments.length === 0 ? (
            <EmptyState icon={Trophy} label="Cap torneig registrat" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {tournaments.map(t => {
                const tournamentStaff = staff.filter(s => s.tournament_id === t.id)
                const expanded = expandedTournament === t.id
                return (
                  <div key={t.id} style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    {/* Header row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', cursor: 'pointer' }} onClick={() => setExpandedTournament(expanded ? null : t.id)}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Trophy size={18} color="#4b5563" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{t.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 3 }}>
                          <span style={{ fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <CalendarRange size={11} />{formatDate(t.date_start)}{t.date_end && t.date_end !== t.date_start ? ` → ${formatDate(t.date_end)}` : ''}
                          </span>
                          {t.location && (
                            <span style={{ fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <MapPin size={11} />{t.location}
                            </span>
                          )}
                          <span style={{ fontSize: 11, fontWeight: 700, background: '#f3f4f6', color: '#374151', borderRadius: 6, padding: '2px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Users size={10} />{tournamentStaff.length} persones
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={e => e.stopPropagation()}>
                        <IconBtn icon={Pencil} onClick={() => setTournamentModal(t)} />
                        <IconBtn icon={Trash2} onClick={() => deleteTournament(t.id)} danger />
                        <div style={{ width: 1, height: 20, background: '#e5e7eb', margin: '0 2px' }} />
                        <button onClick={() => setExpandedTournament(expanded ? null : t.id)}
                          style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: '#f3f4f6', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded: staff */}
                    {expanded && (
                      <div style={{ borderTop: '1px solid #f0f0f0', padding: '16px 18px' }}>
                        {t.notes && (
                          <div style={{ fontSize: 13, color: '#6b7280', background: '#f8fafc', borderRadius: 8, padding: '10px 14px', marginBottom: 14, lineHeight: 1.5 }}>
                            <BookOpen size={12} style={{ marginRight: 6, verticalAlign: 'middle' }} />{t.notes}
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', letterSpacing: '.05em', textTransform: 'uppercase' }}>Equip assignat</span>
                          <button onClick={() => setStaffModal({ tournamentId: t.id })}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: '1.5px dashed #d1d5db', background: 'transparent', color: '#6b7280', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}>
                            <UserPlus size={13} />Afegir persona
                          </button>
                        </div>
                        {tournamentStaff.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '20px 0', color: '#9ca3af', fontSize: 13 }}>Cap persona assignada</div>
                        ) : (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
                            {tournamentStaff.map(s => (
                              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 12px' }}>
                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13, fontWeight: 700, color: '#4338ca' }}>
                                  {s.person_name.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.person_name}</div>
                                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>{s.role}</div>
                                </div>
                                <div style={{ display: 'flex', gap: 4 }}>
                                  <IconBtn icon={Pencil} onClick={() => setStaffModal({ tournamentId: t.id, existing: s })} size={13} />
                                  <IconBtn icon={Trash2} onClick={() => deleteStaff(s.id)} danger size={13} />
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

      {/* ── MODAL: Date ─── */}
      {dateModal && (
        <DateModal
          initial={dateModal}
          onSave={saveDate}
          onClose={() => setDateModal(null)}
        />
      )}

      {/* ── MODAL: Album ─── */}
      {albumModal && (
        <AlbumModal
          initial={albumModal}
          onSave={saveAlbum}
          onClose={() => setAlbumModal(null)}
        />
      )}

      {/* ── MODAL: Tournament ─── */}
      {tournamentModal && (
        <TournamentModal
          initial={tournamentModal}
          onSave={saveTournament}
          onClose={() => setTournamentModal(null)}
        />
      )}

      {/* ── MODAL: Staff ─── */}
      {staffModal && (
        <StaffModal
          tournamentId={staffModal.tournamentId}
          existing={staffModal.existing}
          onSave={saveStaff}
          onClose={() => setStaffModal(null)}
        />
      )}
    </div>
  )
}

/* ─── Empty State ─────────────────────────────────────────────────────── */
function EmptyState({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', color: '#9ca3af', gap: 12 }}>
      <Icon size={36} strokeWidth={1.2} />
      <span style={{ fontSize: 14 }}>{label}</span>
    </div>
  )
}

/* ─── Icon Button ─────────────────────────────────────────────────────── */
function IconBtn({ icon: Icon, onClick, danger, size = 14 }: { icon: React.ElementType; onClick: () => void; danger?: boolean; size?: number }) {
  return (
    <button onClick={onClick} style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: danger ? 'rgba(239,68,68,0.08)' : '#f3f4f6', color: danger ? '#ef4444' : '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .12s' }}>
      <Icon size={size} />
    </button>
  )
}

/* ─── Modal: Important Date ─────────────────────────────────────────── */
function DateModal({ initial, onSave, onClose }: { initial: Partial<ImportantDate>; onSave: (d: Partial<ImportantDate>) => Promise<void>; onClose: () => void }) {
  const [form, setForm] = useState({ title: initial.title ?? '', date: initial.date ?? today(), description: initial.description ?? '', color: initial.color ?? '#4f6ef7', id: initial.id })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <Modal title={form.id ? 'Editar data' : 'Nova data important'} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={labelStyle}>Títol</label>
          <input style={fieldStyle} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Nom de l'event o fita..." />
        </div>
        <div>
          <label style={labelStyle}>Data</label>
          <input type="date" style={fieldStyle} value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
        </div>
        <div>
          <label style={labelStyle}>Descripció (opcional)</label>
          <textarea style={{ ...fieldStyle, resize: 'vertical', minHeight: 72 }} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Afegeix notes addicionals..." />
        </div>
        <div>
          <label style={labelStyle}>Color</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {DATE_COLORS.map(c => (
              <button key={c.key} onClick={() => setForm(p => ({ ...p, color: c.key }))}
                style={{ width: 28, height: 28, borderRadius: '50%', background: c.key, border: form.color === c.key ? '3px solid #111827' : '3px solid transparent', cursor: 'pointer', transition: 'border .12s' }}
                title={c.label}
              />
            ))}
          </div>
        </div>
        <ModalFooter onClose={onClose} onSave={handleSave} saving={saving} />
      </div>
    </Modal>
  )
}

/* ─── Modal: Album ──────────────────────────────────────────────────── */
function AlbumModal({ initial, onSave, onClose }: { initial: Partial<Album>; onSave: (a: Partial<Album>) => Promise<void>; onClose: () => void }) {
  const [form, setForm] = useState({ tournament_name: initial.tournament_name ?? '', date_start: initial.date_start ?? today(), date_end: initial.date_end ?? '', album_type: initial.album_type ?? 'both' as Album['album_type'], notes: initial.notes ?? '', price: initial.price ?? '' as number | '', id: initial.id })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await onSave({ ...form, price: form.price !== '' ? Number(form.price) : undefined })
    setSaving(false)
  }

  return (
    <Modal title={form.id ? 'Editar àlbum' : 'Nou àlbum'} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={labelStyle}>Nom del torneig</label>
          <input style={fieldStyle} value={form.tournament_name} onChange={e => setForm(p => ({ ...p, tournament_name: e.target.value }))} placeholder="Ex: Copa Asobal 2026..." />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Data inici</label>
            <input type="date" style={fieldStyle} value={form.date_start} onChange={e => setForm(p => ({ ...p, date_start: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Data fi (opcional)</label>
            <input type="date" style={fieldStyle} value={form.date_end} onChange={e => setForm(p => ({ ...p, date_end: e.target.value }))} />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Tipus d&apos;àlbum</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {ALBUM_TYPES.map(t => (
              <button key={t.key} onClick={() => setForm(p => ({ ...p, album_type: t.key as Album['album_type'] }))}
                style={{ padding: '10px 8px', borderRadius: 10, border: `1.5px solid ${form.album_type === t.key ? '#111827' : '#e5e7eb'}`, background: form.album_type === t.key ? '#111827' : '#fff', color: form.album_type === t.key ? '#fff' : '#6b7280', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, transition: 'all .12s' }}>
                <t.Icon size={16} />
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label style={labelStyle}>Preu (€, opcional)</label>
          <input type="number" style={fieldStyle} value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value === '' ? '' : parseFloat(e.target.value) }))} placeholder="0.00" min="0" step="0.01" />
        </div>
        <div>
          <label style={labelStyle}>Notes (opcional)</label>
          <textarea style={{ ...fieldStyle, resize: 'vertical', minHeight: 64 }} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Observacions..." />
        </div>
        <ModalFooter onClose={onClose} onSave={handleSave} saving={saving} />
      </div>
    </Modal>
  )
}

/* ─── Modal: Tournament ─────────────────────────────────────────────── */
function TournamentModal({ initial, onSave, onClose }: { initial: Partial<Tournament>; onSave: (t: Partial<Tournament>) => Promise<void>; onClose: () => void }) {
  const [form, setForm] = useState({ name: initial.name ?? '', date_start: initial.date_start ?? today(), date_end: initial.date_end ?? '', location: initial.location ?? '', notes: initial.notes ?? '', id: initial.id })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => { setSaving(true); await onSave(form); setSaving(false) }

  return (
    <Modal title={form.id ? 'Editar torneig' : 'Nou torneig'} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={labelStyle}>Nom del torneig</label>
          <input style={fieldStyle} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Final Four Asobal..." />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Data inici</label>
            <input type="date" style={fieldStyle} value={form.date_start} onChange={e => setForm(p => ({ ...p, date_start: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Data fi (opcional)</label>
            <input type="date" style={fieldStyle} value={form.date_end} onChange={e => setForm(p => ({ ...p, date_end: e.target.value }))} />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Ubicació (opcional)</label>
          <input style={fieldStyle} value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="Ciutat o recinte..." />
        </div>
        <div>
          <label style={labelStyle}>Notes (opcional)</label>
          <textarea style={{ ...fieldStyle, resize: 'vertical', minHeight: 72 }} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Informació addicional..." />
        </div>
        <ModalFooter onClose={onClose} onSave={handleSave} saving={saving} />
      </div>
    </Modal>
  )
}

/* ─── Modal: Staff ──────────────────────────────────────────────────── */
function StaffModal({ tournamentId, existing, onSave, onClose }: { tournamentId: string; existing?: TournamentStaff; onSave: (s: { tournamentId: string; person_name: string; role: string; id?: string }) => Promise<void>; onClose: () => void }) {
  const [form, setForm] = useState({ person_name: existing?.person_name ?? '', role: existing?.role ?? '' })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await onSave({ tournamentId, person_name: form.person_name, role: form.role, id: existing?.id })
    setSaving(false)
  }

  return (
    <Modal title={existing ? 'Editar persona' : 'Afegir persona a l\'equip'} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={labelStyle}>Nom de la persona</label>
          <input style={fieldStyle} value={form.person_name} onChange={e => setForm(p => ({ ...p, person_name: e.target.value }))} placeholder="Nom i cognom..." />
        </div>
        <div>
          <label style={labelStyle}>Funció / Rol</label>
          <input style={fieldStyle} value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} placeholder="Ex: Fotògraf, Càmera, Disseny, Editor..." />
        </div>
        <ModalFooter onClose={onClose} onSave={handleSave} saving={saving} />
      </div>
    </Modal>
  )
}

/* ─── Modal Footer ───────────────────────────────────────────────────── */
function ModalFooter({ onClose, onSave, saving }: { onClose: () => void; onSave: () => void; saving: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
      <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: 9, border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
        Cancel·lar
      </button>
      <button onClick={onSave} disabled={saving}
        style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 20px', borderRadius: 9, border: 'none', background: saving ? '#6b7280' : '#111827', color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
        {saving ? <><div style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin .7s linear infinite' }} />Guardant...</> : <><Save size={14} />Guardar</>}
      </button>
    </div>
  )
}

const SQL_HINT = `CREATE TABLE IF NOT EXISTS cal_important_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL, date date NOT NULL,
  description text, color text DEFAULT '#4f6ef7',
  created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS cal_albums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_name text NOT NULL, date_start date NOT NULL,
  date_end date, album_type text DEFAULT 'both',
  notes text, price numeric,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS cal_tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, date_start date NOT NULL,
  date_end date, location text, notes text,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS cal_tournament_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid REFERENCES cal_tournaments(id) ON DELETE CASCADE,
  person_name text NOT NULL, role text NOT NULL,
  created_at timestamptz DEFAULT now()
);
-- RLS
ALTER TABLE cal_important_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE cal_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE cal_tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cal_tournament_staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all_access" ON cal_important_dates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_access" ON cal_albums FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_access" ON cal_tournaments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_access" ON cal_tournament_staff FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON cal_important_dates, cal_albums, cal_tournaments, cal_tournament_staff TO anon, authenticated, service_role;`
