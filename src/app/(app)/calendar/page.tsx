import { createClient as createSupabase } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/Topbar'
import { CalendarContent } from '@/components/calendar/CalendarContent'
import type { Profile } from '@/types'

export default async function CalendarPage() {
  const supabase = await createSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()

  const now = new Date()
  const rangeStart = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString()
  const rangeEnd = new Date(now.getFullYear(), now.getMonth() + 3, 0).toISOString()

  const [
    { data: meetings },
    { data: tasks },
    { data: calToken },
    { data: allProfiles },
    { data: clients },
    { data: projects },
    { data: contentSessions },
  ] = await Promise.all([
    supabase
      .from('meetings')
      .select('*, client:clients(id, name)')
      .gte('start_time', rangeStart)
      .lte('start_time', rangeEnd)
      .order('start_time', { ascending: true }),
    supabase
      .from('tasks')
      .select('id, title, deadline, priority, client:clients(id, name)')
      .gte('deadline', rangeStart)
      .lte('deadline', rangeEnd)
      .neq('status', 'done')
      .order('deadline', { ascending: true }),
    supabase
      .from('google_calendar_tokens')
      .select('user_id')
      .eq('user_id', user!.id)
      .single(),
    supabase
      .from('profiles')
      .select('id, full_name, email, position')
      .eq('is_active', true)
      .order('full_name'),
    supabase
      .from('clients')
      .select('id, name')
      .order('name'),
    supabase
      .from('projects')
      .select('id, name, client_id')
      .order('name'),
    supabase
      .from('content_sessions')
      .select('*, client:clients(id, name)')
      .gte('session_date', rangeStart.slice(0, 10))
      .lte('session_date', rangeEnd.slice(0, 10))
      .order('session_date', { ascending: true }),
  ])

  return (
    <>
      <Topbar user={profile as Profile} title="Calendari" />
      <CalendarContent
        meetings={meetings || []}
        tasks={tasks || []}
        isCalendarConnected={!!calToken}
        profiles={allProfiles || []}
        clients={clients || []}
        projects={projects || []}
        currentUserId={user!.id}
        contentSessions={contentSessions || []}
      />
    </>
  )
}
