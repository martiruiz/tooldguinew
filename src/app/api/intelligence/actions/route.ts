import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/serverAdmin'

// POST /api/intelligence/actions
// Executa una recomanació aprovada. Validació explícita obligatòria.
// Body: { recommendation_id: string }
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden: only superadmin can execute actions' }, { status: 403 })
  }

  const { recommendation_id } = await req.json()
  if (!recommendation_id) {
    return NextResponse.json({ error: 'recommendation_id és obligatori' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Fetch and validate the recommendation
  const { data: rec, error: recErr } = await admin
    .from('ai_recommendations')
    .select('*')
    .eq('id', recommendation_id)
    .single()

  if (recErr || !rec) {
    return NextResponse.json({ error: 'Recomanació no trobada' }, { status: 404 })
  }

  if (rec.status !== 'approved') {
    return NextResponse.json(
      { error: `Recomanació en estat '${rec.status}' — cal que estigui 'approved'` },
      { status: 422 }
    )
  }

  if (rec.requires_approval && rec.approved_by !== user.id && profile?.role !== 'superadmin') {
    return NextResponse.json({ error: 'No autoritzat per executar aquesta acció' }, { status: 403 })
  }

  let success = false
  let result: Record<string, unknown> = {}
  let errorMessage: string | null = null

  try {
    // Dispatch to action handler
    const actionResult = await dispatchAction(rec.action_type, rec.payload, admin)
    success = true
    result = actionResult
  } catch (err: any) {
    errorMessage = err.message
  }

  // Write immutable action log
  const { error: logErr } = await admin.from('ai_actions').insert({
    recommendation_id,
    action_type: rec.action_type,
    executed_payload: rec.payload,
    result: success ? result : null,
    success,
    error_message: errorMessage,
  })

  if (logErr) console.error('[intelligence/actions] Failed to log action:', logErr.message)

  // Update recommendation status
  await admin
    .from('ai_recommendations')
    .update({ status: success ? 'executed' : 'failed' })
    .eq('id', recommendation_id)

  if (!success) {
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }

  return NextResponse.json({ ok: true, result })
}

async function dispatchAction(
  actionType: string,
  payload: Record<string, unknown>,
  admin: ReturnType<typeof createAdminClient>
): Promise<Record<string, unknown>> {
  switch (actionType) {
    case 'update_task': {
      const { task_id, ...updates } = payload
      if (!task_id) throw new Error('payload.task_id és obligatori')
      const { error } = await admin
        .from('tasks')
        .update(updates)
        .eq('id', task_id as string)
      if (error) throw new Error(error.message)
      return { updated: task_id }
    }

    case 'update_client_health': {
      const { client_id, health } = payload
      if (!client_id || !health) throw new Error('payload.client_id i health són obligatoris')
      const validHealth = ['healthy', 'attention', 'risk']
      if (!validHealth.includes(health as string)) throw new Error(`health invàlid: ${health}`)
      const { error } = await admin
        .from('clients')
        .update({ health })
        .eq('id', client_id as string)
      if (error) throw new Error(error.message)
      return { updated: client_id, health }
    }

    case 'create_task': {
      const { title, project_id, responsible_id, due_date } = payload
      if (!title) throw new Error('payload.title és obligatori')
      const { data, error } = await admin
        .from('tasks')
        .insert({ title, project_id, responsible_id, due_date, status: 'todo' })
        .select('id')
        .single()
      if (error) throw new Error(error.message)
      return { created: data.id }
    }

    case 'send_notification': {
      // Delegate to existing notifications system
      const { user_id, title, body, link } = payload
      if (!user_id || !title) throw new Error('payload.user_id i title són obligatoris')
      const { error } = await admin.from('notifications').insert({
        user_id,
        type: 'task_assigned',
        title,
        body: body ?? null,
        link: link ?? null,
        read: false,
      })
      if (error) throw new Error(error.message)
      return { notified: user_id }
    }

    default:
      throw new Error(`Action type '${actionType}' no implementat`)
  }
}
