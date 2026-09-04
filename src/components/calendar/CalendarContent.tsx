'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  ChevronLeft, ChevronRight, Plus, Video, RefreshCw, Loader2,
  X, Clock, MapPin, Users, Tag, ExternalLink, Edit2, AlertTriangle, Calendar,
} from 'lucide-react'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type ViewMode = 'week' | 'month' | 'day' | 'agenda'
type MeetLocation = 'google_meet' | 'presential' | 'phone' | 'other'
type MeetType = 'intern' | 'client' | 'kickoff' | 'followup' | 'strategy' | 'creativity' | 'production' | 'commercial' | 'admin' | 'other'
type EventStatus = 'scheduled' | 'cancelled' | 'completed'

interface CalEvent {
  id: string
  title: string
  start: Date
  end: Date
  source: 'db' | 'gcal'
  meetLink?: string | null
  description?: string | null
  location?: MeetLocation
  meetingType?: MeetType
  status?: EventStatus
  clientId?: string
  clientName?: string
  projectId?: string
  createdBy?: string
  participants: { email: string; name?: string; userId?: string }[]
  ownerId: string
  ownerName: string
  color: string
  gcalEventId?: string
  recurrence?: string
  allDay?: boolean
  isOwn: boolean
}

interface ConflictWarn {
  person: string
  eventTitle: string
  time: string
}

interface MeetForm {
  title: string
  date: string
  startTime: string
  endTime: string
  participantIds: string[]
  clientId: string
  projectId: string
  meetingType: MeetType
  location: MeetLocation
  description: string
  agenda: string
  recurrence: string
}

interface Props {
  meetings: any[]
  tasks: any[]
  isCalendarConnected: boolean
  profiles: { id: string; full_name: string; email?: string; position?: string }[]
  clients?: { id: string; name: string }[]
  projects?: { id: string; name: string; client_id: string }[]
  currentUserId: string
  contentSessions?: any[]
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const WEEK_LABELS = ['Dl', 'Dm', 'Dc', 'Dj', 'Dv', 'Ds', 'Dg']
const MONTHS = ['Gener', 'Febrer', 'Març', 'Abril', 'Maig', 'Juny', 'Juliol', 'Agost', 'Setembre', 'Octubre', 'Novembre', 'Desembre']
const HOURS = Array.from({ length: 15 }, (_, i) => i + 7) // 7:00–21:00
const HOUR_PX = 64
const DAY_START = 7
const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6', '#F97316']

const TYPE_LABELS: Record<MeetType, string> = {
  intern: 'Interna', client: 'Client', kickoff: 'Kick-off', followup: 'Seguiment',
  strategy: 'Estratègia', creativity: 'Creativitat', production: 'Producció',
  commercial: 'Comercial', admin: 'Administració', other: 'Altres',
}
const LOC_LABELS: Record<MeetLocation, string> = {
  google_meet: 'Google Meet', presential: 'Presencial', phone: 'Telèfon', other: 'Altres',
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function weekStart(d: Date) {
  const r = new Date(d)
  const day = r.getDay()
  r.setDate(r.getDate() - (day === 0 ? 6 : day - 1))
  r.setHours(0, 0, 0, 0)
  return r
}
function addDays(d: Date, n: number) {
  const r = new Date(d); r.setDate(r.getDate() + n); return r
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}
function fmtTime(d: Date) {
  return d.toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' })
}
function fmtDate(d: Date) {
  return d.toLocaleDateString('ca-ES', { weekday: 'long', day: 'numeric', month: 'long' })
}
function evTop(start: Date) {
  return Math.max(0, (start.getHours() + start.getMinutes() / 60 - DAY_START) * HOUR_PX)
}
function evHeight(start: Date, end: Date) {
  return Math.max(HOUR_PX / 4, ((end.getTime() - start.getTime()) / 3600000) * HOUR_PX)
}
function dbToCalEvent(m: any, uid: string, profileMap: Map<string, any>, colorMap: Map<string, string>): CalEvent {
  const ownerId = m.created_by || ''
  return {
    id: m.id,
    title: m.title,
    start: new Date(m.start_time),
    end: new Date(m.end_time),
    source: 'db',
    meetLink: m.meet_link,
    description: m.description,
    location: m.location || 'google_meet',
    meetingType: m.meeting_type || 'intern',
    status: m.status || 'scheduled',
    clientId: m.client_id || m.client?.id,
    clientName: m.client?.name,
    projectId: m.project_id,
    createdBy: m.created_by,
    participants: (m.attendee_emails || []).map((e: string) => ({ email: e })),
    ownerId,
    ownerName: profileMap.get(ownerId)?.full_name || 'Desconegut',
    color: colorMap.get(ownerId) || '#6B7280',
    gcalEventId: m.gcal_event_id,
    recurrence: m.recurrence || 'none',
    isOwn: ownerId === uid,
  }
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
const SESSION_COLOR = '#F97316' // orange — visually distinct from meetings (blue) and GCal (slate)

export function CalendarContent({
  meetings: initialMeetings,
  tasks,
  isCalendarConnected,
  profiles,
  clients = [],
  projects = [],
  currentUserId,
  contentSessions = [],
}: Props) {
  const [view, setView] = useState<ViewMode>('week')
  const [curDate, setCurDate] = useState(new Date())
  const [isMobile, setIsMobile] = useState(false)

  // Default to agenda view on mobile + detect mobile
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) setView('agenda')
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  const [gcalRaw, setGcalRaw] = useState<any[]>([])
  const [meetings, setMeetings] = useState(initialMeetings)
  const [gcalOn, setGcalOn] = useState(isCalendarConnected)
  const [loadingGcal, setLoadingGcal] = useState(false)
  const [gcalErr, setGcalErr] = useState('')
  const [selected, setSelected] = useState<CalEvent | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<CalEvent | null>(null)
  const [activeMembers, setActiveMembers] = useState<Set<string>>(new Set())
  const [creating, setCreating] = useState(false)
  const [createErr, setCreateErr] = useState('')

  const blankForm: MeetForm = {
    title: '', date: new Date().toISOString().split('T')[0],
    startTime: '10:00', endTime: '11:00',
    participantIds: [], clientId: '', projectId: '',
    meetingType: 'intern', location: 'google_meet',
    description: '', agenda: '', recurrence: 'none',
  }
  const [form, setForm] = useState<MeetForm>(blankForm)

  // ── Derived maps ──
  const profileMap = useMemo(() => {
    const m = new Map<string, typeof profiles[0]>()
    profiles.forEach(p => m.set(p.id, p))
    return m
  }, [profiles])

  const colorMap = useMemo(() => {
    const m = new Map<string, string>()
    profiles.forEach((p, i) => m.set(p.id, COLORS[i % COLORS.length]))
    return m
  }, [profiles])

  const dbEvents = useMemo(
    () => meetings.map(m => dbToCalEvent(m, currentUserId, profileMap, colorMap)),
    [meetings, currentUserId, profileMap, colorMap]
  )

  const gcalEvents = useMemo<CalEvent[]>(() =>
    gcalRaw.map(e => {
      // All-day events come as "YYYY-MM-DD" strings — parse as local date to avoid UTC shift
      let start: Date, end: Date
      if (e.allDay) {
        const [sy, sm, sd] = (e.start as string).split('-').map(Number)
        const [ey, em, ed] = (e.end as string).split('-').map(Number)
        start = new Date(sy, sm - 1, sd, 0, 0, 0)
        // GCal all-day end is exclusive (next day), subtract 1 day
        end = new Date(ey, em - 1, ed - 1, 23, 59, 59)
      } else {
        start = new Date(e.start)
        end = new Date(e.end)
      }
      return {
        id: e.id,
        title: e.title,
        start,
        end,
        source: 'gcal' as const,
        meetLink: e.meetLink,
        description: e.description,
        participants: e.attendees || [],
        ownerId: e.ownerId || '',
        ownerName: e.ownerName || '',
        color: e.isOwn ? (colorMap.get(currentUserId) || '#3B82F6') : '#94A3B8',
        allDay: e.allDay,
        isOwn: e.isOwn,
        status: 'scheduled' as const,
      }
    }), [gcalRaw, colorMap, currentUserId])

  const sessionEvents = useMemo<CalEvent[]>(() =>
    contentSessions.map(s => {
      const [sy, sm, sd] = (s.session_date as string).split('-').map(Number)
      const types: string[] = Array.isArray(s.session_types) ? s.session_types : []
      const typeLabel = types.length > 0 ? types.map((t: string) => t.charAt(0).toUpperCase() + t.slice(1)).join(', ') : 'Sessió'
      const hasTimes = s.start_time && s.end_time
      let start: Date, end: Date
      if (hasTimes) {
        const [sh, sm2] = (s.start_time as string).split(':').map(Number)
        const [eh, em] = (s.end_time as string).split(':').map(Number)
        start = new Date(sy, sm - 1, sd, sh, sm2, 0)
        end = new Date(sy, sm - 1, sd, eh, em, 0)
      } else {
        start = new Date(sy, sm - 1, sd, 0, 0, 0)
        end = new Date(sy, sm - 1, sd, 23, 59, 59)
      }
      return {
        id: `session-${s.id}`,
        title: `📸 ${s.client?.name || 'Sessió'} · ${typeLabel}`,
        start,
        end,
        source: 'db' as const,
        participants: [],
        ownerId: s.created_by || '',
        ownerName: 'Sessions',
        color: SESSION_COLOR,
        allDay: !hasTimes,
        isOwn: s.created_by === currentUserId,
        status: 'scheduled' as const,
        clientId: s.client_id,
        clientName: s.client?.name,
        description: s.notes || undefined,
      }
    }), [contentSessions, currentUserId])

  const allEvents = useMemo(() => {
    const all = [...dbEvents, ...gcalEvents, ...sessionEvents]
    if (activeMembers.size === 0) return all
    return all.filter(e => activeMembers.has(e.ownerId))
  }, [dbEvents, gcalEvents, sessionEvents, activeMembers])

  const filteredProjects = useMemo(() =>
    form.clientId ? projects.filter(p => p.client_id === form.clientId) : projects,
    [form.clientId, projects])

  // ── Week navigation ──
  const wStart = useMemo(() => weekStart(curDate), [curDate])
  const wDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(wStart, i)), [wStart])

  const today = useMemo(() => new Date(), [])

  // ── Nav label ──
  const navLabel = view === 'week'
    ? `${wDays[0].getDate()} ${MONTHS[wDays[0].getMonth()]} – ${wDays[6].getDate()} ${MONTHS[wDays[6].getMonth()]} ${wDays[6].getFullYear()}`
    : view === 'month'
    ? `${MONTHS[curDate.getMonth()]} ${curDate.getFullYear()}`
    : view === 'day'
    ? fmtDate(curDate)
    : 'Pròximes reunions'

  function navigate(dir: 1 | -1) {
    if (view === 'week') setCurDate(addDays(curDate, dir * 7))
    else if (view === 'month') setCurDate(new Date(curDate.getFullYear(), curDate.getMonth() + dir, 1))
    else if (view === 'day') setCurDate(addDays(curDate, dir))
    else setCurDate(addDays(curDate, dir * 7))
  }

  // ── GCal fetch ──
  const fetchGcal = useCallback(async () => {
    if (!gcalOn) return
    setLoadingGcal(true)
    setGcalErr('')
    try {
      const tMin = new Date(curDate.getFullYear(), curDate.getMonth(), 1).toISOString()
      const tMax = new Date(curDate.getFullYear(), curDate.getMonth() + 2, 0).toISOString()
      const res = await fetch(`/api/calendar/events?timeMin=${tMin}&timeMax=${tMax}`)
      const json = await res.json()
      if (json.error === 'not_connected') { setGcalOn(false); return }
      if (json.error) { setGcalErr(json.error); return }
      if (json.events) setGcalRaw(json.events)
    } catch (err: any) {
      setGcalErr(err.message || 'Error de connexió')
    } finally {
      setLoadingGcal(false)
    }
  }, [gcalOn, curDate])

  useEffect(() => { fetchGcal() }, [fetchGcal])

  useEffect(() => {
    fetch('/api/calendar/status').then(r => r.json()).then(j => setGcalOn(!!j.connected)).catch(() => {})
  }, [])

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    if (p.get('connected') === '1') { setGcalOn(true); window.history.replaceState({}, '', '/calendar') }
    if (p.get('error')) { window.history.replaceState({}, '', '/calendar') }
  }, [])

  // ── Conflict detection ──
  function checkConflicts(f: MeetForm): ConflictWarn[] {
    if (!f.date || !f.startTime || !f.endTime || f.participantIds.length === 0) return []
    const start = new Date(`${f.date}T${f.startTime}:00`)
    const end = new Date(`${f.date}T${f.endTime}:00`)
    const warns: ConflictWarn[] = []
    const checked = new Set<string>()
    for (const pid of f.participantIds) {
      if (checked.has(pid)) continue
      checked.add(pid)
      const prof = profileMap.get(pid)
      if (!prof) continue
      for (const ev of allEvents) {
        if (ev.status === 'cancelled' || ev.allDay) continue
        if (editTarget && ev.id === editTarget.id) continue
        if (!sameDay(ev.start, start)) continue
        if (start < ev.end && end > ev.start) {
          const isParticipant = ev.participants.some(p => p.userId === pid || p.email === prof.email)
          if (isParticipant || ev.ownerId === pid) {
            warns.push({ person: prof.full_name, eventTitle: ev.title, time: `${fmtTime(ev.start)}–${fmtTime(ev.end)}` })
            break
          }
        }
      }
    }
    return warns
  }

  const conflicts = useMemo(
    () => checkConflicts(form),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form.participantIds, form.date, form.startTime, form.endTime, allEvents, editTarget]
  )

  // ── Modal helpers ──
  function openCreate(day?: Date) {
    setEditTarget(null)
    setForm({ ...blankForm, date: day ? day.toISOString().split('T')[0] : blankForm.date })
    setCreateErr('')
    setShowModal(true)
  }

  function openEdit(ev: CalEvent) {
    if (ev.source !== 'db') return
    setEditTarget(ev)
    setForm({
      title: ev.title,
      date: ev.start.toISOString().split('T')[0],
      startTime: fmtTime(ev.start),
      endTime: fmtTime(ev.end),
      participantIds: ev.participants.filter(p => p.userId).map(p => p.userId!),
      clientId: ev.clientId || '',
      projectId: ev.projectId || '',
      meetingType: ev.meetingType || 'intern',
      location: ev.location || 'google_meet',
      description: ev.description || '',
      agenda: '',
      recurrence: ev.recurrence || 'none',
    })
    setCreateErr('')
    setShowModal(true)
  }

  async function submitMeeting() {
    if (!form.title || !form.date || !form.startTime || !form.endTime) {
      setCreateErr('Omple els camps obligatoris: títol, data i hora.')
      return
    }
    setCreating(true)
    setCreateErr('')
    try {
      const endpoint = editTarget
        ? `/api/calendar/meetings/${editTarget.id}`
        : '/api/calendar/create-meet'
      const method = editTarget ? 'PATCH' : 'POST'
      const payload = {
        title: form.title,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        attendeeIds: form.participantIds,
        attendeeEmails: form.participantIds.map(id => profileMap.get(id)?.email).filter(Boolean),
        clientId: form.clientId || null,
        projectId: form.projectId || null,
        meetingType: form.meetingType,
        location: form.location,
        description: form.description,
        recurrence: form.recurrence,
      }
      const res = await fetch(endpoint, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error desconegut')
      if (editTarget) {
        setMeetings(prev => prev.map(m => m.id === editTarget.id ? { ...m, ...json.meeting } : m))
      } else {
        setMeetings(prev => [...prev, json.meeting])
      }
      setShowModal(false)
      setSelected(null)
    } catch (err: any) {
      setCreateErr(err.message)
    } finally {
      setCreating(false)
    }
  }

  async function cancelMeeting(ev: CalEvent) {
    if (!confirm(`Cancel·lar "${ev.title}"?`)) return
    try {
      const res = await fetch(`/api/calendar/meetings/${ev.id}`, { method: 'DELETE' })
      if (res.ok) {
        setMeetings(prev => prev.map(m => m.id === ev.id ? { ...m, status: 'cancelled' } : m))
        setSelected(null)
      }
    } catch {}
  }

  // ── Day events helpers ──
  function eventsForDay(day: Date) {
    return allEvents.filter(e => !e.allDay && sameDay(e.start, day) && e.status !== 'cancelled')
  }
  function allDayEventsForDay(day: Date) {
    return allEvents.filter(e => e.allDay && sameDay(e.start, day) && e.status !== 'cancelled')
  }

  // ─────────────────────────────────────────────
  // Render: Week view
  // ─────────────────────────────────────────────
  function renderWeek() {
    const totalH = HOURS.length * HOUR_PX
    return (
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Day header row */}
        <div style={{ display: 'grid', gridTemplateColumns: '48px repeat(7, 1fr)', borderBottom: '1px solid #EBEBEB', background: '#fff', position: 'sticky', top: 0, zIndex: 2 }}>
          <div style={{ width: 48 }} />
          {wDays.map((day, i) => {
            const isT = sameDay(day, today)
            return (
              <div key={i} onClick={() => { setCurDate(day); setView('day') }}
                style={{ padding: '6px 4px', textAlign: 'center', cursor: 'pointer' }}>
                <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{WEEK_LABELS[i]}</div>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: isT ? '#1B2B4B' : 'transparent', color: isT ? '#fff' : '#111', fontSize: 13, fontWeight: isT ? 700 : 400, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '3px auto 0' }}>
                  {day.getDate()}
                </div>
              </div>
            )
          })}
        </div>

        {/* All-day events row */}
        {wDays.some(d => allDayEventsForDay(d).length > 0) && (
          <div style={{ display: 'grid', gridTemplateColumns: '48px repeat(7, 1fr)', borderBottom: '1px solid #EBEBEB', background: '#FAFAFA', position: 'sticky', top: 62, zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8 }}>
              <span style={{ fontSize: 9, color: '#C4C4C4', textTransform: 'uppercase' }}>Tot dia</span>
            </div>
            {wDays.map((day, i) => {
              const adEvs = allDayEventsForDay(day)
              return (
                <div key={i} style={{ borderLeft: '1px solid #F3F4F6', padding: '2px 3px', minHeight: 24 }}>
                  {adEvs.map(ev => (
                    <div key={ev.id} onClick={() => setSelected(ev)}
                      style={{ fontSize: 10, padding: '1px 5px', borderRadius: 3, marginBottom: 1, background: ev.color + '22', color: ev.color, fontWeight: 600, cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ev.title}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        )}
        {/* Time grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '48px repeat(7, 1fr)', height: totalH, flex: '0 0 auto', position: 'relative' }}>
          {/* Hour labels */}
          <div style={{ borderRight: '1px solid #F3F4F6' }}>
            {HOURS.map(h => (
              <div key={h} style={{ height: HOUR_PX, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', paddingRight: 8, paddingTop: 3 }}>
                <span style={{ fontSize: 10, color: '#C4C4C4', fontVariantNumeric: 'tabular-nums' }}>{h}:00</span>
              </div>
            ))}
          </div>
          {/* Day columns */}
          {wDays.map((day, di) => {
            const dayEvs = eventsForDay(day)
            const isT = sameDay(day, today)
            return (
              <div key={di}
                onClick={e => { if (!(e.target as HTMLElement).closest('.cev')) openCreate(day) }}
                style={{ position: 'relative', borderLeft: '1px solid #F3F4F6', cursor: 'pointer', background: isT ? 'rgba(27,43,75,0.018)' : 'transparent' }}>
                {HOURS.map(h => (
                  <div key={h} style={{ position: 'absolute', top: (h - DAY_START) * HOUR_PX, left: 0, right: 0, borderTop: '1px solid #F3F4F6', height: HOUR_PX, pointerEvents: 'none' }} />
                ))}
                {/* Current time indicator */}
                {isT && (() => {
                  const now = new Date()
                  const tp = evTop(now)
                  if (tp < 0 || tp > totalH) return null
                  return (
                    <div style={{ position: 'absolute', top: tp, left: 0, right: 0, zIndex: 3, pointerEvents: 'none' }}>
                      <div style={{ position: 'absolute', left: -4, top: -4, width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} />
                      <div style={{ height: 2, background: '#EF4444', marginLeft: 4 }} />
                    </div>
                  )
                })()}
                {/* Events */}
                {dayEvs.map(ev => {
                  const top = evTop(ev.start)
                  const height = evHeight(ev.start, ev.end)
                  return (
                    <div key={ev.id} className="cev"
                      onClick={e => { e.stopPropagation(); setSelected(ev) }}
                      style={{
                        position: 'absolute', top, height: Math.max(height, 22), left: 2, right: 2,
                        background: ev.color + '1A', borderLeft: `3px solid ${ev.color}`,
                        borderRadius: 4, padding: '2px 5px', cursor: 'pointer', zIndex: 1, overflow: 'hidden',
                      }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: ev.color, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ev.title}
                      </div>
                      {height > 36 && <div style={{ fontSize: 10, color: '#9CA3AF' }}>{fmtTime(ev.start)}{ev.meetLink ? ' · 📹' : ''}</div>}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────
  // Render: Month view
  // ─────────────────────────────────────────────
  function renderMonth() {
    const yr = curDate.getFullYear(), mo = curDate.getMonth()
    const firstDow = new Date(yr, mo, 1).getDay()
    const daysInMo = new Date(yr, mo + 1, 0).getDate()
    const offset = firstDow === 0 ? 6 : firstDow - 1
    const cells: (Date | null)[] = [
      ...Array(offset).fill(null),
      ...Array.from({ length: daysInMo }, (_, i) => new Date(yr, mo, i + 1)),
    ]
    while (cells.length % 7 !== 0) cells.push(null)

    return (
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #EBEBEB', background: '#fff' }}>
          {['Dl', 'Dm', 'Dc', 'Dj', 'Dv', 'Ds', 'Dg'].map(d => (
            <div key={d} style={{ padding: '8px 0', textAlign: 'center', fontSize: 10, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: '100px' }}>
          {cells.map((day, i) => {
            if (!day) return <div key={i} style={{ background: '#FAFAFA', borderRight: '1px solid #F3F4F6', borderBottom: '1px solid #F3F4F6' }} />
            const isT = sameDay(day, today)
            const timedEvs = eventsForDay(day)
            const adEvs = allDayEventsForDay(day)
            const dayEvs = [...adEvs, ...timedEvs].slice(0, 4)
            return (
              <div key={i} onClick={() => { setCurDate(day); setView('day') }}
                style={{ borderRight: '1px solid #F3F4F6', borderBottom: '1px solid #F3F4F6', padding: '4px 6px', cursor: 'pointer' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: isT ? '#1B2B4B' : 'transparent', color: isT ? '#fff' : '#111', fontSize: 12, fontWeight: isT ? 700 : 400, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 2 }}>
                  {day.getDate()}
                </div>
                {dayEvs.map(ev => (
                  <div key={ev.id} onClick={e => { e.stopPropagation(); setSelected(ev) }}
                    style={{ fontSize: 10, padding: '1px 5px', borderRadius: 3, marginBottom: 2, background: ev.color + '1A', color: ev.color, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ev.allDay ? '· ' : fmtTime(ev.start) + ' '}{ev.title}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────
  // Render: Day view
  // ─────────────────────────────────────────────
  function renderDay() {
    const totalH = HOURS.length * HOUR_PX
    const isT = sameDay(curDate, today)
    const dayEvs = eventsForDay(curDate)
    const adEvs = allDayEventsForDay(curDate)
    return (
      <div style={{ flex: 1, overflow: 'auto' }}>
        {adEvs.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr', borderBottom: '1px solid #EBEBEB', background: '#FAFAFA' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8 }}>
              <span style={{ fontSize: 9, color: '#C4C4C4', textTransform: 'uppercase' }}>Tot dia</span>
            </div>
            <div style={{ padding: '4px 6px' }}>
              {adEvs.map(ev => (
                <div key={ev.id} onClick={() => setSelected(ev)}
                  style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, marginBottom: 2, background: ev.color + '22', color: ev.color, fontWeight: 700, cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ev.title}
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr', height: totalH }}>
          <div style={{ borderRight: '1px solid #F3F4F6' }}>
            {HOURS.map(h => (
              <div key={h} style={{ height: HOUR_PX, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', paddingRight: 8, paddingTop: 3 }}>
                <span style={{ fontSize: 10, color: '#C4C4C4' }}>{h}:00</span>
              </div>
            ))}
          </div>
          <div onClick={() => openCreate(curDate)} style={{ position: 'relative', cursor: 'pointer' }}>
            {HOURS.map(h => <div key={h} style={{ position: 'absolute', top: (h - DAY_START) * HOUR_PX, left: 0, right: 0, borderTop: '1px solid #F3F4F6', height: HOUR_PX, pointerEvents: 'none' }} />)}
            {isT && (() => {
              const now = new Date(); const tp = evTop(now)
              return (<div style={{ position: 'absolute', top: tp, left: 0, right: 0, zIndex: 3, pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', left: -4, top: -4, width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} />
                <div style={{ height: 2, background: '#EF4444', marginLeft: 4 }} />
              </div>)
            })()}
            {dayEvs.map(ev => (
              <div key={ev.id} className="cev"
                onClick={e => { e.stopPropagation(); setSelected(ev) }}
                style={{ position: 'absolute', top: evTop(ev.start), height: Math.max(evHeight(ev.start, ev.end), 28), left: 8, right: 8, background: ev.color + '1A', borderLeft: `3px solid ${ev.color}`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', zIndex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: ev.color }}>{ev.title}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF' }}>{fmtTime(ev.start)} – {fmtTime(ev.end)}</div>
                {ev.clientName && <div style={{ fontSize: 10, color: '#C4C4C4' }}>{ev.clientName}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────
  // Render: Agenda view
  // ─────────────────────────────────────────────
  function renderAgenda() {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const sorted = [...allEvents].filter(e => (e.allDay ? e.start >= todayStart : e.start >= now) && e.status !== 'cancelled').sort((a, b) => a.start.getTime() - b.start.getTime())
    const grouped = new Map<string, CalEvent[]>()
    sorted.forEach(e => {
      const k = e.start.toDateString()
      if (!grouped.has(k)) grouped.set(k, [])
      grouped.get(k)!.push(e)
    })
    if (grouped.size === 0) return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <Calendar size={48} strokeWidth={1} style={{ color: '#D1D5DB' }} />
        <p style={{ color: '#9CA3AF', fontSize: 14 }}>Sense reunions programades.</p>
        <button className="cal-btn-primary" onClick={() => openCreate()}>+ Nova reunió</button>
      </div>
    )
    const agendaPad = isMobile ? '10px 12px 80px' : '16px 24px'
    return (
      <div style={{ flex: 1, overflow: 'auto', padding: agendaPad }}>
        {Array.from(grouped.entries()).map(([ds, evs]) => (
          <div key={ds} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>
              {fmtDate(new Date(ds))}
            </div>
            {evs.map(ev => (
              <div key={ev.id} onClick={() => setSelected(ev)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: isMobile ? '12px 12px' : '10px 14px', background: '#fff', borderRadius: 10, border: '1px solid #EBEBEB', borderLeft: `4px solid ${ev.color}`, marginBottom: 8, cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ minWidth: isMobile ? 44 : 56, fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>
                  {ev.allDay ? <span style={{ fontSize: 10, color: ev.color, fontWeight: 700 }}>Tot dia</span> : <>{fmtTime(ev.start)}<br /><span style={{ fontSize: 10 }}>{fmtTime(ev.end)}</span></>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</div>
                  {ev.clientName && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{ev.clientName}</div>}
                </div>
                {ev.meetLink && (
                  <a href={ev.meetLink} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#1a73e8', textDecoration: 'none', padding: '6px 10px', background: '#EBF4FF', borderRadius: 6, whiteSpace: 'nowrap', flexShrink: 0 }}>
                    <Video size={11} />{!isMobile && ' Entrar'}
                  </a>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }

  // ─────────────────────────────────────────────
  // Render: Detail panel
  // ─────────────────────────────────────────────
  function renderDetail() {
    if (!selected) return null
    const ev = selected
    const canEdit = ev.source === 'db' && ev.createdBy === currentUserId
    const durMin = Math.round((ev.end.getTime() - ev.start.getTime()) / 60000)

    const detailStyle: React.CSSProperties = isMobile
      ? { position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200, maxHeight: '70vh', borderRadius: '16px 16px 0 0', borderTop: '1px solid #EBEBEB', background: '#fff', display: 'flex', flexDirection: 'column', boxShadow: '0 -8px 40px rgba(0,0,0,0.15)' }
      : { width: 300, borderLeft: '1px solid #EBEBEB', background: '#fff', display: 'flex', flexDirection: 'column', flexShrink: 0 }

    return (
      <>
        {isMobile && selected && (
          <div onClick={() => setSelected(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 199, backdropFilter: 'blur(2px)' }} />
        )}
      <div style={detailStyle}>
        {isMobile && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#E0E0E0' }} />
          </div>
        )}
        <div style={{ padding: isMobile ? '8px 16px 12px' : '12px 14px', borderBottom: '1px solid #EBEBEB', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: ev.color, flexShrink: 0, marginTop: 3 }} />
          <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#111', lineHeight: 1.4 }}>{ev.title}</div>
          <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 2 }}>
            <X size={15} />
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {ev.status === 'cancelled' && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, padding: '6px 10px', fontSize: 11, color: '#DC2626', fontWeight: 700 }}>
              Reunió cancel·lada
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <Clock size={13} style={{ color: '#9CA3AF', marginTop: 2, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#111' }}>
                {ev.start.toLocaleDateString('ca-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>
                {fmtTime(ev.start)} – {fmtTime(ev.end)}
                <span style={{ color: '#D1D5DB' }}> · {durMin}min</span>
              </div>
            </div>
          </div>

          {ev.location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin size={13} style={{ color: '#9CA3AF', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#555' }}>{LOC_LABELS[ev.location] || ev.location}</span>
            </div>
          )}

          {ev.meetingType && ev.meetingType !== 'intern' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Tag size={13} style={{ color: '#9CA3AF', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#555' }}>{TYPE_LABELS[ev.meetingType] || ev.meetingType}</span>
            </div>
          )}

          {ev.clientName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0 }}>Client</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#111' }}>{ev.clientName}</span>
            </div>
          )}

          {ev.participants.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Users size={13} style={{ color: '#9CA3AF' }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Participants</span>
              </div>
              {ev.participants.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '3px 0' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#6B7280' }}>
                    {(p.name || p.email || '?')[0].toUpperCase()}
                  </div>
                  <span style={{ fontSize: 12, color: '#111' }}>{p.name || p.email}</span>
                </div>
              ))}
            </div>
          )}

          {ev.description && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Descripció</div>
              <p style={{ fontSize: 12, color: '#555', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{ev.description}</p>
            </div>
          )}

          {ev.source === 'gcal' && (
            <div style={{ fontSize: 11, color: '#9CA3AF' }}>
              Sincronitzat de <span style={{ color: '#4285F4', fontWeight: 600 }}>Google Calendar</span>
            </div>
          )}
        </div>

        <div style={{ padding: '10px 14px', borderTop: '1px solid #EBEBEB', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {ev.meetLink && (
            <a href={ev.meetLink} target="_blank" rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '8px 12px', background: '#1B2B4B', color: '#fff', borderRadius: 7, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
              <Video size={13} /> Entrar a Google Meet
            </a>
          )}
          <div style={{ display: 'flex', gap: 6 }}>
            {canEdit && (
              <>
                <button onClick={() => { setSelected(null); openEdit(ev) }}
                  style={{ flex: 1, padding: '6px 8px', background: '#F5F5F5', border: 'none', borderRadius: 6, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: '#555' }}>
                  <Edit2 size={11} /> Editar
                </button>
                {ev.status !== 'cancelled' && (
                  <button onClick={() => cancelMeeting(ev)}
                    style={{ flex: 1, padding: '6px 8px', background: '#FEF2F2', border: 'none', borderRadius: 6, fontSize: 11, color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <X size={11} /> Cancel·lar
                  </button>
                )}
              </>
            )}
            {ev.gcalEventId && (
              <a href={`https://calendar.google.com`} target="_blank" rel="noreferrer"
                style={{ padding: '6px 8px', background: '#F5F5F5', border: 'none', borderRadius: 6, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', color: '#555' }}>
                <ExternalLink size={11} />
              </a>
            )}
          </div>
        </div>
      </div>
      </>
    )
  }

  // ─────────────────────────────────────────────
  // Render: Create/Edit modal
  // ─────────────────────────────────────────────
  function renderModal() {
    if (!showModal) return null
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 520, maxHeight: '92vh', overflow: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.15)' }}>
          {/* Header */}
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #EBEBEB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{editTarget ? 'Editar reunió' : 'Nova reunió'}</h3>
            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}><X size={17} /></button>
          </div>

          <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Title */}
            <div>
              <label style={lbl}>Títol *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="p.ex. Kick-off Girona FC"
                style={inp} />
            </div>

            {/* Date + Times */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <div>
                <label style={lbl}>Data *</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inp} />
              </div>
              <div>
                <label style={lbl}>Inici *</label>
                <input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} style={inp} />
              </div>
              <div>
                <label style={lbl}>Fi *</label>
                <input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} style={inp} />
              </div>
            </div>

            {/* Conflict warnings */}
            {conflicts.length > 0 && (
              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 7, padding: '8px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5, fontSize: 12, fontWeight: 700, color: '#92400E' }}>
                  <AlertTriangle size={13} /> Conflicte d'horari detectat
                </div>
                {conflicts.map((w, i) => (
                  <div key={i} style={{ fontSize: 11, color: '#78350F', marginBottom: 2 }}>
                    <strong>{w.person}</strong> té "{w.eventTitle}" ({w.time})
                  </div>
                ))}
              </div>
            )}

            {/* Participants */}
            <div>
              <label style={lbl}>Participants</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, padding: '6px 8px', border: '1px solid #EBEBEB', borderRadius: 7, minHeight: 36, alignItems: 'center' }}>
                {form.participantIds.map(id => {
                  const p = profileMap.get(id)
                  return p ? (
                    <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#F3F4F6', borderRadius: 5, padding: '2px 7px', fontSize: 11 }}>
                      {p.full_name}
                      <button onClick={() => setForm(f => ({ ...f, participantIds: f.participantIds.filter(x => x !== id) }))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0, lineHeight: 1 }}>×</button>
                    </div>
                  ) : null
                })}
                <select value="" onChange={e => {
                  const v = e.target.value
                  if (v && !form.participantIds.includes(v)) setForm(f => ({ ...f, participantIds: [...f.participantIds, v] }))
                }} style={{ border: 'none', background: 'none', fontSize: 12, color: '#9CA3AF', cursor: 'pointer', outline: 'none' }}>
                  <option value="">+ Afegir persona...</option>
                  {profiles.filter(p => !form.participantIds.includes(p.id)).map(p => (
                    <option key={p.id} value={p.id}>{p.full_name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Client + Project */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label style={lbl}>Client</label>
                <select value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value, projectId: '' }))} style={sel}>
                  <option value="">Sense client</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Projecte</label>
                <select value={form.projectId} onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))} style={sel} disabled={!form.clientId}>
                  <option value="">Sense projecte</option>
                  {filteredProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>

            {/* Type + Location */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label style={lbl}>Tipus</label>
                <select value={form.meetingType} onChange={e => setForm(f => ({ ...f, meetingType: e.target.value as MeetType }))} style={sel}>
                  {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Format</label>
                <select value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value as MeetLocation }))} style={sel}>
                  {Object.entries(LOC_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={lbl}>Descripció</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2} placeholder="Objectiu de la reunió..."
                style={{ ...inp, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }} />
            </div>

            {/* Agenda */}
            <div>
              <label style={lbl}>Agenda</label>
              <textarea value={form.agenda} onChange={e => setForm(f => ({ ...f, agenda: e.target.value }))}
                rows={3} placeholder={'1. Resultats del mes\n2. Pròxims continguts\n3. Tasques pendents'}
                style={{ ...inp, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }} />
            </div>

            {/* Recurrence */}
            <div>
              <label style={lbl}>Repetició</label>
              <select value={form.recurrence} onChange={e => setForm(f => ({ ...f, recurrence: e.target.value }))} style={sel}>
                <option value="none">No es repeteix</option>
                <option value="daily">Cada dia</option>
                <option value="weekly">Cada setmana</option>
                <option value="monthly">Cada mes</option>
              </select>
            </div>

            {form.location === 'google_meet' && !gcalOn && (
              <div style={{ background: '#FEF9C3', border: '1px solid #FDE047', borderRadius: 7, padding: '8px 12px', fontSize: 11, color: '#713F12' }}>
                Connecta Google Calendar per generar l'enllaç de Meet automàticament.
              </div>
            )}

            {createErr && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 7, padding: '8px 12px', fontSize: 12, color: '#DC2626' }}>
                {createErr}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '12px 18px', borderTop: '1px solid #EBEBEB', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button onClick={() => setShowModal(false)}
              style={{ padding: '8px 16px', background: '#F5F5F5', border: 'none', borderRadius: 7, fontSize: 12, cursor: 'pointer' }}>
              Cancel·lar
            </button>
            <button onClick={submitMeeting} disabled={creating}
              style={{ padding: '8px 16px', background: '#1B2B4B', color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: creating ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              {creating ? <><Loader2 size={12} className="spin" /> Creant...</> : editTarget ? 'Guardar canvis' : 'Crear reunió'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Inline styles for form elements ──
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.3px' }
  const inp: React.CSSProperties = { width: '100%', padding: '7px 9px', border: '1px solid #EBEBEB', borderRadius: 6, fontSize: 12, boxSizing: 'border-box', outline: 'none' }
  const sel: React.CSSProperties = { width: '100%', padding: '7px 9px', border: '1px solid #EBEBEB', borderRadius: 6, fontSize: 12, background: '#fff' }

  // ─────────────────────────────────────────────
  // Main render
  // ─────────────────────────────────────────────
  const todayEvCount = allEvents.filter(e => sameDay(e.start, today) && e.status !== 'cancelled').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: isMobile ? '100dvh' : 'calc(100vh - 60px)', background: '#F8F8F8', overflow: 'hidden' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 10, padding: isMobile ? '10px 12px' : '10px 18px', background: '#fff', borderBottom: '1px solid #EBEBEB', flexShrink: 0, flexWrap: 'wrap' }}>
        <button className="cal-btn-primary" onClick={() => openCreate()}>
          <Plus size={13} /> {!isMobile && 'Nova reunió'}
        </button>

        {!isMobile && <div style={{ width: 1, height: 22, background: '#EBEBEB' }} />}

        <button className="cal-nav" onClick={() => navigate(-1)}><ChevronLeft size={15} /></button>
        <button className="cal-nav" onClick={() => navigate(1)}><ChevronRight size={15} /></button>
        {!isMobile && <button className="cal-today" onClick={() => setCurDate(new Date())}>Avui</button>}

        <span style={{ fontSize: isMobile ? 12 : 13, fontWeight: 700, color: '#111', marginLeft: 2, flex: isMobile ? 1 : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{navLabel}</span>

        <div style={{ marginLeft: isMobile ? 0 : 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* View selector */}
          <div style={{ display: 'flex', background: '#F5F5F5', borderRadius: 7, padding: 2, gap: 1 }}>
            {(isMobile ? ['agenda', 'day'] as const : ['week', 'month', 'day', 'agenda'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                style={{ padding: isMobile ? '4px 9px' : '3px 10px', border: 'none', borderRadius: 5, fontSize: 11, cursor: 'pointer', background: view === v ? '#fff' : 'transparent', fontWeight: view === v ? 700 : 400, color: view === v ? '#111' : '#9CA3AF', boxShadow: view === v ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
                {{ week: 'Setmana', month: 'Mes', day: 'Dia', agenda: 'Agenda' }[v]}
              </button>
            ))}
          </div>

          {/* GCal badge */}
          {gcalOn ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button className="cal-gcal-badge" onClick={fetchGcal} title="Sincronitzar"
                style={gcalErr ? { borderColor: '#FECACA', background: '#FEF2F2', color: '#DC2626' } : undefined}>
                {loadingGcal ? <Loader2 size={11} className="spin" /> : <RefreshCw size={11} />}
                {!isMobile && (gcalErr ? 'Error GCal' : `Google Calendar${gcalRaw.length > 0 ? ` (${gcalRaw.length})` : ''}`)}
              </button>
              <a href="/api/calendar/disconnect" className="cal-gcal-x" title="Desconnectar">✕</a>
            </div>
          ) : (
            <a href="/api/auth/google-calendar"
              style={{ display: 'flex', alignItems: 'center', gap: 6, height: 28, padding: '0 10px', background: '#fff', border: '1px solid #EBEBEB', borderRadius: 7, fontSize: 11, color: '#111', textDecoration: 'none' }}>
              <svg width="12" height="12" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              {!isMobile && 'Connectar'}
            </a>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Left sidebar (desktop only) ── */}
        {!isMobile && <div style={{ width: 188, borderRight: '1px solid #EBEBEB', background: '#fff', padding: '14px 12px', overflow: 'auto', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Team filters */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>Equip</div>
            {profiles.map(p => {
              const color = colorMap.get(p.id) || '#888'
              const active = activeMembers.size === 0 || activeMembers.has(p.id)
              return (
                <div key={p.id}
                  onClick={() => setActiveMembers(prev => {
                    const n = new Set(prev)
                    if (n.has(p.id)) n.delete(p.id); else n.add(p.id)
                    return n
                  })}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px', borderRadius: 6, cursor: 'pointer', opacity: active ? 1 : 0.35, marginBottom: 2 }}>
                  <div style={{ width: 9, height: 9, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.full_name}</span>
                </div>
              )
            })}
            {activeMembers.size > 0 && (
              <button onClick={() => setActiveMembers(new Set())}
                style={{ marginTop: 5, fontSize: 10, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>
                Mostrar tots
              </button>
            )}
          </div>

          {/* Today summary */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>
              Avui {todayEvCount > 0 && <span style={{ background: '#1B2B4B', color: '#fff', borderRadius: 8, padding: '1px 5px', fontSize: 9 }}>{todayEvCount}</span>}
            </div>
            {(() => {
              const todayEvs = allEvents.filter(e => sameDay(e.start, today) && e.status !== 'cancelled').slice(0, 6)
              if (todayEvs.length === 0) return <div style={{ fontSize: 11, color: '#D1D5DB' }}>Sense reunions</div>
              return todayEvs.map(e => (
                <div key={e.id} onClick={() => setSelected(e)} style={{ cursor: 'pointer', marginBottom: 7, borderLeft: `2px solid ${e.color}`, paddingLeft: 7 }}>
                  <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600 }}>{fmtTime(e.start)}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#111', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</div>
                </div>
              ))
            })()}
          </div>
        </div>}

        {/* ── Calendar area ── */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {view === 'week' && renderWeek()}
          {view === 'month' && renderMonth()}
          {view === 'day' && renderDay()}
          {view === 'agenda' && renderAgenda()}
        </div>

        {/* ── Detail panel (desktop: sidebar, mobile: bottom sheet via fixed position) ── */}
        {!isMobile && renderDetail()}
      </div>
      {isMobile && renderDetail()}

      {/* ── Modal ── */}
      {renderModal()}

      <style>{`
        .cal-btn-primary { display:inline-flex;align-items:center;gap:5px;height:34px;padding:0 14px;background:linear-gradient(135deg,#1B2B4B,#2563EB);color:#fff;border:none;border-radius:10px;font-size:12.5px;font-weight:700;cursor:pointer;white-space:nowrap;box-shadow:0 2px 8px rgba(37,99,235,0.3);transition:all 0.2s ease; }
        .cal-btn-primary:hover { background:linear-gradient(135deg,#0F1E33,#1D4ED8);box-shadow:0 4px 14px rgba(37,99,235,0.38);transform:translateY(-1px); }
        .cal-nav { display:flex;align-items:center;justify-content:center;width:30px;height:30px;background:white;border:1px solid rgba(0,0,0,0.08);border-radius:9px;cursor:pointer;color:#5C6B80;box-shadow:0 1px 3px rgba(0,0,0,0.05);transition:all 0.2s ease; }
        .cal-nav:hover { background:#F5F8FF;border-color:rgba(37,99,235,0.2);color:#1B2B4B;box-shadow:0 2px 6px rgba(0,0,0,0.08); }
        .cal-today { height:30px;padding:0 11px;background:white;border:1px solid rgba(0,0,0,0.08);border-radius:9px;font-size:11.5px;cursor:pointer;color:#5C6B80;box-shadow:0 1px 3px rgba(0,0,0,0.05);transition:all 0.2s ease;font-family:inherit;font-weight:500; }
        .cal-today:hover { background:#F5F8FF;border-color:rgba(37,99,235,0.2);color:#1B2B4B; }
        .cal-gcal-badge { display:inline-flex;align-items:center;gap:5px;height:26px;padding:0 10px;background:#EFF6FF;border:1px solid #BFDBFE;border-radius:7px;font-size:11px;color:#1d4ed8;cursor:pointer; }
        .cal-gcal-badge:hover { background:#DBEAFE; }
        .cal-gcal-x { display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;background:transparent;border:none;border-radius:4px;font-size:10px;color:#94a3b8;cursor:pointer;text-decoration:none; }
        .cal-gcal-x:hover { background:#FEE2E2;color:#dc2626; }
        .spin { animation:spin 1s linear infinite; }
        @keyframes spin { to { transform:rotate(360deg); } }
        .cev { transition: opacity 0.1s; }
        .cev:hover { opacity: 0.85; }
        @media (max-width: 767px) {
          .cal-btn-primary span { display: none; }
          .cal-today { display: none; }
        }
      `}</style>
    </div>
  )
}
