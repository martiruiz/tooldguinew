'use client'

import { useState, useRef } from 'react'
import { X, Upload, FileText, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Client {
  id: string
  name: string
}

interface Props {
  clients: Client[]
  onClose: () => void
  onCreated?: (contract: any) => void
}

export function NewContractModal({ clients, onClose, onCreated }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    title: '',
    client_id: '',
    type: 'retainer',
    status: 'draft',
    start_date: '',
    end_date: '',
    value: '',
    notes: '',
  })
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.type !== 'application/pdf') { setError('Només s\'accepten fitxers PDF.'); return }
    if (f.size > 20 * 1024 * 1024) { setError('El fitxer no pot superar els 20 MB.'); return }
    setPdfFile(f)
    setError('')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (!f) return
    if (f.type !== 'application/pdf') { setError('Només s\'accepten fitxers PDF.'); return }
    setPdfFile(f)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    setError('')

    const supabase = createClient()
    let pdf_url: string | null = null

    // Upload PDF if provided
    if (pdfFile) {
      setUploading(true)
      const path = `contracts/${Date.now()}_${pdfFile.name.replace(/\s+/g, '_')}`
      const { error: uploadErr } = await supabase.storage
        .from('documents')
        .upload(path, pdfFile, { contentType: 'application/pdf', upsert: false })

      if (uploadErr) {
        setError(`Error pujant el PDF: ${uploadErr.message}`)
        setSaving(false)
        setUploading(false)
        return
      }
      const { data } = supabase.storage.from('documents').getPublicUrl(path)
      pdf_url = data.publicUrl
      setUploading(false)
    }

    // Insert contract
    const { data, error: insertErr } = await supabase
      .from('contracts')
      .insert({
        title: form.title.trim(),
        client_id: form.client_id || null,
        type: form.type,
        status: form.status,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        value: form.value ? parseFloat(form.value) : null,
        notes: form.notes || null,
        pdf_url,
      })
      .select('*, client:clients(id,name)')
      .single()

    if (insertErr) {
      setError(`Error desant el contracte: ${insertErr.message}`)
      setSaving(false)
      return
    }

    onCreated?.(data)
    router.refresh()
    onClose()
  }

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        {/* Header */}
        <div className="modal-header">
          <h2>Nou contracte</h2>
          <button className="close-btn" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* Title */}
          <div className="field">
            <label>Nom del contracte *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Ex: Servei Social Media 2025"
              required
              autoFocus
            />
          </div>

          {/* Client + Type */}
          <div className="row">
            <div className="field">
              <label>Client</label>
              <select value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })}>
                <option value="">Sense client</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Tipus</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="retainer">Retainer</option>
                <option value="project">Projecte</option>
                <option value="service">Servei mensual</option>
                <option value="annual">Anual</option>
              </select>
            </div>
          </div>

          {/* Status + Value */}
          <div className="row">
            <div className="field">
              <label>Estat</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="draft">Esborrany</option>
                <option value="pending">Pendent de firma</option>
                <option value="active">Actiu</option>
                <option value="expired">Expirat</option>
              </select>
            </div>
            <div className="field">
              <label>Valor (€)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.value}
                onChange={e => setForm({ ...form, value: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="row">
            <div className="field">
              <label>Data d'inici</label>
              <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div className="field">
              <label>Data de fi</label>
              <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
            </div>
          </div>

          {/* Notes */}
          <div className="field">
            <label>Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Observacions, condicions especials..."
              rows={3}
            />
          </div>

          {/* PDF Upload */}
          <div className="field">
            <label>Document PDF</label>
            <div
              className={`drop-zone${pdfFile ? ' has-file' : ''}`}
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
            >
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf"
                style={{ display: 'none' }}
                onChange={handleFile}
              />
              {pdfFile ? (
                <div className="file-preview">
                  <FileText size={20} color="#1B2B4B" />
                  <div className="file-info">
                    <span className="file-name">{pdfFile.name}</span>
                    <span className="file-size">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <button
                    type="button"
                    className="file-remove"
                    onClick={e => { e.stopPropagation(); setPdfFile(null) }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="drop-hint">
                  <Upload size={20} color="#9A9A9A" strokeWidth={1.8} />
                  <span>Arrossega el PDF aquí o <strong>clica per pujar</strong></span>
                  <span className="drop-sub">PDF · màx. 20 MB</span>
                </div>
              )}
            </div>
          </div>

          {error && <div className="error-msg">{error}</div>}

          {/* Actions */}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel·lar</button>
            <button type="submit" className="btn-primary" disabled={saving || !form.title.trim()}>
              {saving ? (
                <><Loader2 size={14} className="spin" />{uploading ? 'Pujant PDF...' : 'Desant...'}</>
              ) : 'Crear contracte'}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.45);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000; padding: 24px;
        }
        .modal {
          background: white; border-radius: 18px; width: 100%; max-width: 560px;
          box-shadow: 0 24px 72px rgba(0,0,0,0.22); max-height: 90vh; overflow-y: auto;
        }
        .modal-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 24px 16px; border-bottom: 1px solid #F0F0F0;
        }
        .modal-header h2 { font-size: 16px; font-weight: 700; color: #0a0a0a; }
        .close-btn {
          width: 28px; height: 28px; border: none; background: #F0F0F0;
          border-radius: 6px; cursor: pointer; display: flex; align-items: center;
          justify-content: center; color: #5C5C5C; transition: background 0.15s;
        }
        .close-btn:hover { background: #E8E8E8; }

        .modal-body { padding: 20px 24px 24px; display: flex; flex-direction: column; gap: 14px; }

        .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 500px) { .row { grid-template-columns: 1fr; } }

        .field { display: flex; flex-direction: column; gap: 5px; }
        .field label {
          font-size: 11px; font-weight: 700; color: #5C5C5C;
          text-transform: uppercase; letter-spacing: 0.06em;
        }
        .field input, .field select, .field textarea {
          height: 40px; padding: 0 12px; border: 1.5px solid #E8E8E8; border-radius: 8px;
          font-size: 13.5px; color: #0a0a0a; background: #FAFAFA; outline: none;
          font-family: inherit; transition: border-color 0.15s;
        }
        .field textarea { height: auto; padding: 10px 12px; resize: vertical; }
        .field input:focus, .field select:focus, .field textarea:focus {
          border-color: #4A82C6; background: white;
        }

        /* Drop zone */
        .drop-zone {
          border: 2px dashed #E0E4EE; border-radius: 10px; padding: 20px;
          cursor: pointer; transition: all 0.15s; background: #FAFAFA;
          display: flex; align-items: center; justify-content: center;
        }
        .drop-zone:hover { border-color: #4A82C6; background: #F0F4FF; }
        .drop-zone.has-file { border-style: solid; border-color: #1B2B4B30; background: #F8F9FC; }

        .drop-hint { display: flex; flex-direction: column; align-items: center; gap: 6px; color: #9A9A9A; font-size: 13px; text-align: center; }
        .drop-hint strong { color: #1B2B4B; }
        .drop-sub { font-size: 11px; color: #C0C0C0; }

        .file-preview { display: flex; align-items: center; gap: 12px; width: 100%; }
        .file-info { flex: 1; min-width: 0; }
        .file-name { font-size: 13px; font-weight: 600; color: #0a0a0a; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .file-size { font-size: 11px; color: #9A9A9A; }
        .file-remove {
          width: 24px; height: 24px; border: none; background: #F0F0F0;
          border-radius: 5px; cursor: pointer; display: flex; align-items: center;
          justify-content: center; color: #9A9A9A; flex-shrink: 0; transition: all 0.15s;
        }
        .file-remove:hover { background: #FEE2E2; color: #DC2626; }

        .error-msg {
          font-size: 13px; color: #DC2626; background: #FEF2F2;
          border: 1px solid #FECACA; padding: 10px 12px; border-radius: 8px;
        }

        .modal-actions { display: flex; justify-content: flex-end; gap: 8px; padding-top: 4px; }
        .btn-secondary {
          height: 40px; padding: 0 16px; border: 1px solid #E8E8E8; border-radius: 8px;
          font-size: 13.5px; font-weight: 500; cursor: pointer; background: white;
          color: #5C5C5C; transition: all 0.15s; font-family: inherit;
        }
        .btn-secondary:hover { border-color: #D0D0D0; color: #0a0a0a; }
        .btn-primary {
          height: 40px; padding: 0 20px; background: #1B2B4B; color: white; border: none;
          border-radius: 8px; font-size: 13.5px; font-weight: 600; cursor: pointer;
          transition: background 0.15s; font-family: inherit;
          display: flex; align-items: center; gap: 8px;
        }
        .btn-primary:hover:not(:disabled) { background: #4A82C6; }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

        :global(.spin) { animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
