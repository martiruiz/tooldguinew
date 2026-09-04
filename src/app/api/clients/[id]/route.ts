import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabase } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createSupabase()
    const body = await req.json()
    const { name, type, status, health, responsible_id, website, description } = body

    if (name !== undefined && !name?.trim()) {
      return NextResponse.json({ error: 'El nom no pot estar buit' }, { status: 400 })
    }

    const updates: Record<string, any> = {}
    if (name !== undefined) updates.name = name.trim()
    if (type !== undefined) updates.type = type
    if (status !== undefined) updates.status = status
    if (health !== undefined) updates.health = health
    if (responsible_id !== undefined) updates.responsible_id = responsible_id || null
    if (website !== undefined) updates.website = website || null
    if (description !== undefined) updates.description = description || null

    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ client: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createSupabase()

    const { error } = await supabase.from('clients').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
