import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const CONFIG_PATH = join(process.cwd(), 'data', 'voice-config.json')

function readConfig() {
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, 'utf8'))
  } catch {
    return { voice_id: process.env.ELEVEN_LABS_VOICE_ID || 'onwK4e9ZLuTAKqWW03F9' }
  }
}

export async function GET() {
  return NextResponse.json(readConfig())
}

export async function POST(req: NextRequest) {
  const { voice_id } = await req.json()
  if (!voice_id?.trim()) return NextResponse.json({ error: 'Falta voice_id' }, { status: 400 })

  try {
    mkdirSync(join(process.cwd(), 'data'), { recursive: true })
    writeFileSync(CONFIG_PATH, JSON.stringify({ voice_id }, null, 2))
    return NextResponse.json({ ok: true, voice_id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
