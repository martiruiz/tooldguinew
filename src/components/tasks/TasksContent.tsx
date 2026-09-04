'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Plus, List, Columns, Search, SlidersHorizontal, X, RefreshCw, AtSign, HelpCircle, AlertTriangle, Home, Laptop, Camera, Music, Monitor, ChevronRight, Zap, Star, Flag, Clock, Bell, Bookmark, BarChart2, Settings, Users, Mail, Phone, Globe, Package, Truck, Target, Layers, CheckSquare, FileText, Inbox, ArrowRight, Pencil, Heart, Smile, Coffee, Sun, Moon, Cloud, Flame, Leaf, Eye, Lock, Unlock, Key, Shield, Award, Gift, Lightbulb, MessageCircle, MessageSquare, Send, Rss, Wifi, Battery, Cpu, Database, Server, Code, Terminal, GitBranch, GitMerge, Scissors, Crop, PenTool, Palette, Image, Video, Headphones, Radio, Tv, Printer, Scan, Download, Upload, Link, ExternalLink, Anchor, Compass, Map, Navigation, Plane, Car, Bike, Bus, Train, Ship, Umbrella, Wind, Snowflake, Thermometer, Activity, Stethoscope, Pill, Apple, ShoppingCart, ShoppingBag, CreditCard, DollarSign, TrendingUp, TrendingDown, PieChart, Calendar, Grid, Layout, Maximize, Minimize, Move, Copy, Archive, Trash2, FolderOpen, Folder, HardDrive, Paperclip, Clipboard, Toolbox, Wrench, Hammer, Sliders, ToggleLeft, ToggleRight, ChevronUp, ChevronDown, ChevronsRight, ArrowUp, ArrowDown, RotateCcw, Repeat, Shuffle, Play, Pause, Square, Circle, Triangle, Hexagon, Octagon, AlignLeft, AlignCenter, Type, Hash, Percent, PlusCircle, MinusCircle, XCircle, AlertCircle, Info, ThumbsUp, ThumbsDown, Mic, Volume2, UserCheck, UserPlus, UserMinus, Briefcase, BookOpen, Book, GraduationCap, Feather, Edit3, ClipboardList, ClipboardCheck, MoreHorizontal, Sidebar, Tag } from 'lucide-react'
import { cn, taskStatusLabels, taskPriorityLabels, getInitials } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { NewTaskModal } from './NewTaskModal'
import { TaskDetailModal } from './TaskDetailModal'
import type { Task } from '@/types'

type View = 'kanban' | 'list'

const columns: { status: string; label: string; color: string }[] = [
  { status: 'inbox', label: 'Inbox', color: '#9A9A9A' },
  { status: 'todo', label: 'Per fer', color: '#DC2626' },
  { status: 'in_progress', label: 'En curs', color: '#1B2B4B' },
  { status: 'review', label: 'Revisió', color: '#D97706' },
  { status: 'blocked', label: 'Bloquejat', color: '#7C3AED' },
  { status: 'done', label: 'Fet', color: '#16A34A' },
]

const priorityColor: Record<string, string> = {
  urgent: '#DC2626', high: '#D97706', medium: '#1B2B4B', low: '#9A9A9A',
}

interface LabelDef { id: string; name: string; color: string }

interface Props {
  tasks: Task[]
  clients: { id: string; name: string }[]
  projects: { id: string; name: string }[]
  profiles: { id: string; full_name: string; avatar_url?: string }[]
  currentUserId: string
  allLabels?: LabelDef[]
}

const CHIP_COLORS = [
  { bg: '#1a3050', text: '#5b9bff' }, { bg: '#2a1a40', text: '#a87cff' },
  { bg: '#1a3a28', text: '#4dc47a' }, { bg: '#402010', text: '#e09040' },
  { bg: '#381820', text: '#e06070' }, { bg: '#182838', text: '#48a0c8' },
  { bg: '#2a2a10', text: '#c0b040' }, { bg: '#101838', text: '#6080d8' },
  { bg: '#301030', text: '#c060c0' }, { bg: '#102830', text: '#40b0b0' },
  { bg: '#303010', text: '#b0a840' }, { bg: '#280808', text: '#d04040' },
]

export function TasksContent({ tasks, clients, projects, profiles, currentUserId, allLabels = [] }: Props) {
  const [view, setView] = useState<View>('kanban')
  const [localTasks, setLocalTasks] = useState(tasks)
  const [showNew, setShowNew] = useState(false)
  const [newTaskStatus, setNewTaskStatus] = useState<Task['status']>('todo')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [search, setSearch] = useState('')
  const [showFilter, setShowFilter] = useState(false)
  // Filter state
  const [filterProjects, setFilterProjects] = useState<string[]>([])
  const [filterLabels, setFilterLabels] = useState<string[]>([])
  const [filterPersonId, setFilterPersonId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState('') // '' | 'open' | 'done'
  const [filterDeadline, setFilterDeadline] = useState('')
  const [filterWatcher, setFilterWatcher] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState('manual')
  // Popover open state for filter rows
  const [openPop, setOpenPop] = useState<string | null>(null)
  const [watcherSearch, setWatcherSearch] = useState('')

  // Realtime: escolta inserts de tasques noves (des de qualsevol lloc: sidebar, altres usuaris...)
  useEffect(() => {
    const supabase = createClient()
    const ch = supabase.channel('tasks-board-inserts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tasks' }, async payload => {
        const { data } = await supabase
          .from('tasks')
          .select('*, client:clients(id,name), project:projects(id,name), responsible:profiles!tasks_responsible_id_fkey(id,full_name)')
          .eq('id', payload.new.id)
          .single()
        if (!data) return
        setLocalTasks(prev => prev.some(t => t.id === data.id) ? prev : [data as Task, ...prev])
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  const today = new Date(); today.setHours(0,0,0,0)
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  const weekEnd = new Date(today); weekEnd.setDate(today.getDate() + 7)
  const twoWeeksEnd = new Date(today); twoWeeksEnd.setDate(today.getDate() + 14)
  const monthEnd = new Date(today); monthEnd.setDate(today.getDate() + 30)

  const filtered = useMemo(() => {
    let arr = localTasks.filter((t) => {
      const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase())
      const matchProject = filterProjects.length === 0 || filterProjects.includes((t.project as any)?.id)
      const matchPerson = !filterPersonId
        ? true
        : filterPersonId === '__unassigned__'
          ? !t.responsible_id
          : t.responsible_id === filterPersonId
      const matchStatus = !filterStatus
        ? true
        : filterStatus === 'open' ? t.status !== 'done'
        : filterStatus === 'done' ? t.status === 'done'
        : t.status === filterStatus
      const matchDeadline = !filterDeadline || (() => {
        if (!t.deadline) return filterDeadline === 'none'
        const d = new Date(t.deadline); d.setHours(0,0,0,0)
        if (filterDeadline === 'overdue') return d < today
        if (filterDeadline === 'today') return d.getTime() === today.getTime()
        if (filterDeadline === 'tomorrow') return d.getTime() === tomorrow.getTime()
        if (filterDeadline === 'week') return d >= today && d <= weekEnd
        if (filterDeadline === 'twoweeks') return d >= today && d <= twoWeeksEnd
        if (filterDeadline === 'month') return d >= today && d <= monthEnd
        return true
      })()
      const matchLabel = filterLabels.length === 0 || filterLabels.some(lid => ((t as any).labels || []).includes(lid))
      const matchWatcher = !filterWatcher || ((t as any).watcher_ids || []).includes(filterWatcher)
      return matchSearch && matchProject && matchPerson && matchStatus && matchDeadline && matchLabel && matchWatcher
    })

    if (sortBy === 'name') arr = [...arr].sort((a, b) => a.title.localeCompare(b.title))
    else if (sortBy === 'assignee') arr = [...arr].sort((a, b) => {
      const na = (a.responsible as any)?.full_name || 'zzz'
      const nb = (b.responsible as any)?.full_name || 'zzz'
      return na.localeCompare(nb)
    })
    else if (sortBy === 'created') arr = [...arr].sort((a, b) => ((a as any).created_at || '').localeCompare((b as any).created_at || ''))
    else if (sortBy === 'deadline') arr = [...arr].sort((a, b) => {
      if (!a.deadline && !b.deadline) return 0
      if (!a.deadline) return 1
      if (!b.deadline) return -1
      return a.deadline.localeCompare(b.deadline)
    })
    else if (sortBy === 'status') arr = [...arr].sort((a, b) => a.status.localeCompare(b.status))
    else if (sortBy === 'updated') arr = [...arr].sort((a, b) => ((b as any).updated_at || '').localeCompare((a as any).updated_at || ''))

    return arr
  }, [localTasks, search, filterProjects, filterPersonId, filterStatus, filterDeadline, filterLabels, filterWatcher, sortBy])

  // Person task counts (from ALL tasks, not filtered)
  const personCounts = useMemo(() => {
    const counts: Record<string, number> = { __unassigned__: 0 }
    localTasks.forEach(t => {
      if (!t.responsible_id) counts.__unassigned__++
      else counts[t.responsible_id] = (counts[t.responsible_id] || 0) + 1
    })
    return counts
  }, [localTasks])

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    setLocalTasks((prev) =>
      prev.map((t) => t.id === taskId ? { ...t, status: newStatus as Task['status'] } : t)
    )
    const supabase = createClient()
    await supabase.from('tasks').update({
      status: newStatus,
      completed_at: newStatus === 'done' ? new Date().toISOString() : null,
    }).eq('id', taskId)
  }

  const handleTaskCreated = (newTask: Task) => {
    setLocalTasks((prev) => [newTask, ...prev])
  }

  const handleTaskUpdated = (updated: Task) => {
    setLocalTasks((prev) => prev.map((t) => t.id === updated.id ? updated : t))
    setSelectedTask(updated)
  }

  const handleDeleteTask = async (taskId: string) => {
    setLocalTasks((prev) => prev.filter((t) => t.id !== taskId))
    const supabase = createClient()
    await supabase.from('tasks').delete().eq('id', taskId)
  }

  const hasFilters = filterProjects.length > 0 || filterLabels.length > 0 || filterPersonId || filterStatus || filterDeadline || filterWatcher || sortBy !== 'manual'

  const peopleList = [
    { id: '__unassigned__', label: 'Sense asig.', initials: '—', avatar_url: undefined as string | undefined },
    ...profiles.map(p => ({ id: p.id, label: p.full_name.split(' ')[0], initials: getInitials(p.full_name), avatar_url: p.avatar_url }))
  ].sort((a, b) => (personCounts[b.id] || 0) - (personCounts[a.id] || 0))

  const deadlineOptions = [
    { value: 'today', label: 'Avui' },
    { value: 'tomorrow', label: 'Demà' },
    { value: 'week', label: 'Dins d\'una setmana' },
    { value: 'twoweeks', label: 'Dins de dues setmanes' },
    { value: 'month', label: 'Dins d\'un mes' },
    { value: 'overdue', label: 'Endarrerit' },
    { value: 'none', label: 'Sense data límit' },
  ]

  const sortOptions = [
    { value: 'manual', label: 'Manual' },
    { value: 'name', label: 'Nom' },
    { value: 'assignee', label: 'Cessionari' },
    { value: 'created', label: 'Data de creació' },
    { value: 'deadline', label: 'Data de venciment' },
    { value: 'status', label: 'Estat' },
    { value: 'updated', label: 'Última modificació' },
  ]

  const [activityOpen, setActivityOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatUnread, setChatUnread] = useState(0)
  const [showPeopleCol, setShowPeopleCol] = useState(false)

  // Swipe from right edge → open people-col on mobile
  useEffect(() => {
    const touchStartX = { current: 0 }
    const touchStartY = { current: 0 }

    const onStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX
      touchStartY.current = e.touches[0].clientY
    }
    const onEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - touchStartX.current
      const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current)
      const w = window.innerWidth
      // Swipe left starting from right edge (≥ w-40) → open
      if (!showPeopleCol && touchStartX.current >= w - 40 && dx < -60 && dy < 80) {
        setShowPeopleCol(true)
      }
      // Swipe right on open panel → close
      if (showPeopleCol && dx > 60 && dy < 80) {
        setShowPeopleCol(false)
      }
    }
    document.addEventListener('touchstart', onStart, { passive: true })
    document.addEventListener('touchend', onEnd, { passive: true })
    return () => {
      document.removeEventListener('touchstart', onStart)
      document.removeEventListener('touchend', onEnd)
    }
  }, [showPeopleCol])

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail && typeof detail.open === 'boolean') setChatOpen(detail.open)
      else setChatOpen(v => !v)
    }
    window.addEventListener('toggle-team-chat', handler)
    return () => window.removeEventListener('toggle-team-chat', handler)
  }, [])

  useEffect(() => {
    const handler = (e: Event) => {
      const count = (e as CustomEvent).detail?.count || 0
      setChatUnread(count)
    }
    window.addEventListener('chat-unread-update', handler)
    return () => window.removeEventListener('chat-unread-update', handler)
  }, [])

  return (
    <div className="tasks-page">
      <div className="tasks-body">
        {/* Main area */}
        <div className="tasks-main">
          {/* Toolbar */}
          <div className="tasks-toolbar">
            <div className="search-wrap">
              <Search size={14} color="#9A9A9A" />
              <input type="text" placeholder="Buscar tasca..." value={search} onChange={(e) => setSearch(e.target.value)} className="search-input" />
            </div>
            <div className="view-toggle">
              <button className={cn('view-btn', view === 'kanban' && 'view-btn--active')} onClick={() => setView('kanban')} title="Kanban"><Columns size={14} /></button>
              <button className={cn('view-btn', view === 'list' && 'view-btn--active')} onClick={() => setView('list')} title="Llista"><List size={14} /></button>
            </div>
            <button className="btn-primary" onClick={() => { setNewTaskStatus('todo'); setShowNew(true) }}>
              <Plus size={14} strokeWidth={2.5} />Nova tasca
            </button>
          </div>

          {/* Views */}
          {view === 'kanban' ? (
            <KanbanView tasks={filtered} allLabels={allLabels} onStatusChange={handleStatusChange} onTaskClick={setSelectedTask}
              onDelete={handleDeleteTask}
              onColDoubleClick={(status) => { setNewTaskStatus(status as Task['status']); setShowNew(true) }} />
          ) : (
            <ListView tasks={filtered} allLabels={allLabels} onStatusChange={handleStatusChange} onTaskClick={setSelectedTask} onDelete={handleDeleteTask} />
          )}
        </div>

        {/* Filter panel (expandable) */}
        {showFilter && (
          <div className="filter-panel" onClick={e => { if ((e.target as HTMLElement).classList.contains('filter-panel')) setOpenPop(null) }}>
            <div className="fp-head">
              <span className="fp-title">Filtres</span>
              {hasFilters && (
                <button className="fp-clear" onClick={() => { setFilterProjects([]); setFilterPersonId(null); setFilterStatus(''); setFilterDeadline(''); setFilterLabels([]); setFilterWatcher(null); setSortBy('manual') }}>
                  Netejar
                </button>
              )}
            </div>

            <div className="fp-search-wrap">
              <Search size={13} color="#6C6C7E" />
              <input className="fp-search" placeholder="Buscar tasques..." value={search} onChange={e => setSearch(e.target.value)} autoFocus />
              {search && <button className="fp-search-clear" onClick={() => setSearch('')}><X size={11} /></button>}
            </div>

            {/* Etiquetes (projectes) */}
            <div className="fp-row">
              <Tag size={14} color="#6C6C7E" />
              <span className="fp-row-label">Etiquetes</span>
              <div className="fp-dropdown-wrap">
                <button className={`fp-dropdown-btn${openPop === 'labels' ? ' fp-dropdown-btn--open' : ''}`} onClick={() => setOpenPop(openPop === 'labels' ? null : 'labels')}>
                  {filterProjects.length > 0 ? `${filterProjects.length} sel.` : 'Totes'}
                  <ChevronDown size={11} />
                </button>
                {openPop === 'labels' && (
                  <div className="fp-pop">
                    {projects.map((p, i) => {
                      const col = CHIP_COLORS[i % CHIP_COLORS.length]
                      const active = filterProjects.includes(p.id)
                      return (
                        <button key={p.id} className={`fp-pop-item${active ? ' fp-pop-item--active' : ''}`} onClick={() => setFilterProjects(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])}>
                          {active && <CheckSquare size={13} color={col.text} />}
                          {!active && <Square size={13} color="#6C6C7E" />}
                          <span style={{ color: active ? col.text : '#D1D5DB' }}>{p.name}</span>
                        </button>
                      )
                    })}
                    {allLabels.map(lbl => {
                      const active = filterLabels.includes(lbl.id)
                      return (
                        <button key={lbl.id} className={`fp-pop-item${active ? ' fp-pop-item--active' : ''}`} onClick={() => setFilterLabels(prev => prev.includes(lbl.id) ? prev.filter(x => x !== lbl.id) : [...prev, lbl.id])}>
                          <span className="fp-pop-dot" style={{ background: lbl.color }} />
                          <span style={{ color: active ? lbl.color : '#D1D5DB' }}>{lbl.name}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
            {(filterProjects.length > 0 || filterLabels.length > 0) && (
              <div className="fp-chips">
                {filterProjects.map((pid, i) => {
                  const p = projects.find(x => x.id === pid)
                  const col = CHIP_COLORS[i % CHIP_COLORS.length]
                  return p ? <button key={pid} className="fp-chip fp-chip--active" style={{ background: col.bg, color: col.text, borderColor: col.text + '50' }} onClick={() => setFilterProjects(prev => prev.filter(x => x !== pid))}>{p.name.toUpperCase()} <X size={9} /></button> : null
                })}
                {filterLabels.map(lid => {
                  const lbl = allLabels.find(x => x.id === lid)
                  return lbl ? <button key={lid} className="fp-chip fp-chip--active" style={{ background: lbl.color + '25', color: lbl.color, borderColor: lbl.color + '70' }} onClick={() => setFilterLabels(prev => prev.filter(x => x !== lid))}><span className="fp-chip-dot" style={{ background: lbl.color }} />{lbl.name} <X size={9} /></button> : null
                })}
              </div>
            )}

            {/* Observat per */}
            <div className="fp-row">
              <Eye size={14} color="#6C6C7E" />
              <span className="fp-row-label">Observat per</span>
              <div className="fp-dropdown-wrap">
                <button className={`fp-dropdown-btn${openPop === 'watcher' ? ' fp-dropdown-btn--open' : ''}`} onClick={() => setOpenPop(openPop === 'watcher' ? null : 'watcher')}>
                  {filterWatcher ? (profiles.find(p => p.id === filterWatcher)?.full_name?.split(' ')[0] || 'Sel.') : 'Editar...'}
                  <ChevronDown size={11} />
                </button>
                {openPop === 'watcher' && (
                  <div className="fp-pop fp-pop--search">
                    <div className="fp-pop-search-row">
                      <Search size={12} color="#6C6C7E" />
                      <input autoFocus className="fp-pop-search-input" placeholder="Buscar persona..." value={watcherSearch} onChange={e => setWatcherSearch(e.target.value)} />
                    </div>
                    {filterWatcher && <button className="fp-pop-item" onClick={() => { setFilterWatcher(null); setOpenPop(null) }}><X size={12} color="#9CA3AF" /><span style={{ color: '#9CA3AF' }}>Netejar</span></button>}
                    {profiles.filter(p => p.full_name.toLowerCase().includes(watcherSearch.toLowerCase())).map(p => (
                      <button key={p.id} className={`fp-pop-item${filterWatcher === p.id ? ' fp-pop-item--active' : ''}`} onClick={() => { setFilterWatcher(p.id === filterWatcher ? null : p.id); setOpenPop(null) }}>
                        <div className="fp-pop-avatar">
                          {(p as any).avatar_url ? <img src={(p as any).avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : getInitials(p.full_name)}
                        </div>
                        <span style={{ color: '#D1D5DB' }}>{p.full_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Data límit */}
            <div className="fp-row">
              <Calendar size={14} color="#6C6C7E" />
              <span className="fp-row-label">Data límit</span>
              <div className="fp-dropdown-wrap">
                <button className={`fp-dropdown-btn${openPop === 'deadline' ? ' fp-dropdown-btn--open' : ''}`} onClick={() => setOpenPop(openPop === 'deadline' ? null : 'deadline')}>
                  {filterDeadline ? deadlineOptions.find(o => o.value === filterDeadline)?.label : 'Editar...'}
                  <ChevronDown size={11} />
                </button>
                {openPop === 'deadline' && (
                  <div className="fp-pop">
                    {filterDeadline && <button className="fp-pop-item" onClick={() => { setFilterDeadline(''); setOpenPop(null) }}><X size={12} color="#9CA3AF" /><span style={{ color: '#9CA3AF' }}>Netejar</span></button>}
                    {deadlineOptions.map(o => (
                      <button key={o.value} className={`fp-pop-item${filterDeadline === o.value ? ' fp-pop-item--active' : ''}`} onClick={() => { setFilterDeadline(o.value === filterDeadline ? '' : o.value); setOpenPop(null) }}>
                        {filterDeadline === o.value && <CheckSquare size={13} color="#60A5FA" />}
                        {filterDeadline !== o.value && <span style={{ width: 13 }} />}
                        {o.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Estat */}
            <div className="fp-row">
              <CheckSquare size={14} color="#6C6C7E" />
              <span className="fp-row-label">Estat</span>
              <div className="fp-dropdown-wrap">
                <button className={`fp-dropdown-btn${openPop === 'status' ? ' fp-dropdown-btn--open' : ''}`} onClick={() => setOpenPop(openPop === 'status' ? null : 'status')}>
                  {filterStatus === 'open' ? 'Oberta' : filterStatus === 'done' ? 'Acabada' : 'Editar...'}
                  <ChevronDown size={11} />
                </button>
                {openPop === 'status' && (
                  <div className="fp-pop">
                    {filterStatus && <button className="fp-pop-item" onClick={() => { setFilterStatus(''); setOpenPop(null) }}><X size={12} color="#9CA3AF" /><span style={{ color: '#9CA3AF' }}>Netejar</span></button>}
                    {[{ value: 'open', label: 'Oberta' }, { value: 'done', label: 'Acabada' }].map(o => (
                      <button key={o.value} className={`fp-pop-item${filterStatus === o.value ? ' fp-pop-item--active' : ''}`} onClick={() => { setFilterStatus(o.value === filterStatus ? '' : o.value); setOpenPop(null) }}>
                        {filterStatus === o.value && <CheckSquare size={13} color="#60A5FA" />}
                        {filterStatus !== o.value && <span style={{ width: 13 }} />}
                        {o.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Ordenar */}
            <div className="fp-row">
              <ArrowDown size={14} color="#6C6C7E" />
              <span className="fp-row-label">Ordenar per</span>
              <div className="fp-dropdown-wrap">
                <button className={`fp-dropdown-btn${openPop === 'sort' ? ' fp-dropdown-btn--open' : ''}`} onClick={() => setOpenPop(openPop === 'sort' ? null : 'sort')}>
                  {sortOptions.find(o => o.value === sortBy)?.label || 'Manual'}
                  <ChevronDown size={11} />
                </button>
                {openPop === 'sort' && (
                  <div className="fp-pop">
                    {sortOptions.map(o => (
                      <button key={o.value} className={`fp-pop-item${sortBy === o.value ? ' fp-pop-item--active' : ''}`} onClick={() => { setSortBy(o.value); setOpenPop(null) }}>
                        {sortBy === o.value && <CheckSquare size={13} color="#60A5FA" />}
                        {sortBy !== o.value && <span style={{ width: 13 }} />}
                        {o.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Filter overlay (mobile only) */}
        {showFilter && (
          <div className="filter-col-overlay" onClick={() => setShowFilter(false)} />
        )}

        {/* People col overlay (mobile only) */}
        {showPeopleCol && (
          <div className="people-col-overlay" onClick={() => setShowPeopleCol(false)} />
        )}

        {/* People column — always visible on desktop, swipe-open on mobile */}
        <div className={`people-col${showPeopleCol ? ' people-col--open' : ''}`}>
          <button className={cn('people-filter-btn', showFilter && 'people-filter-btn--active')} onClick={() => { setShowFilter(v => !v); setOpenPop(null) }} title="Filtres">
            <SlidersHorizontal size={13} />
            {hasFilters && <span className="filter-dot" />}
          </button>

          {/* Activity panel toggle */}
          <button className={cn('people-filter-btn', activityOpen && 'people-filter-btn--active')} onClick={() => { const next = !activityOpen; setActivityOpen(next); window.dispatchEvent(new CustomEvent('toggle-activity-panel', { detail: { open: next } })) }} title="Activitat global" style={{ marginTop: 4 }}>
            <Activity size={15} />
          </button>

          {/* Team chat toggle */}
          <button
            className={cn('people-filter-btn', chatOpen && 'people-filter-btn--chat')}
            onClick={() => { const next = !chatOpen; setChatOpen(next); setChatUnread(0); window.dispatchEvent(new CustomEvent('toggle-team-chat', { detail: { open: next } })) }}
            title="Xat d'equip"
            style={{ marginTop: 4, position: 'relative' }}
          >
            <MessageCircle size={15} />
            {chatUnread > 0 && !chatOpen && (
              <span style={{ position: 'absolute', top: 4, right: 4, minWidth: 14, height: 14, background: '#34D399', borderRadius: 7, fontSize: 9, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', lineHeight: 1 }}>
                {chatUnread > 9 ? '9+' : chatUnread}
              </span>
            )}
          </button>

          <div className="people-divider" />

          {peopleList.map(p => {
            const active = filterPersonId === p.id
            const count = personCounts[p.id] || 0
            return (
              <button key={p.id} className={`fp-person${active ? ' fp-person--active' : ''}`} onClick={() => setFilterPersonId(active ? null : p.id)} title={`${p.label} (${count})`}>
                <div className={`fp-avatar${active ? ' fp-avatar--active' : ''} ${p.id === '__unassigned__' ? 'fp-avatar--unassigned' : ''}`}>
                  {p.avatar_url
                    ? <img src={p.avatar_url} alt={p.label} className="fp-avatar-img" />
                    : p.initials
                  }
                </div>
                <span className="fp-person-name">{p.label}</span>
                <span className="fp-person-count">{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      {showNew && (
        <NewTaskModal
          clients={clients}
          projects={projects}
          profiles={profiles}
          currentUserId={currentUserId}
          defaultStatus={newTaskStatus}
          onClose={() => setShowNew(false)}
          onCreated={handleTaskCreated}
        />
      )}

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          profiles={profiles}
          clients={clients}
          projects={projects}
          currentUserId={currentUserId}
          onClose={() => setSelectedTask(null)}
          onUpdated={handleTaskUpdated}
        />
      )}

      <style jsx>{`
        .tasks-page { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .tasks-body { flex: 1; display: flex; overflow: hidden; }
        .tasks-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }

        .tasks-toolbar {
          display: flex; align-items: center; gap: 10px;
          padding: 16px 28px 12px; flex-wrap: wrap; flex-shrink: 0;
        }
        @media (max-width: 1023px) {
          .tasks-toolbar { padding: 12px 16px 8px; }
          .search-wrap { max-width: 100%; flex: 1; }
          .btn-primary { margin-left: auto; }
        }

        .search-wrap {
          display: flex; align-items: center; gap: 8px; height: 38px;
          padding: 0 13px; border: 1px solid rgba(0,0,0,0.08); border-radius: 10px;
          background: white; flex: 1; min-width: 160px; max-width: 240px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05); transition: border-color 0.15s, box-shadow 0.15s;
        }
        .search-wrap:focus-within { border-color: rgba(37,99,235,0.3); box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }
        .search-input { flex: 1; border: none; outline: none; font-size: 13.5px; color: #0F1B2D; background: transparent; }
        .search-input::placeholder { color: #C8D0DC; }

        .view-toggle { display: flex; border: 1px solid #E8E8E8; border-radius: 8px; overflow: hidden; }
        .view-btn { width: 34px; height: 34px; border: none; background: white; color: #9A9A9A; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; border-right: 1px solid #E8E8E8; }
        .view-btn:last-child { border-right: none; }
        .view-btn:hover { background: #F8F8F8; color: #0a0a0a; }
        .view-btn--active { background: #1B2B4B; color: white; }
        .view-btn--active:hover { background: #4A82C6; }

        .btn-primary { display: flex; align-items: center; gap: 6px; height: 38px; padding: 0 16px; background: linear-gradient(135deg, #1B2B4B, #2563EB); color: white; border: none; border-radius: 10px; font-size: 13.5px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; white-space: nowrap; box-shadow: 0 2px 8px rgba(37,99,235,0.3); }
        .btn-primary:hover { background: linear-gradient(135deg, #0F1E33, #1D4ED8); box-shadow: 0 4px 14px rgba(37,99,235,0.38); transform: translateY(-1px); }

        .btn-filter-toggle { position: relative; width: 34px; height: 34px; border: 1px solid #E8E8E8; border-radius: 8px; background: white; color: #9A9A9A; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
        .btn-filter-toggle:hover { background: #F8F8F8; color: #0a0a0a; }
        .btn-filter-toggle--active { background: #12121e; border-color: #2e2e4e; color: #8b8bff; }
        .filter-dot { position: absolute; top: 6px; right: 6px; width: 6px; height: 6px; background: #1B2B4B; border-radius: 50%; border: 1.5px solid white; }

        /* FILTER PANEL (expandable) */
        .filter-panel {
          width: 260px; min-width: 260px; background: #12121e;
          border-left: 1px solid #1e1e30; overflow-y: auto;
          display: flex; flex-direction: column; gap: 16px; padding: 16px 14px;
        }

        .fp-head { display: flex; align-items: center; justify-content: space-between; }
        .fp-title { font-size: 13px; font-weight: 700; color: #e0e0f0; }
        .fp-clear { font-size: 11px; color: #6c6c8c; background: none; border: none; cursor: pointer; padding: 2px 6px; border-radius: 4px; }
        .fp-clear:hover { color: #a0a0c0; }

        .fp-search-wrap { display: flex; align-items: center; gap: 7px; background: #1a1a2e; border: 1px solid #2a2a40; border-radius: 7px; padding: 0 9px; height: 32px; }
        .fp-search { flex: 1; background: none; border: none; outline: none; font-size: 12.5px; color: #c0c0d8; font-family: inherit; }
        .fp-search::placeholder { color: #4a4a60; }
        .fp-search-clear { background: none; border: none; cursor: pointer; color: #4a4a60; display: flex; padding: 2px; }
        .fp-search-clear:hover { color: #8a8aaa; }

        .fp-section { display: flex; flex-direction: column; gap: 7px; }
        .fp-section-label { font-size: 10px; font-weight: 700; color: #4a4a6a; letter-spacing: 0.07em; text-transform: uppercase; }
        .fp-chips { display: flex; flex-wrap: wrap; gap: 4px; }
        .fp-chip { font-size: 9.5px; font-weight: 700; letter-spacing: 0.04em; padding: 3px 7px; border-radius: 5px; border: 1px solid; cursor: pointer; transition: all 0.12s; font-family: inherit; }
        .fp-chip:hover { opacity: 0.85; }
        .fp-chip--label { display: flex; align-items: center; gap: 5px; }
        .fp-chip-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; transition: background 0.12s; }
        .fp-row-label { font-size: 10px; font-weight: 700; color: #4a4a6a; letter-spacing: 0.07em; text-transform: uppercase; }
        .fp-select { width: 100%; background: #1a1a2e; border: 1px solid #2a2a40; border-radius: 7px; padding: 6px 9px; font-size: 12px; color: #c0c0d8; outline: none; cursor: pointer; font-family: inherit; }
        .fp-select option { background: #1a1a2e; }

        /* People col mobile overlay */
        .people-col-overlay {
          display: none;
        }
        @media (max-width: 1023px) {
          .people-col-overlay {
            display: block;
            position: fixed; inset: 0; background: rgba(0,0,0,0.45);
            z-index: 149; backdrop-filter: blur(2px);
          }
        }

        /* People column */
        .people-col {
          width: 68px; min-width: 68px; background: #12121e;
          border-left: 1px solid #1e1e30; overflow-y: auto;
          display: flex; flex-direction: column; align-items: center;
          padding: 10px 0 16px; gap: 2px;
        }
        @media (max-width: 1023px) {
          .people-col {
            position: fixed; top: 0; right: 0; bottom: 0;
            z-index: 150; transform: translateX(100%);
            transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            border-left: 1px solid #2a2a40;
          }
          .people-col--open {
            transform: translateX(0);
          }
        }

        /* Filter panel mobile */
        .filter-col-overlay {
          display: none;
        }
        @media (max-width: 1023px) {
          .filter-col-overlay {
            display: block;
            position: fixed; inset: 0; background: rgba(0,0,0,0.45);
            z-index: 149; backdrop-filter: blur(2px);
          }
          .filter-panel {
            position: fixed; top: 0; left: 0; bottom: 0;
            z-index: 150; width: 280px; min-width: 280px;
          }
        }

        .people-filter-btn {
          position: relative; width: 36px; height: 36px; border-radius: 9px;
          background: #1a1a2e; border: 1px solid #2a2a3e; color: #6c6c8c;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          margin-bottom: 8px; transition: all 0.12s;
        }
        .people-filter-btn:hover { background: #22223a; color: #a0a0cc; }
        .people-filter-btn--active { background: #1a1a4a; border-color: #3a3a7a; color: #8b8bff; }
        .people-filter-btn--chat { background: #0d2a1e; border-color: #1a4a30; color: #34D399; }
        .filter-dot { position: absolute; top: 5px; right: 5px; width: 6px; height: 6px; background: #1B2B4B; border-radius: 50%; border: 1.5px solid #12121e; }

        .fp-person { display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 6px 4px; background: none; border: none; cursor: pointer; border-radius: 8px; transition: background 0.12s; width: 100%; }
        .fp-person:hover { background: #1a1a2e; }
        .fp-person--active { background: #1a1a3a; }
        .fp-avatar { width: 34px; height: 34px; border-radius: 50%; background: #2a2a3e; color: #8888aa; font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; border: 2px solid transparent; transition: all 0.12s; overflow: hidden; }
        .fp-avatar--active { background: #1B2B4B30; color: #5b9bff; border-color: #1B2B4B60; }
        .fp-avatar-img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
        .fp-person-name { font-size: 9px; color: #5c5c7c; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 60px; text-align: center; }
        .fp-person-count { font-size: 10px; font-weight: 700; color: #4a4a6a; }
        .fp-person--active .fp-person-name { color: #8888cc; }
        .fp-person--active .fp-person-count { color: #5b9bff; }
        .fp-avatar--unassigned { background: #1e1e2e; color: #4a4a6a; border-style: dashed; border-color: #3a3a5a; font-size: 14px; }

        /* New filter row styles */
        .fp-row { display: flex; align-items: center; gap: 8px; padding: 0 2px; }
        .fp-row-label { font-size: 12px; color: #8888aa; flex: 1; min-width: 0; }
        .fp-dropdown-wrap { position: relative; flex-shrink: 0; }
        .fp-dropdown-btn { display: flex; align-items: center; gap: 4px; background: #1a1a2e; border: 1px solid #2a2a40; border-radius: 6px; padding: 4px 8px; font-size: 11px; color: #9090b0; cursor: pointer; font-family: inherit; transition: all 0.12s; white-space: nowrap; max-width: 110px; overflow: hidden; text-overflow: ellipsis; }
        .fp-dropdown-btn:hover { border-color: #3a3a58; color: #c0c0d8; }
        .fp-dropdown-btn--open { border-color: #5050a0; color: #a0a0d8; background: #1a1a3a; }
        .fp-pop { position: absolute; right: 0; top: calc(100% + 4px); min-width: 180px; background: #1a1a2e; border: 1px solid #2e2e48; border-radius: 9px; padding: 4px; z-index: 300; box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
        .fp-pop--search { min-width: 210px; }
        .fp-pop-search-row { display: flex; align-items: center; gap: 7px; padding: 6px 10px; border-bottom: 1px solid #2a2a3e; margin-bottom: 4px; }
        .fp-pop-search-input { flex: 1; background: none; border: none; outline: none; font-size: 12px; color: #c0c0d8; font-family: inherit; }
        .fp-pop-search-input::placeholder { color: #4a4a60; }
        .fp-pop-item { display: flex; align-items: center; gap: 8px; width: 100%; padding: 7px 10px; background: none; border: none; border-radius: 6px; font-size: 12px; color: #9090b0; cursor: pointer; font-family: inherit; text-align: left; transition: background 0.1s; }
        .fp-pop-item:hover { background: #22223a; color: #c0c0d8; }
        .fp-pop-item--active { color: #c0c0d8; }
        .fp-pop-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .fp-pop-avatar { width: 22px; height: 22px; border-radius: 50%; background: #2a2a3e; color: #8888aa; font-size: 9px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; }

        /* People divider */
        .people-divider { width: 32px; height: 1px; background: #2a2a3e; margin: 6px 0; }

        /* Chip close icon */
        .fp-chip { display: inline-flex; align-items: center; gap: 4px; }
      `}</style>
    </div>
  )
}

const ICON_OPTIONS: { key: string; Icon: React.ComponentType<{ size?: number; color?: string }> }[] = [
  // Status / workflow
  { key: 'Inbox', Icon: Inbox }, { key: 'CheckSquare', Icon: CheckSquare },
  { key: 'RefreshCw', Icon: RefreshCw }, { key: 'HelpCircle', Icon: HelpCircle },
  { key: 'AlertTriangle', Icon: AlertTriangle }, { key: 'Star', Icon: Star },
  { key: 'Flag', Icon: Flag }, { key: 'Target', Icon: Target },
  { key: 'Play', Icon: Play }, { key: 'Pause', Icon: Pause },
  { key: 'ClipboardCheck', Icon: ClipboardCheck }, { key: 'ClipboardList', Icon: ClipboardList },
  { key: 'RotateCcw', Icon: RotateCcw }, { key: 'Repeat', Icon: Repeat },
  { key: 'Shuffle', Icon: Shuffle }, { key: 'ChevronsRight', Icon: ChevronsRight },
  // Communication
  { key: 'Mail', Icon: Mail }, { key: 'MessageCircle', Icon: MessageCircle },
  { key: 'MessageSquare', Icon: MessageSquare }, { key: 'Send', Icon: Send },
  { key: 'Bell', Icon: Bell }, { key: 'AtSign', Icon: AtSign },
  { key: 'Phone', Icon: Phone }, { key: 'Mic', Icon: Mic },
  { key: 'Volume2', Icon: Volume2 }, { key: 'Rss', Icon: Rss },
  // People
  { key: 'Users', Icon: Users }, { key: 'UserCheck', Icon: UserCheck },
  { key: 'UserPlus', Icon: UserPlus }, { key: 'UserMinus', Icon: UserMinus },
  { key: 'Briefcase', Icon: Briefcase }, { key: 'GraduationCap', Icon: GraduationCap },
  // Content / media
  { key: 'Camera', Icon: Camera }, { key: 'Image', Icon: Image },
  { key: 'Video', Icon: Video }, { key: 'Music', Icon: Music },
  { key: 'Headphones', Icon: Headphones }, { key: 'Tv', Icon: Tv },
  { key: 'Radio', Icon: Radio }, { key: 'FileText', Icon: FileText },
  { key: 'BookOpen', Icon: BookOpen }, { key: 'Book', Icon: Book },
  { key: 'Edit3', Icon: Edit3 }, { key: 'Feather', Icon: Feather },
  { key: 'PenTool', Icon: PenTool }, { key: 'Palette', Icon: Palette },
  { key: 'Type', Icon: Type }, { key: 'Hash', Icon: Hash },
  // Tech
  { key: 'Laptop', Icon: Laptop }, { key: 'Monitor', Icon: Monitor },
  { key: 'Cpu', Icon: Cpu }, { key: 'Database', Icon: Database },
  { key: 'Server', Icon: Server }, { key: 'Code', Icon: Code },
  { key: 'Terminal', Icon: Terminal }, { key: 'GitBranch', Icon: GitBranch },
  { key: 'GitMerge', Icon: GitMerge }, { key: 'Wifi', Icon: Wifi },
  { key: 'Globe', Icon: Globe }, { key: 'Link', Icon: Link },
  // Business
  { key: 'BarChart2', Icon: BarChart2 }, { key: 'TrendingUp', Icon: TrendingUp },
  { key: 'TrendingDown', Icon: TrendingDown }, { key: 'PieChart', Icon: PieChart },
  { key: 'DollarSign', Icon: DollarSign }, { key: 'CreditCard', Icon: CreditCard },
  { key: 'ShoppingCart', Icon: ShoppingCart }, { key: 'ShoppingBag', Icon: ShoppingBag },
  { key: 'Package', Icon: Package }, { key: 'Truck', Icon: Truck },
  { key: 'Archive', Icon: Archive }, { key: 'Clipboard', Icon: Clipboard },
  // Tools
  { key: 'Settings', Icon: Settings }, { key: 'Toolbox', Icon: Toolbox },
  { key: 'Wrench', Icon: Wrench }, { key: 'Hammer', Icon: Hammer },
  { key: 'Scissors', Icon: Scissors }, { key: 'Sliders', Icon: Sliders },
  { key: 'Key', Icon: Key }, { key: 'Lock', Icon: Lock },
  { key: 'Shield', Icon: Shield }, { key: 'Layers', Icon: Layers },
  { key: 'Grid', Icon: Grid }, { key: 'Layout', Icon: Layout },
  // Nature / lifestyle
  { key: 'Home', Icon: Home }, { key: 'Heart', Icon: Heart },
  { key: 'Smile', Icon: Smile }, { key: 'Coffee', Icon: Coffee },
  { key: 'Sun', Icon: Sun }, { key: 'Moon', Icon: Moon },
  { key: 'Flame', Icon: Flame }, { key: 'Leaf', Icon: Leaf },
  { key: 'Cloud', Icon: Cloud }, { key: 'Umbrella', Icon: Umbrella },
  { key: 'Wind', Icon: Wind }, { key: 'Snowflake', Icon: Snowflake },
  // Navigation / location
  { key: 'Compass', Icon: Compass }, { key: 'Map', Icon: Map },
  { key: 'Navigation', Icon: Navigation }, { key: 'Plane', Icon: Plane },
  { key: 'Car', Icon: Car }, { key: 'Bike', Icon: Bike },
  // Actions
  { key: 'Zap', Icon: Zap }, { key: 'Award', Icon: Award },
  { key: 'Gift', Icon: Gift }, { key: 'Lightbulb', Icon: Lightbulb },
  { key: 'Bookmark', Icon: Bookmark }, { key: 'Eye', Icon: Eye },
  { key: 'ThumbsUp', Icon: ThumbsUp }, { key: 'ThumbsDown', Icon: ThumbsDown },
  { key: 'Download', Icon: Download }, { key: 'Upload', Icon: Upload },
  { key: 'ArrowUp', Icon: ArrowUp }, { key: 'ArrowDown', Icon: ArrowDown },
  { key: 'ArrowRight', Icon: ArrowRight }, { key: 'Calendar', Icon: Calendar },
  { key: 'Clock', Icon: Clock }, { key: 'Percent', Icon: Percent },
  { key: 'Info', Icon: Info }, { key: 'AlertCircle', Icon: AlertCircle },
  { key: 'PlusCircle', Icon: PlusCircle }, { key: 'XCircle', Icon: XCircle },
]
const DEFAULT_COL_ICONS: Record<string, string> = { inbox: 'Inbox', todo: 'CheckSquare', in_progress: 'RefreshCw', review: 'HelpCircle', blocked: 'AlertTriangle', done: 'Star' }
const COL_COLORS = ['#2196F3','#00BCD4','#3F51B5','#9C27B0','#E91E63','#F44336','#FF9800','#FFC107','#4CAF50','#388E3C','#616161','#9E9E9E']

function KanbanView({ tasks, allLabels, onStatusChange, onTaskClick, onDelete, onColDoubleClick }: { tasks: Task[]; allLabels: LabelDef[]; onStatusChange: (id: string, status: string) => void; onTaskClick: (t: Task) => void; onDelete: (id: string) => void; onColDoubleClick: (status: string) => void }) {
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<string | null>(null)
  const [editingCol, setEditingCol] = useState<string | null>(null)
  const [editingLabelStatus, setEditingLabelStatus] = useState<string | null>(null)
  const [colCustom, setColCustom] = useState<Record<string, { color: string; icon: string; label?: string }>>(() => {
    if (typeof window === 'undefined') return {}
    try { return JSON.parse(localStorage.getItem('kanban-col-custom') || '{}') } catch { return {} }
  })
  const boardRef = useRef<HTMLDivElement>(null)
  const isMouseScrolling = useRef(false)
  const startX = useRef(0)
  const scrollLeft = useRef(0)

  const saveColCustom = (status: string, patch: Partial<{ color: string; icon: string }>) => {
    const col = columns.find(c => c.status === status)!
    const current = colCustom[status] || { color: col.color, icon: DEFAULT_COL_ICONS[status] || '📋' }
    const next = { ...colCustom, [status]: { ...current, ...patch } }
    setColCustom(next)
    localStorage.setItem('kanban-col-custom', JSON.stringify(next))
  }

  const getColStyle = (status: string) => {
    const col = columns.find(c => c.status === status)!
    const custom = colCustom[status]
    const iconKey = custom?.icon || DEFAULT_COL_ICONS[status] || 'RefreshCw'
    const iconDef = ICON_OPTIONS.find(i => i.key === iconKey) || ICON_OPTIONS[0]
    return { color: custom?.color || col.color, iconKey, Icon: iconDef.Icon }
  }

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = boardRef.current
    if (!el || (e.target as HTMLElement).closest('.kanban-card')) return
    isMouseScrolling.current = true
    startX.current = e.pageX - el.offsetLeft
    scrollLeft.current = el.scrollLeft
    el.style.cursor = 'grabbing'
    el.style.userSelect = 'none'
  }

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMouseScrolling.current || !boardRef.current) return
    e.preventDefault()
    const x = e.pageX - boardRef.current.offsetLeft
    const walk = (x - startX.current) * 1.2
    boardRef.current.scrollLeft = scrollLeft.current - walk
  }

  const onMouseUp = () => {
    isMouseScrolling.current = false
    if (boardRef.current) {
      boardRef.current.style.cursor = 'grab'
      boardRef.current.style.userSelect = ''
    }
  }

  const handleDrop = (status: string) => {
    if (draggedId && draggedId !== status) {
      const task = tasks.find((t) => t.id === draggedId)
      if (task && task.status !== status) {
        onStatusChange(draggedId, status)
      }
    }
    setDraggedId(null)
    setDragOverCol(null)
  }

  return (
    <div
      className="kanban"
      ref={boardRef}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      style={{ cursor: 'grab' }}
    >
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.status)
        const isOver = dragOverCol === col.status
        return (
          <div
            key={col.status}
            className={`kanban-col${isOver ? ' kanban-col--over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.status) }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverCol(null)
            }}
            onDrop={() => handleDrop(col.status)}
            onDoubleClick={() => onColDoubleClick(col.status)}
          >
            {(() => {
              const cs = getColStyle(col.status)
              const { Icon } = cs
              const isEdit = editingCol === col.status
              return (
                <div className="kanban-col-header" style={{ background: cs.color }}>
                  <button className="kcol-icon-btn" onClick={e => { e.stopPropagation(); setEditingCol(isEdit ? null : col.status) }} title="Editar columna">
                    <Icon size={15} color="white" />
                  </button>
                  {editingLabelStatus === col.status ? (
                    <input
                      className="kcol-label-input"
                      defaultValue={colCustom[col.status]?.label || col.label}
                      autoFocus
                      onClick={e => e.stopPropagation()}
                      onBlur={e => {
                        const val = e.target.value.trim() || col.label
                        saveColCustom(col.status, { label: val } as any)
                        setEditingLabelStatus(null)
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                        if (e.key === 'Escape') setEditingLabelStatus(null)
                      }}
                    />
                  ) : (
                    <span
                      className="kcol-label"
                      onClick={e => { e.stopPropagation(); setEditingLabelStatus(col.status) }}
                      title="Clic per canviar el nom"
                    >
                      {colCustom[col.status]?.label || col.label}
                    </span>
                  )}
                  <span className="kcol-count">{colTasks.length}</span>
                  {isEdit && (
                    <div className="kcol-editor" onClick={e => e.stopPropagation()}>
                      <div className="kcol-editor-hdr">
                        <span className="kcol-editor-title">Icona de la secció</span>
                        <button className="kcol-editor-close" onClick={() => setEditingCol(null)}><X size={13} /></button>
                      </div>
                      <div className="kcol-icon-grid">
                        {ICON_OPTIONS.map(({ key, Icon: Ic }) => (
                          <button key={key} className={`kcol-icon-opt${cs.iconKey === key ? ' kcol-icon-opt--on' : ''}`} onClick={() => saveColCustom(col.status, { icon: key })}>
                            <Ic size={16} />
                          </button>
                        ))}
                      </div>
                      <div className="kcol-color-row">
                        {COL_COLORS.map(c => (
                          <button key={c} className={`kcol-circle${cs.color === c ? ' kcol-circle--on' : ''}`} style={{ background: c }} onClick={() => saveColCustom(col.status, { color: c })} />
                        ))}
                        <label className="kcol-circle kcol-circle--custom" title="Color personalitzat" style={{ background: cs.color, border: '2px dashed rgba(255,255,255,0.6)' }}>
                          <input type="color" value={cs.color} onChange={e => saveColCustom(col.status, { color: e.target.value })} style={{ opacity: 0, position: 'absolute', width: 0, height: 0 }} />
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}

            <div className="kanban-col-body">
              {colTasks.length === 0 ? (
                <div className={`kanban-empty${isOver ? ' kanban-empty--over' : ''}`}>
                  {isOver ? 'Deixa aquí' : 'Cap tasca'}
                </div>
              ) : (
                colTasks.map((task) => (
                  <KanbanCard
                    key={task.id}
                    task={task}
                    allLabels={allLabels}
                    isDragging={draggedId === task.id}
                    onDragStart={() => setDraggedId(task.id)}
                    onDragEnd={() => { setDraggedId(null); setDragOverCol(null) }}
                    onStatusChange={onStatusChange}
                    onClick={() => onTaskClick(task)}
                    onDelete={onDelete}
                  />
                ))
              )}
            </div>
          </div>
        )
      })}

      <style jsx>{`
        .kanban {
          display: flex;
          gap: 12px;
          padding: 4px 28px 32px;
          overflow-x: auto;
          flex: 1;
          -webkit-overflow-scrolling: touch;
        }

        @media (max-width: 1023px) { .kanban { padding: 4px 16px 80px; } }

        .kanban-col {
          width: 260px;
          min-width: 260px;
          display: flex;
          flex-direction: column;
          background: #F4F4F4;
          border-radius: 12px;
          overflow: hidden;
          transition: background 0.15s, outline 0.15s;
        }
        .kanban-col--over {
          background: #EEF4FF;
          outline: 2px dashed #1B2B4B60;
          outline-offset: -2px;
        }

        .kanban-col-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 11px 12px 11px 14px;
          border-radius: 10px 10px 0 0;
          position: relative;
          transition: background 0.2s;
        }
        .kcol-icon-btn {
          background: rgba(0,0,0,0.15); border: none; border-radius: 6px;
          width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;
          cursor: pointer; flex-shrink: 0; transition: background 0.15s;
        }
        .kcol-icon-btn:hover { background: rgba(0,0,0,0.28); }
        .kcol-label { font-size: 12.5px; font-weight: 700; color: white; flex: 1; letter-spacing: 0.01em; text-shadow: 0 1px 2px rgba(0,0,0,0.15); cursor: text; }
        .kcol-label-input { font-size: 12.5px; font-weight: 700; color: white; flex: 1; background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.5); border-radius: 4px; padding: 1px 5px; outline: none; width: 100%; min-width: 0; }
        .kcol-count {
          font-size: 11.5px; font-weight: 700; color: white;
          background: rgba(0,0,0,0.18); padding: 1px 8px; border-radius: 10px;
        }

        /* Editor popover */
        .kcol-editor {
          position: absolute; top: calc(100% + 8px); left: 0; z-index: 200;
          background: white; border: 1px solid #E8E8E8; border-radius: 14px;
          padding: 16px; width: 280px; box-shadow: 0 12px 32px rgba(0,0,0,0.14);
          display: flex; flex-direction: column; gap: 14px;
        }
        .kcol-editor-hdr {
          display: flex; align-items: center; justify-content: space-between;
        }
        .kcol-editor-title { font-size: 13px; font-weight: 700; color: #0a0a0a; }
        .kcol-editor-close {
          width: 22px; height: 22px; border: none; background: #F0F0F0; border-radius: 5px;
          cursor: pointer; display: flex; align-items: center; justify-content: center; color: #5C5C5C;
        }
        .kcol-editor-close:hover { background: #E0E0E0; }

        .kcol-icon-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; max-height: 200px; overflow-y: auto; }
        .kcol-icon-opt {
          width: 100%; aspect-ratio: 1; border: 1.5px solid #ECECEC; border-radius: 8px;
          background: white; cursor: pointer; display: flex;
          align-items: center; justify-content: center; transition: all 0.1s; color: #5C5C5C;
        }
        .kcol-icon-opt:hover { background: #F4F4F4; border-color: #D0D0D0; color: #0a0a0a; }
        .kcol-icon-opt--on { background: #EEF4FF; border-color: #4A82C6; color: #4A82C6; }

        .kcol-color-row { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
        .kcol-circle {
          width: 100%; aspect-ratio: 1; border-radius: 50%; border: 2.5px solid transparent;
          cursor: pointer; transition: transform 0.1s; position: relative; flex-shrink: 0;
        }
        .kcol-circle:hover { transform: scale(1.15); }
        .kcol-circle--on { border-color: white; box-shadow: 0 0 0 2.5px #1B2B4B; }
        .kcol-circle--custom { overflow: hidden; }

        .kanban-col-body {
          padding: 6px 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          overflow-y: auto;
          max-height: calc(100vh - 200px);
          min-height: 48px;
        }

        .kanban-empty {
          font-size: 12px;
          color: #C0C0C0;
          text-align: center;
          padding: 20px 0;
          border-radius: 8px;
          transition: all 0.15s;
        }
        .kanban-empty--over {
          color: #1B2B4B;
          background: #1B2B4B0A;
        }
      `}</style>
    </div>
  )
}

function StatusBadge({ status, taskId, onStatusChange }: { status: string; taskId: string; onStatusChange: (id: string, s: string) => void }) {
  const [open, setOpen] = useState(false)
  const col = columns.find((c) => c.status === status)!

  return (
    <div className="sb-wrap" onMouseLeave={() => setOpen(false)}>
      <button
        className="sb-badge"
        style={{ color: col.color, background: `${col.color}18`, borderColor: `${col.color}30` }}
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
        onDragStart={(e) => e.stopPropagation()}
      >
        <span className="sb-dot" style={{ background: col.color }} />
        {col.label}
      </button>
      {open && (
        <div className="sb-dropdown" onClick={(e) => e.stopPropagation()}>
          {columns.map((c) => (
            <button
              key={c.status}
              className={`sb-option${c.status === status ? ' sb-option--active' : ''}`}
              onClick={() => { onStatusChange(taskId, c.status); setOpen(false) }}
            >
              <span className="sb-dot" style={{ background: c.color }} />
              <span style={{ color: c.color, fontWeight: c.status === status ? 700 : 500 }}>{c.label}</span>
            </button>
          ))}
        </div>
      )}

      <style jsx>{`
        .sb-wrap { position: relative; }

        .sb-badge {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 10.5px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 20px;
          border: 1px solid;
          cursor: pointer;
          font-family: inherit;
          white-space: nowrap;
          transition: opacity 0.15s;
        }
        .sb-badge:hover { opacity: 0.8; }

        .sb-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .sb-dropdown {
          position: absolute;
          bottom: calc(100% + 6px);
          right: 0;
          background: white;
          border: 1px solid #E8E8E8;
          border-radius: 10px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
          z-index: 100;
          padding: 4px;
          min-width: 130px;
        }

        .sb-option {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 7px 10px;
          border: none;
          background: transparent;
          cursor: pointer;
          border-radius: 7px;
          font-size: 12.5px;
          font-family: inherit;
          text-align: left;
          transition: background 0.1s;
        }
        .sb-option:hover { background: #F5F5F5; }
        .sb-option--active { background: #F5F5F5; }
      `}</style>
    </div>
  )
}

function KanbanCard({ task, allLabels, isDragging, onDragStart, onDragEnd, onStatusChange, onClick, onDelete }: {
  task: Task
  allLabels: LabelDef[]
  isDragging: boolean
  onDragStart: () => void
  onDragEnd: () => void
  onStatusChange: (id: string, status: string) => void
  onClick: () => void
  onDelete: (id: string) => void
}) {
  const client = task.client as any
  const responsible = task.responsible as any
  const taskAny = task as any
  const taskLabels = allLabels.filter(l => (taskAny.labels || []).includes(l.id))
  const photos = (taskAny.photos || []) as { id: string; url: string; name: string }[]
  const checkTotal = (taskAny.checklist || []).length
  const checkDone = (taskAny.checklist || []).filter((c: any) => c.done).length
  const today = new Date(); today.setHours(0,0,0,0)
  const deadline = task.deadline ? new Date(task.deadline) : null
  const isOverdue = deadline && deadline < today && task.status !== 'done'
  const isToday = deadline && deadline.getTime() === today.getTime()

  return (
    <div
      className={`kcard${isDragging ? ' kcard--dragging' : ''}`}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
    >
      {/* Top row: title + avatar + delete */}
      <div className="kcard-top">
        <div className="kcard-title">{task.title}</div>
        <div className="kcard-top-right">
          <button
            className="kcard-del"
            title="Eliminar tasca"
            onClick={(e) => { e.stopPropagation(); onDelete(task.id) }}
          >
            <Trash2 size={13} />
          </button>
          {responsible
            ? <div className="kcard-avatar" title={responsible.full_name}>
                {responsible.avatar_url
                  ? <img src={responsible.avatar_url} alt="" />
                  : getInitials(responsible.full_name)}
              </div>
            : null
          }
        </div>
      </div>

      {/* Client subtitle */}
      {client && <span className="kcard-client">{client.name}</span>}

      {/* Photos preview */}
      {photos.length > 0 && (
        <div className="kcard-photos">
          {photos.slice(0, 3).map((p, i) => (
            <img key={p.id || i} src={p.url} alt={p.name} className="kcard-photo" />
          ))}
          {photos.length > 3 && (
            <div className="kcard-photo kcard-photo-more">+{photos.length - 3}</div>
          )}
        </div>
      )}

      {/* Bottom row: checklist count + labels */}
      <div className="kcard-footer">
        <div className="kcard-meta">
          {checkTotal > 0 && (
            <span className="kcard-check">
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><rect x="1" y="1" width="10" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.5"/>{checkDone > 0 && <path d="M3.5 6l2 2 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>}</svg>
              {checkDone}/{checkTotal}
            </span>
          )}
          {deadline && (
            <span className={`kcard-deadline${isOverdue ? ' kcard-deadline--overdue' : isToday ? ' kcard-deadline--today' : ''}`}>
              {deadline.toLocaleDateString('ca-ES', { day: '2-digit', month: 'short' })}
            </span>
          )}
        </div>
        <div className="kcard-labels">
          {taskLabels.slice(0, 3).map(lbl => (
            <span key={lbl.id} className="kcard-label" style={{ background: lbl.color + '20', color: lbl.color, border: `1px solid ${lbl.color}40` }}>
              {lbl.name}
            </span>
          ))}
        </div>
      </div>

      {/* Checklist progress bar */}
      {checkTotal > 0 && (
        <div className="kcard-progress-wrap">
          <div
            className="kcard-progress-bar"
            style={{ width: `${Math.round((checkDone / checkTotal) * 100)}%` }}
          />
        </div>
      )}

      <style jsx>{`
        .kcard {
          background: white;
          border: 1px solid rgba(0,0,0,0.06);
          border-radius: 14px;
          padding: 13px 14px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03);
          display: flex;
          flex-direction: column;
          gap: 7px;
          cursor: grab;
          transition: box-shadow 0.2s ease, opacity 0.15s, transform 0.2s ease, border-color 0.2s;
        }
        .kcard:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.09); border-color: rgba(37,99,235,0.14); transform: translateY(-1px); }
        .kcard--dragging { opacity: 0.4; transform: scale(0.97); cursor: grabbing; }

        .kcard-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
        }
        .kcard-top-right {
          display: flex;
          align-items: center;
          gap: 5px;
          flex-shrink: 0;
        }
        .kcard-del {
          width: 24px; height: 24px; border: none; background: transparent;
          border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center;
          color: #C0C0C0; opacity: 0; transition: opacity 0.15s, background 0.15s, color 0.15s;
          flex-shrink: 0;
        }
        .kcard:hover .kcard-del { opacity: 1; }
        .kcard-del:hover { background: #FEE2E2; color: #DC2626; }
        .kcard-client {
          font-size: 10.5px;
          color: #9A9A9A;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          display: block;
        }
        .kcard-avatar {
          width: 24px; height: 24px; border-radius: 50%;
          background: linear-gradient(135deg, #3B6FD4, #1B2B4B); color: white;
          font-size: 8.5px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; overflow: hidden;
        }
        .kcard-avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; display: block; }

        .kcard-photos {
          display: flex;
          gap: 4px;
          border-radius: 6px;
          overflow: hidden;
        }
        .kcard-photo {
          flex: 1;
          height: 72px;
          object-fit: cover;
          border-radius: 6px;
          min-width: 0;
          display: block;
        }
        .kcard-photo-more {
          background: #F0F0F0;
          color: #5C5C5C;
          font-size: 11px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 40px;
        }

        .kcard-title {
          font-size: 14px;
          font-weight: 700;
          color: #0a0a0a;
          line-height: 1.3;
          word-break: break-word;
          flex: 1;
          min-width: 0;
        }

        .kcard-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          flex-wrap: wrap;
        }
        .kcard-meta { display: flex; align-items: center; gap: 6px; }
        .kcard-check {
          display: flex; align-items: center; gap: 3px;
          font-size: 10.5px; color: #9A9A9A; font-weight: 600;
        }
        .kcard-deadline {
          font-size: 10.5px; color: #9A9A9A; font-weight: 500;
        }
        .kcard-deadline--overdue { color: #DC2626; font-weight: 700; }
        .kcard-deadline--today { color: #D97706; font-weight: 700; }

        .kcard-labels { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; justify-content: flex-end; }
        .kcard-label {
          font-size: 10px; font-weight: 700; letter-spacing: 0.02em;
          padding: 2px 7px; border-radius: 5px;
          white-space: nowrap;
        }

        .kcard-progress-wrap {
          background: #F0F0F0;
          border-radius: 4px;
          height: 4px;
          overflow: hidden;
          margin-top: 2px;
        }
        .kcard-progress-bar {
          height: 100%;
          border-radius: 4px;
          background: linear-gradient(90deg, #3B6FD4, #1B2B4B);
          transition: width 0.3s ease;
          min-width: 4px;
        }
      `}</style>
    </div>
  )
}

function ListView({ tasks, allLabels, onStatusChange, onTaskClick, onDelete }: { tasks: Task[]; allLabels: LabelDef[]; onStatusChange: (id: string, status: string) => void; onTaskClick: (t: Task) => void; onDelete: (id: string) => void }) {
  const today = new Date(); today.setHours(0,0,0,0)

  return (
    <div className="list-view">
      {/* Header */}
      <div className="list-header">
        <span className="lh-title">Tasca</span>
        <span className="lh-status">Estat</span>
        <span className="lh-labels">Etiquetes</span>
        <span className="lh-check">Check</span>
        <span className="lh-resp">Responsable</span>
        <span className="lh-date">Data límit</span>
        <span className="lh-del" />
      </div>

      {tasks.length === 0 ? (
        <div className="list-empty"><p>Cap tasca.</p></div>
      ) : (
        tasks.map((task) => {
          const client = task.client as any
          const responsible = task.responsible as any
          const project = task.project as any
          const pColor = priorityColor[task.priority]
          const taskAny = task as any
          const taskLabels = allLabels.filter(l => (taskAny.labels || []).includes(l.id))
          const checkTotal = (taskAny.checklist || []).length
          const checkDone = (taskAny.checklist || []).filter((c: any) => c.done).length
          const deadline = task.deadline ? new Date(task.deadline) : null
          const isOverdue = deadline && deadline < today && task.status !== 'done'
          const isToday = deadline && deadline.getTime() === today.getTime()

          return (
            <div key={task.id} className="list-row" onClick={() => onTaskClick(task)}>
              {/* Priority stripe */}
              <span className="list-stripe" style={{ background: pColor }} />

              {/* Title + client/project */}
              <div className="list-title-wrap">
                <div className="list-title">{task.title}</div>
                <div className="list-meta">
                  {client && <span className="list-badge list-badge--client">{client.name}</span>}
                  {project && <span className="list-badge list-badge--project">{project.name}</span>}
                  <span className="list-priority-tag" style={{ color: pColor }}>{taskPriorityLabels[task.priority]}</span>
                </div>
              </div>

              {/* Status */}
              <select
                className="list-status"
                value={task.status}
                onClick={e => e.stopPropagation()}
                onChange={(e) => { e.stopPropagation(); onStatusChange(task.id, e.target.value) }}
              >
                {columns.map((c) => (
                  <option key={c.status} value={c.status}>{c.label}</option>
                ))}
              </select>

              {/* Labels */}
              <div className="list-labels">
                {taskLabels.slice(0, 2).map(lbl => (
                  <span key={lbl.id} className="list-label" style={{ background: lbl.color + '18', color: lbl.color, border: `1px solid ${lbl.color}30` }}>
                    {lbl.name}
                  </span>
                ))}
                {taskLabels.length > 2 && <span className="list-label-more">+{taskLabels.length - 2}</span>}
              </div>

              {/* Checklist progress */}
              <div className="list-check">
                {checkTotal > 0 ? (
                  <>
                    <div className="list-check-bar">
                      <div className="list-check-fill" style={{ width: `${Math.round((checkDone / checkTotal) * 100)}%` }} />
                    </div>
                    <span className="list-check-txt">{checkDone}/{checkTotal}</span>
                  </>
                ) : <span className="list-check-none">—</span>}
              </div>

              {/* Responsible */}
              <div className="list-resp">
                {responsible ? (
                  <>
                    <div className="list-resp-avatar">
                      {responsible.avatar_url
                        ? <img src={responsible.avatar_url} alt="" />
                        : getInitials(responsible.full_name)}
                    </div>
                    <span className="list-resp-name">{responsible.full_name}</span>
                  </>
                ) : <span className="list-none">—</span>}
              </div>

              {/* Deadline */}
              <div className={`list-deadline${isOverdue ? ' list-deadline--overdue' : isToday ? ' list-deadline--today' : ''}`}>
                {deadline
                  ? deadline.toLocaleDateString('ca-ES', { day: '2-digit', month: 'short' })
                  : <span className="list-none">—</span>}
              </div>

              {/* Delete */}
              <button
                className="list-del"
                title="Eliminar tasca"
                onClick={(e) => { e.stopPropagation(); onDelete(task.id) }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          )
        })
      )}

      <style jsx>{`
        .list-view {
          padding: 0 28px 32px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          overflow-y: auto;
          flex: 1;
        }

        @media (max-width: 767px) {
          .list-view { padding: 8px 12px 80px; gap: 6px; }
          .list-header { display: none; }
          .list-row {
            grid-template-columns: 4px 1fr auto;
            grid-template-rows: auto auto;
            padding: 10px 12px 10px 8px;
            gap: 6px 8px;
          }
          .list-stripe { grid-row: 1 / 3; align-self: stretch; height: auto; }
          .list-title-wrap { grid-column: 2; grid-row: 1; }
          .list-status { grid-column: 3; grid-row: 1; align-self: start; }
          .list-labels { grid-column: 2; grid-row: 2; }
          .list-check { display: none; }
          .list-resp { display: none; }
          .list-deadline { grid-column: 3; grid-row: 2; font-size: 11px; }
          .list-del { display: none; }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .list-view { padding: 0 16px 80px; }
          .list-header { display: none; }
          .list-row {
            grid-template-columns: 4px 3fr 1.4fr 1fr 1.2fr 0px;
            gap: 10px;
          }
          .list-labels { display: none; }
          .list-check { display: none; }
          .list-del { opacity: 1; }
        }

        .list-header {
          display: grid;
          grid-template-columns: 3fr 1.4fr 1.6fr 1fr 1.8fr 1.2fr 36px;
          gap: 12px;
          padding: 6px 20px 6px 24px;
          font-size: 10.5px;
          font-weight: 700;
          color: #9A9A9A;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .list-empty {
          text-align: center;
          color: #9A9A9A;
          padding: 48px;
          font-size: 14px;
        }

        .list-row {
          display: grid;
          grid-template-columns: 4px 3fr 1.4fr 1.6fr 1fr 1.8fr 1.2fr 36px;
          gap: 12px;
          align-items: center;
          padding: 10px 16px 10px 12px;
          background: white;
          border: 1px solid #ECECEC;
          border-radius: 10px;
          cursor: pointer;
          transition: box-shadow 0.15s, border-color 0.15s;
        }
        .list-row:hover { box-shadow: 0 2px 10px rgba(0,0,0,0.07); border-color: #D8D8D8; }
        .list-del {
          width: 30px; height: 30px; border: none; background: transparent;
          border-radius: 7px; cursor: pointer; display: flex; align-items: center; justify-content: center;
          color: #C0C0C0; opacity: 0; transition: opacity 0.15s, background 0.15s, color 0.15s;
        }
        .list-row:hover .list-del { opacity: 1; }
        .list-del:hover { background: #FEE2E2; color: #DC2626; }

        .list-stripe {
          width: 4px;
          height: 32px;
          border-radius: 3px;
          flex-shrink: 0;
        }

        .list-title-wrap { min-width: 0; }

        .list-title {
          font-size: 13.5px;
          font-weight: 500;
          color: #0a0a0a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .list-meta {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-top: 3px;
          flex-wrap: wrap;
        }

        .list-badge {
          font-size: 10.5px;
          padding: 1px 6px;
          border-radius: 4px;
          white-space: nowrap;
        }
        .list-badge--client { background: #1B2B4B0F; color: #1B2B4B; }
        .list-badge--project { background: #4A82C60F; color: #4A82C6; }

        .list-priority-tag {
          font-size: 10.5px;
          font-weight: 600;
        }

        .list-status {
          font-size: 11.5px;
          border: 1px solid #E8E8E8;
          border-radius: 7px;
          padding: 4px 6px;
          color: #5C5C5C;
          background: white;
          cursor: pointer;
          outline: none;
          font-family: inherit;
          width: 100%;
        }

        .list-labels {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
          align-items: center;
        }
        .list-label {
          font-size: 10px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
          white-space: nowrap;
        }
        .list-label-more { font-size: 10.5px; color: #9A9A9A; }

        .list-check {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .list-check-bar {
          flex: 1;
          height: 4px;
          background: #F0F0F0;
          border-radius: 2px;
          overflow: hidden;
          min-width: 28px;
        }
        .list-check-fill { height: 100%; background: #16A34A; border-radius: 2px; }
        .list-check-txt { font-size: 10.5px; color: #9A9A9A; white-space: nowrap; }
        .list-check-none { font-size: 12px; color: #D0D0D0; }

        .list-resp {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
        }

        .list-resp-avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #F0F0F0;
          color: #5C5C5C;
          font-size: 9px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          flex-shrink: 0;
        }
        .list-resp-avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }

        .list-resp-name {
          font-size: 12px;
          color: #5C5C5C;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          min-width: 0;
        }

        .list-none { color: #D0D0D0; font-size: 12px; }

        .list-deadline {
          font-size: 12px;
          color: #9A9A9A;
          white-space: nowrap;
          font-weight: 500;
        }
        .list-deadline--overdue { color: #DC2626; font-weight: 700; }
        .list-deadline--today { color: #D97706; font-weight: 700; }
      `}</style>
    </div>
  )
}
