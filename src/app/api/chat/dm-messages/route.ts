import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/serverAdmin'
import { notifyUser, getProfileForNotif } from '@/lib/notifications'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const peerId = req.nextUrl.searchParams.get('peerId')
    if (!peerId) return NextResponse.json({ error: 'peerId required' }, { status: 400 })

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('direct_messages')
      .select('*')
      .or(`and(from_user_id.eq.${user.id},to_user_id.eq.${peerId}),and(from_user_id.eq.${peerId},to_user_id.eq.${user.id})`)
      .order('created_at', { ascending: true })
      .limit(100)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ messages: data || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { peerId, content, reply_to_id, reply_to_content, reply_to_sender } = await req.json()
    if (!peerId || !content?.trim()) return NextResponse.json({ error: 'peerId and content required' }, { status: 400 })

    const admin = createAdminClient()
    const row: Record<string, any> = { from_user_id: user.id, to_user_id: peerId, content: content.trim() }
    if (reply_to_id) { row.reply_to_id = reply_to_id; row.reply_to_content = reply_to_content || null; row.reply_to_sender = reply_to_sender || null }
    const { data, error } = await admin
      .from('direct_messages')
      .insert(row)
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Notify recipient
    const [senderProfile, recipientProfile] = await Promise.all([
      getProfileForNotif(user.id),
      getProfileForNotif(peerId),
    ])
    if (recipientProfile && senderProfile) {
      await notifyUser({
        userId: peerId,
        email: recipientProfile.email,
        name: recipientProfile.name,
        type: 'dm_received',
        title: `Missatge de ${senderProfile.name}`,
        body: content.trim().slice(0, 120),
        link: '/inbox',
      })
    }

    return NextResponse.json({ message: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
