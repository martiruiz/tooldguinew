import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.ELEVEN_LABS_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'ELEVEN_LABS_API_KEY no configurada' }, { status: 500 })

  const res = await fetch('https://api.elevenlabs.io/v1/voices', {
    headers: { 'xi-api-key': apiKey },
  })

  if (!res.ok) return NextResponse.json({ error: `ElevenLabs ${res.status}` }, { status: res.status })

  const data = await res.json()
  const voices = (data.voices ?? []).map((v: any) => ({
    voice_id: v.voice_id,
    name: v.name,
    category: v.category,
    labels: v.labels ?? {},
    preview_url: v.preview_url,
    description: v.description ?? '',
  }))

  return NextResponse.json({ voices })
}
