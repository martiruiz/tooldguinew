import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { client_id, session_date, session_types, hours, notes, start_time, end_time } = body

    if (!client_id || !session_date) {
      return NextResponse.json({ error: 'client_id i session_date són obligatoris' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('content_sessions')
      .insert({
        client_id,
        session_date,
        session_types: session_types || [],
        hours: parseFloat(hours) || 0,
        notes: notes || null,
        start_time: start_time || null,
        end_time: end_time || null,
        created_by: user.id,
      })
      .select('*, client:clients(id, name)')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ session: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
