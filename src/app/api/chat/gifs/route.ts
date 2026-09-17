import { NextRequest, NextResponse } from 'next/server'

const TENOR_KEY = process.env.TENOR_API_KEY || 'LIVDSRZULELA'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')
  try {
    const base = q
      ? `https://api.tenor.com/v1/search?q=${encodeURIComponent(q)}&key=${TENOR_KEY}&limit=16&media_filter=basic&contentfilter=low`
      : `https://api.tenor.com/v1/trending?key=${TENOR_KEY}&limit=16&media_filter=basic&contentfilter=low`
    const res = await fetch(base)
    const json = await res.json()
    const results = (json.results || []).map((r: any) => ({
      preview: r.media?.[0]?.tinygif?.url || r.media?.[0]?.gif?.url,
      url: r.media?.[0]?.gif?.url || r.media?.[0]?.tinygif?.url,
      title: r.title || '',
    })).filter((r: any) => r.preview && r.url)
    return NextResponse.json({ results })
  } catch (err: any) {
    return NextResponse.json({ results: [], error: err.message }, { status: 500 })
  }
}
