import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/serverAdmin'

// Machine-to-machine API per al worker local.
// Requereix la capçalera: x-worker-secret: <WORKER_SECRET>

function checkAuth(req: NextRequest): boolean {
  const secret = process.env.WORKER_SECRET
  if (!secret) return false
  return req.headers.get('x-worker-secret') === secret
}

// GET /api/agents/worker — obté les tasques pendents per a agents locals
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('agent_runs')
    .select('*')
    .eq('status', 'pending')
    .eq('dept_id', 'local')
    .order('updated_at', { ascending: true })
    .limit(5)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ runs: data ?? [] })
}

// PATCH /api/agents/worker — actualitza l'estat d'un run
export async function PATCH(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })

  const admin = createAdminClient()
  const { run_id, status, current_step, result } = await req.json()

  if (!run_id || !status) return NextResponse.json({ error: 'run_id i status requerits' }, { status: 400 })

  const update: Record<string, any> = {
    status,
    current_step: current_step ?? null,
    updated_at: new Date().toISOString(),
  }
  if (status === 'completed' || status === 'failed' || status === 'running') {
    if (status !== 'running') update.completed_at = new Date().toISOString()
  }

  const { error } = await admin.from('agent_runs').update(update).eq('id', run_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (result) {
    await admin.from('agent_run_logs').insert({
      run_id,
      level: status === 'completed' ? 'info' : 'error',
      message: current_step ?? status,
      data: result,
    })
  }

  return NextResponse.json({ ok: true })
}
