import { createClient as createSupabase } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/Topbar'
import { TasksContent } from '@/components/tasks/TasksContent'
import type { Profile } from '@/types'

export default async function TasksPage() {
  const supabase = await createSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()

  const { data: tasks } = await supabase
    .from('tasks')
    .select(`
      *,
      client:clients(id, name),
      project:projects(id, name),
      responsible:profiles!tasks_responsible_id_fkey(id, full_name, avatar_url)
    `)
    .order('deadline', { ascending: true, nullsFirst: false })

  const { data: clients } = await supabase.from('clients').select('id, name').eq('status', 'active').order('name')
  const { data: projects } = await supabase.from('projects').select('id, name').eq('status', 'active').order('name')
  const { data: profiles } = await supabase.from('profiles').select('id, full_name, avatar_url').eq('is_active', true)
  const { data: labels } = await supabase.from('labels').select('id, name, color').order('created_at')

  return (
    <>
      <Topbar user={profile as Profile} title="Tasques" />
      <TasksContent
        tasks={tasks || []}
        clients={clients || []}
        projects={projects || []}
        profiles={profiles || []}
        currentUserId={user!.id}
        allLabels={labels || []}
      />
    </>
  )
}
