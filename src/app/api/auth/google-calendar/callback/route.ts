import { NextRequest, NextResponse } from 'next/server'
import { getOAuthClient } from '@/lib/google'
import { createClient as createSupabaseServer } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

const CALENDAR_REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google-calendar/callback`
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL!

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const userId = req.nextUrl.searchParams.get('state')

  if (!code) return NextResponse.redirect(new URL('/calendar?error=no_code', BASE_URL))
  if (!userId) return NextResponse.redirect(new URL('/calendar?error=no_state', BASE_URL))

  try {
    // Exchange code for tokens
    const oauth = getOAuthClient(CALENDAR_REDIRECT_URI)
    const { tokens } = await oauth.getToken(code)

    if (!tokens.access_token) {
      return NextResponse.redirect(new URL('/calendar?error=no_token', BASE_URL))
    }

    // Use service role key so we can write without depending on session cookies
    const admin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('[GCal callback] saving token for userId:', userId)
    console.log('[GCal callback] has access_token:', !!tokens.access_token)
    console.log('[GCal callback] has refresh_token:', !!tokens.refresh_token)

    const { error: dbError, data: dbData } = await admin.from('google_calendar_tokens').upsert({
      user_id: userId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? null,
      expiry_date: tokens.expiry_date ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' }).select()

    if (dbError) {
      console.error('[GCal callback] DB error:', dbError.message, dbError.details, dbError.hint)
      return NextResponse.redirect(new URL(`/calendar?error=${encodeURIComponent(dbError.message)}`, BASE_URL))
    }

    console.log('[GCal callback] saved OK, rows:', JSON.stringify(dbData))
    return NextResponse.redirect(new URL('/calendar?connected=1', BASE_URL))
  } catch (err: any) {
    console.error('[Google Calendar callback] error:', err.message)
    return NextResponse.redirect(new URL(`/calendar?error=${encodeURIComponent(err.message)}`, BASE_URL))
  }
}
