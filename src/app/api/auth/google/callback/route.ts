import { NextRequest, NextResponse } from 'next/server'
import { getOAuthClient } from '@/lib/google'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  if (!code) return NextResponse.redirect(new URL('/documents?error=no_code', req.url))

  try {
    const oauth = getOAuthClient()
    const { tokens } = await oauth.getToken(code)

    // Desa els tokens a Supabase per a l'usuari actual
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    console.log('[Google callback] user:', user?.id, 'authErr:', authErr)
    if (!user) return NextResponse.redirect(new URL('/login', req.url))

    const { error: upsertErr } = await supabase.from('google_tokens').upsert({
      user_id: user.id,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    console.log('[Google callback] upsert error:', upsertErr)

    return NextResponse.redirect(new URL('/documents?connected=1', req.url))
  } catch (err) {
    console.error('Google OAuth callback error:', err)
    return NextResponse.redirect(new URL('/documents?error=oauth_failed', req.url))
  }
}
