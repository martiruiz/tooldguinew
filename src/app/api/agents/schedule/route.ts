import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/serverAdmin'

export async function GET() {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('agent_schedules')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ schedules: [] })
  return NextResponse.json({ schedules: data ?? [] })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { agent_id, task, frequency, weekday, hour, minute, enabled = true } = body
  if (!agent_id || !task || !frequency || hour === undefined) {
    return NextResponse.json({ error: 'agent_id, task, frequency i hour obligatoris' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('agent_schedules')
    .insert({ agent_id, task, frequency, weekday: weekday ?? null, hour, minute: minute ?? 0, enabled })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ schedule: data })
}

export async function PATCH(req: NextRequest) {
  const { id, ...updates } = await req.json()
  if (!id) return NextResponse.json({ error: 'id obligatori' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin
    .from('agent_schedules')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id obligatori' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.from('agent_schedules').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
