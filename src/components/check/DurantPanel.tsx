'use client'

import { useState, useCallback } from 'react'
import { Plus, Sparkles, Loader2, Trash2, GripVertical, Lightbulb } from 'lucide-react'

export interface ShotItem {
  id: string
  contingut: string
  format: string
  prioritat: 'Alta' | 'Mitjana' | 'Baixa'
  estat: 'pendent' | 'gravant' | 'fet' | 'revisat'
}

export interface DurantData {
  shot_list: ShotItem[]
  incidencies: {
    que_ha_passat: string
    no_gravat: string
    repetir: string
    material_fallat: string
    canvis_client: string
  }
  idees: { id: string; text: string }[]
}

export const DEFAULT_DURANT_DATA: DurantData = {
  shot_list: [],
  incidencies: { que_ha_passat: '', no_gravat: '', repetir: '', material_fallat: '', canvis_client: '' },
  idees: [],
}

const FORMATS = ['Vídeo', 'Foto', 'Vertical', 'Story', 'Reel', 'Entrevista', 'B-roll', 'Time-lapse', 'Podcast', 'Altre']
const PRIORITATS: ('Alta' | 'Mitjana' | 'Baixa')[] = ['Alta', 'Mitjana', 'Baixa']
const ESTATS: ShotItem['estat'][] = ['pendent', 'gravant', 'fet', 'revisat']

const ESTAT_CONFIG: Record<ShotItem['estat'], { label: string; dotColor: string; bg: string; color: string }> = {
  pendent:  { label: 'Pendent',     dotColor: '#DC2626', bg: '#FEF2F2', color: '#DC2626' },
  gravant:  { label: 'En gravació', dotColor: '#D97706', bg: '#FFFBEB', color: '#D97706' },
  fet:      { label: 'Fet',         dotColor: '#16A34A', bg: '#F0FDF4', color: '#16A34A' },
  revisat:  { label: 'Revisat',     dotColor: '#254067', bg: '#EFF6FF', color: '#254067' },
}

const PRIORITAT_CONFIG: Record<'Alta'|'Mitjana'|'Baixa', { bg: string; color: string }> = {
  Alta:    { bg: '#FEF2F2', color: '#DC2626' },
  Mitjana: { bg: '#FFFBEB', color: '#D97706' },
  Baixa:   { bg: '#F0FDF4', color: '#16A34A' },
}

interface Props {
  sessionId: string
  previaPdfUrl: string | null
  initialData: DurantData
  onSaved: (data: DurantData) => void
}

export function DurantPanel({ sessionId, previaPdfUrl, initialData, onSaved }: Props) {
  const [data, setData] = useState<DurantData>(initialData)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newIdea, setNewIdea] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  const save = useCallback(async (d: DurantData) => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/check/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ durant_data: d }),
      })
      const json = await res.json()
      if (json.error) { setError(json.error); return }
      onSaved(d)
    } finally { setSaving(false) }
  }, [sessionId, onSaved])

  const saveNow = () => save(data)

  const updateData = (updater: (d: DurantData) => DurantData) => {
    setData(prev => updater(prev))
  }

  // Shot list helpers
  const addShot = () => {
    const newItem: ShotItem = {
      id: `${Date.now()}`,
      contingut: '',
      format: 'Vídeo',
      prioritat: 'Mitjana',
      estat: 'pendent',
    }
    setData(d => ({ ...d, shot_list: [...d.shot_list, newItem] }))
    setEditingId(newItem.id)
  }

  const updateShot = (id: string, field: keyof ShotItem, value: string) => {
    setData(d => ({
      ...d,
      shot_list: d.shot_list.map(s => s.id === id ? { ...s, [field]: value } : s),
    }))
  }

  const cycleEstat = (id: string) => {
    setData(prev => {
      const next = { ...prev, shot_list: prev.shot_list.map(s => {
        if (s.id !== id) return s
        const idx = ESTATS.indexOf(s.estat)
        return { ...s, estat: ESTATS[(idx + 1) % ESTATS.length] }
      })}
      save(next)
      return next
    })
  }

  const removeShot = (id: string) => {
    setData(d => ({ ...d, shot_list: d.shot_list.filter(s => s.id !== id) }))
  }

  // Generate from PDF
  const generateFromPdf = async () => {
    if (!previaPdfUrl) return
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/check/sessions/generate-shotlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdf_url: previaPdfUrl }),
      })
      const json = await res.json()
      if (json.error) { setError(json.error); return }
      const newData: DurantData = { ...data, shot_list: json.shot_list }
      setData(newData)
      await save(newData)
    } finally { setGenerating(false) }
  }

  // Incidències helper
  const setInc = (key: keyof DurantData['incidencies'], val: string) => {
    setData(d => ({ ...d, incidencies: { ...d.incidencies, [key]: val } }))
  }

  // Idees
  const addIdea = () => {
    const text = newIdea.trim()
    if (!text) return
    setData(d => ({ ...d, idees: [...d.idees, { id: `${Date.now()}`, text }] }))
    setNewIdea('')
  }

  const removeIdea = (id: string) => {
    setData(d => ({ ...d, idees: d.idees.filter(i => i.id !== id) }))
  }

  const doneCount = data.shot_list.filter(s => s.estat === 'fet' || s.estat === 'revisat').length
  const total = data.shot_list.length

  return (
    <div className="dp-wrap">

      {/* ── Shot List ── */}
      <div className="dp-section">
        <div className="dp-section-hdr">
          <div>
            <div className="dp-section-title">Shot list / Contingut a capturar</div>
            {total > 0 && (
              <div className="dp-progress-bar-wrap">
                <div className="dp-progress-bar" style={{ width: `${(doneCount / total) * 100}%` }} />
                <span className="dp-progress-label">{doneCount}/{total} capturats</span>
              </div>
            )}
          </div>
          <div className="dp-section-actions">
            {previaPdfUrl && (
              <button className="dp-btn-generate" onClick={generateFromPdf} disabled={generating}>
                {generating ? <Loader2 size={13} className="dp-spin" /> : <Sparkles size={13} />}
                {generating ? 'Generant...' : 'Generar des del PDF'}
              </button>
            )}
            <button className="dp-btn-add-shot" onClick={addShot}>
              <Plus size={13} /> Afegir element
            </button>
          </div>
        </div>

        {error && <div className="dp-error">{error}</div>}

        {data.shot_list.length === 0 ? (
          <div className="dp-empty">
            {previaPdfUrl
              ? <><Sparkles size={20} /><span>Clica "Generar des del PDF" per crear la shot list automàticament</span></>
              : <><Plus size={20} /><span>Afegeix els elements de contingut a capturar</span></>
            }
          </div>
        ) : (
          <div className="dp-table-wrap">
            <table className="dp-table">
              <thead>
                <tr>
                  <th className="dp-th" style={{ width: 32 }}></th>
                  <th className="dp-th">Contingut</th>
                  <th className="dp-th" style={{ width: 130 }}>Format</th>
                  <th className="dp-th" style={{ width: 110 }}>Prioritat</th>
                  <th className="dp-th" style={{ width: 150 }}>Estat</th>
                  <th className="dp-th" style={{ width: 36 }}></th>
                </tr>
              </thead>
              <tbody>
                {data.shot_list.map(item => {
                  const ec = ESTAT_CONFIG[item.estat]
                  const pc = PRIORITAT_CONFIG[item.prioritat]
                  return (
                    <tr key={item.id} className="dp-tr">
                      <td className="dp-td dp-td--grip">
                        <GripVertical size={14} className="dp-grip" />
                      </td>
                      <td className="dp-td dp-td--main">
                        {editingId === item.id ? (
                          <input
                            className="dp-inline-input"
                            value={item.contingut}
                            autoFocus
                            onChange={e => updateShot(item.id, 'contingut', e.target.value)}
                            onBlur={() => setEditingId(null)}
                            onKeyDown={e => e.key === 'Enter' && setEditingId(null)}
                            placeholder="Descripció..."
                          />
                        ) : (
                          <span
                            className={`dp-contingut-text${item.estat === 'revisat' ? ' dp-contingut-text--done' : ''}`}
                            onClick={() => setEditingId(item.id)}
                          >
                            {item.contingut || <span className="dp-placeholder">Descripció...</span>}
                          </span>
                        )}
                      </td>
                      <td className="dp-td">
                        <select
                          className="dp-select"
                          value={item.format}
                          onChange={e => updateShot(item.id, 'format', e.target.value)}
                        >
                          {FORMATS.map(f => <option key={f}>{f}</option>)}
                        </select>
                      </td>
                      <td className="dp-td">
                        <select
                          className="dp-select dp-select--prioritat"
                          value={item.prioritat}
                          style={{ background: pc.bg, color: pc.color }}
                          onChange={e => updateShot(item.id, 'prioritat', e.target.value)}
                        >
                          {PRIORITATS.map(p => <option key={p}>{p}</option>)}
                        </select>
                      </td>
                      <td className="dp-td">
                        <button
                          className="dp-estat-btn"
                          style={{ background: ec.bg, color: ec.color }}
                          onClick={() => cycleEstat(item.id)}
                          title="Clicar per canviar estat"
                        >
                          <span className="dp-estat-dot" style={{ background: ec.dotColor }} />
                          {ec.label}
                        </button>
                      </td>
                      <td className="dp-td dp-td--del">
                        <button className="dp-del-btn" onClick={() => removeShot(item.id)}>
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Incidències ── */}
      <div className="dp-section">
        <div className="dp-section-title">Incidències</div>
        <div className="dp-inc-grid">
          {([
            { key: 'que_ha_passat',   label: 'Què ha passat?' },
            { key: 'no_gravat',       label: 'Què no s\'ha pogut gravar?' },
            { key: 'repetir',         label: 'Què s\'ha de repetir?' },
            { key: 'material_fallat', label: 'Material que ha fallat' },
            { key: 'canvis_client',   label: 'Canvis demanats pel client' },
          ] as { key: keyof DurantData['incidencies']; label: string }[]).map(({ key, label }) => (
            <div key={key} className="dp-inc-field">
              <label className="dp-inc-label">{label}</label>
              <textarea
                className="dp-inc-area"
                rows={2}
                value={data.incidencies[key]}
                onChange={e => setInc(key, e.target.value)}
                placeholder="—"
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Idees espontànies ── */}
      <div className="dp-section">
        <div className="dp-section-title">Idees espontànies</div>
        <div className="dp-idees-list">
          {data.idees.map(idea => (
            <div key={idea.id} className="dp-idea-row">
              <Lightbulb size={15} className="dp-idea-dot" />
              <span className="dp-idea-text">{idea.text}</span>
              <button className="dp-del-btn" onClick={() => removeIdea(idea.id)}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
        <div className="dp-idea-input-row">
          <input
            className="dp-idea-input"
            value={newIdea}
            onChange={e => setNewIdea(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addIdea()}
            placeholder="Escriu una idea..."
          />
          <button className="dp-btn-add-idea" onClick={addIdea} disabled={!newIdea.trim()}>
            <Plus size={14} /> Afegir idea
          </button>
        </div>
      </div>

      {/* Save */}
      <button className="dp-save-btn" onClick={saveNow} disabled={saving}>
        {saving ? <Loader2 size={13} className="dp-spin" /> : null}
        Desar panell
      </button>

      <style jsx>{`
        .dp-wrap { display: flex; flex-direction: column; gap: 24px; }

        .dp-section { display: flex; flex-direction: column; gap: 12px; }

        .dp-section-hdr {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 12px; flex-wrap: wrap;
        }

        .dp-section-title {
          font-size: 15px; font-weight: 700; color: #0a0a0a; margin-bottom: 2px;
        }

        .dp-section-actions { display: flex; gap: 8px; flex-wrap: wrap; }

        .dp-error {
          background: #FEF2F2; color: #DC2626; font-size: 12.5px;
          padding: 8px 12px; border-radius: 8px; border: 1px solid #FECACA;
        }

        /* Progress bar */
        .dp-progress-bar-wrap {
          height: 4px; background: #F0F0F0; border-radius: 4px;
          width: 200px; margin-top: 6px; position: relative; overflow: visible;
        }
        .dp-progress-bar {
          height: 100%; background: #16A34A; border-radius: 4px; transition: width 0.4s ease;
        }
        .dp-progress-label {
          font-size: 10.5px; color: #9A9A9A; margin-top: 4px; display: block;
          font-weight: 600;
        }

        /* Buttons */
        .dp-btn-generate {
          display: flex; align-items: center; gap: 6px;
          height: 34px; padding: 0 14px;
          background: linear-gradient(135deg, #254067, #254067); color: white;
          border: none; border-radius: 8px; font-size: 12.5px; font-weight: 600;
          cursor: pointer; font-family: inherit; transition: all 0.15s;
        }
        .dp-btn-generate:hover:not(:disabled) { opacity: 0.88; }
        .dp-btn-generate:disabled { opacity: 0.6; cursor: not-allowed; }

        .dp-btn-add-shot {
          display: flex; align-items: center; gap: 5px;
          height: 34px; padding: 0 12px;
          border: 1.5px solid #E8E8E8; background: white;
          border-radius: 8px; font-size: 12.5px; font-weight: 600; color: #5C5C5C;
          cursor: pointer; font-family: inherit; transition: all 0.15s;
        }
        .dp-btn-add-shot:hover { border-color: #1B2B4B; color: #1B2B4B; }

        /* Empty state */
        .dp-empty {
          display: flex; align-items: center; gap: 10px; justify-content: center;
          padding: 32px 20px; border: 2px dashed #E8E8E8; border-radius: 12px;
          color: #B0B0B0; font-size: 13.5px; font-weight: 500;
        }

        /* Table */
        .dp-table-wrap { overflow-x: auto; border-radius: 10px; border: 1px solid #F0F0F0; }
        .dp-table {
          width: 100%; border-collapse: collapse; font-size: 13px;
        }
        .dp-th {
          text-align: left; padding: 9px 12px;
          font-size: 10.5px; font-weight: 700; color: #9A9A9A;
          text-transform: uppercase; letter-spacing: 0.05em;
          background: #FAFAFA; border-bottom: 1px solid #F0F0F0;
          white-space: nowrap;
        }
        .dp-tr { border-bottom: 1px solid #F8F8F8; transition: background 0.1s; }
        .dp-tr:last-child { border-bottom: none; }
        .dp-tr:hover { background: #FAFAFA; }
        .dp-td { padding: 8px 12px; vertical-align: middle; }
        .dp-td--grip { padding: 8px 4px 8px 10px; color: #D0D0D0; cursor: grab; }
        .dp-td--main { min-width: 160px; }
        .dp-td--del { padding: 8px 10px 8px 4px; }

        .dp-grip { display: block; }

        .dp-contingut-text {
          cursor: text; display: block; min-height: 24px;
          color: #1a1a1a; line-height: 1.4; font-size: 13px;
        }
        .dp-contingut-text--done { color: #9A9A9A; text-decoration: line-through; }
        .dp-placeholder { color: #C0C0C0; }

        .dp-inline-input {
          border: 1.5px solid #1B2B4B; border-radius: 6px; padding: 4px 8px;
          font-size: 13px; font-family: inherit; outline: none; width: 100%;
          background: white; color: #0a0a0a;
        }

        .dp-select {
          border: 1.5px solid #E8E8E8; border-radius: 7px; padding: 5px 8px;
          font-size: 12.5px; font-family: inherit; outline: none;
          background: #FAFAFA; color: #0a0a0a; cursor: pointer;
          transition: border-color 0.15s; width: 100%;
        }
        .dp-select:focus { border-color: #1B2B4B; background: white; }

        .dp-select--prioritat {
          font-weight: 700; border-color: transparent;
        }

        .dp-estat-btn {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 10px; border: none; border-radius: 20px;
          font-size: 12px; font-weight: 700; cursor: pointer;
          font-family: inherit; transition: all 0.15s; white-space: nowrap;
          width: 100%; justify-content: center;
        }
        .dp-estat-btn:hover { filter: brightness(0.95); }
        .dp-estat-dot {
          width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
        }

        .dp-del-btn {
          width: 26px; height: 26px; border: none; background: none;
          border-radius: 5px; cursor: pointer; color: #D0D0D0;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.12s;
        }
        .dp-del-btn:hover { background: #FEF2F2; color: #DC2626; }

        /* Incidències */
        .dp-inc-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
        }
        @media (max-width: 600px) { .dp-inc-grid { grid-template-columns: 1fr; } }

        .dp-inc-field { display: flex; flex-direction: column; gap: 5px; }
        .dp-inc-label {
          font-size: 11px; font-weight: 700; color: #9A9A9A;
          text-transform: uppercase; letter-spacing: 0.05em;
        }
        .dp-inc-area {
          border: 1.5px solid #E8E8E8; border-radius: 8px; padding: 8px 10px;
          font-size: 13.5px; font-family: inherit; outline: none;
          background: #FAFAFA; color: #0a0a0a; resize: vertical;
          transition: border-color 0.15s; line-height: 1.5;
        }
        .dp-inc-area:focus { border-color: #1B2B4B; background: white; }
        .dp-inc-area::placeholder { color: #D0D0D0; }

        /* Idees */
        .dp-idees-list { display: flex; flex-direction: column; gap: 6px; }

        .dp-idea-row {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 12px; background: #FFFBEB; border: 1px solid #FEF08A;
          border-radius: 8px;
        }
        .dp-idea-dot { color: #D97706; flex-shrink: 0; }
        .dp-idea-text { flex: 1; font-size: 13.5px; color: #1a1a1a; }

        .dp-idea-input-row { display: flex; gap: 8px; }
        .dp-idea-input {
          flex: 1; height: 38px; padding: 0 12px;
          border: 1.5px solid #E8E8E8; border-radius: 8px;
          font-size: 13.5px; font-family: inherit; outline: none;
          background: #FAFAFA; transition: border-color 0.15s;
        }
        .dp-idea-input:focus { border-color: #1B2B4B; background: white; }
        .dp-idea-input::placeholder { color: #C0C0C0; }

        .dp-btn-add-idea {
          display: flex; align-items: center; gap: 6px;
          height: 38px; padding: 0 14px; white-space: nowrap;
          background: #FFFBEB; border: 1.5px solid #FEF08A;
          border-radius: 8px; font-size: 13px; font-weight: 600; color: #854D0E;
          cursor: pointer; font-family: inherit; transition: all 0.15s;
        }
        .dp-btn-add-idea:hover:not(:disabled) { background: #FEF9C3; border-color: #FDE047; }
        .dp-btn-add-idea:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Save */
        .dp-save-btn {
          display: flex; align-items: center; gap: 6px; align-self: flex-start;
          height: 38px; padding: 0 20px; background: #1B2B4B; color: white;
          border: none; border-radius: 8px; font-size: 13.5px; font-weight: 600;
          cursor: pointer; font-family: inherit; transition: background 0.15s;
        }
        .dp-save-btn:hover:not(:disabled) { background: #254067; }
        .dp-save-btn:disabled { background: #E8E8E8; color: #9A9A9A; cursor: not-allowed; }

        .dp-spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
