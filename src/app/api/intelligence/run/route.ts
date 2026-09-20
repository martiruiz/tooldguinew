import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runIntelligence } from '@/lib/intelligence/runner'

// POST /api/intelligence/run
// Dispara tots els detectors i crea ai_insights
// Accessible per superadmin o via CRON_SECRET header
export async function POST(req: NextRequest) {
  // Allow cron/internal calls via secret header
  const cronSecret = req.headers.get('x-cron-secret')
  if (cronSecret && cronSecret === process.env.CRON_SECRET) {
    try {
      const result = await runIntelligence('cron')
      return NextResponse.json(result)
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 })
    }
  }

  // Otherwise require superadmin session
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const result = await runIntelligence('manual')
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
