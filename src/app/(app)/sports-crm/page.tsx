import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Topbar } from '@/components/layout/Topbar'
import { CRMContent } from '@/components/crm/CRMContent'
import type { Profile } from '@/types'

const SCP_STAGES = [
  { key: 'prospect',       label: 'Lead',          color: '#7C3AED', bg: '#F5F3FF' },
  { key: 'contactat',      label: 'Contactat',     color: '#6D28D9', bg: '#EDE9FE' },
  { key: 'qualificat',     label: 'Demo',          color: '#0891B2', bg: '#ECFEFF' },
  { key: 'proposta',       label: 'Trial',         color: '#0D9488', bg: '#F0FDFA' },
  { key: 'negociacio',     label: 'Negociació',    color: '#D97706', bg: '#FFFBEB' },
  { key: 'tancant',        label: 'Tancament',     color: '#EA580C', bg: '#FFF7ED' },
  { key: 'tancat_guanyat', label: 'Subscrit',      color: '#16A34A', bg: '#F0FDF4' },
  { key: 'tancat_perdut',  label: 'Churned',       color: '#DC2626', bg: '#FEF2F2' },
]

export default async function SportsCRMPage() {
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
    supabase.from('opportunities').select('*').eq('crm_source', 'scp').order('created_at', { ascending: false }),
    supabase.from('profiles').select('id, full_name').eq('is_active', true).order('full_name'),
  ])

  return (
    <>
      <Topbar user={profile as Profile} title="CRM Sports Content Playbook" />
      <CRMContent
        clients={clients || []}
        opportunities={opportunities || []}
        profiles={profiles || []}
        currentUserId={user.id}
        crmSource="scp"
        stages={SCP_STAGES}
      />
    </>
  )
}
