import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/serverAdmin'

export async function GET() {
  const admin = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  // ai_runs tracks intelligence runs (detectors), not individual agent calls.
  // We return total runs today + last run timestamp as a system health signal.
  const { data: runs, error } = await admin
    .from('ai_runs')
    .select('id, status, completed_at, created_at')
    .gte('created_at', `${today}T00:00:00`)
    .order('created_at', { ascending: false })

  if (error) {
    // Table might not exist yet or schema mismatch — return empty gracefully
    return NextResponse.json({ runsToday: {}, lastActivity: {}, totalToday: 0 })
  }

  const total = runs?.length ?? 0
  const lastRun = runs?.[0]?.completed_at ?? runs?.[0]?.created_at ?? null

  return NextResponse.json({
    runsToday: {},
    lastActivity: {},
    totalToday: total,
    lastRun,
  })
}
