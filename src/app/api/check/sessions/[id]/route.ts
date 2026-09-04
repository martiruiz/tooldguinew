import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const {
      client_id, session_date, session_types, hours, notes, start_time, end_time,
      previa_pdf_url, previa_pdf_name,
      durant_notes,
      post_material_url, post_material_name,
    } = body

    const updateFields: Record<string, any> = {}
    if (client_id !== undefined) updateFields.client_id = client_id
    if (session_date !== undefined) updateFields.session_date = session_date
    if (session_types !== undefined) updateFields.session_types = session_types || []
    if (hours !== undefined) updateFields.hours = parseFloat(hours) || 0
    if (notes !== undefined) updateFields.notes = notes || null
    if (start_time !== undefined) updateFields.start_time = start_time || null
    if (end_time !== undefined) updateFields.end_time = end_time || null
    if (previa_pdf_url !== undefined) updateFields.previa_pdf_url = previa_pdf_url || null
    if (previa_pdf_name !== undefined) updateFields.previa_pdf_name = previa_pdf_name || null
    if (durant_notes !== undefined) updateFields.durant_notes = durant_notes || null
    if (post_material_url !== undefined) updateFields.post_material_url = post_material_url || null
    if (post_material_name !== undefined) updateFields.post_material_name = post_material_name || null

    const { data, error } = await supabase
      .from('content_sessions')
      .update(updateFields)
      .eq('id', id)
      .select('*, client:clients(id, name)')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ session: data })
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

    const { error } = await supabase.from('content_sessions').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
