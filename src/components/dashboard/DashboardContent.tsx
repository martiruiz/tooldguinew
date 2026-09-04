'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  CheckSquare, Clock, FolderKanban, Users, Plus,
  Calendar, ArrowRight, AlertCircle, CheckCircle2,
  Circle, TrendingUp,
} from 'lucide-react'
import { cn, formatTime, formatRelative, taskPriorityLabels, getInitials } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal'
import { NewTaskModal } from '@/components/tasks/NewTaskModal'
import { NewClientModal } from '@/components/clients/NewClientModal'
import { NewProjectModal } from '@/components/projects/NewProjectModal'
import { CommandPalette } from '@/components/layout/CommandPalette'
import type { Profile, Task, Project, Meeting, ActivityLog, Notification } from '@/types'

interface Stats {
  activeClients: number
  activeProjects: number
  pendingTasks: number
}

interface Props {
  user: Profile
  tasks: Task[]
  projects: Project[]
  activity: ActivityLog[]
  meetings: Meeting[]
  stats: Stats
  profiles: { id: string; full_name: string; avatar_url?: string }[]
  clients: { id: string; name: string }[]
  allProjects: { id: string; name: string }[]
  currentUserId: string
  blockedTasks: Task[]
  inboxNotifs: Notification[]
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bon dia'
  if (h < 19) return 'Bona tarda'
  return 'Bona nit'
}

const priorityColor: Record<string, string> = {
  urgent: '#DC2626',
  high: '#D97706',
  medium: '#1B2B4B',
  low: '#9A9A9A',
}

export function DashboardContent({ user, tasks, projects, activity, meetings, stats, profiles, clients, allProjects, currentUserId, blockedTasks, inboxNotifs }: Props) {
  const [completingTask, setCompletingTask] = useState<string | null>(null)
  const [localTasks, setLocalTasks] = useState(tasks)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [dismissedItems, setDismissedItems] = useState<Set<string>>(new Set())
  const [showNewTask, setShowNewTask] = useState(false)
  const [showNewClient, setShowNewClient] = useState(false)
  const [showNewProject, setShowNewProject] = useState(false)

  const firstName = user.full_name.split(' ')[0]

  const handleCompleteTask = async (taskId: string) => {
    setCompletingTask(taskId)
    const supabase = createClient()
    await supabase.from('tasks').update({ status: 'done', completed_at: new Date().toISOString() }).eq('id', taskId)
    setLocalTasks((prev) => prev.filter((t) => t.id !== taskId))
    if (selectedTask?.id === taskId) setSelectedTask(null)
    setCompletingTask(null)
  }

  const handleTaskUpdated = (updated: Task) => {
    setLocalTasks((prev) => prev.map((t) => t.id === updated.id ? updated : t))
    setSelectedTask(updated)
  }

  const now = new Date()
  const todayStr = now.toDateString()

  const todayTasks = localTasks.filter((t) => {
    if (!t.deadline) return false
    return new Date(t.deadline).toDateString() === todayStr
  })

  const overdueTasks = localTasks.filter((t) => {
    if (!t.deadline) return false
    return new Date(t.deadline) < now && new Date(t.deadline).toDateString() !== todayStr
  })

  const upcomingTasks = localTasks.filter(t => !todayTasks.includes(t) && !overdueTasks.includes(t))

  // Build attention items
  type AttnLevel = 'red' | 'orange' | 'green'
  type AttnItem = { id: string; level: AttnLevel; title: string; subtitle: string; taskId?: string }

  const attentionItems: AttnItem[] = []

  overdueTasks.slice(0, 3).forEach(t => {
    if (!dismissedItems.has(`overdue-${t.id}`)) {
      const daysAgo = Math.ceil((now.getTime() - new Date(t.deadline!).getTime()) / 86400000)
      attentionItems.push({
        id: `overdue-${t.id}`,
        level: 'red',
        title: `${t.client?.name ?? 'Sense client'} — ${t.title}`,
        subtitle: `Endarrerit ${daysAgo} ${daysAgo === 1 ? 'dia' : 'dies'}${t.responsible ? ` · Responsable: ${t.responsible.full_name}` : ''}`,
        taskId: t.id,
      })
    }
  })

  localTasks.filter(t => t.priority === 'urgent' && !overdueTasks.includes(t)).slice(0, 2).forEach(t => {
    if (!dismissedItems.has(`urgent-${t.id}`)) {
      attentionItems.push({
        id: `urgent-${t.id}`,
        level: 'orange',
        title: `${t.client?.name ?? 'Sense client'} — ${t.title}`,
        subtitle: `Prioritat urgent${t.deadline ? ` · Entrega ${new Date(t.deadline).toLocaleDateString('ca-ES', { day: '2-digit', month: 'short' })}` : ''}`,
        taskId: t.id,
      })
    }
  })

  todayTasks.filter(t => t.priority === 'high' || t.priority === 'urgent').slice(0, 2).forEach(t => {
    const key = `today-${t.id}`
    if (!dismissedItems.has(key) && !attentionItems.find(a => a.taskId === t.id)) {
      attentionItems.push({
        id: key,
        level: 'orange',
        title: `${t.client?.name ?? 'Sense client'} — ${t.title}`,
        subtitle: `Entrega avui${t.responsible ? ` · Responsable: ${t.responsible.full_name}` : ''}`,
        taskId: t.id,
      })
    }
  })

  // Priority tasks for "Avui a Guinew"
  const priorityTasks = localTasks
    .filter(t => t.priority === 'urgent' || t.priority === 'high')
    .sort((a, b) => {
      const order = { urgent: 0, high: 1, medium: 2, low: 3 }
      return order[a.priority] - order[b.priority]
    })
    .slice(0, 6)

  const priorityLabel: Record<string, { label: string; color: string; bg: string }> = {
    urgent: { label: 'URGENT', color: '#DC2626', bg: '#FEF2F2' },
    high: { label: 'ALTA', color: '#D97706', bg: '#FFFBEB' },
    medium: { label: 'NORMAL', color: '#5C5C5C', bg: '#F4F4F4' },
    low: { label: 'BAIXA', color: '#9A9A9A', bg: '#F8F8F8' },
  }

  const levelDot: Record<AttnLevel, string> = { red: '#DC2626', orange: '#D97706', green: '#16A34A' }

  // Inbox grouping
  const inboxGroups = {
    mention: inboxNotifs.filter(n => n.type === 'mention' || n.type === 'comment'),
    task_assigned: inboxNotifs.filter(n => n.type === 'task_assigned'),
    approval: inboxNotifs.filter(n => n.type === 'task_updated' || n.type === 'task_completed'),
    document: inboxNotifs.filter(n => n.type === 'client' || n.type === 'project'),
  }
  const inboxTotal = inboxNotifs.length

  // Unblock a task: set status to in_progress
  const handleUnblock = async (taskId: string) => {
    const supabase = createClient()
    await supabase.from('tasks').update({ status: 'in_progress' }).eq('id', taskId)
    setLocalBlockedTasks(prev => prev.filter(t => t.id !== taskId))
  }

  const [localBlockedTasks, setLocalBlockedTasks] = useState(blockedTasks)

  // Build rich activity text
  const activityText = (log: ActivityLog) => {
    const who = log.user?.full_name ?? 'Algú'
    const what = log.entity_name ?? ''
    const a = log.action?.toLowerCase() ?? ''
    if (a.includes('creat') || a.includes('created')) return { who, verb: 'ha creat', entity: what, icon: '✨' }
    if (a.includes('completat') || a.includes('completed') || a.includes('done')) return { who, verb: 'ha completat', entity: what, icon: '✅' }
    if (a.includes('actualitzat') || a.includes('updated')) return { who, verb: 'ha actualitzat', entity: what, icon: '✏️' }
    if (a.includes('eliminat') || a.includes('deleted')) return { who, verb: 'ha eliminat', entity: what, icon: '🗑️' }
    if (a.includes('assignat') || a.includes('assigned')) return { who, verb: 'ha assignat', entity: what, icon: '👤' }
    if (a.includes('comentat') || a.includes('comment')) return { who, verb: 'ha comentat a', entity: what, icon: '💬' }
    if (a.includes('pujat') || a.includes('uploaded')) return { who, verb: 'ha pujat fitxers a', entity: what, icon: '📎' }
    return { who, verb: log.action ?? 'ha fet acció a', entity: what, icon: '🔔' }
  }

  return (
    <div className="dash">
      {/* Header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-greeting">{getGreeting()}, {firstName}.</h1>
          <p className="dash-subtitle">
            {localTasks.length === 0
              ? 'Tot sota control. Cap tasca pendent.'
              : `${localTasks.length} ${localTasks.length === 1 ? 'tasca pendent' : 'tasques pendents'} · ${overdueTasks.length > 0 ? `${overdueTasks.length} endarrerides` : 'Cap endarreriment'}`
            }
          </p>
        </div>

        <div className="dash-quick-actions">
          <button className="quick-btn quick-btn--primary" onClick={() => setShowNewTask(true)}>
            <Plus size={14} strokeWidth={2.5} />
            Nova tasca
          </button>
          <button className="quick-btn" onClick={() => setShowNewClient(true)}>
            <Users size={14} strokeWidth={1.8} />
            Nou client
          </button>
          <button className="quick-btn" onClick={() => setShowNewProject(true)}>
            <FolderKanban size={14} strokeWidth={1.8} />
            Nou projecte
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="dash-stats">
        <div className="stat-card">
          <div className="stat-icon stat-icon--blue"><Users size={16} strokeWidth={2} /></div>
          <div>
            <div className="stat-value">{stats.activeClients}</div>
            <div className="stat-label">Clients actius</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon--indigo"><FolderKanban size={16} strokeWidth={2} /></div>
          <div>
            <div className="stat-value">{stats.activeProjects}</div>
            <div className="stat-label">Projectes actius</div>
          </div>
        </div>
        <div className="stat-card">
          <div className={cn('stat-icon', stats.pendingTasks > 0 ? 'stat-icon--amber' : 'stat-icon--green')}>
            <CheckSquare size={16} strokeWidth={2} />
          </div>
          <div>
            <div className="stat-value">{stats.pendingTasks}</div>
            <div className="stat-label">Tasques pendents</div>
          </div>
        </div>
        {meetings.length > 0 && (
          <div className="stat-card">
            <div className="stat-icon stat-icon--blue"><Calendar size={16} strokeWidth={2} /></div>
            <div>
              <div className="stat-value">{meetings.length}</div>
              <div className="stat-label">{meetings.length === 1 ? 'Reunió avui' : 'Reunions avui'}</div>
            </div>
          </div>
        )}
      </div>

      {/* Atenció requerida */}
      {attentionItems.length > 0 && (
        <div className="attention-block">
          <div className="attention-header">
            <AlertCircle size={15} strokeWidth={2} color="#DC2626" />
            <h2 className="attention-title">Requereix la teva atenció</h2>
            <span className="attention-count">{attentionItems.length}</span>
          </div>
          <div className="attention-list">
            {attentionItems.map(item => (
              <div key={item.id} className="attention-item">
                <div className="attention-dot" style={{ background: levelDot[item.level] }} />
                <div className="attention-info">
                  <div className="attention-item-title">{item.title}</div>
                  <div className="attention-item-sub">{item.subtitle}</div>
                </div>
                <div className="attention-actions">
                  {item.taskId && (
                    <button
                      className="attn-btn attn-btn--primary"
                      onClick={() => {
                        const t = localTasks.find(t => t.id === item.taskId)
                        if (t) setSelectedTask(t)
                      }}
                    >
                      Obrir
                    </button>
                  )}
                  {item.taskId && (
                    <button
                      className="attn-btn attn-btn--resolve"
                      onClick={() => item.taskId && handleCompleteTask(item.taskId)}
                    >
                      Marcar resolt
                    </button>
                  )}
                  <button
                    className="attn-btn attn-btn--dismiss"
                    onClick={() => setDismissedItems(prev => new Set(prev).add(item.id))}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="dash-grid">
        {/* Left: Tasks */}
        <div className="dash-col">
          <div className="dash-widget">
            <div className="widget-header">
              <CheckSquare size={14} strokeWidth={2} color="#1B2B4B" />
              <h2 className="widget-title">Tasques d&apos;avui</h2>
              <Link href="/tasks" className="widget-link">Veure totes <ArrowRight size={12} /></Link>
            </div>
            {todayTasks.length === 0 ? (
              <div className="widget-empty">
                <CheckCircle2 size={24} color="#16A34A" />
                <p>Cap tasca específica per avui.</p>
              </div>
            ) : (
              <div className="task-list">
                {todayTasks.map((task) => (
                  <TaskRow key={task.id} task={task} onComplete={handleCompleteTask} completing={completingTask === task.id} onTaskClick={setSelectedTask} />
                ))}
              </div>
            )}
          </div>

          {upcomingTasks.length > 0 && (
            <div className="dash-widget">
              <div className="widget-header">
                <Clock size={14} strokeWidth={2} color="#5C5C5C" />
                <h2 className="widget-title">Pròximament</h2>
              </div>
              <div className="task-list">
                {upcomingTasks.slice(0, 4).map((task) => (
                  <TaskRow key={task.id} task={task} onComplete={handleCompleteTask} completing={completingTask === task.id} onTaskClick={setSelectedTask} />
                ))}
              </div>
            </div>
          )}

          {/* Active Projects */}
          <div className="dash-widget">
            <div className="widget-header">
              <FolderKanban size={14} strokeWidth={2} color="#1B2B4B" />
              <h2 className="widget-title">Projectes actius</h2>
              <Link href="/projects" className="widget-link">Veure tots <ArrowRight size={12} /></Link>
            </div>
            {projects.length === 0 ? (
              <div className="widget-empty"><p>Cap projecte assignat.</p></div>
            ) : (
              <div className="project-list">
                {projects.map((project) => (
                  <Link key={project.id} href={`/projects/${project.id}`} className="project-item">
                    <div className="project-client-dot" />
                    <div className="project-info">
                      <div className="project-name">{project.name}</div>
                      {project.client && <div className="project-client">{project.client.name}</div>}
                    </div>
                    <ArrowRight size={12} color="#C0C0C0" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Avui a Guinew + Activity */}
        <div className="dash-col">
          {/* Avui a Guinew */}
          <div className="dash-widget">
            <div className="widget-header">
              <Calendar size={14} strokeWidth={2} color="#1B2B4B" />
              <h2 className="widget-title">Avui a Guinew</h2>
              <Link href="/calendar" className="widget-link">Calendari <ArrowRight size={12} /></Link>
            </div>

            {/* Meetings timeline */}
            {meetings.length > 0 && (
              <div className="today-section">
                <div className="today-section-label">Agenda</div>
                <div className="meeting-list">
                  {meetings.map((meeting) => (
                    <div key={meeting.id} className="meeting-item">
                      <div className="meeting-time">{formatTime(meeting.start_time)}</div>
                      <div className="meeting-info">
                        <div className="meeting-title">{meeting.title}</div>
                        {meeting.client && <div className="meeting-client">{meeting.client.name}</div>}
                      </div>
                      {meeting.meet_url && (
                        <a href={meeting.meet_url} target="_blank" rel="noopener noreferrer" className="meeting-join">
                          Unir-se
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {meetings.length === 0 && (
              <div className="today-section">
                <div className="today-section-label">Agenda</div>
                <div className="widget-empty" style={{ padding: '14px 16px' }}>
                  <p>Sense reunions avui.</p>
                </div>
              </div>
            )}

            {/* Priority tasks */}
            <div className="today-section today-section--border">
              <div className="today-section-label">Tasques prioritàries</div>
              {priorityTasks.length === 0 ? (
                <div className="widget-empty" style={{ padding: '14px 16px' }}>
                  <p>Cap tasca urgent o alta prioritat.</p>
                </div>
              ) : (
                <div className="priority-task-list">
                  {priorityTasks.map(task => (
                    <div key={task.id} className="priority-task-item">
                      <button
                        className="priority-task-check"
                        onClick={() => handleCompleteTask(task.id)}
                        disabled={completingTask === task.id}
                      >
                        {completingTask === task.id
                          ? <CheckCircle2 size={16} color="#16A34A" />
                          : <Circle size={16} strokeWidth={1.5} color="#C0C0C0" />
                        }
                      </button>
                      <div className="priority-task-info" onClick={() => setSelectedTask(task)} style={{ cursor: 'pointer', flex: 1, minWidth: 0 }}>
                        <div className="priority-task-title">{task.title}</div>
                        {task.client && <div className="priority-task-client">{task.client.name}</div>}
                      </div>
                      <span
                        className="priority-badge"
                        style={{ color: priorityLabel[task.priority].color, background: priorityLabel[task.priority].bg }}
                      >
                        {priorityLabel[task.priority].label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Inbox */}
          {inboxTotal > 0 && (
            <div className="dash-widget">
              <div className="widget-header">
                <AlertCircle size={14} strokeWidth={2} color="#1B2B4B" />
                <h2 className="widget-title">Inbox</h2>
                <span className="inbox-badge">{inboxTotal}</span>
              </div>
              {inboxGroups.mention.length > 0 && (
                <div className="today-section-label" style={{ padding: '10px 16px 4px', fontSize: '10.5px', fontWeight: 700, color: '#9A9A9A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Mencions ({inboxGroups.mention.length})
                </div>
              )}
              <div className="activity-list" style={{ paddingTop: 0 }}>
                {inboxNotifs.slice(0, 5).map(n => (
                  <div key={n.id} className="inbox-item">
                    <div className="inbox-type-icon">
                      {n.type === 'mention' || n.type === 'comment' ? '💬'
                        : n.type === 'task_assigned' ? '📋'
                        : n.type === 'task_completed' ? '✅'
                        : '🔔'}
                    </div>
                    <div className="inbox-content">
                      <div className="inbox-title">{n.title}</div>
                      {n.body && <div className="inbox-body">{n.body}</div>}
                    </div>
                    <div className="inbox-time">{formatRelative(n.created_at)}</div>
                  </div>
                ))}
              </div>
              {inboxTotal > 5 && (
                <div className="inbox-more">+{inboxTotal - 5} més sense llegir</div>
              )}
            </div>
          )}

          {/* Bloquejos */}
          {localBlockedTasks.length > 0 && (
            <div className="dash-widget dash-widget--blocked">
              <div className="widget-header">
                <AlertCircle size={14} strokeWidth={2} color="#D97706" />
                <h2 className="widget-title" style={{ color: '#D97706' }}>Bloquejos ({localBlockedTasks.length})</h2>
              </div>
              <div className="blocked-list">
                {localBlockedTasks.map(task => (
                  <div key={task.id} className="blocked-item">
                    <div className="blocked-dot" />
                    <div className="blocked-info">
                      <div className="blocked-title">{task.title}</div>
                      <div className="blocked-meta">
                        {task.client?.name && <span>{task.client.name}</span>}
                        {task.responsible && <span>· {task.responsible.full_name}</span>}
                      </div>
                    </div>
                    <button
                      className="unblock-btn"
                      onClick={() => handleUnblock(task.id)}
                    >
                      Desbloquejar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity feed */}
          <div className="dash-widget">
            <div className="widget-header">
              <TrendingUp size={14} strokeWidth={2} color="#5C5C5C" />
              <h2 className="widget-title">Activitat recent</h2>
            </div>
            {activity.length === 0 ? (
              <div className="widget-empty"><p>Cap activitat recent.</p></div>
            ) : (
              <div className="activity-list">
                {activity.map((log) => {
                  const { who, verb, entity, icon } = activityText(log)
                  return (
                    <div key={log.id} className="activity-item">
                      <div className="activity-emoji">{icon}</div>
                      <div className="activity-body">
                        <span className="activity-user">{who}</span>
                        {' '}<span className="activity-text">{verb}</span>
                        {entity && <>{' '}<span className="activity-entity">«{entity}»</span></>}
                      </div>
                      <div className="activity-time">{formatRelative(log.created_at)}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          profiles={profiles}
          clients={clients}
          projects={allProjects}
          currentUserId={currentUserId}
          onClose={() => setSelectedTask(null)}
          onUpdated={handleTaskUpdated}
        />
      )}

      {showNewTask && (
        <NewTaskModal
          clients={clients}
          projects={allProjects}
          profiles={profiles}
          currentUserId={currentUserId}
          onClose={() => setShowNewTask(false)}
          onCreated={(task) => {
            setLocalTasks(prev => [task, ...prev])
            setShowNewTask(false)
          }}
        />
      )}

      {showNewClient && (
        <NewClientModal
          profiles={profiles}
          onClose={() => setShowNewClient(false)}
        />
      )}

      {showNewProject && (
        <NewProjectModal
          clients={clients}
          profiles={profiles}
          currentUserId={currentUserId}
          onClose={() => setShowNewProject(false)}
        />
      )}

      <CommandPalette
        onNewTask={() => setShowNewTask(true)}
        onNewClient={() => setShowNewClient(true)}
        onNewProject={() => setShowNewProject(true)}
      />

      <style jsx>{`
        .dash {
          flex: 1;
          padding: 28px 28px 40px;
          max-width: 1400px;
          overflow-y: auto;
        }

        @media (max-width: 767px) {
          .dash { padding: 16px 12px 80px; }
          .dash-greeting { font-size: 18px; }
          .dash-stats { gap: 8px; }
          .dash-stat-card { min-width: calc(50% - 4px); flex: 1; padding: 14px 14px 12px; }
          .dash-stat-value { font-size: 20px; }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .dash { padding: 20px 16px 40px; }
        }

        .dash-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .dash-greeting {
          font-size: 23px;
          font-weight: 800;
          color: #0F1B2D;
          letter-spacing: -0.03em;
        }

        .dash-subtitle {
          font-size: 13.5px;
          color: #8A94A6;
          margin-top: 5px;
          font-weight: 500;
        }

        .dash-quick-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .quick-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          height: 36px;
          padding: 0 14px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          border: 1px solid rgba(0,0,0,0.08);
          background: white;
          color: #5C6B80;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }

        .quick-btn:hover {
          border-color: rgba(0,0,0,0.14);
          background: #F8FAFB;
          color: #0F1B2D;
          box-shadow: 0 2px 6px rgba(0,0,0,0.08);
          transform: translateY(-1px);
        }

        .quick-btn--primary {
          background: linear-gradient(135deg, #1B2B4B, #2563EB);
          border-color: transparent;
          color: white;
          box-shadow: 0 2px 8px rgba(37,99,235,0.3);
        }

        .quick-btn--primary:hover {
          background: linear-gradient(135deg, #0F1E33, #1D4ED8);
          border-color: transparent;
          color: white;
          box-shadow: 0 4px 14px rgba(37,99,235,0.38);
          transform: translateY(-1px);
        }

        /* Attention block */
        .attention-block {
          background: white;
          border: 1px solid rgba(220,38,38,0.2);
          border-radius: 18px;
          margin-bottom: 20px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(220,38,38,0.06), 0 1px 2px rgba(0,0,0,0.03);
        }

        .attention-header {
          display: flex; align-items: center; gap: 8px;
          padding: 13px 18px; border-bottom: 1px solid rgba(220,38,38,0.1);
          background: rgba(254,242,242,0.7);
        }

        .attention-title {
          font-size: 13px; font-weight: 700; color: #DC2626; flex: 1; letter-spacing: -0.1px;
        }

        .attention-count {
          min-width: 22px; height: 22px; padding: 0 7px;
          background: linear-gradient(135deg, #F87171, #DC2626); color: white;
          font-size: 11px; font-weight: 700;
          border-radius: 11px; display: flex; align-items: center; justify-content: center;
        }

        .attention-list { padding: 4px 0; }

        .attention-item {
          display: flex; align-items: center; gap: 12px;
          padding: 11px 18px; border-bottom: 1px solid rgba(254,226,226,0.5);
          transition: background 0.15s;
        }
        .attention-item:last-child { border-bottom: none; }
        .attention-item:hover { background: #FFFAFA; }

        .attention-dot {
          width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
        }

        .attention-info { flex: 1; min-width: 0; }

        .attention-item-title {
          font-size: 13.5px; font-weight: 600; color: #0a0a0a;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        .attention-item-sub {
          font-size: 11.5px; color: #9A9A9A; margin-top: 2px;
        }

        .attention-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }

        .attn-btn {
          height: 28px; padding: 0 10px; border-radius: 6px; font-size: 12px;
          font-weight: 500; cursor: pointer; font-family: inherit; transition: all 0.15s;
          white-space: nowrap;
        }

        .attn-btn--primary {
          background: linear-gradient(135deg, #1B2B4B, #2563EB); color: white; border: none;
          box-shadow: 0 2px 6px rgba(37,99,235,0.25);
        }
        .attn-btn--primary:hover { background: linear-gradient(135deg, #0F1E33, #1D4ED8); }

        .attn-btn--resolve {
          background: white; color: #059669; border: 1px solid #A7F3D0;
        }
        .attn-btn--resolve:hover { background: #F0FDF4; }

        .attn-btn--dismiss {
          width: 28px; padding: 0; background: none; border: none;
          color: #C0C0C0; font-size: 13px;
        }
        .attn-btn--dismiss:hover { color: #5C5C5C; }

        /* Stats */
        .dash-stats {
          display: flex;
          gap: 14px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .stat-card {
          background: white;
          border: 1px solid rgba(0,0,0,0.06);
          border-radius: 18px;
          padding: 18px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 140px;
          flex: 1;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03);
          transition: box-shadow 0.2s ease, transform 0.2s ease;
        }

        .stat-card:hover {
          box-shadow: 0 6px 20px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04);
          transform: translateY(-1px);
        }

        .stat-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .stat-icon--blue { background: linear-gradient(135deg, #3B82F6, #1B2B4B); color: white; }
        .stat-icon--indigo { background: linear-gradient(135deg, #818CF8, #4F46E5); color: white; }
        .stat-icon--amber { background: linear-gradient(135deg, #FBBF24, #D97706); color: white; }
        .stat-icon--green { background: linear-gradient(135deg, #34D399, #059669); color: white; }

        .stat-value {
          font-size: 24px;
          font-weight: 800;
          color: #0F1B2D;
          letter-spacing: -0.03em;
          line-height: 1;
        }

        .stat-label {
          font-size: 12px;
          color: #A0A9BB;
          margin-top: 4px;
          font-weight: 500;
        }

        /* Grid */
        .dash-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 18px;
        }

        @media (min-width: 1100px) {
          .dash-grid {
            grid-template-columns: 1.1fr 1fr;
          }
        }

        .dash-col {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        /* Widget */
        .dash-widget {
          background: white;
          border: 1px solid rgba(0,0,0,0.06);
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03);
          transition: box-shadow 0.2s ease, transform 0.2s ease;
        }

        .dash-widget:hover {
          box-shadow: 0 6px 20px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04);
          transform: translateY(-1px);
        }

        .widget-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 16px 18px 13px;
          border-bottom: 1px solid rgba(0,0,0,0.05);
        }

        .widget-title {
          font-size: 13.5px;
          font-weight: 700;
          color: #0F1B2D;
          flex: 1;
          letter-spacing: -0.2px;
        }

        :global(.widget-link) {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: #2563EB;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.15s;
        }

        :global(.widget-link:hover) {
          color: #1D4ED8;
        }

        .widget-empty {
          padding: 28px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          color: #9A9A9A;
          font-size: 13px;
          text-align: center;
        }

        /* Today sections inside widget */
        .today-section { padding-bottom: 0; }
        .today-section--border { border-top: 1px solid #F0F0F0; }

        .today-section-label {
          font-size: 10px; font-weight: 700; color: #A0A9BB;
          text-transform: uppercase; letter-spacing: 0.07em;
          padding: 11px 18px 6px;
        }

        /* Priority task list */
        .priority-task-list { padding: 4px 0 8px; }

        .priority-task-item {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 18px; border-bottom: 1px solid rgba(0,0,0,0.04);
          transition: background 0.15s;
        }
        .priority-task-item:last-child { border-bottom: none; }
        .priority-task-item:hover { background: #F8FAFF; }

        .priority-task-check {
          border: none; background: none; cursor: pointer;
          padding: 0; display: flex; align-items: center; flex-shrink: 0;
          transition: transform 0.1s;
        }
        .priority-task-check:hover { transform: scale(1.1); }

        .priority-task-title {
          font-size: 13px; font-weight: 500; color: #0a0a0a;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        .priority-task-client {
          font-size: 11px; color: #9A9A9A; margin-top: 1px;
        }

        .priority-badge {
          font-size: 10px; font-weight: 700; letter-spacing: 0.04em;
          padding: 2px 6px; border-radius: 4px; white-space: nowrap; flex-shrink: 0;
        }

        /* Tasks */
        .task-list {
          padding: 6px 0;
        }

        /* Meetings */
        .meeting-list {
          padding: 6px 0;
        }

        .meeting-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          border-bottom: 1px solid #F8F8F8;
          transition: background 0.1s;
        }

        .meeting-item:last-child { border-bottom: none; }
        .meeting-item:hover { background: #FAFAFA; }

        .meeting-time {
          font-size: 12px;
          font-weight: 600;
          color: #1B2B4B;
          min-width: 40px;
        }

        .meeting-info { flex: 1; min-width: 0; }

        .meeting-title {
          font-size: 13.5px;
          font-weight: 500;
          color: #0a0a0a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .meeting-client {
          font-size: 12px;
          color: #9A9A9A;
          margin-top: 2px;
        }

        .meeting-join {
          font-size: 12px;
          font-weight: 500;
          color: #1B2B4B;
          text-decoration: none;
          padding: 4px 10px;
          border: 1px solid #1B2B4B30;
          border-radius: 6px;
          background: #1B2B4B08;
          white-space: nowrap;
          transition: all 0.15s;
        }

        .meeting-join:hover { background: #1B2B4B18; }

        /* Projects */
        .project-list { padding: 6px 0; }

        :global(.project-item) {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          border-bottom: 1px solid #F8F8F8;
          text-decoration: none;
          transition: background 0.1s;
        }

        :global(.project-item:last-child) { border-bottom: none; }
        :global(.project-item:hover) { background: #FAFAFA; }

        .project-client-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #1B2B4B;
          flex-shrink: 0;
        }

        .project-info { flex: 1; min-width: 0; }

        .project-name {
          font-size: 13.5px;
          font-weight: 500;
          color: #0a0a0a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .project-client {
          font-size: 12px;
          color: #9A9A9A;
          margin-top: 2px;
        }

        /* Inbox */
        .inbox-badge {
          min-width: 20px; height: 20px; padding: 0 6px;
          background: #1B2B4B; color: white;
          font-size: 11px; font-weight: 700;
          border-radius: 10px; display: flex; align-items: center; justify-content: center;
        }

        .inbox-item {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 10px 16px; border-bottom: 1px solid #F8F8F8;
          transition: background 0.1s;
        }
        .inbox-item:last-child { border-bottom: none; }
        .inbox-item:hover { background: #FAFAFA; }

        .inbox-type-icon { font-size: 16px; flex-shrink: 0; margin-top: 1px; }

        .inbox-content { flex: 1; min-width: 0; }
        .inbox-title { font-size: 13px; font-weight: 600; color: #0a0a0a; line-height: 1.3; }
        .inbox-body { font-size: 12px; color: #5C5C5C; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .inbox-time { font-size: 11px; color: #C0C0C0; white-space: nowrap; margin-top: 2px; }

        .inbox-more {
          padding: 10px 16px; font-size: 12px; color: #9A9A9A;
          border-top: 1px solid #F4F4F4; text-align: center;
        }

        /* Bloquejos */
        .dash-widget--blocked {
          border-color: rgba(217,119,6,0.2);
          box-shadow: 0 2px 8px rgba(217,119,6,0.06), 0 1px 2px rgba(0,0,0,0.03);
        }

        .blocked-list { padding: 4px 0; }

        .blocked-item {
          display: flex; align-items: center; gap: 10px;
          padding: 11px 18px; border-bottom: 1px solid rgba(253,230,138,0.4);
          transition: background 0.15s;
        }
        .blocked-item:last-child { border-bottom: none; }
        .blocked-item:hover { background: #FFFDF5; }

        .blocked-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: linear-gradient(135deg, #FBBF24, #D97706); flex-shrink: 0;
        }

        .blocked-info { flex: 1; min-width: 0; }
        .blocked-title { font-size: 13.5px; font-weight: 600; color: #0a0a0a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .blocked-meta { font-size: 11.5px; color: #9A9A9A; margin-top: 2px; }

        .unblock-btn {
          height: 28px; padding: 0 10px; border-radius: 6px; font-size: 12px;
          font-weight: 600; cursor: pointer; font-family: inherit;
          background: #FFFBEB; color: #D97706; border: 1px solid #FDE68A;
          transition: all 0.15s; white-space: nowrap; flex-shrink: 0;
        }
        .unblock-btn:hover { background: #FEF3C7; }

        /* Activity */
        .activity-list { padding: 6px 0; }

        .activity-item {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 9px 16px; border-bottom: 1px solid #F8F8F8;
        }
        .activity-item:last-child { border-bottom: none; }

        .activity-emoji { font-size: 16px; flex-shrink: 0; margin-top: 1px; }

        .activity-body {
          flex: 1; font-size: 13px; line-height: 1.4; color: #5C5C5C;
        }

        .activity-user { font-weight: 600; color: #0a0a0a; }
        .activity-text { color: #5C5C5C; }
        .activity-entity { font-weight: 500; color: #1B2B4B; }

        .activity-time {
          font-size: 11px; color: #C0C0C0; white-space: nowrap; margin-top: 2px;
        }
      `}</style>
    </div>
  )
}

function TaskRow({ task, onComplete, completing, overdue, onTaskClick }: {
  task: Task
  onComplete: (id: string) => void
  completing: boolean
  overdue?: boolean
  onTaskClick: (t: Task) => void
}) {
  return (
    <div className={cn('task-row', overdue && 'task-row--overdue')}>
      <button
        className="task-check"
        onClick={() => onComplete(task.id)}
        disabled={completing}
        aria-label="Completar tasca"
      >
        {completing ? (
          <CheckCircle2 size={18} color="#16A34A" />
        ) : (
          <Circle size={18} strokeWidth={1.5} color={overdue ? '#DC2626' : '#C0C0C0'} />
        )}
      </button>
      <div className="task-info" onClick={() => onTaskClick(task)} style={{ cursor: 'pointer' }}>
        <div className="task-title">{task.title}</div>
        <div className="task-meta">
          {task.client?.name && <span className="task-client">{task.client.name}</span>}
          {task.deadline && (
            <span className={cn('task-deadline', overdue && 'task-deadline--overdue')}>
              <Clock size={10} />
              {new Date(task.deadline).toLocaleDateString('ca-ES', { day: '2-digit', month: 'short' })}
            </span>
          )}
        </div>
      </div>
      <span
        className="task-priority"
        style={{ color: priorityColor[task.priority], background: `${priorityColor[task.priority]}18` }}
      >
        {taskPriorityLabels[task.priority]}
      </span>

      <style jsx>{`
        .task-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 16px;
          border-bottom: 1px solid #F8F8F8;
          transition: background 0.1s;
        }

        .task-row:last-child { border-bottom: none; }
        .task-row:hover { background: #FAFAFA; }
        .task-row--overdue { background: #FFF5F5; }
        .task-row--overdue:hover { background: #FEF0F0; }

        .task-check {
          border: none;
          background: none;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          flex-shrink: 0;
          transition: transform 0.1s;
        }

        .task-check:hover { transform: scale(1.1); }

        .task-info { flex: 1; min-width: 0; }

        .task-title {
          font-size: 13.5px;
          font-weight: 500;
          color: #0a0a0a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .task-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 2px;
        }

        .task-client {
          font-size: 11.5px;
          color: #9A9A9A;
        }

        .task-deadline {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 11px;
          color: #9A9A9A;
        }

        .task-deadline--overdue { color: #DC2626; font-weight: 600; }

        .task-priority {
          font-size: 10.5px;
          font-weight: 600;
          padding: 2px 7px;
          border-radius: 4px;
          letter-spacing: 0.02em;
          white-space: nowrap;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  )
}
