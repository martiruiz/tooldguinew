import { createClient as createSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Topbar } from '@/components/layout/Topbar'
import { ClientsContent } from '@/components/clients/ClientsContent'
import type { Profile } from '@/types'

export default async function SportsClientsPage() {
  const supabase = await createSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if ((profile as Profile)?.role !== 'superadmin') redirect('/dashboard')

  // Derive SCP clients from the SCP CRM opportunities (unique client names)
  const { data: opportunities } = await supabase
    .from('opportunities')
    .select('client_id, client_name')
    .eq('crm_source', 'scp')

  // Get unique client_ids that are linked to SCP opportunities
  const scpClientIds = [...new Set(
    (opportunities ?? []).filter(o => o.client_id).map(o => o.client_id)
  )]

  let clientsData: any[] = []
  if (scpClientIds.length > 0) {
    const { data } = await supabase
      .from('clients')
      .select(`
        *,
        responsible:profiles!clients_responsible_id_fkey(id, full_name, avatar_url),
        projects:projects(count),
        tasks:tasks(count)
      `)
      .in('id', scpClientIds)
      .order('name', { ascending: true })
    clientsData = data ?? []
  }

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('is_active', true)

  return (
    <>
      <Topbar user={profile as Profile} title="Clients SCP" />
      <ClientsContent clients={clientsData} profiles={profiles || []} userRole={profile?.role} />
    </>
  )
}
