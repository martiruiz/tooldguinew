import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultHeaders: process.env.ANTHROPIC_WORKSPACE_ID
    ? { 'anthropic-workspace-id': process.env.ANTHROPIC_WORKSPACE_ID }
    : {},
})

const FORMATS = ['Vídeo', 'Foto', 'Vertical', 'Story', 'Reel', 'Entrevista', 'B-roll', 'Time-lapse', 'Podcast', 'Altre']

function normalizeFormat(tipus: string): string {
  const t = tipus.toLowerCase().trim()
  if (t.includes('reel')) return 'Reel'
  if (t.includes('foto') || t.includes('photo')) return 'Foto'
  if (t.includes('story') || t.includes('storie')) return 'Story'
  if (t.includes('video') || t.includes('vídeo')) return 'Vídeo'
  if (t.includes('entrevista') || t.includes('interview')) return 'Entrevista'
  if (t.includes('podcast')) return 'Podcast'
  if (t.includes('b-roll') || t.includes('broll')) return 'B-roll'
  if (t.includes('time')) return 'Time-lapse'
  return FORMATS.includes(tipus) ? tipus : 'Altre'
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Falta el fitxer PDF' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')

    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64,
              },
            } as any,
            {
              type: 'text',
              text: `Extreu la taula del pla de continguts d'aquest PDF. Retorna ÚNICAMENT un JSON array (sense cap text addicional) amb els camps:
- "contingut": la descripció del contingut (inclou la secció entre claudàtors si n'hi ha, ex: "[MARCA] Presentació d'OFF")
- "format": el tipus de format (REEL, FOTO, VIDEO, STORY, PODCAST, etc.) tal com apareix al PDF
- "exemple": URL d'exemple si n'hi ha (o cadena buida)
- "guio": URL del guió si n'hi ha (o cadena buida)

Exemple de resposta:
[{"contingut":"[MARCA] Presentació d'OFF","format":"REEL","exemple":"","guio":"https://..."},...]`,
            },
          ],
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return NextResponse.json({ error: 'No s\'ha pogut parsejar la resposta' }, { status: 500 })

    const raw: { contingut: string; format: string; exemple?: string; guio?: string }[] = JSON.parse(jsonMatch[0])

    const shots = raw.map((item, i) => ({
      id: `import_${Date.now()}_${i}`,
      contingut: item.contingut || '',
      format: normalizeFormat(item.format || ''),
      prioritat: 'Mitjana' as const,
      estat: 'pendent' as const,
      exemple: item.exemple || '',
      guio: item.guio || '',
    }))

    return NextResponse.json({ shots })
  } catch (err: any) {
    console.error('[parse-pdf]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
