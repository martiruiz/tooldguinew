'use client'

import { useState } from 'react'
import { type LucideIcon, Plus, Loader2, Trash2, ExternalLink, Link2, X, Camera, Video, Mic, Film, Scissors, FileText, Package, Check } from 'lucide-react'

interface MaterialLink {
  id: string
  url: string
  name: string
}

interface MaterialItem {
  id: string
  links: MaterialLink[]
}

export interface PostData {
  material: Record<string, MaterialItem>
  postproduccio: Record<string, boolean>
}

const MATERIAL_TYPES: { key: string; label: string; Icon: LucideIcon; placeholder: string }[] = [
  { key: 'fotos',     label: 'Carpeta de fotos',      Icon: Camera,   placeholder: 'Enganxa l\'enllaç de Drive, Dropbox o qualsevol URL...' },
  { key: 'videos',    label: 'Carpeta de vídeos',      Icon: Video,    placeholder: 'Enganxa l\'enllaç de Drive, Dropbox o qualsevol URL...' },
  { key: 'audios',    label: 'Àudios',                 Icon: Mic,      placeholder: 'Enganxa l\'enllaç...' },
  { key: 'editables', label: 'Projectes / editables',  Icon: Film,     placeholder: 'Enganxa l\'enllaç...' },
  { key: 'seleccions',label: 'Seleccions',             Icon: Scissors, placeholder: 'Enganxa l\'enllaç...' },
  { key: 'documents', label: 'Documents',              Icon: FileText, placeholder: 'Enganxa l\'enllaç...' },
  { key: 'altres',    label: 'Altres',                  Icon: Package,  placeholder: 'Enganxa l\'enllaç...' },
]

const POST_CHECKLIST: { key: string; label: string }[] = [
  { key: 'descarregat',   label: 'Material descarregat' },
  { key: 'organitzat',    label: 'Material organitzat a Dropbox' },
  { key: 'backup',        label: 'Backup realitzat' },
  { key: 'selecci',       label: 'Selecció de material feta' },
  { key: 'edicions',      label: 'Edicions assignades' },
  { key: 'copies',        label: 'Copies assignades' },
  { key: 'programats',    label: 'Continguts programats' },
  { key: 'client_revisat',label: 'Client ha revisat' },
  { key: 'publicats',     label: 'Continguts publicats' },
]

export const DEFAULT_POST_DATA: PostData = {
  material: Object.fromEntries(MATERIAL_TYPES.map(t => [t.key, { id: t.key, links: [] }])),
  postproduccio: Object.fromEntries(POST_CHECKLIST.map(c => [c.key, false])),
}

function detectLinkType(url: string): 'drive' | 'dropbox' | 'link' {
  if (url.includes('drive.google.com') || url.includes('docs.google.com')) return 'drive'
  if (url.includes('dropbox.com')) return 'dropbox'
  return 'link'
}

function LinkIcon({ url }: { url: string }) {
  const type = detectLinkType(url)
  if (type === 'drive') return (
    <svg width="14" height="14" viewBox="0 0 87.3 78" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066DA"/>
      <path d="M43.65 25L29.9 1.2C28.55 2 27.4 3.1 26.6 4.5L1.2 48.5C.4 49.9 0 51.45 0 53h27.5z" fill="#00AC47"/>
      <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.85 11.5z" fill="#EA4335"/>
      <path d="M43.65 25L57.4 1.2C56.05.4 54.5 0 52.95 0H34.35c-1.55 0-3.1.45-4.45 1.2z" fill="#00832D"/>
      <path d="M59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.45 1.2h50.9c1.55 0 3.1-.4 4.45-1.2z" fill="#2684FC"/>
      <path d="M73.4 26.5l-12.8-22.2C59.8 2.9 58.65 1.8 57.3 1l-13.65 24L57.4 49h29.85c0-1.55-.4-3.1-1.2-4.5z" fill="#FFBA00"/>
    </svg>
  )
  if (type === 'dropbox') return (
    <svg width="14" height="14" viewBox="0 0 43 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 0L0 8l12.5 8L25 8zm18 0L31 8l12.5 8L25 8zM0 24l12.5 8L25 24l-12.5-8zm31 8l12.5-8L31 16l-12.5 8z" fill="#0061FF"/>
      <path d="M12.5 33.5L25 25.5l12.5 8L25 41.5z" fill="#0061FF"/>
    </svg>
  )
  return <Link2 size={13} color="#6B7280" />
}

interface Props {
  sessionId: string
  initialData: PostData
  onSaved: (data: PostData) => void
}

export function PostPanel({ sessionId, initialData, onSaved }: Props) {
  const [data, setData] = useState<PostData>(() => ({
    material: { ...DEFAULT_POST_DATA.material, ...initialData.material },
    postproduccio: { ...DEFAULT_POST_DATA.postproduccio, ...initialData.postproduccio },
  }))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Inline add-link state per material type
  const [addingLink, setAddingLink] = useState<{ key: string; url: string; name: string } | null>(null)

  const save = async (d: PostData) => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/check/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_data: d }),
      })
      const json = await res.json()
      if (json.error) { setError(json.error); return }
      onSaved(d)
    } finally { setSaving(false) }
  }

  const toggleCheck = (key: string) => {
    const next: PostData = {
      ...data,
      postproduccio: { ...data.postproduccio, [key]: !data.postproduccio[key] },
    }
    setData(next)
    save(next)
  }

  const startAddLink = (typeKey: string) => {
    setAddingLink({ key: typeKey, url: '', name: '' })
  }

  const confirmAddLink = () => {
    if (!addingLink || !addingLink.url.trim()) return
    const url = addingLink.url.trim()
    const name = addingLink.name.trim() || new URL(url.startsWith('http') ? url : `https://${url}`).hostname
    const newLink: MaterialLink = { id: `${Date.now()}`, url: url.startsWith('http') ? url : `https://${url}`, name }
    const next: PostData = {
      ...data,
      material: {
        ...data.material,
        [addingLink.key]: {
          id: addingLink.key,
          links: [...(data.material[addingLink.key]?.links || []), newLink],
        },
      },
    }
    setData(next)
    setAddingLink(null)
    save(next)
  }

  const removeLink = (typeKey: string, linkId: string) => {
    const next: PostData = {
      ...data,
      material: {
        ...data.material,
        [typeKey]: {
          id: typeKey,
          links: (data.material[typeKey]?.links || []).filter(l => l.id !== linkId),
        },
      },
    }
    setData(next)
    save(next)
  }

  const doneChecks = Object.values(data.postproduccio).filter(Boolean).length
  const totalChecks = POST_CHECKLIST.length

  return (
    <div className="pp-wrap">
      {error && <div className="pp-error">{error}</div>}

      {/* ── Material ── */}
      <div className="pp-section">
        <div className="pp-section-title">Material</div>

        <div className="pp-material-list">
          {MATERIAL_TYPES.map(type => {
            const item = data.material[type.key] || { id: type.key, links: [] }
            const isAdding = addingLink?.key === type.key
            return (
              <div key={type.key} className="pp-material-row">
                <div className="pp-material-left">
                  <span className="pp-material-icon"><type.Icon size={16} /></span>
                  <span className="pp-material-label">{type.label}</span>
                </div>
                <div className="pp-material-right">
                  {/* Links */}
                  {item.links.map(link => (
                    <div key={link.id} className="pp-link-chip">
                      <LinkIcon url={link.url} />
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="pp-link-name">
                        {link.name}
                      </a>
                      <ExternalLink size={10} className="pp-link-ext" />
                      <button className="pp-link-del" onClick={() => removeLink(type.key, link.id)}>
                        <X size={10} />
                      </button>
                    </div>
                  ))}

                  {/* Add link form */}
                  {isAdding ? (
                    <div className="pp-add-form">
                      <input
                        className="pp-add-url"
                        value={addingLink.url}
                        onChange={e => setAddingLink(a => a && ({ ...a, url: e.target.value }))}
                        placeholder={type.placeholder}
                        autoFocus
                        onKeyDown={e => { if (e.key === 'Enter') confirmAddLink(); if (e.key === 'Escape') setAddingLink(null) }}
                      />
                      <input
                        className="pp-add-name"
                        value={addingLink.name}
                        onChange={e => setAddingLink(a => a && ({ ...a, name: e.target.value }))}
                        placeholder="Nom (opcional)"
                        onKeyDown={e => { if (e.key === 'Enter') confirmAddLink(); if (e.key === 'Escape') setAddingLink(null) }}
                      />
                      <div className="pp-add-btns">
                        <button className="pp-add-confirm" onClick={confirmAddLink} disabled={!addingLink.url.trim()}>Afegir</button>
                        <button className="pp-add-cancel" onClick={() => setAddingLink(null)}>Cancel·lar</button>
                      </div>
                    </div>
                  ) : (
                    <button className="pp-add-link-btn" onClick={() => startAddLink(type.key)}>
                      <Plus size={12} /> Afegir enllaç
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Postproducció checklist ── */}
      <div className="pp-section">
        <div className="pp-section-hdr">
          <div className="pp-section-title">Postproducció</div>
          <div className="pp-check-progress">
            <div className="pp-check-bar-wrap">
              <div className="pp-check-bar" style={{ width: `${(doneChecks / totalChecks) * 100}%` }} />
            </div>
            <span className="pp-check-count">{doneChecks}/{totalChecks}</span>
          </div>
        </div>

        <div className="pp-checklist">
          {POST_CHECKLIST.map(({ key, label }) => {
            const done = !!data.postproduccio[key]
            return (
              <label key={key} className="pp-check-row">
                <input
                  type="checkbox"
                  className="pp-check-input"
                  checked={done}
                  onChange={() => toggleCheck(key)}
                />
                <span className={done ? 'pp-check-label pp-check-label--done' : 'pp-check-label'}>{label}</span>
                {done && <Check size={13} className="pp-check-done-mark" />}
              </label>
            )
          })}
        </div>
      </div>

      {saving && (
        <div className="pp-saving">
          <Loader2 size={12} className="pp-spin" /> Desant...
        </div>
      )}

      <style jsx>{`
        .pp-wrap { display: flex; flex-direction: column; gap: 24px; }

        .pp-error {
          background: #FEF2F2; color: #DC2626; font-size: 12.5px;
          padding: 8px 12px; border-radius: 8px; border: 1px solid #FECACA;
        }

        .pp-section { display: flex; flex-direction: column; gap: 12px; }

        .pp-section-hdr { display: flex; align-items: center; justify-content: space-between; gap: 12px; }

        .pp-section-title { font-size: 15px; font-weight: 700; color: #0a0a0a; }

        /* Progress */
        .pp-check-progress { display: flex; align-items: center; gap: 8px; }
        .pp-check-bar-wrap {
          width: 120px; height: 5px; background: #F0F0F0; border-radius: 5px; overflow: hidden;
        }
        .pp-check-bar { height: 100%; background: #16A34A; border-radius: 5px; transition: width 0.3s ease; }
        .pp-check-count { font-size: 11.5px; font-weight: 700; color: #9A9A9A; white-space: nowrap; }

        /* Material list */
        .pp-material-list { display: flex; flex-direction: column; gap: 0; border: 1px solid #F0F0F0; border-radius: 12px; overflow: hidden; }

        .pp-material-row {
          display: flex; align-items: flex-start; gap: 0;
          border-bottom: 1px solid #F8F8F8; padding: 12px 16px;
          transition: background 0.1s;
        }
        .pp-material-row:last-child { border-bottom: none; }
        .pp-material-row:hover { background: #FAFAFA; }

        .pp-material-left {
          display: flex; align-items: center; gap: 8px;
          width: 200px; flex-shrink: 0;
          padding-top: 2px;
        }
        @media (max-width: 600px) { .pp-material-left { width: 140px; } }

        .pp-material-icon { display: flex; align-items: center; color: #6B7280; flex-shrink: 0; }
        .pp-material-label { font-size: 13px; font-weight: 600; color: #1a1a1a; }

        .pp-material-right {
          flex: 1; min-width: 0; display: flex; flex-wrap: wrap; gap: 6px; align-items: center;
        }

        /* Link chips */
        .pp-link-chip {
          display: inline-flex; align-items: center; gap: 5px;
          background: #F0F5FF; border: 1px solid #C7D8F8; border-radius: 20px;
          padding: 4px 8px 4px 7px; max-width: 260px;
        }
        .pp-link-name {
          font-size: 12px; font-weight: 500; color: #1B2B4B;
          text-decoration: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          max-width: 160px; flex: 1;
        }
        .pp-link-name:hover { text-decoration: underline; }
        .pp-link-ext { color: #9B9B9B; flex-shrink: 0; }
        .pp-link-del {
          width: 16px; height: 16px; border: none; background: none;
          cursor: pointer; color: #9B9B9B; display: flex; align-items: center;
          justify-content: center; flex-shrink: 0; border-radius: 50%;
          transition: all 0.12s; padding: 0;
        }
        .pp-link-del:hover { background: #FEE2E2; color: #DC2626; }

        /* Add link form */
        .pp-add-form {
          width: 100%; display: flex; flex-direction: column; gap: 6px;
          background: #FAFAFA; border: 1.5px solid #E0E8FF;
          border-radius: 10px; padding: 10px 12px; margin-top: 2px;
        }
        .pp-add-url, .pp-add-name {
          border: 1.5px solid #E8E8E8; border-radius: 7px; padding: 7px 10px;
          font-size: 12.5px; font-family: inherit; outline: none;
          background: white; color: #0a0a0a; transition: border-color 0.15s;
        }
        .pp-add-url:focus, .pp-add-name:focus { border-color: #1B2B4B; }
        .pp-add-url::placeholder, .pp-add-name::placeholder { color: #C0C0C0; }
        .pp-add-btns { display: flex; gap: 6px; }
        .pp-add-confirm {
          height: 30px; padding: 0 12px; background: #1B2B4B; color: white;
          border: none; border-radius: 6px; font-size: 12px; font-weight: 600;
          cursor: pointer; font-family: inherit; transition: background 0.15s;
        }
        .pp-add-confirm:hover:not(:disabled) { background: #254067; }
        .pp-add-confirm:disabled { background: #E8E8E8; color: #9A9A9A; cursor: not-allowed; }
        .pp-add-cancel {
          height: 30px; padding: 0 12px;
          border: 1px solid #E8E8E8; background: white; border-radius: 6px;
          font-size: 12px; color: #5C5C5C; cursor: pointer; font-family: inherit;
          transition: all 0.15s;
        }
        .pp-add-cancel:hover { border-color: #C0C0C0; color: #0a0a0a; }

        /* Add link button */
        .pp-add-link-btn {
          display: inline-flex; align-items: center; gap: 5px;
          height: 28px; padding: 0 10px;
          border: 1.5px dashed #D0D0D0; border-radius: 20px;
          background: none; font-size: 12px; font-weight: 500; color: #9A9A9A;
          cursor: pointer; font-family: inherit; transition: all 0.15s;
        }
        .pp-add-link-btn:hover { border-color: #1B2B4B; color: #1B2B4B; background: #F0F5FF; }

        /* Checklist */
        .pp-checklist { display: flex; flex-direction: column; gap: 2px; }
        .pp-check-row {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 14px; border-radius: 9px; cursor: pointer;
          transition: background 0.12s; user-select: none;
        }
        .pp-check-row:hover { background: #F5F5F5; }
        .pp-check-input { width: 16px; height: 16px; accent-color: #16A34A; cursor: pointer; flex-shrink: 0; }
        .pp-check-label { flex: 1; font-size: 13.5px; color: #1a1a1a; transition: color 0.15s; }
        .pp-check-label--done { color: #9A9A9A; text-decoration: line-through; }
        .pp-check-done-mark { color: #16A34A; flex-shrink: 0; }

        /* Saving indicator */
        .pp-saving {
          display: flex; align-items: center; gap: 6px;
          font-size: 12px; color: #9A9A9A;
        }
        .pp-spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
