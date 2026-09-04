import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Topbar } from '@/components/layout/Topbar'
import { CRMContent } from '@/components/crm/CRMContent'
import type { Profile } from '@/types'

export default async function CRMPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if ((profile as Profile)?.role !== 'superadmin') redirect('/dashboard')

  const [
    { data: clients },
    { data: opportunities },
    { data: profiles },
  ] = await Promise.all([
    supabase.from('clients').select('*, projects:projects(count)').order('name'),
    supabase.from('opportunities').select('*').order('created_at', { ascending: false }),
    supabase.from('profiles').select('id, full_name').eq('is_active', true).order('full_name'),
  ])

  return (
    <>
      <Topbar user={profile as Profile} title="CRM" />
      <CRMContent
        clients={clients || []}
        opportunities={opportunities || []}
        profiles={profiles || []}
        currentUserId={user.id}
      />
    </>
  )
}
