'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, FileText, Upload, Trash2, Loader2, Camera, Video, Image, Mic, X, Download, Pencil, User } from 'lucide-react'
import { DurantPanel, DEFAULT_DURANT_DATA, type DurantData } from './DurantPanel'
import { PostPanel, DEFAULT_POST_DATA, type PostData } from './PostPanel'

interface Briefing {
  objectiu: string
  client_projecte: string
  data_localitzacio: string
  duracio: string
  responsable: string
  fotografa: string
  video: string
  social_media: string
  contacte_client: string
  prioritat: string
  gravar: string
  continguts: string
  formats: string
  missatges: string
  cta: string
  plataformes: string
  checklist: Record<string, boolean>
}

const DEFAULT_BRIEFING: Briefing = {
  objectiu: '', client_projecte: '', data_localitzacio: '', duracio: '',
  responsable: '', fotografa: '', video: '', social_media: '',
  contacte_client: '', prioritat: '',
  gravar: '', continguts: '', formats: '', missatges: '', cta: '', plataformes: '',
  checklist: {
    pla_contingut: false, material_tecnic: false, bateries: false, targetes: false,
    microfons: false, tripodes: false, illuminacio: false, logos_assets: false,
    guions: false, referencies: false, permisos: false, coordinacio: false,
  },
}

const CHECKLIST_ITEMS: { key: string; label: string }[] = [
  { key: 'pla_contingut', label: 'Pla de contingut revisat' },
  { key: 'material_tecnic', label: 'Material tècnic preparat' },
  { key: 'bateries', label: 'Bateries carregades' },
  { key: 'targetes', label: 'Targetes disponibles' },
  { key: 'microfons', label: 'Micròfons' },
  { key: 'tripodes', label: 'Trípodes' },
  { key: 'illuminacio', label: 'Il·luminació' },
  { key: 'logos_assets', label: 'Logos/assets' },
  { key: 'guions', label: 'Guions' },
  { key: 'referencies', label: 'Referències creatives' },
  { key: 'permisos', label: 'Permisos/autoritzacions' },
  { key: 'coordinacio', label: 'Coordinació amb client' },
]

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

const SESSION_TYPES = [
  { value: 'foto', label: 'Foto', icon: Camera, color: '#254067' },
  { value: 'video', label: 'Vídeo', icon: Video, color: '#3a6fa8' },
  { value: 'reels', label: 'Reels', icon: Video, color: '#EC4899' },
  { value: 'stories', label: 'Stories', icon: Image, color: '#F59E0B' },
  { value: 'copy', label: 'Copy', icon: FileText, color: '#10B981' },
  { value: 'podcast', label: 'Podcast', icon: Mic, color: '#EF4444' },
  { value: 'altre', label: 'Altre', icon: FileText, color: '#6B7280' },
]

type Phase = 'previa' | 'durant' | 'post'

const PHASES: { key: Phase; label: string; num: number }[] = [
  { key: 'previa', label: 'Prèvia', num: 1 },
  { key: 'durant', label: 'Durant', num: 2 },
  { key: 'post', label: 'Post', num: 3 },
]

export function SessionDetailPage({ session: initialSession }: { session: Session }) {
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

  const [briefing, setBriefing] = useState<Briefing>(() => ({
    ...DEFAULT_BRIEFING,
    ...session.previa_briefing,
    checklist: { ...DEFAULT_BRIEFING.checklist, ...(session.previa_briefing?.checklist || {}) },
  }))
  const [briefingSaving, setBriefingSaving] = useState(false)

  const [previaPdfUrl, setPreviaPdfUrl] = useState(session.previa_pdf_url || null)
  const [previaPdfName, setPreviaPdfName] = useState(session.previa_pdf_name || null)
  const [durantNotes, setDurantNotes] = useState(session.durant_notes || '')
  const [postMaterialUrl, setPostMaterialUrl] = useState(session.post_material_url || null)
  const [postMaterialName, setPostMaterialName] = useState(session.post_material_name || null)

  const previaInputRef = useRef<HTMLInputElement>(null)
  const postInputRef = useRef<HTMLInputElement>(null)

  const fmtDate = (iso: string) => {
    const d = new Date(iso + 'T12:00:00')
    return d.toLocaleDateString('ca-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }

  const uploadFile = async (file: File, phase: 'previa' | 'post') => {
    setUploading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('sessionId', session.id)
      form.append('phase', phase)
      const res = await fetch('/api/check/sessions/upload', { method: 'POST', body: form })
      const json = await res.json()
      if (json.error) { setError(json.error); return }
      if (phase === 'previa') {
        setPreviaPdfUrl(json.url)
        setPreviaPdfName(json.name)
        await savePhase('previa', { previa_pdf_url: json.url, previa_pdf_name: json.name })
      } else {
        setPostMaterialUrl(json.url)
        setPostMaterialName(json.name)
        await savePhase('post', { post_material_url: json.url, post_material_name: json.name })
      }
    } finally {
      setUploading(false)
    }
  }

  const removeFile = async (phase: 'previa' | 'post') => {
    if (phase === 'previa') {
      setPreviaPdfUrl(null)
      setPreviaPdfName(null)
      await savePhase('previa', { previa_pdf_url: null, previa_pdf_name: null })
    } else {
      setPostMaterialUrl(null)
      setPostMaterialName(null)
      await savePhase('post', { post_material_url: null, post_material_name: null })
    }
  }

  const saveBriefing = async () => {
    setBriefingSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/check/sessions/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ previa_briefing: briefing }),
      })
      const json = await res.json()
      if (json.error) setError(json.error)
      if (json.session) setSession(json.session as Session)
    } finally { setBriefingSaving(false) }
  }

  const setBriefingField = (key: keyof Omit<Briefing, 'checklist'>, val: string) =>
    setBriefing(b => ({ ...b, [key]: val }))

  const toggleCheck = (key: string) =>
    setBriefing(b => ({ ...b, checklist: { ...b.checklist, [key]: !b.checklist[key] } }))

  const savePhase = async (phase: Phase, overrides?: Record<string, any>) => {
    setSaving(true)
    setError(null)
    try {
      const body: Record<string, any> = { ...overrides }
      if (!overrides) {
        if (phase === 'previa') { body.previa_pdf_url = previaPdfUrl; body.previa_pdf_name = previaPdfName }
        if (phase === 'durant') { body.durant_notes = durantNotes || null }
        if (phase === 'post') { body.post_material_url = postMaterialUrl; body.post_material_name = postMaterialName }
      }
      const res = await fetch(`/api/check/sessions/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (json.error) { setError(json.error); return }
      if (json.session) setSession(json.session as Session)
    } finally {
      setSaving(false)
    }
  }

  const saveHeader = async () => {
    setSaving(true)
    setError(null)
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

  const types = Array.isArray(session.session_types) ? session.session_types : []

  return (
    <div className="sdp-wrap">
      {/* Back + breadcrumb */}
      <div className="sdp-topbar">
        <button className="sdp-back" onClick={() => router.back()}>
          <ArrowLeft size={15} strokeWidth={2.2} />
          Tornar a sessions
        </button>
      </div>

      <div className="sdp-card">
        {/* Header */}
        <div className="sdp-header">
          <div className="sdp-header-info">
            <div className="sdp-client">{session.client?.name || '—'}</div>
            <div className="sdp-date">{fmtDate(session.session_date)}</div>
            {(session.start_time || session.hours > 0) && (
              <div className="sdp-time">
                {session.start_time ? `${session.start_time.slice(0,5)}${session.end_time ? `–${session.end_time.slice(0,5)}` : ''}` : ''}
                {session.hours > 0 ? ` · ${session.hours}h` : ''}
              </div>
            )}

            {/* Edit header mode */}
            {editHeader ? (
              <div className="sdp-edit-header">
                <div className="sdp-edit-label">Tipus de contingut</div>
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
                <div className="sdp-edit-label" style={{ marginTop: 10 }}>Responsable</div>
                <input
                  className="sdp-responsible-input"
                  value={editResponsible}
                  onChange={e => setEditResponsible(e.target.value)}
                  placeholder="Nom del responsable..."
                  onKeyDown={e => e.key === 'Enter' && saveHeader()}
                />
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
              <>
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
                {session.responsible && (
                  <div className="sdp-responsible">
                    <User size={12} /> {session.responsible}
                  </div>
                )}
              </>
            )}

            {session.notes && <div className="sdp-notes">{session.notes}</div>}
          </div>
        </div>

        {/* Phase tabs */}
        <div className="sdp-tabs">
          {PHASES.map(p => (
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

        {/* Phase body */}
        <div className="sdp-phase-body">
          {error && <div className="sdp-error">{error}</div>}

          {/* PRÈVIA */}
          {activePhase === 'previa' && (
            <div className="sdp-section">

              {/* Pla de contingut PDF */}
              <div className="sdp-subsection">
                <div className="sdp-section-title">Pla de contingut</div>
                <p className="sdp-section-desc">Adjunta el PDF amb el pla de contingut de la sessió.</p>
                {previaPdfUrl ? (
                  <div className="sdp-file-row">
                    <FileText size={20} className="sdp-file-icon" />
                    <button className="sdp-file-name-btn" onClick={() => setPreviewPdf({ url: previaPdfUrl!, name: previaPdfName || 'Document PDF' })}>
                      {previaPdfName || 'Document PDF'}
                    </button>
                    <a href={previaPdfUrl} download className="sdp-file-dl" title="Descarregar">
                      <Download size={14} />
                    </a>
                    <button className="sdp-file-remove" onClick={() => removeFile('previa')} title="Eliminar">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="sdp-upload-area" onClick={() => previaInputRef.current?.click()}>
                    {uploading ? <Loader2 size={24} className="sdp-spin" /> : <Upload size={24} />}
                    <span>{uploading ? 'Pujant...' : 'Selecciona un PDF'}</span>
                    <span className="sdp-upload-hint">Màx. 50 MB</span>
                  </div>
                )}
                <input
                  ref={previaInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f, 'previa'); e.target.value = '' }}
                />
                {previaPdfUrl && (
                  <button className="sdp-replace-btn" onClick={() => previaInputRef.current?.click()}>
                    <Upload size={12} /> Substituir PDF
                  </button>
                )}
              </div>

              <div className="sdp-divider" />

              {/* Briefing de la sessió */}
              <div className="sdp-subsection">
                <div className="sdp-section-title">Briefing de la sessió</div>
                <div className="sdp-brief-grid">
                  {([
                    { key: 'objectiu', label: 'Objectiu de la sessió' },
                    { key: 'client_projecte', label: 'Client/projecte' },
                    { key: 'data_localitzacio', label: 'Data i localització' },
                    { key: 'duracio', label: 'Durada' },
                    { key: 'responsable', label: 'Responsable de la sessió' },
                    { key: 'fotografa', label: 'Fotògraf/a' },
                    { key: 'video', label: 'Vídeo' },
                    { key: 'social_media', label: 'Social media' },
                    { key: 'contacte_client', label: 'Persona de contacte del client' },
                    { key: 'prioritat', label: 'Prioritat' },
                  ] as { key: keyof Omit<Briefing, 'checklist'>; label: string }[]).map(({ key, label }) => (
                    <div key={key} className="sdp-brief-field">
                      <label className="sdp-brief-label">{label}</label>
                      <input
                        className="sdp-brief-input"
                        value={briefing[key]}
                        onChange={e => setBriefingField(key, e.target.value)}
                        placeholder="—"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="sdp-divider" />

              {/* Objectius de contingut */}
              <div className="sdp-subsection">
                <div className="sdp-section-title">Objectius de contingut</div>
                <div className="sdp-brief-col">
                  {([
                    { key: 'gravar', label: 'Què hem de gravar obligatòriament?' },
                    { key: 'continguts', label: 'Quins continguts volem aconseguir?' },
                    { key: 'formats', label: 'Quins formats?' },
                    { key: 'missatges', label: 'Quins missatges hem de transmetre?' },
                    { key: 'cta', label: 'CTA necessària?' },
                    { key: 'plataformes', label: 'Plataformes on es publicarà?' },
                  ] as { key: keyof Omit<Briefing, 'checklist'>; label: string }[]).map(({ key, label }) => (
                    <div key={key} className="sdp-brief-field">
                      <label className="sdp-brief-label">{label}</label>
                      <textarea
                        className="sdp-brief-textarea"
                        rows={2}
                        value={briefing[key]}
                        onChange={e => setBriefingField(key, e.target.value)}
                        placeholder="—"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="sdp-divider" />

              {/* Checklist */}
              <div className="sdp-subsection">
                <div className="sdp-section-title">Checklist prèvia</div>
                <div className="sdp-checklist">
                  {CHECKLIST_ITEMS.map(({ key, label }) => (
                    <label key={key} className="sdp-check-row">
                      <input
                        type="checkbox"
                        className="sdp-check-input"
                        checked={!!briefing.checklist[key]}
                        onChange={() => toggleCheck(key)}
                      />
                      <span className={briefing.checklist[key] ? 'sdp-check-label sdp-check-label--done' : 'sdp-check-label'}>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Save button */}
              <button className="sdp-save-btn" onClick={saveBriefing} disabled={briefingSaving}>
                {briefingSaving ? <Loader2 size={13} className="sdp-spin" /> : null}
                Desar briefing
              </button>

            </div>
          )}

          {/* DURANT */}
          {activePhase === 'durant' && (
            <DurantPanel
              sessionId={session.id}
              previaPdfUrl={previaPdfUrl}
              initialData={{
                ...DEFAULT_DURANT_DATA,
                ...session.durant_data,
                shot_list: session.durant_data?.shot_list || [],
                incidencies: { ...DEFAULT_DURANT_DATA.incidencies, ...(session.durant_data?.incidencies || {}) },
                idees: session.durant_data?.idees || [],
              }}
              onSaved={durantData => setSession(s => ({ ...s, durant_data: durantData }))}
            />
          )}

          {/* POST */}
          {activePhase === 'post' && (
            <PostPanel
              sessionId={session.id}
              initialData={{
                material: { ...DEFAULT_POST_DATA.material, ...(session.post_data?.material || {}) },
                postproduccio: { ...DEFAULT_POST_DATA.postproduccio, ...(session.post_data?.postproduccio || {}) },
              }}
              onSaved={postData => setSession(s => ({ ...s, post_data: postData }))}
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
                <a href={previewPdf.url} download className="sdp-pdf-dl-btn" title="Descarregar">
                  <Download size={15} />
                  Descarregar
                </a>
                <button className="sdp-pdf-close" onClick={() => setPreviewPdf(null)}>
                  <X size={16} />
                </button>
              </div>
            </div>
            <iframe
              src={previewPdf.url}
              className="sdp-pdf-frame"
              title={previewPdf.name}
            />
          </div>
        </div>
      )}

      <style jsx>{`
        .sdp-wrap {
          flex: 1; overflow-y: auto;
          padding: 20px 28px 40px;
          display: flex; flex-direction: column; gap: 16px;
        }

        @media (max-width: 767px) {
          .sdp-wrap { padding: 14px 12px 60px; }
        }

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

        .sdp-header {
          padding: 24px 28px 20px;
          border-bottom: 1px solid #F0F0F0;
        }

        .sdp-client {
          font-size: 22px; font-weight: 700; color: #0a0a0a;
          letter-spacing: -0.02em; margin-bottom: 4px;
        }

        .sdp-date {
          font-size: 13px; color: #6B7280; text-transform: capitalize; margin-bottom: 6px;
        }

        .sdp-time {
          font-size: 12.5px; color: #9A9A9A; margin-bottom: 8px;
        }

        .sdp-types {
          display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px;
        }

        .sdp-type-chip {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 20px;
        }

        .sdp-notes {
          font-size: 13px; color: #5C5C5C; margin-top: 4px;
          line-height: 1.5;
        }

        /* Header edit */
        .sdp-types-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .sdp-edit-hdr-btn {
          display: inline-flex; align-items: center; gap: 5px;
          height: 26px; padding: 0 10px;
          border: 1px solid #E8E8E8; border-radius: 20px;
          background: white; font-size: 11.5px; font-weight: 500; color: #9A9A9A;
          cursor: pointer; font-family: inherit; transition: all 0.15s;
        }
        .sdp-edit-hdr-btn:hover { border-color: #1B2B4B; color: #1B2B4B; }
        .sdp-responsible {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 12.5px; color: #5C5C5C; margin-top: 4px;
        }
        .sdp-edit-header { display: flex; flex-direction: column; gap: 6px; margin-top: 10px; }
        .sdp-edit-label { font-size: 10.5px; font-weight: 700; color: #9A9A9A; text-transform: uppercase; letter-spacing: 0.05em; }
        .sdp-type-toggle-row { display: flex; flex-wrap: wrap; gap: 6px; }
        .sdp-type-toggle {
          display: inline-flex; align-items: center; gap: 5px;
          height: 28px; padding: 0 10px;
          border: 1.5px solid #E8E8E8; border-radius: 20px;
          background: none; font-size: 12px; font-weight: 500; color: #9A9A9A;
          cursor: pointer; font-family: inherit; transition: all 0.12s;
        }
        .sdp-type-toggle--on { font-weight: 700; }
        .sdp-responsible-input {
          height: 36px; padding: 0 12px; border: 1.5px solid #E8E8E8;
          border-radius: 8px; font-size: 13px; font-family: inherit;
          outline: none; background: white; color: #0a0a0a;
          transition: border-color 0.15s;
        }
        .sdp-responsible-input:focus { border-color: #1B2B4B; }
        .sdp-responsible-input::placeholder { color: #C0C0C0; }
        .sdp-edit-btns { display: flex; gap: 6px; margin-top: 4px; }
        .sdp-edit-save {
          height: 32px; padding: 0 14px; background: #1B2B4B; color: white;
          border: none; border-radius: 7px; font-size: 12.5px; font-weight: 600;
          cursor: pointer; font-family: inherit; transition: background 0.15s;
        }
        .sdp-edit-save:hover:not(:disabled) { background: #254067; }
        .sdp-edit-save:disabled { opacity: 0.6; cursor: not-allowed; }
        .sdp-edit-cancel {
          height: 32px; padding: 0 14px; border: 1px solid #E8E8E8;
          background: white; border-radius: 7px; font-size: 12.5px; color: #5C5C5C;
          cursor: pointer; font-family: inherit; transition: all 0.15s;
        }
        .sdp-edit-cancel:hover { border-color: #C0C0C0; color: #0a0a0a; }

        .sdp-tabs {
          display: flex; border-bottom: 1px solid #F0F0F0; padding: 0 28px; gap: 0;
        }

        .sdp-tab {
          display: flex; align-items: center; gap: 8px;
          padding: 14px 18px 13px; border: none; background: none;
          font-size: 13.5px; font-weight: 600; color: #9A9A9A;
          cursor: pointer; font-family: inherit;
          border-bottom: 2.5px solid transparent; margin-bottom: -1px;
          transition: all 0.15s; white-space: nowrap;
        }
        .sdp-tab:hover { color: #0a0a0a; }
        .sdp-tab--active { color: #1B2B4B; border-bottom-color: #1B2B4B; }

        .sdp-tab-num {
          width: 20px; height: 20px; border-radius: 50%;
          background: #F0F0F0; color: #9A9A9A;
          font-size: 11px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .sdp-tab--active .sdp-tab-num { background: #1B2B4B; color: white; }

        .sdp-phase-body {
          padding: 28px; display: flex; flex-direction: column; gap: 14px;
        }

        .sdp-error {
          background: #FEF2F2; color: #DC2626; font-size: 12.5px;
          padding: 10px 14px; border-radius: 8px; border: 1px solid #FECACA;
        }

        .sdp-section { display: flex; flex-direction: column; gap: 16px; }

        .sdp-section-title { font-size: 16px; font-weight: 700; color: #0a0a0a; }

        .sdp-section-desc { font-size: 13.5px; color: #6B7280; margin: 0; line-height: 1.55; }

        .sdp-upload-area {
          border: 2px dashed #E0E0E0; border-radius: 14px;
          padding: 40px 24px; display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 10px;
          cursor: pointer; color: #9A9A9A; transition: all 0.2s; text-align: center;
        }
        .sdp-upload-area:hover { border-color: #1B2B4B; color: #1B2B4B; background: #F5F8FF; }
        .sdp-upload-area span { font-size: 14px; font-weight: 600; }
        .sdp-upload-hint { font-size: 12px; color: #C0C0C0; font-weight: 400; }

        .sdp-file-row {
          display: flex; align-items: center; gap: 12px;
          background: #F8F9FB; border: 1px solid #E8E8E8; border-radius: 12px;
          padding: 14px 16px;
        }

        .sdp-file-icon { color: #4A7FC1; flex-shrink: 0; }

        .sdp-file-name {
          flex: 1; font-size: 13.5px; color: #1B2B4B; font-weight: 500;
          text-decoration: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .sdp-file-name:hover { text-decoration: underline; }

        .sdp-file-remove {
          width: 30px; height: 30px; border: none; background: none;
          border-radius: 6px; cursor: pointer; color: #C0C0C0;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s; flex-shrink: 0;
        }
        .sdp-file-remove:hover { background: #FEF2F2; color: #DC2626; }

        .sdp-replace-btn {
          display: flex; align-items: center; gap: 5px;
          font-size: 12px; color: #9A9A9A; background: none; border: none;
          cursor: pointer; font-family: inherit; padding: 0; margin-top: -6px;
          transition: color 0.15s;
        }
        .sdp-replace-btn:hover { color: #1B2B4B; }

        .sdp-notes-area {
          width: 100%; border: 1.5px solid #E8E8E8; border-radius: 10px;
          padding: 14px 16px; font-size: 14px; font-family: inherit;
          line-height: 1.65; color: #0a0a0a; background: #FAFAFA;
          outline: none; resize: vertical; transition: border-color 0.15s;
        }
        .sdp-notes-area:focus { border-color: #1B2B4B; background: white; }
        .sdp-notes-area::placeholder { color: #C0C0C0; }

        .sdp-save-btn {
          display: flex; align-items: center; gap: 6px; align-self: flex-start;
          height: 38px; padding: 0 20px; background: #1B2B4B; color: white;
          border: none; border-radius: 8px; font-size: 13.5px; font-weight: 600;
          cursor: pointer; font-family: inherit; transition: background 0.15s;
        }
        .sdp-save-btn:hover:not(:disabled) { background: #254067; }
        .sdp-save-btn:disabled { background: #E8E8E8; color: #9A9A9A; cursor: not-allowed; }

        .sdp-subsection { display: flex; flex-direction: column; gap: 14px; }
        .sdp-divider { height: 1px; background: #F0F0F0; margin: 4px 0; }

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

        .sdp-brief-textarea {
          border: 1.5px solid #E8E8E8; border-radius: 8px; padding: 8px 10px;
          font-size: 13.5px; font-family: inherit; outline: none;
          background: #FAFAFA; color: #0a0a0a; transition: border-color 0.15s;
          resize: vertical; line-height: 1.5;
        }
        .sdp-brief-textarea:focus { border-color: #1B2B4B; background: white; }
        .sdp-brief-textarea::placeholder { color: #D0D0D0; }

        /* Checklist */
        .sdp-checklist { display: flex; flex-direction: column; gap: 6px; }

        .sdp-check-row {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 12px; border-radius: 8px; cursor: pointer;
          transition: background 0.12s; user-select: none;
        }
        .sdp-check-row:hover { background: #F5F5F5; }

        .sdp-check-input {
          width: 16px; height: 16px; accent-color: #1B2B4B;
          cursor: pointer; flex-shrink: 0;
        }

        .sdp-check-label {
          font-size: 13.5px; color: #1a1a1a; transition: color 0.15s;
        }
        .sdp-check-label--done {
          color: #9A9A9A; text-decoration: line-through;
        }

        .sdp-file-name-btn {
          flex: 1; font-size: 13.5px; color: #1B2B4B; font-weight: 500;
          background: none; border: none; cursor: pointer; font-family: inherit;
          text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          padding: 0; transition: color 0.15s;
        }
        .sdp-file-name-btn:hover { color: #254067; text-decoration: underline; }

        .sdp-file-dl {
          width: 30px; height: 30px; border: none; background: none;
          border-radius: 6px; cursor: pointer; color: #C0C0C0;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s; flex-shrink: 0; text-decoration: none;
        }
        .sdp-file-dl:hover { background: #EFF6FF; color: #254067; }

        /* PDF viewer overlay */
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
        .sdp-pdf-dl-btn:hover { border-color: #D0D0D0; color: #0a0a0a; background: #F8F8F8; }

        .sdp-pdf-close {
          width: 32px; height: 32px; border: none; background: #F0F0F0;
          border-radius: 7px; cursor: pointer; display: flex; align-items: center;
          justify-content: center; color: #5C5C5C; transition: all 0.15s;
        }
        .sdp-pdf-close:hover { background: #E8E8E8; color: #0a0a0a; }

        .sdp-pdf-frame {
          flex: 1; width: 100%; border: none; background: #F5F5F5;
        }

        .sdp-spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
