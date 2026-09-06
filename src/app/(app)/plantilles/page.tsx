import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Topbar } from '@/components/layout/Topbar'
import { PlantillesContent } from '@/components/plantilles/PlantillesContent'
import type { Profile } from '@/types'

export default async function PlantillesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if ((profile as Profile)?.role !== 'superadmin') redirect('/dashboard')

  return (
    <>
      <Topbar user={profile as Profile} title="Plantilles" />
      <PlantillesContent />
    </>
  )
}
