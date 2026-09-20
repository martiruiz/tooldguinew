import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPendingRecommendations, updateRecommendationStatus } from '@/lib/intelligence/recommendations'
import { isAiEnabled } from '@/lib/ai/client'
import { generateRecommendations } from '@/lib/ai/recommend'
import { createRecommendation } from '@/lib/intelligence/recommendations'
import { getInsights } from '@/lib/intelligence/insights'

// GET /api/intelligence/recommendations — llista pendents
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

  try {
    const recommendations = await getPendingRecommendations()
    return NextResponse.json({ recommendations })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST /api/intelligence/recommendations
// action: 'approve' | 'reject' → body: { id, action }
// action: 'generate' → body: { insight_id } — requereix ANTHROPIC_API_KEY
export async function POST(req: NextRequest) {
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

  const body = await req.json()

  if (body.action === 'approve' || body.action === 'reject') {
    if (!body.id) return NextResponse.json({ error: 'id és obligatori' }, { status: 400 })
    try {
      await updateRecommendationStatus(body.id, body.action === 'approve' ? 'approved' : 'rejected', user.id)
      return NextResponse.json({ ok: true })
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 })
    }
  }

  if (body.action === 'generate') {
    if (!isAiEnabled()) {
      return NextResponse.json({ error: 'AI no configurada (ANTHROPIC_API_KEY)' }, { status: 503 })
    }
    if (!body.insight_id) return NextResponse.json({ error: 'insight_id és obligatori' }, { status: 400 })

    try {
      const [insight] = await getInsights({ limit: 1 })
      // Fetch the specific insight
      const { createAdminClient } = await import('@/lib/supabase/serverAdmin')
      const admin = createAdminClient()
      const { data: ins, error } = await admin
        .from('ai_insights')
        .select('*')
        .eq('id', body.insight_id)
        .single()

      if (error || !ins) return NextResponse.json({ error: 'Insight no trobada' }, { status: 404 })

      const raws = await generateRecommendations(ins as any)
      const created = await Promise.all(
        raws.map(r => createRecommendation({ ...r, insight_id: body.insight_id }))
      )
      return NextResponse.json({ recommendations: created })
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'action invàlid' }, { status: 400 })
}
