'use client'

import { useState, useEffect } from 'react'
import { Plus, X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Loader2, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Project, Task } from '@/types'

const MONTHS_CA = ['Gener', 'Febrer', 'Març', 'Abril', 'Maig', 'Juny', 'Juliol', 'Agost', 'Setembre', 'Octubre', 'Novembre', 'Desembre']

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  planning:  { bg: '#F0F0F0', color: '#5C5C5C', label: 'Planificació' },
  active:    { bg: '#F0FDF4', color: '#16A34A', label: 'Actiu' },
  at_risk:   { bg: '#FFFBEB', color: '#D97706', label: 'En risc' },
  blocked:   { bg: '#FEF2F2', color: '#DC2626', label: 'Bloquejat' },
  completed: { bg: '#EFF6FF', color: '#1B2B4B', label: 'Completat' },
  archived:  { bg: '#F5F5F5', color: '#9A9A9A', label: 'Arxivat' },
}

const TASK_STATUS_COLORS: Record<string, string> = {
  inbox: '#9A9A9A',
  todo: '#6B7280',
  in_progress: '#2563EB',
  review: '#D97706',
  blocked: '#DC2626',
  done: '#16A34A',
}

const TASK_STATUS_LABELS: Record<string, string> = {
  inbox: 'Inbox',
  todo: 'Per fer',
  in_progress: 'En curs',
  review: 'Revisió',
  blocked: 'Bloquejat',
  done: 'Fet',
}

interface Props {
  clientId: string
  projects: Project[]
}

interface ProjectWithTasks extends Project {
  tasks?: Task[]
  tasksLoaded?: boolean
  expanded?: boolean
}

interface NewProjForm {
  name: string
  type: string
  status: string
}

export function AnnualPlan({ clientId, projects: initialProjects }: Props) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [projects, setProjects] = useState<ProjectWithTasks[]>(initialProjects)
  const [addingMonth, setAddingMonth] = useState<number | null>(null)
  const [form, setForm] = useState<NewProjForm>({ name: '', type: 'social_media', status: 'planning' })
  const [savingProj, setSavingProj] = useState(false)
  const [saveErr, setSaveErr] = useState<string | null>(null)

  // organize by month index
  const byMonth: Record<number, ProjectWithTasks[]> = {}
  const unplanned: ProjectWithTasks[] = []

  for (const p of projects) {
    const sd = p.start_date ? new Date(p.start_date + 'T12:00:00') : null
    if (sd && sd.getFullYear() === year) {
      const m = sd.getMonth()
      if (!byMonth[m]) byMonth[m] = []
      byMonth[m].push(p)
    } else if (!sd) {
      unplanned.push(p)
    }
  }

  const toggleExpand = async (projId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projId) return p
      const newExpanded = !p.expanded
      if (newExpanded && !p.tasksLoaded) {
        loadTasks(projId)
      }
      return { ...p, expanded: newExpanded }
    }))
  }

  const loadTasks = async (projId: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('tasks')
      .select('id, title, status, priority, deadline, responsible:profiles!tasks_responsible_id_fkey(id,full_name)')
      .eq('project_id', projId)
      .order('created_at', { ascending: true })
    setProjects(prev => prev.map(p =>
      p.id === projId ? { ...p, tasks: (data || []) as any[], tasksLoaded: true } : p
    ))
  }

  const handleAddProject = async (monthIdx: number) => {
    if (!form.name.trim()) return
    setSavingProj(true)
    setSaveErr(null)
    try {
      const supabase = createClient()
      const startDate = `${year}-${String(monthIdx + 1).padStart(2, '0')}-01`
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: form.name.trim(),
          client_id: clientId,
          type: form.type,
          status: form.status,
          start_date: startDate,
        })
        .select('id, name, type, status, start_date, end_date')
        .single()
      if (error) { setSaveErr(error.message); return }
      setProjects(prev => [...prev, data as ProjectWithTasks])
      setForm({ name: '', type: 'social_media', status: 'planning' })
      setAddingMonth(null)
    } finally {
      setSavingProj(false)
    }
  }

  return (
    <div className="plan-wrap">
      {/* Year nav */}
      <div className="plan-header">
        <div className="year-nav">
          <button className="yr-btn" onClick={() => setYear(y => y - 1)}><ChevronLeft size={15} /></button>
          <span className="yr-label">{year}</span>
          <button className="yr-btn" onClick={() => setYear(y => y + 1)}><ChevronRight size={15} /></button>
        </div>
        <span className="plan-note">{projects.length} projectes</span>
      </div>

      {/* Unplanned projects */}
      {unplanned.length > 0 && (
        <div className="unplanned-section">
          <div className="unplanned-title">Sense data planificada</div>
          <div className="unplanned-chips">
            {unplanned.map(p => {
              const sc = STATUS_COLORS[p.status] || STATUS_COLORS.planning
              return (
                <Link key={p.id} href={`/projects/${p.id}`} className="unplanned-chip" style={{ background: sc.bg, color: sc.color }}>
                  {p.name}
                  <ExternalLink size={10} />
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* 12-month grid */}
      <div className="months-grid">
        {MONTHS_CA.map((monthName, mi) => {
          const monthProjects = byMonth[mi] || []
          const isAdding = addingMonth === mi
          const isPast = mi < now.getMonth() && year === now.getFullYear()
          const isCurrent = mi === now.getMonth() && year === now.getFullYear()
          return (
            <div key={mi} className={`month-col${isCurrent ? ' month-col--current' : ''}${isPast ? ' month-col--past' : ''}`}>
              <div className="month-head">
                <span className="month-name">{monthName}</span>
                {isCurrent && <span className="month-now-dot" />}
                <button className="month-add-btn" onClick={() => { setAddingMonth(isAdding ? null : mi); setSaveErr(null); setForm({ name: '', type: 'social_media', status: 'planning' }) }}>
                  {isAdding ? <X size={11} /> : <Plus size={11} />}
                </button>
              </div>

              {/* Add form */}
              {isAdding && (
                <div className="month-add-form">
                  <input
                    className="add-input"
                    placeholder="Nom del projecte..."
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddProject(mi); if (e.key === 'Escape') setAddingMonth(null) }}
                    autoFocus
                  />
                  <select className="add-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    <option value="social_media">Social Media</option>
                    <option value="content">Contingut</option>
                    <option value="event">Esdeveniment</option>
                    <option value="matchday">Matchday</option>
                    <option value="campaign">Campanya</option>
                    <option value="reporting">Reporting</option>
                    <option value="custom">Personalitzat</option>
                  </select>
                  {saveErr && <div className="add-err">{saveErr}</div>}
                  <button
                    className="add-confirm"
                    onClick={() => handleAddProject(mi)}
                    disabled={savingProj || !form.name.trim()}
                  >
                    {savingProj ? <Loader2 size={11} className="spin" /> : null}
                    Crear projecte
                  </button>
                </div>
              )}

              {/* Projects in this month */}
              <div className="month-projects">
                {monthProjects.map(proj => {
                  const sc = STATUS_COLORS[proj.status] || STATUS_COLORS.planning
                  return (
                    <div key={proj.id} className="proj-card">
                      <div className="proj-card-header" onClick={() => toggleExpand(proj.id)}>
                        <div className="proj-info">
                          <span className="proj-name">{proj.name}</span>
                          <span className="proj-badge" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                        </div>
                        <div className="proj-actions">
                          <Link href={`/projects/${proj.id}`} className="proj-link" onClick={e => e.stopPropagation()} title="Obrir projecte">
                            <ExternalLink size={11} />
                          </Link>
                          {proj.expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </div>
                      </div>

                      {/* Tasks */}
                      {proj.expanded && (
                        <div className="proj-tasks">
                          {!proj.tasksLoaded ? (
                            <div className="tasks-loading"><Loader2 size={12} className="spin" /> Carregant...</div>
                          ) : proj.tasks && proj.tasks.length > 0 ? (
                            proj.tasks.map(t => (
                              <div key={t.id} className="task-row">
                                <span
                                  className="task-dot"
                                  style={{ background: TASK_STATUS_COLORS[t.status] || '#9A9A9A' }}
                                />
                                <span className="task-title">{t.title}</span>
                                <span className="task-status-label" style={{ color: TASK_STATUS_COLORS[t.status] || '#9A9A9A' }}>
                                  {TASK_STATUS_LABELS[t.status] || t.status}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="tasks-empty">Sense tasques</div>
                          )}
                          <Link href={`/projects/${proj.id}`} className="tasks-view-all">
                            Veure projecte complet →
                          </Link>
                        </div>
                      )}
                    </div>
                  )
                })}
                {monthProjects.length === 0 && !isAdding && (
                  <div className="month-empty">Cap projecte</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <style jsx>{`
        .plan-wrap { display: flex; flex-direction: column; gap: 16px; }

        .plan-header {
          display: flex; align-items: center; gap: 12px;
        }
        .year-nav { display: flex; align-items: center; gap: 8px; }
        .yr-btn {
          width: 30px; height: 30px; border: 1px solid #E8E8E8; background: white;
          border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center;
          color: #5C5C5C; transition: all 0.15s;
        }
        .yr-btn:hover { border-color: #1B2B4B; color: #1B2B4B; }
        .yr-label { font-size: 18px; font-weight: 700; color: #0a0a0a; min-width: 54px; text-align: center; }
        .plan-note { font-size: 12px; color: #9A9A9A; }

        .unplanned-section { background: #FAFAFA; border: 1px solid #F0F0F0; border-radius: 10px; padding: 12px 14px; }
        .unplanned-title { font-size: 10.5px; font-weight: 700; color: #9A9A9A; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px; }
        .unplanned-chips { display: flex; flex-wrap: wrap; gap: 6px; }
        .unplanned-chip {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 20px;
          text-decoration: none; transition: opacity 0.15s;
        }
        .unplanned-chip:hover { opacity: 0.8; }

        .months-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }
        @media (max-width: 1100px) { .months-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 700px) { .months-grid { grid-template-columns: repeat(2, 1fr); } }

        .month-col {
          background: white; border: 1px solid #F0F0F0; border-radius: 12px;
          padding: 12px; display: flex; flex-direction: column; gap: 8px;
          transition: border-color 0.2s;
        }
        .month-col--current { border-color: #1B2B4B; }
        .month-col--past { background: #FAFAFA; }

        .month-head {
          display: flex; align-items: center; gap: 6px; padding-bottom: 6px;
          border-bottom: 1px solid #F0F0F0;
        }
        .month-name { font-size: 12px; font-weight: 700; color: #0a0a0a; flex: 1; }
        .month-now-dot { width: 6px; height: 6px; border-radius: 50%; background: #1B2B4B; flex-shrink: 0; }
        .month-add-btn {
          width: 20px; height: 20px; border: 1px solid #E8E8E8; background: white;
          border-radius: 5px; cursor: pointer; display: flex; align-items: center;
          justify-content: center; color: #9A9A9A; transition: all 0.15s; flex-shrink: 0;
        }
        .month-add-btn:hover { border-color: #1B2B4B; color: #1B2B4B; }

        .month-add-form { display: flex; flex-direction: column; gap: 6px; }
        .add-input, .add-select {
          width: 100%; padding: 6px 8px; border: 1.5px solid #E0E0E0; border-radius: 7px;
          font-size: 12px; font-family: inherit; color: #0a0a0a; background: white; outline: none;
        }
        .add-input:focus, .add-select:focus { border-color: #1B2B4B; }
        .add-err { font-size: 11px; color: #DC2626; }
        .add-confirm {
          display: flex; align-items: center; justify-content: center; gap: 4px;
          width: 100%; height: 28px; background: #1B2B4B; color: white; border: none;
          border-radius: 7px; font-size: 12px; font-weight: 600; cursor: pointer;
          font-family: inherit; transition: background 0.15s;
        }
        .add-confirm:hover:not(:disabled) { background: #2563EB; }
        .add-confirm:disabled { background: #E0E0E0; color: #9A9A9A; cursor: not-allowed; }

        .month-projects { display: flex; flex-direction: column; gap: 6px; flex: 1; }
        .month-empty { font-size: 11px; color: #D0D0D0; text-align: center; padding: 12px 0; }

        .proj-card {
          border: 1px solid #F0F0F0; border-radius: 8px; overflow: hidden;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .proj-card:hover { border-color: rgba(27,43,75,0.2); box-shadow: 0 2px 8px rgba(0,0,0,0.06); }

        .proj-card-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 8px 10px; cursor: pointer; gap: 6px;
        }

        .proj-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
        .proj-name { font-size: 12px; font-weight: 600; color: #0a0a0a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .proj-badge { font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 20px; align-self: flex-start; }

        .proj-actions { display: flex; align-items: center; gap: 4px; color: #C0C0C0; flex-shrink: 0; }
        .proj-link {
          width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;
          border-radius: 4px; color: #C0C0C0; text-decoration: none; transition: all 0.15s;
        }
        .proj-link:hover { background: #EFF6FF; color: #1B2B4B; }

        .proj-tasks {
          padding: 4px 10px 10px; display: flex; flex-direction: column; gap: 4px;
          border-top: 1px solid #F5F5F5; background: #FAFAFA;
        }

        .tasks-loading { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #9A9A9A; padding: 4px 0; }
        .tasks-empty { font-size: 11px; color: #C0C0C0; padding: 4px 0; }

        .task-row { display: flex; align-items: center; gap: 6px; padding: 3px 0; }
        .task-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .task-title { font-size: 11.5px; color: #0a0a0a; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .task-status-label { font-size: 10px; font-weight: 600; flex-shrink: 0; }

        .tasks-view-all {
          font-size: 10.5px; color: #1B2B4B; text-decoration: none; font-weight: 600;
          margin-top: 2px; transition: opacity 0.15s;
        }
        .tasks-view-all:hover { opacity: 0.7; }

        :global(.spin) { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
