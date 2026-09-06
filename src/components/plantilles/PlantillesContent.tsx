'use client'

import { useState, useEffect } from 'react'
import { Plus, ChevronDown, ChevronUp, Pencil, Trash2, Check, X, Copy } from 'lucide-react'

const STAGES = [
  { order: 1, label: 'Primer contacte en fred' },
  { order: 2, label: 'Segon contacte — recordatori del primer' },
  { order: 3, label: 'Tercer contacte — recordatori del segon' },
  { order: 4, label: 'Quan respon — proposta de dates per videotrucada' },
  { order: 5, label: 'Enviament de pressupost' },
  { order: 6, label: 'Inici de coordinació — enviament de briefing' },
  { order: 7, label: 'Enviament de contracte' },
  { order: 8, label: 'Enviament de dades SEPA' },
]

interface Template {
  id: string
  stage_order: number
  stage_label: string
  subject: string
  body: string
  created_by: string
  created_at: string
}

export function PlantillesContent() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedStage, setExpandedStage] = useState<number | null>(null)
  const [newFor, setNewFor] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [form, setForm] = useState({ subject: '', body: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/plantilles')
      .then(r => r.json())
      .then(d => { setTemplates(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const templatesForStage = (order: number) => templates.filter(t => t.stage_order === order)

  const openNew = (order: number) => {
    setNewFor(order)
    setEditingId(null)
    setForm({ subject: '', body: '' })
    setExpandedStage(order)
  }

  const openEdit = (t: Template) => {
    setEditingId(t.id)
    setNewFor(null)
    setForm({ subject: t.subject, body: t.body })
    setExpandedStage(t.stage_order)
  }

  const cancelForm = () => {
    setNewFor(null)
    setEditingId(null)
    setForm({ subject: '', body: '' })
  }

  const saveNew = async (order: number) => {
    if (!form.subject.trim() || !form.body.trim()) return
    setSaving(true)
    const stage = STAGES.find(s => s.order === order)!
    const res = await fetch('/api/plantilles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage_order: order, stage_label: stage.label, subject: form.subject, body: form.body }),
    })
    const data = await res.json()
    setTemplates(prev => [...prev, data].sort((a, b) => a.stage_order - b.stage_order))
    cancelForm()
    setSaving(false)
  }

  const saveEdit = async (id: string) => {
    if (!form.subject.trim() || !form.body.trim()) return
    setSaving(true)
    const res = await fetch(`/api/plantilles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject: form.subject, body: form.body }),
    })
    const data = await res.json()
    setTemplates(prev => prev.map(t => t.id === id ? data : t))
    cancelForm()
    setSaving(false)
  }

  const deleteTemplate = async (id: string) => {
    if (!confirm('Eliminar aquesta plantilla?')) return
    await fetch(`/api/plantilles/${id}`, { method: 'DELETE' })
    setTemplates(prev => prev.filter(t => t.id !== id))
  }

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 1800)
  }

  if (loading) return <div className="plt-loading">Carregant plantilles...</div>

  return (
    <div className="plt-wrap">
      <div className="plt-header">
        <h1 className="plt-title">Plantilles de venda</h1>
        <p className="plt-subtitle">Correus organitzats per etapa del procés de venda</p>
      </div>

      <div className="plt-stages">
        {STAGES.map(stage => {
          const stageTemplates = templatesForStage(stage.order)
          const isExpanded = expandedStage === stage.order
          const isNewOpen = newFor === stage.order

          return (
            <div key={stage.order} className={`plt-stage${isExpanded ? ' plt-stage--open' : ''}`}>
              <button
                className="plt-stage-header"
                onClick={() => setExpandedStage(isExpanded ? null : stage.order)}
              >
                <div className="plt-stage-left">
                  <span className="plt-stage-num">{stage.order}</span>
                  <span className="plt-stage-label">{stage.label}</span>
                  {stageTemplates.length > 0 && (
                    <span className="plt-stage-count">{stageTemplates.length}</span>
                  )}
                </div>
                <div className="plt-stage-right">
                  <button
                    className="plt-add-btn"
                    onClick={e => { e.stopPropagation(); openNew(stage.order) }}
                    title="Nova plantilla"
                  >
                    <Plus size={14} />
                  </button>
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>

              {isExpanded && (
                <div className="plt-stage-body">
                  {stageTemplates.length === 0 && !isNewOpen && (
                    <div className="plt-empty">
                      Cap plantilla per a aquesta etapa.{' '}
                      <button className="plt-empty-add" onClick={() => openNew(stage.order)}>Afegir-ne una</button>
                    </div>
                  )}

                  {stageTemplates.map(t => {
                    const isEditing = editingId === t.id
                    return (
                      <div key={t.id} className={`plt-card${isEditing ? ' plt-card--editing' : ''}`}>
                        {isEditing ? (
                          <div className="plt-form">
                            <label className="plt-form-label">Assumpte</label>
                            <input
                              className="plt-form-input"
                              value={form.subject}
                              onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                              placeholder="Assumpte del correu..."
                            />
                            <label className="plt-form-label">Cos del correu</label>
                            <textarea
                              className="plt-form-textarea"
                              value={form.body}
                              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                              placeholder="Escriu el cos del correu aquí..."
                              rows={10}
                            />
                            <div className="plt-form-btns">
                              <button className="plt-save-btn" onClick={() => saveEdit(t.id)} disabled={saving}>
                                <Check size={14} /> {saving ? 'Desant...' : 'Desar'}
                              </button>
                              <button className="plt-cancel-btn" onClick={cancelForm}>
                                <X size={14} /> Cancel·lar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="plt-card-top">
                              <div className="plt-card-subject">{t.subject}</div>
                              <div className="plt-card-actions">
                                <button
                                  className={`plt-copy-btn${copied === t.id + '-body' ? ' plt-copy-btn--done' : ''}`}
                                  onClick={() => copyText(t.body, t.id + '-body')}
                                  title="Copiar cos"
                                >
                                  {copied === t.id + '-body' ? <Check size={13} /> : <Copy size={13} />}
                                </button>
                                <button className="plt-icon-btn" onClick={() => openEdit(t)} title="Editar">
                                  <Pencil size={13} />
                                </button>
                                <button className="plt-icon-btn plt-icon-btn--danger" onClick={() => deleteTemplate(t.id)} title="Eliminar">
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                            <pre className="plt-card-body">{t.body}</pre>
                          </>
                        )}
                      </div>
                    )
                  })}

                  {isNewOpen && (
                    <div className="plt-card plt-card--new">
                      <div className="plt-form">
                        <label className="plt-form-label">Assumpte</label>
                        <input
                          className="plt-form-input"
                          value={form.subject}
                          onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                          placeholder="Assumpte del correu..."
                          autoFocus
                        />
                        <label className="plt-form-label">Cos del correu</label>
                        <textarea
                          className="plt-form-textarea"
                          value={form.body}
                          onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                          placeholder="Escriu el cos del correu aquí..."
                          rows={10}
                        />
                        <div className="plt-form-btns">
                          <button className="plt-save-btn" onClick={() => saveNew(stage.order)} disabled={saving}>
                            <Check size={14} /> {saving ? 'Desant...' : 'Desar plantilla'}
                          </button>
                          <button className="plt-cancel-btn" onClick={cancelForm}>
                            <X size={14} /> Cancel·lar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <style jsx>{`
        .plt-wrap { padding: 32px; }
        .plt-loading { padding: 40px; color: #6B7280; }
        .plt-header { margin-bottom: 28px; }
        .plt-title { font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 4px; }
        .plt-subtitle { font-size: 13px; color: #6B7280; margin: 0; }

        .plt-stages { display: flex; flex-direction: column; gap: 8px; }

        .plt-stage { background: #fff; border: 1px solid #E5E7EB; border-radius: 10px; overflow: hidden; }
        .plt-stage--open { border-color: #9BB5D5; }

        .plt-stage-header {
          width: 100%; display: flex; align-items: center; justify-content: space-between;
          padding: 14px 16px; background: none; border: none; cursor: pointer;
          text-align: left; gap: 12px;
        }
        .plt-stage-header:hover { background: #F9FAFB; }
        .plt-stage--open .plt-stage-header { background: #F5F9FF; }

        .plt-stage-left { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
        .plt-stage-num {
          width: 24px; height: 24px; border-radius: 50%; background: #254067; color: #fff;
          font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .plt-stage-label { font-size: 13.5px; font-weight: 600; color: #374151; }
        .plt-stage-count {
          background: #EEF3FA; color: #1a2e4a; font-size: 11px; font-weight: 600;
          padding: 1px 7px; border-radius: 10px;
        }

        .plt-stage-right { display: flex; align-items: center; gap: 8px; color: #9CA3AF; flex-shrink: 0; }

        .plt-add-btn {
          width: 26px; height: 26px; border-radius: 6px; border: 1px solid #D1D5DB;
          background: #fff; display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #6B7280;
        }
        .plt-add-btn:hover { background: #F3F4F6; border-color: #254067; color: #254067; }

        .plt-stage-body { padding: 4px 16px 16px; display: flex; flex-direction: column; gap: 10px; }

        .plt-empty { font-size: 13px; color: #9CA3AF; padding: 12px 0; }
        .plt-empty-add { color: #254067; background: none; border: none; cursor: pointer; font-size: 13px; text-decoration: underline; padding: 0; }

        .plt-card {
          border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden;
          background: #FAFAFA;
        }
        .plt-card--new { border-color: #9BB5D5; background: #F5F9FF; }
        .plt-card--editing { border-color: #9BB5D5; background: #F5F9FF; }

        .plt-card-top {
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          padding: 10px 14px 8px; border-bottom: 1px solid #F3F4F6;
        }
        .plt-card-subject { font-size: 13px; font-weight: 600; color: #1F2937; }
        .plt-card-actions { display: flex; align-items: center; gap: 4px; }

        .plt-copy-btn {
          width: 26px; height: 26px; border-radius: 5px; border: 1px solid #E5E7EB;
          background: #fff; display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #6B7280;
        }
        .plt-copy-btn:hover { background: #F3F4F6; }
        .plt-copy-btn--done { color: #16A34A; border-color: #BBF7D0; background: #F0FDF4; }

        .plt-icon-btn {
          width: 26px; height: 26px; border-radius: 5px; border: 1px solid #E5E7EB;
          background: #fff; display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #6B7280;
        }
        .plt-icon-btn:hover { background: #F3F4F6; }
        .plt-icon-btn--danger:hover { color: #DC2626; border-color: #FECACA; background: #FEF2F2; }

        .plt-card-body {
          padding: 10px 14px; font-size: 12.5px; color: #374151;
          white-space: pre-wrap; font-family: inherit; margin: 0; line-height: 1.65;
          max-height: 180px; overflow-y: auto;
        }

        .plt-form { padding: 14px; display: flex; flex-direction: column; gap: 8px; }
        .plt-form-label { font-size: 11px; font-weight: 600; color: #6B7280; text-transform: uppercase; letter-spacing: 0.04em; }
        .plt-form-input {
          width: 100%; padding: 8px 10px; border: 1px solid #D1D5DB; border-radius: 6px;
          font-size: 13.5px; color: #111827; background: #fff; outline: none;
        }
        .plt-form-input:focus { border-color: #254067; box-shadow: 0 0 0 2px #EEF3FA; }
        .plt-form-textarea {
          width: 100%; padding: 8px 10px; border: 1px solid #D1D5DB; border-radius: 6px;
          font-size: 13px; color: #111827; background: #fff; outline: none;
          resize: vertical; font-family: inherit; line-height: 1.6;
        }
        .plt-form-textarea:focus { border-color: #254067; box-shadow: 0 0 0 2px #EEF3FA; }

        .plt-form-btns { display: flex; gap: 8px; margin-top: 4px; }
        .plt-save-btn {
          display: flex; align-items: center; gap: 6px; padding: 8px 16px;
          background: #254067; color: #fff; border: none; border-radius: 7px;
          font-size: 13px; font-weight: 600; cursor: pointer;
        }
        .plt-save-btn:hover:not(:disabled) { background: #1a2e4a; }
        .plt-save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .plt-cancel-btn {
          display: flex; align-items: center; gap: 6px; padding: 8px 14px;
          background: #fff; color: #6B7280; border: 1px solid #D1D5DB; border-radius: 7px;
          font-size: 13px; cursor: pointer;
        }
        .plt-cancel-btn:hover { background: #F9FAFB; }
      `}</style>
    </div>
  )
}
