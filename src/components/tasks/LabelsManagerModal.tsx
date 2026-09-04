'use client'

import { useState } from 'react'
import { X, Plus, Trash2, Check, Edit2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export interface Label {
  id: string
  name: string
  color: string
}

const COLOR_PALETTE = [
  // Vermells / taronges
  '#DC2626', '#EF4444', '#F87171', '#EA580C', '#FB923C', '#FCD34D',
  // Grocs / verds
  '#D97706', '#FBBF24', '#A3E635', '#65A30D', '#16A34A', '#4ADE80',
  // Cians / blaus
  '#0891B2', '#22D3EE', '#3B82F6', '#1B2B4B', '#4A82C6', '#93C5FD',
  // Violetes / roses
  '#6366F1', '#818CF8', '#7C3AED', '#A78BFA', '#9333EA', '#C084FC',
  '#DB2777', '#F472B6', '#EC4899', '#FDA4AF',
  // Grisos / neutres
  '#64748B', '#94A3B8', '#0a0a0a', '#5C5C5C', '#9A9A9A', '#C0C0C0',
]

interface Props {
  labels: Label[]
  onClose: () => void
  onChanged: (labels: Label[]) => void
}

export function LabelsManagerModal({ labels: initialLabels, onClose, onChanged }: Props) {
  const [labels, setLabels] = useState<Label[]>(initialLabels)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#1B2B4B')
  const [creating, setCreating] = useState(false)

  const supabase = createClient()

  const startEdit = (label: Label) => {
    setEditingId(label.id)
    setEditName(label.name)
    setEditColor(label.color)
  }

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return
    const { data } = await supabase
      .from('labels')
      .update({ name: editName.trim(), color: editColor })
      .eq('id', editingId)
      .select()
      .single()
    if (data) {
      const updated = labels.map((l) => l.id === editingId ? data as Label : l)
      setLabels(updated)
      onChanged(updated)
    }
    setEditingId(null)
  }

  const deleteLabel = async (id: string) => {
    await supabase.from('labels').delete().eq('id', id)
    const updated = labels.filter((l) => l.id !== id)
    setLabels(updated)
    onChanged(updated)
  }

  const createLabel = async () => {
    if (!newName.trim()) return
    setCreating(true)
    const { data, error } = await supabase
      .from('labels')
      .insert({ name: newName.trim(), color: newColor })
      .select()
      .single()
    if (error) {
      console.error('[createLabel] error:', error)
      alert(`Error creant etiqueta: ${error.message}`)
    } else if (data) {
      const updated = [...labels, data as Label]
      setLabels(updated)
      onChanged(updated)
      setNewName('')
      setNewColor('#1B2B4B')
    }
    setCreating(false)
  }

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>Gestionar etiquetes</h2>
          <button className="close-btn" onClick={onClose}><X size={15} /></button>
        </div>

        <div className="modal-body">
          {/* Existing labels */}
          <div className="labels-list">
            {labels.length === 0 && (
              <div className="empty">Encara no hi ha etiquetes</div>
            )}
            {labels.map((label) => (
              <div key={label.id} className="label-row">
                {editingId === label.id ? (
                  <div className="edit-row">
                    <ColorPicker value={editColor} onChange={setEditColor} />
                    <input
                      className="edit-input"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                      autoFocus
                    />
                    <button className="icon-btn icon-btn--confirm" onClick={saveEdit}><Check size={13} /></button>
                    <button className="icon-btn" onClick={() => setEditingId(null)}><X size={13} /></button>
                  </div>
                ) : (
                  <div className="view-row">
                    <span className="label-preview" style={{ color: label.color, background: `${label.color}18`, borderColor: `${label.color}30` }}>
                      <span className="dot" style={{ background: label.color }} />
                      {label.name}
                    </span>
                    <div className="row-actions">
                      <button className="icon-btn" onClick={() => startEdit(label)} title="Editar"><Edit2 size={13} /></button>
                      <button className="icon-btn icon-btn--danger" onClick={() => deleteLabel(label.id)} title="Eliminar"><Trash2 size={13} /></button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Create new */}
          <div className="create-section">
            <div className="create-title">Nova etiqueta</div>
            <ColorPicker value={newColor} onChange={setNewColor} />
            <div className="create-row">
              <input
                className="create-input"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nom de l'etiqueta..."
                onKeyDown={(e) => e.key === 'Enter' && createLabel()}
              />
              <button
                className="create-btn"
                onClick={createLabel}
                disabled={!newName.trim() || creating}
              >
                <Plus size={14} />
                Crear
              </button>
            </div>
            {newName && (
              <div className="preview-label">
                <span className="label-preview" style={{ color: newColor, background: `${newColor}18`, borderColor: `${newColor}30` }}>
                  <span className="dot" style={{ background: newColor }} />
                  {newName}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1100;
          padding: 24px;
        }

        .modal {
          background: white;
          border-radius: 14px;
          width: 100%;
          max-width: 420px;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 24px 64px rgba(0,0,0,0.2);
          overflow: hidden;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid #F0F0F0;
          flex-shrink: 0;
        }
        .modal-header h2 { font-size: 15px; font-weight: 700; color: #0a0a0a; }

        .close-btn {
          width: 28px; height: 28px;
          border: none; background: #F0F0F0; border-radius: 6px;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          color: #5C5C5C; transition: all 0.15s;
        }
        .close-btn:hover { background: #E8E8E8; color: #0a0a0a; }

        .modal-body {
          padding: 16px 20px 20px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .empty { font-size: 13px; color: #9A9A9A; text-align: center; padding: 16px 0; }

        .labels-list { display: flex; flex-direction: column; gap: 6px; }

        .label-row {
          border-radius: 8px;
          overflow: hidden;
        }

        .view-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 4px;
          border-radius: 8px;
          transition: background 0.1s;
        }
        .view-row:hover { background: #F8F8F8; }

        .edit-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 4px;
          background: #F8F8F8;
          border-radius: 8px;
        }

        .label-preview {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 20px;
          border: 1px solid;
        }

        .dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }

        .row-actions { display: flex; gap: 4px; }

        .icon-btn {
          width: 28px; height: 28px;
          border: none; background: transparent; border-radius: 6px;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          color: #9A9A9A; transition: all 0.1s;
        }
        .icon-btn:hover { background: #F0F0F0; color: #5C5C5C; }
        .icon-btn--danger:hover { background: #FEF2F2; color: #DC2626; }
        .icon-btn--confirm:hover { background: #F0FDF4; color: #16A34A; }

        .edit-input {
          flex: 1;
          height: 32px;
          padding: 0 8px;
          border: 1.5px solid #1B2B4B;
          border-radius: 7px;
          font-size: 13px;
          font-family: inherit;
          outline: none;
          background: white;
        }

        /* Create section */
        .create-section {
          border-top: 1px solid #F0F0F0;
          padding-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .create-title {
          font-size: 11px;
          font-weight: 700;
          color: #9A9A9A;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .create-row {
          display: flex;
          gap: 8px;
        }

        .create-input {
          flex: 1;
          height: 36px;
          padding: 0 10px;
          border: 1.5px solid #E8E8E8;
          border-radius: 8px;
          font-size: 13.5px;
          font-family: inherit;
          outline: none;
          background: #FAFAFA;
          transition: border-color 0.15s;
        }
        .create-input:focus { border-color: #1B2B4B; background: white; }
        .create-input::placeholder { color: #C0C0C0; }

        .create-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          height: 36px;
          padding: 0 14px;
          background: #1B2B4B;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.15s;
          white-space: nowrap;
        }
        .create-btn:hover:not(:disabled) { background: #4A82C6; }
        .create-btn:disabled { background: #E8E8E8; color: #9A9A9A; cursor: not-allowed; }

        .preview-label { display: flex; }
      `}</style>
    </div>
  )
}

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  const isCustom = !COLOR_PALETTE.includes(value)
  return (
    <div className="color-picker">
      {COLOR_PALETTE.map((c) => (
        <button
          key={c}
          className={`color-swatch${value === c ? ' color-swatch--active' : ''}`}
          style={{ background: c }}
          onClick={() => onChange(c)}
          title={c}
        >
          {value === c && <Check size={9} color="white" strokeWidth={3} />}
        </button>
      ))}
      {/* Custom color */}
      <label
        className={`color-swatch color-swatch--custom${isCustom ? ' color-swatch--active' : ''}`}
        style={{ background: isCustom ? value : 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)', border: isCustom ? '2px solid white' : '2px solid transparent' }}
        title="Color personalitzat"
      >
        <input
          type="color"
          value={isCustom ? value : '#ff0000'}
          onChange={e => onChange(e.target.value)}
          style={{ opacity: 0, position: 'absolute', width: 0, height: 0 }}
        />
        {isCustom && <Check size={9} color="white" strokeWidth={3} />}
      </label>
      <style jsx>{`
        .color-picker {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .color-swatch {
          width: 24px;
          height: 24px;
          border-radius: 6px;
          border: 2px solid transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.1s;
          flex-shrink: 0;
          position: relative;
        }
        .color-swatch:hover { transform: scale(1.15); }
        .color-swatch--active { border-color: white; box-shadow: 0 0 0 2px currentColor; }
        .color-swatch--custom { border-radius: 6px; overflow: hidden; }
        .color-swatch--custom:hover { transform: scale(1.15); }
      `}</style>
    </div>
  )
}
