'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'
import { TaskDetailModal } from './TaskDetailModal'
import type { Task } from '@/types'

interface Props {
  clients: { id: string; name: string }[]
  projects: { id: string; name: string }[]
  profiles: { id: string; full_name: string; avatar_url?: string }[]
  currentUserId: string
  defaultStatus?: Task['status']
  defaultClientId?: string
  defaultProjectId?: string
  onClose: () => void
  onCreated: (task: Task) => void
}

export function CreateTaskModal({
  clients, projects, profiles, currentUserId,
  defaultStatus, defaultClientId, defaultProjectId,
  onClose, onCreated,
}: Props) {
  const [task, setTask] = useState<Task | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.from('tasks')
      .insert({
        title: 'NOVA TASCA',
        status: defaultStatus || 'todo',
        priority: 'medium',
        responsible_id: currentUserId,
        created_by: currentUserId,
        client_id: defaultClientId || null,
        project_id: defaultProjectId || null,
      })
      .select(`
        *,
        client:clients(id,name),
        project:projects(id,name),
        responsible:profiles!tasks_responsible_id_fkey(id,full_name,avatar_url)
      `)
      .single()
      .then(({ data, error }) => {
        if (error) { console.error('[CreateTaskModal]', error.message); onClose(); return }
        if (data) setTask(data as Task)
      })
  }, [])

  if (!mounted) return null

  if (!task) return createPortal(
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{
        background: 'white', borderRadius: 16, padding: '32px 40px',
        fontSize: 14, color: '#5C5C5C', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#254067" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
            <animateTransform attributeName="transform" type="rotate" values="0 12 12;360 12 12" dur="0.8s" repeatCount="indefinite"/>
          </path>
        </svg>
        Creant tasca...
      </div>
    </div>,
    document.body
  )

  return (
    <TaskDetailModal
      task={task}
      profiles={profiles}
      clients={clients}
      projects={projects}
      currentUserId={currentUserId}
      onClose={onClose}
      onUpdated={(updated) => {
        onCreated(updated)
        // Keep modal open so user can fill in details
      }}
    />
  )
}
