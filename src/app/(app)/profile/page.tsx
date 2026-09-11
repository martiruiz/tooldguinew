import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/serverAdmin'
import { Topbar } from '@/components/layout/Topbar'
import { ProfileContent } from '@/components/profile/ProfileContent'
import type { Profile } from '@/types'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

  let allMembers: Profile[] = []
  if ((profile as Profile).role === 'superadmin') {
    const { data: members } = await admin.from('profiles').select('*').order('created_at')
    allMembers = (members as Profile[]) || []
  }

  return (
    <>
      <Topbar user={profile as Profile} title="El meu perfil" />
      <ProfileContent profile={profile as Profile} allMembers={allMembers} />
    </>
  )
}
