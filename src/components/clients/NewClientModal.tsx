'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { clientTypeLabels } from '@/lib/utils'

const clientTypes = Object.entries(clientTypeLabels)

interface Props {
  profiles: { id: string; full_name: string }[]
  onClose: () => void
  onCreated?: (client: any) => void
}

export function NewClientModal({ profiles, onClose, onCreated }: Props) {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    type: 'club_esportiu',
    responsible_id: '',
    website: '',
    description: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return

    setLoading(true)
    setError('')

    const baseSlug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'client'
    const slug = `${baseSlug}-${Date.now().toString(36)}`

    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          slug,
          type: form.type,
          status: 'active',
          health: 'healthy',
          responsible_id: form.responsible_id || null,
          website: form.website || null,
          description: form.description || null,
        }),
      })

      const json = await res.json()

      if (!res.ok || json.error) {
        setError(`Error: ${json.error || 'Error desconegut'}`)
        setLoading(false)
        return
      }

      onClose()
      if (onCreated) {
        onCreated(json)
      } else {
        router.push(`/clients/${json.id}`)
        router.refresh()
      }
    } catch (err: any) {
      setError(`Error: ${err.message}`)
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>Nou client</h2>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-field">
            <label>Nom *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nom del client"
              required
              autoFocus
            />
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Tipus</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {clientTypes.map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Responsable</label>
              <select
                value={form.responsible_id}
                onChange={(e) => setForm({ ...form, responsible_id: e.target.value })}
              >
                <option value="">Sense assignar</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>{p.full_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-field">
            <label>Web</label>
            <input
              type="url"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="form-field">
            <label>Descripció</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Breu descripció del client..."
              rows={3}
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel·lar</button>
            <button type="submit" className="btn-primary" disabled={loading || !form.name.trim()}>
              {loading ? 'Creant...' : 'Crear client'}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 24px;
        }

        .modal {
          background: white;
          border-radius: 16px;
          width: 100%;
          max-width: 520px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.2);
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px 16px;
          border-bottom: 1px solid #F0F0F0;
        }

        .modal-header h2 {
          font-size: 16px;
          font-weight: 700;
          color: #0a0a0a;
          letter-spacing: -0.01em;
        }

        .modal-close {
          width: 28px;
          height: 28px;
          border: none;
          background: #F0F0F0;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #5C5C5C;
          transition: all 0.15s;
        }

        .modal-close:hover { background: #E8E8E8; color: #0a0a0a; }

        .modal-form {
          padding: 20px 24px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-field label {
          font-size: 12px;
          font-weight: 600;
          color: #5C5C5C;
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }

        .form-field input,
        .form-field select,
        .form-field textarea {
          height: 40px;
          padding: 0 12px;
          border: 1.5px solid #E8E8E8;
          border-radius: 8px;
          font-size: 14px;
          color: #0a0a0a;
          background: #FAFAFA;
          outline: none;
          transition: border-color 0.15s;
          font-family: inherit;
        }

        .form-field textarea {
          height: auto;
          padding: 10px 12px;
          resize: vertical;
          line-height: 1.5;
        }

        .form-field input:focus,
        .form-field select:focus,
        .form-field textarea:focus {
          border-color: #1B2B4B;
          background: white;
        }

        .form-error {
          font-size: 13px;
          color: #DC2626;
          background: #FEF2F2;
          border: 1px solid #FECACA;
          padding: 10px 12px;
          border-radius: 8px;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          padding-top: 4px;
        }

        .btn-secondary {
          height: 38px;
          padding: 0 16px;
          border: 1px solid #E8E8E8;
          border-radius: 8px;
          font-size: 13.5px;
          font-weight: 500;
          cursor: pointer;
          background: white;
          color: #5C5C5C;
          transition: all 0.15s;
        }

        .btn-secondary:hover { border-color: #D0D0D0; color: #0a0a0a; }

        .btn-primary {
          height: 38px;
          padding: 0 16px;
          background: #1B2B4B;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
        }

        .btn-primary:hover:not(:disabled) { background: #4A82C6; }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>
    </div>
  )
}
