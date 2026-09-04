import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { FinancesContent } from '@/components/finances/FinancesContent'
import type { Profile } from '@/types'

export default async function FinancesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if ((profile as Profile)?.role !== 'superadmin') redirect('/dashboard')

  const [{ data: clients }, { data: profiles }] = await Promise.all([
    supabase.from('clients').select('id, name, type, status, logo_url, responsible_id').eq('status', 'active').order('name'),
    supabase.from('profiles').select('id, full_name').eq('is_active', true),
  ])

  return (
    <>
      <Topbar user={profile as Profile} title="Finances" />
      <Suspense fallback={<div style={{ padding: 40, color: '#999', fontSize: 14 }}>Carregant...</div>}>
        <FinancesContent clients={clients || []} profiles={profiles || []} />
      </Suspense>
    </>
  )
}
