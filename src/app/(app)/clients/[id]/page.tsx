import { createClient as createSupabase } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/Topbar'
import { ClientDetail } from '@/components/clients/ClientDetail'
import { createAdminClient } from '@/lib/supabase/serverAdmin'
import { notFound } from 'next/navigation'
import type { Profile } from '@/types'

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()

  const { data: client, error: clientErr } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (clientErr) console.error('[ClientDetail] client fetch error:', clientErr)
  if (!client) notFound()

  const [
    { data: projects, error: projErr },
    { data: tasks, error: tasksErr },
    { data: briefing },
    { data: strategy },
    { data: allProfiles },
    { data: metricReports },
  ] = await Promise.all([
    supabase.from('projects').select('id, name, type, status, start_date, end_date, responsible:profiles(id,full_name)').eq('client_id', id).order('created_at', { ascending: false }),
    supabase.from('tasks').select('id, title, status, priority, deadline, responsible:profiles!tasks_responsible_id_fkey(id,full_name)').eq('client_id', id).neq('status', 'done').order('deadline', { ascending: true }).limit(10),
    supabase.from('briefings').select('*').eq('client_id', id).maybeSingle(),
    supabase.from('strategies').select('*').eq('client_id', id).maybeSingle(),
    supabase.from('profiles').select('id, full_name').eq('is_active', true),
    supabase.from('metric_reports').select('*').eq('client_id', id).order('created_at', { ascending: false }),
  ])

  if (projErr) console.error('[ClientDetail] projects error:', projErr)
  if (tasksErr) console.error('[ClientDetail] tasks error:', tasksErr)

  // AI insights for this client (superadmin + manager only)
  const isPrivileged = profile?.role === 'superadmin' || profile?.role === 'manager'
  let clientInsights: any[] = []
  if (isPrivileged) {
    try {
      const admin = createAdminClient()
      const { data: ins } = await admin
        .from('ai_insights')
        .select('id, type, severity, title, summary, evidence, created_at, resolved')
        .eq('entity_type', 'client')
        .eq('entity_id', id)
        .eq('resolved', false)
        .order('severity', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(20)
      clientInsights = ins ?? []
    } catch {}
  }

  return (
    <>
      <Topbar user={profile as Profile} />
      <ClientDetail
        client={client}
        projects={(projects || []) as any}
        tasks={(tasks || []) as any}
        briefing={briefing || null}
        strategy={strategy || null}
        userRole={profile?.role}
        profiles={allProfiles || []}
        currentUserId={user!.id}
        metricReports={metricReports || []}
        clientInsights={clientInsights}
      />
    </>
  )
}
