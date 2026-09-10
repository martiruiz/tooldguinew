import { createClient as createSupabase } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
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

  // Fetch last_sign_in_at from auth.users via admin client
  let lastSignInMap: Record<string, string> = {}
  try {
    const adminClient = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data: authUsers } = await adminClient.auth.admin.listUsers({ perPage: 200 })
    if (authUsers?.users) {
      for (const u of authUsers.users) {
        if (u.last_sign_in_at) lastSignInMap[u.id] = u.last_sign_in_at
      }
    }
  } catch (err) {
    console.error('[admin] could not fetch auth users:', err)
  }

  return (
    <>
      <Topbar user={profile as Profile} title="Administració" />
      <AdminContent members={members || []} currentUserId={user!.id} lastSignInMap={lastSignInMap} />
    </>
  )
}
