import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/serverAdmin'

export async function GET(req: NextRequest) {
  const agentId = req.nextUrl.searchParams.get('agentId')
  if (!agentId) return NextResponse.json({ error: 'agentId required' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('ai_conversations')
    .select('id, role, content, created_at')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: true })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ messages: data ?? [] })
}

export async function POST(req: NextRequest) {
  const { agentId, role, content } = await req.json()
  if (!agentId || !role || !content) {
    return NextResponse.json({ error: 'agentId, role i content són obligatoris' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('ai_conversations')
    .insert({ agent_id: agentId, role, content })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id })
}

export async function DELETE(req: NextRequest) {
  const agentId = req.nextUrl.searchParams.get('agentId')
  if (!agentId) return NextResponse.json({ error: 'agentId required' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin
    .from('ai_conversations')
    .delete()
    .eq('agent_id', agentId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
