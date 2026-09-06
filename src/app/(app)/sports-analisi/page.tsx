import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Topbar } from '@/components/layout/Topbar'
import { AnalisiContent } from '@/components/analisi/AnalisiContent'
import type { Profile } from '@/types'

const SCP_STAGES = [
  { key: 'prospect',       label: 'Lead',        color: '#9A9A9A' },
  { key: 'contactat',      label: 'Contactat',   color: '#7C3AED' },
  { key: 'qualificat',     label: 'Demo',        color: '#06B6D4' },
  { key: 'proposta',       label: 'Trial',       color: '#0D9488' },
  { key: 'negociacio',     label: 'Negociació',  color: '#D97706' },
  { key: 'tancant',        label: 'Tancament',   color: '#EA580C' },
  { key: 'tancat_guanyat', label: 'Subscrit',    color: '#16A34A' },
  { key: 'tancat_perdut',  label: 'Churned',     color: '#DC2626' },
]

export default async function SportsAnalisiPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if ((profile as Profile)?.role !== 'superadmin') redirect('/dashboard')

  const { data: opportunities } = await supabase
    .from('opportunities')
    .select('*')
    .eq('crm_source', 'scp')
    .order('created_at', { ascending: false })

  return (
    <>
      <Topbar user={profile as Profile} title="Anàlisi SCP" />
      <AnalisiContent
        opportunities={opportunities ?? []}
        goal2026={12000}
        goal2027={24000}
        accentColor="#7C3AED"
        stages={SCP_STAGES}
      />
    </>
  )
}
