'use client'

import { NavigationLink as Link } from '@/components/ui/NavigationLink'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  LayoutDashboard, Users, FolderKanban, CheckSquare,
  Calendar, BarChart2, Shield, LogOut, ChevronLeft, ChevronRight, ClipboardList,
  TrendingUp, BarChart3, Truck, Building2, PieChart, Plus, X, Pencil, Check,
  Target, FileText, LineChart,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import type { Profile, Task } from '@/types'
import { useLanguage } from '@/contexts/LanguageContext'
import type { TRANSLATIONS } from '@/lib/i18n'
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal'

const financeNavDefs = [
  { id: 'resum',       labelKey: 'finResum'      as keyof typeof TRANSLATIONS, icon: BarChart3  },
  { id: 'cartera',     labelKey: 'finCartera'    as keyof typeof TRANSLATIONS, icon: Users      },
  { id: 'proveidors',  labelKey: 'finProveidors' as keyof typeof TRANSLATIONS, icon: Truck      },
  { id: 'estructura',  labelKey: 'finEstructura' as keyof typeof TRANSLATIONS, icon: Building2  },
  { id: 'grafics',     labelKey: 'finGrafics'    as keyof typeof TRANSLATIONS, icon: PieChart   },
]

const navDefs = [
  { href: '/dashboard', icon: LayoutDashboard, labelKey: 'dashboard' as keyof typeof TRANSLATIONS },
  { href: '/clients',   icon: Users,           labelKey: 'clients'   as keyof typeof TRANSLATIONS },
  { href: '/projects',  icon: FolderKanban,    labelKey: 'campaigns' as keyof typeof TRANSLATIONS },
  { href: '/tasks',     icon: CheckSquare,     labelKey: 'tasks'     as keyof typeof TRANSLATIONS },
  { href: '/check',     icon: ClipboardList,   labelKey: 'sessions'  as keyof typeof TRANSLATIONS },
  { href: '/calendar',  icon: Calendar,        labelKey: 'calendar'  as keyof typeof TRANSLATIONS },
  { href: '/metrics',   icon: BarChart2,       labelKey: 'metrics'   as keyof typeof TRANSLATIONS },
]

const serviceLinks = [
  { label: 'Google Drive', href: 'https://drive.google.com', abbr: 'G',  color: '#1A73E8', bg: '#F0F4FF' },
  { label: 'Gmail',        href: '',                         abbr: 'GM', color: '#EA4335', bg: '#FEF2F2', gmail: true },
  { label: 'Dropbox',      href: 'https://www.dropbox.com',  abbr: 'D',  color: '#0061FF', bg: '#EEF3FF' },
  { label: 'Metricool',    href: 'https://metricool.com/es/', abbr: 'M',  color: '#E8521A', bg: '#FFF4EE', fixed: true },
  { label: 'Brevo',        href: 'https://login.brevo.com/?target=https%3A%2F%2Fapp.brevo.com%2F', abbr: 'BR', color: '#0B7285', bg: '#EFF9FC', fixed: true },
]

function GoogleDriveIcon({ size = 18 }: { size?: number }) {
  return (
    <img src="/gdrive-logo.png" width={size} height={size} alt="Google Drive" style={{ objectFit: 'contain', display: 'block' }} />
  )
}

function DropboxIcon({ size = 18 }: { size?: number }) {
  return (
    <img src="/dropbox-logo.png" width={size} height={size} alt="Dropbox" style={{ objectFit: 'contain', display: 'block' }} />
  )
}

function GmailIcon({ size = 18 }: { size?: number }) {
  return (
    <img src="/gmail-logo.webp" width={size} height={size} alt="Gmail" style={{ objectFit: 'contain', display: 'block' }} />
  )
}

function BrevoIcon({ size = 18 }: { size?: number }) {
  return (
    <img src="/brevo-logo.png" width={size} height={size} alt="Brevo" style={{ objectFit: 'contain', display: 'block', borderRadius: 4 }} />
  )
}

function MetricoolIcon({ size = 18 }: { size?: number }) {
  return (
    <img src="/metricool-logo.jpg" width={size} height={size} alt="Metricool" style={{ objectFit: 'contain', display: 'block', borderRadius: 4 }} />
  )
}

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

function getAvatarColor(name: string) {
  const colors = ['#254067','#3a6fa8','#EC4899','#EF4444','#F97316','#22C55E','#14B8A6','#254067','#3a6fa8']
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return colors[Math.abs(h) % colors.length]
}

interface Props { user: Profile }

export function Sidebar({ user }: Props) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { t } = useLanguage()
  const [collapsed, setCollapsed] = useState(false)
  const [hiddenSections, setHiddenSections] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    try { return new Set(JSON.parse(localStorage.getItem('guinew-sidebar-hidden') || '[]')) } catch { return new Set() }
  })
  const toggleSection = (key: string) => {
    setHiddenSections(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      localStorage.setItem('guinew-sidebar-hidden', JSON.stringify([...next]))
      return next
    })
  }
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [modalClients, setModalClients] = useState<{ id: string; name: string }[]>([])
  const [modalProjects, setModalProjects] = useState<{ id: string; name: string }[]>([])
  const [modalProfiles, setModalProfiles] = useState<{ id: string; full_name: string }[]>([])
  const [driveUrl, setDriveUrl] = useState('https://drive.google.com')
  const [dropboxUrl, setDropboxUrl] = useState('https://www.dropbox.com')
  const [editingService, setEditingService] = useState<'drive' | 'dropbox' | null>(null)
  const [editingUrl, setEditingUrl] = useState('')
  const editInputRef = useRef<HTMLInputElement>(null)
  const [showGmailPicker, setShowGmailPicker] = useState(false)
  const [gmailProfiles, setGmailProfiles] = useState<{ id: string; full_name: string; email: string; avatar_url?: string }[]>([])
  const [gmailPickerPos, setGmailPickerPos] = useState<{ top: number; left: number } | null>(null)
  const gmailRef = useRef<HTMLDivElement>(null)
  const gmailBtnRef = useRef<HTMLButtonElement>(null)

  const inFinances = pathname.startsWith('/finances')
  const activeFinanceSection = searchParams.get('s') || 'resum'
  const c = collapsed

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return t('greetMorning')
    if (h < 20) return t('greetAfternoon')
    return t('greetEvening')
  })()

  const avatarColor = user.full_name ? getAvatarColor(user.full_name) : '#254067'
  const initials = user.full_name ? getInitials(user.full_name) : '?'
  const firstName = user.full_name?.split(' ')[0] ?? 'Guinew'

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved === 'true') setCollapsed(true)
    const d = localStorage.getItem(`guinew-service-drive-${user.id}`)
    const db = localStorage.getItem(`guinew-service-dropbox-${user.id}`)
    if (d) setDriveUrl(d)
    if (db) setDropboxUrl(db)
  }, [user.id])

  const openGmailPicker = async () => {
    if (gmailProfiles.length === 0) {
      const supabase = createClient()
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .eq('is_active', true)
        .neq('id', user.id)
        .order('full_name')
      setGmailProfiles(data ?? [])
    }
    if (!showGmailPicker && gmailBtnRef.current) {
      const rect = gmailBtnRef.current.getBoundingClientRect()
      setGmailPickerPos({ top: rect.top, left: rect.right + 8 })
    }
    setShowGmailPicker(v => !v)
  }

  useEffect(() => {
    if (!showGmailPicker) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      const inBtn = gmailBtnRef.current?.contains(target)
      const inPopup = gmailRef.current?.contains(target)
      if (!inBtn && !inPopup) setShowGmailPicker(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showGmailPicker])

  const toggle = () => {
    setCollapsed(v => {
      localStorage.setItem('sidebar-collapsed', String(!v))
      return !v
    })
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const openServiceEdit = (key: 'drive' | 'dropbox') => {
    setEditingService(key)
    setEditingUrl(key === 'drive' ? driveUrl : dropboxUrl)
    setTimeout(() => editInputRef.current?.focus(), 50)
  }

  const saveServiceUrl = () => {
    if (!editingService) return
    const url = editingUrl.trim() || (editingService === 'drive' ? 'https://drive.google.com' : 'https://www.dropbox.com')
    if (editingService === 'drive') {
      setDriveUrl(url)
      localStorage.setItem(`guinew-service-drive-${user.id}`, url)
    } else {
      setDropboxUrl(url)
      localStorage.setItem(`guinew-service-dropbox-${user.id}`, url)
    }
    setEditingService(null)
    setEditingUrl('')
  }

  const openTaskModal = async () => {
    setShowTaskModal(true)
    const supabase = createClient()
    const [{ data: cls }, { data: pjs }, { data: pfs }] = await Promise.all([
      supabase.from('clients').select('id, name').order('name'),
      supabase.from('projects').select('id, name').order('name'),
      supabase.from('profiles').select('id, full_name').eq('is_active', true).order('full_name'),
    ])
    setModalClients(cls ?? [])
    setModalProjects(pjs ?? [])
    setModalProfiles(pfs ?? [])
  }

  return (
    <aside className={cn('sb', c && 'sb--collapsed')}>
      {/* Header: avatar + user */}
      <div className="sb-header">
        <button className="sb-avatar-btn" onClick={toggle} title={c ? 'Expandir menú' : 'Col·lapsar menú'} style={{ background: avatarColor }}>
          {user.avatar_url
            ? <img src={user.avatar_url} alt="" className="sb-avatar-img" width={38} height={38} />
            : initials}
        </button>
        {!c && (
          <div className="sb-user">
            <div className="sb-greeting">{greeting}</div>
            <div className="sb-name">{firstName}</div>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="sb-body">
        {/* Main nav */}
        {!c && (
          <button className="sb-section-lbl sb-section-toggle" onClick={() => toggleSection('menu')}>
            {t('sectionMenu')} · {navDefs.length}
            <span className="sb-toggle-arrow">{hiddenSections.has('menu') ? '›' : '‹'}</span>
          </button>
        )}
        {!hiddenSections.has('menu') && (
          <nav className="sb-nav">
            {navDefs.map(item => {
              const label = t(item.labelKey)
              const active = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn('sb-item', active && 'sb-item--active', c && 'sb-item--icon')}
                  title={c ? label : undefined}
                >
                  <item.icon size={c ? 20 : 17} strokeWidth={active ? 2.2 : 1.8} />
                  {!c && <span>{label}</span>}
                </Link>
              )
            })}
          </nav>
        )}


        {/* Sales section: CRM + Plantilles */}
        {user.role === 'superadmin' && (
          <>
            <div className="sb-divider" />
            {!c && (
              <button className="sb-section-lbl sb-section-toggle" onClick={() => toggleSection('vendes')}>
                Vendes · 3
                <span className="sb-toggle-arrow">{hiddenSections.has('vendes') ? '›' : '‹'}</span>
              </button>
            )}
            {!hiddenSections.has('vendes') && (
              <nav className="sb-nav">
                {[
                  { href: '/crm',        icon: Target,     label: 'CRM Guinew' },
                  { href: '/analisi',    icon: LineChart,  label: 'Anàlisi'    },
                  { href: '/plantilles', icon: FileText,   label: 'Plantilles' },
                ].map(item => {
                  const active = pathname.startsWith(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn('sb-item', active && 'sb-item--active', c && 'sb-item--icon')}
                      title={c ? item.label : undefined}
                    >
                      <item.icon size={c ? 20 : 17} strokeWidth={active ? 2.2 : 1.8} />
                      {!c && <span>{item.label}</span>}
                    </Link>
                  )
                })}
              </nav>
            )}
          </>
        )}

        {/* Sports Content Playbook section */}
        {user.role === 'superadmin' && (
          <>
            <div className="sb-divider" />
            {!c && (
              <button className="sb-section-lbl sb-section-toggle" onClick={() => toggleSection('scp')}>
                Sports Content Playbook · 1
                <span className="sb-toggle-arrow">{hiddenSections.has('scp') ? '›' : '‹'}</span>
              </button>
            )}
            {!hiddenSections.has('scp') && (
              <nav className="sb-nav">
                {[
                  { href: '/sports-crm', icon: TrendingUp, label: 'CRM SCP' },
                ].map(item => {
                  const active = pathname.startsWith(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn('sb-item', active && 'sb-item--active', c && 'sb-item--icon')}
                      title={c ? item.label : undefined}
                    >
                      <item.icon size={c ? 20 : 17} strokeWidth={active ? 2.2 : 1.8} />
                      {!c && <span>{item.label}</span>}
                    </Link>
                  )
                })}
              </nav>
            )}
          </>
        )}

        {/* Finances section — permanent for superadmins */}
        {user.role === 'superadmin' && (
          <>
            <div className="sb-divider" />
            {!c && (
              <button className="sb-section-lbl sb-section-lbl--fin sb-section-toggle" onClick={() => toggleSection('finances')}>
                <TrendingUp size={10} strokeWidth={2.2} />
                Finances · {financeNavDefs.length}
                <span className="sb-toggle-arrow">{hiddenSections.has('finances') ? '›' : '‹'}</span>
              </button>
            )}
            {!hiddenSections.has('finances') && (
              <nav className="sb-nav">
                {financeNavDefs.map(item => {
                  const label = t(item.labelKey)
                  const isActive = inFinances && activeFinanceSection === item.id
                  return (
                    <a
                      key={item.id}
                      href={`/finances?s=${item.id}`}
                      className={cn('sb-item', isActive && 'sb-item--active', c && 'sb-item--icon')}
                      title={c ? label : undefined}
                    >
                      <item.icon size={c ? 20 : 17} strokeWidth={isActive ? 2.2 : 1.8} />
                      {!c && <span>{label}</span>}
                    </a>
                  )
                })}
              </nav>
            )}
          </>
        )}

        <div className="sb-divider" />

        {/* Services */}
        {!c && <div className="sb-section-lbl">{t('sectionServices')} · {serviceLinks.length}</div>}
        {c ? (
          <div className="sb-services-icons">
            {serviceLinks.map(s => {
              const sa = s as any
              const href = sa.fixed ? s.href : (s.abbr === 'G' ? driveUrl : s.abbr === 'D' ? dropboxUrl : s.href)
              const ServiceIcon = s.abbr === 'G' ? GoogleDriveIcon : s.abbr === 'GM' ? GmailIcon : s.abbr === 'M' ? MetricoolIcon : s.abbr === 'BR' ? BrevoIcon : DropboxIcon
              if (sa.gmail) {
                return (
                  <a key={s.abbr} href="https://mail.google.com" target="_blank" rel="noopener noreferrer"
                    className="sb-service-icon-btn" title={s.label}
                  >
                    <div className="sb-service-badge" style={{ background: s.bg }}>
                      <GmailIcon size={16} />
                    </div>
                  </a>
                )
              }
              return (
                <a key={s.abbr} href={href} target="_blank" rel="noopener noreferrer"
                  className="sb-service-icon-btn" title={s.label}
                >
                  <div className="sb-service-badge" style={{ background: s.bg }}>
                    <ServiceIcon size={16} />
                  </div>
                </a>
              )
            })}
          </div>
        ) : (
          <div className="sb-services-card" ref={gmailRef}>
            {serviceLinks.map(s => {
              const sa = s as any
              const key = s.abbr === 'G' ? 'drive' : 'dropbox'
              const href = sa.fixed ? s.href : (s.abbr === 'G' ? driveUrl : s.abbr === 'D' ? dropboxUrl : s.href)
              const isEditing = editingService === key && !sa.fixed && !sa.gmail
              const ServiceIcon = s.abbr === 'G' ? GoogleDriveIcon : s.abbr === 'GM' ? GmailIcon : s.abbr === 'M' ? MetricoolIcon : s.abbr === 'BR' ? BrevoIcon : DropboxIcon

              if (sa.gmail) {
                return (
                  <div key={s.abbr} className="sb-service-wrap">
                    <div className="sb-service-row-wrap">
                      <button ref={gmailBtnRef} className="sb-service-row sb-service-gmail-btn" onClick={openGmailPicker}>
                        <div className="sb-service-badge" style={{ background: s.bg }}>
                          <GmailIcon size={16} />
                        </div>
                        <span className="sb-service-label">{s.label}</span>
                      </button>
                    </div>
                    {showGmailPicker && gmailPickerPos && (
                      <div
                        ref={gmailRef}
                        className="sb-gmail-picker-floating"
                        style={{ top: gmailPickerPos.top, left: gmailPickerPos.left }}
                      >
                        <div className="sb-gmail-picker-title">Envia un mail a:</div>
                        {gmailProfiles.length === 0 && <div className="sb-gmail-picker-empty">Carregant...</div>}
                        {gmailProfiles.map(p => (
                          <a
                            key={p.id}
                            href={`https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(p.email)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="sb-gmail-picker-row"
                            onClick={() => setShowGmailPicker(false)}
                          >
                            <div className="sb-gmail-avatar" style={{ background: getAvatarColor(p.full_name) }}>
                              {p.avatar_url
                                ? <img src={p.avatar_url} alt="" className="sb-gmail-avatar-img" />
                                : getInitials(p.full_name)}
                            </div>
                            <div className="sb-gmail-info">
                              <div className="sb-gmail-name">{p.full_name}</div>
                              <div className="sb-gmail-email">{p.email}</div>
                            </div>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )
              }

              return (
                <div key={s.abbr} className="sb-service-wrap">
                  {isEditing ? (
                    <div className="sb-service-edit">
                      <div className="sb-service-badge" style={{ background: s.bg }}>
                        <ServiceIcon size={14} />
                      </div>
                      <input
                        ref={editInputRef}
                        className="sb-service-input"
                        value={editingUrl}
                        onChange={e => setEditingUrl(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') saveServiceUrl(); if (e.key === 'Escape') setEditingService(null) }}
                        placeholder="Enganxa la URL..."
                      />
                      <button className="sb-service-save" onClick={saveServiceUrl} title="Desar">
                        <Check size={12} strokeWidth={2.5} />
                      </button>
                    </div>
                  ) : (
                    <div className="sb-service-row-wrap">
                      <a href={href} target="_blank" rel="noopener noreferrer" className="sb-service-row">
                        <div className="sb-service-badge" style={{ background: s.bg }}>
                          <ServiceIcon size={16} />
                        </div>
                        <span className="sb-service-label">{s.label}</span>
                      </a>
                      {!sa.fixed && !sa.gmail && (
                        <button className="sb-service-edit-btn" onClick={() => openServiceEdit(key)} title={`Configura ${s.label}`}>
                          <Pencil size={11} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Admin */}
        {(user.role === 'superadmin' || user.role === 'manager') && (
          <>
            <div className="sb-divider" />
            <nav className="sb-nav">
              {user.role === 'superadmin' && (
                <Link
                  href="/admin"
                  className={cn('sb-item', pathname.startsWith('/admin') && 'sb-item--active', c && 'sb-item--icon')}
                  title={c ? 'Admin' : undefined}
                >
                  <Shield size={c ? 20 : 16} strokeWidth={1.8} />
                  {!c && <span>Admin</span>}
                </Link>
              )}
            </nav>
          </>
        )}
      </div>

      {/* New task card */}
      <div className={cn('sb-newtask-wrap', c && 'sb-newtask-wrap--icon')}>
        {c ? (
          <button className="sb-newtask-icon-btn" onClick={openTaskModal} title="Nova tasca">
            <Plus size={18} strokeWidth={2.5} />
          </button>
        ) : (
          <button className="sb-newtask-card" onClick={openTaskModal}>
            <div className="sb-newtask-circle">
              <Plus size={22} strokeWidth={2.5} />
            </div>
            <div className="sb-newtask-label">Nova tasca</div>
            <div className="sb-newtask-sub">Crea una tasca ràpidament</div>
          </button>
        )}
      </div>

      {/* Task modal */}
      {showTaskModal && (
        <CreateTaskModal
          clients={modalClients}
          projects={modalProjects}
          profiles={modalProfiles}
          currentUserId={user.id}
          onClose={() => setShowTaskModal(false)}
          onCreated={(_task: Task) => setShowTaskModal(false)}
        />
      )}

      {/* Footer: logout */}
      <div className={cn('sb-footer', c && 'sb-footer--icon')}>
        {confirmLogout ? (
          <div className={cn('sb-logout-confirm', c && 'sb-logout-confirm--icon')}>
            {!c && <span className="sb-logout-q">Tancar sessió?</span>}
            <button className="sb-logout-yes" onClick={handleLogout}>
              <LogOut size={13}/>{!c && <span>Sí</span>}
            </button>
            <button className="sb-logout-no" onClick={() => setConfirmLogout(false)}>
              {c ? '✕' : 'No'}
            </button>
          </div>
        ) : (
          <button
            className={cn('sb-logout-btn', c && 'sb-logout-btn--icon')}
            onClick={() => setConfirmLogout(true)}
            title="Tancar sessió"
          >
            <LogOut size={c ? 18 : 15} strokeWidth={1.8}/>
            {!c && <span>Tancar sessió</span>}
          </button>
        )}
      </div>

      <style jsx>{`
        .sb {
          width: 224px;
          min-width: 224px;
          height: 100vh;
          position: sticky;
          top: 0;
          background: #FFFFFF;
          border-right: 1px solid #EBEBEB;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transition: width 0.22s ease, min-width 0.22s ease;
        }
        .sb--collapsed { width: 68px; min-width: 68px; }

        /* ── Header ── */
        .sb-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 12px 12px;
          border-bottom: 1px solid #F0F0F0;
          flex-shrink: 0;
          min-height: 68px;
          overflow: hidden;
        }
        .sb-avatar-btn {
          width: 38px; height: 38px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700; color: white;
          flex-shrink: 0; letter-spacing: -0.02em; overflow: hidden;
          border: none; cursor: pointer; padding: 0;
          transition: opacity 0.15s, box-shadow 0.15s;
        }
        .sb-avatar-btn:hover { opacity: 0.85; box-shadow: 0 0 0 3px rgba(0,0,0,0.08); }
        .sb-avatar-img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
        .sb-user { flex: 1; min-width: 0; overflow: hidden; }
        .sb-greeting { font-size: 10.5px; color: #9CA3AF; font-weight: 500; white-space: nowrap; }
        .sb-name { font-size: 14.5px; font-weight: 700; color: #111827; white-space: nowrap; letter-spacing: -0.02em; }

        /* ── Body ── */
        .sb-body {
          flex: 1; overflow-y: auto; overflow-x: hidden;
          display: flex; flex-direction: column;
          padding: 10px 0 4px; scrollbar-width: none;
        }
        .sb-body::-webkit-scrollbar { display: none; }

        /* Section labels */
        .sb-section-lbl {
          display: flex; align-items: center; gap: 5px;
          padding: 6px 14px 3px;
          font-size: 10px; font-weight: 700; color: #254067;
          letter-spacing: 0.08em; text-transform: uppercase;
          white-space: nowrap; flex-shrink: 0;
        }
        .sb-section-toggle {
          width: 100%; background: none; border: none; cursor: pointer;
          text-align: left; font-family: inherit;
          border-radius: 6px; transition: background 0.15s;
        }
        .sb-section-toggle:hover { background: rgba(0,0,0,0.04); }
        .sb-toggle-arrow {
          margin-left: auto; font-size: 13px; font-weight: 400;
          letter-spacing: 0; text-transform: none; color: #254067; line-height: 1;
        }
        .sb-section-lbl--fin { color: #254067; padding-top: 8px; }
        .sb-section-lbl--fin .sb-toggle-arrow { color: #254067; }

        /* Nav */
        .sb-nav { display: flex; flex-direction: column; padding: 0 8px; gap: 1px; flex-shrink: 0; }

        :global(.sb-item) {
          display: flex; align-items: center; gap: 9px;
          padding: 8px 10px; border-radius: 9px;
          font-size: 13.5px; font-weight: 500; color: #6B7280;
          text-decoration: none; transition: background 0.1s, color 0.1s;
          white-space: nowrap; cursor: pointer;
        }
        :global(.sb-item--icon) { justify-content: center; padding: 10px; }
        :global(.sb-item:hover):not(:global(.sb-item--active)) { background: #F5F5F5; color: #111827; }
        :global(.sb-item--active) {
          background: #254067 !important;
          color: #FFFFFF !important;
          font-weight: 600;
        }
        :global(.sb-item--sub) { font-size: 13px; padding: 7px 10px; }
        :global(.sb-item--sub.sb-item--icon) { padding: 9px 10px; }
        :global(.sb-item--scp:hover):not(:global(.sb-item--active-scp)) { background: #F5F3FF; color: #6D28D9; }
        :global(.sb-item--active-scp) {
          background: #7C3AED !important;
          color: #FFFFFF !important;
          font-weight: 600;
        }

        /* Divider */
        .sb-divider { margin: 8px 12px; border-top: 1px solid #F0F0F0; flex-shrink: 0; }

        /* ── Services ── */
        .sb-services-card {
          margin: 2px 8px; background: #F9FAFB;
          border: 1px solid #EFEFEF; border-radius: 10px;
          padding: 4px; flex-shrink: 0;
        }
        .sb-service-row {
          display: flex; align-items: center; gap: 10px;
          padding: 7px 8px; border-radius: 8px;
          text-decoration: none; transition: background 0.12s; cursor: pointer;
        }
        .sb-service-row:hover { background: #EFEFEF; }
        .sb-services-icons {
          display: flex; flex-direction: column; align-items: center;
          gap: 2px; padding: 0 8px; flex-shrink: 0;
        }
        .sb-service-icon-btn {
          display: flex; align-items: center; justify-content: center;
          width: 100%; padding: 8px 0; border-radius: 9px;
          text-decoration: none; transition: background 0.12s;
        }
        .sb-service-icon-btn:hover { background: #F4F4F4; }
        .sb-service-badge {
          width: 28px; height: 28px; border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .sb-service-label { font-size: 13px; font-weight: 500; color: #374151; white-space: nowrap; flex: 1; min-width: 0; }
        .sb-service-wrap { display: flex; flex-direction: column; }
        .sb-service-row-wrap {
          display: flex; align-items: center; border-radius: 8px;
          transition: background 0.12s;
        }
        .sb-service-row-wrap:hover { background: #EFEFEF; }
        .sb-service-row-wrap:hover .sb-service-edit-btn { opacity: 1; }
        .sb-service-row-wrap .sb-service-row { flex: 1; }
        .sb-service-row-wrap .sb-service-row:hover { background: transparent; }
        .sb-service-edit-btn {
          opacity: 0; width: 26px; height: 26px; border: none; background: transparent;
          cursor: pointer; color: #9CA3AF; display: flex; align-items: center;
          justify-content: center; border-radius: 6px; flex-shrink: 0;
          transition: opacity 0.15s, color 0.12s; margin-right: 4px;
        }
        .sb-service-edit-btn:hover { color: #254067; }
        .sb-service-edit {
          display: flex; align-items: center; gap: 5px;
          background: #F0F6FF; border: 1.5px solid #BFDBFE; border-radius: 9px;
          padding: 4px 6px; margin: 2px 0;
        }
        .sb-service-input {
          flex: 1; border: none; background: transparent; outline: none;
          font-size: 11px; color: #111827; font-family: inherit; min-width: 0;
          padding: 2px 0;
        }
        .sb-service-input::placeholder { color: #94A3B8; }
        .sb-service-save {
          width: 22px; height: 22px; border-radius: 6px; border: none;
          background: #254067; color: white; cursor: pointer;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .sb-service-save:hover { background: #1a2e4a; }

        /* Gmail picker */
        :global(.sb-service-gmail-btn) {
          background: none; border: none; cursor: pointer; font-family: inherit;
          width: 100%; text-align: left;
        }
        :global(.sb-gmail-picker-floating) {
          position: fixed;
          z-index: 500;
          background: white; border: 1px solid #E5E7EB; border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06);
          overflow: hidden;
          min-width: 240px;
          max-height: 70vh;
          overflow-y: auto;
        }
        .sb-gmail-picker-title {
          padding: 8px 10px 4px; font-size: 10px; font-weight: 700;
          color: #9CA3AF; letter-spacing: 0.06em; text-transform: uppercase;
        }
        .sb-gmail-picker-empty { padding: 8px 10px; font-size: 12px; color: #9CA3AF; }
        .sb-gmail-picker-row {
          display: flex; align-items: center; gap: 9px;
          padding: 7px 10px; text-decoration: none;
          transition: background 0.1s;
        }
        .sb-gmail-picker-row:hover { background: #F5F7FF; }
        .sb-gmail-avatar {
          width: 28px; height: 28px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; color: white;
          flex-shrink: 0; overflow: hidden;
        }
        .sb-gmail-avatar-img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
        .sb-gmail-info { min-width: 0; flex: 1; }
        .sb-gmail-name { font-size: 12.5px; font-weight: 600; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sb-gmail-email { font-size: 10.5px; color: #9CA3AF; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* ── New task card ── */
        .sb-newtask-wrap { padding: 6px 10px 4px; flex-shrink: 0; }
        .sb-newtask-wrap--icon { padding: 4px 8px; }

        .sb-newtask-card {
          display: flex; flex-direction: column; align-items: center;
          width: 100%; padding: 16px 12px 14px;
          background: white; border: 1px solid #EBEBEB;
          border-radius: 16px; cursor: pointer;
          font-family: inherit; text-align: center;
          transition: box-shadow 0.18s, border-color 0.18s, transform 0.15s;
        }
        .sb-newtask-card:hover {
          border-color: #C7D7F5; box-shadow: 0 4px 16px rgba(37,64,103,0.1);
          transform: translateY(-1px);
        }

        .sb-newtask-circle {
          width: 46px; height: 46px; border-radius: 50%;
          background: #254067;
          display: flex; align-items: center; justify-content: center;
          color: white; margin-bottom: 10px;
          box-shadow: 0 4px 12px rgba(37,64,103,0.35);
          transition: box-shadow 0.18s;
        }
        .sb-newtask-card:hover .sb-newtask-circle {
          box-shadow: 0 6px 18px rgba(37,64,103,0.45);
        }

        .sb-newtask-label {
          font-size: 13px; font-weight: 700; color: #111827;
          margin-bottom: 3px; letter-spacing: -0.01em;
        }
        .sb-newtask-sub {
          font-size: 11px; color: #9CA3AF; font-weight: 400;
        }

        .sb-newtask-icon-btn {
          display: flex; align-items: center; justify-content: center;
          width: 100%; padding: 10px; border-radius: 10px;
          background: #254067;
          border: none; color: white; cursor: pointer;
          transition: opacity 0.15s;
        }
        .sb-newtask-icon-btn:hover { opacity: 0.85; }


        /* ── Footer ── */
        .sb-footer { border-top: 1px solid #F0F0F0; padding: 8px; flex-shrink: 0; }
        .sb-footer--icon { padding: 8px; }
        .sb-logout-btn {
          display: flex; align-items: center; gap: 8px; width: 100%;
          padding: 8px 10px; border-radius: 8px; border: none; background: none;
          cursor: pointer; font-size: 13px; font-weight: 500; color: #9CA3AF;
          font-family: inherit; transition: background 0.1s, color 0.1s; white-space: nowrap;
        }
        .sb-logout-btn:hover { background: #FEF2F2; color: #DC2626; }
        .sb-logout-btn--icon { justify-content: center; padding: 10px; }
        .sb-logout-confirm {
          display: flex; align-items: center; gap: 6px; padding: 6px 8px;
          border-radius: 8px; background: #FEF2F2; border: 1px solid #FECACA;
        }
        .sb-logout-confirm--icon { justify-content: center; }
        .sb-logout-q { flex: 1; font-size: 12px; font-weight: 600; color: #DC2626; white-space: nowrap; }
        .sb-logout-yes {
          display: flex; align-items: center; gap: 4px;
          height: 26px; padding: 0 8px; background: #DC2626; color: white;
          border: none; border-radius: 6px; cursor: pointer;
          font-size: 12px; font-weight: 600; font-family: inherit; white-space: nowrap;
        }
        .sb-logout-yes:hover { background: #B91C1C; }
        .sb-logout-no {
          height: 26px; padding: 0 8px; border: 1px solid #FECACA;
          border-radius: 6px; background: white; color: #9CA3AF;
          cursor: pointer; font-size: 12px; font-weight: 500; font-family: inherit;
        }
        .sb-logout-no:hover { border-color: #D0D0D0; color: #5C5C5C; }
      `}</style>
    </aside>
  )
}
