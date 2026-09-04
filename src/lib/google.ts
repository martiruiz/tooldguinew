import { google } from 'googleapis'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
const CALENDAR_REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google-calendar/callback`

export function getOAuthClient(redirectUri = REDIRECT_URI) {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri,
  )
}

export function getAuthUrl() {
  const client = getOAuthClient()
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
  })
}

export function getCalendarAuthUrl(userId: string) {
  const client = getOAuthClient(CALENDAR_REDIRECT_URI)
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    state: userId,
    scope: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
  })
}

export function getDriveClient(tokens: { access_token: string; refresh_token?: string }) {
  const client = getOAuthClient()
  client.setCredentials(tokens)
  return google.drive({ version: 'v3', auth: client })
}

// Returns a calendar client that auto-refreshes the token and saves the new one to Supabase
export async function getCalendarClientWithRefresh(
  userId: string,
  tokens: { access_token: string; refresh_token?: string | null; expiry_date?: number | null }
) {
  const client = getOAuthClient(CALENDAR_REDIRECT_URI)
  client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? undefined,
    expiry_date: tokens.expiry_date ?? undefined,
  })

  // If token is expired or about to expire (within 5 minutes), refresh it
  const isExpired = tokens.expiry_date
    ? Date.now() >= tokens.expiry_date - 5 * 60 * 1000
    : false

  if (isExpired && tokens.refresh_token) {
    try {
      const { credentials } = await client.refreshAccessToken()
      client.setCredentials(credentials)

      // Save refreshed tokens back to Supabase
      const admin = createSupabaseAdmin(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      await admin.from('google_calendar_tokens').update({
        access_token: credentials.access_token,
        expiry_date: credentials.expiry_date ?? null,
        updated_at: new Date().toISOString(),
      }).eq('user_id', userId)
    } catch (err) {
      console.error('[google] token refresh failed:', err)
      // Token refresh failed — caller should handle as not_connected
      throw new Error('token_refresh_failed')
    }
  }

  return google.calendar({ version: 'v3', auth: client })
}
