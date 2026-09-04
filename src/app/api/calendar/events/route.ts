import { NextRequest, NextResponse } from 'next/server'
import { getCalendarClientWithRefresh } from '@/lib/google'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check current user is connected
    const { data: myToken } = await admin
      .from('google_calendar_tokens')
      .select('access_token, refresh_token, expiry_date')
      .eq('user_id', user.id)
      .single()

    if (!myToken?.access_token) {
      return NextResponse.json({ error: 'not_connected' }, { status: 403 })
    }

    const timeMin = req.nextUrl.searchParams.get('timeMin') || new Date().toISOString()
    const timeMax = req.nextUrl.searchParams.get('timeMax') || new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString()

    // Fetch ALL team members' tokens + their profile names
    const { data: allTokens } = await admin
      .from('google_calendar_tokens')
      .select('user_id, access_token, refresh_token, expiry_date')

    const { data: profiles } = await admin
      .from('profiles')
      .select('id, full_name')

    const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p.full_name]))

    const allEvents: any[] = []

    await Promise.all((allTokens || []).map(async (tokenRow) => {
      if (!tokenRow.access_token) return
      try {
        const calendar = await getCalendarClientWithRefresh(tokenRow.user_id, {
          access_token: tokenRow.access_token,
          refresh_token: tokenRow.refresh_token,
          expiry_date: tokenRow.expiry_date,
        })
        const res = await calendar.events.list({
          calendarId: 'primary',
          timeMin,
          timeMax,
          singleEvents: true,
          orderBy: 'startTime',
          maxResults: 500,
        })
        const isMe = tokenRow.user_id === user.id
        const ownerName = profileMap[tokenRow.user_id] || 'Company'
        const events = (res.data.items || []).map(e => ({
          id: `${tokenRow.user_id}-${e.id}`,
          title: e.summary || '(Sense títol)',
          start: e.start?.dateTime || e.start?.date,
          end: e.end?.dateTime || e.end?.date,
          allDay: !e.start?.dateTime,
          meetLink: e.hangoutLink || null,
          description: e.description || null,
          attendees: (e.attendees || []).map((a: any) => ({ email: a.email, name: a.displayName })),
          isGuinew: !!(e.extendedProperties?.private?.guinew),
          isOwn: isMe,
          ownerName,
          ownerId: tokenRow.user_id,
        }))
        allEvents.push(...events)
      } catch (err: any) {
        console.error(`[calendar/events] error fetching for ${tokenRow.user_id}:`, err.message)
      }
    }))

    return NextResponse.json({ events: allEvents })
  } catch (err: any) {
    console.error('[calendar/events]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
