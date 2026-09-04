import { createClient as createSupabase } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/Topbar'
import { ProjectsContent } from '@/components/projects/ProjectsContent'
import type { Profile } from '@/types'

export default async function ProjectsPage() {
  const supabase = await createSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()

  const { data: projects } = await supabase
    .from('projects')
    .select(`
      *,
      client:clients(id, name, logo_url),
      responsible:profiles(id, full_name)
    `)
    .order('updated_at', { ascending: false })

  const { data: clients } = await supabase.from('clients').select('id, name').eq('status', 'active').order('name')
  const { data: profiles } = await supabase.from('profiles').select('id, full_name').eq('is_active', true)

  return (
    <>
      <Topbar user={profile as Profile} title="Projectes" />
      <ProjectsContent projects={projects || []} clients={clients || []} profiles={profiles || []} userRole={profile?.role} />
    </>
  )
}
