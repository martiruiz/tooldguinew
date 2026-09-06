import { NextRequest, NextResponse } from 'next/server'
import { getCalendarClientWithRefresh } from '@/lib/google'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { notifyUser, getProfileForNotif } from '@/lib/notifications'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const {
      title, date, startTime, endTime,
      attendeeEmails = [], description = '',
      clientId, projectId, meetingType = 'intern',
      location = 'google_meet', recurrence = 'none',
    } = body

    if (!title || !date || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const startDateTime = `${date}T${startTime}:00`
    const endDateTime = `${date}T${endTime}:00`

    let meetLink: string | null = null
    let gcalId: string | null = null

    // Try Google Calendar if location is google_meet
    if (location === 'google_meet') {
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
        try {
          const calendar = await getCalendarClientWithRefresh(user.id, {
            access_token: tokenRow.access_token,
            refresh_token: tokenRow.refresh_token,
            expiry_date: tokenRow.expiry_date,
          })

          const event = await calendar.events.insert({
            calendarId: 'primary',
            conferenceDataVersion: 1,
            requestBody: {
              summary: title,
              description,
              start: { dateTime: startDateTime, timeZone: 'Europe/Madrid' },
              end: { dateTime: endDateTime, timeZone: 'Europe/Madrid' },
              attendees: attendeeEmails.map((email: string) => ({ email })),
              conferenceData: {
                createRequest: {
                  requestId: `guinew-${user.id}-${Date.now()}`,
                  conferenceSolutionKey: { type: 'hangoutsMeet' },
                },
              },
              extendedProperties: { private: { guinew: 'true' } },
            },
          })

          meetLink = event.data.hangoutLink || null
          gcalId = event.data.id || null
        } catch (gcalErr: any) {
          console.warn('[create-meet] GCal error (continuing without Meet link):', gcalErr.message)
        }
      }
    }

    const row: Record<string, any> = {
      title,
      description: description || null,
      start_time: startDateTime,
      end_time: endDateTime,
      meet_link: meetLink,
      gcal_event_id: gcalId,
      created_by: user.id,
      attendee_emails: attendeeEmails,
      meeting_type: meetingType,
      location,
      recurrence,
      status: 'scheduled',
    }
    if (clientId) row.client_id = clientId
    if (projectId) row.project_id = projectId

    const { data: meeting, error } = await supabase
      .from('meetings')
      .insert(row)
      .select('*, client:clients(id, name)')
      .single()

    if (error) throw error

    // Notify participants that have a profile (match by email)
    const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const creatorProfile = await getProfileForNotif(user.id)
    const creatorName = creatorProfile?.name || 'Un company'

    if (attendeeEmails.length > 0) {
      const { data: matchedProfiles } = await admin
        .from('profiles')
        .select('id, full_name')
        .neq('id', user.id)

      if (matchedProfiles) {
        const { data: authUsers } = await admin.auth.admin.listUsers()
        const emailToProfile = new Map(
          authUsers?.users.map(u => [u.email, matchedProfiles.find(p => p.id === u.id)])
        )
        for (const email of attendeeEmails) {
          const profile = emailToProfile.get(email)
          if (!profile) continue
          const dateStr = new Date(`${date}T${startTime}`).toLocaleString('ca-ES', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
          await notifyUser({
            userId: profile.id,
            email,
            name: profile.full_name,
            type: 'meeting_created',
            title: `Nova reunió: ${title}`,
            body: `${creatorName} t'ha convidat a "${title}" el ${dateStr}.`,
            link: '/calendar',
            emailSubject: `Nova reunió: ${title}`,
          })
        }
      }
    }

    return NextResponse.json({ meeting, meetLink, gcalId })
  } catch (err: any) {
    console.error('[create-meet]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
