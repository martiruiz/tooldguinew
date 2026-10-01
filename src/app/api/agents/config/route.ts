import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/serverAdmin'

export async function GET() {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('agent_configs')
    .select('agent_id, system_prompt, memory, updated_at')
    .order('updated_at', { ascending: false })

  if (error) return NextResponse.json({ configs: [] })
  return NextResponse.json({ configs: data ?? [] })
}

export async function POST(req: NextRequest) {
  const { agentId, systemPrompt } = await req.json()
  if (!agentId || systemPrompt === undefined) {
    return NextResponse.json({ error: 'agentId i systemPrompt obligatoris' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('agent_configs')
    .upsert({ agent_id: agentId, system_prompt: systemPrompt, updated_at: new Date().toISOString() }, { onConflict: 'agent_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const agentId = req.nextUrl.searchParams.get('agentId')
  if (!agentId) return NextResponse.json({ error: 'agentId obligatori' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin
    .from('agent_configs')
    .update({ memory: '', updated_at: new Date().toISOString() })
    .eq('agent_id', agentId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
