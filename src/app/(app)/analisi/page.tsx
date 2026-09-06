import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Topbar } from '@/components/layout/Topbar'
import { AnalisiContent } from '@/components/analisi/AnalisiContent'
import type { Profile } from '@/types'

export default async function AnalisiPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if ((profile as Profile)?.role !== 'superadmin') redirect('/dashboard')

  const { data: opportunities } = await supabase
    .from('opportunities')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <>
      <Topbar user={profile as Profile} title="Anàlisi" />
      <AnalisiContent opportunities={opportunities ?? []} />
    </>
  )
}
