import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { text } = await req.json()
  if (!text?.trim()) return NextResponse.json({ error: 'Falta text' }, { status: 400 })

  const apiKey = process.env.ELEVEN_LABS_API_KEY
  const voiceId = process.env.ELEVEN_LABS_VOICE_ID || 'onwK4e9ZLuTAKqWW03F9'
  if (!apiKey) return NextResponse.json({ error: 'ELEVEN_LABS_API_KEY no configurada' }, { status: 500 })

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      text: text.slice(0, 2500),
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.45, similarity_boost: 0.82, style: 0.3, use_speaker_boost: true },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('[JARVIS speak] ElevenLabs error', res.status, err.slice(0, 300))
    return NextResponse.json({ error: `ElevenLabs ${res.status}: ${err.slice(0, 200)}` }, { status: res.status })
  }

  const audio = await res.arrayBuffer()
  return new NextResponse(audio, {
    headers: { 'Content-Type': 'audio/mpeg', 'Content-Length': String(audio.byteLength) },
  })
}
