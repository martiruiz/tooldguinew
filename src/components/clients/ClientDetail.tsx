'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Plus, FolderKanban,
  CheckSquare, BarChart2, Globe,
  Circle, Clock, Camera, Phone, Mail, User, Save, Loader2, X, FileText,
  RefreshCw, Briefcase, Upload, ChevronDown, ChevronUp, Edit2, Check, Trash2,
} from 'lucide-react'
import { cn, clientTypeLabels, projectStatusLabels, taskPriorityLabels, getInitials, formatDate } from '@/lib/utils'
import { createClient as createSupabase } from '@/lib/supabase/client'
import { NewTaskModal } from '@/components/tasks/NewTaskModal'
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal'
import { AnnualPlan } from '@/components/clients/AnnualPlan'
import type { Client, Project, Task } from '@/types'

const CONTRACTED_SERVICES = [
  'Estrategia digital',
  'Gestión de redes sociales',
  'Sesión de creación de contenido 1 sesión al mes',
  'Sesión de creación de contenido 2 sesiones al mes',
  'Analítica mensual',
  'Suscripción a la plataforma de Sports Content Playbook',
  'Auditoría y consultoría',
  'Álbums fotográficos',
  'Gabinete de prensa',
  'Diseño gráfico',
]

function parseServices(raw: string): string[] {
  if (!raw) return []
  try { const p = JSON.parse(raw); return Array.isArray(p) ? p : [] }
  catch { return raw.split(',').map(s => s.trim()).filter(Boolean) }
}

const healthConfig = {
  healthy: { label: 'Healthy', bg: '#F0FDF4', color: '#16A34A' },
  attention: { label: 'Attention', bg: '#FFFBEB', color: '#D97706' },
  risk: { label: 'Risk', bg: '#FEF2F2', color: '#DC2626' },
}

const statusBadge: Record<string, { bg: string; color: string }> = {
  planning: { bg: '#F0F0F0', color: '#5C5C5C' },
  active: { bg: '#F0FDF4', color: '#16A34A' },
  at_risk: { bg: '#FFFBEB', color: '#D97706' },
  blocked: { bg: '#FEF2F2', color: '#DC2626' },
  completed: { bg: '#EFF6FF', color: '#1B2B4B' },
  archived: { bg: '#F0F0F0', color: '#9A9A9A' },
}

type Tab = 'campanyes' | 'tasques' | 'briefing' | 'estrategia' | 'metriques' | 'resum' | 'pla'

interface Props {
  client: Client
  projects: Project[]
  tasks: Task[]
  briefing: any
  strategy: any
  userRole?: string
  profiles?: { id: string; full_name: string }[]
  currentUserId?: string
}

export function ClientDetail({ client, projects, tasks, briefing, strategy, userRole, profiles = [], currentUserId = '' }: Props) {
  const [tab, setTab] = useState<Tab>('resum')
  const [localTasks, setLocalTasks] = useState(tasks)
  const [localProjects, setLocalProjects] = useState(projects)
  const [showNewTask, setShowNewTask] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showNewProject, setShowNewProject] = useState(false)
  const [newProjectForm, setNewProjectForm] = useState({ name: '', type: 'social_media', status: 'planning', description: '' })
  const [savingProject, setSavingProject] = useState(false)
  const [localClient, setLocalClient] = useState(client)
  const [editingName, setEditingName] = useState(false)
  const [fields, setFields] = useState({
    name: client.name || '',
    description: client.description || '',
    website: client.website || '',
    contact_name: client.contact_name || '',
    contact_position: client.contact_position || '',
    contact_email: client.contact_email || '',
    contact_phone: client.contact_phone || '',
  })
  const [servicesOpen, setServicesOpen] = useState(false)
  const [acordFields, setAcordFields] = useState({
    sessions_count: (client as any).sessions_count ?? '',
    agreement_type: (client as any).agreement_type || '',
    contract_duration: (client as any).contract_duration || '',
    account_manager_id: (client as any).account_manager_id || '',
  })
  const [selectedServices, setSelectedServices] = useState<string[]>(() =>
    parseServices((client as any).contracted_services || '')
  )
  const [acordDirty, setAcordDirty] = useState(false)
  const [acordSaving, setAcordSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingContact, setUploadingContact] = useState(false)
  const logoRef = useRef<HTMLInputElement>(null)
  const contactPhotoRef = useRef<HTMLInputElement>(null)
  const health = healthConfig[localClient.health] || healthConfig.healthy

  const setField = (k: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFields(prev => ({ ...prev, [k]: e.target.value }))
    setDirty(true)
  }

  const handleDeleteTask = async (taskId: string) => {
    setLocalTasks(prev => prev.filter(t => t.id !== taskId))
    const supabase = createSupabase()
    await supabase.from('tasks').delete().eq('id', taskId)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const supabase = createSupabase()
      const saveFields = { ...fields, name: fields.name.trim() || localClient.name }
      await supabase.from('clients').update(saveFields).eq('id', localClient.id)
      setLocalClient(prev => ({ ...prev, ...saveFields }))
      setFields(p => ({ ...p, name: saveFields.name }))
      setDirty(false)
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  const setAcordField = (k: keyof typeof acordFields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setAcordFields(prev => ({ ...prev, [k]: e.target.value }))
    setAcordDirty(true)
  }
  const setAcordVal = (k: keyof typeof acordFields, v: string) => {
    setAcordFields(prev => ({ ...prev, [k]: v }))
    setAcordDirty(true)
  }

  const handleAcordSave = async () => {
    setAcordSaving(true)
    try {
      const supabase = createSupabase()
      const payload: any = {
        sessions_count: acordFields.sessions_count !== '' ? Number(acordFields.sessions_count) : null,
        agreement_type: acordFields.agreement_type || null,
        contract_duration: acordFields.contract_duration || null,
        contracted_services: selectedServices.length > 0 ? JSON.stringify(selectedServices) : null,
        account_manager_id: acordFields.account_manager_id || null,
      }
      await supabase.from('clients').update(payload).eq('id', localClient.id)
      setAcordDirty(false)
    } catch (e) { console.error(e) }
    setAcordSaving(false)
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProjectForm.name.trim()) return
    setSavingProject(true)
    const supabase = createSupabase()
    const { data } = await supabase
      .from('projects')
      .insert({
        name: newProjectForm.name.trim(),
        client_id: client.id,
        type: newProjectForm.type,
        status: newProjectForm.status,
        description: newProjectForm.description || null,
        responsible_id: currentUserId || null,
      })
      .select('*, responsible:profiles(id,full_name)')
      .single()
    if (data) {
      setLocalProjects(prev => [data as Project, ...prev])
      setShowNewProject(false)
      setNewProjectForm({ name: '', type: 'social_media', status: 'planning', description: '' })
      setTab('campanyes')
    }
    setSavingProject(false)
  }

  const handleLogoUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) return
    setUploadingLogo(true)
    try {
      const supabase = createSupabase()
      const ext = file.name.split('.').pop()
      const path = `clients/${localClient.id}/logo.${ext}`
      const { data } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
      if (data) {
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
        const logo_url = urlData.publicUrl + '?t=' + Date.now()
        await supabase.from('clients').update({ logo_url }).eq('id', localClient.id)
        setLocalClient(prev => ({ ...prev, logo_url }))
      }
    } catch (e) { console.error(e) }
    setUploadingLogo(false)
  }

  const handleContactPhotoUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) return
    setUploadingContact(true)
    try {
      const supabase = createSupabase()
      const ext = file.name.split('.').pop()
      const path = `clients/${localClient.id}/contact.${ext}`
      const { data } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
      if (data) {
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
        const contact_photo_url = urlData.publicUrl + '?t=' + Date.now()
        await supabase.from('clients').update({ contact_photo_url }).eq('id', localClient.id)
        setLocalClient(prev => ({ ...prev, contact_photo_url }))
      }
    } catch (e) { console.error(e) }
    setUploadingContact(false)
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'resum', label: 'Resum' },
    { key: 'briefing', label: 'Briefing' },
    { key: 'estrategia', label: 'Estratègia' },
    { key: 'pla', label: 'Pla de contingut anual' },
    { key: 'campanyes', label: `Projectes (${projects.length})` },
    { key: 'tasques', label: `Tasques (${tasks.length})` },
    { key: 'metriques', label: 'Mètriques' },
  ]

  return (
    <div className="client-detail">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link href="/clients" className="breadcrumb-link">
          <ArrowLeft size={13} />
          Clients
        </Link>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">{client.name}</span>
      </div>

      {/* Header */}
      <div className="client-header">
        {/* Top row */}
        <div className="client-header-top">
          <div className="client-avatar-wrap" onClick={() => logoRef.current?.click()} title="Canviar logo">
            <div className="client-big-avatar">
              {localClient.logo_url ? <img src={localClient.logo_url} alt={localClient.name} /> : <span>{getInitials(localClient.name)}</span>}
            </div>
            <div className="avatar-overlay">
              {uploadingLogo ? <Loader2 size={16} className="spin" /> : <Camera size={16} />}
            </div>
            <input ref={logoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f) }} />
          </div>

          <div className="client-top-info">
            <div className="client-name-row">
              {editingName ? (
                <input
                  className="client-header-name-input"
                  value={fields.name}
                  onChange={e => { setFields(p => ({ ...p, name: e.target.value })); setDirty(true) }}
                  onBlur={() => { setEditingName(false); if (fields.name.trim()) handleSave() }}
                  onKeyDown={e => { if (e.key === 'Enter') { setEditingName(false); handleSave() } if (e.key === 'Escape') { setEditingName(false); setFields(p => ({ ...p, name: localClient.name })) } }}
                  autoFocus
                />
              ) : (
                <h1 className="client-header-name" onClick={() => setEditingName(true)} title="Fes clic per editar el nom">
                  {localClient.name}
                </h1>
              )}
              <div className="client-health-badge" style={{ background: health.bg, color: health.color }}>{health.label}</div>
            </div>
            <div className="client-header-meta">
              <span>{clientTypeLabels[localClient.type] || localClient.type}</span>
              {localClient.responsible && (
                <><span className="meta-sep">·</span>
                <span><span className="meta-resp-avatar">{getInitials(localClient.responsible.full_name)}</span>{localClient.responsible.full_name}</span></>
              )}
            </div>
          </div>

          <div className="client-header-actions">
            {dirty && (
              <button className="btn-save" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 size={13} className="spin" /> : <Save size={13} />}
                Desar
              </button>
            )}
            <button className="btn-primary" onClick={() => setShowNewTask(true)}><Plus size={13} /> Nova tasca</button>
          </div>
        </div>

        {/* Inline editable fields */}
        <div className="client-fields">
          <div className="field-group field-group--full">
            <label className="field-label">Descripció</label>
            <textarea
              className="field-textarea"
              value={fields.description}
              onChange={setField('description')}
              placeholder="Descripció breu del client..."
              rows={2}
            />
          </div>
          <div className="field-group">
            <label className="field-label"><Globe size={11} /> Web</label>
            <input className="field-input" value={fields.website} onChange={setField('website')} placeholder="https://..." />
          </div>
        </div>

        {/* Contact person */}
        <div className="contact-section">
          <div className="contact-section-label">Persona de contacte</div>
          <div className="contact-row">
            <div className="contact-avatar-wrap" onClick={() => contactPhotoRef.current?.click()} title="Canviar foto contacte">
              {localClient.contact_photo_url
                ? <img src={localClient.contact_photo_url} alt="" className="contact-avatar-img" />
                : <div className="contact-avatar-empty">{uploadingContact ? <Loader2 size={14} className="spin" /> : <User size={16} color="#C0C0C0" />}</div>}
              <div className="contact-avatar-overlay"><Camera size={12} /></div>
              <input ref={contactPhotoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleContactPhotoUpload(f) }} />
            </div>
            <div className="contact-fields">
              <div className="contact-fields-row">
                <div className="field-group">
                  <label className="field-label"><User size={11} /> Nom</label>
                  <input className="field-input" value={fields.contact_name} onChange={setField('contact_name')} placeholder="Nom del contacte" />
                </div>
                <div className="field-group">
                  <label className="field-label">Càrrec</label>
                  <input className="field-input" value={fields.contact_position} onChange={setField('contact_position')} placeholder="Director, CEO..." />
                </div>
                <div className="field-group">
                  <label className="field-label"><Mail size={11} /> Email</label>
                  <input className="field-input" type="email" value={fields.contact_email} onChange={setField('contact_email')} placeholder="email@exemple.com" />
                </div>
                <div className="field-group">
                  <label className="field-label"><Phone size={11} /> Telèfon</label>
                  <input className="field-input" type="tel" value={fields.contact_phone} onChange={setField('contact_phone')} placeholder="+34 600 000 000" />
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Agreement section — inside the white card, below contact */}
      <div className="acord-panel">
        <div className="acord-panel-header">
          <span className="acord-panel-label">Acord</span>
          {acordDirty && (
            <button className="btn-save" onClick={handleAcordSave} disabled={acordSaving}>
              {acordSaving ? <Loader2 size={13} className="spin" /> : <Save size={13} />}
              Desar acord
            </button>
          )}
        </div>
        <div className="acord-grid">
          <div className="acord-field">
            <label className="acord-label">Sessions contractades</label>
            <select className="acord-select" value={acordFields.sessions_count} onChange={setAcordField('sessions_count')}>
              <option value="">Sense especificar</option>
              {['1','2','3','4','5','6','7','8','9','10'].map(n => (
                <option key={n} value={n}>{n} sessió{Number(n) > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>
          <div className="acord-field">
            <label className="acord-label">Tipus de client</label>
            <select className="acord-select" value={acordFields.agreement_type} onChange={setAcordField('agreement_type')}>
              <option value="">Selecciona...</option>
              <option value="puntual">Puntual</option>
              <option value="recurrent">Recurrent</option>
            </select>
          </div>
          <div className="acord-field">
            <label className="acord-label">Duració del contracte</label>
            <select className="acord-select" value={acordFields.contract_duration} onChange={setAcordField('contract_duration')}>
              <option value="">Selecciona...</option>
              <option value="durant l'esdeveniment">Durant l&apos;esdeveniment</option>
              <option value="anual">Anual</option>
              <option value="mensual">Mensual</option>
              <option value="personalitzable">Personalitzable</option>
            </select>
          </div>
          <div className="acord-field">
            <label className="acord-label">Gestor de compte</label>
            <select className="acord-select" value={acordFields.account_manager_id} onChange={setAcordField('account_manager_id')}>
              <option value="">Sense assignar</option>
              {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
          </div>
          <div className="acord-field acord-field--full">
            <button type="button" className="services-toggle" onClick={() => setServicesOpen(v => !v)}>
              <div className="services-toggle-left">
                <span className="acord-label" style={{ margin: 0 }}>Serveis contractats</span>
                {selectedServices.length === 0 && !servicesOpen && (
                  <span className="services-hint">Clica per seleccionar els serveis inclosos</span>
                )}
              </div>
              <span className="services-toggle-meta">
                {selectedServices.length > 0 && (
                  <span className="services-count">{selectedServices.length} de {CONTRACTED_SERVICES.length}</span>
                )}
                <ChevronDown size={13} style={{ transform: servicesOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: '#9A9A9A' }} />
              </span>
            </button>
            {servicesOpen && (
              <div className="services-list">
                <div className="services-list-header">
                  <span className="services-list-hint">Selecciona els serveis inclosos en el contracte</span>
                  <button
                    type="button"
                    className="services-selectall"
                    onClick={() => {
                      const allSelected = CONTRACTED_SERVICES.every(s => selectedServices.includes(s))
                      setSelectedServices(allSelected ? [] : [...CONTRACTED_SERVICES])
                      setAcordDirty(true)
                    }}
                  >
                    {CONTRACTED_SERVICES.every(s => selectedServices.includes(s)) ? 'Cap' : 'Tots'}
                  </button>
                </div>
                {CONTRACTED_SERVICES.map((svc, i) => {
                  const checked = selectedServices.includes(svc)
                  return (
                    <button
                      key={svc}
                      type="button"
                      onClick={() => {
                        const next = checked
                          ? selectedServices.filter(s => s !== svc)
                          : [...selectedServices, svc]
                        setSelectedServices(next)
                        setAcordDirty(true)
                      }}
                      className={`svc-row${checked ? ' svc-row--on' : ''}`}
                    >
                      <span className="svc-check">
                        {checked ? (
                          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                            <path d="M2.5 6.5L5.5 9.5L10.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : null}
                      </span>
                      <span className="svc-num">{String(i + 1).padStart(2, '0')}</span>
                      <span className="svc-name">{svc}</span>
                      {checked && <span className="svc-badge">✓ Inclòs</span>}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      </div>

      {/* Tabs */}
      <div className="tabs-bar">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn('tab-btn', tab === t.key && 'tab-btn--active')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="tab-content">
        {tab === 'resum' && (
          <div className="tab-grid">
            {/* Quick stats */}
            <div className="tab-section">
              <h3 className="section-title">Resum</h3>
              <div className="resum-stats">
                <div className="resum-stat">
                  <div className="resum-stat-value">{projects.filter(p => p.status === 'active').length}</div>
                  <div className="resum-stat-label">Projectes actius</div>
                </div>
                <div className="resum-stat">
                  <div className="resum-stat-value">{tasks.length}</div>
                  <div className="resum-stat-label">Tasques pendents</div>
                </div>
                <div className="resum-stat">
                  <div className="resum-stat-value">{tasks.filter(t => t.priority === 'urgent').length}</div>
                  <div className="resum-stat-label">Urgents</div>
                </div>
              </div>
            </div>

            {/* Recent projects */}
            {projects.length > 0 && (
              <div className="tab-section">
                <div className="section-header">
                  <h3 className="section-title">Projectes recents</h3>
                  <button onClick={() => setTab('campanyes')} className="section-link">Veure tots</button>
                </div>
                <div className="mini-project-list">
                  {projects.slice(0, 4).map((p) => {
                    const badge = statusBadge[p.status] || statusBadge.planning
                    return (
                      <Link key={p.id} href={`/projects/${p.id}`} className="mini-project">
                        <div className="mini-project-name">{p.name}</div>
                        <span className="mini-project-status" style={{ background: badge.bg, color: badge.color }}>
                          {projectStatusLabels[p.status]}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Urgent tasks */}
            {tasks.filter(t => t.priority === 'urgent' || t.priority === 'high').length > 0 && (
              <div className="tab-section">
                <div className="section-header">
                  <h3 className="section-title">Tasques prioritàries</h3>
                  <button onClick={() => setTab('tasques')} className="section-link">Veure totes</button>
                </div>
                {tasks.filter(t => t.priority === 'urgent' || t.priority === 'high').slice(0, 5).map((task) => (
                  <MiniTask key={task.id} task={task} onClick={() => setSelectedTask(task)} onDelete={handleDeleteTask} />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'campanyes' && (
          <div className="tab-full">
            <div className="section-header" style={{ marginBottom: showNewProject ? '0' : '16px' }}>
              <h3 className="section-title">Projectes</h3>
              <button className="btn-primary" onClick={() => setShowNewProject(v => !v)}>
                {showNewProject ? <X size={13} /> : <Plus size={13} />}
                {showNewProject ? 'Cancel·lar' : 'Nou projecte'}
              </button>
            </div>

            {showNewProject && (
              <form onSubmit={handleCreateProject} className="new-project-form">
                <div className="npf-row">
                  <div className="npf-field npf-field--grow">
                    <label>Nom del projecte *</label>
                    <input
                      type="text"
                      value={newProjectForm.name}
                      onChange={e => setNewProjectForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="Ex: Xarxes Socials Q1 2025"
                      required autoFocus
                    />
                  </div>
                  <div className="npf-field">
                    <label>Tipus</label>
                    <select value={newProjectForm.type} onChange={e => setNewProjectForm(p => ({ ...p, type: e.target.value }))}>
                      <option value="social_media">Social Media</option>
                      <option value="content">Contingut</option>
                      <option value="event">Esdeveniment</option>
                      <option value="matchday">Matchday</option>
                      <option value="campaign">Campanya</option>
                      <option value="reporting">Reporting</option>
                      <option value="custom">Personalitzat</option>
                    </select>
                  </div>
                  <div className="npf-field">
                    <label>Estat</label>
                    <select value={newProjectForm.status} onChange={e => setNewProjectForm(p => ({ ...p, status: e.target.value }))}>
                      <option value="planning">Planificació</option>
                      <option value="active">Actiu</option>
                      <option value="at_risk">En risc</option>
                      <option value="blocked">Bloquejat</option>
                    </select>
                  </div>
                </div>
                <div className="npf-row">
                  <div className="npf-field npf-field--grow">
                    <label>Descripció</label>
                    <input
                      type="text"
                      value={newProjectForm.description}
                      onChange={e => setNewProjectForm(p => ({ ...p, description: e.target.value }))}
                      placeholder="Descripció opcional..."
                    />
                  </div>
                  <button type="submit" className="btn-primary" disabled={savingProject} style={{ alignSelf: 'flex-end', marginBottom: '0', height: '38px' }}>
                    {savingProject ? <Loader2 size={13} className="spin" /> : <Plus size={13} />}
                    Crear projecte
                  </button>
                </div>
              </form>
            )}

            {localProjects.length === 0 && !showNewProject ? (
              <EmptyState icon={<FolderKanban size={28} />} text="Sense projectes." action="Nou projecte" onAction={() => setShowNewProject(true)} />
            ) : (
              <div className="project-table" style={{ marginTop: showNewProject ? '16px' : '0' }}>
                {localProjects.map((p) => {
                  const badge = statusBadge[p.status] || statusBadge.planning
                  return (
                    <Link key={p.id} href={`/projects/${p.id}`} className="project-row">
                      <div className="project-row-name">{p.name}</div>
                      <span className="project-row-status" style={{ background: badge.bg, color: badge.color }}>
                        {projectStatusLabels[p.status]}
                      </span>
                      {p.responsible && (
                        <div className="project-row-resp">
                          <div className="mini-avatar">{getInitials(p.responsible.full_name)}</div>
                          <span>{p.responsible.full_name}</span>
                        </div>
                      )}
                      {p.end_date && (
                        <div className="project-row-date">
                          <Clock size={11} />
                          {formatDate(p.end_date)}
                        </div>
                      )}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'pla' && (
          <div className="tab-full">
            <div className="section-header" style={{ marginBottom: '20px' }}>
              <h3 className="section-title">Pla de contingut anual</h3>
            </div>
            <AnnualPlan clientId={client.id} projects={localProjects as any} />
          </div>
        )}

        {tab === 'tasques' && (
          <div className="tab-full">
            <div className="section-header" style={{ marginBottom: '16px' }}>
              <h3 className="section-title">Tasques pendents</h3>
              <button className="btn-primary" onClick={() => setShowNewTask(true)}><Plus size={13} /> Nova tasca</button>
            </div>
            {localTasks.length === 0 ? (
              <EmptyState icon={<CheckSquare size={28} />} text="Cap tasca pendent." action="Nova tasca" onAction={() => setShowNewTask(true)} />
            ) : (
              <div className="tasks-section">
                {localTasks.map((task) => <MiniTask key={task.id} task={task} showProject onClick={() => setSelectedTask(task)} onDelete={handleDeleteTask} />)}
              </div>
            )}
          </div>
        )}

        {tab === 'briefing' && (
          <div className="tab-full">
            <BriefingTab briefing={briefing} clientId={client.id} />
          </div>
        )}

        {tab === 'estrategia' && (
          <div className="tab-full">
            <StrategyTab strategy={strategy} clientId={client.id} />
          </div>
        )}

        {tab === 'metriques' && (
          <div className="tab-full">
            <div className="section-header">
              <h3 className="section-title">Mètriques</h3>
            </div>
            <div className="empty-state" style={{ padding: '60px 24px' }}>
              <BarChart2 size={28} color="#D0D0D0" />
              <p>Les mètriques s&apos;afegiran aviat.</p>
            </div>
          </div>
        )}
      </div>

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          profiles={profiles}
          clients={[{ id: client.id, name: client.name }]}
          projects={localProjects.map(p => ({ id: p.id, name: p.name }))}
          currentUserId={currentUserId}
          onClose={() => setSelectedTask(null)}
          onUpdated={(updated) => {
            setLocalTasks(prev => prev.map(t => t.id === updated.id ? updated : t))
            setSelectedTask(null)
          }}
        />
      )}

      {showNewTask && (
        <NewTaskModal
          clients={[{ id: client.id, name: client.name }]}
          projects={localProjects.map(p => ({ id: p.id, name: p.name }))}
          profiles={profiles}
          currentUserId={currentUserId}
          defaultStatus="todo"
          defaultClientId={client.id}
          onClose={() => setShowNewTask(false)}
          onCreated={(task) => {
            setLocalTasks(prev => [...prev, task])
            setShowNewTask(false)
          }}
        />
      )}

      <style jsx>{`
        .client-detail {
          flex: 1;
          padding: 24px 28px 40px;
          overflow-y: auto;
        }

        @media (max-width: 767px) {
          .client-detail { padding: 12px 12px 80px; }
          .client-header-actions { flex-wrap: wrap; gap: 6px; }
          .client-fields { flex-direction: column; gap: 8px; }
          .field-group { min-width: 100%; }
          .tab-btn { padding: 0 10px; font-size: 12.5px; }
          .tab-section { padding: 14px; }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .client-detail { padding: 16px 16px 40px; }
        }

        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 20px;
          font-size: 13px;
        }

        :global(.breadcrumb-link) {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #5C5C5C;
          text-decoration: none;
          transition: color 0.15s;
        }

        :global(.breadcrumb-link:hover) { color: #1B2B4B; }
        .breadcrumb-sep { color: #D0D0D0; }
        .breadcrumb-current { color: #0a0a0a; font-weight: 500; }

        .client-header {
          background: white; border: 1px solid #ECECEC; border-radius: 14px;
          padding: 24px; margin-bottom: 20px;
        }

        .client-avatar-wrap {
          position: relative; width: 60px; height: 60px; flex-shrink: 0; cursor: pointer; border-radius: 14px; overflow: hidden;
        }
        .client-avatar-wrap:hover .avatar-overlay { opacity: 1; }
        .avatar-overlay {
          position: absolute; inset: 0; background: rgba(0,0,0,0.45); color: white;
          display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.15s; border-radius: 14px;
        }
        :global(.spin) { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .client-big-avatar {
          width: 60px; height: 60px; border-radius: 14px; background: #1B2B4B14;
          color: #1B2B4B; font-size: 20px; font-weight: 700;
          display: flex; align-items: center; justify-content: center; overflow: hidden;
        }
        .client-big-avatar img { width: 100%; height: 100%; object-fit: cover; }

        /* Header layout */
        .client-header { display: flex; flex-direction: column; gap: 0; }
        .client-header-top { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 16px; }
        .client-top-info { flex: 1; min-width: 0; }
        .client-name-row { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
        .client-header-name { font-size: 20px; font-weight: 700; color: #0a0a0a; letter-spacing: -0.02em; cursor: text; border-radius: 4px; padding: 1px 3px; transition: background 0.15s; }
        .client-header-name:hover { background: #F5F5F5; }
        .client-header-name-input {
          font-size: 20px; font-weight: 700; color: #0a0a0a; letter-spacing: -0.02em;
          border: none; border-bottom: 2px solid #1B2B4B; background: transparent;
          outline: none; font-family: inherit; padding: 1px 3px; width: auto; min-width: 120px;
        }
        .client-health-badge { font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 6px; }
        .client-header-meta { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #5C5C5C; flex-wrap: wrap; }
        .meta-sep { color: #D0D0D0; }
        .client-header-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; }

        /* Inline editable fields */
        .client-fields { display: flex; gap: 12px; flex-wrap: wrap; padding-top: 14px; border-top: 1px solid #F0F0F0; margin-bottom: 14px; }
        .field-group { display: flex; flex-direction: column; gap: 4px; min-width: 180px; }
        .field-group--full { flex: 1; min-width: 100%; }
        .field-label { display: flex; align-items: center; gap: 4px; font-size: 10px; font-weight: 700; color: #C0C0C0; text-transform: uppercase; letter-spacing: 0.07em; }
        .field-input {
          border: none; border-bottom: 1.5px solid transparent; padding: 4px 0; font-size: 13.5px;
          color: #0a0a0a; background: transparent; outline: none; font-family: inherit; width: 100%;
          transition: border-color 0.15s;
        }
        .field-input:focus { border-bottom-color: #1B2B4B60; }
        .field-input::placeholder { color: #D0D0D0; }
        .field-textarea {
          border: none; border-bottom: 1.5px solid transparent; padding: 4px 0; font-size: 13.5px;
          color: #3C3C3C; background: transparent; outline: none; font-family: inherit; width: 100%;
          resize: none; line-height: 1.55; transition: border-color 0.15s;
        }
        .field-textarea:focus { border-bottom-color: #1B2B4B60; }
        .field-textarea::placeholder { color: #D0D0D0; }

        /* Contact section */
        .contact-section { padding-top: 14px; border-top: 1px solid #F0F0F0; }
        .contact-section-label { font-size: 10px; font-weight: 700; color: #C0C0C0; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 10px; }
        .contact-row { display: flex; align-items: flex-start; gap: 14px; }
        .contact-avatar-wrap { position: relative; width: 44px; height: 44px; border-radius: 50%; cursor: pointer; flex-shrink: 0; }
        .contact-avatar-wrap:hover .contact-avatar-overlay { opacity: 1; }
        .contact-avatar-img { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; }
        .contact-avatar-empty { width: 44px; height: 44px; border-radius: 50%; background: #F5F5F5; border: 2px dashed #E0E0E0; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
        .contact-avatar-wrap:hover .contact-avatar-empty { border-color: #1B2B4B60; background: #F0F4FF; }
        .contact-avatar-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.4); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.15s; }
        .contact-fields { flex: 1; }
        .contact-fields-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 8px 16px; }

        /* Buttons */
        .btn-save { display: flex; align-items: center; gap: 6px; height: 34px; padding: 0 14px; background: #16A34A; color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; transition: background 0.15s; }
        .btn-save:hover:not(:disabled) { background: #15803D; }
        .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

        :global(.meta-link) { display: flex; align-items: center; gap: 4px; color: #1B2B4B; text-decoration: none; }

        .meta-resp-avatar {
          display: inline-flex;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #F0F0F0;
          color: #5C5C5C;
          font-size: 8px;
          font-weight: 700;
          align-items: center;
          justify-content: center;
          margin-right: 5px;
        }

        .client-header-desc {
          font-size: 13.5px;
          color: #5C5C5C;
          margin-top: 8px;
          line-height: 1.5;
        }

        .client-header-actions {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
          flex-wrap: wrap;
        }

        .btn-secondary {
          display: flex;
          align-items: center;
          gap: 6px;
          height: 34px;
          padding: 0 12px;
          border: 1px solid #E8E8E8;
          border-radius: 8px;
          font-size: 13px;
          cursor: pointer;
          background: white;
          color: #5C5C5C;
          transition: all 0.15s;
        }
        .btn-secondary:hover { border-color: #D0D0D0; color: #0a0a0a; }

        .btn-primary {
          display: flex;
          align-items: center;
          gap: 6px;
          height: 34px;
          padding: 0 12px;
          background: #1B2B4B;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
        }
        .btn-primary:hover { background: #4A82C6; }

        /* Tabs */
        .tabs-bar {
          display: flex;
          gap: 2px;
          border-bottom: 1px solid #ECECEC;
          margin-bottom: 20px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .tab-btn {
          height: 40px;
          padding: 0 16px;
          border: none;
          background: none;
          font-size: 13.5px;
          font-weight: 500;
          color: #5C5C5C;
          cursor: pointer;
          white-space: nowrap;
          border-bottom: 2px solid transparent;
          margin-bottom: -1px;
          transition: color 0.15s, border-color 0.15s;
        }

        .tab-btn:hover { color: #0a0a0a; }

        .tab-btn--active {
          color: #1B2B4B;
          border-bottom-color: #1B2B4B;
          font-weight: 600;
        }

        .tab-content { min-height: 200px; }
        .tab-full {}

        .tab-grid {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .tab-section {
          background: white;
          border: 1px solid #ECECEC;
          border-radius: 12px;
          padding: 20px;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .section-title {
          font-size: 13.5px;
          font-weight: 600;
          color: #0a0a0a;
        }

        .section-link {
          font-size: 12.5px;
          color: #1B2B4B;
          background: none;
          border: none;
          cursor: pointer;
          font-weight: 500;
        }

        /* Resum stats */
        .resum-stats {
          display: flex;
          gap: 20px;
        }

        .resum-stat {
          flex: 1;
        }

        .resum-stat-value {
          font-size: 28px;
          font-weight: 700;
          color: #0a0a0a;
          letter-spacing: -0.02em;
        }

        .resum-stat-label {
          font-size: 12px;
          color: #9A9A9A;
          margin-top: 2px;
        }

        /* Acord panel — inside white card, below contact */
        .acord-panel {
          border-top: 1px solid #F0F0F0;
          padding: 16px 0 0;
          margin-top: 14px;
        }
        .acord-panel-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 12px;
        }
        .acord-panel-label {
          font-size: 10px; font-weight: 700; color: #C0C0C0;
          text-transform: uppercase; letter-spacing: 0.07em;
        }

        /* Services toggle */
        .services-toggle {
          display: flex; align-items: center; justify-content: space-between;
          width: 100%; background: none; border: none; cursor: pointer;
          padding: 0; font-family: inherit; text-align: left;
          margin-bottom: 0;
        }
        .services-toggle-left { display: flex; flex-direction: column; gap: 2px; }
        .services-hint { font-size: 11px; color: #C0C0C0; }
        .services-toggle:hover .acord-label { color: #1B2B4B; }
        .services-toggle-meta {
          display: flex; align-items: center; gap: 8px;
        }
        .services-count {
          font-size: 10px; font-weight: 700; color: white;
          background: #1B2B4B; padding: 2px 7px; border-radius: 20px;
        }

        /* Services premium list */
        .services-list {
          display: flex; flex-direction: column; gap: 0;
          margin-top: 10px; border-radius: 12px; overflow: hidden;
          border: 1.5px solid #EEEFF2;
        }
        .services-list-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 9px 14px; background: #FAFBFC;
          border-bottom: 1px solid #EEEFF2;
        }
        .services-list-hint {
          font-size: 11px; color: #A0A0B0;
        }
        .services-selectall {
          font-size: 11px; font-weight: 700; color: #1B2B4B;
          background: none; border: 1.5px solid #1B2B4B20; border-radius: 6px;
          padding: 2px 8px; cursor: pointer; font-family: inherit;
          transition: all 0.12s;
        }
        .services-selectall:hover { background: #1B2B4B10; }
        .svc-row {
          display: flex; align-items: center; gap: 12px;
          width: 100%; padding: 11px 14px;
          background: white; border: none; border-bottom: 1px solid #F2F3F5;
          cursor: pointer; font-family: inherit; text-align: left;
          transition: background 0.15s;
          position: relative;
        }
        .svc-row:last-child { border-bottom: none; }
        .svc-row:hover { background: #F8F9FF; }
        .svc-row--on { background: #F0F4FF; }
        .svc-row--on:hover { background: #E8EFFF; }
        .svc-check {
          width: 20px; height: 20px; border-radius: 6px; flex-shrink: 0;
          border: 1.5px solid #D8DCE6; background: white;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .svc-row--on .svc-check {
          background: #1B2B4B; border-color: #1B2B4B;
        }
        .svc-num {
          font-size: 10px; font-weight: 700; color: #C8CDD8;
          font-variant-numeric: tabular-nums; letter-spacing: 0.04em;
          flex-shrink: 0; min-width: 20px;
        }
        .svc-row--on .svc-num { color: #8FA3CC; }
        .svc-name {
          flex: 1; font-size: 13px; font-weight: 500; color: #4A5068;
          line-height: 1.3;
        }
        .svc-row--on .svc-name { color: #1B2B4B; font-weight: 600; }
        .svc-badge {
          font-size: 10px; font-weight: 700; color: #4A7FCF;
          background: #E8F0FF; padding: 2px 7px; border-radius: 5px;
          flex-shrink: 0;
        }

        /* Acord section */
        .acord-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 14px 20px;
        }
        .acord-field { display: flex; flex-direction: column; gap: 5px; }
        .acord-field--full { grid-column: 1 / -1; }
        .acord-label { font-size: 10px; font-weight: 700; color: #C0C0C0; text-transform: uppercase; letter-spacing: 0.07em; }
        .acord-input {
          border: none; border-bottom: 1.5px solid transparent; padding: 4px 0;
          font-size: 13.5px; color: #0a0a0a; background: transparent; outline: none;
          font-family: inherit; width: 100%; transition: border-color 0.15s;
        }
        .acord-input:focus { border-bottom-color: #1B2B4B60; }
        .acord-input::placeholder { color: #D0D0D0; }
        .acord-select {
          border: none; border-bottom: 1.5px solid transparent; padding: 4px 0;
          font-size: 13.5px; color: #0a0a0a; background: transparent; outline: none;
          font-family: inherit; width: 100%; cursor: pointer; transition: border-color 0.15s;
        }
        .acord-select:focus { border-bottom-color: #1B2B4B60; }
        .acord-textarea {
          border: none; border-bottom: 1.5px solid transparent; padding: 4px 0;
          font-size: 13.5px; color: #3C3C3C; background: transparent; outline: none;
          font-family: inherit; width: 100%; resize: none; line-height: 1.55;
          transition: border-color 0.15s;
        }
        .acord-textarea:focus { border-bottom-color: #1B2B4B60; }
        .acord-textarea::placeholder { color: #D0D0D0; }

        /* Mini projects */
        :global(.mini-project) {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #F5F5F5;
          text-decoration: none;
          transition: background 0.1s;
          border-radius: 6px;
          padding-left: 4px;
          padding-right: 4px;
        }
        :global(.mini-project:last-child) { border-bottom: none; }
        :global(.mini-project:hover) { background: #FAFAFA; }

        .mini-project-name {
          font-size: 13.5px;
          font-weight: 500;
          color: #0a0a0a;
        }

        .mini-project-status {
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 5px;
        }

        /* Project table */
        :global(.project-row) {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: white;
          border: 1px solid #ECECEC;
          border-radius: 10px;
          margin-bottom: 8px;
          text-decoration: none;
          transition: box-shadow 0.15s;
        }
        :global(.project-row:hover) { box-shadow: 0 2px 8px rgba(0,0,0,0.06); }

        .project-row-name {
          flex: 1;
          font-size: 14px;
          font-weight: 500;
          color: #0a0a0a;
        }

        .project-row-status {
          font-size: 11px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 5px;
        }

        .project-row-resp {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          color: #5C5C5C;
        }

        .mini-avatar {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #F0F0F0;
          color: #5C5C5C;
          font-size: 9px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .project-row-date {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: #9A9A9A;
        }

        .tasks-section {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: #9A9A9A;
          font-size: 14px;
          padding: 60px 24px;
          background: white;
          border: 1px solid #ECECEC;
          border-radius: 12px;
        }

        /* New project inline form */
        .new-project-form {
          background: #F8F9FC;
          border: 1.5px solid #E0E4EE;
          border-radius: 10px;
          padding: 16px;
          margin-bottom: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .npf-row {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          flex-wrap: wrap;
        }

        .npf-field {
          display: flex;
          flex-direction: column;
          gap: 5px;
          min-width: 0;
        }

        .npf-field--grow { flex: 1; min-width: 140px; }

        .npf-field label {
          font-size: 11px;
          font-weight: 600;
          color: #5C5C5C;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .npf-field input,
        .npf-field select,
        .npf-field textarea {
          height: 34px;
          padding: 0 10px;
          border: 1.5px solid #E8E8E8;
          border-radius: 7px;
          font-size: 13px;
          color: #0a0a0a;
          background: white;
          outline: none;
          font-family: inherit;
          transition: border-color 0.15s;
        }

        .npf-field input:focus,
        .npf-field select:focus,
        .npf-field textarea:focus { border-color: #1B2B4B; }

        .npf-field textarea { height: auto; padding: 8px 10px; resize: vertical; }

        .npf-submit-row { display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px; }
      `}</style>
    </div>
  )
}

function MiniTask({ task, showProject, onClick, onDelete }: { task: Task; showProject?: boolean; onClick?: () => void; onDelete?: (id: string) => void }) {
  const priorityColor: Record<string, string> = {
    urgent: '#DC2626', high: '#D97706', medium: '#1B2B4B', low: '#9A9A9A',
  }

  return (
    <div className="mini-task" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <Circle size={16} strokeWidth={1.5} color="#D0D0D0" style={{ flexShrink: 0 }} />
      <div className="mini-task-info">
        <div className="mini-task-title">{task.title}</div>
        {showProject && task.project && (
          <div className="mini-task-project">{task.project.name}</div>
        )}
      </div>
      {task.deadline && (
        <div className="mini-task-date">
          <Clock size={10} />
          {new Date(task.deadline).toLocaleDateString('ca-ES', { day: '2-digit', month: 'short' })}
        </div>
      )}
      <span
        className="mini-task-priority"
        style={{ color: priorityColor[task.priority], background: `${priorityColor[task.priority]}18` }}
      >
        {taskPriorityLabels[task.priority]}
      </span>
      {onDelete && (
        <button
          className="mini-task-del"
          title="Eliminar tasca"
          onClick={(e) => { e.stopPropagation(); onDelete(task.id) }}
        >
          <Trash2 size={13} />
        </button>
      )}

      <style jsx>{`
        .mini-task {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          background: white;
          border: 1px solid #ECECEC;
          border-radius: 9px;
          transition: box-shadow 0.15s;
        }
        .mini-task:hover { box-shadow: 0 2px 6px rgba(0,0,0,0.05); }
        .mini-task-del {
          width: 28px; height: 28px; border: none; background: transparent;
          border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center;
          color: #C0C0C0; opacity: 0; transition: opacity 0.15s, background 0.15s, color 0.15s;
          flex-shrink: 0;
        }
        .mini-task:hover .mini-task-del { opacity: 1; }
        .mini-task-del:hover { background: #FEE2E2; color: #DC2626; }

        .mini-task-info { flex: 1; min-width: 0; }

        .mini-task-title {
          font-size: 13.5px;
          font-weight: 500;
          color: #0a0a0a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .mini-task-project {
          font-size: 11.5px;
          color: #9A9A9A;
          margin-top: 2px;
        }

        .mini-task-date {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 11px;
          color: #9A9A9A;
          white-space: nowrap;
        }

        .mini-task-priority {
          font-size: 10.5px;
          font-weight: 600;
          padding: 2px 7px;
          border-radius: 4px;
          white-space: nowrap;
        }
      `}</style>
    </div>
  )
}

const BRIEFING_SECTIONS = [
  { num: 1, key: 'info_marca', title: 'Informació de la marca', fields: [
    { key: 'nom_marca', label: 'Nom de la marca', type: 'text' },
    { key: 'persona_contacte', label: 'Persona de contacte', type: 'text' },
    { key: 'sector', label: 'Sector', type: 'text' },
    { key: 'xarxes_actuals', label: 'Xarxes actuals', type: 'text' },
    { key: 'ubicacio_mercat', label: 'Ubicació / mercat principal', type: 'text' },
  ]},
  { num: 2, key: 'negoci', title: 'Negoci, monetització i producte', fields: [
    { key: 'que_ven', label: 'Què ven la marca?', type: 'textarea' },
    { key: 'producte_estrella', label: 'Producte estrella', type: 'text' },
    { key: 'diferencial', label: 'Diferencial respecte la competència', type: 'textarea' },
    { key: 'producte_rendible', label: 'Producte o servei més rendible', type: 'text' },
    { key: 'ticket_mitja', label: 'Ticket mitjà del client', type: 'text' },
  ]},
  { num: 3, key: 'objectius', title: 'Objectius', fields: [
    { key: 'obj_marca_curt', label: 'Objectius de marca — curt termini', type: 'textarea' },
    { key: 'obj_marca_llarg', label: 'Objectius de marca — llarg termini', type: 'textarea' },
    { key: 'obj_primers_30', label: 'Primers 30 dies', type: 'textarea' },
    { key: 'obj_negoci', label: 'Objectius de negoci', type: 'textarea' },
    { key: 'exit_6_mesos', label: "Què seria un «èxit» en 6 mesos?", type: 'textarea' },
    { key: 'kpis', label: 'KPIs importants (leads, vendes, visualitzacions…)', type: 'text' },
  ]},
  { num: 4, key: 'public', title: 'Públic objectiu', fields: [
    { key: 'client_ideal', label: 'Client ideal (edat / perfil)', type: 'text' },
    { key: 'nivell_socioeconomic', label: 'Nivell socioeconòmic', type: 'text' },
    { key: 'interessos', label: 'Interessos', type: 'text' },
    { key: 'com_compra', label: 'Com compra? (impulsiu, comparatiu…)', type: 'text' },
  ]},
  { num: 5, key: 'situacio', title: 'Situació actual', fields: [
    { key: 'reptes_principals', label: 'Principals reptes actuals', type: 'textarea' },
    { key: 'problema_urgent', label: 'Problema més urgent avui', type: 'textarea' },
  ]},
  { num: 6, key: 'xarxes', title: 'Xarxes socials', fields: [
    { key: 'xarxa_millors_resultats', label: 'Xarxa que genera més resultats', type: 'text' },
    { key: 'xarxa_mes_costa', label: 'Xarxa que més els costa', type: 'text' },
    { key: 'que_han_provat', label: 'Què han provat abans?', type: 'textarea' },
    { key: 'contingut_funcionat', label: 'Contingut que ha funcionat millor', type: 'textarea' },
    { key: 'contingut_fracassat', label: 'Contingut que ha fracassat', type: 'textarea' },
    { key: 'dades_anuncis', label: "Dades d'anuncis o mètriques anteriors", type: 'textarea' },
  ]},
  { num: 7, key: 'contingut', title: 'Creació de contingut', fields: [
    { key: 'espais_visuals', label: 'Tenen espais visuals atractius?', type: 'text' },
    { key: 'persones_camera', label: 'Clients/equip disposats a participar?', type: 'text' },
    { key: 'esdeveniments', label: 'Esdeveniments o moments recurrents aprofitables', type: 'textarea' },
    { key: 'frequencia_contingut', label: 'Freqüència de contingut que poden assumir', type: 'text' },
    { key: 'biblioteca_media', label: 'Tenen biblioteca de fotos/vídeos?', type: 'text' },
    { key: 'refs_visuals_ok', label: 'Referències visuals que agraden', type: 'textarea' },
    { key: 'refs_visuals_no', label: 'Referències que NO agraden', type: 'textarea' },
    { key: 'to_comunicacio', label: 'To de comunicació', type: 'text', placeholder: 'formal, proper, aspiracional, tècnic, divertit…' },
  ]},
  { num: 8, key: 'posicionament', title: 'Posicionament de la marca', fields: [
    { key: 'com_percebre', label: 'Com vols que es percebi la marca?', type: 'textarea' },
    { key: 'adjectius_marca', label: '3 adjectius que defineixin la marca', type: 'text' },
    { key: 'que_no_ser', label: 'Què NO vols que sigui la marca?', type: 'textarea' },
    { key: 'canal_mes_vendes', label: 'Canal que genera més vendes', type: 'text' },
    { key: 'temes_no_tractar', label: 'Temes que NO es poden tractar', type: 'textarea' },
    { key: 'paraules_evitables', label: 'Paraules o enfocaments evitables', type: 'textarea' },
    { key: 'competidors_no_comparar', label: 'Competidors amb els quals NO es vol comparar', type: 'text' },
  ]},
  { num: 9, key: 'competencia', title: 'Competència', fields: [
    { key: 'competidors_directes', label: 'Competidors directes', type: 'text' },
    { key: 'competidors_ben', label: 'Què fan bé', type: 'textarea' },
    { key: 'competidors_malament', label: 'Què fan malament', type: 'textarea' },
    { key: 'marca_referent', label: 'Marca referent (encara que no sigui del sector)', type: 'text' },
  ]},
  { num: 10, key: 'colaboracions', title: 'Col·laboracions', fields: [
    { key: 'marques_colaboren', label: 'Marques/entitats amb les quals col·laboren', type: 'text' },
    { key: 'sponsors', label: 'Sponsors', type: 'text' },
    { key: 'partners_digitals', label: 'Partners digitals', type: 'text' },
    { key: 'creadors_vinculats', label: 'Clubs, jugadors o creadors vinculats', type: 'text' },
    { key: 'esdeveniments_amplificar', label: 'Esdeveniments on amplificar contingut', type: 'textarea' },
  ]},
  { num: 11, key: 'processos', title: 'Processos i aprovacions', fields: [
    { key: 'qui_aprova', label: 'Qui aprova contingut?', type: 'text' },
    { key: 'vies_comunicacio', label: 'Vies de comunicació', type: 'text' },
    { key: 'gestio_canvis', label: 'Com es gestionen els canvis i revisions?', type: 'textarea' },
    { key: 'gestio_urgencies', label: 'Com es tracten les urgències?', type: 'textarea' },
    { key: 'recursos_interns', label: 'Quins recursos interns té la marca?', type: 'textarea' },
    { key: 'temps_dedicar', label: 'Quant temps poden dedicar al projecte?', type: 'text' },
    { key: 'davant_camera', label: 'Estan disposats a sortir davant càmera?', type: 'text' },
  ]},
  { num: 12, key: 'pressupost', title: 'Pressupost i timmings', fields: [
    { key: 'pressupost_mensual', label: 'Pressupost mensual previst', type: 'text' },
    { key: 'treballat_agencia', label: "Han treballat abans amb una agència?", type: 'text' },
    { key: 'perque_van_acabar', label: 'Perquè van acabar la relació?', type: 'textarea' },
    { key: 'quan_comecar', label: 'Quan volen començar?', type: 'text' },
    { key: 'urgencia', label: 'Quina urgència té el projecte?', type: 'text' },
  ]},
  { num: 13, key: 'expectatives', title: 'Expectatives reals', fields: [
    { key: 'que_espera', label: "Què espera el client de l'agència?", type: 'textarea' },
    { key: 'que_creu_marketing', label: 'Què creu que farà el màrqueting?', type: 'textarea' },
    { key: 'expectatives_realistes', label: 'Quines expectatives són realistes?', type: 'textarea' },
    { key: 'expectatives_no', label: 'Quines NO ho són?', type: 'textarea' },
  ]},
  { num: 14, key: 'notes', title: 'Notes finals', fields: [
    { key: 'notes_finals', label: "Hi ha alguna cosa important que no hàgim preguntat?", type: 'textarea' },
  ]},
]

type BriefingContent = Record<string, string>

function BriefingTab({ briefing, clientId }: { briefing: any; clientId: string }) {
  const [mode, setMode] = useState<'view' | 'edit' | 'upload'>(!briefing ? 'edit' : 'view')
  const [content, setContent] = useState<BriefingContent>(() => briefing?.content || {})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(BRIEFING_SECTIONS.map(s => s.key)))
  const [uploading, setUploading] = useState(false)
  const [uploadPreview, setUploadPreview] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const set = (key: string, val: string) => setContent(prev => ({ ...prev, [key]: val }))
  const toggleSection = (key: string) => setOpenSections(prev => {
    const next = new Set(prev)
    next.has(key) ? next.delete(key) : next.add(key)
    return next
  })

  const handleSave = async () => {
    setSaving(true)
    const supabase = createSupabase()
    const payload = { client_id: clientId, content }
    if (briefing?.id) {
      await supabase.from('briefings').update(payload).eq('id', briefing.id)
    } else {
      await supabase.from('briefings').insert(payload)
    }
    setSaving(false)
    setSaved(true)
    setMode('view')
    setTimeout(() => setSaved(false), 2000)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      if (file.name.endsWith('.docx')) {
        const mammoth = (await import('mammoth')).default
        const arrayBuffer = await file.arrayBuffer()
        const result = await mammoth.extractRawText({ arrayBuffer })
        setUploadPreview(result.value)
      } else if (file.type === 'text/plain') {
        const text = await file.text()
        setUploadPreview(text)
      } else {
        alert('Formats acceptats: .docx, .txt')
      }
    } catch (err) {
      console.error(err)
      alert('Error llegint el document.')
    }
    setUploading(false)
  }

  if (mode === 'upload') {
    return (
      <div className="bf-wrap">
        <div className="bf-topbar">
          <div>
            <div className="bf-title">Pujar document de briefing</div>
            <div className="bf-sub">Puja un .docx o .txt i el contingut es mostrarà per revisar-lo</div>
          </div>
          <button className="bf-btn-cancel" onClick={() => setMode(briefing ? 'view' : 'edit')}>Cancel·lar</button>
        </div>

        {!uploadPreview ? (
          <div className="bf-upload-zone" onClick={() => fileRef.current?.click()}>
            <input ref={fileRef} type="file" accept=".docx,.txt" style={{ display: 'none' }} onChange={handleFileUpload} />
            <Upload size={28} color="#D0D0D0" />
            <div className="bf-upload-label">Fes clic per pujar el document</div>
            <div className="bf-upload-sub">Formats: .docx, .txt</div>
            {uploading && <div className="bf-upload-sub">Llegint document...</div>}
          </div>
        ) : (
          <div className="bf-preview-wrap">
            <div className="bf-preview-title">Contingut del document — revisa i edita</div>
            <textarea
              className="bf-preview-textarea"
              value={uploadPreview}
              onChange={e => setUploadPreview(e.target.value)}
              rows={24}
            />
            <div className="bf-upload-actions">
              <button className="bf-btn-cancel" onClick={() => setUploadPreview('')}>Tornar a pujar</button>
              <button className="bf-btn-save" onClick={() => {
                set('notes_finals', uploadPreview)
                setMode('edit')
              }}>
                Continuar al formulari
              </button>
            </div>
          </div>
        )}

        <style jsx>{`
          .bf-upload-zone { border: 2px dashed #E5E7EB; border-radius: 14px; padding: 60px; display: flex; flex-direction: column; align-items: center; gap: 10px; cursor: pointer; transition: border-color 0.15s; background: white; }
          .bf-upload-zone:hover { border-color: #2563EB; }
          .bf-upload-label { font-size: 14px; font-weight: 600; color: #374151; }
          .bf-upload-sub { font-size: 12px; color: #9CA3AF; }
          .bf-preview-wrap { display: flex; flex-direction: column; gap: 10px; }
          .bf-preview-title { font-size: 13px; font-weight: 600; color: #374151; }
          .bf-preview-textarea { width: 100%; border: 1px solid #E5E7EB; border-radius: 10px; padding: 16px; font-size: 12.5px; color: #374151; font-family: monospace; resize: vertical; outline: none; line-height: 1.6; }
          .bf-preview-textarea:focus { border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }
          .bf-upload-actions { display: flex; gap: 8px; justify-content: flex-end; }
        `}</style>
      </div>
    )
  }

  if (mode === 'view') {
    const hasContent = Object.values(content).some(v => v?.trim())
    if (!hasContent) {
      return (
        <div className="bf-empty">
          <FileText size={28} color="#D0D0D0" />
          <p>Encara no hi ha briefing.</p>
          <div className="bf-empty-actions">
            <button className="bf-btn-save" onClick={() => setMode('edit')}>
              <Edit2 size={13} /> Emplenar briefing
            </button>
            <button className="bf-btn-upload" onClick={() => setMode('upload')}>
              <Upload size={13} /> Pujar document
            </button>
          </div>
        </div>
      )
    }
    return (
      <div className="bf-wrap">
        <div className="bf-topbar">
          <div>
            <div className="bf-title">Briefing</div>
            <div className="bf-sub">Informació clau de la marca i els seus objectius</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="bf-btn-upload" onClick={() => setMode('upload')}><Upload size={13}/> Pujar doc</button>
            <button className="bf-btn-save" onClick={() => setMode('edit')}><Edit2 size={13}/> Editar</button>
          </div>
        </div>
        {BRIEFING_SECTIONS.map(section => {
          const filled = section.fields.filter(f => content[f.key]?.trim())
          if (!filled.length) return null
          const open = openSections.has(section.key)
          return (
            <div key={section.key} className="bf-section">
              <button className="bf-section-hdr" onClick={() => toggleSection(section.key)}>
                <span className="bf-section-num">{section.num}</span>
                <span className="bf-section-ttl">{section.title}</span>
                <span className="bf-section-count">{filled.length} camps</span>
                {open ? <ChevronUp size={14} color="#9CA3AF"/> : <ChevronDown size={14} color="#9CA3AF"/>}
              </button>
              {open && (
                <div className="bf-section-body">
                  {filled.map(f => (
                    <div key={f.key} className="bf-field">
                      <div className="bf-field-lbl">{f.label}</div>
                      <div className="bf-field-val">{content[f.key]}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
        <BriefingStyles />
      </div>
    )
  }

  // Edit mode
  return (
    <div className="bf-wrap">
      <div className="bf-topbar">
        <div>
          <div className="bf-title">Editar briefing</div>
          <div className="bf-sub">Emplena els camps rellevants per a la marca</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {saved && <span className="bf-saved-badge"><Check size={12}/> Desat</span>}
          <button className="bf-btn-upload" onClick={() => setMode('upload')}><Upload size={13}/> Pujar doc</button>
          {briefing && <button className="bf-btn-cancel" onClick={() => setMode('view')}>Cancel·lar</button>}
          <button className="bf-btn-save" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={13} className="spin"/> : <Save size={13}/>}
            {saving ? 'Desant...' : 'Desar briefing'}
          </button>
        </div>
      </div>

      {BRIEFING_SECTIONS.map(section => {
        const open = openSections.has(section.key)
        return (
          <div key={section.key} className="bf-section">
            <button className="bf-section-hdr" onClick={() => toggleSection(section.key)}>
              <span className="bf-section-num">{section.num}</span>
              <span className="bf-section-ttl">{section.title}</span>
              {open ? <ChevronUp size={14} color="#9CA3AF"/> : <ChevronDown size={14} color="#9CA3AF"/>}
            </button>
            {open && (
              <div className="bf-section-body bf-section-body--edit">
                {section.fields.map(f => (
                  <div key={f.key} className={`bf-edit-field${f.type === 'textarea' ? ' bf-edit-field--wide' : ''}`}>
                    <label className="bf-edit-lbl">{f.label}</label>
                    {f.type === 'textarea' ? (
                      <textarea
                        className="bf-edit-ta"
                        value={content[f.key] || ''}
                        onChange={e => set(f.key, e.target.value)}
                        placeholder={(f as any).placeholder || ''}
                        rows={3}
                      />
                    ) : (
                      <input
                        className="bf-edit-inp"
                        value={content[f.key] || ''}
                        onChange={e => set(f.key, e.target.value)}
                        placeholder={(f as any).placeholder || ''}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      <div className="bf-save-bottom">
        <button className="bf-btn-save" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={13} className="spin"/> : <Save size={13}/>}
          {saving ? 'Desant...' : 'Desar briefing'}
        </button>
      </div>

      <BriefingStyles />
    </div>
  )
}

function BriefingStyles() {
  return (
    <style jsx global>{`
      .bf-wrap { display: flex; flex-direction: column; gap: 10px; }
      .bf-topbar { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 4px; }
      .bf-title { font-size: 17px; font-weight: 700; color: #111827; }
      .bf-sub { font-size: 12px; color: #9CA3AF; margin-top: 2px; }
      .bf-empty { background: white; border: 1px solid #ECECEC; border-radius: 14px; padding: 60px 24px; display: flex; flex-direction: column; align-items: center; gap: 14px; color: #9A9A9A; text-align: center; }
      .bf-empty p { font-size: 14px; }
      .bf-empty-actions { display: flex; gap: 8px; }
      .bf-saved-badge { display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; color: #16A34A; background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 6px; padding: 4px 10px; }
      .bf-btn-save { display: flex; align-items: center; gap: 6px; height: 36px; padding: 0 16px; background: #1B2B4B; color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; transition: opacity 0.12s; white-space: nowrap; }
      .bf-btn-save:disabled { opacity: 0.6; cursor: default; }
      .bf-btn-save:not(:disabled):hover { opacity: 0.88; }
      .bf-btn-cancel { display: flex; align-items: center; gap: 6px; height: 36px; padding: 0 14px; background: white; color: #374151; border: 1px solid #E5E7EB; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; font-family: inherit; transition: all 0.12s; white-space: nowrap; }
      .bf-btn-cancel:hover { border-color: #374151; }
      .bf-btn-upload { display: flex; align-items: center; gap: 6px; height: 36px; padding: 0 14px; background: white; color: #2563EB; border: 1.5px solid #BFDBFE; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; font-family: inherit; transition: all 0.12s; white-space: nowrap; }
      .bf-btn-upload:hover { background: #EFF6FF; }
      .bf-section { background: white; border: 1px solid #ECECEC; border-radius: 12px; overflow: hidden; }
      .bf-section-hdr { display: flex; align-items: center; gap: 10px; width: 100%; padding: 14px 18px; background: none; border: none; cursor: pointer; text-align: left; transition: background 0.12s; }
      .bf-section-hdr:hover { background: #FAFAFA; }
      .bf-section-num { width: 22px; height: 22px; border-radius: 6px; background: #1B2B4B; color: white; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
      .bf-section-ttl { font-size: 13.5px; font-weight: 700; color: #111827; flex: 1; }
      .bf-section-count { font-size: 11px; color: #9CA3AF; font-weight: 500; }
      .bf-section-body { padding: 4px 18px 16px; display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px 20px; border-top: 1px solid #F5F5F5; }
      .bf-section-body--edit { grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
      .bf-field { display: flex; flex-direction: column; gap: 3px; padding-top: 12px; }
      .bf-field-lbl { font-size: 10.5px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.06em; }
      .bf-field-val { font-size: 13.5px; color: #111827; line-height: 1.5; white-space: pre-wrap; }
      .bf-edit-field { display: flex; flex-direction: column; gap: 5px; padding-top: 12px; }
      .bf-edit-field--wide { grid-column: 1 / -1; }
      .bf-edit-lbl { font-size: 11px; font-weight: 600; color: #6B7280; }
      .bf-edit-inp { height: 36px; padding: 0 10px; border: 1.5px solid #E5E7EB; border-radius: 8px; font-size: 13.5px; color: #111827; font-family: inherit; outline: none; transition: border-color 0.15s; }
      .bf-edit-inp:focus { border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }
      .bf-edit-ta { padding: 8px 10px; border: 1.5px solid #E5E7EB; border-radius: 8px; font-size: 13.5px; color: #111827; font-family: inherit; outline: none; resize: vertical; line-height: 1.5; transition: border-color 0.15s; }
      .bf-edit-ta:focus { border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }
      .bf-save-bottom { display: flex; justify-content: flex-end; padding-top: 8px; }
    `}</style>
  )
}

function StrategyTab({ strategy, clientId }: { strategy: any; clientId: string }) {
  if (!strategy) {
    return (
      <div style={{ background: 'white', border: '1px solid #ECECEC', borderRadius: '12px', padding: '60px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: '#9A9A9A' }}>
        <BarChart2 size={28} color="#D0D0D0" />
        <p>Encara no hi ha estratègia definida.</p>
        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '36px', padding: '0 14px', background: '#1B2B4B', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer' }}>
          <Plus size={13} /> Crear estratègia
        </button>
      </div>
    )
  }

  return <div style={{ color: '#5C5C5C', fontSize: '14px', lineHeight: '1.6' }}>{JSON.stringify(strategy, null, 2)}</div>
}

function EmptyState({ icon, text, action, onAction }: { icon: React.ReactNode; text: string; action?: string; onAction?: () => void }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: '12px', color: '#9A9A9A',
      fontSize: '14px', padding: '60px 24px', background: 'white',
      border: '1px solid #ECECEC', borderRadius: '12px',
    }}>
      <div style={{ color: '#D0D0D0' }}>{icon}</div>
      <p>{text}</p>
      {action && (
        <button onClick={onAction} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '36px', padding: '0 14px', background: '#1B2B4B', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>
          <Plus size={13} /> {action}
        </button>
      )}
    </div>
  )
}
