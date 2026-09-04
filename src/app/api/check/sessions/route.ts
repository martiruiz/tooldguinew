import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { getCalendarClientWithRefresh } from '@/lib/google'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { client_id, session_date, session_types, hours, notes, start_time, end_time, add_to_calendar } = body

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

    let calendarEventUrl: string | null = null

    if (add_to_calendar) {
      try {
        const admin = createAdmin(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
        const { data: tokenRow } = await admin
          .from('google_calendar_tokens')
          .select('access_token, refresh_token, expiry_date')
          .eq('user_id', user.id)
          .single()

        if (tokenRow?.access_token) {
          const calendar = await getCalendarClientWithRefresh(user.id, tokenRow)

          const clientName = (data as any).client?.name || 'Client'
          const types = Array.isArray(session_types) && session_types.length > 0
            ? ` (${session_types.join(', ')})`
            : ''

          let startDateTime: string
          let endDateTime: string

          if (start_time) {
            startDateTime = `${session_date}T${start_time}:00`
            endDateTime = end_time
              ? `${session_date}T${end_time}:00`
              : `${session_date}T${(parseInt(start_time.split(':')[0]) + Math.ceil(parseFloat(hours) || 1)).toString().padStart(2, '0')}:${start_time.split(':')[1]}:00`
          } else {
            startDateTime = `${session_date}T09:00:00`
            endDateTime = `${session_date}T${(9 + Math.ceil(parseFloat(hours) || 1)).toString().padStart(2, '0')}:00:00`
          }

          const event = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: {
              summary: `Sessió ${clientName}${types}`,
              description: notes || undefined,
              start: { dateTime: startDateTime, timeZone: 'Europe/Madrid' },
              end: { dateTime: endDateTime, timeZone: 'Europe/Madrid' },
              extendedProperties: { private: { guinew: 'true', session_id: data.id } },
            },
          })
          calendarEventUrl = event.data.htmlLink || null
        }
      } catch (calErr: any) {
        console.error('[sessions] calendar error:', calErr.message)
      }
    }

    return NextResponse.json({ session: data, calendarEventUrl })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
