import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { Topbar } from '@/components/layout/Topbar'
import { DashboardContent } from '@/components/dashboard/DashboardContent'
import { getCalendarClientWithRefresh } from '@/lib/google'
import type { Profile, Meeting } from '@/types'

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

  // Google Calendar events today (from all connected team members)
  let gcalMeetings: Meeting[] = []
  try {
    const admin = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data: allTokens } = await admin
      .from('google_calendar_tokens')
      .select('user_id, access_token, refresh_token, expiry_date')

    if (allTokens && allTokens.length > 0) {
      const events = await Promise.all(
        allTokens.map(async (tokenRow: { user_id: string; access_token: string; refresh_token: string | null; expiry_date: number | null }) => {
          if (!tokenRow.access_token) return []
          try {
            const calendar = await getCalendarClientWithRefresh(tokenRow.user_id, {
              access_token: tokenRow.access_token,
              refresh_token: tokenRow.refresh_token,
              expiry_date: tokenRow.expiry_date,
            })
            const res = await calendar.events.list({
              calendarId: 'primary',
              timeMin: todayStart.toISOString(),
              timeMax: todayEnd.toISOString(),
              singleEvents: true,
              orderBy: 'startTime',
              maxResults: 20,
            })
            return (res.data.items || []).map((e: any) => ({
              id: `gcal-${tokenRow.user_id}-${e.id}`,
              title: e.summary || '(Sense títol)',
              start_time: e.start?.dateTime || e.start?.date || todayStart.toISOString(),
              end_time: e.end?.dateTime || e.end?.date || todayEnd.toISOString(),
              meet_url: e.hangoutLink || undefined,
              description: e.description || undefined,
              created_by: tokenRow.user_id,
              created_at: e.created || new Date().toISOString(),
            } as Meeting))
          } catch {
            return []
          }
        })
      )
      // Merge + deduplicate by title+start_time, prefer gcal entries
      const gcalRaw: Meeting[] = events.flat()
      const seen = new Set<string>()
      const merged: Meeting[] = []
      for (const m of [...(todayMeetings || []), ...gcalRaw]) {
        const key = `${m.title?.toLowerCase()?.trim()}|${m.start_time?.slice(0, 16)}`
        if (!seen.has(key)) { seen.add(key); merged.push(m) }
      }
      gcalMeetings = merged.sort((a, b) => a.start_time.localeCompare(b.start_time))
    }
  } catch (err) {
    console.error('[dashboard] gcal fetch failed:', err)
  }

  const allTodayMeetings = gcalMeetings.length > 0 ? gcalMeetings : (todayMeetings || [])

  // Blocked tasks (any blocked task where user is responsible or created_by)
  const { data: blockedTasks } = await supabase
    .from('tasks')
    .select('*, client:clients(id,name), responsible:profiles!tasks_responsible_id_fkey(id,full_name)')
    .eq('status', 'blocked')
    .neq('status', 'done')
    .order('updated_at', { ascending: false })
    .limit(8)

  // CRM summary for superadmin
  const isSuperAdmin = (profile as Profile)?.role === 'superadmin'
  const isManager = (profile as Profile)?.role === 'manager'

  const { data: opportunities } = isSuperAdmin
    ? await supabase.from('opportunities').select('stage, value, close_date, created_at').order('created_at', { ascending: false })
    : { data: null }

  // PM-specific data: all tasks on projects where user is responsible
  const { data: pmProjectIds } = isManager
    ? await supabase.from('projects').select('id').eq('responsible_id', user.id).eq('status', 'active')
    : { data: null }

  const pmIds = (pmProjectIds ?? []).map((p: { id: string }) => p.id)

  const { data: allProjectTasks } = isManager && pmIds.length > 0
    ? await supabase
        .from('tasks')
        .select('*, client:clients(id,name), project:projects(id,name), responsible:profiles!tasks_responsible_id_fkey(id,full_name)')
        .in('project_id', pmIds)
        .neq('status', 'done')
        .order('deadline', { ascending: true })
        .limit(100)
    : { data: null }

  const { data: pmProjects } = isManager
    ? await supabase
        .from('projects')
        .select('*, client:clients(id,name,logo_url)')
        .eq('responsible_id', user.id)
        .eq('status', 'active')
        .order('name')
    : { data: null }

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
    .neq('health', 'risk')

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
        meetings={allTodayMeetings}
        profiles={allProfiles || []}
        clients={allClients || []}
        allProjects={allProjects || []}
        currentUserId={user.id}
        blockedTasks={blockedTasks || []}
        inboxNotifs={inboxNotifs || []}
        opportunities={opportunities || []}
        stats={{
          activeClients: activeClientsCount || 0,
          activeProjects: activeProjectsCount || 0,
          pendingTasks: pendingTasksCount || 0,
        }}
        allProjectTasks={allProjectTasks || []}
        pmProjects={pmProjects || []}
      />
    </>
  )
}
