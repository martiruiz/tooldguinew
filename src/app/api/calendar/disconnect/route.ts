import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL!

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.redirect(new URL('/calendar', BASE_URL))

    const admin = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    await admin.from('google_calendar_tokens').delete().eq('user_id', user.id)

    return NextResponse.redirect(new URL('/calendar', BASE_URL))
  } catch (err: any) {
    console.error('[disconnect]', err.message)
    return NextResponse.redirect(new URL('/calendar', BASE_URL))
  }
}

export async function POST() {
  return GET()
}
