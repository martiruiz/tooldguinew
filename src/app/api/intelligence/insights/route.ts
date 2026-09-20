import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getInsights, resolveInsight } from '@/lib/intelligence/insights'
import type { InsightSeverity, InsightType, EntityType } from '@/lib/intelligence/types'

// GET /api/intelligence/insights
// Query params: entity_type, entity_id, severity, type, resolved (boolean), limit
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!['superadmin', 'manager'].includes(profile?.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const sp = req.nextUrl.searchParams
  try {
    const insights = await getInsights({
      entityType: sp.get('entity_type') as EntityType | undefined ?? undefined,
      entityId:   sp.get('entity_id') ?? undefined,
      severity:   sp.get('severity') as InsightSeverity | undefined ?? undefined,
      type:       sp.get('type') as InsightType | undefined ?? undefined,
      resolved:   sp.has('resolved') ? sp.get('resolved') === 'true' : undefined,
      limit:      sp.has('limit') ? parseInt(sp.get('limit')!) : undefined,
    })
    return NextResponse.json({ insights })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// PATCH /api/intelligence/insights
// Body: { id: string, action: 'resolve' }
export async function PATCH(req: NextRequest) {
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

  const { id, action } = await req.json()
  if (!id || action !== 'resolve') {
    return NextResponse.json({ error: 'id i action:resolve són obligatoris' }, { status: 400 })
  }

  try {
    await resolveInsight(id)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
