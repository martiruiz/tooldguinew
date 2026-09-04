'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, Plus, Check, Trash2, Tag, Settings2, Save, UserPlus, Link2, ExternalLink, Send, AtSign, Camera, Loader2, ZoomIn } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'
import type { Task } from '@/types'
import { LabelsManagerModal, type Label } from './LabelsManagerModal'
import { DrivePickerModal } from './DrivePickerModal'
import { DateTimePicker } from '@/components/ui/DateTimePicker'

const STATUS_COLS = [
  { status: 'inbox', label: 'Inbox', color: '#9A9A9A' },
  { status: 'todo', label: 'Per fer', color: '#DC2626' },
  { status: 'in_progress', label: 'En curs', color: '#1B2B4B' },
  { status: 'review', label: 'Revisió', color: '#D97706' },
  { status: 'blocked', label: 'Bloquejat', color: '#7C3AED' },
  { status: 'done', label: 'Fet', color: '#16A34A' },
]

interface CheckItem { id: string; text: string; done: boolean }
interface Subtask { id: string; title: string; done: boolean; assigned_to?: string }
interface DriveLink { id: string; url: string; name: string }
interface Comment { id: string; task_id: string; user_id: string; content: string; mentions: string[]; created_at: string; profile?: { full_name: string; avatar_url?: string } }
interface Activity { id: string; task_id: string; user_id: string; action: string; details: Record<string, any>; created_at: string; profile?: { full_name: string; avatar_url?: string } }

interface Props {
  task: Task
  profiles: { id: string; full_name: string; avatar_url?: string }[]
  clients: { id: string; name: string }[]
  projects: { id: string; name: string }[]
  currentUserId: string
  onClose: () => void
  onUpdated: (task: Task) => void
}

export function TaskDetailModal({ task, profiles, clients, projects, currentUserId, onClose, onUpdated }: Props) {
  const t = task as any
  const [form, setForm] = useState({
    title: t.title || '',
    description: t.description || '',
    status: t.status,
    priority: t.priority,
    deadline: t.deadline ? t.deadline.slice(0, 16) : '',
    responsible_id: t.responsible_id || '',
    client_id: t.client_id || '',
    project_id: t.project_id || '',
  })
  const [checklist, setChecklist] = useState<CheckItem[]>(t.checklist || [])
  const [subtasks, setSubtasks] = useState<Subtask[]>(t.subtasks || [])
  const [driveLinks, setDriveLinks] = useState<DriveLink[]>(t.drive_links || [])
  const [photos, setPhotos] = useState<{ id: string; url: string; name: string; path?: string; type?: 'image' | 'video' }[]>(t.photos || [])
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const photoRef = useRef<HTMLInputElement>(null)
  const [watcherIds, setWatcherIds] = useState<string[]>(t.watcher_ids || [])
  const [labelIds, setLabelIds] = useState<string[]>(t.labels || [])
  const [allLabels, setAllLabels] = useState<Label[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [newComment, setNewComment] = useState('')
  const origForm = useRef({ title: t.title || '', description: t.description || '', deadline: t.deadline ? t.deadline.slice(0, 16) : '' })
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [mentionPos, setMentionPos] = useState(0)
  const [newCheck, setNewCheck] = useState('')
  const [newSubtask, setNewSubtask] = useState('')
  const [newDrive, setNewDrive] = useState('')
  const [showDriveInput, setShowDriveInput] = useState(false)
  const [showDrivePicker, setShowDrivePicker] = useState(false)
  const [showLabelPicker, setShowLabelPicker] = useState(false)
  const [showLabelManager, setShowLabelManager] = useState(false)
  const [showWatcherPicker, setShowWatcherPicker] = useState(false)
  const [showResponsiblePicker, setShowResponsiblePicker] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const commentRef = useRef<HTMLTextAreaElement>(null)
  const checkRef = useRef<HTMLInputElement>(null)
  const subtaskRef = useRef<HTMLInputElement>(null)
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission()
    }
    // Log task opened
    const supabase = createClient()
    supabase.from('task_activity').insert({ task_id: task.id, user_id: currentUserId, action: 'task_opened', details: {} }).then(() => {})
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.from('labels').select('*').order('created_at').then(({ data }) => data && setAllLabels(data as Label[]))
    supabase.from('task_comments')
      .select('id, task_id, user_id, content, mentions, created_at')
      .eq('task_id', task.id)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) { console.error('[task_comments fetch]', error.message); return }
        if (!data) return
        const enriched = data.map(c => ({
          ...c,
          profile: profiles.find(p => p.id === c.user_id)
            ? { full_name: profiles.find(p => p.id === c.user_id)!.full_name, avatar_url: (profiles.find(p => p.id === c.user_id) as any).avatar_url }
            : undefined,
        }))
        setComments(enriched as Comment[])
      })
    supabase.from('task_activity')
      .select('id, task_id, user_id, action, details, created_at')
      .eq('task_id', task.id)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) { console.error('[task_activity fetch]', error.message); return }
        if (!data) return
        const enriched = data.map(a => ({
          ...a,
          profile: profiles.find(p => p.id === a.user_id)
            ? { full_name: profiles.find(p => p.id === a.user_id)!.full_name, avatar_url: (profiles.find(p => p.id === a.user_id) as any).avatar_url }
            : undefined,
        }))
        setActivities(enriched as Activity[])
      })

    // Realtime: new comments
    const channel = supabase.channel(`task-modal-${task.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'task_comments',
        filter: `task_id=eq.${task.id}`,
      }, async (payload) => {
        if (payload.new.user_id === currentUserId) return // already added optimistically
        const { data } = await supabase.from('task_comments')
          .select('*, profile:profiles(full_name, avatar_url)')
          .eq('id', payload.new.id).single()
        if (data) {
          setComments(prev => [...prev.filter(c => c.id !== (data as Comment).id), data as Comment]
            .sort((a, b) => a.created_at.localeCompare(b.created_at)))
          // Browser notification if current user is mentioned
          if ((data as Comment).mentions?.includes(currentUserId)) {
            const who = (data as any).profile?.full_name || 'Algú'
            if (Notification.permission === 'granted') {
              new Notification(`${who} t'ha mencionat`, { body: (data as Comment).content, icon: '/logo-guinew-icon.png' })
            }
          }
        }
      })
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'task_activity',
        filter: `task_id=eq.${task.id}`,
      }, async (payload) => {
        if (payload.new.user_id === currentUserId) return
        const { data } = await supabase.from('task_activity')
          .select('*, profile:profiles(full_name, avatar_url)')
          .eq('id', payload.new.id).single()
        if (data) setActivities(prev => [...prev, data as Activity])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [task.id, currentUserId])

  const dirty = (field: string, value: string) => {
    setForm((p) => ({ ...p, [field]: value }))
    setIsDirty(true)
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => {
      const supabase = createClient()
      const patch: Record<string, any> = { [field]: value.trim() || null }
      if (field === 'title' && !value.trim()) return
      supabase.from('tasks').update(patch).eq('id', task.id).then(({ error }) => {
        if (error) { console.error('[auto-save] error:', error.message); return }
        setSaved(true); setIsDirty(false); setTimeout(() => setSaved(false), 1500)
        fetchFullTask()
      })
    }, 1000)
  }

  const saveAll = async () => {
    setSaving(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('tasks')
      .update({
        title: form.title.trim(),
        description: form.description || null,
        status: form.status,
        priority: form.priority,
        deadline: form.deadline || null,
        responsible_id: form.responsible_id || null,
        client_id: form.client_id || null,
        project_id: form.project_id || null,
        checklist,
        subtasks,
        drive_links: driveLinks,
        photos,
        watcher_ids: watcherIds,
        labels: labelIds,
        completed_at: form.status === 'done' ? new Date().toISOString() : null,
      })
      .eq('id', task.id)
      .select(`*, client:clients(id,name), project:projects(id,name), responsible:profiles!tasks_responsible_id_fkey(id,full_name)`)
      .single()
    if (error) console.error('[saveAll] error:', error.message)
    if (!error) {
      onUpdated((data ?? { ...task, ...form }) as Task)
      setSaved(true); setIsDirty(false); setTimeout(() => setSaved(false), 2500)
      // Log field changes
      if (form.title !== origForm.current.title) logActivity('title_changed', { title: form.title })
      if (form.description !== origForm.current.description) logActivity('description_changed', {})
      if (form.deadline !== origForm.current.deadline) logActivity('deadline_set', { deadline: form.deadline || null })
      origForm.current = { title: form.title, description: form.description, deadline: form.deadline }
    }
    setSaving(false)
  }

  const fetchFullTask = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('tasks')
      .select('*, client:clients(id,name), project:projects(id,name), responsible:profiles!tasks_responsible_id_fkey(id,full_name,avatar_url)')
      .eq('id', task.id)
      .single()
    if (data) onUpdated(data as Task)
  }

  const saveDropdown = async (field: string, value: string) => {
    const prev = form[field as keyof typeof form]
    const updated = { ...form, [field]: value }
    setForm(updated)
    const supabase = createClient()
    const { error } = await supabase.from('tasks').update({ [field]: value || null }).eq('id', task.id)
    if (error) { console.error('[saveDropdown] error:', error.message, field); return }
    fetchFullTask()
    if (field === 'status' && value !== prev) {
      const fromLabel = STATUS_COLS.find(c => c.status === prev)?.label || prev
      const toLabel = STATUS_COLS.find(c => c.status === value)?.label || value
      logActivity('status_changed', { from: fromLabel, to: toLabel })
    }
    if (field === 'priority' && value !== prev) logActivity('priority_changed', { from: prev, to: value })
    if (field === 'responsible_id' && value !== prev) {
      const name = profiles.find(p => p.id === value)?.full_name || 'Ningú'
      logActivity('assigned', { name: value ? name : null })
    }
    if (field === 'client_id' && value !== prev) {
      const name = clients.find(c => c.id === value)?.name || null
      logActivity('client_linked', { name })
    }
    if (field === 'project_id' && value !== prev) {
      const name = projects.find(p => p.id === value)?.name || null
      logActivity('project_linked', { name })
    }
  }

  const persist = async (patch: object) => {
    const supabase = createClient()
    const { error } = await supabase.from('tasks').update(patch).eq('id', task.id)
    if (error) console.error('[persist] error:', error.message, patch)
  }

  const refreshActivities = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('task_activity')
      .select('id, task_id, user_id, action, details, created_at')
      .eq('task_id', task.id)
      .order('created_at', { ascending: true })
    if (!data) return
    const enriched = data.map(a => ({
      ...a,
      profile: profiles.find(p => p.id === a.user_id)
        ? { full_name: profiles.find(p => p.id === a.user_id)!.full_name, avatar_url: (profiles.find(p => p.id === a.user_id) as any).avatar_url }
        : undefined,
    }))
    setActivities(enriched as Activity[])
  }

  const logActivity = async (action: string, details: Record<string, any> = {}) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('task_activity')
      .insert({ task_id: task.id, user_id: currentUserId, action, details })
    if (error) { console.error('[logActivity] insert error:', error.message, { action, details }); return }
    // Refresh from Supabase to get accurate list
    await refreshActivities()
  }

  // Checklist
  const addCheck = () => {
    if (!newCheck.trim()) return
    const items = [...checklist, { id: crypto.randomUUID(), text: newCheck.trim(), done: false }]
    setChecklist(items); setNewCheck(''); persist({ checklist: items }); checkRef.current?.focus()
    logActivity('checklist_added', { text: newCheck.trim() })
  }
  const toggleCheck = (id: string) => {
    const item = checklist.find(c => c.id === id)!
    const items = checklist.map(c => c.id === id ? { ...c, done: !c.done } : c)
    setChecklist(items); persist({ checklist: items })
    logActivity(item.done ? 'checklist_undone' : 'checklist_done', { text: item.text })
  }
  const delCheck = (id: string) => {
    const item = checklist.find(c => c.id === id)
    const items = checklist.filter(c => c.id !== id); setChecklist(items); persist({ checklist: items })
    if (item) logActivity('checklist_removed', { text: item.text })
  }

  // Subtasks
  const [newSubtaskAssignee, setNewSubtaskAssignee] = useState('')
  const addSubtask = () => {
    if (!newSubtask.trim()) return
    const items = [...subtasks, { id: crypto.randomUUID(), title: newSubtask.trim(), done: false, assigned_to: newSubtaskAssignee || undefined }]
    setSubtasks(items); setNewSubtask(''); setNewSubtaskAssignee(''); persist({ subtasks: items }); subtaskRef.current?.focus()
    logActivity('subtask_added', { title: newSubtask.trim() })
  }
  const toggleSubtask = (id: string) => {
    const s = subtasks.find(s => s.id === id)!
    const items = subtasks.map(s => s.id === id ? { ...s, done: !s.done } : s)
    setSubtasks(items); persist({ subtasks: items })
    logActivity(s.done ? 'subtask_undone' : 'subtask_done', { title: s.title })
  }
  const delSubtask = (id: string) => {
    const s = subtasks.find(s => s.id === id)
    const items = subtasks.filter(s => s.id !== id); setSubtasks(items); persist({ subtasks: items })
    if (s) logActivity('subtask_removed', { title: s.title })
  }
  const assignSubtask = (id: string, userId: string) => {
    const s = subtasks.find(s => s.id === id)
    const items = subtasks.map(s => s.id === id ? { ...s, assigned_to: userId || undefined } : s)
    setSubtasks(items); persist({ subtasks: items })
    const assigneeName = profiles.find(p => p.id === userId)?.full_name || null
    logActivity('subtask_assigned', { title: s?.title || '', name: assigneeName })
  }

  // Drive
  const addDrive = () => {
    const url = newDrive.trim()
    if (!url) return
    let name = 'Document de Drive'
    try {
      const u = new URL(url)
      const parts = u.pathname.split('/').filter(Boolean)
      if (parts.includes('document')) name = 'Google Doc'
      else if (parts.includes('spreadsheets')) name = 'Google Sheet'
      else if (parts.includes('presentation')) name = 'Google Slides'
    } catch {}
    const items = [...driveLinks, { id: crypto.randomUUID(), url, name }]
    setDriveLinks(items); setNewDrive(''); setShowDriveInput(false); persist({ drive_links: items })
    logActivity('drive_added', { name })
  }
  const delDrive = (id: string) => {
    const d = driveLinks.find(d => d.id === id)
    const items = driveLinks.filter(d => d.id !== id); setDriveLinks(items); persist({ drive_links: items })
    if (d) logActivity('drive_removed', { name: d.name })
  }

  const openDropboxChooser = () => {
    const appKey = process.env.NEXT_PUBLIC_DROPBOX_APP_KEY || ''
    if (!(window as any).Dropbox) {
      const s = document.createElement('script')
      s.src = 'https://www.dropbox.com/static/api/2/dropins.js'
      s.id = 'dropboxjs'
      s.setAttribute('data-app-key', appKey)
      s.onload = () => launchDropbox()
      document.head.appendChild(s)
    } else {
      launchDropbox()
    }
  }
  const launchDropbox = () => {
    ;(window as any).Dropbox.choose({
      success: (files: { link: string; name: string }[]) => {
        const f = files[0]
        if (!f) return
        const items = [...driveLinks, { id: crypto.randomUUID(), url: f.link, name: f.name }]
        setDriveLinks(items); persist({ drive_links: items })
      },
      linkType: 'preview',
      multiselect: false,
    })
  }

  // Photos & Videos
  const uploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')
    if (!isImage && !isVideo) return
    if (isImage && file.size > 10 * 1024 * 1024) { alert('La imatge no pot superar 10 MB'); return }
    if (isVideo && file.size > 200 * 1024 * 1024) { alert('El vídeo no pot superar 200 MB'); return }
    setUploadingPhoto(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('taskId', task.id)
      const res = await fetch('/api/tasks/upload-photo', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) { alert(`Error pujant el fitxer: ${json.error}`); return }
      const items = [...photos, { id: crypto.randomUUID(), url: json.url, name: file.name, path: json.path, type: json.type as 'image' | 'video' }]
      setPhotos(items)
      persist({ photos: items })
      onUpdated({ ...task, photos: items } as Task)
      await logActivity(isVideo ? 'video_added' : 'photo_added', { name: file.name })
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    } finally {
      setUploadingPhoto(false)
      e.target.value = ''
    }
  }
  const delPhoto = async (id: string) => {
    const photo = photos.find(p => p.id === id)
    const items = photos.filter(p => p.id !== id)
    setPhotos(items)
    persist({ photos: items })
    onUpdated({ ...task, photos: items } as Task)
    if (photo?.path) {
      fetch('/api/tasks/upload-photo', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: photo.path }) }).catch(() => {})
    }
    logActivity('photo_removed', { name: photo?.name || '' })
  }

  // Watchers
  const toggleWatcher = (id: string) => {
    const adding = !watcherIds.includes(id)
    const ids = adding ? [...watcherIds, id] : watcherIds.filter(w => w !== id)
    setWatcherIds(ids); persist({ watcher_ids: ids })
    const name = profiles.find(p => p.id === id)?.full_name || ''
    logActivity(adding ? 'watcher_added' : 'watcher_removed', { name })
  }

  // Labels
  const toggleLabel = (id: string) => {
    const adding = !labelIds.includes(id)
    const ids = adding ? [...labelIds, id] : labelIds.filter(l => l !== id)
    setLabelIds(ids); persist({ labels: ids })
    const labelName = allLabels.find(l => l.id === id)?.name || id
    logActivity(adding ? 'label_added' : 'label_removed', { label: labelName })
  }

  // Comments with @mentions
  const handleCommentChange = (val: string) => {
    setNewComment(val)
    const cursor = commentRef.current?.selectionStart ?? val.length
    const before = val.slice(0, cursor)
    const match = before.match(/@(\w*)$/)
    if (match) { setMentionQuery(match[1].toLowerCase()); setMentionPos(before.lastIndexOf('@')) }
    else setMentionQuery(null)
  }

  const insertMention = (profile: { id: string; full_name: string }) => {
    const before = newComment.slice(0, mentionPos)
    const after = newComment.slice((commentRef.current?.selectionStart ?? mentionPos))
    const name = profile.full_name.replace(/\s+/g, '')
    setNewComment(`${before}@${name} ${after}`)
    setMentionQuery(null)
    commentRef.current?.focus()
  }

  const submitComment = async () => {
    if (!newComment.trim()) return
    const supabase = createClient()
    const mentions = profiles.filter(p => newComment.includes(`@${p.full_name.replace(/\s+/g, '')}`)).map(p => p.id)
    const { data, error } = await supabase
      .from('task_comments')
      .insert({ task_id: task.id, user_id: currentUserId, content: newComment.trim(), mentions })
      .select('id, task_id, user_id, content, mentions, created_at')
      .single()
    if (error) { console.error('[submitComment]', error.message); return }
    if (data) {
      const me = profiles.find(p => p.id === currentUserId)
      setComments(prev => [...prev, {
        ...data,
        profile: me ? { full_name: me.full_name, avatar_url: (me as any).avatar_url } : undefined,
      } as Comment])
      setNewComment('')
    }
  }

  const delComment = async (id: string) => {
    const supabase = createClient()
    await supabase.from('task_comments').delete().eq('id', id)
    setComments(prev => prev.filter(c => c.id !== id))
  }

  const renderComment = (text: string) =>
    text.split(/(@\w+)/g).map((part, i) =>
      part.startsWith('@')
        ? <span key={i} className="mention">{part}</span>
        : <span key={i}>{part}</span>
    )

  const fmtActivityDate = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Ara mateix'
    if (diffMins < 60) return `Fa ${diffMins} min`
    const diffH = Math.floor(diffMins / 60)
    if (diffH < 24) return `Fa ${diffH}h`
    return d.toLocaleDateString('ca-ES', { day: '2-digit', month: 'short', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined, hour: '2-digit', minute: '2-digit' })
  }

  const formatActivity = (action: string, details: Record<string, any>): string => {
    switch (action) {
      case 'status_changed': return `ha mogut la tasca a '${details.to}'`
      case 'priority_changed': return `ha canviat la prioritat a '${details.to}'`
      case 'assigned': return details.name ? `ha assignat la tasca a ${details.name}` : 'ha tret l\'assignació'
      case 'client_linked': return details.name ? `ha vinculat el client '${details.name}'` : 'ha desvinculat el client'
      case 'title_changed': return `ha canviat el títol a '${details.title}'`
      case 'description_changed': return 'ha actualitzat la descripció'
      case 'deadline_set': return details.deadline ? `ha establert la data límit` : 'ha eliminat la data límit'
      case 'checklist_added': return `ha afegit '${details.text}' al checklist`
      case 'checklist_done': return `ha completat '${details.text}'`
      case 'checklist_undone': return `ha desmarcat '${details.text}'`
      case 'checklist_removed': return `ha eliminat '${details.text}' del checklist`
      case 'subtask_added': return `ha creat la subtasca '${details.title}'`
      case 'subtask_done': return `ha completat la subtasca '${details.title}'`
      case 'subtask_undone': return `ha desmarcat la subtasca '${details.title}'`
      case 'subtask_removed': return `ha eliminat la subtasca '${details.title}'`
      case 'subtask_assigned': return details.name ? `ha assignat '${details.title}' a ${details.name}` : `ha tret l'assignació de '${details.title}'`
      case 'drive_added': return `ha afegit el document '${details.name}'`
      case 'drive_removed': return `ha eliminat el document '${details.name}'`
      case 'photo_added': return `ha pujat la foto '${details.name}'`
      case 'photo_removed': return 'ha eliminat una foto'
      case 'label_added': return `ha afegit l'etiqueta '${details.label}'`
      case 'label_removed': return `ha tret l'etiqueta '${details.label}'`
      case 'task_created': return `ha creat aquesta tasca`
      case 'task_opened': return `ha obert la tasca`
      case 'project_linked': return details.name ? `ha vinculat el projecte '${details.name}'` : 'ha desvinculat el projecte'
      case 'watcher_added': return `s'ha subscrit a les notificacions`
      case 'watcher_removed': return `ha deixat de seguir la tasca`
      default: return action
    }
  }

  const col = STATUS_COLS.find(c => c.status === form.status)!
  const doneChecks = checklist.filter(c => c.done).length
  const doneSubtasks = subtasks.filter(s => s.done).length
  const activeLabels = allLabels.filter(l => labelIds.includes(l.id))
  const watchers = profiles.filter(p => watcherIds.includes(p.id))
  const mentionSuggestions = mentionQuery !== null
    ? profiles.filter(p => p.full_name.toLowerCase().includes(mentionQuery))
    : []

  if (!mounted) return null

  return createPortal(
    <>
      <div className="overlay" onClick={async e => { if (e.target === e.currentTarget) { if (isDirty) await saveAll(); onClose() } }}>
        <div className="modal">

          {/* Header */}
          <div className="modal-hdr">
            <div className="status-badge" style={{ color: col.color, background: `${col.color}15` }}>
              <span className="dot" style={{ background: col.color }} />{col.label}
            </div>
            <div className="hdr-right">
              {isDirty && <span className="txt-dirty">Canvis sense desar</span>}
              {saved && <span className="txt-saved">✓ Desat</span>}
              <button className="close-btn" onClick={async () => { if (isDirty) await saveAll(); onClose() }}><X size={15} /></button>
            </div>
          </div>

          <div className="modal-body">

            {/* Title */}
            <textarea className="title-inp" value={form.title.toUpperCase()}
              onChange={e => dirty('title', e.target.value.toUpperCase())} rows={1}
              placeholder="TÍTOL DE LA TASCA..."
              onInput={e => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px' }}
            />

            {/* Responsible below title */}
            {(() => {
              const rp = profiles.find(p => p.id === form.responsible_id) as any
              return (
                <div className="title-resp-row">
                  <div className="rel-wrap">
                    <button className="resp-chip" onClick={() => setShowResponsiblePicker(v => !v)}>
                      {rp ? (
                        <>
                          <div className="resp-av">
                            {rp.avatar_url ? <img src={rp.avatar_url} alt="" /> : getInitials(rp.full_name)}
                          </div>
                          <span className="resp-chip-name">{rp.full_name}</span>
                        </>
                      ) : (
                        <>
                          <div className="resp-av resp-av--empty">
                            <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><circle cx="5.5" cy="3.5" r="2" stroke="currentColor" strokeWidth="1.5"/><path d="M1 10c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                          </div>
                          <span className="resp-chip-name resp-chip-name--empty">Assignar responsable</span>
                        </>
                      )}
                    </button>
                    {showResponsiblePicker && (
                      <div className="resp-picker" onClick={e => e.stopPropagation()}>
                        <button className="resp-picker-opt" onClick={() => { saveDropdown('responsible_id', ''); setShowResponsiblePicker(false) }}>
                          <div className="resp-av resp-av--empty" style={{ fontSize: 14 }}>—</div>
                          <span>Sense assignar</span>
                        </button>
                        {profiles.map(p => {
                          const pa = p as any
                          return (
                            <button key={p.id}
                              className={`resp-picker-opt${form.responsible_id === p.id ? ' resp-picker-opt--on' : ''}`}
                              onClick={() => { saveDropdown('responsible_id', p.id); setShowResponsiblePicker(false) }}>
                              <div className="resp-av">
                                {pa.avatar_url ? <img src={pa.avatar_url} alt="" /> : getInitials(p.full_name)}
                              </div>
                              <span>{p.full_name}</span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )
            })()}

            {/* Labels + Watchers */}
            <div className="meta-row">
              <div className="label-zone">
                {activeLabels.map(l => (
                  <span key={l.id} className="chip" style={{ color: l.color, background: `${l.color}18`, borderColor: `${l.color}30` }}>
                    <span className="dot" style={{ background: l.color }} />{l.name}
                    <button className="chip-rm" onClick={() => toggleLabel(l.id)}>×</button>
                  </span>
                ))}
                <div className="rel-wrap">
                  <button className="ghost-btn" onClick={() => setShowLabelPicker(v => !v)}><Tag size={11} />Etiqueta</button>
                  {showLabelPicker && (
                    <div className="picker-dd">
                      {allLabels.length === 0 && <div className="picker-empty">Crea etiquetes primer</div>}
                      {allLabels.map(l => (
                        <button key={l.id} className={`picker-opt${labelIds.includes(l.id) ? ' picker-opt--on' : ''}`} onClick={() => toggleLabel(l.id)}>
                          <span className="dot" style={{ background: l.color }} />
                          <span style={{ color: l.color, fontWeight: labelIds.includes(l.id) ? 700 : 500 }}>{l.name}</span>
                          {labelIds.includes(l.id) && <Check size={10} style={{ marginLeft: 'auto' }} />}
                        </button>
                      ))}
                      <button className="picker-mgr" onClick={() => { setShowLabelPicker(false); setShowLabelManager(true) }}>
                        <Settings2 size={11} />Gestionar etiquetes
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="watcher-zone">
                {watchers.map(w => (
                  <div key={w.id} className="watcher-av" title={w.full_name}
                    onClick={() => toggleWatcher(w.id)}>
                    {w.avatar_url ? <img src={w.avatar_url} alt={w.full_name} /> : getInitials(w.full_name)}
                  </div>
                ))}
                <div className="rel-wrap">
                  <button className="ghost-btn" onClick={() => setShowWatcherPicker(v => !v)}>
                    <UserPlus size={11} />Seguiment
                  </button>
                  {showWatcherPicker && (
                    <div className="picker-dd picker-dd--right">
                      <div className="picker-label">Assignar seguiment</div>
                      {profiles.map(p => (
                        <button key={p.id} className={`picker-opt${watcherIds.includes(p.id) ? ' picker-opt--on' : ''}`} onClick={() => toggleWatcher(p.id)}>
                          <div className="mini-av">{p.avatar_url ? <img src={p.avatar_url} /> : getInitials(p.full_name)}</div>
                          <span>{p.full_name}</span>
                          {watcherIds.includes(p.id) && <Check size={10} style={{ marginLeft: 'auto', color: '#1B2B4B' }} />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Fields grid */}
            <div className="grid6">
              <div className="field"><label>Estat</label>
                <select value={form.status} onChange={e => saveDropdown('status', e.target.value)}>
                  {STATUS_COLS.map(c => <option key={c.status} value={c.status}>{c.label}</option>)}
                </select>
              </div>
              <div className="field"><label>Prioritat</label>
                <select value={form.priority} onChange={e => saveDropdown('priority', e.target.value)}>
                  <option value="low">Baixa</option><option value="medium">Mitja</option>
                  <option value="high">Alta</option><option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="field"><label>Responsable</label>
                <select value={form.responsible_id} onChange={e => saveDropdown('responsible_id', e.target.value)}>
                  <option value="">Sense assignar</option>
                  {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select>
              </div>
              <div className="field"><label>Data límit</label>
                <DateTimePicker
                  value={form.deadline}
                  onChange={v => dirty('deadline', v)}
                  placeholder="Sense data límit..."
                />
              </div>
              <div className="field"><label>Client</label>
                <select value={form.client_id} onChange={e => saveDropdown('client_id', e.target.value)}>
                  <option value="">Sense client</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="field"><label>Projecte</label>
                <select value={form.project_id} onChange={e => saveDropdown('project_id', e.target.value)}>
                  <option value="">Sense projecte</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>

            {/* CHECKLIST */}
            <div className="section">
              <div className="section-hdr">
                <span className="sec-label">Checklist</span>
                {checklist.length > 0 && <span className="sec-count">{doneChecks}/{checklist.length}</span>}
              </div>
              {checklist.length > 0 && (
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${(doneChecks / checklist.length) * 100}%` }} /></div>
              )}
              {checklist.map(item => (
                <div key={item.id} className="check-row">
                  <button className={`cbox${item.done ? ' cbox--on' : ''}`} onClick={() => toggleCheck(item.id)}>
                    {item.done && <Check size={9} strokeWidth={3} />}
                  </button>
                  <span className={`ctext${item.done ? ' ctext--done' : ''}`}>{item.text}</span>
                  <button className="row-del" onClick={() => delCheck(item.id)}><Trash2 size={11} /></button>
                </div>
              ))}
              <div className="add-row">
                <input ref={checkRef} value={newCheck} onChange={e => setNewCheck(e.target.value)}
                  placeholder="Afegir element..." onKeyDown={e => e.key === 'Enter' && addCheck()} />
                <button onClick={addCheck} disabled={!newCheck.trim()}><Plus size={13} /></button>
              </div>
            </div>

            {/* SUBTASQUES */}
            <div className="section">
              <div className="section-hdr">
                <span className="sec-label">Subtasques</span>
                {subtasks.length > 0 && <span className="sec-count">{doneSubtasks}/{subtasks.length}</span>}
              </div>
              {subtasks.map(s => {
                const assignee = profiles.find(p => p.id === s.assigned_to)
                return (
                  <div key={s.id} className="subtask-row">
                    <button className={`cbox cbox--sq${s.done ? ' cbox--on' : ''}`} onClick={() => toggleSubtask(s.id)}>
                      {s.done && <Check size={9} strokeWidth={3} />}
                    </button>
                    <span className={`ctext${s.done ? ' ctext--done' : ''}`}>{s.title}</span>
                    <select className="subtask-assign" value={s.assigned_to || ''} onChange={e => assignSubtask(s.id, e.target.value)}
                      onClick={e => e.stopPropagation()} title={assignee ? assignee.full_name : 'Sense assignar'}>
                      <option value="">—</option>
                      {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                    </select>
                    {assignee && (
                      <div className="subtask-av" title={assignee.full_name}>
                        {assignee.avatar_url ? <img src={assignee.avatar_url} alt="" /> : getInitials(assignee.full_name)}
                      </div>
                    )}
                    <button className="row-del" onClick={() => delSubtask(s.id)}><Trash2 size={11} /></button>
                  </div>
                )
              })}
              <div className="add-row subtask-add-row">
                <input ref={subtaskRef} value={newSubtask} onChange={e => setNewSubtask(e.target.value)}
                  placeholder="Nova subtasca..." onKeyDown={e => e.key === 'Enter' && addSubtask()} />
                <select className="subtask-assign-new" value={newSubtaskAssignee} onChange={e => setNewSubtaskAssignee(e.target.value)}>
                  <option value="">Assignar a...</option>
                  {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select>
                <button onClick={addSubtask} disabled={!newSubtask.trim()}><Plus size={13} /></button>
              </div>
            </div>

            {/* DESCRIPCIÓ */}
            <div className="section">
              <div className="section-hdr"><span className="sec-label">Descripció</span></div>
              <textarea className="desc-inp" value={form.description}
                onChange={e => dirty('description', e.target.value)}
                placeholder="Afegeix una descripció..." rows={3} />
            </div>

            {/* DOCUMENTS DRIVE */}
            <div className="section">
              <div className="section-hdr">
                <span className="sec-label">Documents Drive</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="ghost-btn-sm" onClick={() => { setShowDrivePicker(true); setShowDriveInput(false) }}>
                    <svg width="10" height="10" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 53H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                      <path d="M43.65 25L29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44A9.06 9.06 0 0 0 0 53h27.5z" fill="#00ac47"/>
                      <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.4 9.5z" fill="#ea4335"/>
                      <path d="M43.65 25L57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                      <path d="M59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                      <path d="M73.4 26.5l-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25 59.8 53h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                    </svg>
                    Drive
                  </button>
                  <button className="ghost-btn-sm" onClick={openDropboxChooser}>
                    <svg width="11" height="11" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 2L0 7.5 8 13l8-5.5L8 2z" fill="#0061FF"/>
                      <path d="M24 2l-8 5.5 8 5.5 8-5.5L24 2z" fill="#0061FF"/>
                      <path d="M0 18.5L8 24l8-5.5-8-5.5L0 18.5z" fill="#0061FF"/>
                      <path d="M24 13l-8 5.5 8 5.5 8-5.5L24 13z" fill="#0061FF"/>
                      <path d="M8 25.5L16 31l8-5.5-8-5.5L8 25.5z" fill="#0061FF"/>
                    </svg>
                    Dropbox
                  </button>
                  <button className="ghost-btn-sm" onClick={() => { setShowDriveInput(v => !v); setShowDrivePicker(false) }}>
                    <Link2 size={11} />URL
                  </button>
                </div>
              </div>
              {driveLinks.map(d => (
                <div key={d.id} className="drive-row">
                  <Link2 size={13} color="#1B2B4B" />
                  <a href={d.url} target="_blank" rel="noopener noreferrer" className="drive-name">{d.name}</a>
                  <ExternalLink size={11} color="#9A9A9A" />
                  <button className="row-del" onClick={() => delDrive(d.id)} style={{ marginLeft: 'auto' }}><Trash2 size={11} /></button>
                </div>
              ))}
              {showDriveInput && (
                <div className="add-row">
                  <input value={newDrive} onChange={e => setNewDrive(e.target.value)}
                    placeholder="Enganxa l'URL de Google Drive..." onKeyDown={e => e.key === 'Enter' && addDrive()} />
                  <button onClick={addDrive} disabled={!newDrive.trim()}><Plus size={13} /></button>
                </div>
              )}
            </div>

            {/* FOTOS */}
            <div className="section">
              <div className="section-hdr">
                <span className="sec-label">Fotos</span>
                <button className="ghost-btn-sm" onClick={() => photoRef.current?.click()} disabled={uploadingPhoto}>
                  {uploadingPhoto ? <Loader2 size={11} className="spin-sm" /> : <Camera size={11} />}
                  {uploadingPhoto ? 'Pujant...' : 'Afegir foto'}
                </button>
                <input ref={photoRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={uploadPhoto} />
              </div>
              {photos.length > 0 && (
                <div className="photos-grid">
                  {photos.map((p, i) => (
                    <div key={p.id} className="photo-thumb">
                      {p.type === 'video'
                        ? <video src={p.url} className="photo-video" onClick={() => setLightboxIdx(i)} />
                        : <img src={p.url} alt={p.name} onClick={() => setLightboxIdx(i)} />
                      }
                      <button className="photo-del" onClick={e => { e.stopPropagation(); delPhoto(p.id) }}><Trash2 size={10} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ACTIVITAT */}
            <div className="section activity-section">
              <div className="section-hdr"><span className="sec-label">Activitat</span></div>

              <div className="timeline">
                {/* Merge comments + activity events, sorted by date */}
                {(() => {
                  const items = [
                    ...comments.map(c => ({ type: 'comment' as const, ts: c.created_at, data: c })),
                    ...activities.map(a => ({ type: 'activity' as const, ts: a.created_at, data: a })),
                  ].sort((a, b) => a.ts.localeCompare(b.ts))

                  if (items.length === 0) return <div className="tl-empty">Sense activitat encara</div>

                  return items.map(item => {
                    if (item.type === 'comment') {
                      const c = item.data as Comment
                      const p = c.profile as any
                      const isOwn = c.user_id === currentUserId
                      return (
                        <div key={`c-${c.id}`} className="tl-comment">
                          <div className="tl-av">
                            {p?.avatar_url ? <img src={p.avatar_url} alt="" /> : getInitials(p?.full_name || '?')}
                          </div>
                          <div className="tl-comment-body">
                            <div className="tl-meta">
                              <span className="tl-name">{p?.full_name || 'Usuari'}</span>
                              <span className="tl-verb">va dir</span>
                              <span className="tl-time">{fmtActivityDate(c.created_at)}</span>
                              {isOwn && <button className="tl-del" onClick={() => delComment(c.id)}><Trash2 size={10} /></button>}
                            </div>
                            <div className="tl-bubble">{renderComment(c.content)}</div>
                          </div>
                        </div>
                      )
                    } else {
                      const a = item.data as Activity
                      const p = a.profile as any
                      return (
                        <div key={`a-${a.id}`} className="tl-event">
                          <div className="tl-av tl-av--sys">
                            {p?.avatar_url ? <img src={p.avatar_url} alt="" /> : getInitials(p?.full_name || '?')}
                          </div>
                          <div className="tl-event-text">
                            <span className="tl-name">{p?.full_name || 'Sistema'}</span>
                            {' '}
                            <span className="tl-action">{formatActivity(a.action, a.details)}</span>
                          </div>
                          <span className="tl-time tl-time--ev">{fmtActivityDate(a.created_at)}</span>
                        </div>
                      )
                    }
                  })
                })()}
              </div>

              {/* Comment input */}
              <div className="comment-inp-wrap">
                {mentionQuery !== null && mentionSuggestions.length > 0 && (
                  <div className="mention-dd">
                    {mentionSuggestions.map(p => (
                      <button key={p.id} className="mention-opt" onClick={() => insertMention(p)}>
                        <div className="mini-av">{p.avatar_url ? <img src={p.avatar_url} /> : getInitials(p.full_name)}</div>
                        {p.full_name}
                      </button>
                    ))}
                  </div>
                )}
                <div className="comment-inp-row">
                  <textarea
                    ref={commentRef}
                    className="comment-inp"
                    value={newComment}
                    onChange={e => handleCommentChange(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment() } }}
                    placeholder="Escriu un comentari... (@nom per mencionar)"
                    rows={1}
                  />
                  <button className="send-btn" onClick={submitComment} disabled={!newComment.trim()}>
                    <Send size={13} />
                  </button>
                </div>
                <div className="comment-hint"><AtSign size={10} />Escriu @ per mencionar un company</div>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="modal-ftr">
            <div className="ftr-left">
              {saving && <span className="txt-autosave"><Loader2 size={12} className="spin-sm" /> Desant...</span>}
              {saved && !saving && <span className="txt-autosave txt-autosave--ok">✓ Guardat</span>}
              {isDirty && !saving && !saved && <span className="txt-autosave txt-autosave--dirty">Canvis sense guardar</span>}
            </div>
            <div className="ftr-right">
              <button className="btn-cancel" onClick={onClose}>Tancar</button>
              <button
                className={`btn-save${saved && !isDirty ? ' btn-save--ok' : ''}`}
                onClick={saveAll}
                disabled={saving}
              >
                <Save size={13} strokeWidth={2.2} />
                {saving ? 'Desant...' : saved && !isDirty ? '✓ Guardat' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showLabelManager && (
        <LabelsManagerModal labels={allLabels} onClose={() => setShowLabelManager(false)}
          onChanged={setAllLabels} />
      )}

      {lightboxIdx !== null && (
        <PhotoLightbox
          photos={photos}
          initialIdx={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}

      {showDrivePicker && (
        <DrivePickerModal
          onClose={() => setShowDrivePicker(false)}
          onSelect={(file) => {
            const items = [...driveLinks, { id: crypto.randomUUID(), url: file.url, name: file.name }]
            setDriveLinks(items)
            persist({ drive_links: items })
          }}
        />
      )}

      <style jsx>{`
        .overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.45);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000; padding: 20px;
        }
        .modal {
          background: white; border-radius: 16px; width: 100%; max-width: 640px;
          max-height: 92vh; display: flex; flex-direction: column;
          box-shadow: 0 24px 64px rgba(0,0,0,0.22); overflow: hidden;
        }

        /* Header */
        .modal-hdr {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 20px; border-bottom: 1px solid #F0F0F0; flex-shrink: 0;
        }
        .status-badge {
          display: flex; align-items: center; gap: 6px; font-size: 11px;
          font-weight: 700; padding: 4px 10px; border-radius: 20px;
        }
        .dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .hdr-right { display: flex; align-items: center; gap: 10px; }
        .txt-dirty { font-size: 12px; color: #D97706; font-weight: 500; }
        .txt-saved { font-size: 12px; color: #16A34A; font-weight: 600; }
        .close-btn {
          width: 28px; height: 28px; border: none; background: #F0F0F0; border-radius: 6px;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          color: #5C5C5C; transition: all 0.15s;
        }
        .close-btn:hover { background: #E8E8E8; color: #0a0a0a; }

        /* Body */
        .modal-body { padding: 18px 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; flex: 1; }

        /* Title */
        .title-inp {
          font-size: 18px; font-weight: 700; color: #0a0a0a; border: none; outline: none;
          resize: none; width: 100%; font-family: inherit; line-height: 1.3; background: transparent; padding: 0;
          text-transform: uppercase; letter-spacing: 0.01em;
        }
        .title-inp::placeholder { color: #D0D0D0; }

        /* Responsible below title */
        .title-resp-row { margin-top: -6px; }
        .resp-chip {
          display: inline-flex; align-items: center; gap: 7px;
          background: none; border: 1.5px solid transparent; border-radius: 20px;
          padding: 3px 10px 3px 3px; cursor: pointer; font-family: inherit;
          transition: all 0.12s;
        }
        .resp-chip:hover { border-color: #E8EAF0; background: #F8F9FF; }
        .resp-av {
          width: 24px; height: 24px; border-radius: 50%;
          background: #1B2B4B18; color: #1B2B4B; font-size: 9px; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; overflow: hidden;
        }
        .resp-av img { width: 100%; height: 100%; object-fit: cover; }
        .resp-av--empty { background: #F0F0F0; color: #B0B0B0; }
        .resp-chip-name { font-size: 12.5px; font-weight: 600; color: #2A3A5A; }
        .resp-chip-name--empty { color: #B8BCC8; font-weight: 500; }
        .resp-picker {
          position: absolute; top: calc(100% + 6px); left: 0; z-index: 200;
          background: white; border: 1.5px solid #EEEFF2; border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12); min-width: 180px; overflow: hidden;
          padding: 4px;
        }
        .resp-picker-opt {
          display: flex; align-items: center; gap: 9px; width: 100%;
          background: none; border: none; padding: 8px 10px; border-radius: 8px;
          cursor: pointer; font-family: inherit; font-size: 13px; color: #333;
          transition: background 0.1s;
        }
        .resp-picker-opt:hover { background: #F5F7FB; }
        .resp-picker-opt--on { background: #F0F4FF; font-weight: 600; color: #1B2B4B; }

        /* Meta row */
        .meta-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
        .label-zone { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; }
        .watcher-zone { display: flex; align-items: center; gap: 6px; }
        .chip {
          display: inline-flex; align-items: center; gap: 5px; font-size: 11px;
          font-weight: 600; padding: 3px 8px; border-radius: 20px; border: 1px solid;
        }
        .chip-rm { border: none; background: transparent; cursor: pointer; font-size: 13px; color: inherit; opacity: 0.6; padding: 0 0 0 2px; }

        .watcher-av {
          width: 26px; height: 26px; border-radius: 50%; background: #1B2B4B14; color: #1B2B4B;
          font-size: 9px; font-weight: 700; display: flex; align-items: center; justify-content: center;
          cursor: pointer; overflow: hidden; border: 2px solid white; box-shadow: 0 0 0 1px #E0E0E0;
          transition: box-shadow 0.15s;
        }
        .watcher-av:hover { box-shadow: 0 0 0 2px #DC2626; }
        .watcher-av img { width: 100%; height: 100%; object-fit: cover; }

        .rel-wrap { position: relative; }
        .ghost-btn {
          display: inline-flex; align-items: center; gap: 4px; font-size: 11.5px; color: #9A9A9A;
          border: 1px dashed #E0E0E0; background: transparent; border-radius: 20px;
          padding: 3px 10px; cursor: pointer; font-family: inherit; transition: all 0.15s;
        }
        .ghost-btn:hover { color: #5C5C5C; border-color: #C0C0C0; }
        .ghost-btn-sm {
          display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color: #9A9A9A;
          border: none; background: transparent; cursor: pointer; font-family: inherit;
          transition: color 0.15s; padding: 2px 4px;
        }
        .ghost-btn-sm:hover { color: #1B2B4B; }

        .picker-dd {
          position: absolute; top: calc(100% + 6px); left: 0; background: white;
          border: 1px solid #E8E8E8; border-radius: 10px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12); z-index: 20; padding: 4px; min-width: 160px;
        }
        .picker-dd--right { left: auto; right: 0; }
        .picker-label { font-size: 10px; font-weight: 700; color: #9A9A9A; letter-spacing: 0.05em; text-transform: uppercase; padding: 6px 10px 4px; }
        .picker-empty { font-size: 12px; color: #9A9A9A; padding: 10px 12px; text-align: center; }
        .picker-opt {
          display: flex; align-items: center; gap: 8px; width: 100%; padding: 7px 10px;
          border: none; background: transparent; cursor: pointer; border-radius: 7px;
          font-size: 12.5px; font-family: inherit; text-align: left; transition: background 0.1s;
        }
        .picker-opt:hover { background: #F5F5F5; }
        .picker-opt--on { background: #F5F5F5; }
        .picker-mgr {
          display: flex; align-items: center; gap: 6px; width: 100%; padding: 7px 10px;
          border: none; border-top: 1px solid #F0F0F0; background: transparent; cursor: pointer;
          border-radius: 0 0 7px 7px; font-size: 12px; color: #9A9A9A; font-family: inherit;
          margin-top: 4px; transition: background 0.1s;
        }
        .picker-mgr:hover { background: #F5F5F5; color: #5C5C5C; }

        .mini-av {
          width: 22px; height: 22px; border-radius: 50%; background: #F0F0F0; color: #5C5C5C;
          font-size: 8px; font-weight: 700; display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; overflow: hidden;
        }
        .mini-av img { width: 100%; height: 100%; object-fit: cover; }

        /* Fields grid */
        .grid6 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .field { display: flex; flex-direction: column; gap: 4px; }
        .field label { font-size: 10.5px; font-weight: 700; color: #9A9A9A; letter-spacing: 0.05em; text-transform: uppercase; }
        .field select, .field input {
          height: 34px; padding: 0 9px; border: 1.5px solid #E8E8E8; border-radius: 7px;
          font-size: 12.5px; color: #0a0a0a; background: #FAFAFA; outline: none;
          font-family: inherit; transition: border-color 0.15s;
        }
        .field select:focus, .field input:focus { border-color: #1B2B4B; background: white; }

        /* Section */
        .section { display: flex; flex-direction: column; gap: 8px; border-top: 1px solid #F4F4F4; padding-top: 14px; }
        .section-hdr { display: flex; align-items: center; justify-content: space-between; }
        .sec-label { font-size: 10.5px; font-weight: 700; color: #9A9A9A; letter-spacing: 0.06em; text-transform: uppercase; }
        .sec-count { font-size: 11px; font-weight: 600; color: #9A9A9A; }
        .progress-bar { height: 3px; background: #F0F0F0; border-radius: 2px; }
        .progress-fill { height: 100%; background: #16A34A; border-radius: 2px; transition: width 0.3s; }

        /* Photos grid */
        .photos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 8px; }
        .photo-thumb { position: relative; aspect-ratio: 1; border-radius: 8px; overflow: hidden; cursor: pointer; background: #F0F0F0; }
        .photo-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .photo-video { width: 100%; height: 100%; object-fit: cover; display: block; cursor: pointer; }
        .photo-del { position: absolute; top: 4px; right: 4px; width: 22px; height: 22px; border: none; border-radius: 5px; background: rgba(0,0,0,0.65); color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.15s; z-index: 10; }
        .photo-thumb:hover .photo-del { opacity: 1; }
        .photo-del:hover { background: rgba(220,38,38,0.85); }
        :global(.spin-sm) { animation: spin 0.8s linear infinite; }

        /* Check / Subtask rows */
        .check-row { display: flex; align-items: center; gap: 9px; padding: 3px 0; }
        .cbox {
          width: 17px; height: 17px; border: 2px solid #D0D0D0; border-radius: 4px; background: white;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; transition: all 0.15s; color: white;
        }
        .cbox--sq { border-radius: 4px; }
        .cbox--on { background: #16A34A; border-color: #16A34A; }
        .ctext { font-size: 13px; color: #0a0a0a; flex: 1; }
        .ctext--done { text-decoration: line-through; color: #9A9A9A; }
        .row-del {
          border: none; background: transparent; cursor: pointer; color: #D0D0D0;
          padding: 2px; display: flex; opacity: 0; transition: opacity 0.15s, color 0.15s;
        }
        .check-row:hover .row-del, .drive-row:hover .row-del, .comment-row:hover .row-del { opacity: 1; }
        .row-del:hover { color: #DC2626; }

        .add-row { display: flex; gap: 7px; }
        .add-row input {
          flex: 1; height: 32px; padding: 0 9px; border: 1.5px solid #E8E8E8; border-radius: 7px;
          font-size: 13px; font-family: inherit; outline: none; background: #FAFAFA; transition: border-color 0.15s;
        }
        .add-row input:focus { border-color: #1B2B4B; background: white; }
        .add-row input::placeholder { color: #C0C0C0; }
        .add-row button {
          width: 32px; height: 32px; border: none; background: #1B2B4B; color: white;
          border-radius: 7px; cursor: pointer; display: flex; align-items: center;
          justify-content: center; flex-shrink: 0; transition: background 0.15s;
        }
        .add-row button:hover:not(:disabled) { background: #4A82C6; }
        .add-row button:disabled { background: #E8E8E8; cursor: not-allowed; }

        /* Subtask rows */
        .subtask-row {
          display: flex; align-items: center; gap: 8px; padding: 3px 0;
        }
        .subtask-row .ctext { flex: 1; }
        .subtask-av {
          width: 20px; height: 20px; border-radius: 50%; background: #1B2B4B14; color: #1B2B4B;
          font-size: 8px; font-weight: 700; display: flex; align-items: center;
          justify-content: center; flex-shrink: 0; overflow: hidden;
        }
        .subtask-av img { width: 100%; height: 100%; object-fit: cover; }
        .subtask-assign {
          font-size: 11px; border: 1px solid #E8E8E8; border-radius: 5px; padding: 2px 5px;
          color: #9A9A9A; background: white; cursor: pointer; outline: none; font-family: inherit;
          max-width: 110px; flex-shrink: 0;
        }
        .subtask-assign:focus { border-color: #1B2B4B; }
        .subtask-add-row .subtask-assign-new {
          flex-shrink: 0; font-size: 11.5px; height: 32px; padding: 0 7px; border: 1.5px solid #E8E8E8;
          border-radius: 7px; font-family: inherit; outline: none; background: #FAFAFA;
          color: #5C5C5C; cursor: pointer; max-width: 120px;
        }
        .subtask-assign-new:focus { border-color: #1B2B4B; }
        .subtask-row:hover .row-del { opacity: 1; }

        /* Description */
        .desc-inp {
          border: 1.5px solid #E8E8E8; border-radius: 8px; padding: 9px 10px;
          font-size: 13.5px; color: #0a0a0a; font-family: inherit; resize: vertical;
          outline: none; background: #FAFAFA; transition: border-color 0.15s; line-height: 1.5;
        }
        .desc-inp:focus { border-color: #1B2B4B; background: white; }
        .desc-inp::placeholder { color: #C0C0C0; }

        /* Drive */
        .drive-row {
          display: flex; align-items: center; gap: 8px; padding: 7px 10px;
          background: #F8F9FF; border-radius: 8px; border: 1px solid #E8EEFF;
        }
        .drive-name { font-size: 13px; color: #1B2B4B; text-decoration: none; flex: 1; }
        .drive-name:hover { text-decoration: underline; }

        /* Activity */
        .activity-section { gap: 12px; }

        /* Timeline */
        .timeline { display: flex; flex-direction: column; gap: 0; }
        .tl-empty { font-size: 12.5px; color: #C0C0C0; text-align: center; padding: 16px; }

        /* Shared avatar */
        .tl-av {
          width: 30px; height: 30px; border-radius: 50%; background: #1B2B4B; color: white;
          font-size: 10px; font-weight: 700; display: flex; align-items: center;
          justify-content: center; flex-shrink: 0; overflow: hidden;
        }
        .tl-av img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }

        /* Comment row */
        .tl-comment { display: flex; align-items: flex-start; gap: 10px; padding: 10px 0; border-bottom: 1px solid #F4F4F4; }
        .tl-comment:last-child { border-bottom: none; }
        .tl-comment-body { flex: 1; min-width: 0; }
        .tl-meta { display: flex; align-items: baseline; gap: 6px; margin-bottom: 5px; flex-wrap: wrap; }
        .tl-name { font-size: 12.5px; font-weight: 700; color: #0a0a0a; }
        .tl-verb { font-size: 12px; color: #9A9A9A; }
        .tl-time { font-size: 11px; color: #B0B0B0; }
        .tl-del { border: none; background: none; cursor: pointer; color: #D0D0D0; padding: 0 2px; display: flex; opacity: 0; transition: opacity 0.15s, color 0.15s; margin-left: auto; }
        .tl-comment:hover .tl-del { opacity: 1; }
        .tl-del:hover { color: #DC2626; }
        .tl-bubble {
          background: #F7F7F7; border-radius: 0 10px 10px 10px;
          padding: 9px 12px; font-size: 13px; color: #1a1a1a;
          line-height: 1.5; word-break: break-word; border: 1px solid #EFEFEF;
        }

        /* Activity event row */
        .tl-event { display: flex; align-items: center; gap: 10px; padding: 7px 0; }
        .tl-av--sys { background: #1B2B4B; width: 26px; height: 26px; font-size: 9px; }
        .tl-event-text { flex: 1; font-size: 12.5px; color: #5C5C5C; line-height: 1.4; }
        .tl-event-text .tl-name { font-weight: 700; color: #0a0a0a; font-size: 12.5px; }
        .tl-action { color: #5C5C5C; }
        .tl-time--ev { font-size: 11px; color: #B0B0B0; white-space: nowrap; flex-shrink: 0; }

        :global(.mention) { color: #1B2B4B; font-weight: 600; background: #1B2B4B0D; padding: 0 2px; border-radius: 3px; }

        .comment-inp-wrap { position: relative; display: flex; flex-direction: column; gap: 5px; }
        .mention-dd {
          position: absolute; bottom: calc(100% + 4px); left: 0; background: white;
          border: 1px solid #E8E8E8; border-radius: 8px; box-shadow: 0 8px 20px rgba(0,0,0,0.1);
          z-index: 20; padding: 4px; min-width: 180px;
        }
        .mention-opt {
          display: flex; align-items: center; gap: 8px; width: 100%; padding: 7px 10px;
          border: none; background: transparent; cursor: pointer; border-radius: 6px;
          font-size: 12.5px; font-family: inherit; transition: background 0.1s;
        }
        .mention-opt:hover { background: #F5F5F5; }
        .comment-inp-row { display: flex; gap: 7px; align-items: flex-end; }
        .comment-inp {
          flex: 1; min-height: 36px; padding: 8px 10px;
          border: 1.5px solid #E8E8E8; border-radius: 8px; font-size: 13px;
          font-family: inherit; outline: none; background: #FAFAFA; resize: none;
          transition: border-color 0.15s; line-height: 1.4;
        }
        .comment-inp:focus { border-color: #1B2B4B; background: white; }
        .comment-inp::placeholder { color: #C0C0C0; }
        .send-btn {
          width: 34px; height: 34px; border: none; background: #1B2B4B; color: white;
          border-radius: 8px; cursor: pointer; display: flex; align-items: center;
          justify-content: center; flex-shrink: 0; transition: background 0.15s;
        }
        .send-btn:hover:not(:disabled) { background: #4A82C6; }
        .send-btn:disabled { background: #E8E8E8; cursor: not-allowed; }
        .comment-hint { font-size: 11px; color: #C0C0C0; display: flex; align-items: center; gap: 4px; }

        /* Footer */
        .modal-ftr {
          display: flex; align-items: center; justify-content: space-between; gap: 8px;
          padding: 12px 20px; border-top: 1px solid #F0F0F0; flex-shrink: 0; background: white;
        }
        .ftr-left { display: flex; align-items: center; flex: 1; min-width: 0; }
        .ftr-right { display: flex; align-items: center; gap: 8px; }
        .txt-autosave { font-size: 12px; color: #9A9A9A; display: flex; align-items: center; gap: 5px; }
        .txt-autosave--ok { color: #16A34A; font-weight: 600; }
        .txt-autosave--dirty { color: #D97706; font-weight: 500; }

        .btn-cancel {
          height: 34px; padding: 0 14px; border: 1px solid #E8E8E8; border-radius: 7px;
          font-size: 13px; font-weight: 500; cursor: pointer; background: white;
          color: #5C5C5C; font-family: inherit; transition: all 0.15s;
        }
        .btn-cancel:hover { border-color: #D0D0D0; color: #0a0a0a; }
        .btn-save {
          display: flex; align-items: center; gap: 6px; height: 34px; padding: 0 16px;
          background: #1B2B4B; color: white; border: none; border-radius: 7px;
          font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.15s;
        }
        .btn-save:hover:not(:disabled) { background: #2563EB; }
        .btn-save:disabled { opacity: 0.45; cursor: not-allowed; }
        .btn-save--ok { background: #16A34A; }
        .btn-save--ok:hover:not(:disabled) { background: #15803D; }
      `}</style>
    </>,
    document.body
  )
}

function PhotoLightbox({
  photos,
  initialIdx,
  onClose,
}: {
  photos: { id: string; url: string; name: string }[]
  initialIdx: number
  onClose: () => void
}) {
  const [idx, setIdx] = useState(initialIdx)
  const total = photos.length
  const photo = photos[idx]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') setIdx(i => (i - 1 + total) % total)
      if (e.key === 'ArrowRight') setIdx(i => (i + 1) % total)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [total, onClose])

  if (!photo) return null

  return (
    <div className="lb-overlay" onClick={onClose}>
      <div className="lb-box" onClick={e => e.stopPropagation()}>
        {/* Close */}
        <button className="lb-close" onClick={onClose}><X size={18} /></button>

        {/* Prev */}
        {total > 1 && (
          <button className="lb-nav lb-nav--prev" onClick={() => setIdx(i => (i - 1 + total) % total)}>
            ‹
          </button>
        )}

        {/* Image */}
        <img className="lb-img" src={photo.url} alt={photo.name} />

        {/* Next */}
        {total > 1 && (
          <button className="lb-nav lb-nav--next" onClick={() => setIdx(i => (i + 1) % total)}>
            ›
          </button>
        )}

        {/* Caption */}
        <div className="lb-caption">
          <span className="lb-name">{photo.name}</span>
          {total > 1 && <span className="lb-count">{idx + 1} / {total}</span>}
          <a href={photo.url} target="_blank" rel="noopener noreferrer" className="lb-ext" onClick={e => e.stopPropagation()}>
            <ExternalLink size={13} /> Obrir original
          </a>
        </div>
      </div>

      <style jsx>{`
        .lb-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.85);
          display: flex; align-items: center; justify-content: center;
          z-index: 9999; padding: 24px;
        }
        .lb-box {
          position: relative; max-width: 90vw; max-height: 90vh;
          display: flex; flex-direction: column; align-items: center; gap: 12px;
        }
        .lb-img {
          max-width: 100%; max-height: 80vh; object-fit: contain;
          border-radius: 10px; box-shadow: 0 8px 40px rgba(0,0,0,0.5);
          display: block;
        }
        .lb-close {
          position: absolute; top: -40px; right: 0;
          width: 32px; height: 32px; border: none; background: rgba(255,255,255,0.15);
          border-radius: 8px; color: white; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s;
        }
        .lb-close:hover { background: rgba(255,255,255,0.3); }
        .lb-nav {
          position: absolute; top: 50%; transform: translateY(-50%);
          width: 44px; height: 44px; border: none; background: rgba(255,255,255,0.15);
          border-radius: 50%; color: white; cursor: pointer; font-size: 28px; line-height: 1;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s; z-index: 1;
        }
        .lb-nav:hover { background: rgba(255,255,255,0.3); }
        .lb-nav--prev { left: -56px; }
        .lb-nav--next { right: -56px; }
        .lb-caption {
          display: flex; align-items: center; gap: 12px;
          color: rgba(255,255,255,0.75); font-size: 13px;
        }
        .lb-name { font-weight: 500; color: white; }
        .lb-count { color: rgba(255,255,255,0.5); }
        .lb-ext {
          display: flex; align-items: center; gap: 4px; color: rgba(255,255,255,0.6);
          text-decoration: none; transition: color 0.15s;
        }
        .lb-ext:hover { color: white; }
      `}</style>
    </div>
  )
}
