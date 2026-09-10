import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Topbar } from '@/components/layout/Topbar'
import { InboxContent } from '@/components/inbox/InboxContent'
import type { Profile } from '@/types'

export default async function InboxPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  const { data: chatMessages } = await supabase
    .from('team_chat')
    .select('id, user_id, content, created_at, profiles:profiles!team_chat_user_id_fkey(id, full_name, avatar_url)')
    .neq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30)

  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .eq('is_active', true)
    .order('full_name')

  return (
    <>
      <Topbar user={profile as Profile} title="Bandeja d'entrada" />
      <InboxContent
        currentUserId={user.id}
        notifications={notifications ?? []}
        chatMessages={(chatMessages ?? []) as any}
        profiles={(allProfiles ?? []) as any}
      />
    </>
  )
}
