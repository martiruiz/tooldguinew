'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  clients: { id: string; name: string }[]
  profiles: { id: string; full_name: string }[]
  currentUserId?: string
  onClose: () => void
  onCreated?: (p: any) => void
}

export function NewProjectModal({ clients, profiles, currentUserId, onClose, onCreated }: Props) {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    client_id: '',
    type: 'social_media',
    status: 'planning',
    responsible_id: currentUserId || '',
    description: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase.from('projects').insert({
      name: form.name.trim(),
      client_id: form.client_id || null,
      type: form.type,
      status: form.status,
      responsible_id: form.responsible_id || null,
      description: form.description || null,
    })
    if (err) { setError(err.message); setLoading(false); return }
    if (onCreated) {
      const { data: created } = await supabase.from('projects').select('*, client:clients(id,name), responsible:profiles(id,full_name)').eq('name', form.name.trim()).order('created_at', { ascending: false }).limit(1).single()
      if (created) onCreated(created)
    }
    router.refresh()
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>Nou projecte</h2>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-field">
            <label>Nom del projecte *</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nom del projecte" required autoFocus />
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Client</label>
              <select value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })}>
                <option value="">Sense client</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>Tipus</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="social_media">Social Media</option>
                <option value="web">Web</option>
                <option value="branding">Branding</option>
                <option value="video">Vídeo</option>
                <option value="events">Esdeveniments</option>
                <option value="strategy">Estratègia</option>
                <option value="other">Altre</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Estat</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="planning">Planificació</option>
                <option value="active">Actiu</option>
                <option value="at_risk">Risc</option>
                <option value="blocked">Bloquejat</option>
                <option value="completed">Completat</option>
              </select>
            </div>
            <div className="form-field">
              <label>Responsable</label>
              <select value={form.responsible_id} onChange={e => setForm({ ...form, responsible_id: e.target.value })}>
                <option value="">Sense assignar</option>
                {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select>
            </div>
          </div>

          <div className="form-field">
            <label>Descripció</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Descripció opcional..." rows={3} />
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel·lar</button>
            <button type="submit" className="btn-primary" disabled={loading || !form.name.trim()}>
              {loading ? 'Creant...' : 'Crear projecte'}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.4);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000; padding: 24px;
        }
        .modal {
          background: white; border-radius: 16px; width: 100%; max-width: 520px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.2); max-height: 90vh; overflow-y: auto;
        }
        .modal-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 24px 16px; border-bottom: 1px solid #F0F0F0;
        }
        .modal-header h2 { font-size: 16px; font-weight: 700; color: #0a0a0a; }
        .modal-close {
          width: 28px; height: 28px; border: none; background: #F0F0F0;
          border-radius: 6px; cursor: pointer; display: flex; align-items: center;
          justify-content: center; color: #5C5C5C; transition: all 0.15s;
        }
        .modal-close:hover { background: #E8E8E8; }
        .modal-form { padding: 20px 24px 24px; display: flex; flex-direction: column; gap: 14px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .form-field { display: flex; flex-direction: column; gap: 6px; }
        .form-field label { font-size: 12px; font-weight: 600; color: #5C5C5C; letter-spacing: 0.03em; text-transform: uppercase; }
        .form-field input, .form-field select, .form-field textarea {
          height: 38px; padding: 0 10px; border: 1.5px solid #E8E8E8; border-radius: 7px;
          font-size: 13.5px; color: #0a0a0a; background: #FAFAFA; outline: none;
          font-family: inherit; transition: border-color 0.15s;
        }
        .form-field textarea { height: auto; padding: 9px 10px; resize: vertical; }
        .form-field input:focus, .form-field select:focus, .form-field textarea:focus { border-color: #1B2B4B; background: white; }
        .form-error { font-size: 13px; color: #DC2626; background: #FEF2F2; border: 1px solid #FECACA; padding: 10px 12px; border-radius: 8px; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 8px; padding-top: 4px; }
        .btn-secondary { height: 38px; padding: 0 16px; border: 1px solid #E8E8E8; border-radius: 8px; font-size: 13.5px; font-weight: 500; cursor: pointer; background: white; color: #5C5C5C; transition: all 0.15s; }
        .btn-secondary:hover { border-color: #D0D0D0; color: #0a0a0a; }
        .btn-primary { height: 38px; padding: 0 16px; background: #1B2B4B; color: white; border: none; border-radius: 8px; font-size: 13.5px; font-weight: 600; cursor: pointer; transition: background 0.15s; }
        .btn-primary:hover:not(:disabled) { background: #4A82C6; }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>
    </div>
  )
}
