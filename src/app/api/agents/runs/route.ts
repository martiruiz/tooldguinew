import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/serverAdmin'

// GET /api/agents/runs — last 20 runs (active + recent)
export async function GET(req: NextRequest) {
  const admin = createAdminClient()
  const { searchParams } = new URL(req.url)
  const runId = searchParams.get('run_id')
  const agentId = searchParams.get('agent_id')

  if (runId) {
    // Fetch single run with its logs
    const [{ data: run }, { data: logs }] = await Promise.all([
      admin.from('agent_runs').select('*').eq('id', runId).single(),
      admin.from('agent_run_logs').select('*').eq('run_id', runId).order('created_at', { ascending: true }),
    ])
    return NextResponse.json({ run, logs: logs ?? [] })
  }

  if (agentId) {
    // Fetch active/recent runs for a specific agent
    const { data: runs } = await admin
      .from('agent_runs')
      .select('*')
      .eq('agent_id', agentId)
      .order('updated_at', { ascending: false })
      .limit(5)
    const activeRun = runs?.find(r => r.status === 'running' || r.status === 'awaiting_approval') ?? null
    const logsData = activeRun
      ? await admin.from('agent_run_logs').select('*').eq('run_id', activeRun.id).order('created_at', { ascending: false }).limit(8)
      : { data: [] }
    return NextResponse.json({ runs: runs ?? [], activeRun, logs: (logsData.data ?? []).reverse() })
  }

  const { data: runs } = await admin
    .from('agent_runs')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(20)

  return NextResponse.json({ runs: runs ?? [] })
}

// POST /api/agents/runs — create a new run or log a step
export async function POST(req: NextRequest) {
  const admin = createAdminClient()
  const body = await req.json()
  const { action } = body

  if (action === 'start') {
    const { agent_id, dept_id, title, client_slug } = body
    const { data, error } = await admin
      .from('agent_runs')
      .insert({ agent_id, dept_id, title, client_slug, status: 'running' })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ run: data })
  }

  if (action === 'log') {
    const { run_id, level = 'info', message, data: logData, current_step } = body
    const [logResult] = await Promise.all([
      admin.from('agent_run_logs').insert({ run_id, level, message, data: logData }),
      current_step
        ? admin.from('agent_runs').update({ current_step, updated_at: new Date().toISOString() }).eq('id', run_id)
        : Promise.resolve(),
    ])
    if (logResult.error) return NextResponse.json({ error: logResult.error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (action === 'checkpoint') {
    // Agent pauses and waits for human approval
    const { run_id, message, draft_content } = body
    await Promise.all([
      admin.from('agent_runs').update({
        status: 'awaiting_approval',
        current_step: message,
        draft_content: draft_content ?? null,
        updated_at: new Date().toISOString(),
      }).eq('id', run_id),
      admin.from('agent_run_logs').insert({ run_id, level: 'checkpoint', message, data: draft_content }),
    ])
    return NextResponse.json({ ok: true })
  }

  if (action === 'complete') {
    const { run_id, result } = body
    await admin.from('agent_runs').update({
      status: 'completed',
      current_step: null,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', run_id)
    if (result) await admin.from('agent_run_logs').insert({ run_id, level: 'info', message: 'Completat', data: result })
    return NextResponse.json({ ok: true })
  }

  if (action === 'fail') {
    const { run_id, error: errMsg } = body
    await admin.from('agent_runs').update({
      status: 'failed',
      current_step: `Error: ${errMsg}`,
      updated_at: new Date().toISOString(),
    }).eq('id', run_id)
    await admin.from('agent_run_logs').insert({ run_id, level: 'error', message: errMsg })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'action no vàlida' }, { status: 400 })
}

// PATCH /api/agents/runs — approve or edit a checkpoint
export async function PATCH(req: NextRequest) {
  const admin = createAdminClient()
  const { run_id, action, draft_content, instruction } = await req.json()

  if (action === 'approve') {
    const combined = instruction ? { ...(draft_content ?? {}), _instruction: instruction } : (draft_content ?? null)
    await admin.from('agent_runs').update({
      status: 'running',
      draft_content: combined,
      updated_at: new Date().toISOString(),
    }).eq('id', run_id)
    const msg = instruction ? `✓ Aprovat amb instrucció: ${instruction}` : '✓ Aprovat per Martí'
    await admin.from('agent_run_logs').insert({ run_id, level: 'info', message: msg, data: combined })
    return NextResponse.json({ ok: true })
  }

  if (action === 'instruct') {
    if (!instruction) return NextResponse.json({ error: 'instruction requerida' }, { status: 400 })
    await Promise.all([
      admin.from('agent_runs').update({
        draft_content: { _instruction: instruction },
        current_step: `↗ Instrucció: ${instruction}`,
        updated_at: new Date().toISOString(),
      }).eq('id', run_id),
      admin.from('agent_run_logs').insert({ run_id, level: 'checkpoint', message: `↗ Instrucció de Martí: ${instruction}` }),
    ])
    return NextResponse.json({ ok: true })
  }

  if (action === 'cancel') {
    await admin.from('agent_runs').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', run_id)
    await admin.from('agent_run_logs').insert({ run_id, level: 'warning', message: '■ Agent aturat per l\'usuari' })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'action no vàlida' }, { status: 400 })
}
