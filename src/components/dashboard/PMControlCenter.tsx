'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  AlertCircle, CheckCircle2, Clock, Target, Users,
  ArrowRight, AlertTriangle, Zap, Calendar, BarChart2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Task, Project, Profile } from '@/types'

interface Props {
  allProjectTasks: Task[]
  pmProjects: Project[]
  profiles: { id: string; full_name: string; avatar_url?: string }[]
  currentUserId: string
}

function healthDot(score: number) {
  if (score >= 70) return { icon: '🟢', label: 'Saludable', color: '#16A34A', bg: '#DCFCE7' }
  if (score >= 40) return { icon: '🟠', label: 'En risc', color: '#D97706', bg: '#FEF3C7' }
  return { icon: '🔴', label: 'Crític', color: '#DC2626', bg: '#FEF2F2' }
}

function projectHealth(project: Project, tasks: Task[]) {
  const projectTasks = tasks.filter(t => t.project?.id === project.id)
  if (projectTasks.length === 0) return 80

  const now = new Date()
  const overdue = projectTasks.filter(t => t.deadline && new Date(t.deadline) < now).length
  const blocked = projectTasks.filter(t => t.status === 'blocked').length
  const urgent = projectTasks.filter(t => t.priority === 'urgent').length
  const total = projectTasks.length

  let score = 100
  score -= (overdue / total) * 50
  score -= (blocked / total) * 30
  score -= (urgent / total) * 20
  return Math.max(0, Math.round(score))
}

function groupDeadlines(tasks: Task[]) {
  const now = new Date()
  const today = new Date(now); today.setHours(23, 59, 59, 999)
  const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(23, 59, 59, 999)
  const thisWeek = new Date(now); thisWeek.setDate(thisWeek.getDate() + 7); thisWeek.setHours(23, 59, 59, 999)

  const withDeadline = tasks.filter(t => t.deadline)
  return {
    overdue: withDeadline.filter(t => new Date(t.deadline!) < now),
    today: withDeadline.filter(t => { const d = new Date(t.deadline!); return d >= now && d <= today }),
    tomorrow: withDeadline.filter(t => { const d = new Date(t.deadline!); return d > today && d <= tomorrow }),
    thisWeek: withDeadline.filter(t => { const d = new Date(t.deadline!); return d > tomorrow && d <= thisWeek }),
  }
}

const PRIORITY_COLORS: Record<string, { color: string; bg: string; label: string }> = {
  urgent: { color: '#DC2626', bg: '#FEF2F2', label: 'URGENT' },
  high:   { color: '#D97706', bg: '#FFFBEB', label: 'ALTA' },
  medium: { color: '#4A82C6', bg: '#EFF6FF', label: 'NORMAL' },
  low:    { color: '#9A9A9A', bg: '#F4F4F4', label: 'BAIXA' },
}

const STATUS_LABELS: Record<string, string> = {
  todo: 'Per fer',
  in_progress: 'En curs',
  review: 'Revisió',
  blocked: 'Bloquejat',
  inbox: 'Inbox',
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('ca-ES', { day: '2-digit', month: 'short' })
}

type Tab = 'focus' | 'projects' | 'blockers' | 'deadlines'

export function PMControlCenter({ allProjectTasks, pmProjects, profiles, currentUserId }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('focus')
  const [unblocking, setUnblocking] = useState<string | null>(null)
  const [localTasks, setLocalTasks] = useState(allProjectTasks)

  const now = new Date()

  const deadlines = useMemo(() => groupDeadlines(localTasks), [localTasks])

  const blockedTasks = useMemo(
    () => localTasks.filter(t => t.status === 'blocked'),
    [localTasks]
  )

  const focusTasks = useMemo(() => {
    const urgent = localTasks.filter(t => t.priority === 'urgent')
    const overdue = localTasks.filter(t => t.deadline && new Date(t.deadline) < now && t.priority !== 'urgent')
    const todayHigh = localTasks.filter(t => {
      if (!t.deadline) return false
      const d = new Date(t.deadline)
      const tod = new Date(now); tod.setHours(23, 59, 59, 999)
      return d >= now && d <= tod && t.priority === 'high' && !urgent.find(u => u.id === t.id)
    })
    const combined = [...urgent, ...overdue, ...todayHigh]
    const seen = new Set<string>()
    return combined.filter(t => { if (seen.has(t.id)) return false; seen.add(t.id); return true }).slice(0, 6)
  }, [localTasks])

  const workload = useMemo(() => {
    const map: Record<string, { profile: typeof profiles[0]; tasks: Task[] }> = {}
    profiles.forEach(p => { map[p.id] = { profile: p, tasks: [] } })
    localTasks.forEach(t => {
      if (t.responsible?.id && map[t.responsible.id]) {
        map[t.responsible.id].tasks.push(t)
      }
    })
    return Object.values(map)
      .filter(e => e.tasks.length > 0)
      .sort((a, b) => b.tasks.length - a.tasks.length)
      .slice(0, 8)
  }, [localTasks, profiles])

  const handleUnblock = async (taskId: string) => {
    setUnblocking(taskId)
    const supabase = createClient()
    await supabase.from('tasks').update({ status: 'in_progress' }).eq('id', taskId)
    setLocalTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'in_progress' } : t))
    setUnblocking(null)
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'focus', label: "Focus d'avui", icon: <Target size={13} /> },
    { id: 'projects', label: 'Salut dels projectes', icon: <BarChart2 size={13} /> },
    { id: 'blockers', label: 'Bloquejos', icon: <AlertTriangle size={13} />, count: blockedTasks.length },
    { id: 'deadlines', label: 'Deadlines', icon: <Calendar size={13} />, count: deadlines.overdue.length + deadlines.today.length },
  ]

  return (
    <div className="pm-cc">
      <div className="pm-cc-header">
        <div className="pm-cc-title-row">
          <Zap size={16} color="#4A82C6" strokeWidth={2.5} />
          <h2 className="pm-cc-title">Centre de Control</h2>
          <span className="pm-cc-badge">Project Manager</span>
        </div>
        <p className="pm-cc-sub">
          {pmProjects.length} projecte{pmProjects.length !== 1 ? 's' : ''} actiu{pmProjects.length !== 1 ? 's' : ''} ·{' '}
          {localTasks.length} tasca{localTasks.length !== 1 ? 'ques' : ''} en curs ·{' '}
          {blockedTasks.length > 0 ? <><span style={{ color: '#D97706', fontWeight: 700 }}>{blockedTasks.length} bloquejades</span></> : 'sense bloquejos'}
        </p>
      </div>

      {/* Tab bar */}
      <div className="pm-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`pm-tab ${activeTab === tab.id ? 'pm-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="pm-tab-count">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Focus d'avui */}
      {activeTab === 'focus' && (
        <div className="pm-panel">
          {focusTasks.length === 0 ? (
            <div className="pm-empty">
              <CheckCircle2 size={28} color="#16A34A" />
              <p>Tot sota control — cap tasca urgent ni endarrerida.</p>
            </div>
          ) : (
            <div className="pm-focus-list">
              {focusTasks.map(task => {
                const p = PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS.medium
                const isOverdue = task.deadline && new Date(task.deadline) < now
                return (
                  <div key={task.id} className="pm-focus-item">
                    <div className="pm-focus-left">
                      <span className="pm-priority-badge" style={{ color: p.color, background: p.bg }}>{p.label}</span>
                      <div>
                        <div className="pm-focus-title">{task.title}</div>
                        <div className="pm-focus-meta">
                          {task.project?.name && <span>{task.project.name}</span>}
                          {task.client?.name && <span>· {task.client.name}</span>}
                          {task.responsible?.full_name && <span>· {task.responsible.full_name}</span>}
                          {task.deadline && (
                            <span style={{ color: isOverdue ? '#DC2626' : '#5C5C5C', fontWeight: isOverdue ? 700 : 400 }}>
                              {' '}· {isOverdue ? 'Endarrerida' : 'Entrega'} {fmtDate(task.deadline)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Link href={`/tasks`} className="pm-open-btn">
                      Obrir <ArrowRight size={11} />
                    </Link>
                  </div>
                )
              })}
            </div>
          )}

          {/* Team workload mini */}
          {workload.length > 0 && (
            <div className="pm-workload">
              <div className="pm-section-label">
                <Users size={12} />
                Càrrega de l&apos;equip
              </div>
              <div className="pm-workload-list">
                {workload.map(({ profile, tasks }) => {
                  const blocked = tasks.filter(t => t.status === 'blocked').length
                  const maxTasks = Math.max(...workload.map(w => w.tasks.length), 1)
                  const barPct = Math.round((tasks.length / maxTasks) * 100)
                  return (
                    <div key={profile.id} className="pm-workload-item">
                      <div className="pm-workload-name">{profile.full_name.split(' ')[0]}</div>
                      <div className="pm-workload-bar-wrap">
                        <div className="pm-workload-bar" style={{ width: `${barPct}%` }} />
                      </div>
                      <div className="pm-workload-count">
                        {tasks.length}
                        {blocked > 0 && <span className="pm-workload-blocked"> · {blocked} 🔒</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Salut dels projectes */}
      {activeTab === 'projects' && (
        <div className="pm-panel">
          {pmProjects.length === 0 ? (
            <div className="pm-empty"><p>Cap projecte actiu assignat.</p></div>
          ) : (
            <div className="pm-projects-list">
              {pmProjects.map(project => {
                const score = projectHealth(project, localTasks)
                const { icon, label, color, bg } = healthDot(score)
                const ptasks = localTasks.filter(t => t.project?.id === project.id)
                const overdueCount = ptasks.filter(t => t.deadline && new Date(t.deadline) < now).length
                const blockedCount = ptasks.filter(t => t.status === 'blocked').length
                return (
                  <Link key={project.id} href={`/projects/${project.id}`} className="pm-project-item">
                    <div className="pm-project-health" style={{ background: bg }}>
                      <span>{icon}</span>
                      <span style={{ color, fontSize: 11, fontWeight: 700 }}>{label}</span>
                    </div>
                    <div className="pm-project-info">
                      <div className="pm-project-name">{project.name}</div>
                      <div className="pm-project-meta">
                        {project.client?.name && <span>{project.client.name}</span>}
                        <span>· {ptasks.length} tasques</span>
                        {overdueCount > 0 && <span style={{ color: '#DC2626', fontWeight: 600 }}>· {overdueCount} endarrerides</span>}
                        {blockedCount > 0 && <span style={{ color: '#D97706', fontWeight: 600 }}>· {blockedCount} bloquejades</span>}
                      </div>
                    </div>
                    <div className="pm-project-score" style={{ color }}>
                      {score}%
                    </div>
                    <ArrowRight size={13} color="#C0C0C0" />
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Bloquejos */}
      {activeTab === 'blockers' && (
        <div className="pm-panel">
          {blockedTasks.length === 0 ? (
            <div className="pm-empty">
              <CheckCircle2 size={28} color="#16A34A" />
              <p>Cap tasca bloquejada. Bon senyal!</p>
            </div>
          ) : (
            <div className="pm-blocker-list">
              {blockedTasks.map(task => (
                <div key={task.id} className="pm-blocker-item">
                  <AlertTriangle size={14} color="#D97706" />
                  <div className="pm-blocker-info">
                    <div className="pm-blocker-title">{task.title}</div>
                    <div className="pm-blocker-meta">
                      {task.project?.name && <span>{task.project.name}</span>}
                      {task.client?.name && <span>· {task.client.name}</span>}
                      {task.responsible?.full_name && <span>· {task.responsible.full_name}</span>}
                      {task.deadline && <span>· Entrega {fmtDate(task.deadline)}</span>}
                    </div>
                  </div>
                  <button
                    className="pm-unblock-btn"
                    disabled={unblocking === task.id}
                    onClick={() => handleUnblock(task.id)}
                  >
                    {unblocking === task.id ? '...' : 'Desbloquejar'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Deadlines */}
      {activeTab === 'deadlines' && (
        <div className="pm-panel">
          {[
            { key: 'overdue' as const, label: 'Endarrerides', color: '#DC2626' },
            { key: 'today' as const, label: 'Avui', color: '#D97706' },
            { key: 'tomorrow' as const, label: 'Demà', color: '#4A82C6' },
            { key: 'thisWeek' as const, label: 'Aquesta setmana', color: '#5C5C5C' },
          ].map(({ key, label, color }) => {
            const group = deadlines[key]
            if (group.length === 0) return null
            return (
              <div key={key} className="pm-deadline-group">
                <div className="pm-deadline-group-label" style={{ color }}>
                  <Clock size={12} />
                  {label} ({group.length})
                </div>
                {group.map(task => (
                  <div key={task.id} className="pm-deadline-item">
                    <div className="pm-deadline-date" style={{ color }}>{task.deadline ? fmtDate(task.deadline) : '—'}</div>
                    <div className="pm-deadline-info">
                      <div className="pm-deadline-title">{task.title}</div>
                      <div className="pm-deadline-meta">
                        {task.project?.name && <span>{task.project.name}</span>}
                        {task.responsible?.full_name && <span>· {task.responsible.full_name}</span>}
                        <span
                          className="pm-status-chip"
                          style={{ color: task.status === 'blocked' ? '#D97706' : '#5C5C5C' }}
                        >
                          · {STATUS_LABELS[task.status] ?? task.status}
                        </span>
                      </div>
                    </div>
                    <span
                      className="pm-priority-badge"
                      style={{ color: PRIORITY_COLORS[task.priority]?.color, background: PRIORITY_COLORS[task.priority]?.bg }}
                    >
                      {PRIORITY_COLORS[task.priority]?.label}
                    </span>
                  </div>
                ))}
              </div>
            )
          })}
          {Object.values(deadlines).every(g => g.length === 0) && (
            <div className="pm-empty">
              <CheckCircle2 size={28} color="#16A34A" />
              <p>Cap deadline pendent aquesta setmana.</p>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .pm-cc {
          background: white;
          border: 1px solid rgba(0,0,0,0.07);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          margin-bottom: 24px;
        }

        .pm-cc-header {
          padding: 20px 22px 16px;
          border-bottom: 1px solid #F3F4F6;
          background: linear-gradient(135deg, #F8FAFC 0%, #EEF4FF 100%);
        }

        .pm-cc-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }

        .pm-cc-title {
          font-size: 15px;
          font-weight: 800;
          color: #0F1B2D;
          letter-spacing: -0.02em;
        }

        .pm-cc-badge {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #4A82C6;
          background: #EEF4FF;
          border: 1px solid #BFD5F8;
          padding: 2px 7px;
          border-radius: 20px;
        }

        .pm-cc-sub {
          font-size: 12.5px;
          color: #6B7280;
        }

        .pm-tabs {
          display: flex;
          border-bottom: 1px solid #F0F0F0;
          padding: 0 6px;
          gap: 2px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .pm-tabs::-webkit-scrollbar { display: none; }

        .pm-tab {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 10px 14px;
          font-size: 12.5px;
          font-weight: 500;
          color: #6B7280;
          border: none;
          background: none;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: color 0.15s;
          white-space: nowrap;
          position: relative;
          top: 1px;
        }

        .pm-tab:hover { color: #1B2B4B; }

        .pm-tab--active {
          color: #1B2B4B;
          font-weight: 700;
          border-bottom-color: #4A82C6;
        }

        .pm-tab-count {
          background: #DC2626;
          color: white;
          font-size: 10px;
          font-weight: 700;
          padding: 1px 5px;
          border-radius: 10px;
          min-width: 16px;
          text-align: center;
        }

        .pm-panel {
          padding: 16px 22px;
        }

        .pm-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          padding: 32px 0;
          color: #9A9A9A;
          font-size: 13.5px;
        }

        /* Focus */
        .pm-focus-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .pm-focus-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          background: #FAFAFA;
          border: 1px solid #F0F0F0;
          border-radius: 10px;
          transition: border-color 0.15s;
        }

        .pm-focus-item:hover { border-color: #D8E4F0; }

        .pm-focus-left {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          min-width: 0;
        }

        .pm-focus-title {
          font-size: 13px;
          font-weight: 600;
          color: #0F1B2D;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .pm-focus-meta {
          font-size: 11.5px;
          color: #9A9A9A;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .pm-priority-badge {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.04em;
          padding: 2px 6px;
          border-radius: 5px;
          flex-shrink: 0;
        }

        .pm-open-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 600;
          color: #4A82C6;
          text-decoration: none;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .pm-open-btn:hover { color: #254067; }

        /* Workload */
        .pm-workload {
          margin-top: 20px;
          padding-top: 18px;
          border-top: 1px solid #F0F0F0;
        }

        .pm-section-label {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 10.5px;
          font-weight: 700;
          color: #9A9A9A;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 10px;
        }

        .pm-workload-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .pm-workload-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .pm-workload-name {
          font-size: 12px;
          font-weight: 600;
          color: #1B2B4B;
          width: 80px;
          flex-shrink: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .pm-workload-bar-wrap {
          flex: 1;
          height: 6px;
          background: #F0F0F0;
          border-radius: 3px;
          overflow: hidden;
        }

        .pm-workload-bar {
          height: 100%;
          background: linear-gradient(90deg, #4A82C6, #254067);
          border-radius: 3px;
          transition: width 0.4s ease;
          min-width: 4px;
        }

        .pm-workload-count {
          font-size: 12px;
          color: #5C5C5C;
          width: 56px;
          text-align: right;
          flex-shrink: 0;
        }

        .pm-workload-blocked {
          color: #D97706;
          font-weight: 600;
        }

        /* Projects health */
        .pm-projects-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .pm-project-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border: 1px solid #F0F0F0;
          border-radius: 10px;
          text-decoration: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          cursor: pointer;
        }

        .pm-project-item:hover {
          border-color: #D8E4F0;
          box-shadow: 0 2px 8px rgba(74,130,198,0.08);
        }

        .pm-project-health {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 9px;
          border-radius: 8px;
          flex-shrink: 0;
          font-size: 14px;
        }

        .pm-project-info {
          flex: 1;
          min-width: 0;
        }

        .pm-project-name {
          font-size: 13px;
          font-weight: 700;
          color: #0F1B2D;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .pm-project-meta {
          font-size: 11.5px;
          color: #9A9A9A;
        }

        .pm-project-meta span { margin-right: 2px; }

        .pm-project-score {
          font-size: 13px;
          font-weight: 800;
          flex-shrink: 0;
        }

        /* Blockers */
        .pm-blocker-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .pm-blocker-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 14px;
          background: #FFFBEB;
          border: 1px solid #FDE68A;
          border-radius: 10px;
        }

        .pm-blocker-info {
          flex: 1;
          min-width: 0;
        }

        .pm-blocker-title {
          font-size: 13px;
          font-weight: 600;
          color: #0F1B2D;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .pm-blocker-meta {
          font-size: 11.5px;
          color: #9A9A9A;
        }

        .pm-unblock-btn {
          font-size: 12px;
          font-weight: 600;
          color: #D97706;
          background: #FEF3C7;
          border: 1px solid #FDE68A;
          padding: 5px 11px;
          border-radius: 7px;
          cursor: pointer;
          flex-shrink: 0;
          transition: background 0.15s;
        }

        .pm-unblock-btn:hover:not(:disabled) { background: #FDE68A; }
        .pm-unblock-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Deadlines */
        .pm-deadline-group {
          margin-bottom: 16px;
        }

        .pm-deadline-group-label {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 10.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 6px;
        }

        .pm-deadline-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 9px 12px;
          border: 1px solid #F0F0F0;
          border-radius: 8px;
          margin-bottom: 5px;
        }

        .pm-deadline-date {
          font-size: 11px;
          font-weight: 700;
          width: 48px;
          flex-shrink: 0;
        }

        .pm-deadline-info {
          flex: 1;
          min-width: 0;
        }

        .pm-deadline-title {
          font-size: 13px;
          font-weight: 600;
          color: #0F1B2D;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .pm-deadline-meta {
          font-size: 11.5px;
          color: #9A9A9A;
        }

        .pm-status-chip {
          font-style: italic;
        }
      `}</style>
    </div>
  )
}
