import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('board_columns')
    .select('status, label, color, icon')
    .order('status')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { status, label, color, icon } = body
  if (!status) return NextResponse.json({ error: 'status required' }, { status: 400 })

  const upsertData: Record<string, string> = { status, updated_at: new Date().toISOString() }
  if (label !== undefined) upsertData.label = label
  if (color !== undefined) upsertData.color = color
  if (icon  !== undefined) upsertData.icon  = icon

  const { error } = await supabase
    .from('board_columns')
    .upsert(upsertData, { onConflict: 'status' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
