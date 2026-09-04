'use client'

import { useState, useRef } from 'react'
import { X, FileText, Upload, Trash2, Loader2, ChevronRight } from 'lucide-react'

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
  session: Session
  onClose: () => void
  onUpdate: (updated: Session) => void
}

type Phase = 'previa' | 'durant' | 'post'

const PHASE_LABELS: Record<Phase, string> = {
  previa: 'Prèvia',
  durant: 'Durant',
  post: 'Post',
}

export function SessionDetailModal({ session, onClose, onUpdate }: Props) {
  const [activePhase, setActivePhase] = useState<Phase>('previa')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      if (json.session) onUpdate(json.session as Session)
    } finally {
      setSaving(false)
    }
  }

  const handleDurantSave = () => savePhase('durant')

  const types = Array.isArray(session.session_types) ? session.session_types : []

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        {/* Header */}
        <div className="modal-header">
          <div className="header-info">
            <div className="header-client">{session.client?.name || '—'}</div>
            <div className="header-date">{fmtDate(session.session_date)}</div>
            {types.length > 0 && (
              <div className="header-types">{types.join(', ')}</div>
            )}
          </div>
          <button className="close-btn" onClick={onClose}><X size={15} /></button>
        </div>

        {/* Phase tabs */}
        <div className="tabs">
          {(['previa', 'durant', 'post'] as Phase[]).map((p, i) => (
            <button
              key={p}
              className={`tab${activePhase === p ? ' tab--active' : ''}`}
              onClick={() => setActivePhase(p)}
            >
              <span className="tab-num">{i + 1}</span>
              {PHASE_LABELS[p]}
            </button>
          ))}
        </div>

        {/* Phase content */}
        <div className="phase-body">
          {error && (
            <div className="error-bar">{error}</div>
          )}

          {/* PRÈVIA */}
          {activePhase === 'previa' && (
            <div className="phase-section">
              <div className="phase-title">Pla de contingut</div>
              <p className="phase-desc">Adjunta el PDF amb el pla de contingut de la sessió.</p>
              {previaPdfUrl ? (
                <div className="file-row">
                  <FileText size={20} className="file-icon" />
                  <a href={previaPdfUrl} target="_blank" rel="noopener noreferrer" className="file-name">
                    {previaPdfName || 'Document PDF'}
                  </a>
                  <button className="file-remove" onClick={() => removeFile('previa')} title="Eliminar">
                    <Trash2 size={14} />
                  </button>
                </div>
              ) : (
                <div className="upload-area" onClick={() => previaInputRef.current?.click()}>
                  {uploading ? <Loader2 size={24} className="spin" /> : <Upload size={24} />}
                  <span>{uploading ? 'Pujant...' : 'Selecciona un PDF'}</span>
                  <span className="upload-hint">Màx. 50 MB</span>
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
                <button className="replace-btn" onClick={() => previaInputRef.current?.click()}>
                  <Upload size={12} /> Substituir PDF
                </button>
              )}
            </div>
          )}

          {/* DURANT */}
          {activePhase === 'durant' && (
            <div className="phase-section">
              <div className="phase-title">Informació de la sessió</div>
              <p className="phase-desc">Afegeix informació sobre com serà la sessió: estil, directrius, referències, etc.</p>
              <textarea
                className="notes-area"
                rows={8}
                value={durantNotes}
                onChange={e => setDurantNotes(e.target.value)}
                placeholder="Escriu aquí la informació de la sessió..."
              />
              <button
                className="save-btn"
                onClick={handleDurantSave}
                disabled={saving}
              >
                {saving ? <Loader2 size={13} className="spin" /> : null}
                Desar
              </button>
            </div>
          )}

          {/* POST */}
          {activePhase === 'post' && (
            <div className="phase-section">
              <div className="phase-title">Material de la sessió</div>
              <p className="phase-desc">Adjunta el material resultant de la sessió (ZIP, PDF, carpeta comprimida, etc.).</p>
              {postMaterialUrl ? (
                <div className="file-row">
                  <FileText size={20} className="file-icon" />
                  <a href={postMaterialUrl} target="_blank" rel="noopener noreferrer" className="file-name">
                    {postMaterialName || 'Material'}
                  </a>
                  <button className="file-remove" onClick={() => removeFile('post')} title="Eliminar">
                    <Trash2 size={14} />
                  </button>
                </div>
              ) : (
                <div className="upload-area" onClick={() => postInputRef.current?.click()}>
                  {uploading ? <Loader2 size={24} className="spin" /> : <Upload size={24} />}
                  <span>{uploading ? 'Pujant...' : 'Selecciona el material'}</span>
                  <span className="upload-hint">Màx. 50 MB</span>
                </div>
              )}
              <input
                ref={postInputRef}
                type="file"
                style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f, 'post'); e.target.value = '' }}
              />
              {postMaterialUrl && (
                <button className="replace-btn" onClick={() => postInputRef.current?.click()}>
                  <Upload size={12} /> Substituir fitxer
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000; padding: 24px;
        }

        .modal {
          background: white; border-radius: 16px; width: 100%; max-width: 520px;
          display: flex; flex-direction: column; overflow: hidden;
          box-shadow: 0 24px 64px rgba(0,0,0,0.2);
          max-height: 90vh;
        }

        .modal-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          padding: 20px 24px 16px; border-bottom: 1px solid #F0F0F0; gap: 12px;
        }

        .header-info { flex: 1; min-width: 0; }

        .header-client {
          font-size: 17px; font-weight: 700; color: #0a0a0a; letter-spacing: -0.01em;
        }

        .header-date {
          font-size: 12px; color: #9A9A9A; margin-top: 2px; text-transform: capitalize;
        }

        .header-types {
          font-size: 11px; color: #6B7280; margin-top: 4px;
          text-transform: capitalize;
        }

        .close-btn {
          width: 28px; height: 28px; border: none; background: #F0F0F0; border-radius: 6px;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          color: #5C5C5C; flex-shrink: 0;
        }
        .close-btn:hover { background: #E8E8E8; }

        .tabs {
          display: flex; border-bottom: 1px solid #F0F0F0; padding: 0 24px; gap: 0;
          flex-shrink: 0;
        }

        .tab {
          display: flex; align-items: center; gap: 7px;
          padding: 12px 16px 11px; border: none; background: none;
          font-size: 13px; font-weight: 600; color: #9A9A9A;
          cursor: pointer; font-family: inherit;
          border-bottom: 2px solid transparent; margin-bottom: -1px;
          transition: all 0.15s; white-space: nowrap;
        }
        .tab:hover { color: #0a0a0a; }
        .tab--active { color: #1B2B4B; border-bottom-color: #1B2B4B; }

        .tab-num {
          width: 18px; height: 18px; border-radius: 50%;
          background: #F0F0F0; color: #9A9A9A;
          font-size: 10px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .tab--active .tab-num { background: #1B2B4B; color: white; }

        .phase-body {
          padding: 24px; flex: 1; overflow-y: auto;
          display: flex; flex-direction: column; gap: 12px;
        }

        .error-bar {
          background: #FEF2F2; color: #DC2626; font-size: 12px;
          padding: 8px 12px; border-radius: 8px; border: 1px solid #FECACA;
        }

        .phase-section { display: flex; flex-direction: column; gap: 14px; }

        .phase-title { font-size: 15px; font-weight: 700; color: #0a0a0a; }

        .phase-desc { font-size: 13px; color: #6B7280; margin: 0; line-height: 1.5; }

        .upload-area {
          border: 2px dashed #E0E0E0; border-radius: 12px;
          padding: 32px 20px; display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 8px;
          cursor: pointer; color: #9A9A9A; transition: all 0.2s;
          text-align: center;
        }
        .upload-area:hover { border-color: #1B2B4B; color: #1B2B4B; background: #F5F8FF; }
        .upload-area span { font-size: 13.5px; font-weight: 600; }
        .upload-hint { font-size: 11px; color: #C0C0C0; font-weight: 400; }

        .file-row {
          display: flex; align-items: center; gap: 10px;
          background: #F8F9FB; border: 1px solid #E8E8E8; border-radius: 10px;
          padding: 12px 14px;
        }

        :global(.file-icon) { color: #4A7FC1; flex-shrink: 0; }

        .file-name {
          flex: 1; font-size: 13px; color: #1B2B4B; font-weight: 500;
          text-decoration: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .file-name:hover { text-decoration: underline; }

        .file-remove {
          width: 28px; height: 28px; border: none; background: none;
          border-radius: 6px; cursor: pointer; color: #C0C0C0;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s; flex-shrink: 0;
        }
        .file-remove:hover { background: #FEF2F2; color: #DC2626; }

        .replace-btn {
          display: flex; align-items: center; gap: 5px;
          font-size: 11.5px; color: #9A9A9A; background: none; border: none;
          cursor: pointer; font-family: inherit; padding: 0; margin-top: -4px;
          transition: color 0.15s;
        }
        .replace-btn:hover { color: #1B2B4B; }

        .notes-area {
          width: 100%; border: 1.5px solid #E8E8E8; border-radius: 10px;
          padding: 12px 14px; font-size: 13.5px; font-family: inherit;
          line-height: 1.6; color: #0a0a0a; background: #FAFAFA;
          outline: none; resize: vertical; transition: border-color 0.15s;
        }
        .notes-area:focus { border-color: #1B2B4B; background: white; }
        .notes-area::placeholder { color: #C0C0C0; }

        .save-btn {
          display: flex; align-items: center; gap: 6px; align-self: flex-end;
          height: 36px; padding: 0 18px; background: #1B2B4B; color: white;
          border: none; border-radius: 8px; font-size: 13px; font-weight: 600;
          cursor: pointer; font-family: inherit; transition: background 0.15s;
        }
        .save-btn:hover:not(:disabled) { background: #2563EB; }
        .save-btn:disabled { background: #E8E8E8; color: #9A9A9A; cursor: not-allowed; }

        :global(.spin) { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
