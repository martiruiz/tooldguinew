'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, X, ChevronLeft, ChevronRight, Camera, Video, FileText,
  Image, Mic, Loader2, Trash2, Clock, Pencil,
} from 'lucide-react'
import { DateInput } from '@/components/ui/DateInput'

const SESSION_TYPES = [
  { value: 'foto', label: 'Foto', icon: Camera, color: '#254067' },
  { value: 'video', label: 'Vídeo', icon: Video, color: '#3a6fa8' },
  { value: 'reels', label: 'Reels', icon: Video, color: '#EC4899' },
  { value: 'stories', label: 'Stories', icon: Image, color: '#F59E0B' },
  { value: 'copy', label: 'Copy', icon: FileText, color: '#10B981' },
  { value: 'podcast', label: 'Podcast', icon: Mic, color: '#EF4444' },
  { value: 'altre', label: 'Altre', icon: FileText, color: '#6B7280' },
]

interface Client { id: string; name: string }

interface Session {
  id: string
  client_id: string
  session_date: string
  session_types: string[]
  hours: number
  notes: string | null
  start_time?: string | null
  end_time?: string | null
  previa_pdf_url?: string | null
  previa_pdf_name?: string | null
  durant_notes?: string | null
  post_material_url?: string | null
  post_material_name?: string | null
  created_by: string
  created_at: string
  client?: { id: string; name: string }
}

interface Props {
  sessions: Session[]
  clients: Client[]
  currentUserId: string
}

const MONTHS_CA = ['Gener', 'Febrer', 'Març', 'Abril', 'Maig', 'Juny', 'Juliol', 'Agost', 'Setembre', 'Octubre', 'Novembre', 'Desembre']

export function CheckContent({ sessions: initialSessions, clients, currentUserId }: Props) {
  const router = useRouter()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [filterClient, setFilterClient] = useState('all')
  const [sessions, setSessions] = useState<Session[]>(initialSessions)
  const [showAdd, setShowAdd] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [form, setForm] = useState({
    client_id: '',
    session_date: '',
    session_types: [] as string[],
    notes: '',
    start_time: '',
    end_time: '',
  })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [editingHoursClient, setEditingHoursClient] = useState<string | null>(null)
  const [editingHoursValue, setEditingHoursValue] = useState('')
  const [savingHours, setSavingHours] = useState(false)
  const [editingSessionsClient, setEditingSessionsClient] = useState<string | null>(null)
  const [editingSessionsValue, setEditingSessionsValue] = useState('')
  const [savingSessions, setSavingSessions] = useState(false)
  const [editSession, setEditSession] = useState<Session | null>(null)
  const [editForm, setEditForm] = useState({
    client_id: '', session_date: '', session_types: [] as string[], notes: '', start_time: '', end_time: '',
  })


  const HOURS_PER_SESSION = 4

  const saveClientSessions = async (clientId: string, newCount: number) => {
    const clamped = Math.max(0, Math.min(10, newCount))
    const clientSessions = monthSessions.filter(s => s.client_id === clientId)
    const currentCount = clientSessions.length
    setSavingSessions(true)
    const now = new Date()
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    try {
      if (clamped > currentCount) {
        const diff = clamped - currentCount
        // update existing sessions to 4h each
        const updateResults = await Promise.all(
          clientSessions.map(s =>
            fetch(`/api/check/sessions/${s.id}`, {
              method: 'PATCH', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ hours: HOURS_PER_SESSION }),
            }).then(r => r.json())
          )
        )
        // create new sessions
        const createResults = await Promise.all(
          Array.from({ length: diff }, () =>
            fetch('/api/check/sessions', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ client_id: clientId, session_date: dateStr, session_types: [], notes: '', start_time: '', end_time: '' }),
            }).then(r => r.json()).then(j => j.session)
          )
        )
        setSessions(prev => {
          let updated = prev.map(s => {
            const r = updateResults.find(r => r.session?.id === s.id)
            return r?.session ? r.session as Session : s
          })
          const newSessions = createResults.filter(Boolean) as Session[]
          // patch newly created sessions to 4h
          newSessions.forEach(ns => { ns.hours = HOURS_PER_SESSION })
          return [...updated, ...newSessions]
        })
      } else if (clamped < currentCount) {
        // delete the most recent sessions first
        const toDelete = [...clientSessions]
          .sort((a, b) => b.created_at.localeCompare(a.created_at))
          .slice(0, currentCount - clamped)
        await Promise.all(toDelete.map(s =>
          fetch(`/api/check/sessions/${s.id}`, { method: 'DELETE' })
        ))
        const deletedIds = new Set(toDelete.map(s => s.id))
        if (clamped === 0) {
          // 0 sessions = no longer a client; mark inactive
          await fetch(`/api/clients/${clientId}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'inactive' }),
          })
          setSessions(prev => prev.filter(s => !deletedIds.has(s.id)))
        } else {
          // update remaining sessions to 4h
          const remaining = clientSessions.filter(s => !deletedIds.has(s.id))
          const updateResults = await Promise.all(
            remaining.map(s =>
              fetch(`/api/check/sessions/${s.id}`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hours: HOURS_PER_SESSION }),
              }).then(r => r.json())
            )
          )
          setSessions(prev => {
            let filtered = prev.filter(s => !deletedIds.has(s.id))
            return filtered.map(s => {
              const r = updateResults.find(r => r.session?.id === s.id)
              return r?.session ? r.session as Session : s
            })
          })
        }
      } else {
        // same count, just update hours to 4h each
        const results = await Promise.all(
          clientSessions.map(s =>
            fetch(`/api/check/sessions/${s.id}`, {
              method: 'PATCH', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ hours: HOURS_PER_SESSION }),
            }).then(r => r.json())
          )
        )
        setSessions(prev => prev.map(s => {
          const r = results.find(r => r.session?.id === s.id)
          return r?.session ? r.session as Session : s
        }))
      }
    } finally {
      setSavingSessions(false)
      setEditingSessionsClient(null)
    }
  }

  const saveClientHours = async (clientId: string, newTotal: number) => {
    const clientSessions = monthSessions.filter(s => s.client_id === clientId)
    if (clientSessions.length === 0) return
    setSavingHours(true)
    const perSession = Math.round((newTotal / clientSessions.length) * 10) / 10
    try {
      const results = await Promise.all(
        clientSessions.map(s =>
          fetch(`/api/check/sessions/${s.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hours: perSession }),
          }).then(r => r.json())
        )
      )
      setSessions(prev => prev.map(s => {
        const updated = results.find(r => r.session?.id === s.id)
        return updated?.session ? updated.session as Session : s
      }))
    } finally {
      setSavingHours(false)
      setEditingHoursClient(null)
    }
  }

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const toggleType = (val: string) => {
    setForm(f => ({
      ...f,
      session_types: f.session_types.includes(val)
        ? f.session_types.filter(t => t !== val)
        : [...f.session_types, val],
    }))
  }

  const monthSessions = useMemo(() => {
    return sessions.filter(s => {
      const d = new Date(s.session_date)
      const matchMonth = d.getFullYear() === year && d.getMonth() === month
      const matchClient = filterClient === 'all' || s.client_id === filterClient
      return matchMonth && matchClient
    })
  }, [sessions, year, month, filterClient])

  const stats = useMemo(() => {
    const totalSessions = monthSessions.length
    const totalHours = monthSessions.reduce((a, s) => a + (s.hours || 0), 0)
    const byClient: Record<string, { name: string; count: number; hours: number }> = {}
    monthSessions.forEach(s => {
      const cname = s.client?.name || '—'
      if (!byClient[s.client_id]) byClient[s.client_id] = { name: cname, count: 0, hours: 0 }
      byClient[s.client_id].count++
      byClient[s.client_id].hours += s.hours || 0
    })
    const byType: Record<string, number> = {}
    monthSessions.forEach(s => {
      const types = Array.isArray(s.session_types) ? s.session_types : []
      types.forEach(t => { byType[t] = (byType[t] || 0) + 1 })
    })
    return { totalSessions, totalHours, byClient, byType }
  }, [monthSessions])

  const grouped = useMemo(() => {
    const map: Record<string, Session[]> = {}
    monthSessions.forEach(s => {
      if (!map[s.session_date]) map[s.session_date] = []
      map[s.session_date].push(s)
    })
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]))
  }, [monthSessions])

  const handleAdd = async () => {
    if (!form.client_id || !form.session_date) {
      setSaveError('Selecciona un client i una data.')
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch('/api/check/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form }),
      })
      const json = await res.json()
      if (json.error) { setSaveError(json.error); return }
      if (json.session) {
        router.push(`/check/${json.session.id}`)
      }
    } finally { setSaving(false) }
  }

  const openEdit = (session: Session) => {
    setEditSession(session)
    setEditForm({
      client_id: session.client_id,
      session_date: session.session_date,
      session_types: Array.isArray(session.session_types) ? session.session_types : [],
      notes: session.notes || '',
      start_time: session.start_time || '',
      end_time: session.end_time || '',
    })
    setSaveError(null)
  }

  const handleEdit = async () => {
    if (!editSession) return
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch(`/api/check/sessions/${editSession.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      const json = await res.json()
      if (json.error) { setSaveError(json.error); return }
      if (json.session) {
        setSessions(prev => prev.map(s => s.id === editSession.id ? json.session as Session : s))
        setEditSession(null)
      }
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    setDeleteError(null)
    try {
      const res = await fetch(`/api/check/sessions/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.error) { setDeleteError(json.error); return }
      setSessions(prev => prev.filter(s => s.id !== id))
    } catch { setDeleteError('Error de connexió') }
    finally { setDeleting(null) }
  }

  const getTypeInfo = (val: string) => SESSION_TYPES.find(t => t.value === val) || SESSION_TYPES[SESSION_TYPES.length - 1]

  const fmtDate = (iso: string) => {
    const d = new Date(iso + 'T12:00:00')
    return d.toLocaleDateString('ca-ES', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  return (
    <div className="check-page">
      {deleteError && (
        <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '10px 16px', borderRadius: 8, margin: '0 0 12px', fontSize: 13 }}>
          Error en esborrar la sessió: {deleteError}
        </div>
      )}
      {/* Top bar */}
      <div className="check-header">
        <div className="month-nav">
          <button className="nav-btn" onClick={prevMonth}><ChevronLeft size={16} /></button>
          <span className="month-label">{MONTHS_CA[month]} {year}</span>
          <button className="nav-btn" onClick={nextMonth}><ChevronRight size={16} /></button>
        </div>
        <button className="btn-add" onClick={() => { setForm(f => ({ ...f, client_id: filterClient !== 'all' ? filterClient : '' })); setShowAdd(true) }}>
          <Plus size={14} />
          Nova sessió
        </button>
      </div>

      {/* Two-column layout */}
      <div className="check-body">
        {/* Left: session list */}
        <div className="sessions-col">
          {grouped.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <div className="empty-title">Cap sessió registrada</div>
              <div className="empty-sub">Afegeix la primera sessió d&apos;aquest mes.</div>
              <button className="btn-add" onClick={() => setShowAdd(true)}><Plus size={14} /> Nova sessió</button>
            </div>
          ) : (
            grouped.map(([date, daySessions]) => (
              <div key={date} className="day-group">
                <div className="day-header">{fmtDate(date)}</div>
                <div className="day-sessions">
                  {daySessions.map(session => {
                    const types = Array.isArray(session.session_types) ? session.session_types : []
                    return (
                      <div key={session.id} className="session-row" onClick={() => router.push(`/check/${session.id}`)}>
                        <div className="session-main">
                          <div className="session-client-name">{session.client?.name || '—'}</div>
                          <div className="session-types-wrap">
                            {types.length === 0
                              ? <span className="session-no-types">Sense complements</span>
                              : types.map(t => {
                                const ti = getTypeInfo(t)
                                return (
                                  <span key={t} className="session-type-chip" style={{ background: ti.color + '18', color: ti.color }}>
                                    <ti.icon size={11} />
                                    {ti.label}
                                  </span>
                                )
                              })
                            }
                          </div>
                          {session.notes && <div className="session-notes">{session.notes}</div>}
                        </div>
                        <div className="session-meta">
                          {session.start_time && (
                            <div className="session-time"><Clock size={11} /> {session.start_time.slice(0,5)}{session.end_time ? `–${session.end_time.slice(0,5)}` : ''}</div>
                          )}
                          {session.hours > 0 && <div className="session-hours-badge">{session.hours}h</div>}
                        </div>
                        <div className="session-actions">
                          <button className="session-edit" onClick={e => { e.stopPropagation(); openEdit(session) }} title="Editar"><Pencil size={13} /></button>
                          <button className="session-del" onClick={e => { e.stopPropagation(); handleDelete(session.id) }} disabled={deleting === session.id} title="Eliminar">
                            {deleting === session.id ? <Loader2 size={13} className="spin" /> : <Trash2 size={13} />}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right: sticky stats panel */}
        <aside className="stats-panel">
          {/* Client filter */}
          <select className="panel-filter" value={filterClient} onChange={e => setFilterClient(e.target.value)}>
            <option value="all">Tots els clients</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          {/* Totals */}
          <div className="panel-totals">
            <div className="panel-kpi">
              <span className="panel-kpi-value">{stats.totalSessions}</span>
              <span className="panel-kpi-label">sessions</span>
            </div>
            <div className="panel-kpi-divider" />
            <div className="panel-kpi">
              <span className="panel-kpi-value">{stats.totalHours.toFixed(1)}<span className="panel-kpi-unit">h</span></span>
              <span className="panel-kpi-label">hores</span>
            </div>
          </div>

          {/* Per client */}
          {Object.entries(stats.byClient).length > 0 && (
            <div className="panel-section">
              <div className="panel-section-title">Per client</div>
              {Object.entries(stats.byClient).sort((a, b) => b[1].count - a[1].count).map(([clientId, c]) => (
                <div key={clientId} className={`panel-client-row${filterClient === clientId ? ' panel-client-row--active' : ''}`}>
                  <button className="panel-client-name" onClick={() => router.push(`/clients/${clientId}`)} title="Veure client">
                    {c.name}
                  </button>
                  <div className="panel-client-stats">
                    {editingSessionsClient === clientId ? (
                      <span className="hours-edit-wrap" onClick={e => e.stopPropagation()}>
                        <input
                          className="hours-inline-input"
                          type="number" min="0" max="10" step="1"
                          value={editingSessionsValue}
                          autoFocus
                          onChange={e => setEditingSessionsValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') saveClientSessions(clientId, parseInt(editingSessionsValue) || c.count)
                            if (e.key === 'Escape') setEditingSessionsClient(null)
                          }}
                        />
                        <button className="hours-save-btn" disabled={savingSessions} onClick={() => saveClientSessions(clientId, parseInt(editingSessionsValue) || c.count)}>✓</button>
                      </span>
                    ) : (
                      <button
                        className="panel-stat-btn"
                        onClick={() => { setEditingSessionsClient(clientId); setEditingSessionsValue(String(c.count)) }}
                        title="Editar sessions (màx 10)"
                      >
                        {c.count}<span className="panel-stat-unit">s</span>
                      </button>
                    )}
                    <span className="panel-hours-display">
                      {(c.count * HOURS_PER_SESSION)}<span className="panel-stat-unit">h</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Per complement */}
          {Object.entries(stats.byType).length > 0 && (
            <div className="panel-section">
              <div className="panel-section-title">Per complement</div>
              {Object.entries(stats.byType).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
                const ti = getTypeInfo(type)
                const pct = stats.totalSessions > 0 ? Math.round((count / stats.totalSessions) * 100) : 0
                return (
                  <div key={type} className="panel-type-row">
                    <span className="panel-type-dot" style={{ background: ti.color }} />
                    <span className="panel-type-label">{ti.label}</span>
                    <div className="panel-type-bar">
                      <div className="panel-type-fill" style={{ width: `${pct}%`, background: ti.color + 'CC' }} />
                    </div>
                    <span className="panel-type-count">{count}</span>
                  </div>
                )
              })}
            </div>
          )}
        </aside>
      </div>

      {/* Add modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2>Nova sessió de contingut</h2>
              <button className="close-btn" onClick={() => setShowAdd(false)}><X size={15} /></button>
            </div>
            <div className="modal-body">
              <div className="form-field">
                <label>Client *</label>
                <select value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))} className="form-select">
                  <option value="">Selecciona client...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label>Data *</label>
                  <DateInput value={form.session_date} onChange={e => setForm(f => ({ ...f, session_date: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label>Hora inici</label>
                  <input type="time" className="form-input" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label>Hora fi</label>
                  <input type="time" className="form-input" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} />
                </div>
              </div>
              <div className="form-field">
                <label>Complements de la sessió</label>
                <div className="type-grid">
                  {SESSION_TYPES.map(t => {
                    const active = form.session_types.includes(t.value)
                    return (
                      <button
                        key={t.value}
                        type="button"
                        className={`type-btn${active ? ' type-btn--active' : ''}`}
                        style={active ? { background: t.color + '20', borderColor: t.color, color: t.color } : {}}
                        onClick={() => toggleType(t.value)}
                      >
                        <t.icon size={14} />
                        {t.label}
                      </button>
                    )
                  })}
                </div>
                {form.session_types.length > 0 && (
                  <div className="selected-hint">{form.session_types.length} seleccionat{form.session_types.length > 1 ? 's' : ''}</div>
                )}
              </div>
              <div className="form-field">
                <label>Notes</label>
                <textarea className="form-textarea" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Observacions..." />
              </div>
            </div>
            {saveError && <div className="save-error">{saveError}</div>}
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowAdd(false)}>Cancel·lar</button>
              <button className="btn-confirm" onClick={handleAdd} disabled={saving}>
                {saving ? <Loader2 size={13} className="spin" /> : <Plus size={13} />}
                Registrar sessió
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editSession && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setEditSession(null)}>
          <div className="modal">
            <div className="modal-header">
              <h2>Editar sessió</h2>
              <button className="close-btn" onClick={() => setEditSession(null)}><X size={15} /></button>
            </div>
            <div className="modal-body">
              <div className="form-field">
                <label>Client *</label>
                <select value={editForm.client_id} onChange={e => setEditForm(f => ({ ...f, client_id: e.target.value }))} className="form-select">
                  <option value="">Selecciona client...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label>Data *</label>
                  <DateInput value={editForm.session_date} onChange={e => setEditForm(f => ({ ...f, session_date: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label>Hora inici</label>
                  <input type="time" className="form-input" value={editForm.start_time} onChange={e => setEditForm(f => ({ ...f, start_time: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label>Hora fi</label>
                  <input type="time" className="form-input" value={editForm.end_time} onChange={e => setEditForm(f => ({ ...f, end_time: e.target.value }))} />
                </div>
              </div>
              <div className="form-field">
                <label>Complements de la sessió</label>
                <div className="type-grid">
                  {SESSION_TYPES.map(t => {
                    const active = editForm.session_types.includes(t.value)
                    return (
                      <button
                        key={t.value}
                        type="button"
                        className={`type-btn${active ? ' type-btn--active' : ''}`}
                        style={active ? { background: t.color + '20', borderColor: t.color, color: t.color } : {}}
                        onClick={() => setEditForm(f => ({
                          ...f,
                          session_types: f.session_types.includes(t.value)
                            ? f.session_types.filter(x => x !== t.value)
                            : [...f.session_types, t.value],
                        }))}
                      >
                        <t.icon size={14} />
                        {t.label}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="form-field">
                <label>Notes</label>
                <textarea className="form-textarea" rows={2} value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} placeholder="Observacions..." />
              </div>
            </div>
            {saveError && <div className="save-error">{saveError}</div>}
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setEditSession(null)}>Cancel·lar</button>
              <button className="btn-confirm" onClick={handleEdit} disabled={saving}>
                {saving ? <Loader2 size={13} className="spin" /> : null}
                Desar canvis
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        /* ── Page shell ── */
        .check-page {
          flex: 1; overflow-y: auto; overflow-x: hidden;
          display: flex; flex-direction: column;
          padding: 20px 24px 40px; gap: 16px;
          background: #F7F8FA;
        }

        /* ── Header ── */
        .check-header {
          display: flex; align-items: center; gap: 12px;
          flex-shrink: 0;
        }
        .month-nav { display: flex; align-items: center; gap: 6px; }
        .nav-btn {
          width: 32px; height: 32px; border: 1px solid #E4E8EF; background: white; border-radius: 8px;
          cursor: pointer; display: flex; align-items: center; justify-content: center; color: #5C6B80;
          transition: all 0.15s;
        }
        .nav-btn:hover { background: #F0F5FF; color: #1B2B4B; border-color: #C5D3E8; }
        .month-label { font-size: 16px; font-weight: 700; color: #0a0a0a; min-width: 154px; text-align: center; }

        .btn-add {
          display: flex; align-items: center; gap: 6px; margin-left: auto;
          height: 36px; padding: 0 16px;
          background: #1B2B4B; color: white; border: none; border-radius: 9px;
          font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit;
          transition: background 0.15s; white-space: nowrap;
        }
        .btn-add:hover { background: #254067; }

        /* ── Two-column body ── */
        .check-body {
          display: grid;
          grid-template-columns: 1fr 260px;
          gap: 16px;
          align-items: start;
          flex: 1;
        }
        @media (max-width: 900px) {
          .check-body { grid-template-columns: 1fr; }
          .stats-panel { position: static; }
          .check-page { padding: 14px 14px 80px; }
        }

        /* ── Session list ── */
        .sessions-col { display: flex; flex-direction: column; gap: 18px; }

        .day-header {
          font-size: 11px; font-weight: 700; color: #9A9A9A;
          text-transform: uppercase; letter-spacing: 0.07em;
          margin-bottom: 8px; padding-bottom: 7px; border-bottom: 1px solid #EAECF0;
        }
        .day-sessions { display: flex; flex-direction: column; gap: 6px; }

        .session-row {
          display: flex; align-items: center; gap: 12px; cursor: pointer;
          background: white; border: 1px solid #EAECF0; border-radius: 12px;
          padding: 12px 14px;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .session-row:hover { border-color: #C5D3E8; box-shadow: 0 2px 12px rgba(27,43,75,0.08); }

        .session-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
        .session-client-name { font-size: 14px; font-weight: 700; color: #0a0a0a; }
        .session-types-wrap { display: flex; flex-wrap: wrap; gap: 4px; }
        .session-type-chip {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 20px; white-space: nowrap;
        }
        .session-no-types { font-size: 11.5px; color: #C0C0C0; }
        .session-notes { font-size: 12px; color: #9A9A9A; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        .session-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
        .session-time { display: flex; align-items: center; gap: 3px; font-size: 11px; color: #8A96A8; }
        .session-hours-badge {
          font-size: 12px; font-weight: 700; color: #1B2B4B;
          background: #EFF5FF; border-radius: 6px; padding: 2px 7px;
        }

        .session-actions { display: flex; gap: 3px; flex-shrink: 0; }
        .session-edit, .session-del {
          width: 28px; height: 28px; border: none; background: transparent;
          border-radius: 7px; cursor: pointer; display: flex; align-items: center;
          justify-content: center; color: #C0C0C0; transition: all 0.15s;
        }
        .session-edit:hover { background: #EFF6FF; color: #1B2B4B; }
        .session-del:hover { background: #FEF2F2; color: #DC2626; }
        .session-del:disabled { opacity: 0.4; cursor: default; }

        /* ── Stats panel ── */
        .stats-panel {
          position: sticky; top: 20px;
          background: white; border: 1px solid #EAECF0; border-radius: 14px;
          padding: 16px; display: flex; flex-direction: column; gap: 16px;
        }

        .panel-filter {
          width: 100%; height: 34px; padding: 0 10px;
          border: 1px solid #E4E8EF; border-radius: 8px;
          font-size: 13px; color: #0a0a0a; background: #FAFBFC;
          font-family: inherit; cursor: pointer; outline: none;
        }
        .panel-filter:focus { border-color: #1B2B4B60; }

        .panel-totals {
          display: flex; align-items: center; gap: 0;
          background: #F4F7FB; border-radius: 10px; overflow: hidden;
        }
        .panel-kpi {
          flex: 1; display: flex; flex-direction: column; align-items: center; padding: 12px 8px;
        }
        .panel-kpi-divider { width: 1px; background: #E4E8EF; align-self: stretch; }
        .panel-kpi-value { font-size: 22px; font-weight: 800; color: #0a0a0a; letter-spacing: -0.02em; line-height: 1; }
        .panel-kpi-unit { font-size: 14px; font-weight: 600; color: #5C6B80; }
        .panel-kpi-label { font-size: 10px; font-weight: 600; color: #9A9A9A; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 3px; }

        .panel-section { display: flex; flex-direction: column; gap: 3px; }
        .panel-section-title {
          font-size: 10px; font-weight: 800; color: #B0B8C8;
          text-transform: uppercase; letter-spacing: 0.08em;
          margin-bottom: 5px;
        }

        /* Per client */
        .panel-client-row {
          display: flex; align-items: center; gap: 6px;
          padding: 5px 6px; border-radius: 8px; border: 1px solid transparent;
          transition: all 0.12s;
        }
        .panel-client-row:hover { background: #F5F8FF; border-color: #DDE5F5; }
        .panel-client-row--active { background: #EEF4FF; border-color: #C5D3E8; }

        .panel-client-name {
          flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          font-size: 12.5px; font-weight: 600; color: #1B2B4B;
          background: none; border: none; padding: 0; cursor: pointer; text-align: left; font-family: inherit;
        }
        .panel-client-name:hover { text-decoration: underline; color: #4A82C6; }

        .panel-client-stats { display: flex; gap: 4px; flex-shrink: 0; }
        .panel-stat-btn {
          display: inline-flex; align-items: baseline; gap: 1px;
          font-size: 12px; font-weight: 700; color: #5C6B80;
          background: none; border: 1px solid transparent; border-radius: 5px;
          padding: 1px 5px; cursor: pointer; font-family: inherit; transition: all 0.12s;
        }
        .panel-stat-btn:hover { background: #EEF4FF; border-color: #C5D3E8; color: #1B2B4B; }
        .panel-stat-btn--hours { color: #7A9AC0; }
        .panel-hours-display {
          display: inline-flex; align-items: baseline; gap: 1px;
          font-size: 12px; font-weight: 600; color: #7A9AC0;
          padding: 1px 5px;
        }
        .panel-stat-unit { font-size: 10px; font-weight: 500; color: #9AA4AF; margin-left: 1px; }

        .hours-edit-wrap { display: inline-flex; align-items: center; gap: 3px; }
        .hours-inline-input {
          width: 44px; height: 22px; padding: 0 4px;
          border: 1.5px solid #1B2B4B; border-radius: 5px;
          font-size: 11px; font-family: inherit; outline: none;
          background: white; color: #0a0a0a; text-align: right;
        }
        .hours-save-btn {
          width: 20px; height: 20px; border: none; border-radius: 4px;
          background: #1B2B4B; color: white; cursor: pointer;
          font-size: 10px; display: flex; align-items: center; justify-content: center; padding: 0;
        }
        .hours-save-btn:hover:not(:disabled) { background: #4A82C6; }
        .hours-save-btn:disabled { opacity: 0.5; cursor: default; }

        /* Per complement */
        .panel-type-row { display: flex; align-items: center; gap: 7px; }
        .panel-type-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .panel-type-label { font-size: 12px; font-weight: 600; color: #444; white-space: nowrap; min-width: 52px; }
        .panel-type-bar { flex: 1; height: 4px; background: #F0F0F0; border-radius: 2px; overflow: hidden; }
        .panel-type-fill { height: 100%; border-radius: 2px; transition: width 0.4s ease; }
        .panel-type-count { font-size: 11px; font-weight: 700; color: #6C757D; min-width: 16px; text-align: right; }

        /* ── Empty state ── */
        .empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 60px 20px; text-align: center; }
        .empty-icon { font-size: 36px; }
        .empty-title { font-size: 15px; font-weight: 600; color: #0a0a0a; }
        .empty-sub { font-size: 13px; color: #9A9A9A; margin-bottom: 8px; }

        /* ── Modals ── */
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.45);
          display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px;
        }
        .modal {
          background: white; border-radius: 14px; width: 100%; max-width: 500px;
          display: flex; flex-direction: column; box-shadow: 0 24px 64px rgba(0,0,0,0.18); overflow: hidden;
        }
        .modal-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 20px; border-bottom: 1px solid #F0F0F0;
        }
        .modal-header h2 { font-size: 15px; font-weight: 700; color: #0a0a0a; }
        .close-btn {
          width: 28px; height: 28px; border: none; background: #F0F0F0; border-radius: 6px;
          cursor: pointer; display: flex; align-items: center; justify-content: center; color: #5C5C5C;
        }
        .close-btn:hover { background: #E8E8E8; }
        .modal-body { padding: 20px; display: flex; flex-direction: column; gap: 14px; }
        .save-error { margin: 0 20px; padding: 8px 12px; background: #FEF2F2; color: #DC2626; font-size: 12px; border-radius: 6px; border: 1px solid #FECACA; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 14px 20px; border-top: 1px solid #F0F0F0; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .form-field { display: flex; flex-direction: column; gap: 5px; }
        .form-field label { font-size: 11px; font-weight: 700; color: #9A9A9A; text-transform: uppercase; letter-spacing: 0.06em; }
        .form-select, .form-input, .form-textarea {
          border: 1.5px solid #E8E8E8; border-radius: 8px; padding: 8px 10px;
          font-size: 13.5px; font-family: inherit; outline: none;
          background: #FAFAFA; color: #0a0a0a; transition: border-color 0.15s;
        }
        .form-select:focus, .form-input:focus, .form-textarea:focus { border-color: #1B2B4B; background: white; }
        .type-grid { display: flex; flex-wrap: wrap; gap: 6px; }
        .type-btn {
          display: flex; align-items: center; gap: 5px;
          padding: 6px 12px; border: 1.5px solid #E8E8E8; border-radius: 20px;
          background: white; font-size: 12.5px; font-weight: 500; color: #5C5C5C;
          cursor: pointer; font-family: inherit; transition: all 0.15s;
        }
        .type-btn:hover { border-color: #D0D0D0; color: #0a0a0a; background: #F8F8F8; }
        .selected-hint { font-size: 11px; color: #9A9A9A; margin-top: 2px; }
        .btn-cancel {
          height: 36px; padding: 0 14px; border: 1px solid #E8E8E8; border-radius: 8px;
          background: white; font-size: 13px; color: #5C5C5C; cursor: pointer;
          font-family: inherit; transition: all 0.15s;
        }
        .btn-cancel:hover { border-color: #D0D0D0; color: #0a0a0a; }
        .btn-confirm {
          display: flex; align-items: center; gap: 6px;
          height: 36px; padding: 0 16px; background: #1B2B4B; color: white; border: none;
          border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer;
          font-family: inherit; transition: background 0.15s;
        }
        .btn-confirm:hover:not(:disabled) { background: #4A82C6; }
        .btn-confirm:disabled { background: #E8E8E8; color: #9A9A9A; cursor: not-allowed; }

        :global(.spin) { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

    </div>
  )
}
