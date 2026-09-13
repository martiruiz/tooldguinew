import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/serverAdmin'
import { Topbar } from '@/components/layout/Topbar'
import { SessionDetailPage } from '@/components/check/SessionDetailPage'
import { notFound, redirect } from 'next/navigation'
import type { Profile } from '@/types'

export default async function CheckSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const [{ data: profile }, adminResult, { data: profiles }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    admin.from('content_sessions').select('*, client:clients(id, name)').eq('id', id).single(),
    supabase.from('profiles').select('id, full_name, avatar_url').order('full_name'),
  ])

  let session = adminResult.data
  if (!session) {
    if (adminResult.error) console.error('[check/[id]] admin query error:', adminResult.error)
    // fallback: try with user's supabase client (works if RLS allows creator to read own sessions)
    const { data: fallback } = await supabase.from('content_sessions').select('*, client:clients(id, name)').eq('id', id).single()
    session = fallback
  }

  if (!session) notFound()

  return (
    <>
      <Topbar user={profile as Profile} title={session.client?.name || 'Sessió'} />
      <SessionDetailPage session={session as any} profiles={(profiles || []) as { id: string; full_name: string; avatar_url?: string }[]} />
    </>
  )
}
