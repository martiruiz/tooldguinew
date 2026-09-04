import { createClient as createSupabase } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/Topbar'
import { ClientsContent } from '@/components/clients/ClientsContent'
import type { Profile } from '@/types'

export default async function ClientsPage() {
  const supabase = await createSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()

  const { data: clientsData, error: clientsError } = await supabase
    .from('clients')
    .select(`
      *,
      responsible:profiles!clients_responsible_id_fkey(id, full_name, avatar_url),
      projects:projects(count),
      tasks:tasks(count)
    `)
    .order('name', { ascending: true })

  if (clientsError) console.error('[Clients] query error:', clientsError)

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('is_active', true)

  return (
    <>
      <Topbar user={profile as Profile} title="Clients" />
      <ClientsContent clients={clientsData || []} profiles={profiles || []} userRole={profile?.role} />
    </>
  )
}
