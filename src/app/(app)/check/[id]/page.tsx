import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/Topbar'
import { SessionDetailPage } from '@/components/check/SessionDetailPage'
import { notFound, redirect } from 'next/navigation'
import type { Profile } from '@/types'

export default async function CheckSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: session }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('content_sessions').select('*, client:clients(id, name)').eq('id', id).single(),
  ])

  if (!session) notFound()

  return (
    <>
      <Topbar user={profile as Profile} title={session.client?.name || 'Sessió'} />
      <SessionDetailPage session={session as any} />
    </>
  )
}
