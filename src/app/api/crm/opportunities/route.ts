import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    if (!body.client_name) return NextResponse.json({ error: 'client_name és obligatori' }, { status: 400 })

    const p: Record<string, any> = {
      client_id:        body.client_id        || null,
      client_name:      body.client_name,
      stage:            body.stage            || 'prospect',
      value:            String(parseFloat(body.value)    || 0),
      probability:      String(parseInt(body.probability) || 0),
      close_date:       body.close_date       || null,
      responsible_id:   body.responsible_id   || null,
      score:            body.score            ?? null,
      score_notes:      body.score_notes      || null,
      description:      body.description      || null,
      next_step:        body.next_step        || null,
      next_step_date:   body.next_step_date   || null,
      lead_source:      body.lead_source      || null,
      lost_reason:      body.lost_reason      || null,
      services:         body.services         || null,
      analysis_answers: body.analysis_answers ?? null,
    }

    const { data, error } = await supabase.rpc('save_opportunity', { p })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ opportunity: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
