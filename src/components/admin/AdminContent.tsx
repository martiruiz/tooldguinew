'use client'

import { useState } from 'react'
import { Plus, Shield, User, Users, Edit2, Power, KeyRound, X, Eye, EyeOff } from 'lucide-react'
import { cn, roleLabels, getInitials } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

interface Props {
  members: Profile[]
  currentUserId: string
}

export function AdminContent({ members, currentUserId }: Props) {
  const [localMembers, setLocalMembers] = useState(members)
  const [showNew, setShowNew] = useState(false)
  const [newForm, setNewForm] = useState({ email: '', full_name: '', role: 'team_member', position: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Change password modal
  const [pwdMember, setPwdMember] = useState<Profile | null>(null)
  const [pwd, setPwd] = useState('')
  const [pwdConfirm, setPwdConfirm] = useState('')
  const [pwdShow, setPwdShow] = useState(false)
  const [pwdLoading, setPwdLoading] = useState(false)
  const [pwdError, setPwdError] = useState('')
  const [pwdSuccess, setPwdSuccess] = useState('')

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pwd !== pwdConfirm) { setPwdError('Les contrasenyes no coincideixen.'); return }
    if (pwd.length < 8) { setPwdError('Mínim 8 caràcters.'); return }
    setPwdLoading(true)
    setPwdError('')
    const res = await fetch('/api/admin/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: pwdMember?.id, password: pwd }),
    })
    const data = await res.json()
    setPwdLoading(false)
    if (!res.ok) { setPwdError(data.error || 'Error.'); return }
    setPwdSuccess('Contrasenya actualitzada correctament.')
    setPwd(''); setPwdConfirm('')
    setTimeout(() => { setPwdMember(null); setPwdSuccess('') }, 1500)
  }

  const handleToggleActive = async (member: Profile) => {
    if (member.id === currentUserId) return
    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .update({ is_active: !member.is_active })
      .eq('id', member.id)
      .select()
      .single()

    if (data) {
      setLocalMembers((prev) => prev.map((m) => m.id === member.id ? { ...m, is_active: !m.is_active } : m))
    }
  }

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const res = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newForm),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Error al crear el membre.')
      setLoading(false)
      return
    }

    setSuccess(`Membre ${newForm.full_name} creat. S'ha enviat un correu de benvinguda.`)
    setShowNew(false)
    setNewForm({ email: '', full_name: '', role: 'team_member', position: '' })
    setLoading(false)
    // Reload members
    const supabase = createClient()
    const { data: updatedMembers } = await supabase.from('profiles').select('*').order('created_at')
    if (updatedMembers) setLocalMembers(updatedMembers as Profile[])
  }

  const stats = {
    total: localMembers.length,
    active: localMembers.filter((m) => m.is_active).length,
    admins: localMembers.filter((m) => m.role === 'superadmin').length,
    managers: localMembers.filter((m) => m.role === 'manager').length,
  }

  return (
    <div className="admin-page">
      {/* Stats */}
      <div className="admin-stats">
        {[
          { label: 'Total membres', value: stats.total, icon: <Users size={16} /> },
          { label: 'Actius', value: stats.active, icon: <User size={16} /> },
          { label: 'Admins', value: stats.admins, icon: <Shield size={16} /> },
          { label: 'Managers', value: stats.managers, icon: <User size={16} /> },
        ].map((s) => (
          <div key={s.label} className="admin-stat">
            <div className="admin-stat-icon">{s.icon}</div>
            <div>
              <div className="admin-stat-value">{s.value}</div>
              <div className="admin-stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Team section */}
      <div className="admin-section">
        <div className="admin-section-header">
          <h2>Equip</h2>
          <button className="btn-primary" onClick={() => setShowNew(!showNew)}>
            <Plus size={14} strokeWidth={2.5} />
            Afegir membre
          </button>
        </div>

        {success && (
          <div className="success-msg">✓ {success}</div>
        )}

        {/* New member form */}
        {showNew && (
          <form onSubmit={handleCreateMember} className="new-member-form">
            <div className="form-row">
              <div className="form-field">
                <label>Nom complet *</label>
                <input
                  type="text"
                  value={newForm.full_name}
                  onChange={(e) => setNewForm({ ...newForm, full_name: e.target.value })}
                  placeholder="Nom Cognoms"
                  required
                />
              </div>
              <div className="form-field">
                <label>Email *</label>
                <input
                  type="email"
                  value={newForm.email}
                  onChange={(e) => setNewForm({ ...newForm, email: e.target.value })}
                  placeholder="email@agenciaguinew.com"
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label>Càrrec</label>
                <input
                  type="text"
                  value={newForm.position}
                  onChange={(e) => setNewForm({ ...newForm, position: e.target.value })}
                  placeholder="Ex: Community Manager"
                />
              </div>
              <div className="form-field">
                <label>Rol</label>
                <select
                  value={newForm.role}
                  onChange={(e) => setNewForm({ ...newForm, role: e.target.value })}
                >
                  <option value="team_member">Team Member</option>
                  <option value="manager">Manager</option>
                  <option value="superadmin">Superadmin</option>
                </select>
              </div>
            </div>
            {error && <div className="form-error">{error}</div>}
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowNew(false)}>
                Cancel·lar
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Creant...' : 'Crear membre'}
              </button>
            </div>
          </form>
        )}

        {/* Members table */}
        <div className="members-table">
          <div className="members-header-row">
            <span>Membre</span>
            <span>Càrrec</span>
            <span>Rol</span>
            <span>Estat</span>
            <span>Accions</span>
          </div>
          {localMembers.map((member) => (
            <div key={member.id} className={cn('member-row', !member.is_active && 'member-row--inactive')}>
              <div className="member-info">
                <div className="member-avatar">
                  {member.avatar_url ? (
                    <img src={member.avatar_url} alt={member.full_name} />
                  ) : (
                    getInitials(member.full_name)
                  )}
                </div>
                <div>
                  <div className="member-name">{member.full_name}</div>
                  <div className="member-email">{member.email}</div>
                </div>
              </div>
              <div className="member-position">{member.position || '—'}</div>
              <div>
                <span className={cn('role-badge', `role-badge--${member.role}`)}>
                  {roleLabels[member.role]}
                </span>
              </div>
              <div>
                <span className={cn('status-badge', member.is_active ? 'status-badge--active' : 'status-badge--inactive')}>
                  {member.is_active ? 'Actiu' : 'Inactiu'}
                </span>
              </div>
              <div className="member-actions">
                {member.id !== currentUserId && (
                  <button
                    className="action-btn"
                    onClick={() => handleToggleActive(member)}
                    title={member.is_active ? 'Desactivar' : 'Activar'}
                  >
                    <Power size={13} strokeWidth={2} />
                  </button>
                )}
                <button
                  className="action-btn"
                  title="Canviar contrasenya"
                  onClick={() => { setPwdMember(member); setPwd(''); setPwdConfirm(''); setPwdError(''); setPwdSuccess('') }}
                >
                  <KeyRound size={13} strokeWidth={2} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .admin-page {
          flex: 1;
          padding: 24px 28px 40px;
          overflow-y: auto;
        }

        @media (max-width: 1023px) { .admin-page { padding: 16px; } }

        .admin-stats {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .admin-stat {
          flex: 1;
          min-width: 120px;
          background: white;
          border: 1px solid #ECECEC;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .admin-stat-icon {
          width: 36px;
          height: 36px;
          background: #1B2B4B14;
          color: #1B2B4B;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .admin-stat-value {
          font-size: 22px;
          font-weight: 700;
          color: #0a0a0a;
          letter-spacing: -0.02em;
          line-height: 1;
        }

        .admin-stat-label {
          font-size: 12px;
          color: #9A9A9A;
          margin-top: 3px;
        }

        .admin-section {
          background: white;
          border: 1px solid #ECECEC;
          border-radius: 14px;
          overflow: hidden;
        }

        .admin-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 20px;
          border-bottom: 1px solid #F0F0F0;
        }

        .admin-section-header h2 {
          font-size: 15px;
          font-weight: 700;
          color: #0a0a0a;
        }

        .btn-primary {
          display: flex;
          align-items: center;
          gap: 6px;
          height: 34px;
          padding: 0 14px;
          background: #1B2B4B;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
        }
        .btn-primary:hover:not(:disabled) { background: #4A82C6; }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

        .btn-secondary {
          height: 34px;
          padding: 0 14px;
          border: 1px solid #E8E8E8;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          background: white;
          color: #5C5C5C;
          transition: all 0.15s;
        }
        .btn-secondary:hover { border-color: #D0D0D0; color: #0a0a0a; }

        .success-msg {
          margin: 16px 20px 0;
          font-size: 13px;
          color: #16A34A;
          background: #F0FDF4;
          border: 1px solid #BBF7D0;
          padding: 10px 14px;
          border-radius: 8px;
        }

        /* New member form */
        .new-member-form {
          padding: 20px;
          border-bottom: 1px solid #F0F0F0;
          display: flex;
          flex-direction: column;
          gap: 14px;
          background: #FAFAFA;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        @media (max-width: 600px) { .form-row { grid-template-columns: 1fr; } }

        .form-field { display: flex; flex-direction: column; gap: 6px; }

        .form-field label {
          font-size: 11px;
          font-weight: 600;
          color: #5C5C5C;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .form-field input,
        .form-field select {
          height: 38px;
          padding: 0 10px;
          border: 1.5px solid #E8E8E8;
          border-radius: 7px;
          font-size: 13.5px;
          color: #0a0a0a;
          background: white;
          outline: none;
          transition: border-color 0.15s;
          font-family: inherit;
        }

        .form-field input:focus,
        .form-field select:focus { border-color: #1B2B4B; }

        .form-error {
          font-size: 13px;
          color: #DC2626;
          background: #FEF2F2;
          border: 1px solid #FECACA;
          padding: 10px 12px;
          border-radius: 7px;
        }

        .form-actions { display: flex; justify-content: flex-end; gap: 8px; }

        /* Members table */
        .members-table {}

        .members-header-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 0.8fr 0.6fr;
          padding: 10px 20px;
          font-size: 11px;
          font-weight: 600;
          color: #9A9A9A;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          border-bottom: 1px solid #F0F0F0;
        }

        @media (max-width: 768px) {
          .members-header-row { display: none; }
        }

        .member-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 0.8fr 0.6fr;
          align-items: center;
          padding: 14px 20px;
          border-bottom: 1px solid #F8F8F8;
          transition: background 0.1s;
          gap: 12px;
        }

        .member-row:last-child { border-bottom: none; }
        .member-row:hover { background: #FAFAFA; }
        .member-row--inactive { opacity: 0.5; }

        @media (max-width: 768px) {
          .admin-page { padding: 12px 12px 80px; }
          .member-row { grid-template-columns: 1fr auto; }
          .member-position { display: none; }
          .member-row > div:nth-child(3),
          .member-row > div:nth-child(4) { display: none; }
        }

        .member-info { display: flex; align-items: center; gap: 12px; }

        .member-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #1B2B4B14;
          color: #1B2B4B;
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          overflow: hidden;
        }

        .member-avatar img { width: 100%; height: 100%; object-fit: cover; }

        .member-name {
          font-size: 13.5px;
          font-weight: 600;
          color: #0a0a0a;
        }

        .member-email {
          font-size: 12px;
          color: #9A9A9A;
          margin-top: 1px;
        }

        .member-position { font-size: 13px; color: #5C5C5C; }

        .role-badge {
          font-size: 11px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 5px;
        }

        .role-badge--superadmin { background: #1B2B4B14; color: #1B2B4B; }
        .role-badge--manager { background: #6366F114; color: #6366F1; }
        .role-badge--team_member { background: #F0F0F0; color: #5C5C5C; }

        .status-badge {
          font-size: 11px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 5px;
        }

        .status-badge--active { background: #F0FDF4; color: #16A34A; }
        .status-badge--inactive { background: #F5F5F5; color: #9A9A9A; }

        .member-actions { display: flex; gap: 6px; }

        .action-btn {
          width: 28px;
          height: 28px;
          border: 1px solid #E8E8E8;
          border-radius: 7px;
          background: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9A9A9A;
          transition: all 0.15s;
        }
        .action-btn:hover { border-color: #D0D0D0; color: #0a0a0a; }

        /* Password modal */
        .pwd-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(0,0,0,0.4);
          display: flex; align-items: center; justify-content: center; padding: 24px;
        }
        .pwd-modal {
          background: white; border-radius: 16px; width: 100%; max-width: 400px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.2); overflow: hidden;
        }
        .pwd-modal-hdr {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 20px 14px; border-bottom: 1px solid #F0F0F0;
        }
        .pwd-modal-hdr h3 { font-size: 15px; font-weight: 700; color: #0a0a0a; }
        .pwd-modal-hdr p { font-size: 12px; color: #6B7280; margin-top: 2px; }
        .pwd-close { width: 26px; height: 26px; border: none; background: #F0F0F0; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #5C5C5C; }
        .pwd-close:hover { background: #E8E8E8; }
        .pwd-form { padding: 18px 20px 20px; display: flex; flex-direction: column; gap: 14px; }
        .pwd-field { display: flex; flex-direction: column; gap: 5px; }
        .pwd-field label { font-size: 11px; font-weight: 700; color: #5C5C5C; text-transform: uppercase; letter-spacing: 0.04em; }
        .pwd-input-wrap { position: relative; }
        .pwd-input-wrap input {
          width: 100%; height: 40px; padding: 0 40px 0 12px;
          border: 1.5px solid #E8E8E8; border-radius: 8px;
          font-size: 14px; color: #0a0a0a; background: #FAFAFA;
          outline: none; font-family: inherit; transition: border-color 0.15s;
        }
        .pwd-input-wrap input:focus { border-color: #1B2B4B; background: white; }
        .pwd-eye { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #9CA3AF; display: flex; align-items: center; }
        .pwd-error { font-size: 12px; color: #DC2626; background: #FEF2F2; border: 1px solid #FECACA; padding: 8px 12px; border-radius: 7px; }
        .pwd-success { font-size: 12px; color: #16A34A; background: #F0FDF4; border: 1px solid #BBF7D0; padding: 8px 12px; border-radius: 7px; }
        .pwd-submit { height: 40px; background: #1B2B4B; color: white; border: none; border-radius: 8px; font-size: 13.5px; font-weight: 600; cursor: pointer; font-family: inherit; transition: background 0.15s; }
        .pwd-submit:hover:not(:disabled) { background: #253d6d; }
        .pwd-submit:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      {/* Change password modal */}
      {pwdMember && (
        <div className="pwd-overlay" onClick={e => e.target === e.currentTarget && setPwdMember(null)}>
          <div className="pwd-modal">
            <div className="pwd-modal-hdr">
              <div>
                <h3>Canviar contrasenya</h3>
                <p>{pwdMember.full_name} · {pwdMember.email}</p>
              </div>
              <button className="pwd-close" onClick={() => setPwdMember(null)}><X size={13} /></button>
            </div>
            <form className="pwd-form" onSubmit={handleChangePassword}>
              <div className="pwd-field">
                <label>Nova contrasenya</label>
                <div className="pwd-input-wrap">
                  <input
                    type={pwdShow ? 'text' : 'password'}
                    value={pwd}
                    onChange={e => setPwd(e.target.value)}
                    placeholder="Mínim 8 caràcters"
                    required
                    autoFocus
                  />
                  <button type="button" className="pwd-eye" onClick={() => setPwdShow(v => !v)}>
                    {pwdShow ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div className="pwd-field">
                <label>Confirmar contrasenya</label>
                <div className="pwd-input-wrap">
                  <input
                    type={pwdShow ? 'text' : 'password'}
                    value={pwdConfirm}
                    onChange={e => setPwdConfirm(e.target.value)}
                    placeholder="Repeteix la contrasenya"
                    required
                  />
                </div>
              </div>
              {pwdError && <div className="pwd-error">{pwdError}</div>}
              {pwdSuccess && <div className="pwd-success">✓ {pwdSuccess}</div>}
              <button type="submit" className="pwd-submit" disabled={pwdLoading}>
                {pwdLoading ? 'Guardant...' : 'Actualitzar contrasenya'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
