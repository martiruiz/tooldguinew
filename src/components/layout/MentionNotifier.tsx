'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  currentUserId: string
  currentUserName: string
}

export function MentionNotifier({ currentUserId, currentUserName }: Props) {
  useEffect(() => {
    if (typeof Notification === 'undefined') return
    if (Notification.permission === 'default') Notification.requestPermission()

    const supabase = createClient()
    const channel = supabase.channel('global-mentions')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'task_comments',
      }, async (payload) => {
        const comment = payload.new as any
        // Skip own comments
        if (comment.user_id === currentUserId) return
        // Check if current user is mentioned
        if (!comment.mentions?.includes(currentUserId)) return

        // Fetch commenter name
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', comment.user_id)
          .single()

        if (Notification.permission === 'granted') {
          new Notification(`${profile?.full_name || 'Algú'} t'ha mencionat`, {
            body: comment.content,
            icon: '/logo-guinew-icon.png',
          })
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [currentUserId])

  return null
}
