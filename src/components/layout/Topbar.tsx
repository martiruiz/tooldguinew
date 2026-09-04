'use client'

import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { Bell, Check, CheckCheck, X } from 'lucide-react'
import { getInitials } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Notification } from '@/types'

interface Props {
  user: Profile
  title?: string
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ara mateix'
  if (mins < 60) return `fa ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `fa ${hours}h`
  const days = Math.floor(hours / 24)
  return `fa ${days}d`
}

export function Topbar({ user, title }: Props) {
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  const unread = notifs.filter(n => !n.read).length

  useEffect(() => {
    const supabase = createClient()

    const fetchNotifs = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30)
      if (data) setNotifs(data as Notification[])
    }

    fetchNotifs()

    // Real-time subscription
    const channel = supabase
      .channel('notifs')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, () => fetchNotifs())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user.id])

  // Close notifs panel on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Close profile dropdown on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    if (profileOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [profileOpen])

  const markAllRead = async () => {
    const supabase = createClient()
    const unreadIds = notifs.filter(n => !n.read).map(n => n.id)
    if (!unreadIds.length) return
    await supabase.from('notifications').update({ read: true }).in('id', unreadIds)
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
  }

  const markOneRead = async (id: string) => {
    const supabase = createClient()
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const typeIcon: Record<string, string> = {
    task_assigned: '📋',
    task_updated: '✏️',
    task_completed: '✅',
    comment: '💬',
    mention: '🔔',
    deadline: '⏰',
    client: '👤',
    project: '📁',
    system: '⚙️',
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        {title && <h1 className="topbar-title">{title}</h1>}
      </div>

      <div className="topbar-right">
        {/* Notification bell */}
        <div className="notif-wrap" ref={panelRef}>
          <button
            className="topbar-icon-btn"
            aria-label="Notificacions"
            onClick={() => setOpen(v => !v)}
          >
            <Bell size={16} strokeWidth={1.8} />
            {unread > 0 && <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>}
          </button>

          {open && (
            <div className="notif-panel">
              <div className="notif-panel-head">
                <span className="notif-panel-title">Notificacions</span>
                <div className="notif-panel-actions">
                  {unread > 0 && (
                    <button className="notif-mark-all" onClick={markAllRead} title="Marcar totes com a llegides">
                      <CheckCheck size={13} />
                      Llegir totes
                    </button>
                  )}
                  <button className="notif-close" onClick={() => setOpen(false)}>
                    <X size={14} />
                  </button>
                </div>
              </div>

              <div className="notif-list">
                {notifs.length === 0 ? (
                  <div className="notif-empty">
                    <Bell size={28} strokeWidth={1.2} />
                    <p>No tens notificacions</p>
                  </div>
                ) : (
                  notifs.map(n => (
                    <div
                      key={n.id}
                      className={`notif-item${n.read ? '' : ' notif-item--unread'}`}
                      onClick={() => markOneRead(n.id)}
                    >
                      <div className="notif-icon">{typeIcon[n.type] || '🔔'}</div>
                      <div className="notif-content">
                        <div className="notif-title">{n.title}</div>
                        {n.body && <div className="notif-body">{n.body}</div>}
                        <div className="notif-time">{timeAgo(n.created_at)}</div>
                      </div>
                      {!n.read && (
                        <button className="notif-read-btn" onClick={e => { e.stopPropagation(); markOneRead(n.id) }} title="Marcar com a llegida">
                          <Check size={11} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="topbar-profile-wrap" ref={profileRef}>
          <button className="topbar-profile-btn" onClick={() => setProfileOpen(v => !v)}>
            <div className="topbar-avatar">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.full_name} />
              ) : (
                <span>{getInitials(user.full_name)}</span>
              )}
            </div>
            <div className="topbar-user-info">
              <span className="topbar-user-name">{user.full_name}</span>
              <span className="topbar-user-role">{user.position || user.role}</span>
            </div>
          </button>
          {profileOpen && (
            <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: 'white', border: '1px solid #ECECEC', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.10)', minWidth: 160, zIndex: 200, padding: 4 }}>
              <Link href="/profile" onClick={() => setProfileOpen(false)}
                style={{ display: 'block', padding: '9px 14px', fontSize: 13.5, color: '#0a0a0a', textDecoration: 'none', borderRadius: 7, transition: 'background 0.12s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F5F5F5')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                Perfil
              </Link>
              {user.role === 'superadmin' && (
                <>
                  <div style={{ height: 1, background: '#F0F0F0', margin: '4px 0' }} />
                  <Link href="/crm" onClick={() => setProfileOpen(false)}
                    style={{ display: 'block', padding: '9px 14px', fontSize: 13.5, fontWeight: 600, color: '#1B2B4B', textDecoration: 'none', borderRadius: 7 }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#EEF2FF')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    CRM
                  </Link>
                  <Link href="/contracts" onClick={() => setProfileOpen(false)}
                    style={{ display: 'block', padding: '9px 14px', fontSize: 13.5, fontWeight: 600, color: '#1B2B4B', textDecoration: 'none', borderRadius: 7 }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#EEF2FF')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    Contractes
                  </Link>
                  <Link href="/finances" onClick={() => setProfileOpen(false)}
                    style={{ display: 'block', padding: '9px 14px', fontSize: 13.5, fontWeight: 600, color: '#1B2B4B', textDecoration: 'none', borderRadius: 7 }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#EEF2FF')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    Finances
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .topbar {
          height: 56px;
          border-bottom: 1px solid #ECECEC;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          gap: 16px;
          flex-shrink: 0;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .topbar-left { display: flex; align-items: center; gap: 12px; min-width: 0; }

        .topbar-title {
          font-size: 15px; font-weight: 700; color: #0a0a0a;
          letter-spacing: 0.01em; white-space: nowrap;
          font-family: 'Bai Jamjuree', sans-serif;
        }

        .topbar-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

        .topbar-search {
          display: none; align-items: center; gap: 8px; height: 34px; padding: 0 12px;
          border: 1px solid #E8E8E8; border-radius: 8px; background: #F8F8F8; color: #9A9A9A;
          font-size: 13px; cursor: pointer; transition: border-color 0.15s, background 0.15s;
          min-width: 180px;
        }
        @media (min-width: 768px) { .topbar-search { display: flex; } }
        .topbar-search:hover { border-color: #D0D0D0; background: #F0F0F0; }
        .topbar-search span { flex: 1; text-align: left; }
        .topbar-search kbd { font-size: 11px; color: #C0C0C0; font-family: inherit; background: none; border: none; }

        .topbar-icon-btn {
          width: 34px; height: 34px; border: 1px solid #E8E8E8; border-radius: 8px;
          background: #F8F8F8; display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #5C5C5C; transition: border-color 0.15s, background 0.15s, color 0.15s;
          position: relative;
        }
        .topbar-icon-btn:hover { border-color: #D0D0D0; background: #F0F0F0; color: #0a0a0a; }

        /* Notif badge */
        .notif-badge {
          position: absolute; top: -5px; right: -5px;
          background: #DC2626; color: white;
          font-size: 9px; font-weight: 700;
          min-width: 16px; height: 16px; padding: 0 3px;
          border-radius: 8px; display: flex; align-items: center; justify-content: center;
          border: 1.5px solid white; line-height: 1;
        }

        /* Notif panel */
        .notif-wrap { position: relative; }

        .notif-panel {
          position: absolute; top: calc(100% + 8px); right: 0;
          width: 340px; background: white;
          border: 1px solid #ECECEC; border-radius: 14px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06);
          overflow: hidden; z-index: 200;
        }

        .notif-panel-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 16px 10px; border-bottom: 1px solid #F0F0F0;
        }

        .notif-panel-title { font-size: 14px; font-weight: 700; color: #0a0a0a; font-family: 'Bai Jamjuree', sans-serif; }

        .notif-panel-actions { display: flex; align-items: center; gap: 6px; }

        .notif-mark-all {
          display: flex; align-items: center; gap: 4px;
          font-size: 11px; color: #1B2B4B; background: none; border: none;
          cursor: pointer; padding: 3px 6px; border-radius: 5px; font-family: inherit;
          transition: background 0.1s;
        }
        .notif-mark-all:hover { background: #F0F5FF; }

        .notif-close {
          width: 24px; height: 24px; border: none; background: none;
          color: #9A9A9A; cursor: pointer; display: flex; align-items: center; justify-content: center;
          border-radius: 6px; transition: background 0.1s, color 0.1s;
        }
        .notif-close:hover { background: #F4F4F4; color: #0a0a0a; }

        .notif-list { max-height: 400px; overflow-y: auto; }

        .notif-empty {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 10px; padding: 40px 20px; color: #C0C0C0;
        }
        .notif-empty p { font-size: 13px; }

        .notif-item {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 12px 16px; border-bottom: 1px solid #F8F8F8;
          cursor: pointer; transition: background 0.1s; position: relative;
        }
        .notif-item:last-child { border-bottom: none; }
        .notif-item:hover { background: #FAFAFA; }
        .notif-item--unread { background: #F8FAFF; }
        .notif-item--unread:hover { background: #F0F5FF; }

        .notif-icon { font-size: 18px; flex-shrink: 0; margin-top: 1px; }

        .notif-content { flex: 1; min-width: 0; }
        .notif-title { font-size: 13px; font-weight: 600; color: #0a0a0a; line-height: 1.3; }
        .notif-body { font-size: 12px; color: #5C5C5C; margin-top: 2px; line-height: 1.4; }
        .notif-time { font-size: 11px; color: #9A9A9A; margin-top: 4px; }

        .notif-read-btn {
          width: 20px; height: 20px; border: 1px solid #E8E8E8; border-radius: 50%;
          background: white; color: #9A9A9A; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; margin-top: 2px; transition: all 0.1s;
        }
        .notif-read-btn:hover { background: #1B2B4B; border-color: #1B2B4B; color: white; }

        /* Avatar standalone (between bell and name) */
        .topbar-avatar {
          width: 34px; height: 34px; border-radius: 50%;
          background: #1B2B4B1A; color: #1B2B4B;
          font-size: 11px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; overflow: hidden;
          border: 2px solid #1B2B4B20;
        }
        .topbar-avatar img { width: 100%; height: 100%; object-fit: cover; }

        /* Profile link (name + role + chevron) */
        .topbar-profile {
          display: flex; align-items: center; gap: 6px;
          padding: 4px 8px 4px 6px;
          border: 1px solid #E8E8E8; border-radius: 20px;
          background: #F8F8F8; text-decoration: none;
          transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
          cursor: pointer;
        }
        .topbar-profile:hover {
          border-color: #1B2B4B40;
          background: white;
          box-shadow: 0 0 0 3px #1B2B4B10;
        }

        .topbar-user-info { display: flex; flex-direction: column; line-height: 1.2; }
        .topbar-user-name { font-size: 12.5px; font-weight: 600; color: #0a0a0a; white-space: nowrap; }
        .topbar-user-role { font-size: 10.5px; color: #9A9A9A; white-space: nowrap; text-transform: capitalize; }

        /* Profile dropdown */
        .topbar-profile-wrap { position: relative; display: flex; align-items: center; }
        .topbar-profile-btn {
          display: flex; align-items: center; gap: 8px;
          background: none; border: none; cursor: pointer; padding: 4px 6px;
          border-radius: 8px; transition: background 0.15s;
        }
        .topbar-profile-btn:hover { background: #F5F5F5; }
        .profile-dropdown {
          position: absolute; top: calc(100% + 8px); right: 0;
          background: white; border: 1px solid #ECECEC; border-radius: 10px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.10); min-width: 160px;
          z-index: 200; overflow: hidden; padding: 4px;
        }
        .profile-dropdown-item {
          display: block; padding: 9px 14px; font-size: 13.5px; color: #0a0a0a;
          text-decoration: none; border-radius: 7px; transition: background 0.12s;
        }
        .profile-dropdown-item:hover { background: #F5F5F5; }
        .profile-dropdown-item--admin { font-weight: 600; color: #1B2B4B; }
        .profile-dropdown-item--admin:hover { background: #EEF2FF; }
        .profile-dropdown-divider { height: 1px; background: #F0F0F0; margin: 4px 0; }

      `}</style>
    </header>
  )
}
