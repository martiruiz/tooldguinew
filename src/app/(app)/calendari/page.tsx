import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Topbar } from '@/components/layout/Topbar'
import { CalendariContent } from './CalendariContent'
import type { Profile } from '@/types'

export default async function CalendariPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const [{ data: importantDates }, { data: albums }, { data: tournaments }, { data: staff }, { data: clients }] = await Promise.all([
    supabase.from('cal_important_dates').select('*').order('date', { ascending: true }),
    supabase.from('cal_albums').select('*').order('date_start', { ascending: true }),
    supabase.from('cal_tournaments').select('*').order('date_start', { ascending: true }),
    supabase.from('cal_tournament_staff').select('*').order('created_at', { ascending: true }),
    supabase.from('clients').select('id, name, logo_url').eq('status', 'active').order('name', { ascending: true }),
  ])

  return (
    <>
      <Topbar user={profile as Profile} title="Calendari" />
      <CalendariContent
        initialImportantDates={importantDates ?? []}
        initialAlbums={albums ?? []}
        initialTournaments={tournaments ?? []}
        initialStaff={staff ?? []}
        clients={clients ?? []}
        currentUserId={user.id}
      />
    </>
  )
}
