import { createClient as createSupabase } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/serverAdmin'
import { Topbar } from '@/components/layout/Topbar'
import { CheckContent } from '@/components/check/CheckContent'
import type { Profile } from '@/types'

export default async function CheckPage() {
  const supabase = await createSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  const admin = createAdminClient()

  const [
    { data: profile },
    { data: clients },
    adminSessions,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user!.id).single(),
    supabase.from('clients').select('id, name').eq('status', 'active').order('name'),
    admin.from('content_sessions').select(`*, client:clients(id, name)`).order('session_date', { ascending: false }),
  ])

  let sessions = adminSessions.data
  if (!sessions) {
    if (adminSessions.error) console.error('[check] admin sessions error:', adminSessions.error)
    const fallback = await supabase.from('content_sessions').select(`*, client:clients(id, name)`).order('session_date', { ascending: false })
    sessions = fallback.data
  }

  return (
    <>
      <Topbar user={profile as Profile} title="Sessions" />
      <CheckContent
        sessions={sessions || []}
        clients={clients || []}
        currentUserId={user!.id}
      />
    </>
  )
}
