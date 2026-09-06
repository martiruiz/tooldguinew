import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const DEFAULTS = {
  inapp_task_assigned: true,
  inapp_meeting_created: true,
  inapp_session_assigned: true,
  inapp_deadline_today: true,
  inapp_deadline_tomorrow: true,
  inapp_new_client: false,
  inapp_crm_opportunity: false,
  email_task_assigned: true,
  email_meeting_created: true,
  email_session_assigned: true,
  email_deadline_today: false,
  email_deadline_tomorrow: false,
  email_new_client: false,
  email_crm_opportunity: false,
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  return NextResponse.json(data || { user_id: user.id, ...DEFAULTS })
}

export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  const { data, error } = await supabase
    .from('notification_preferences')
    .upsert({ user_id: user.id, ...body, updated_at: new Date().toISOString() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
