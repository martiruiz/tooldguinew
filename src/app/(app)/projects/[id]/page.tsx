import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Topbar } from '@/components/layout/Topbar'
import { ProjectDetail } from '@/components/projects/ProjectDetail'
import type { Profile } from '@/types'

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const [{ data: project }, { data: tasks }, { data: profiles }] = await Promise.all([
    supabase
      .from('projects')
      .select('*, client:clients(id,name,type)')
      .eq('id', id)
      .single(),
    supabase
      .from('tasks')
      .select('*, responsible:profiles(id,full_name,avatar_url)')
      .eq('project_id', id)
      .order('created_at'),
    supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .eq('is_active', true),
  ])

  if (!project) notFound()

  return (
    <>
      <Topbar user={profile as Profile} title={(project as any).name} />
      <ProjectDetail
        project={project as any}
        tasks={tasks || []}
        profiles={profiles || []}
        currentUser={profile as Profile}
      />
    </>
  )
}
