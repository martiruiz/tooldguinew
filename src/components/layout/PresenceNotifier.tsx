'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'

interface Props {
  currentUserId: string
  currentUserName: string
  currentUserAvatar?: string
}

interface Toast {
  id: string
  userId: string
  name: string
  avatar?: string
  exiting: boolean
}

export function PresenceNotifier({ currentUserId, currentUserName, currentUserAvatar }: Props) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const knownUsers = useRef<Set<string>>(new Set())
  const channelRef = useRef<any>(null)

  const dismiss = (id: string) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t))
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 350)
  }

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase.channel('user-presence', {
      config: { presence: { key: currentUserId } },
    })

    channel
      .on('presence', { event: 'join' }, ({ key, newPresences }: any) => {
        // Ignore own join
        if (key === currentUserId) return
        const presence = newPresences?.[0]
        if (!presence) return

        // Only show toast if we haven't seen this user yet in this session
        if (knownUsers.current.has(key)) return
        knownUsers.current.add(key)

        const toastId = `${key}-${Date.now()}`
        setToasts(prev => [...prev, {
          id: toastId,
          userId: key,
          name: presence.full_name || 'Un usuari',
          avatar: presence.avatar_url,
          exiting: false,
        }])
        // Auto-dismiss after 5s
        setTimeout(() => dismiss(toastId), 5000)
      })
      .on('presence', { event: 'leave' }, ({ key }: any) => {
        knownUsers.current.delete(key)
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          // Track current user's presence
          await channel.track({
            user_id: currentUserId,
            full_name: currentUserName,
            avatar_url: currentUserAvatar,
            online_at: new Date().toISOString(),
          })
          // Seed known users from current state so we don't toast on initial load
          const state = channel.presenceState()
          Object.keys(state).forEach(k => knownUsers.current.add(k))
        }
      })

    channelRef.current = channel
    return () => { supabase.removeChannel(channel) }
  }, [currentUserId, currentUserName, currentUserAvatar])

  if (toasts.length === 0) return null

  return (
    <div style={{
      position: 'fixed', top: 70, right: 20, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none',
    }}>
      {toasts.map(toast => (
        <div key={toast.id} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'white', borderRadius: 14, padding: '10px 14px 10px 10px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.13), 0 1px 6px rgba(0,0,0,0.07)',
          border: '1px solid #E8EAED',
          animation: toast.exiting ? 'toastOut 0.3s ease forwards' : 'toastIn 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards',
          pointerEvents: 'auto', cursor: 'default',
          minWidth: 240, maxWidth: 300,
        }}>
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#1B2B4B,#3B6FD4)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, overflow: 'hidden' }}>
              {toast.avatar
                ? <img src={toast.avatar} alt={toast.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : getInitials(toast.name)}
            </div>
            {/* Online dot */}
            <span style={{ position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: '50%', background: '#22C55E', border: '2px solid white', display: 'block' }} />
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', lineHeight: 1.3 }}>
              {toast.name}
            </div>
            <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 1 }}>
              Acaba de connectar-se ✦
            </div>
          </div>

          {/* Close */}
          <button onClick={() => dismiss(toast.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CBD5E1', padding: 2, display: 'flex', borderRadius: 6, flexShrink: 0, lineHeight: 1 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      ))}

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(24px) scale(0.94); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes toastOut {
          from { opacity: 1; transform: translateX(0) scale(1); }
          to   { opacity: 0; transform: translateX(24px) scale(0.92); }
        }
      `}</style>
    </div>
  )
}
