'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  LayoutDashboard, Users, FolderKanban, CheckSquare,
  Calendar, BarChart2, Shield, LogOut, ChevronLeft, ChevronRight, ClipboardList,
  TrendingUp, BarChart3, Truck, Building2, PieChart, Plus, X, Pencil, Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import type { Profile, Task } from '@/types'
import { useLanguage } from '@/contexts/LanguageContext'
import type { TRANSLATIONS } from '@/lib/i18n'
import { NewTaskModal } from '@/components/tasks/NewTaskModal'

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
  { label: 'Google Drive', href: 'https://drive.google.com', abbr: 'G', color: '#1A73E8', bg: '#E8F0FE' },
  { label: 'Dropbox',      href: 'https://www.dropbox.com',  abbr: 'D', color: '#0061FF', bg: '#E5EDFF' },
  { label: 'Metricool',    href: 'https://metricool.com',    abbr: 'M', color: '#FF6B35', bg: '#FFF0EB', fixed: true },
]

function GoogleDriveIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 53H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
      <path d="M43.65 25L29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3L1.2 48.5A9.06 9.06 0 000 53h27.5z" fill="#00ac47"/>
      <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.85 11.65z" fill="#ea4335"/>
      <path d="M43.65 25L57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
      <path d="M59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
      <path d="M73.4 26.5l-13.1-22.7c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25l16.15 28H87.3c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
    </svg>
  )
}

function DropboxIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill="#1E90FF" d="M12 6L0 14l12 8 12-8zM36 6l-12 8 12 8 12-8zM0 30l12 8 12-8-12-8zM36 22l-12 8 12 8 12-8zM12 38.5L24 46.5l12-8-12-8z"/>
    </svg>
  )
}

function MetricoolIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="20" fill="#FF6B35"/>
      <rect x="12" y="40" width="18" height="48" rx="4" fill="white"/>
      <rect x="41" y="20" width="18" height="68" rx="4" fill="white"/>
      <rect x="70" y="55" width="18" height="33" rx="4" fill="white"/>
    </svg>
  )
}

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

function getAvatarColor(name: string) {
  const colors = ['#6366F1','#8B5CF6','#EC4899','#EF4444','#F97316','#22C55E','#14B8A6','#3B82F6','#0EA5E9']
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

  const inFinances = pathname.startsWith('/finances')
  const activeFinanceSection = searchParams.get('s') || 'resum'
  const c = collapsed

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return t('greetMorning')
    if (h < 20) return t('greetAfternoon')
    return t('greetEvening')
  })()

  const avatarColor = user.full_name ? getAvatarColor(user.full_name) : '#6366F1'
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
            ? <img src={user.avatar_url} alt="" className="sb-avatar-img" />
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
        {!c && <div className="sb-section-lbl">{t('sectionMenu')} · {navDefs.length}</div>}
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

        {/* Finances subnav */}
        {inFinances && (
          <>
            <div className="sb-divider" />
            {!c && (
              <div className="sb-section-lbl sb-section-lbl--fin">
                <TrendingUp size={10} strokeWidth={2.2} />
                Finances · {financeNavDefs.length}
              </div>
            )}
            <nav className="sb-nav">
              {financeNavDefs.map(item => {
                const label = t(item.labelKey)
                const isActive = activeFinanceSection === item.id
                return (
                  <Link
                    key={item.id}
                    href={`/finances?s=${item.id}`}
                    className={cn('sb-item sb-item--sub', isActive && 'sb-item--active', c && 'sb-item--icon')}
                    title={c ? label : undefined}
                  >
                    <item.icon size={c ? 18 : 14} strokeWidth={isActive ? 2.2 : 1.8} />
                    {!c && <span>{label}</span>}
                  </Link>
                )
              })}
            </nav>
          </>
        )}

        <div className="sb-divider" />

        {/* Services */}
        {!c && <div className="sb-section-lbl">{t('sectionServices')} · {serviceLinks.length}</div>}
        {c ? (
          <div className="sb-services-icons">
            {serviceLinks.map(s => {
              const href = (s as any).fixed ? s.href : (s.abbr === 'G' ? driveUrl : dropboxUrl)
              return (
                <a key={s.abbr} href={href} target="_blank" rel="noopener noreferrer"
                  className="sb-service-icon-btn" title={s.label}
                >
                  <div className="sb-service-badge" style={{ background: s.bg }}>
                    {s.abbr === 'G' ? <GoogleDriveIcon size={16} /> : s.abbr === 'M' ? <MetricoolIcon size={16} /> : <DropboxIcon size={16} />}
                  </div>
                </a>
              )
            })}
          </div>
        ) : (
          <div className="sb-services-card">
            {serviceLinks.map(s => {
              const key = s.abbr === 'G' ? 'drive' : 'dropbox'
              const href = (s as any).fixed ? s.href : (s.abbr === 'G' ? driveUrl : dropboxUrl)
              const isEditing = editingService === key && !(s as any).fixed
              const ServiceIcon = s.abbr === 'G' ? GoogleDriveIcon : s.abbr === 'M' ? MetricoolIcon : DropboxIcon
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
                      {!(s as any).fixed && (
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
        <NewTaskModal
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
          font-size: 10px; font-weight: 700; color: #BCBCBC;
          letter-spacing: 0.08em; text-transform: uppercase;
          white-space: nowrap; flex-shrink: 0;
        }
        .sb-section-lbl--fin { color: #2563EB; padding-top: 8px; }

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
          background: #2563EB !important;
          color: #FFFFFF !important;
          font-weight: 600;
        }
        :global(.sb-item--sub) { font-size: 13px; padding: 7px 10px; }
        :global(.sb-item--sub.sb-item--icon) { padding: 9px 10px; }

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
        .sb-service-edit-btn:hover { color: #2563EB; }
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
          background: #2563EB; color: white; cursor: pointer;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .sb-service-save:hover { background: #1D4ED8; }

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
          border-color: #C7D7F5; box-shadow: 0 4px 16px rgba(37,99,235,0.1);
          transform: translateY(-1px);
        }

        .sb-newtask-circle {
          width: 46px; height: 46px; border-radius: 50%;
          background: linear-gradient(135deg, #2563EB, #3B82F6);
          display: flex; align-items: center; justify-content: center;
          color: white; margin-bottom: 10px;
          box-shadow: 0 4px 12px rgba(37,99,235,0.35);
          transition: box-shadow 0.18s;
        }
        .sb-newtask-card:hover .sb-newtask-circle {
          box-shadow: 0 6px 18px rgba(37,99,235,0.45);
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
          background: linear-gradient(135deg, #2563EB, #3B82F6);
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
