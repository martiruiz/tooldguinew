import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { title, date, startTime, endTime, attendeeEmails, clientId, projectId, meetingType, location, description, recurrence } = body

    const updates: Record<string, any> = {}
    if (title) updates.title = title
    if (date && startTime) updates.start_time = `${date}T${startTime}:00`
    if (date && endTime) updates.end_time = `${date}T${endTime}:00`
    if (attendeeEmails !== undefined) updates.attendee_emails = attendeeEmails
    if (clientId !== undefined) updates.client_id = clientId || null
    if (projectId !== undefined) updates.project_id = projectId || null
    if (meetingType) updates.meeting_type = meetingType
    if (location) updates.location = location
    if (description !== undefined) updates.description = description || null
    if (recurrence) updates.recurrence = recurrence

    const { data: meeting, error } = await supabase
      .from('meetings')
      .update(updates)
      .eq('id', id)
      .eq('created_by', user.id)
      .select('*, client:clients(id, name)')
      .single()

    if (error) throw error
    return NextResponse.json({ meeting })
  } catch (err: any) {
    console.error('[meetings/PATCH]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { error } = await supabase
      .from('meetings')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .eq('created_by', user.id)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[meetings/DELETE]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
