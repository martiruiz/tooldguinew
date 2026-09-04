import { createClient as createSupabase } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/Topbar'
import { MetricsContent } from '@/components/metrics/MetricsContent'
import type { Profile } from '@/types'

export default async function MetricsPage() {
  const supabase = await createSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()
  const { data: clients } = await supabase.from('clients').select('id, name').eq('status', 'active').order('name')
  const { data: reports } = await supabase
    .from('metric_reports')
    .select('*, client:clients(id, name)')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <>
      <Topbar user={profile as Profile} title="Mètriques" />
      <MetricsContent
        clients={clients || []}
        reports={reports || []}
        currentUserId={user!.id}
      />
    </>
  )
}
