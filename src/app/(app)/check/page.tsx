import { createClient as createSupabase } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/Topbar'
import { CheckContent } from '@/components/check/CheckContent'
import type { Profile } from '@/types'

export default async function CheckPage() {
  const supabase = await createSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()
  const { data: clients } = await supabase.from('clients').select('id, name').eq('status', 'active').order('name')
  const { data: sessions } = await supabase
    .from('content_sessions')
    .select(`*, client:clients(id, name)`)
    .order('session_date', { ascending: false })

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
