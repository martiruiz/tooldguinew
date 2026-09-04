import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabase } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabase()
    const body = await req.json()
    const { name, type, status, health, responsible_id, website, description, slug } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'El nom és obligatori' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('clients')
      .insert({
        name: name.trim(),
        slug,
        type: type || 'empresa',
        status: status || 'active',
        health: health || 'healthy',
        responsible_id: responsible_id || null,
        website: website || null,
        description: description || null,
      })
      .select('id')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Auto-create a label for this client
    const LABEL_COLORS = [
      '#1B2B4B', '#4A82C6', '#16A34A', '#D97706', '#DC2626',
      '#7C3AED', '#0891B2', '#EC4899', '#65A30D', '#EA580C',
    ]
    const colorIdx = Math.floor(Math.random() * LABEL_COLORS.length)
    await supabase.from('labels').insert({ name: name.trim(), color: LABEL_COLORS[colorIdx] })

    return NextResponse.json({ id: data.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
