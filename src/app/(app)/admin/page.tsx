import { createClient as createSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Topbar } from '@/components/layout/Topbar'
import { AdminContent } from '@/components/admin/AdminContent'
import type { Profile } from '@/types'

export default async function AdminPage() {
  const supabase = await createSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()

  if (profile?.role !== 'superadmin') redirect('/dashboard')

  const { data: members } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true })

  return (
    <>
      <Topbar user={profile as Profile} title="Administració" />
      <AdminContent members={members || []} currentUserId={user!.id} />
    </>
  )
}
