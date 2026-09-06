import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { notifyUser, getProfileForNotif } from '@/lib/notifications'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { mentionedIds, content, senderName } = await req.json()
    if (!Array.isArray(mentionedIds) || mentionedIds.length === 0) {
      return NextResponse.json({ ok: true })
    }

    const preview = content.length > 80 ? content.slice(0, 80) + '…' : content

    await Promise.all(
      mentionedIds.map(async (uid: string) => {
        const profile = await getProfileForNotif(uid)
        if (!profile) return
        await notifyUser({
          userId: uid,
          email: profile.email,
          name: profile.name,
          type: 'mention',
          title: `${senderName} t'ha mencionat al chat`,
          body: preview,
          link: '/dashboard',
          emailSubject: `${senderName} t'ha mencionat a Guinew Chat`,
        })
      })
    )

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[chat/mention]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
