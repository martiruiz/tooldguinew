import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/Topbar'
import { ProfileContent } from '@/components/profile/ProfileContent'
import type { Profile } from '@/types'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()

  let allMembers: Profile[] = []
  if ((profile as Profile)?.role === 'superadmin') {
    const { data: members } = await supabase.from('profiles').select('*').order('created_at')
    allMembers = (members as Profile[]) || []
  }

  return (
    <>
      <Topbar user={profile as Profile} title="El meu perfil" />
      <ProfileContent profile={profile as Profile} allMembers={allMembers} />
    </>
  )
}
