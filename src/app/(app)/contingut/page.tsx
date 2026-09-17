import { createClient as createSupabase } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/serverAdmin'
import { Topbar } from '@/components/layout/Topbar'
import { ContentPipeline } from '@/components/contingut/ContentPipeline'
import { redirect } from 'next/navigation'
import type { Profile } from '@/types'

export default async function ContingutPage() {
  const supabase = await createSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const admin = createAdminClient()

  const [
    { data: items },
    { data: clients },
    { data: profiles },
  ] = await Promise.all([
    admin.from('content_items')
      .select('*, client:clients(id,name,logo_url), assignee:profiles!content_items_assigned_to_fkey(id,full_name,avatar_url)')
      .order('created_at', { ascending: false }),
    supabase.from('clients').select('id, name, logo_url').eq('status', 'active').order('name'),
    supabase.from('profiles').select('id, full_name, avatar_url').eq('is_active', true).order('full_name'),
  ])

  return (
    <>
      <Topbar user={profile as Profile} title="Contingut" />
      <ContentPipeline
        items={items || []}
        clients={clients || []}
        profiles={profiles || []}
        currentUserId={user.id}
      />
    </>
  )
}
