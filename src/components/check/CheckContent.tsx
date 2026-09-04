'use client'

import { useState, useMemo } from 'react'
import {
  Plus, X, ChevronLeft, ChevronRight, Camera, Video, FileText,
  Image, Mic, Loader2, Trash2, Clock, Pencil,
} from 'lucide-react'

const SESSION_TYPES = [
  { value: 'foto', label: 'Foto', icon: Camera, color: '#3B82F6' },
  { value: 'video', label: 'Vídeo', icon: Video, color: '#8B5CF6' },
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
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [filterClient, setFilterClient] = useState('all')
  const [sessions, setSessions] = useState<Session[]>(initialSessions)
  const [showAdd, setShowAdd] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [form, setForm] = useState({
    client_id: '',
    session_date: '',
    session_types: [] as string[],
    hours: '0',
    notes: '',
    start_time: '',
    end_time: '',
  })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [editSession, setEditSession] = useState<Session | null>(null)
  const [editForm, setEditForm] = useState({
    client_id: '', session_date: '', session_types: [] as string[], hours: '0', notes: '', start_time: '', end_time: '',
  })

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
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (json.error) { setSaveError(json.error); return }
      if (json.session) {
        setSessions(prev => [json.session as Session, ...prev])
        const d = new Date(form.session_date + 'T12:00:00')
        setYear(d.getFullYear())
        setMonth(d.getMonth())
        setShowAdd(false)
        setForm({ client_id: '', session_date: '', session_types: [], hours: '0', notes: '', start_time: '', end_time: '' })
      }
    } finally { setSaving(false) }
  }

  const openEdit = (session: Session) => {
    setEditSession(session)
    setEditForm({
      client_id: session.client_id,
      session_date: session.session_date,
      session_types: Array.isArray(session.session_types) ? session.session_types : [],
      hours: String(session.hours || 0),
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
    await fetch(`/api/check/sessions/${id}`, { method: 'DELETE' })
    setSessions(prev => prev.filter(s => s.id !== id))
    setDeleting(null)
  }

  const getTypeInfo = (val: string) => SESSION_TYPES.find(t => t.value === val) || SESSION_TYPES[SESSION_TYPES.length - 1]

  const fmtDate = (iso: string) => {
    const d = new Date(iso + 'T12:00:00')
    return d.toLocaleDateString('ca-ES', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  return (
    <div className="check-page">
      {/* Header bar */}
      <div className="check-header">
        <div className="month-nav">
          <button className="nav-btn" onClick={prevMonth}><ChevronLeft size={16} /></button>
          <span className="month-label">{MONTHS_CA[month]} {year}</span>
          <button className="nav-btn" onClick={nextMonth}><ChevronRight size={16} /></button>
        </div>

        <div className="header-filters">
          <select className="filter-select" value={filterClient} onChange={e => setFilterClient(e.target.value)}>
            <option value="all">Tots els clients</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <button className="btn-add" onClick={() => setShowAdd(true)}>
          <Plus size={14} />
          Nova sessió
        </button>
      </div>

      {/* Stats row */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{stats.totalSessions}</div>
          <div className="stat-label">Sessions</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalHours.toFixed(1)}h</div>
          <div className="stat-label">Hores totals</div>
        </div>
        <div className="stat-card stat-card--wide">
          <div className="stat-label" style={{ marginBottom: 8 }}>Per client</div>
          <div className="client-breakdown">
            {Object.values(stats.byClient).length === 0
              ? <span className="no-data">Cap sessió</span>
              : Object.values(stats.byClient).sort((a, b) => b.count - a.count).map((c, i) => (
                <div key={i} className="breakdown-row">
                  <span className="breakdown-name">{c.name}</span>
                  <span className="breakdown-count">{c.count} sess.</span>
                  {c.hours > 0 && <span className="breakdown-hours">{c.hours.toFixed(1)}h</span>}
                </div>
              ))
            }
          </div>
        </div>
        <div className="stat-card stat-card--wide">
          <div className="stat-label" style={{ marginBottom: 8 }}>Per complement</div>
          <div className="type-breakdown">
            {Object.entries(stats.byType).length === 0
              ? <span className="no-data">Cap sessió</span>
              : Object.entries(stats.byType).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
                const ti = getTypeInfo(type)
                return (
                  <div key={type} className="type-chip" style={{ background: ti.color + '18', color: ti.color }}>
                    <ti.icon size={11} />
                    {ti.label}: {count}
                  </div>
                )
              })
            }
          </div>
        </div>
      </div>

      {/* Session list */}
      <div className="sessions-list">
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
                    <div key={session.id} className="session-row">
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
                          <div className="session-hours"><Clock size={11} /> {session.start_time.slice(0,5)}{session.end_time ? `–${session.end_time.slice(0,5)}` : ''}</div>
                        )}
                        {session.hours > 0 && <div className="session-hours">{session.hours}h</div>}
                      </div>
                      <div className="session-actions">
                        <button className="session-edit" onClick={() => openEdit(session)} title="Editar"><Pencil size={13} /></button>
                        <button
                          className="session-del"
                          onClick={() => handleDelete(session.id)}
                          disabled={deleting === session.id}
                          title="Eliminar"
                        >
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
                  <input type="date" className="form-input" value={form.session_date} onChange={e => setForm(f => ({ ...f, session_date: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label>Hora inici</label>
                  <input type="time" className="form-input" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label>Hora fi</label>
                  <input type="time" className="form-input" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label>Hores</label>
                  <input type="number" step="0.5" min="0" max="24" className="form-input" value={form.hours} onChange={e => setForm(f => ({ ...f, hours: e.target.value }))} />
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
                  <input type="date" className="form-input" value={editForm.session_date} onChange={e => setEditForm(f => ({ ...f, session_date: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label>Hora inici</label>
                  <input type="time" className="form-input" value={editForm.start_time} onChange={e => setEditForm(f => ({ ...f, start_time: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label>Hora fi</label>
                  <input type="time" className="form-input" value={editForm.end_time} onChange={e => setEditForm(f => ({ ...f, end_time: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label>Hores</label>
                  <input type="number" step="0.5" min="0" max="24" className="form-input" value={editForm.hours} onChange={e => setEditForm(f => ({ ...f, hours: e.target.value }))} />
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
        .check-page {
          flex: 1;
          padding: 24px 28px 40px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        @media (max-width: 767px) {
          .check-page { padding: 14px 12px 80px; }
          .check-header { flex-direction: column; align-items: flex-start; gap: 10px; }
          .header-filters { margin-left: 0; flex-wrap: wrap; }
          .stats-row { gap: 8px; }
          .stat-card { min-width: calc(50% - 4px); flex: 1; padding: 14px 14px 12px; }
          .session-meta { display: none; }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .check-page { padding: 16px 16px 40px; }
        }

        .check-header {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .month-nav {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .nav-btn {
          width: 34px; height: 34px;
          border: 1px solid rgba(0,0,0,0.08); background: white; border-radius: 10px;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          color: #5C6B80; transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .nav-btn:hover { background: #F5F8FF; color: #1B2B4B; border-color: rgba(37,99,235,0.2); box-shadow: 0 2px 6px rgba(0,0,0,0.08); }

        .month-label {
          font-size: 17px; font-weight: 700; color: #0a0a0a;
          min-width: 160px; text-align: center;
        }

        .header-filters { display: flex; gap: 8px; margin-left: auto; }

        .filter-select {
          height: 34px; padding: 0 10px;
          border: 1px solid #E8E8E8; border-radius: 8px;
          font-size: 13px; color: #0a0a0a; background: white;
          font-family: inherit; cursor: pointer; outline: none;
        }
        .filter-select:focus { border-color: #1B2B4B60; }

        .btn-add {
          display: flex; align-items: center; gap: 6px;
          height: 38px; padding: 0 16px;
          background: linear-gradient(135deg, #1B2B4B, #2563EB); color: white; border: none; border-radius: 10px;
          font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit;
          transition: all 0.2s ease; white-space: nowrap;
          box-shadow: 0 2px 8px rgba(37,99,235,0.3);
        }
        .btn-add:hover { background: linear-gradient(135deg, #0F1E33, #1D4ED8); box-shadow: 0 4px 14px rgba(37,99,235,0.38); transform: translateY(-1px); }

        /* Stats */
        .stats-row { display: flex; gap: 14px; flex-wrap: wrap; }

        .stat-card {
          background: white; border: 1px solid rgba(0,0,0,0.06); border-radius: 18px;
          padding: 18px 22px; min-width: 100px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03);
          transition: box-shadow 0.2s ease, transform 0.2s ease;
        }
        .stat-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.08); transform: translateY(-1px); }
        .stat-card--wide { flex: 1; min-width: 200px; }

        .stat-value { font-size: 28px; font-weight: 700; color: #0a0a0a; letter-spacing: -0.02em; }
        .stat-label { font-size: 11px; font-weight: 700; color: #9A9A9A; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 2px; }

        .client-breakdown { display: flex; flex-direction: column; gap: 5px; }
        .breakdown-row { display: flex; align-items: center; gap: 8px; font-size: 12.5px; }
        .breakdown-name { flex: 1; font-weight: 600; color: #0a0a0a; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .breakdown-count { color: #1B2B4B; font-weight: 700; font-size: 12px; }
        .breakdown-hours { color: #9A9A9A; font-size: 11px; }

        .type-breakdown { display: flex; flex-wrap: wrap; gap: 6px; }
        .type-chip { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; font-weight: 600; padding: 4px 10px; border-radius: 20px; }

        .no-data { font-size: 12px; color: #C0C0C0; }

        /* Session list */
        .sessions-list { display: flex; flex-direction: column; gap: 20px; }

        .day-header {
          font-size: 11px; font-weight: 700; color: #9A9A9A;
          text-transform: uppercase; letter-spacing: 0.06em;
          margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid #F0F0F0;
        }

        .day-sessions { display: flex; flex-direction: column; gap: 6px; }

        .session-row {
          display: flex; align-items: center; gap: 12px;
          background: white; border: 1px solid rgba(0,0,0,0.06); border-radius: 14px;
          padding: 12px 16px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.04);
          transition: box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s;
        }
        .session-row:hover { box-shadow: 0 6px 18px rgba(0,0,0,0.08); border-color: rgba(37,99,235,0.14); transform: translateY(-1px); }

        .session-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
        .session-client-name { font-size: 13.5px; font-weight: 600; color: #0a0a0a; }

        .session-types-wrap { display: flex; flex-wrap: wrap; gap: 5px; }

        .session-type-chip {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 11.5px; font-weight: 600; padding: 3px 9px; border-radius: 20px;
          white-space: nowrap;
        }

        .session-no-types { font-size: 12px; color: #C0C0C0; }

        .session-meta { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }

        .session-hours {
          display: flex; align-items: center; gap: 4px;
          font-size: 12px; color: #5C5C5C; white-space: nowrap;
        }

        .session-notes {
          font-size: 12px; color: #9A9A9A;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }

        .session-actions { display: flex; gap: 4px; flex-shrink: 0; }

        .session-edit {
          width: 28px; height: 28px; border: none; background: transparent;
          border-radius: 6px; cursor: pointer; display: flex; align-items: center;
          justify-content: center; color: #C0C0C0; transition: all 0.15s;
        }
        .session-edit:hover { background: #EFF6FF; color: #1B2B4B; }

        .session-del {
          width: 28px; height: 28px; border: none; background: transparent;
          border-radius: 6px; cursor: pointer; display: flex; align-items: center;
          justify-content: center; color: #C0C0C0; transition: all 0.15s; flex-shrink: 0;
        }
        .session-del:hover { background: #FEF2F2; color: #DC2626; }
        .session-del:disabled { opacity: 0.5; cursor: default; }

        /* Empty */
        .empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 60px 20px; text-align: center; }
        .empty-icon { font-size: 36px; }
        .empty-title { font-size: 15px; font-weight: 600; color: #0a0a0a; }
        .empty-sub { font-size: 13px; color: #9A9A9A; margin-bottom: 8px; }

        /* Modal */
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5);
          display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 24px;
        }

        .modal {
          background: white; border-radius: 14px; width: 100%; max-width: 500px;
          display: flex; flex-direction: column;
          box-shadow: 0 24px 64px rgba(0,0,0,0.2); overflow: hidden;
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
