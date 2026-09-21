import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/serverAdmin'

// POST /api/metricool/sync
// Rep dades de Metricool (des del MCP o manual) i les desa a metric_reports
// Body: { client_slug, brand_id, platform, period_start, period_end, metrics }
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { client_slug, brand_id, platform, period_start, period_end, metrics, account_handle } = body

  if (!client_slug || !platform || !period_start || !period_end || !metrics) {
    return NextResponse.json({ error: 'Falten camps obligatoris: client_slug, platform, period_start, period_end, metrics' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Obtenir client_id des del slug
  const { data: client, error: clientError } = await admin
    .from('clients')
    .select('id, name')
    .eq('slug', client_slug)
    .single()

  if (clientError || !client) {
    return NextResponse.json({ error: `Client '${client_slug}' no trobat` }, { status: 404 })
  }

  // Desar a metric_reports
  const { data, error } = await admin
    .from('metric_reports')
    .insert({
      client_id: client.id,
      platform,
      account_handle: account_handle ?? null,
      period_start,
      period_end,
      raw_data: { brand_id, metrics, source: 'metricool_mcp' },
      ai_analysis: null,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    ok: true,
    report_id: data.id,
    client: client.name,
    platform,
    period: `${period_start} → ${period_end}`,
  })
}

// GET /api/metricool/sync — retorna el mapa de brandIds per client
export async function GET() {
  const BRAND_MAP: Record<string, { brandId: number; networks: string[] }> = {
    'asobal':            { brandId: 6824092, networks: ['instagram', 'facebook', 'tiktok', 'youtube', 'twitter'] },
    'biwpa':             { brandId: 5525437, networks: ['instagram', 'tiktok', 'youtube'] },
    'elite-fut-academy': { brandId: 4286845, networks: ['instagram', 'facebook', 'tiktok'] },
  }
  return NextResponse.json({ brands: BRAND_MAP })
}
