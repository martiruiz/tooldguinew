'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, FileText, Upload, Trash2, Loader2, Camera, Video, Image, Mic, X,
  Download, Pencil, Plus, ChevronDown, Check, FileUp,
} from 'lucide-react'
import { DurantPanel, DEFAULT_DURANT_DATA, type DurantData, type DurantPanelHandle, type ShotItem } from './DurantPanel'
import { PostPanel, DEFAULT_POST_DATA, type PostData } from './PostPanel'

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserProfile { id: string; full_name: string; avatar_url?: string }

interface Deliverable {
  id: string
  contingut: string
  format: string
  quantitat: number
  responsable: string
  estat: 'pendent' | 'en_edicio' | 'revisat' | 'publicat'
}

interface Equip {
  fotografa: string
  videografa: string
  content_creator: string
  editor: string
  social_media: string
  host: string
  altres: string
}

interface ChecklistSections {
  preproducio: Record<string, boolean>
  produccio: Record<string, boolean>
  logistica: Record<string, boolean>
}

interface Briefing {
  objectiu: string
  localitzacio: string
  contacte_client: string
  prioritat: string
  pressupost: string
  duracio: string
  missatges: string
  cta: string
  plataformes: string
  equip?: Equip
  deliverables?: Deliverable[]
  checklist_sections?: ChecklistSections
  // legacy fields kept for backward compat reads
  [key: string]: any
}

interface Session {
  id: string
  client_id: string
  session_date: string
  session_types: string[]
  responsible?: string | null
  hours: number
  notes: string | null
  start_time?: string | null
  end_time?: string | null
  status?: string | null
  previa_pdf_url?: string | null
  previa_pdf_name?: string | null
  previa_briefing?: Briefing | null
  durant_notes?: string | null
  durant_data?: DurantData | null
  post_data?: PostData | null
  post_material_url?: string | null
  post_material_name?: string | null
  created_by: string
  created_at: string
  client?: { id: string; name: string }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SESSION_STATUS = [
  { value: 'planificada',     label: 'Planificada',     dot: '#6366F1', bg: '#EEF2FF', color: '#4F46E5' },
  { value: 'preparacio',      label: 'Preparació',      dot: '#F59E0B', bg: '#FFFBEB', color: '#D97706' },
  { value: 'en_produccio',    label: 'En producció',    dot: '#0EA5E9', bg: '#F0F9FF', color: '#0284C7' },
  { value: 'edicio',          label: 'Edició',          dot: '#8B5CF6', bg: '#F5F3FF', color: '#7C3AED' },
  { value: 'revisio_client',  label: 'Revisió client',  dot: '#F97316', bg: '#FFF7ED', color: '#EA580C' },
  { value: 'programada',      label: 'Programada',      dot: '#10B981', bg: '#ECFDF5', color: '#059669' },
  { value: 'publicada',       label: 'Publicada',       dot: '#16A34A', bg: '#F0FDF4', color: '#15803D' },
  { value: 'tancada',         label: 'Tancada',         dot: '#9CA3AF', bg: '#F9FAFB', color: '#6B7280' },
]

const DELIVERABLE_FORMATS = ['Reel', 'Story', 'Post', 'Carrusel', 'Foto', 'Vídeo', 'Entrevista', 'YouTube', 'Podcast', 'B-roll', 'Altre']

const DELIVERABLE_ESTAT_CFG: Record<string, { label: string; color: string; bg: string }> = {
  pendent:   { label: 'Pendent',   color: '#DC2626', bg: '#FEF2F2' },
  en_edicio: { label: 'En edició', color: '#D97706', bg: '#FFFBEB' },
  revisat:   { label: 'Revisat',   color: '#0EA5E9', bg: '#F0F9FF' },
  publicat:  { label: 'Publicat',  color: '#16A34A', bg: '#F0FDF4' },
}

const EQUIP_ROLES: { key: keyof Equip; label: string }[] = [
  { key: 'fotografa',       label: 'Fotògraf/a' },
  { key: 'videografa',      label: 'Videògraf/a' },
  { key: 'content_creator', label: 'Content creator' },
  { key: 'editor',          label: 'Editor/a' },
  { key: 'social_media',    label: 'Social media' },
  { key: 'host',            label: 'Host / presentador' },
  { key: 'altres',          label: 'Altres' },
]

const CL_PREPRODUCIO = [
  { key: 'briefing_revisat',     label: 'Briefing revisat' },
  { key: 'objectius_definits',   label: 'Objectius definits' },
  { key: 'deliverables_definits',label: 'Deliverables definits' },
  { key: 'guions_preparats',     label: 'Guions preparats' },
  { key: 'referencies_aprovades',label: 'Referències creatives aprovades' },
]
const CL_PRODUCCIO = [
  { key: 'cameras',     label: 'Càmeres' },
  { key: 'optiques',    label: 'Òptiques' },
  { key: 'bateries',    label: 'Bateries' },
  { key: 'targetes',    label: 'Targetes' },
  { key: 'tripodes',    label: 'Trípodes' },
  { key: 'micros',      label: 'Micros' },
  { key: 'illuminacio', label: 'Il·luminació' },
  { key: 'atrezzo',     label: 'Atrezzo' },
  { key: 'assets_logos',label: 'Assets / logos' },
]
const CL_LOGISTICA = [
  { key: 'localitzacio',   label: 'Localització confirmada' },
  { key: 'horaris',        label: 'Horaris confirmats' },
  { key: 'participants',   label: 'Participants confirmats' },
  { key: 'permisos',       label: 'Permisos' },
  { key: 'aparcament',     label: 'Aparcament / accés' },
  { key: 'contacte_client',label: 'Contacte client informat' },
]

const DEFAULT_CHECKLIST_SECTIONS: ChecklistSections = {
  preproducio: Object.fromEntries(CL_PREPRODUCIO.map(c => [c.key, false])),
  produccio:   Object.fromEntries(CL_PRODUCCIO.map(c => [c.key, false])),
  logistica:   Object.fromEntries(CL_LOGISTICA.map(c => [c.key, false])),
}

const DEFAULT_EQUIP: Equip = { fotografa: '', videografa: '', content_creator: '', editor: '', social_media: '', host: '', altres: '' }

const SESSION_TYPES = [
  { value: 'foto',    label: 'Foto',    icon: Camera,   color: '#254067' },
  { value: 'video',   label: 'Vídeo',   icon: Video,    color: '#3a6fa8' },
  { value: 'reels',   label: 'Reels',   icon: Video,    color: '#EC4899' },
  { value: 'stories', label: 'Stories', icon: Image,    color: '#F59E0B' },
  { value: 'copy',    label: 'Copy',    icon: FileText, color: '#10B981' },
  { value: 'podcast', label: 'Podcast', icon: Mic,      color: '#EF4444' },
  { value: 'altre',   label: 'Altre',   icon: FileText, color: '#6B7280' },
]

type Phase = 'previa' | 'durant' | 'post'

interface FileItem { url: string; name: string }

function parseFiles(url: string | null, name: string | null): FileItem[] {
  if (!url) return []
  if (url.startsWith('[')) { try { return JSON.parse(url) } catch { return [] } }
  return [{ url, name: name || 'Document' }]
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────

function StatusBadge({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const cfg = SESSION_STATUS.find(s => s.value === value) || SESSION_STATUS[0]
  return (
    <div style={{ position: 'relative' }}>
      <button
        className="sdp-status-btn"
        style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.color + '40' }}
        onClick={() => setOpen(v => !v)}
      >
        <span className="sdp-status-dot" style={{ background: cfg.dot }} />
        {cfg.label}
        <ChevronDown size={12} style={{ opacity: 0.6 }} />
      </button>
      {open && (
        <>
          <div className="sdp-status-overlay" onClick={() => setOpen(false)} />
          <div className="sdp-status-dropdown">
            {SESSION_STATUS.map(s => (
              <button
                key={s.value}
                className="sdp-status-option"
                style={{ color: value === s.value ? s.color : undefined }}
                onClick={() => { onChange(s.value); setOpen(false) }}
              >
                <span className="sdp-status-dot" style={{ background: s.dot }} />
                {s.label}
                {value === s.value && <Check size={12} style={{ marginLeft: 'auto', color: s.color }} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── ProfileSelect ────────────────────────────────────────────────────────────

function ProfileSelect({ value, onChange, profiles, placeholder = 'Selecciona...' }: {
  value: string; onChange: (v: string) => void; profiles: UserProfile[]; placeholder?: string
}) {
  return (
    <select
      className="sdp-brief-select"
      value={value}
      onChange={e => onChange(e.target.value)}
    >
      <option value="">{placeholder}</option>
      {profiles.map(p => <option key={p.id} value={p.full_name}>{p.full_name}</option>)}
    </select>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SessionDetailPage({
  session: initialSession,
  profiles = [],
}: {
  session: Session
  profiles?: UserProfile[]
}) {
  const router = useRouter()
  const [session, setSession] = useState(initialSession)
  const [activePhase, setActivePhase] = useState<Phase>('previa')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewPdf, setPreviewPdf] = useState<{ url: string; name: string } | null>(null)
  const [editHeader, setEditHeader] = useState(false)
  const [editTypes, setEditTypes] = useState<string[]>(initialSession.session_types || [])
  const [editResponsible, setEditResponsible] = useState(initialSession.responsible || '')
  const [statusSaving, setStatusSaving] = useState(false)

  // Status
  const [status, setStatus] = useState(initialSession.status || 'planificada')

  // Files
  const [previaFiles, setPreviaFiles] = useState<FileItem[]>(() =>
    parseFiles(initialSession.previa_pdf_url || null, initialSession.previa_pdf_name || null)
  )
  const [durantNotes, setDurantNotes] = useState(initialSession.durant_notes || '')
  const previaInputRef = useRef<HTMLInputElement>(null)
  const planImportRef = useRef<HTMLInputElement>(null)
  const durantRef = useRef<DurantPanelHandle>(null)
  const [importingPlan, setImportingPlan] = useState(false)
  const [planImportError, setPlanImportError] = useState<string | null>(null)

  const importPlanFromFile = async (file: File) => {
    setImportingPlan(true)
    setPlanImportError(null)
    try {
      // 1. Upload PDF to storage so it appears in the documents list
      const uploadForm = new FormData()
      uploadForm.append('file', file)
      uploadForm.append('sessionId', session.id)
      uploadForm.append('phase', 'previa')
      const uploadRes = await fetch('/api/check/sessions/upload', { method: 'POST', body: uploadForm })
      const uploadJson = await uploadRes.json()
      if (uploadJson.error) { setPlanImportError(uploadJson.error); return }
      const newFile: FileItem = { url: uploadJson.url, name: uploadJson.name }
      const updatedFiles = [...previaFiles, newFile]
      setPreviaFiles(updatedFiles)

      // 2. Parse the PDF to extract the shot list
      const parseForm = new FormData()
      parseForm.append('file', file)
      const parseRes = await fetch('/api/check/sessions/parse-pdf', { method: 'POST', body: parseForm })
      const parseJson = await parseRes.json()
      if (parseJson.error) { setPlanImportError(parseJson.error); return }
      const shots: ShotItem[] = parseJson.shots || []
      if (!shots.length) { setPlanImportError('No s\'ha trobat cap contingut al PDF'); return }

      // 3. Merge shots with existing durant_data and persist to DB
      const existingDurant: DurantData = {
        ...DEFAULT_DURANT_DATA,
        ...session.durant_data,
        shot_list: session.durant_data?.shot_list || [],
        incidencies: { ...DEFAULT_DURANT_DATA.incidencies, ...(session.durant_data?.incidencies || {}) },
        idees: session.durant_data?.idees || [],
      }
      const updatedDurant: DurantData = {
        ...existingDurant,
        shot_list: [...existingDurant.shot_list, ...shots],
      }
      await savePhase({
        previa_pdf_url: updatedFiles.length > 0 ? JSON.stringify(updatedFiles) : null,
        previa_pdf_name: null,
        durant_data: updatedDurant,
      })
    } finally { setImportingPlan(false) }
  }

  // Briefing – info general
  const [objectiu, setObjectiu]           = useState(initialSession.previa_briefing?.objectiu || '')
  const [localitzacio, setLocalitzacio]   = useState(initialSession.previa_briefing?.localitzacio || initialSession.previa_briefing?.data_localitzacio || '')
  const [duracio, setDuracio]             = useState(initialSession.previa_briefing?.duracio || '')

  // Briefing – objectius contingut
  const [missatges, setMissatges] = useState(initialSession.previa_briefing?.missatges || '')
  const [cta, setCta]             = useState(initialSession.previa_briefing?.cta || '')
  const [plataformes, setPlataformes] = useState<string[]>(() => {
    const raw = initialSession.previa_briefing?.plataformes || ''
    if (!raw) return []
    if (raw.startsWith('[')) { try { return JSON.parse(raw) } catch { return [] } }
    return raw.split(',').map((s: string) => s.trim()).filter(Boolean)
  })

  // Equip
  const [equip, setEquip] = useState<Equip>(() => {
    const saved = initialSession.previa_briefing?.equip
    if (saved) return { ...DEFAULT_EQUIP, ...saved }
    return {
      ...DEFAULT_EQUIP,
      fotografa: initialSession.previa_briefing?.fotografa || '',
      videografa: initialSession.previa_briefing?.video || '',
      social_media: initialSession.previa_briefing?.social_media || '',
    }
  })

  // Deliverables
  const [deliverables, setDeliverables] = useState<Deliverable[]>(
    () => initialSession.previa_briefing?.deliverables || []
  )

  // Checklist sections
  const [cl, setCl] = useState<ChecklistSections>(() => ({
    preproducio: { ...DEFAULT_CHECKLIST_SECTIONS.preproducio, ...initialSession.previa_briefing?.checklist_sections?.preproducio },
    produccio:   { ...DEFAULT_CHECKLIST_SECTIONS.produccio,   ...initialSession.previa_briefing?.checklist_sections?.produccio },
    logistica:   { ...DEFAULT_CHECKLIST_SECTIONS.logistica,   ...initialSession.previa_briefing?.checklist_sections?.logistica },
  }))

  const [briefingSaving, setBriefingSaving] = useState(false)
  const [briefingAutoSave, setBriefingAutoSave] = useState<'idle' | 'saving' | 'saved'>('idle')
  const briefingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const briefingFirstRender = useRef(true)
  const briefingDepsRef = useRef({ objectiu, localitzacio, missatges, cta, plataformes, equip, deliverables, cl })

  useEffect(() => {
    briefingDepsRef.current = { objectiu, localitzacio, missatges, cta, plataformes, equip, deliverables, cl }
  })

  useEffect(() => {
    if (briefingFirstRender.current) { briefingFirstRender.current = false; return }
    if (briefingTimerRef.current) clearTimeout(briefingTimerRef.current)
    setBriefingAutoSave('idle')
    briefingTimerRef.current = setTimeout(async () => {
      const deps = briefingDepsRef.current
      setBriefingAutoSave('saving')
      try {
        await fetch(`/api/check/sessions/${session.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            previa_briefing: {
              objectiu: deps.objectiu, localitzacio: deps.localitzacio,
              missatges: deps.missatges, cta: deps.cta,
              plataformes: JSON.stringify(deps.plataformes),
              equip: deps.equip, deliverables: deps.deliverables,
              checklist_sections: deps.cl,
            },
          }),
        })
        setBriefingAutoSave('saved')
        setTimeout(() => setBriefingAutoSave('idle'), 2000)
      } catch { setBriefingAutoSave('idle') }
    }, 1500)
  }, [objectiu, localitzacio, missatges, cta, plataformes, equip, deliverables, cl])

  // ─── Computed stats ────────────────────────────────────────────────────────

  const clTotal = CL_PREPRODUCIO.length + CL_PRODUCCIO.length + CL_LOGISTICA.length
  const clDone = [
    ...CL_PREPRODUCIO.map(c => cl.preproducio[c.key]),
    ...CL_PRODUCCIO.map(c => cl.produccio[c.key]),
    ...CL_LOGISTICA.map(c => cl.logistica[c.key]),
  ].filter(Boolean).length

  const delivsDone = deliverables.filter(d => d.estat === 'publicat').length

  const teamCount = EQUIP_ROLES.filter(r => equip[r.key]?.trim()).length

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const fmtDate = (iso: string) => {
    const d = new Date(iso + 'T12:00:00')
    return d.toLocaleDateString('ca-ES', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const timeStr = (() => {
    if (session.start_time) {
      const s = session.start_time.slice(0, 5)
      const e = session.end_time?.slice(0, 5)
      return e ? `${s}–${e}` : s
    }
    return session.hours > 0 ? `${session.hours}h` : ''
  })()

  // ─── Status save ──────────────────────────────────────────────────────────

  const saveStatus = useCallback(async (val: string) => {
    setStatus(val)
    setStatusSaving(true)
    try {
      await fetch(`/api/check/sessions/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: val }),
      })
    } finally { setStatusSaving(false) }
  }, [session.id])

  // ─── Upload ───────────────────────────────────────────────────────────────

  const savePhase = useCallback(async (body: Record<string, any>) => {
    setSaving(true); setError(null)
    try {
      const res = await fetch(`/api/check/sessions/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (json.error) { setError(json.error); return false }
      if (json.session) setSession(json.session as Session)
      return true
    } catch { setError('Error de connexió'); return false }
    finally { setSaving(false) }
  }, [session.id])

  // ─── Briefing save ────────────────────────────────────────────────────────

  const saveBriefing = async () => {
    setBriefingSaving(true); setError(null)
    const body = {
      previa_briefing: {
        objectiu, localitzacio,
        missatges, cta, plataformes: JSON.stringify(plataformes),
        equip,
        deliverables,
        checklist_sections: cl,
      },
    }
    try {
      const res = await fetch(`/api/check/sessions/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (json.error) setError(json.error)
      if (json.session) setSession(json.session as Session)
    } finally { setBriefingSaving(false) }
  }

  // ─── Header save ─────────────────────────────────────────────────────────

  const saveHeader = async () => {
    setSaving(true); setError(null)
    try {
      const res = await fetch(`/api/check/sessions/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_types: editTypes, responsible: editResponsible || null }),
      })
      const json = await res.json()
      if (json.error) { setError(json.error); return }
      if (json.session) setSession(json.session as Session)
      setEditHeader(false)
    } finally { setSaving(false) }
  }

  // ─── Deliverables ─────────────────────────────────────────────────────────

  const addDeliverable = () => setDeliverables(prev => [...prev, {
    id: `d-${Date.now()}`, contingut: '', format: 'Reel', quantitat: 1, responsable: '', estat: 'pendent'
  }])
  const updateDeliverable = (i: number, patch: Partial<Deliverable>) =>
    setDeliverables(prev => prev.map((d, idx) => idx === i ? { ...d, ...patch } : d))
  const removeDeliverable = (i: number) => setDeliverables(prev => prev.filter((_, idx) => idx !== i))

  // ─── Checklist ───────────────────────────────────────────────────────────

  const toggleCl = (section: keyof ChecklistSections, key: string) =>
    setCl(prev => ({ ...prev, [section]: { ...prev[section], [key]: !prev[section][key] } }))

  // ─── JSX ─────────────────────────────────────────────────────────────────

  const types = Array.isArray(session.session_types) ? session.session_types : []

  return (
    <div className="sdp-wrap">
      {/* Back */}
      <div className="sdp-topbar">
        <button className="sdp-back" onClick={() => router.back()}>
          <ArrowLeft size={15} strokeWidth={2.2} />
          Tornar a sessions
        </button>
        {statusSaving && <span style={{ fontSize: 12, color: '#9CA3AF', marginLeft: 12 }}>Guardant...</span>}
      </div>

      <div className="sdp-card">
        {/* ── Header ── */}
        <div className="sdp-header">
          <div className="sdp-header-row1">
            <div className="sdp-client">{session.client?.name || '—'}</div>
            <StatusBadge value={status} onChange={saveStatus} />
          </div>

          <div className="sdp-date-line">
            {fmtDate(session.session_date)}
            {timeStr && ` · ${timeStr}`}
            {localitzacio && ` · ${localitzacio}`}
          </div>

          {/* Edit header mode */}
          {editHeader ? (
            <div className="sdp-edit-header">
              <div className="sdp-edit-section">
                <div className="sdp-brief-label">Tipus de contingut</div>
                <div className="sdp-type-toggle-row">
                  {SESSION_TYPES.filter(t => t.value !== 'altre').map(t => {
                    const active = editTypes.includes(t.value)
                    return (
                      <button
                        key={t.value}
                        className={`sdp-type-toggle${active ? ' sdp-type-toggle--on' : ''}`}
                        style={active ? { background: t.color + '18', color: t.color, borderColor: t.color + '60' } : {}}
                        onClick={() => setEditTypes(prev =>
                          prev.includes(t.value) ? prev.filter(x => x !== t.value) : [...prev, t.value]
                        )}
                      >
                        <t.icon size={11} /> {t.label}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="sdp-edit-section">
                <div className="sdp-brief-label">Responsable</div>
                <ProfileSelect
                  value={editResponsible}
                  onChange={setEditResponsible}
                  profiles={profiles}
                  placeholder="Selecciona responsable..."
                />
              </div>
              <div className="sdp-edit-btns">
                <button className="sdp-edit-save" onClick={saveHeader} disabled={saving}>Desar</button>
                <button className="sdp-edit-cancel" onClick={() => {
                  setEditTypes(session.session_types || [])
                  setEditResponsible(session.responsible || '')
                  setEditHeader(false)
                }}>Cancel·lar</button>
              </div>
            </div>
          ) : (
            <div className="sdp-header-meta">
              <div className="sdp-meta-row">
                {session.responsible && (
                  <div className="sdp-meta-chip">
                    <span className="sdp-meta-label">Responsable</span>
                    <span className="sdp-meta-value">{session.responsible}</span>
                  </div>
                )}
                {session.client?.name && (
                  <div className="sdp-meta-chip">
                    <span className="sdp-meta-label">Client</span>
                    <span className="sdp-meta-value">{session.client.name}</span>
                  </div>
                )}
                {session.notes && (
                  <div className="sdp-meta-chip">
                    <span className="sdp-meta-label">Notes</span>
                    <span className="sdp-meta-value">{session.notes}</span>
                  </div>
                )}
              </div>
              <div className="sdp-types-row">
                {types.length > 0 && (
                  <div className="sdp-types">
                    {types.map(t => {
                      const ti = SESSION_TYPES.find(x => x.value === t) || SESSION_TYPES[SESSION_TYPES.length - 1]
                      return (
                        <span key={t} className="sdp-type-chip" style={{ background: ti.color + '18', color: ti.color }}>
                          <ti.icon size={11} />
                          {ti.label}
                        </span>
                      )
                    })}
                  </div>
                )}
                <button className="sdp-edit-hdr-btn" onClick={() => setEditHeader(true)}>
                  <Pencil size={12} /> Editar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Stats bar ── */}
        <div className="sdp-stats-bar">
          <div className="sdp-stat">
            <span className="sdp-stat-num">{deliverables.length}</span>
            <span className="sdp-stat-label">deliverables</span>
          </div>
          <div className="sdp-stat-sep" />
          <div className="sdp-stat">
            <span className="sdp-stat-num sdp-stat-num--green">{delivsDone}</span>
            <span className="sdp-stat-label">publicats</span>
          </div>
          <div className="sdp-stat-sep" />
          <div className="sdp-stat">
            <span className="sdp-stat-num">{clDone}<span style={{ fontSize: 11, fontWeight: 500, color: '#9CA3AF' }}>/{clTotal}</span></span>
            <span className="sdp-stat-label">preparació</span>
          </div>
          <div className="sdp-stat-sep" />
          <div className="sdp-stat">
            <span className="sdp-stat-num">{teamCount}</span>
            <span className="sdp-stat-label">persones equip</span>
          </div>
          {clTotal > 0 && (
            <>
              <div className="sdp-stat-sep sdp-stat-sep--hide-sm" />
              <div className="sdp-stat sdp-stat--progress sdp-stat--hide-sm">
                <div className="sdp-progress-track">
                  <div className="sdp-progress-fill" style={{ width: `${Math.round((clDone / clTotal) * 100)}%` }} />
                </div>
                <span className="sdp-stat-label">{Math.round((clDone / clTotal) * 100)}% preparat</span>
              </div>
            </>
          )}
        </div>

        {/* ── Phase tabs ── */}
        <div className="sdp-tabs">
          {([
            { key: 'previa', label: 'Prèvia', num: 1 },
            { key: 'durant', label: 'Durant', num: 2 },
            { key: 'post',   label: 'Post',   num: 3 },
          ] as { key: Phase; label: string; num: number }[]).map(p => (
            <button
              key={p.key}
              className={`sdp-tab${activePhase === p.key ? ' sdp-tab--active' : ''}`}
              onClick={() => setActivePhase(p.key)}
            >
              <span className="sdp-tab-num">{p.num}</span>
              {p.label}
            </button>
          ))}
        </div>

        {/* ── Phase body ── */}
        <div className="sdp-phase-body">
          {error && <div className="sdp-error">{error}</div>}

          {/* ──── PRÈVIA ──── */}
          {activePhase === 'previa' && (
            <div className="sdp-section">

              {/* Documents */}
              <div className="sdp-subsection">
                <div className="sdp-section-title">Documents</div>
                <p className="sdp-section-desc">Adjunta els documents de la sessió (PDFs, arxius, etc.)</p>
                {previaFiles.length > 0 && (
                  <div className="sdp-files-list">
                    {previaFiles.map((f, i) => (
                      <div key={i} className="sdp-file-row">
                        <FileText size={18} className="sdp-file-icon" />
                        <button className="sdp-file-name-btn" onClick={() => setPreviewPdf({ url: f.url, name: f.name })}>{f.name}</button>
                        <a href={f.url} download className="sdp-file-dl" title="Descarregar"><Download size={14} /></a>
                        <button className="sdp-file-remove" onClick={async () => {
                          const updated = previaFiles.filter((_, idx) => idx !== i)
                          setPreviaFiles(updated)
                          await savePhase({ previa_pdf_url: updated.length > 0 ? JSON.stringify(updated) : null, previa_pdf_name: null })
                        }} title="Eliminar"><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="sdp-upload-area" onClick={() => previaInputRef.current?.click()}>
                  {uploading ? <Loader2 size={24} className="sdp-spin" /> : <Upload size={24} />}
                  <span>{uploading ? 'Pujant...' : 'Afegir document'}</span>
                  <span className="sdp-upload-hint">PDF, Word, Excel… Màx. 50 MB</span>
                </div>
                <input
                  ref={previaInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,application/pdf,image/*"
                  style={{ display: 'none' }}
                  onChange={async e => {
                    const files = Array.from(e.target.files || [])
                    if (!files.length) return
                    setUploading(true); setError(null)
                    let accumulated = [...previaFiles]
                    for (const file of files) {
                      const form = new FormData()
                      form.append('file', file); form.append('sessionId', session.id); form.append('phase', 'previa')
                      const res = await fetch('/api/check/sessions/upload', { method: 'POST', body: form })
                      const json = await res.json()
                      if (json.error) { setError(json.error); break }
                      accumulated = [...accumulated, { url: json.url, name: json.name }]
                    }
                    setPreviaFiles(accumulated)
                    await savePhase({ previa_pdf_url: accumulated.length > 0 ? JSON.stringify(accumulated) : null, previa_pdf_name: null })
                    setUploading(false)
                    e.target.value = ''
                  }}
                />
              </div>

              {/* Import plan from PDF */}
              <div className="sdp-subsection">
                <div className="sdp-section-title">Importar pla de continguts</div>
                <p className="sdp-section-desc">Puja el PDF del pla de continguts per generar automàticament la shot list.</p>
                {planImportError && <div className="sdp-error">{planImportError}</div>}
                <button
                  className="sdp-import-plan-btn"
                  onClick={() => planImportRef.current?.click()}
                  disabled={importingPlan}
                >
                  {importingPlan ? <Loader2 size={14} className="sdp-spin" /> : <FileUp size={14} />}
                  {importingPlan ? 'Processant PDF...' : 'Importar pla (PDF)'}
                </button>
                <input
                  ref={planImportRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  style={{ display: 'none' }}
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) importPlanFromFile(file)
                    e.target.value = ''
                  }}
                />
              </div>

              <div className="sdp-divider" />

              {/* Informació general */}
              <div className="sdp-subsection">
                <div className="sdp-section-title">Informació general</div>
                <div className="sdp-brief-grid">
                  <div className="sdp-brief-field">
                    <label className="sdp-brief-label">Objectiu de la sessió</label>
                    <input className="sdp-brief-input" value={objectiu} onChange={e => setObjectiu(e.target.value)} placeholder="—" />
                  </div>
                  <div className="sdp-brief-field">
                    <label className="sdp-brief-label">Localització</label>
                    <input className="sdp-brief-input" value={localitzacio} onChange={e => setLocalitzacio(e.target.value)} placeholder="—" />
                  </div>
                </div>
              </div>

              <div className="sdp-divider" />

              {/* Equip */}
              <div className="sdp-subsection">
                <div className="sdp-section-title">Equip</div>
                <div className="sdp-brief-grid">
                  {EQUIP_ROLES.map(role => (
                    <div key={role.key} className="sdp-brief-field">
                      <label className="sdp-brief-label">{role.label}</label>
                      <ProfileSelect
                        value={equip[role.key]}
                        onChange={v => setEquip(prev => ({ ...prev, [role.key]: v }))}
                        profiles={profiles}
                        placeholder="—"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="sdp-divider" />

              {/* Deliverables */}
              <div className="sdp-subsection">
                <div className="sdp-deliverables-header">
                  <div className="sdp-section-title">Deliverables</div>
                  <div className="sdp-deliverables-summary">
                    {deliverables.length > 0 && (
                      <>
                        {Object.entries(DELIVERABLE_ESTAT_CFG).map(([k, cfg]) => {
                          const count = deliverables.filter(d => d.estat === k).length
                          if (!count) return null
                          return (
                            <span key={k} className="sdp-deliverable-count" style={{ color: cfg.color, background: cfg.bg }}>
                              {count} {cfg.label.toLowerCase()}
                            </span>
                          )
                        })}
                      </>
                    )}
                  </div>
                </div>

                {deliverables.length > 0 && (
                  <div className="sdp-table-wrap">
                    <table className="sdp-table">
                      <thead>
                        <tr>
                          <th>Contingut</th>
                          <th>Format</th>
                          <th style={{ width: 48, textAlign: 'center' }}>Q.</th>
                          <th>Responsable</th>
                          <th>Estat</th>
                          <th style={{ width: 32 }} />
                        </tr>
                      </thead>
                      <tbody>
                        {deliverables.map((d, i) => (
                          <tr key={d.id}>
                            <td>
                              <input
                                className="sdp-table-input"
                                value={d.contingut}
                                onChange={e => updateDeliverable(i, { contingut: e.target.value })}
                                placeholder="Reel presentació..."
                              />
                            </td>
                            <td>
                              <select className="sdp-table-select" value={d.format} onChange={e => updateDeliverable(i, { format: e.target.value })}>
                                {DELIVERABLE_FORMATS.map(f => <option key={f}>{f}</option>)}
                              </select>
                            </td>
                            <td>
                              <input
                                className="sdp-table-input sdp-table-input--num"
                                type="number"
                                min={1}
                                value={d.quantitat}
                                onChange={e => updateDeliverable(i, { quantitat: parseInt(e.target.value) || 1 })}
                              />
                            </td>
                            <td>
                              <ProfileSelect
                                value={d.responsable}
                                onChange={v => updateDeliverable(i, { responsable: v })}
                                profiles={profiles}
                                placeholder="—"
                              />
                            </td>
                            <td>
                              <select
                                className="sdp-table-select"
                                value={d.estat}
                                onChange={e => updateDeliverable(i, { estat: e.target.value as Deliverable['estat'] })}
                                style={{ color: DELIVERABLE_ESTAT_CFG[d.estat]?.color }}
                              >
                                {Object.entries(DELIVERABLE_ESTAT_CFG).map(([k, cfg]) => (
                                  <option key={k} value={k} style={{ color: cfg.color }}>{cfg.label}</option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <button className="sdp-row-del" onClick={() => removeDeliverable(i)} title="Eliminar">
                                <X size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <button className="sdp-add-row-btn" onClick={addDeliverable}>
                  <Plus size={13} /> Afegir deliverable
                </button>
              </div>

              <div className="sdp-divider" />

              {/* Objectius de contingut */}
              <div className="sdp-subsection">
                <div className="sdp-section-title">Objectius de contingut</div>
                <div className="sdp-brief-col">
                  {[
                    { label: 'Missatges que hem de transmetre', val: missatges, set: setMissatges },
                    { label: 'CTA necessària', val: cta, set: setCta },
                  ].map(({ label, val, set }) => (
                    <div key={label} className="sdp-brief-field">
                      <label className="sdp-brief-label">{label}</label>
                      <textarea
                        className="sdp-brief-textarea"
                        rows={2}
                        value={val}
                        onChange={e => set(e.target.value)}
                        placeholder="—"
                      />
                    </div>
                  ))}
                  <div className="sdp-brief-field">
                    <label className="sdp-brief-label">Plataformes on es publicarà</label>
                    <div className="sdp-plat-grid">
                      {['Instagram', 'TikTok', 'YouTube', 'Facebook', 'LinkedIn', 'X (Twitter)', 'Pinterest'].map(p => {
                        const active = plataformes.includes(p)
                        return (
                          <button
                            key={p}
                            type="button"
                            className={`sdp-plat-btn${active ? ' sdp-plat-btn--on' : ''}`}
                            onClick={() => setPlataformes(prev =>
                              prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
                            )}
                          >
                            {p}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="sdp-divider" />

              {/* Checklist amb seccions */}
              <div className="sdp-subsection">
                <div className="sdp-checklist-header">
                  <div className="sdp-section-title">Checklist</div>
                  <span className="sdp-cl-count">{clDone}/{clTotal}</span>
                </div>
                {clTotal > 0 && (
                  <div className="sdp-progress-track sdp-progress-track--lg">
                    <div className="sdp-progress-fill" style={{ width: `${Math.round((clDone / clTotal) * 100)}%` }} />
                  </div>
                )}

                {([
                  { key: 'preproducio' as const, label: 'Preproducció', items: CL_PREPRODUCIO },
                  { key: 'produccio'   as const, label: 'Producció',    items: CL_PRODUCCIO },
                  { key: 'logistica'  as const, label: 'Logística',    items: CL_LOGISTICA },
                ]).map(section => {
                  const sectionDone = section.items.filter(c => cl[section.key][c.key]).length
                  return (
                    <div key={section.key} className="sdp-cl-section">
                      <div className="sdp-cl-section-title">
                        {section.label}
                        <span className="sdp-cl-section-count">{sectionDone}/{section.items.length}</span>
                      </div>
                      <div className="sdp-checklist">
                        {section.items.map(item => (
                          <label key={item.key} className="sdp-check-row">
                            <input
                              type="checkbox"
                              className="sdp-check-input"
                              checked={!!cl[section.key][item.key]}
                              onChange={() => toggleCl(section.key, item.key)}
                            />
                            <span className={cl[section.key][item.key] ? 'sdp-check-label sdp-check-label--done' : 'sdp-check-label'}>
                              {item.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Autosave indicator */}
              {briefingAutoSave !== 'idle' && (
                <div className="sdp-autosave-indicator">
                  {briefingAutoSave === 'saving'
                    ? <><Loader2 size={12} className="sdp-spin" /> Guardant...</>
                    : <><Check size={12} /> Guardat</>}
                </div>
              )}
            </div>
          )}

          {/* ──── DURANT ──── */}
          {activePhase === 'durant' && (
            <DurantPanel
              ref={durantRef}
              sessionId={session.id}
              previaPdfUrl={previaFiles[0]?.url || null}
              initialData={{
                ...DEFAULT_DURANT_DATA,
                ...session.durant_data,
                shot_list: session.durant_data?.shot_list || [],
                incidencies: { ...DEFAULT_DURANT_DATA.incidencies, ...(session.durant_data?.incidencies || {}) },
                idees: session.durant_data?.idees || [],
              }}
              onSaved={d => setSession(s => ({ ...s, durant_data: d }))}
            />
          )}

          {/* ──── POST ──── */}
          {activePhase === 'post' && (
            <PostPanel
              sessionId={session.id}
              initialData={{
                material: { ...DEFAULT_POST_DATA.material, ...(session.post_data?.material || {}) },
                postproduccio: { ...DEFAULT_POST_DATA.postproduccio, ...(session.post_data?.postproduccio || {}) },
              }}
              onSaved={d => setSession(s => ({ ...s, post_data: d }))}
            />
          )}
        </div>
      </div>

      {/* PDF Preview overlay */}
      {previewPdf && (
        <div className="sdp-pdf-overlay" onClick={e => e.target === e.currentTarget && setPreviewPdf(null)}>
          <div className="sdp-pdf-panel">
            <div className="sdp-pdf-bar">
              <span className="sdp-pdf-title">{previewPdf.name}</span>
              <div className="sdp-pdf-actions">
                <a href={previewPdf.url} download className="sdp-pdf-dl-btn"><Download size={15} /> Descarregar</a>
                <button className="sdp-pdf-close" onClick={() => setPreviewPdf(null)}><X size={16} /></button>
              </div>
            </div>
            <iframe src={previewPdf.url} className="sdp-pdf-frame" title={previewPdf.name} />
          </div>
        </div>
      )}

      <style jsx>{`
        .sdp-wrap {
          flex: 1; overflow-y: auto;
          padding: 20px 28px 40px;
          display: flex; flex-direction: column; gap: 16px;
        }
        @media (max-width: 767px) { .sdp-wrap { padding: 14px 12px 80px; } }

        .sdp-topbar { display: flex; align-items: center; }

        .sdp-back {
          display: flex; align-items: center; gap: 6px;
          height: 34px; padding: 0 12px;
          border: 1px solid #E8E8E8; border-radius: 8px;
          background: white; font-size: 13px; font-weight: 500; color: #5C5C5C;
          cursor: pointer; font-family: inherit; transition: all 0.15s;
        }
        .sdp-back:hover { border-color: #D0D0D0; color: #0a0a0a; background: #F8F8F8; }

        .sdp-card {
          background: white; border: 1px solid rgba(0,0,0,0.06);
          border-radius: 18px; overflow: hidden;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
        }

        /* ── Header ── */
        .sdp-header {
          padding: 22px 28px 18px;
          border-bottom: 1px solid #F0F0F0;
          display: flex; flex-direction: column; gap: 8px;
        }
        @media (max-width: 767px) { .sdp-header { padding: 16px 18px 14px; } }

        .sdp-header-row1 {
          display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
        }

        .sdp-client {
          font-size: 22px; font-weight: 800; color: #0a0a0a;
          letter-spacing: -0.03em; line-height: 1.2;
        }
        @media (max-width: 480px) { .sdp-client { font-size: 18px; } }

        .sdp-date-line {
          font-size: 13px; color: #6B7280;
          text-transform: capitalize; line-height: 1.4;
        }

        /* Status button */
        :global(.sdp-status-btn) {
          display: flex; align-items: center; gap: 6px;
          height: 28px; padding: 0 10px;
          border: 1px solid; border-radius: 20px;
          font-size: 12px; font-weight: 700; cursor: pointer;
          font-family: inherit; white-space: nowrap; flex-shrink: 0;
          transition: opacity 0.15s;
        }
        :global(.sdp-status-btn:hover) { opacity: 0.85; }

        :global(.sdp-status-dot) {
          width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
        }

        :global(.sdp-status-overlay) {
          position: fixed; inset: 0; z-index: 50;
        }

        :global(.sdp-status-dropdown) {
          position: absolute; top: calc(100% + 6px); right: 0;
          background: white; border: 1px solid #E8E8E8; border-radius: 12px;
          box-shadow: 0 8px 28px rgba(0,0,0,0.12); z-index: 51;
          min-width: 180px; overflow: hidden; padding: 4px;
        }

        :global(.sdp-status-option) {
          display: flex; align-items: center; gap: 8px; width: 100%;
          padding: 8px 10px; border: none; background: none; cursor: pointer;
          font-size: 13px; font-weight: 500; font-family: inherit;
          color: #374151; border-radius: 8px; text-align: left;
          transition: background 0.1s;
        }
        :global(.sdp-status-option:hover) { background: #F5F5F5; }

        /* Header meta */
        .sdp-header-meta { display: flex; flex-direction: column; gap: 8px; }

        .sdp-meta-row { display: flex; flex-wrap: wrap; gap: 8px; }

        .sdp-meta-chip {
          display: flex; align-items: center; gap: 5px;
          background: #F5F6F8; border-radius: 8px; padding: 4px 10px;
          font-size: 12.5px;
        }

        .sdp-meta-label {
          font-size: 11px; font-weight: 700; color: #9A9A9A;
          text-transform: uppercase; letter-spacing: 0.05em;
        }

        .sdp-meta-value { font-weight: 600; color: #374151; }

        .sdp-types-row {
          display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
        }

        .sdp-types { display: flex; flex-wrap: wrap; gap: 6px; }

        .sdp-type-chip {
          display: flex; align-items: center; gap: 4px;
          padding: 3px 9px; border-radius: 20px; font-size: 11.5px; font-weight: 600;
        }

        .sdp-edit-hdr-btn {
          display: flex; align-items: center; gap: 4px;
          height: 26px; padding: 0 10px;
          border: 1px solid #E8E8E8; border-radius: 7px;
          background: white; font-size: 12px; font-weight: 500; color: #9A9A9A;
          cursor: pointer; font-family: inherit; transition: all 0.15s; white-space: nowrap;
        }
        .sdp-edit-hdr-btn:hover { border-color: #C0C0C0; color: #0a0a0a; }

        /* Edit header */
        .sdp-edit-header { display: flex; flex-direction: column; gap: 12px; }

        .sdp-edit-section { display: flex; flex-direction: column; gap: 6px; }

        .sdp-plat-grid { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 2px; }
        .sdp-plat-btn {
          padding: 5px 12px; border-radius: 20px; border: 1.5px solid #E0E0E0;
          background: white; font-size: 12px; font-weight: 500; color: #5C5C5C;
          cursor: pointer; font-family: inherit; transition: all 0.15s;
        }
        .sdp-plat-btn:hover { border-color: #C0C0C0; background: #F8F8F8; }
        .sdp-plat-btn--on {
          background: #EEF2FF; border-color: #6366F1; color: #4F46E5; font-weight: 600;
        }

        .sdp-type-toggle-row { display: flex; flex-wrap: wrap; gap: 6px; }

        .sdp-type-toggle {
          display: flex; align-items: center; gap: 5px;
          height: 28px; padding: 0 10px;
          border: 1px solid #E0E0E0; border-radius: 8px;
          background: white; font-size: 12.5px; font-weight: 500; color: #6B7280;
          cursor: pointer; font-family: inherit; transition: all 0.15s;
        }
        .sdp-type-toggle--on { font-weight: 700; }

        .sdp-edit-btns { display: flex; gap: 8px; margin-top: 4px; }

        .sdp-edit-save {
          height: 34px; padding: 0 16px; background: #1B2B4B; color: white;
          border: none; border-radius: 8px; font-size: 13px; font-weight: 600;
          cursor: pointer; font-family: inherit; transition: background 0.15s;
        }
        .sdp-edit-save:hover:not(:disabled) { background: #254067; }
        .sdp-edit-save:disabled { opacity: 0.5; cursor: not-allowed; }

        .sdp-edit-cancel {
          height: 34px; padding: 0 14px;
          border: 1px solid #E8E8E8; border-radius: 8px;
          background: white; font-size: 13px; font-weight: 500; color: #6B7280;
          cursor: pointer; font-family: inherit; transition: all 0.15s;
        }
        .sdp-edit-cancel:hover { border-color: #C0C0C0; color: #0a0a0a; }

        /* ── Stats bar ── */
        .sdp-stats-bar {
          display: flex; align-items: center; gap: 0;
          padding: 12px 28px;
          background: #FAFBFC; border-bottom: 1px solid #F0F0F0;
          overflow-x: auto;
        }
        @media (max-width: 767px) { .sdp-stats-bar { padding: 10px 18px; gap: 0; } }

        .sdp-stat {
          display: flex; flex-direction: column; align-items: center; gap: 2px;
          padding: 0 18px;
          white-space: nowrap;
        }
        @media (max-width: 480px) { .sdp-stat { padding: 0 12px; } }

        .sdp-stat--progress {
          flex-direction: row; gap: 8px; align-items: center;
          padding: 0 18px;
        }

        .sdp-stat-num {
          font-size: 20px; font-weight: 800; color: #0a0a0a;
          letter-spacing: -0.03em; line-height: 1.1;
        }
        .sdp-stat-num--green { color: #16A34A; }

        .sdp-stat-label {
          font-size: 10.5px; color: #9CA3AF; font-weight: 500;
          text-transform: uppercase; letter-spacing: 0.04em;
        }

        .sdp-stat-sep {
          width: 1px; height: 28px; background: #E8E8E8; flex-shrink: 0;
        }

        @media (max-width: 480px) {
          .sdp-stat-sep--hide-sm { display: none; }
          .sdp-stat--hide-sm { display: none; }
        }

        .sdp-progress-track {
          flex: 1; height: 5px; background: #E8E8E8; border-radius: 4px;
          overflow: hidden; min-width: 60px;
        }
        .sdp-progress-track--lg { height: 7px; border-radius: 4px; width: 100%; margin: 4px 0 2px; }

        .sdp-progress-fill {
          height: 100%; background: linear-gradient(90deg, #1B2B4B, #3B6FD4);
          border-radius: 4px; transition: width 0.4s ease;
        }

        /* ── Tabs ── */
        .sdp-tabs {
          display: flex; border-bottom: 1px solid #F0F0F0;
        }

        .sdp-tab {
          display: flex; align-items: center; gap: 7px;
          padding: 14px 22px; border: none; background: none;
          font-size: 13.5px; font-weight: 600; color: #9A9A9A;
          cursor: pointer; font-family: inherit; border-bottom: 2px solid transparent;
          transition: all 0.15s; white-space: nowrap;
        }
        .sdp-tab:hover { color: #0a0a0a; }
        .sdp-tab--active { color: #1B2B4B; border-bottom-color: #1B2B4B; }

        .sdp-tab-num {
          width: 20px; height: 20px; border-radius: 50%;
          background: #F0F0F0; color: #9A9A9A; font-size: 11px;
          display: flex; align-items: center; justify-content: center; font-weight: 700;
        }
        .sdp-tab--active .sdp-tab-num { background: #1B2B4B; color: white; }

        /* ── Phase body ── */
        .sdp-phase-body {
          padding: 28px; display: flex; flex-direction: column; gap: 14px;
        }
        @media (max-width: 767px) { .sdp-phase-body { padding: 18px; } }

        .sdp-error {
          background: #FEF2F2; color: #DC2626; font-size: 12.5px;
          padding: 10px 14px; border-radius: 8px; border: 1px solid #FECACA;
        }

        .sdp-section { display: flex; flex-direction: column; gap: 16px; }

        .sdp-section-title { font-size: 15px; font-weight: 700; color: #0a0a0a; }

        .sdp-section-desc { font-size: 13px; color: #6B7280; margin: 0; line-height: 1.55; }

        .sdp-subsection { display: flex; flex-direction: column; gap: 12px; }
        .sdp-divider { height: 1px; background: #F0F0F0; margin: 4px 0; }

        /* Upload area */
        .sdp-upload-area {
          border: 2px dashed #E0E0E0; border-radius: 12px;
          padding: 28px 24px; display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 8px;
          cursor: pointer; color: #9A9A9A; transition: all 0.2s; text-align: center;
        }
        .sdp-upload-area:hover { border-color: #1B2B4B; color: #1B2B4B; background: #F5F8FF; }
        .sdp-upload-area span { font-size: 14px; font-weight: 600; }
        .sdp-upload-hint { font-size: 12px; color: #C0C0C0; font-weight: 400; }

        .sdp-import-plan-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 9px 16px; border-radius: 8px; font-size: 13px; font-weight: 600;
          background: #EFF4FF; color: #254067; border: 1.5px solid #C7D6F5; cursor: pointer;
          transition: background 0.15s;
        }
        .sdp-import-plan-btn:hover:not(:disabled) { background: #D6E4FF; }
        .sdp-import-plan-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .sdp-error { font-size: 13px; color: #DC2626; margin-bottom: 10px; }

        .sdp-files-list { display: flex; flex-direction: column; gap: 7px; }

        .sdp-file-row {
          display: flex; align-items: center; gap: 10px;
          background: #F8F9FB; border: 1px solid #E8E8E8; border-radius: 10px;
          padding: 10px 12px;
        }
        .sdp-file-icon { color: #4A7FC1; flex-shrink: 0; }
        .sdp-file-name-btn {
          flex: 1; font-size: 13px; color: #1B2B4B; font-weight: 500;
          background: none; border: none; cursor: pointer; font-family: inherit;
          text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          padding: 0;
        }
        .sdp-file-name-btn:hover { text-decoration: underline; }
        .sdp-file-dl {
          width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
          border-radius: 6px; color: #C0C0C0; text-decoration: none; flex-shrink: 0;
          transition: all 0.15s;
        }
        .sdp-file-dl:hover { background: #EFF6FF; color: #254067; }
        .sdp-file-remove {
          width: 28px; height: 28px; border: none; background: none;
          border-radius: 6px; cursor: pointer; color: #C0C0C0;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s; flex-shrink: 0;
        }
        .sdp-file-remove:hover { background: #FEF2F2; color: #DC2626; }

        /* Briefing form */
        .sdp-brief-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
        }
        @media (max-width: 600px) { .sdp-brief-grid { grid-template-columns: 1fr; } }

        .sdp-brief-col { display: flex; flex-direction: column; gap: 10px; }

        .sdp-brief-field { display: flex; flex-direction: column; gap: 4px; }

        .sdp-brief-label {
          font-size: 11px; font-weight: 700; color: #9A9A9A;
          text-transform: uppercase; letter-spacing: 0.05em;
        }

        .sdp-brief-input {
          border: 1.5px solid #E8E8E8; border-radius: 8px; padding: 8px 10px;
          font-size: 13.5px; font-family: inherit; outline: none;
          background: #FAFAFA; color: #0a0a0a; transition: border-color 0.15s;
        }
        .sdp-brief-input:focus { border-color: #1B2B4B; background: white; }
        .sdp-brief-input::placeholder { color: #D0D0D0; }

        :global(.sdp-brief-select) {
          border: 1.5px solid #E8E8E8; border-radius: 8px; padding: 8px 10px;
          font-size: 13.5px; font-family: inherit; outline: none;
          background: #FAFAFA; color: #0a0a0a; cursor: pointer; width: 100%;
          transition: border-color 0.15s; appearance: auto;
        }
        :global(.sdp-brief-select:focus) { border-color: #1B2B4B; background: white; }

        .sdp-brief-textarea {
          border: 1.5px solid #E8E8E8; border-radius: 8px; padding: 8px 10px;
          font-size: 13.5px; font-family: inherit; outline: none;
          background: #FAFAFA; color: #0a0a0a; transition: border-color 0.15s;
          resize: vertical; line-height: 1.5;
        }
        .sdp-brief-textarea:focus { border-color: #1B2B4B; background: white; }
        .sdp-brief-textarea::placeholder { color: #D0D0D0; }

        /* Deliverables */
        .sdp-deliverables-header {
          display: flex; align-items: center; gap: 12px; justify-content: space-between;
          flex-wrap: wrap;
        }
        .sdp-deliverables-summary { display: flex; flex-wrap: wrap; gap: 6px; }
        .sdp-deliverable-count {
          font-size: 11.5px; font-weight: 700; padding: 3px 9px;
          border-radius: 20px;
        }

        .sdp-table-wrap {
          overflow-x: auto; border: 1px solid #E8E8E8; border-radius: 12px;
        }

        .sdp-table {
          width: 100%; border-collapse: collapse; font-size: 13px;
        }

        .sdp-table th {
          padding: 9px 10px; background: #F8F9FB;
          font-size: 11px; font-weight: 700; color: #9A9A9A;
          text-transform: uppercase; letter-spacing: 0.05em;
          text-align: left; border-bottom: 1px solid #E8E8E8;
          white-space: nowrap;
        }

        .sdp-table td {
          padding: 6px 6px; border-bottom: 1px solid #F5F5F5;
          vertical-align: middle;
        }
        .sdp-table tr:last-child td { border-bottom: none; }

        .sdp-table-input {
          width: 100%; border: 1.5px solid transparent; border-radius: 7px;
          padding: 6px 8px; font-size: 13px; font-family: inherit;
          background: transparent; color: #0a0a0a; outline: none;
          transition: border-color 0.15s, background 0.15s;
        }
        .sdp-table-input:focus { border-color: #1B2B4B; background: white; }
        .sdp-table-input::placeholder { color: #C0C0C0; }
        .sdp-table-input--num { width: 48px; text-align: center; }

        .sdp-table-select {
          border: 1.5px solid transparent; border-radius: 7px;
          padding: 6px 6px; font-size: 13px; font-family: inherit;
          background: transparent; color: #0a0a0a; cursor: pointer;
          transition: border-color 0.15s; width: 100%;
        }
        .sdp-table-select:focus { border-color: #1B2B4B; background: white; outline: none; }

        .sdp-row-del {
          width: 26px; height: 26px; border: none; background: none;
          border-radius: 6px; cursor: pointer; color: #C0C0C0;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .sdp-row-del:hover { background: #FEF2F2; color: #DC2626; }

        .sdp-add-row-btn {
          display: flex; align-items: center; gap: 6px; align-self: flex-start;
          height: 34px; padding: 0 14px;
          border: 1.5px dashed #D0D0D0; border-radius: 8px;
          background: none; font-size: 13px; font-weight: 600; color: #6B7280;
          cursor: pointer; font-family: inherit; transition: all 0.15s;
        }
        .sdp-add-row-btn:hover { border-color: #1B2B4B; color: #1B2B4B; background: #F5F8FF; }

        /* Checklist */
        .sdp-checklist-header {
          display: flex; align-items: center; justify-content: space-between;
        }
        .sdp-cl-count {
          font-size: 13px; font-weight: 700; color: #1B2B4B;
          background: #EEF2FF; padding: 3px 10px; border-radius: 20px;
        }

        .sdp-cl-section { margin-top: 8px; }

        .sdp-cl-section-title {
          font-size: 12px; font-weight: 800; color: #6B7280;
          text-transform: uppercase; letter-spacing: 0.07em;
          padding: 6px 4px; display: flex; align-items: center; gap: 8px;
        }
        .sdp-cl-section-count {
          font-size: 11px; font-weight: 600; color: #9CA3AF; font-style: normal;
          letter-spacing: 0;
        }

        .sdp-checklist { display: flex; flex-direction: column; gap: 2px; }

        .sdp-check-row {
          display: flex; align-items: center; gap: 10px;
          padding: 7px 10px; border-radius: 8px; cursor: pointer;
          transition: background 0.12s; user-select: none;
        }
        .sdp-check-row:hover { background: #F5F5F5; }

        .sdp-check-input { width: 15px; height: 15px; accent-color: #1B2B4B; cursor: pointer; flex-shrink: 0; }

        .sdp-check-label { font-size: 13.5px; color: #1a1a1a; transition: color 0.15s; }
        .sdp-check-label--done { color: #9A9A9A; text-decoration: line-through; }

        /* Save button */
        .sdp-save-btn {
          display: flex; align-items: center; gap: 6px; align-self: flex-start;
          height: 38px; padding: 0 20px; background: #1B2B4B; color: white;
          border: none; border-radius: 8px; font-size: 13.5px; font-weight: 600;
          cursor: pointer; font-family: inherit; transition: background 0.15s;
          margin-top: 4px;
        }
        .sdp-save-btn:hover:not(:disabled) { background: #254067; }
        .sdp-save-btn:disabled { background: #E8E8E8; color: #9A9A9A; cursor: not-allowed; }
        .sdp-autosave-indicator {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 12px; font-weight: 500; color: #5C6B80;
          padding: 6px 12px; margin-top: 16px;
        }

        /* PDF overlay */
        .sdp-pdf-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.6);
          display: flex; align-items: center; justify-content: center;
          z-index: 2000; padding: 20px;
        }
        .sdp-pdf-panel {
          background: white; border-radius: 14px; overflow: hidden;
          width: 100%; max-width: 860px; height: 90vh;
          display: flex; flex-direction: column;
          box-shadow: 0 32px 80px rgba(0,0,0,0.3);
        }
        .sdp-pdf-bar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 16px; border-bottom: 1px solid #F0F0F0;
          flex-shrink: 0; gap: 12px;
        }
        .sdp-pdf-title {
          font-size: 13.5px; font-weight: 600; color: #0a0a0a;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;
        }
        .sdp-pdf-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .sdp-pdf-dl-btn {
          display: flex; align-items: center; gap: 6px;
          height: 32px; padding: 0 12px;
          border: 1px solid #E8E8E8; border-radius: 7px;
          background: white; font-size: 12.5px; font-weight: 500; color: #5C5C5C;
          cursor: pointer; font-family: inherit; text-decoration: none;
          transition: all 0.15s;
        }
        .sdp-pdf-dl-btn:hover { border-color: #D0D0D0; color: #0a0a0a; }
        .sdp-pdf-close {
          width: 32px; height: 32px; border: none; background: #F0F0F0;
          border-radius: 7px; cursor: pointer; display: flex; align-items: center;
          justify-content: center; color: #5C5C5C; transition: all 0.15s;
        }
        .sdp-pdf-close:hover { background: #E8E8E8; }
        .sdp-pdf-frame { flex: 1; width: 100%; border: none; background: #F5F5F5; }

        .sdp-spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Responsible input in edit header */
        .sdp-responsible-input {
          border: 1.5px solid #E8E8E8; border-radius: 8px; padding: 8px 10px;
          font-size: 13.5px; font-family: inherit; outline: none;
          background: #FAFAFA; color: #0a0a0a; transition: border-color 0.15s;
        }
        .sdp-responsible-input:focus { border-color: #1B2B4B; background: white; }
      `}</style>
    </div>
  )
}
