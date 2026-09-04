import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ connected: false })

    const admin = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data } = await admin
      .from('google_calendar_tokens')
      .select('access_token')
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({ connected: !!(data?.access_token) })
  } catch (err: any) {
    console.error('[calendar/status]', err.message)
    return NextResponse.json({ connected: false })
  }
}
