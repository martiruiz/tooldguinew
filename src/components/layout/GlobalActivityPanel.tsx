'use client'

import { useState, useEffect, useRef } from 'react'
import { Activity, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'

interface FeedItem {
  id: string
  type: 'comment' | 'activity'
  user_id: string
  task_id: string
  task_title?: string
  content?: string   // comments
  action?: string    // activity
  details?: any
  mentions?: string[]
  created_at: string
  profile?: { full_name: string; avatar_url?: string }
  photos?: { url: string; name: string }[]
}

interface UserStat { id: string; full_name: string; avatar_url?: string; count: number }

function fmtTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return 'ara mateix'
  if (diff < 3600000) return `fa ${Math.floor(diff / 60000)} min`
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1); yesterday.setHours(0,0,0,0)
  const dDay = new Date(d); dDay.setHours(0,0,0,0)
  const isYesterday = dDay.getTime() === yesterday.getTime()
  const time = d.toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' })
  if (isYesterday) return `ahir a les ${time}`
  const today = new Date(now); today.setHours(0,0,0,0)
  if (dDay.getTime() === today.getTime()) return `avui a les ${time}`
  return `${d.toLocaleDateString('ca-ES', { day: '2-digit', month: 'short' })} a les ${time}`
}

function actionLabel(action: string, details: any) {
  switch (action) {
    case 'status_changed': return `ha mogut la tasca a "${details?.to}"`
    case 'priority_changed': return `ha canviat la prioritat a ${details?.to}`
    case 'assigned': return details?.name ? `ha assignat la tasca a ${details.name}` : `ha tret l'assignació`
    case 'title_changed': return `ha canviat el títol`
    case 'description_changed': return `ha actualitzat la descripció`
    case 'deadline_set': return details?.deadline ? `ha establert la data límit` : `ha eliminat la data límit`
    case 'checklist_added': return `ha afegit "${details?.text}" al checklist`
    case 'checklist_done': return `ha completat "${details?.text}"`
    case 'label_added': return `ha afegit l'etiqueta "${details?.label}"`
    case 'label_removed': return `ha tret l'etiqueta "${details?.label}"`
    case 'subtask_added': return `ha creat la subtasca "${details?.title}"`
    case 'subtask_assigned': return `ha assignat "${details?.title}" a ${details?.name || 'algú'}`
    case 'photo_added': return `ha pujat una foto`
    case 'task_created': return `ha creat la tasca "${details?.title}"`
    case 'task_moved': return `ha mogut la tasca a "${details?.to}"`
    default: return action
  }
}

function renderContent(text: string) {
  return text.split(/(@\S+)/g).map((part, i) =>
    part.startsWith('@')
      ? <span key={i} style={{ color: '#60A5FA', fontWeight: 600 }}>{part}</span>
      : <span key={i}>{part}</span>
  )
}

interface Props {
  currentUserId: string
  profiles: { id: string; full_name: string; avatar_url?: string }[]
}

export function GlobalActivityPanel({ currentUserId, profiles }: Props) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<FeedItem[]>([])
  const [userStats, setUserStats] = useState<UserStat[]>([])
  const [loading, setLoading] = useState(false)
  const feedRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail && typeof detail.open === 'boolean') setOpen(detail.open)
      else setOpen(v => !v)
    }
    window.addEventListener('toggle-activity-panel', handler)
    return () => window.removeEventListener('toggle-activity-panel', handler)
  }, [])

  const profileMap = Object.fromEntries(profiles.map(p => [p.id, p]))

  const enrich = (row: any, type: 'comment' | 'activity', taskTitle?: string): FeedItem => ({
    ...row,
    type,
    task_title: taskTitle,
    profile: profileMap[row.user_id],
  })

  useEffect(() => {
    if (!open) return
    setLoading(true)
    const supabase = createClient()

    Promise.all([
      supabase.from('task_comments')
        .select('id, task_id, user_id, content, mentions, created_at, task:tasks(title)')
        .order('created_at', { ascending: false })
        .limit(60),
      supabase.from('task_activity')
        .select('id, task_id, user_id, action, details, created_at, task:tasks(title)')
        .order('created_at', { ascending: false })
        .limit(60),
    ]).then(([commentsRes, activityRes]) => {
      const comments: FeedItem[] = (commentsRes.data || []).map(c =>
        enrich(c, 'comment', (c as any).task?.title))
      const activities: FeedItem[] = (activityRes.data || []).map(a =>
        enrich(a, 'activity', (a as any).task?.title))

      const merged = [...comments, ...activities]
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
      setItems(merged)

      // User stats: count by user_id across both
      const counts: Record<string, number> = {}
      merged.forEach(i => { counts[i.user_id] = (counts[i.user_id] || 0) + 1 })
      const stats = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([uid, count]) => ({ id: uid, count, full_name: profileMap[uid]?.full_name, avatar_url: profileMap[uid]?.avatar_url }))
        .filter(s => s.full_name)
      setUserStats(stats as UserStat[])
      setLoading(false)
    })

    // Realtime
    const channel = supabase.channel('global-activity-panel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'task_comments' }, async payload => {
        const { data } = await supabase.from('task_comments')
          .select('id, task_id, user_id, content, mentions, created_at, task:tasks(title)')
          .eq('id', payload.new.id).single()
        if (data) setItems(prev => [enrich(data, 'comment', (data as any).task?.title), ...prev])
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'task_activity' }, async payload => {
        const { data } = await supabase.from('task_activity')
          .select('id, task_id, user_id, action, details, created_at, task:tasks(title)')
          .eq('id', payload.new.id).single()
        if (data) setItems(prev => [enrich(data, 'activity', (data as any).task?.title), ...prev])
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tasks' }, async payload => {
        const n = payload.new as any
        const synth: FeedItem = {
          id: n.id,
          type: 'activity',
          user_id: n.created_by || n.responsible_id || currentUserId,
          task_id: n.id,
          task_title: n.title,
          action: 'task_created',
          details: { title: n.title },
          created_at: n.created_at || new Date().toISOString(),
          profile: profileMap[n.created_by || n.responsible_id || currentUserId],
        }
        setItems(prev => [synth, ...prev])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [open])

  return (
    <>
      {/* Panel */}
      <div style={{
        position: 'fixed', right: open ? 0 : -372, top: 0, bottom: 0,
        width: 372, background: '#111827', zIndex: 190,
        display: 'flex', flexDirection: 'column',
        transition: 'right 0.3s ease',
        boxShadow: open ? '-4px 0 24px rgba(0,0,0,0.3)' : 'none',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 14px', borderBottom: '1px solid #1F2937' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={16} color="#60A5FA" />
            <span style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>Activitat</span>
          </div>
          <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', padding: 4 }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Feed */}
          <div ref={feedRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
            {loading && <div style={{ color: '#6B7280', fontSize: 13, padding: '24px', textAlign: 'center' }}>Carregant...</div>}
            {!loading && items.length === 0 && <div style={{ color: '#6B7280', fontSize: 13, padding: '24px', textAlign: 'center' }}>Sense activitat recent.</div>}
            {items.map(item => (
              <div key={`${item.type}-${item.id}`} style={{ padding: '10px 16px', borderBottom: '1px solid #1F2937' }}>
                {/* User row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', background: '#374151',
                    color: '#D1D5DB', fontSize: 10, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', flexShrink: 0,
                  }}>
                    {item.profile?.avatar_url
                      ? <img src={item.profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : getInitials(item.profile?.full_name || '?')}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ color: '#F9FAFB', fontSize: 12.5, fontWeight: 600 }}>
                      {item.profile?.full_name || 'Usuari'}
                    </span>
                    <span style={{ color: '#6B7280', fontSize: 11, marginLeft: 6 }}>
                      {item.type === 'comment' ? 'dijo' : ''}
                    </span>
                  </div>
                  <span style={{ color: '#4B5563', fontSize: 10.5, flexShrink: 0 }}>{fmtTime(item.created_at)}</span>
                </div>

                {/* Content */}
                {item.type === 'comment' && item.content && (
                  <div style={{
                    background: '#1F2937', borderRadius: 10, padding: '10px 12px',
                    fontSize: 13, color: '#E5E7EB', lineHeight: 1.55,
                    marginBottom: 6,
                  }}>
                    {renderContent(item.content)}
                  </div>
                )}
                {item.type === 'activity' && item.action && (
                  <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 6, paddingLeft: 4 }}>
                    {actionLabel(item.action, item.details)}
                  </div>
                )}

                {/* Task label */}
                {item.task_title && (
                  <div style={{ fontSize: 10.5, color: '#60A5FA', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    {item.task_title}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Right mini column: user stats */}
          <div style={{ width: 72, borderLeft: '1px solid #1F2937', overflowY: 'auto', padding: '12px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            {userStats.map(u => (
              <div key={u.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%', background: '#374151',
                  color: '#D1D5DB', fontSize: 11, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                  {u.avatar_url
                    ? <img src={u.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : getInitials(u.full_name)}
                </div>
                <div style={{ color: '#9CA3AF', fontSize: 10, textAlign: 'center', maxWidth: 64, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.full_name.split(' ')[0]}
                </div>
                <div style={{ background: '#374151', color: '#60A5FA', fontSize: 10, fontWeight: 700, borderRadius: 10, padding: '1px 6px' }}>
                  {u.count}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
