'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DateTimePicker } from '@/components/ui/DateTimePicker'
import type { Task } from '@/types'

interface Props {
  clients: { id: string; name: string }[]
  projects: { id: string; name: string }[]
  profiles: { id: string; full_name: string }[]
  currentUserId: string
  defaultStatus?: Task['status']
  defaultClientId?: string
  onClose: () => void
  onCreated: (task: Task) => void
}

export function NewTaskModal({ clients, projects, profiles, currentUserId, defaultStatus, defaultClientId, onClose, onCreated }: Props) {
  const [form, setForm] = useState({
    title: '',
    client_id: defaultClientId || '',
    project_id: '',
    responsible_id: currentUserId,
    priority: 'medium' as Task['priority'],
    status: (defaultStatus ?? 'todo') as Task['status'],
    deadline: '',
    description: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return

    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error: err } = await supabase
      .from('tasks')
      .insert({
        title: form.title.trim(),
        client_id: form.client_id || null,
        project_id: form.project_id || null,
        responsible_id: form.responsible_id || null,
        created_by: user?.id ?? null,
        priority: form.priority,
        status: form.status,
        deadline: form.deadline || null,
        description: form.description || null,
      })
      .select(`
        *,
        client:clients(id, name),
        project:projects(id, name),
        responsible:profiles!tasks_responsible_id_fkey(id, full_name)
      `)
      .single()

    if (err) {
      setError(`Error: ${err.message}`)
      setLoading(false)
      return
    }

    // Log task creation activity
    if (data) {
      supabase.from('task_activity').insert({
        task_id: data.id,
        user_id: user?.id,
        action: 'task_created',
        details: { title: data.title },
      }).then(() => {})
    }

    onCreated(data as Task)
    onClose()
  }

  if (!mounted) return null

  return createPortal(
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>Nova tasca</h2>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-field">
            <label>Títol *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value.toUpperCase() })}
              placeholder="Títol de la tasca"
              style={{ textTransform: 'uppercase' }}
              required
              autoFocus
            />
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Client</label>
              <select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })}>
                <option value="">Sense client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Projecte</label>
              <select value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })}>
                <option value="">Sense projecte</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Responsable</label>
              <select value={form.responsible_id} onChange={(e) => setForm({ ...form, responsible_id: e.target.value })}>
                <option value="">Sense assignar</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>{p.full_name}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Prioritat</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Task['priority'] })}>
                <option value="low">Baixa</option>
                <option value="medium">Mitja</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Estat</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Task['status'] })}>
                <option value="inbox">Inbox</option>
                <option value="todo">Per fer</option>
                <option value="in_progress">En curs</option>
                <option value="review">Revisió</option>
                <option value="blocked">Bloquejat</option>
              </select>
            </div>

            <div className="form-field">
              <label>Deadline</label>
              <DateTimePicker
                value={form.deadline}
                onChange={(v) => setForm({ ...form, deadline: v })}
                placeholder="Selecciona data i hora..."
              />
            </div>
          </div>

          <div className="form-field">
            <label>Descripció</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Descripció opcional..."
              rows={3}
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel·lar</button>
            <button type="submit" className="btn-primary" disabled={loading || !form.title.trim()}>
              {loading ? 'Creant...' : 'Crear tasca'}
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
          max-width: 540px;
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
          gap: 14px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .form-field { display: flex; flex-direction: column; gap: 6px; }

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
          height: 38px;
          padding: 0 10px;
          border: 1.5px solid #E8E8E8;
          border-radius: 7px;
          font-size: 13.5px;
          color: #0a0a0a;
          background: #FAFAFA;
          outline: none;
          transition: border-color 0.15s;
          font-family: inherit;
        }

        .form-field textarea { height: auto; padding: 9px 10px; resize: vertical; line-height: 1.5; }

        .form-field input:focus,
        .form-field select:focus,
        .form-field textarea:focus { border-color: #1B2B4B; background: white; }

        .form-error {
          font-size: 13px;
          color: #DC2626;
          background: #FEF2F2;
          border: 1px solid #FECACA;
          padding: 10px 12px;
          border-radius: 8px;
        }

        .modal-actions { display: flex; justify-content: flex-end; gap: 8px; padding-top: 4px; }

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
    </div>,
    document.body
  )
}
