'use client'

import { useState, useRef, useEffect } from 'react'
import { Camera, Save, Plus, Shield, User, Users, Power, Edit2, Check, X, Briefcase, FileSignature, ChevronRight, Banknote, Globe } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { cn, getInitials, roleLabels } from '@/lib/utils'
import type { Profile } from '@/types'
import { useLanguage } from '@/contexts/LanguageContext'
import type { Lang } from '@/lib/i18n'

interface Props {
  profile: Profile
  allMembers?: Profile[]
}

const LANGS: Array<{ id: Lang; label: string }> = [
  { id: 'ca', label: 'Català' },
  { id: 'es', label: 'Castellà' },
  { id: 'en', label: 'Anglès' },
]

function IdiomesCard({ profileId }: { profileId: string }) {
  const { lang: contextLang, setLang: setContextLang } = useLanguage()
  const [lang, setLang] = useState<Lang>(contextLang)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setLang(contextLang)
  }, [contextLang])

  const saveLang = (id: Lang) => {
    setLang(id)
    setContextLang(id)
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  return (
    <div className="idiomes-card">
      <div className="idiomes-header">
        <div className="tool-icon" style={{ background: '#0EA5E90F' }}>
          <Globe size={20} color="#0EA5E9" strokeWidth={1.8} />
        </div>
        <div className="tool-info">
          <div className="tool-name">Idioma</div>
          <div className="tool-desc">Idioma de la plataforma</div>
        </div>
        {saved && <span className="idiomes-saved">Desat</span>}
      </div>
      <div className="idiomes-opts">
        {LANGS.map(l => (
          <button key={l.id} className={`idiomes-btn${lang === l.id ? ' idiomes-btn--active' : ''}`} onClick={() => saveLang(l.id)}>
            {lang === l.id && <Check size={13} strokeWidth={2.5} />}
            {l.label}
          </button>
        ))}
      </div>
      <style jsx>{`
        .idiomes-card { padding: 16px 20px; border-top: 1px solid #F3F4F6; display: flex; flex-direction: column; gap: 12px; }
        .idiomes-header { display: flex; align-items: center; gap: 12px; }
        .idiomes-saved { font-size: 11.5px; font-weight: 600; color: #16A34A; background: #F0FDF4; padding: 3px 10px; border-radius: 20px; margin-left: auto; }
        .idiomes-opts { display: flex; gap: 8px; flex-wrap: wrap; }
        .idiomes-btn {
          display: flex; align-items: center; gap: 5px;
          padding: 7px 14px; border-radius: 8px; border: 1.5px solid #E5E7EB;
          background: white; font-size: 13px; font-weight: 500; color: #374151;
          cursor: pointer; transition: all 0.15s; font-family: inherit;
        }
        .idiomes-btn:hover { border-color: #0EA5E9; color: #0EA5E9; background: #F0F9FF; }
        .idiomes-btn--active { border-color: #0EA5E9; background: #EFF9FF; color: #0369A1; font-weight: 700; }
      `}</style>
    </div>
  )
}

function ServeisCard({ profileId }: { profileId: string }) {
  const [driveUrl, setDriveUrl] = useState('')
  const [dropboxUrl, setDropboxUrl] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setDriveUrl(localStorage.getItem(`guinew-service-drive-${profileId}`) || '')
    setDropboxUrl(localStorage.getItem(`guinew-service-dropbox-${profileId}`) || '')
  }, [profileId])

  const saveServices = () => {
    localStorage.setItem(`guinew-service-drive-${profileId}`, driveUrl.trim())
    localStorage.setItem(`guinew-service-dropbox-${profileId}`, dropboxUrl.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  return (
    <div className="serveis-card">
      <div className="serveis-header">
        <div className="tool-icon" style={{ background: '#8B5CF60F' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93V18c0-.55.45-1 1-1s1 .45 1 1v1.93c-2.78-.47-5.11-2.23-6.31-4.68A7.96 7.96 0 0 1 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8c0 3.35-2.06 6.24-5.01 7.47" fill="#8B5CF6" fillOpacity=".7"/>
            <circle cx="12" cy="12" r="3" fill="#8B5CF6"/>
          </svg>
        </div>
        <div className="tool-info">
          <div className="tool-name">Serveis personals</div>
          <div className="tool-desc">Enllaços als teus espais de Drive i Dropbox</div>
        </div>
        {saved && <span className="serveis-saved">Desat</span>}
      </div>

      <div className="serveis-fields">
        <div className="serveis-field">
          <label>
            <svg width="14" height="14" viewBox="0 0 87.3 78" style={{ display:'inline',marginRight:5,verticalAlign:'middle' }}>
              <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 53H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066DA"/>
              <path d="M43.65 25L29.9 0c-1.35.8-2.5 1.9-3.3 3.3L1.2 48.5A9.06 9.06 0 0 0 0 53h27.5z" fill="#00AC47"/>
              <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.65 10.85z" fill="#EA4335"/>
              <path d="M43.65 25L57.4 0H29.9z" fill="#00832D"/>
              <path d="M59.8 53H87.3L73.55 29.5c-.8-1.4-1.95-2.5-3.3-3.3L57.4 48.5z" fill="#2684FC"/>
              <path d="M43.65 25L57.4 48.5 43.65 53 29.9 48.5z" fill="#00AC47"/>
            </svg>
            Google Drive
          </label>
          <input
            type="url"
            value={driveUrl}
            onChange={e => setDriveUrl(e.target.value)}
            placeholder="https://drive.google.com/drive/folders/..."
          />
        </div>
        <div className="serveis-field">
          <label>
            <svg width="14" height="14" viewBox="0 0 24 24" style={{ display:'inline',marginRight:5,verticalAlign:'middle' }}>
              <path d="M12 2L4 7.5v4l8 5.5 8-5.5v-4L12 2z" fill="#0061FF"/>
              <path d="M4 11.5L12 17l8-5.5v4.25L12 21.25 4 15.75v-4.25z" fill="#0061FF"/>
            </svg>
            Dropbox
          </label>
          <input
            type="url"
            value={dropboxUrl}
            onChange={e => setDropboxUrl(e.target.value)}
            placeholder="https://www.dropbox.com/home/..."
          />
        </div>
        <button className="serveis-save-btn" onClick={saveServices}>
          {saved ? <><Check size={14} strokeWidth={2.5} /> Desat</> : 'Desar URLs'}
        </button>
      </div>

      <style jsx>{`
        .serveis-card { padding: 16px 20px; border-top: 1px solid #F3F4F6; display: flex; flex-direction: column; gap: 12px; }
        .serveis-header { display: flex; align-items: center; gap: 12px; }
        .serveis-saved { font-size: 11.5px; font-weight: 600; color: #16A34A; background: #F0FDF4; padding: 3px 10px; border-radius: 20px; margin-left: auto; }
        .serveis-fields { display: flex; flex-direction: column; gap: 10px; }
        .serveis-field { display: flex; flex-direction: column; gap: 5px; }
        .serveis-field label { font-size: 11.5px; font-weight: 600; color: #6B7280; display: flex; align-items: center; }
        .serveis-field input {
          width: 100%; border: 1.5px solid #E5E7EB; border-radius: 8px;
          padding: 8px 10px; font-size: 13px; color: #111827; font-family: inherit;
          outline: none; background: white; transition: border-color 0.15s, box-shadow 0.15s;
        }
        .serveis-field input:focus { border-color: #8B5CF6; box-shadow: 0 0 0 3px rgba(139,92,246,0.08); }
        .serveis-save-btn {
          align-self: flex-start; display: flex; align-items: center; gap: 6px;
          padding: 8px 18px; border-radius: 8px; border: none;
          background: #1B2B4B; color: white; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: opacity 0.15s; font-family: inherit;
        }
        .serveis-save-btn:hover { opacity: 0.85; }
      `}</style>
    </div>
  )
}

export function ProfileContent({ profile, allMembers = [] }: Props) {
  const isSuperadmin = profile.role === 'superadmin'

  // --- My profile state ---
  const [form, setForm] = useState({
    full_name: profile.full_name || '',
    position: profile.position || '',
  })
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [profileError, setProfileError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // --- User management state (superadmin only) ---
  const [members, setMembers] = useState<Profile[]>(allMembers)
  const [showNew, setShowNew] = useState(false)
  const [newForm, setNewForm] = useState({ email: '', full_name: '', role: 'team_member', position: '' })
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [createSuccess, setCreateSuccess] = useState('')
  const [editingMember, setEditingMember] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ full_name: '', position: '', role: '' })
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')

  // --- Avatar upload ---
  const handleAvatarClick = () => fileRef.current?.click()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setProfileError('')
    const supabase = createClient()

    const ext = file.name.split('.').pop()
    const path = `${profile.id}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      setProfileError(`Error pujant la foto: ${uploadError.message}`)
      setUploading(false)
      e.target.value = ''
      return
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    // Store URL without timestamp so it's stable; add cache-bust only for display
    const stableUrl = data.publicUrl
    const displayUrl = `${stableUrl}?t=${Date.now()}`
    setAvatarUrl(displayUrl)

    await supabase.from('profiles').update({ avatar_url: stableUrl }).eq('id', profile.id)
    setUploading(false)
    e.target.value = ''
  }

  // --- Save profile ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.full_name.trim()) return

    setSaving(true)
    setProfileError('')
    setSaved(false)

    const supabase = createClient()
    const { error: err } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name.trim(),
        position: form.position.trim() || null,
      })
      .eq('id', profile.id)

    if (err) {
      setProfileError('Error desant els canvis.')
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  // --- Create new user ---
  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setCreateError('')
    setCreateSuccess('')

    const res = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newForm),
    })

    const data = await res.json()

    if (!res.ok) {
      setCreateError(data.error || 'Error al crear el membre.')
      setCreating(false)
      return
    }

    setCreateSuccess(`Usuari ${newForm.full_name} creat. Rebrà un correu per establir la seva contrasenya.`)
    setShowNew(false)
    setNewForm({ email: '', full_name: '', role: 'team_member', position: '' })
    setCreating(false)

    const supabase = createClient()
    const { data: updatedMembers } = await supabase.from('profiles').select('*').order('created_at')
    if (updatedMembers) setMembers(updatedMembers as Profile[])
  }

  // --- Toggle active ---
  const handleToggleActive = async (member: Profile) => {
    if (member.id === profile.id) return
    const res = await fetch('/api/admin/update-member', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId: member.id, is_active: !member.is_active }),
    })
    if (res.ok) {
      setMembers(prev => prev.map(m => m.id === member.id ? { ...m, is_active: !m.is_active } : m))
    }
  }

  // --- Edit member ---
  const startEdit = (member: Profile) => {
    setEditingMember(member.id)
    setEditForm({ full_name: member.full_name, position: member.position || '', role: member.role })
  }

  const handleEditSave = async (memberId: string) => {
    setEditSaving(true)
    setEditError('')
    const res = await fetch('/api/admin/update-member', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, ...editForm }),
    })
    if (res.ok) {
      setMembers(prev => prev.map(m => m.id === memberId ? ({ ...m, ...editForm, position: editForm.position || undefined } as any) : m))
      setEditingMember(null)
    } else {
      const json = await res.json().catch(() => ({}))
      setEditError(json.error || 'Error desant')
    }
    setEditSaving(false)
  }

  const roleLabel: Record<string, string> = {
    superadmin: 'Superadmin',
    manager: 'Manager',
    team_member: 'Membre d\'equip',
  }

  const stats = {
    total: members.length,
    active: members.filter(m => m.is_active).length,
    admins: members.filter(m => m.role === 'superadmin').length,
    managers: members.filter(m => m.role === 'manager').length,
  }

  return (
    <div className="profile-page">

      {/* Top row: profile card + (if superadmin) tools side by side */}
      {isSuperadmin ? (
        <div className="profile-top-row">
          <ProfileCard
            avatarUrl={avatarUrl}
            form={form}
            setForm={setForm}
            profile={profile}
            roleLabel={roleLabel}
            uploading={uploading}
            saving={saving}
            saved={saved}
            profileError={profileError}
            fileRef={fileRef}
            handleAvatarClick={handleAvatarClick}
            handleFileChange={handleFileChange}
            handleSave={handleSave}
          />
          <div className="superadmin-tools">
            <div className="tools-header">
              <Shield size={15} color="#1B2B4B" />
              <span>Eines de superadmin</span>
            </div>
            <div className="tools-grid">
              <Link href="/crm" className="tool-card">
                <div className="tool-icon" style={{ background: '#1B2B4B0F' }}>
                  <Briefcase size={20} color="#1B2B4B" strokeWidth={1.8} />
                </div>
                <div className="tool-info">
                  <div className="tool-name">CRM</div>
                  <div className="tool-desc">Gestió de clients i relacions comercials</div>
                </div>
                <ChevronRight size={16} color="#C0C0C0" className="tool-arrow" />
              </Link>
              <Link href="/contracts" className="tool-card">
                <div className="tool-icon" style={{ background: '#6366F10F' }}>
                  <FileSignature size={20} color="#6366F1" strokeWidth={1.8} />
                </div>
                <div className="tool-info">
                  <div className="tool-name">Contractes</div>
                  <div className="tool-desc">Visualitza i gestiona els contractes actius</div>
                </div>
                <ChevronRight size={16} color="#C0C0C0" className="tool-arrow" />
              </Link>
              <Link href="/finances" className="tool-card">
                <div className="tool-icon" style={{ background: '#10B9810F' }}>
                  <Banknote size={20} color="#059669" strokeWidth={1.8} />
                </div>
                <div className="tool-info">
                  <div className="tool-name">Finances</div>
                  <div className="tool-desc">Cartera de clients, marges i resultats</div>
                </div>
                <ChevronRight size={16} color="#C0C0C0" className="tool-arrow" />
              </Link>
              <IdiomesCard profileId={profile.id} />
              <ServeisCard profileId={profile.id} />
            </div>
          </div>
        </div>
      ) : (
        <ProfileCard
          avatarUrl={avatarUrl}
          form={form}
          setForm={setForm}
          profile={profile}
          roleLabel={roleLabel}
          uploading={uploading}
          saving={saving}
          saved={saved}
          profileError={profileError}
          fileRef={fileRef}
          handleAvatarClick={handleAvatarClick}
          handleFileChange={handleFileChange}
          handleSave={handleSave}
        />
      )}

      {/* Superadmin: User management */}
      {isSuperadmin && (
        <div className="admin-section">
          <div className="admin-header">
            <div>
              <h2 className="admin-title">Gestió d'usuaris</h2>
              <p className="admin-subtitle">Crea i administra els membres de l'equip</p>
            </div>
            <button className="btn-primary" onClick={() => { setShowNew(!showNew); setCreateError(''); }}>
              <Plus size={14} strokeWidth={2.5} />
              Nou usuari
            </button>
          </div>

          {/* Stats */}
          <div className="admin-stats">
            {[
              { label: 'Total', value: stats.total, icon: <Users size={15} /> },
              { label: 'Actius', value: stats.active, icon: <User size={15} /> },
              { label: 'Admins', value: stats.admins, icon: <Shield size={15} /> },
              { label: 'Managers', value: stats.managers, icon: <User size={15} /> },
            ].map(s => (
              <div key={s.label} className="stat-chip">
                <div className="stat-icon">{s.icon}</div>
                <span className="stat-val">{s.value}</span>
                <span className="stat-label">{s.label}</span>
              </div>
            ))}
          </div>

          {createSuccess && <div className="success-msg">✓ {createSuccess}</div>}

          {/* New user form */}
          {showNew && (
            <form onSubmit={handleCreateMember} className="new-user-form">
              <div className="new-user-title">Nou usuari</div>
              <div className="form-row">
                <div className="form-field">
                  <label>Nom complet *</label>
                  <input type="text" value={newForm.full_name} onChange={e => setNewForm({ ...newForm, full_name: e.target.value })} placeholder="Nom Cognoms" required />
                </div>
                <div className="form-field">
                  <label>Email *</label>
                  <input type="email" value={newForm.email} onChange={e => setNewForm({ ...newForm, email: e.target.value })} placeholder="email@guinew.com" required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label>Càrrec</label>
                  <input type="text" value={newForm.position} onChange={e => setNewForm({ ...newForm, position: e.target.value })} placeholder="Ex: Community Manager" />
                </div>
                <div className="form-field">
                  <label>Rol</label>
                  <select value={newForm.role} onChange={e => setNewForm({ ...newForm, role: e.target.value })}>
                    <option value="team_member">Team Member</option>
                    <option value="manager">Manager</option>
                    <option value="superadmin">Superadmin</option>
                  </select>
                </div>
              </div>
              {createError && <div className="form-error">{createError}</div>}
              <div className="form-actions-row">
                <button type="button" className="btn-secondary" onClick={() => { setShowNew(false); setCreateError('') }}>Cancel·lar</button>
                <button type="submit" className="btn-primary" disabled={creating}>{creating ? 'Creant...' : 'Crear usuari'}</button>
              </div>
            </form>
          )}

          {/* Members table */}
          <div className="members-table">
            <div className="members-head">
              <span>Membre</span>
              <span>Càrrec</span>
              <span>Rol</span>
              <span>Estat</span>
              <span></span>
            </div>
            {members.map(member => (
              <div key={member.id} className={cn('member-row', !member.is_active && 'member-row--inactive')}>
                {editingMember === member.id ? (
                  <>
                    <div className="member-info">
                      <div className="member-avatar">
                        {member.avatar_url ? <img src={member.avatar_url} alt={member.full_name} /> : getInitials(member.full_name)}
                      </div>
                      <div className="edit-fields">
                        <input className="edit-input" value={editForm.full_name} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} />
                        <span className="member-email">{member.email}</span>
                      </div>
                    </div>
                    <input className="edit-input edit-input--sm" value={editForm.position} onChange={e => setEditForm({ ...editForm, position: e.target.value })} placeholder="Càrrec" />
                    <select className="edit-select" value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })}>
                      <option value="team_member">Team Member</option>
                      <option value="manager">Manager</option>
                      <option value="superadmin">Superadmin</option>
                    </select>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {editError && <span style={{ fontSize: 11, color: '#DC2626' }}>{editError}</span>}
                    </div>
                    <div className="member-actions">
                      <button className="action-btn action-btn--confirm" onClick={() => handleEditSave(member.id)} disabled={editSaving} title="Desar">
                        {editSaving ? <span style={{ fontSize: 10 }}>...</span> : <Check size={13} />}
                      </button>
                      <button className="action-btn" onClick={() => { setEditingMember(null); setEditError('') }} title="Cancel·lar"><X size={13} /></button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="member-info">
                      <div className="member-avatar">
                        {member.avatar_url ? <img src={member.avatar_url} alt={member.full_name} /> : getInitials(member.full_name)}
                      </div>
                      <div>
                        <div className="member-name">{member.full_name} {member.id === profile.id && <span className="you-badge">tu</span>}</div>
                        <div className="member-email">{member.email}</div>
                      </div>
                    </div>
                    <div className="member-position">{member.position || '—'}</div>
                    <span className={cn('role-badge', `role-badge--${member.role}`)}>{roleLabels[member.role]}</span>
                    <span className={cn('status-badge', member.is_active ? 'status-badge--active' : 'status-badge--inactive')}>
                      {member.is_active ? 'Actiu' : 'Inactiu'}
                    </span>
                    <div className="member-actions">
                      <button className="action-btn" onClick={() => startEdit(member)} title="Editar"><Edit2 size={13} /></button>
                      {member.id !== profile.id && (
                        <button className="action-btn" onClick={() => handleToggleActive(member)} title={member.is_active ? 'Desactivar' : 'Activar'}>
                          <Power size={13} />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .profile-page {
          padding: 28px 28px 40px;
          max-width: 780px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        @media (max-width: 1023px) { .profile-page { padding: 16px 12px 80px; } }

        /* Profile card */
        .profile-card {
          background: white;
          border: 1px solid #ECECEC;
          border-radius: 16px;
          padding: 28px 32px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        @media (max-width: 600px) {
          .profile-card { padding: 20px 16px; border-radius: 12px; }
        }

        .avatar-section { display: flex; flex-direction: column; align-items: center; gap: 8px; }

        .avatar-wrap {
          width: 90px; height: 90px; border-radius: 50%;
          position: relative; cursor: pointer; overflow: hidden;
          background: #1B2B4B14; border: 3px solid #ECECEC; transition: border-color 0.15s;
        }
        .avatar-wrap:hover { border-color: #1B2B4B; }

        .avatar-img { width: 100%; height: 100%; object-fit: cover; }

        .avatar-initials {
          width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
          font-size: 26px; font-weight: 700; color: #1B2B4B;
        }

        .avatar-overlay {
          position: absolute; inset: 0; background: rgba(0,0,0,0.38);
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: opacity 0.15s;
        }
        .avatar-wrap:hover .avatar-overlay { opacity: 1; }

        .avatar-spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.4); border-top-color: white;
          border-radius: 50%; animation: spin 0.6s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .avatar-hint { font-size: 12px; color: #9A9A9A; }

        .profile-form { display: flex; flex-direction: column; gap: 14px; }
        .form-section-title { font-size: 11px; font-weight: 700; color: #9A9A9A; letter-spacing: 0.08em; text-transform: uppercase; }

        .form-field { display: flex; flex-direction: column; gap: 5px; }
        .form-field label { font-size: 12px; font-weight: 600; color: #5C5C5C; }
        .form-field input {
          height: 40px; padding: 0 12px; border: 1.5px solid #E8E8E8; border-radius: 8px;
          font-size: 14px; color: #0a0a0a; background: #FAFAFA; outline: none;
          transition: border-color 0.15s; font-family: inherit;
        }
        .form-field input:focus { border-color: #1B2B4B; background: white; }
        .form-field input:disabled { background: #F5F5F5; color: #9A9A9A; cursor: not-allowed; }

        .form-error {
          font-size: 13px; color: #DC2626; background: #FEF2F2;
          border: 1px solid #FECACA; padding: 10px 12px; border-radius: 8px;
        }

        .form-actions { display: flex; justify-content: flex-end; padding-top: 4px; }
        @media (max-width: 600px) {
          .form-actions { justify-content: stretch; }
          .btn-save { width: 100%; justify-content: center; }
        }

        .btn-save {
          display: flex; align-items: center; gap: 7px; height: 38px; padding: 0 18px;
          background: #1B2B4B; color: white; border: none; border-radius: 8px;
          font-size: 13.5px; font-weight: 600; cursor: pointer; transition: background 0.15s; font-family: inherit;
        }
        .btn-save:hover:not(:disabled) { background: #4A82C6; }
        .btn-save:disabled { opacity: 0.7; cursor: not-allowed; }

        /* Two-column top row */
        .profile-top-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          align-items: start;
        }
        @media (max-width: 780px) {
          .profile-top-row { grid-template-columns: 1fr; }
        }

        /* Superadmin tools */
        .superadmin-tools {
          background: white; border: 1px solid #ECECEC; border-radius: 16px; overflow: hidden;
        }
        .tools-header {
          display: flex; align-items: center; gap: 8px;
          padding: 16px 24px; border-bottom: 1px solid #F0F0F0;
          font-size: 12px; font-weight: 700; color: #1B2B4B;
          text-transform: uppercase; letter-spacing: 0.06em;
        }
        .tools-grid { display: flex; flex-direction: column; }
        :global(.tool-card) {
          display: flex; align-items: center; gap: 14px;
          padding: 16px 24px; text-decoration: none;
          border-bottom: 1px solid #F8F8F8; transition: background 0.15s;
        }
        :global(.tool-card:last-child) { border-bottom: 1px solid #F8F8F8; }
        :global(.tool-card:hover) { background: #FAFAFA; }
        :global(.tool-card:hover .tool-arrow) { color: #1B2B4B !important; }

        .tool-icon {
          width: 42px; height: 42px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .tool-info { flex: 1; min-width: 0; }
        .tool-name { font-size: 14px; font-weight: 600; color: #0a0a0a; }
        .tool-desc { font-size: 12px; color: #9A9A9A; margin-top: 2px; }
        @media (max-width: 600px) {
          .tools-header { padding: 14px 16px; }
          :global(.tool-card) { padding: 14px 16px; }
        }

        /* Admin section */
        .admin-section {
          background: white; border: 1px solid #ECECEC; border-radius: 16px; overflow: hidden;
        }

        .admin-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 24px; border-bottom: 1px solid #F0F0F0; flex-wrap: wrap; gap: 12px;
        }
        @media (max-width: 600px) {
          .admin-header { padding: 16px; }
        }
        .admin-title { font-size: 15px; font-weight: 700; color: #0a0a0a; }
        .admin-subtitle { font-size: 12px; color: #9A9A9A; margin-top: 2px; }

        .admin-stats { display: flex; gap: 0; border-bottom: 1px solid #F0F0F0; flex-wrap: wrap; }
        .stat-chip {
          flex: 1; display: flex; align-items: center; gap: 8px; padding: 12px 20px;
          border-right: 1px solid #F0F0F0;
        }
        .stat-chip:last-child { border-right: none; }
        .stat-icon { color: #1B2B4B; display: flex; }
        .stat-val { font-size: 18px; font-weight: 700; color: #0a0a0a; }
        .stat-label { font-size: 12px; color: #9A9A9A; }

        .success-msg {
          margin: 16px 24px 0; font-size: 13px; color: #16A34A;
          background: #F0FDF4; border: 1px solid #BBF7D0; padding: 10px 14px; border-radius: 8px;
        }

        /* New user form */
        .new-user-form {
          padding: 20px 24px; border-bottom: 1px solid #F0F0F0;
          background: #FAFAFA; display: flex; flex-direction: column; gap: 14px;
        }
        .new-user-title { font-size: 13px; font-weight: 700; color: #0a0a0a; }

        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 600px) { .form-row { grid-template-columns: 1fr; } }

        .new-user-form .form-field { display: flex; flex-direction: column; gap: 5px; }
        .new-user-form .form-field label { font-size: 11px; font-weight: 600; color: #5C5C5C; letter-spacing: 0.04em; text-transform: uppercase; }
        .new-user-form .form-field input,
        .new-user-form .form-field select {
          height: 38px; padding: 0 10px; border: 1.5px solid #E8E8E8; border-radius: 7px;
          font-size: 13.5px; color: #0a0a0a; background: white; outline: none;
          transition: border-color 0.15s; font-family: inherit;
        }
        .new-user-form .form-field input:focus,
        .new-user-form .form-field select:focus { border-color: #1B2B4B; }

        .form-actions-row { display: flex; justify-content: flex-end; gap: 8px; }

        .btn-primary {
          display: flex; align-items: center; gap: 6px; height: 36px; padding: 0 14px;
          background: #1B2B4B; color: white; border: none; border-radius: 8px;
          font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.15s; font-family: inherit;
        }
        .btn-primary:hover:not(:disabled) { background: #4A82C6; }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

        .btn-secondary {
          height: 36px; padding: 0 14px; border: 1px solid #E8E8E8; border-radius: 8px;
          font-size: 13px; font-weight: 500; cursor: pointer; background: white; color: #5C5C5C;
          transition: all 0.15s; font-family: inherit;
        }
        .btn-secondary:hover { border-color: #D0D0D0; color: #0a0a0a; }

        /* Members table */
        .members-head {
          display: grid; grid-template-columns: 2fr 1fr 1fr 0.8fr 0.7fr;
          padding: 10px 24px; font-size: 11px; font-weight: 600; color: #9A9A9A;
          text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1px solid #F0F0F0;
        }

        .member-row {
          display: grid; grid-template-columns: 2fr 1fr 1fr 0.8fr 0.7fr;
          align-items: center; padding: 13px 24px; border-bottom: 1px solid #F8F8F8;
          gap: 12px; transition: background 0.1s;
        }
        .member-row:last-child { border-bottom: none; }
        .member-row:hover { background: #FAFAFA; }
        .member-row--inactive { opacity: 0.5; }

        @media (max-width: 700px) {
          .members-head { display: none; }
          .member-row {
            display: flex; flex-direction: column; align-items: flex-start;
            padding: 14px 16px; gap: 8px;
          }
          .member-info { width: 100%; }
          .member-position, .member-actions { width: 100%; }
          .member-actions { justify-content: flex-end; }
        }

        .member-info { display: flex; align-items: center; gap: 10px; }

        .member-avatar {
          width: 34px; height: 34px; border-radius: 50%;
          background: #1B2B4B14; color: #1B2B4B; font-size: 11px; font-weight: 700;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden;
        }
        .member-avatar img { width: 100%; height: 100%; object-fit: cover; }

        .member-name { font-size: 13px; font-weight: 600; color: #0a0a0a; display: flex; align-items: center; gap: 6px; }
        .member-email { font-size: 11.5px; color: #9A9A9A; margin-top: 1px; }
        .member-position { font-size: 13px; color: #5C5C5C; }

        .you-badge {
          font-size: 10px; font-weight: 600; color: #1B2B4B; background: #1B2B4B14;
          padding: 1px 6px; border-radius: 4px; letter-spacing: 0.02em;
        }

        .role-badge { font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 5px; }
        .role-badge--superadmin { background: #1B2B4B14; color: #1B2B4B; }
        .role-badge--manager { background: #6366F114; color: #6366F1; }
        .role-badge--team_member { background: #F0F0F0; color: #5C5C5C; }

        .status-badge { font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 5px; }
        .status-badge--active { background: #F0FDF4; color: #16A34A; }
        .status-badge--inactive { background: #F5F5F5; color: #9A9A9A; }

        .member-actions { display: flex; gap: 5px; }
        .action-btn {
          width: 27px; height: 27px; border: 1px solid #E8E8E8; border-radius: 7px;
          background: white; cursor: pointer; display: flex; align-items: center; justify-content: center;
          color: #9A9A9A; transition: all 0.15s;
        }
        .action-btn:hover { border-color: #D0D0D0; color: #0a0a0a; }
        .action-btn--confirm { border-color: #BBF7D0; color: #16A34A; background: #F0FDF4; }
        .action-btn--confirm:hover { background: #DCFCE7; color: #15803D; }

        /* Inline edit */
        .edit-fields { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .edit-input {
          height: 30px; padding: 0 8px; border: 1.5px solid #1B2B4B; border-radius: 6px;
          font-size: 13px; color: #0a0a0a; background: white; outline: none; font-family: inherit;
          width: 100%;
        }
        .edit-input--sm { height: 30px; width: 100%; }
        .edit-select {
          height: 30px; padding: 0 8px; border: 1.5px solid #E8E8E8; border-radius: 6px;
          font-size: 12px; color: #0a0a0a; background: white; outline: none; font-family: inherit;
          cursor: pointer;
        }
        .edit-select:focus { border-color: #1B2B4B; }
      `}</style>
    </div>
  )
}

// ─── ProfileCard subcomponent ───────────────────────────────────────────────
function ProfileCard({ avatarUrl, form, setForm, profile, roleLabel, uploading, saving, saved, profileError, fileRef, handleAvatarClick, handleFileChange, handleSave }: any) {
  return (
    <div className="profile-card">
      <div className="avatar-section">
        <div className="avatar-wrap" onClick={handleAvatarClick}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={form.full_name} className="avatar-img" />
          ) : (
            <div className="avatar-initials">{getInitials(form.full_name || 'U')}</div>
          )}
          <div className="avatar-overlay">
            {uploading ? <div className="avatar-spinner" /> : <Camera size={18} color="white" />}
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" style={{ display: 'none' }} onChange={handleFileChange} />
        <p className="avatar-hint">{uploading ? 'Pujant...' : 'Clica per canviar la foto'}</p>
      </div>

      <form onSubmit={handleSave} className="profile-form">
        <div className="form-section-title">Informació personal</div>
        <div className="form-field">
          <label>Nom complet</label>
          <input type="text" value={form.full_name} onChange={(e: any) => setForm({ ...form, full_name: e.target.value })} placeholder="El teu nom" required />
        </div>
        <div className="form-field">
          <label>Càrrec</label>
          <input type="text" value={form.position} onChange={(e: any) => setForm({ ...form, position: e.target.value })} placeholder="Ex: Social Media Manager" />
        </div>
        <div className="form-field">
          <label>Correu electrònic</label>
          <input type="email" value={profile.email} disabled />
        </div>
        <div className="form-field">
          <label>Rol</label>
          <input type="text" value={roleLabel[profile.role] || profile.role} disabled />
        </div>
        {profileError && <div className="form-error">{profileError}</div>}
        <div className="form-actions">
          <button type="submit" className="btn-save" disabled={saving}>
            <Save size={14} />
            {saving ? 'Desant...' : saved ? 'Desat!' : 'Desar canvis'}
          </button>
        </div>
      </form>

      <style jsx>{`
        .profile-card {
          background: white; border: 1px solid #ECECEC; border-radius: 16px;
          padding: 28px 32px; display: flex; flex-direction: column; gap: 24px;
        }
        @media (max-width: 600px) { .profile-card { padding: 20px 16px; border-radius: 12px; } }
        .avatar-section { display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .avatar-wrap {
          width: 90px; height: 90px; border-radius: 50%; position: relative;
          cursor: pointer; overflow: hidden; background: #1B2B4B14;
          border: 3px solid #ECECEC; transition: border-color 0.15s;
        }
        .avatar-wrap:hover { border-color: #1B2B4B; }
        .avatar-img { width: 100%; height: 100%; object-fit: cover; }
        .avatar-initials { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 26px; font-weight: 700; color: #1B2B4B; }
        .avatar-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.38); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.15s; }
        .avatar-wrap:hover .avatar-overlay { opacity: 1; }
        .avatar-spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.4); border-top-color: white; border-radius: 50%; animation: spin 0.6s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .avatar-hint { font-size: 12px; color: #9A9A9A; }
        .profile-form { display: flex; flex-direction: column; gap: 14px; }
        .form-section-title { font-size: 11px; font-weight: 700; color: #9A9A9A; letter-spacing: 0.08em; text-transform: uppercase; }
        .form-field { display: flex; flex-direction: column; gap: 5px; }
        .form-field label { font-size: 12px; font-weight: 600; color: #5C5C5C; }
        .form-field input {
          height: 40px; padding: 0 12px; border: 1.5px solid #E8E8E8; border-radius: 8px;
          font-size: 14px; color: #0a0a0a; background: #FAFAFA; outline: none;
          transition: border-color 0.15s; font-family: inherit;
        }
        .form-field input:focus { border-color: #1B2B4B; background: white; }
        .form-field input:disabled { background: #F5F5F5; color: #9A9A9A; cursor: not-allowed; }
        .form-error { font-size: 13px; color: #DC2626; background: #FEF2F2; border: 1px solid #FECACA; padding: 10px 12px; border-radius: 8px; }
        .form-actions { display: flex; justify-content: flex-end; padding-top: 4px; }
        @media (max-width: 600px) { .form-actions { justify-content: stretch; } }
        .btn-save {
          display: flex; align-items: center; gap: 7px; height: 38px; padding: 0 18px;
          background: #1B2B4B; color: white; border: none; border-radius: 8px;
          font-size: 13.5px; font-weight: 600; cursor: pointer; transition: background 0.15s; font-family: inherit;
        }
        .btn-save:hover:not(:disabled) { background: #4A82C6; }
        .btn-save:disabled { opacity: 0.7; cursor: not-allowed; }
        @media (max-width: 600px) { .btn-save { width: 100%; justify-content: center; } }
      `}</style>
    </div>
  )
}
