import { createClient as createSupabase } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/Topbar'
import { ClientDetail } from '@/components/clients/ClientDetail'
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
  ] = await Promise.all([
    supabase.from('projects').select('id, name, type, status, end_date, responsible:profiles(id,full_name)').eq('client_id', id).order('created_at', { ascending: false }),
    supabase.from('tasks').select('id, title, status, priority, deadline, responsible:profiles!tasks_responsible_id_fkey(id,full_name)').eq('client_id', id).neq('status', 'done').order('deadline', { ascending: true }).limit(10),
    supabase.from('briefings').select('*').eq('client_id', id).maybeSingle(),
    supabase.from('strategies').select('*').eq('client_id', id).maybeSingle(),
    supabase.from('profiles').select('id, full_name').eq('is_active', true),
  ])

  if (projErr) console.error('[ClientDetail] projects error:', projErr)
  if (tasksErr) console.error('[ClientDetail] tasks error:', tasksErr)

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
      />
    </>
  )
}
