import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/serverAdmin'

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

    const { peerId, content } = await req.json()
    if (!peerId || !content?.trim()) return NextResponse.json({ error: 'peerId and content required' }, { status: 400 })

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('direct_messages')
      .insert({ from_user_id: user.id, to_user_id: peerId, content: content.trim() })
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ message: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
