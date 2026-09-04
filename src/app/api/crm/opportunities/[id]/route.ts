import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()

    const p: Record<string, any> = {
      id,
      client_id:        body.client_id        !== undefined ? (body.client_id   || null) : undefined,
      client_name:      body.client_name       !== undefined ? body.client_name           : undefined,
      stage:            body.stage             !== undefined ? body.stage                 : undefined,
      value:            body.value             !== undefined ? String(parseFloat(body.value)    || 0) : undefined,
      probability:      body.probability       !== undefined ? String(parseInt(body.probability) || 0) : undefined,
      close_date:       body.close_date        !== undefined ? (body.close_date  || null) : undefined,
      responsible_id:   body.responsible_id    !== undefined ? (body.responsible_id || null) : undefined,
      score:            body.score             !== undefined ? (body.score       ?? null) : undefined,
      score_notes:      body.score_notes       !== undefined ? (body.score_notes || null) : undefined,
      description:      body.description       !== undefined ? (body.description || null) : undefined,
      next_step:        body.next_step         !== undefined ? (body.next_step   || null) : undefined,
      next_step_date:   body.next_step_date    !== undefined ? (body.next_step_date || null) : undefined,
      lead_source:      body.lead_source       !== undefined ? (body.lead_source || null) : undefined,
      lost_reason:      body.lost_reason       !== undefined ? (body.lost_reason || null) : undefined,
      services:         body.services          !== undefined ? (body.services    || null) : undefined,
      analysis_answers: body.analysis_answers  !== undefined ? (body.analysis_answers ?? null) : undefined,
    }

    // Remove undefined keys so SQL only updates provided fields
    Object.keys(p).forEach(k => p[k] === undefined && delete p[k])

    const { data, error } = await supabase.rpc('save_opportunity', { p })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ opportunity: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { error } = await supabase.from('opportunities').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
