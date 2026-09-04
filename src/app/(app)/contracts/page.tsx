import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Topbar } from '@/components/layout/Topbar'
import { ContractsContent } from '@/components/contracts/ContractsContent'
import type { Profile } from '@/types'

export default async function ContractsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if ((profile as Profile)?.role !== 'superadmin') redirect('/dashboard')

  const [{ data: clients }, { data: contracts }] = await Promise.all([
    supabase.from('clients').select('id, name').order('name'),
    supabase.from('contracts').select('*, client:clients(id,name)').order('created_at', { ascending: false }),
  ])

  return (
    <>
      <Topbar user={profile as Profile} title="Contractes" />
      <ContractsContent clients={clients || []} contracts={contracts || []} />
    </>
  )
}
