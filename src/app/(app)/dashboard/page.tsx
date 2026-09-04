import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Topbar } from '@/components/layout/Topbar'
import { DashboardContent } from '@/components/dashboard/DashboardContent'
import type { Profile } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Tasks due today or overdue
  const today = new Date().toISOString().split('T')[0]
  const { data: myTasks } = await supabase
    .from('tasks')
    .select('*, client:clients(id,name,logo_url), project:projects(id,name), responsible:profiles!tasks_responsible_id_fkey(id,full_name)')
    .eq('responsible_id', user.id)
    .neq('status', 'done')
    .order('deadline', { ascending: true })
    .limit(10)

  const { data: allProfiles } = await supabase.from('profiles').select('id, full_name, avatar_url').eq('is_active', true).order('full_name')
  const { data: allClients } = await supabase.from('clients').select('id, name').order('name')
  const { data: allProjects } = await supabase.from('projects').select('id, name').order('name')

  // Active projects
  const { data: myProjects } = await supabase
    .from('projects')
    .select('*, client:clients(id,name,logo_url)')
    .eq('responsible_id', user.id)
    .eq('status', 'active')
    .limit(5)

  // Recent activity
  const { data: activity } = await supabase
    .from('activity_logs')
    .select('*, user:profiles(id,full_name)')
    .order('created_at', { ascending: false })
    .limit(8)

  // Meetings today
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const { data: todayMeetings } = await supabase
    .from('meetings')
    .select('*, client:clients(id,name)')
    .gte('start_time', todayStart.toISOString())
    .lte('start_time', todayEnd.toISOString())
    .order('start_time', { ascending: true })

  // Blocked tasks (any blocked task where user is responsible or created_by)
  const { data: blockedTasks } = await supabase
    .from('tasks')
    .select('*, client:clients(id,name), responsible:profiles!tasks_responsible_id_fkey(id,full_name)')
    .eq('status', 'blocked')
    .neq('status', 'done')
    .order('updated_at', { ascending: false })
    .limit(8)

  // Inbox notifications
  const { data: inboxNotifs } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .eq('read', false)
    .order('created_at', { ascending: false })
    .limit(20)

  // Stats
  const { count: activeClientsCount } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  const { count: activeProjectsCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  const { count: pendingTasksCount } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('responsible_id', user.id)
    .neq('status', 'done')

  return (
    <>
      <Topbar user={profile as Profile} />
      <DashboardContent
        user={profile as Profile}
        tasks={myTasks || []}
        projects={myProjects || []}
        activity={activity || []}
        meetings={todayMeetings || []}
        profiles={allProfiles || []}
        clients={allClients || []}
        allProjects={allProjects || []}
        currentUserId={user.id}
        blockedTasks={blockedTasks || []}
        inboxNotifs={inboxNotifs || []}
        stats={{
          activeClients: activeClientsCount || 0,
          activeProjects: activeProjectsCount || 0,
          pendingTasks: pendingTasksCount || 0,
        }}
      />
    </>
  )
}
