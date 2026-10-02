import { NextRequest, NextResponse } from 'next/server'

const METRICOOL_USER_TOKEN = process.env.METRICOOL_USER_TOKEN ?? ''
const ASOBAL_BRAND_ID = 6824092

// POST /api/asobal/schedule-post
// Body: { text, scheduledAt (ISO), networks: string[], imageUrl? }
export async function POST(req: NextRequest) {
  const { text, scheduledAt, networks = ['instagram'], imageUrl } = await req.json()

  if (!text || !scheduledAt) {
    return NextResponse.json({ error: 'text i scheduledAt obligatoris' }, { status: 400 })
  }

  if (!METRICOOL_USER_TOKEN) {
    // Dev mode: just echo back what would be sent
    return NextResponse.json({
      ok: true,
      dev_mode: true,
      message: 'METRICOOL_USER_TOKEN no configurat. Afegeix-lo a .env.local',
      payload: { brandId: ASOBAL_BRAND_ID, text, scheduledAt, networks, imageUrl },
    })
  }

  // POST to Metricool API
  // Docs: https://app.metricool.com/api/v2/scheduler/posts
  const results = await Promise.all(
    networks.map(async (network: string) => {
      const body: Record<string, unknown> = {
        brandId: ASOBAL_BRAND_ID,
        network,
        text,
        scheduledDate: scheduledAt,
      }
      if (imageUrl) body.imageUrls = [imageUrl]

      const res = await fetch('https://app.metricool.com/api/v2/scheduler/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user_token': METRICOOL_USER_TOKEN,
        },
        body: JSON.stringify(body),
      })

      const data = await res.json().catch(() => ({}))
      return { network, ok: res.ok, status: res.status, data }
    })
  )

  const allOk = results.every(r => r.ok)
  return NextResponse.json({ ok: allOk, results }, { status: allOk ? 200 : 207 })
}
