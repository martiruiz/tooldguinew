import { NextResponse } from 'next/server'
import { getCalendarAuthUrl } from '@/lib/google'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL!))

  // Pass user_id in state so the callback doesn't depend on session cookies
  const url = getCalendarAuthUrl(user.id)
  return NextResponse.redirect(url)
}
