import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const clientId = searchParams.get('clientId')
  const agentId = searchParams.get('agentId')

  let query = supabase
    .from('agent_documents')
    .select('id, title, content, agent_id, agent_name, client_id, client_name, doc_type, created_at')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false })

  if (clientId) query = query.eq('client_id', clientId)
  if (agentId) query = query.eq('agent_id', agentId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ documents: data })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })

  const body = await req.json()
  const { title, content, agent_id, agent_name, client_id, client_name, doc_type } = body

  if (!title?.trim() || !content?.trim() || !agent_id || !agent_name) {
    return NextResponse.json({ error: 'Falten camps obligatoris' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('agent_documents')
    .insert({
      title: title.trim(),
      content,
      agent_id,
      agent_name,
      client_id: client_id || null,
      client_name: client_name || null,
      doc_type: doc_type || 'contingut',
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 })

  const { error } = await supabase
    .from('agent_documents')
    .delete()
    .eq('id', id)
    .eq('created_by', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
