import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/agent/config — save agent config overrides to Supabase
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!profile) return NextResponse.json({ error: 'Perfil no trobat' }, { status: 403 })

  const { agentId, name, desc, trigger } = await req.json()
  if (!agentId) return NextResponse.json({ error: 'agentId requerit' }, { status: 400 })

  const { error } = await supabase
    .from('agent_configs')
    .upsert({
      agent_id: agentId,
      name: name ?? null,
      description: desc ?? null,
      trigger: trigger ?? null,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'agent_id' })

  if (error) {
    // Table may not exist yet — return graceful success
    console.warn('[agent/config] DB error (table may not exist):', error.message)
    return NextResponse.json({ ok: true, warning: 'Config not persisted to DB' })
  }

  return NextResponse.json({ ok: true })
}

// GET /api/agent/config?agentId=xx — retrieve saved config
export async function GET(req: NextRequest) {
  const agentId = req.nextUrl.searchParams.get('agentId')
  if (!agentId) return NextResponse.json({ error: 'agentId requerit' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('agent_configs')
    .select('*')
    .eq('agent_id', agentId)
    .single()

  if (error || !data) return NextResponse.json({ config: null })
  return NextResponse.json({ config: data })
}
