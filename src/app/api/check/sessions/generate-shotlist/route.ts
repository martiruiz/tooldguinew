import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { pdf_url } = await req.json()
    if (!pdf_url) return NextResponse.json({ error: 'pdf_url is required' }, { status: 400 })

    // Download the PDF and convert to base64
    const pdfRes = await fetch(pdf_url)
    if (!pdfRes.ok) return NextResponse.json({ error: 'No s\'ha pogut descarregar el PDF' }, { status: 400 })
    const buffer = await pdfRes.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: { type: 'base64', media_type: 'application/pdf', data: base64 },
            } as any,
            {
              type: 'text',
              text: `Analitza aquest pla de contingut i extreu una shot list detallada per a la sessió.

Retorna ÚNICAMENT un JSON array vàlid (sense cap altre text, sense markdown, sense \`\`\`), on cada element tingui:
- "contingut": descripció clara del contingut a capturar (string)
- "format": el format de captura, un de: "Vídeo", "Foto", "Vertical", "Story", "Reel", "Entrevista", "B-roll", "Time-lapse", "Podcast"
- "prioritat": "Alta", "Mitjana" o "Baixa" (infereix-ho del context; per defecte "Mitjana")

Exemple:
[{"contingut":"Entrevista directora","format":"Entrevista","prioritat":"Alta"},{"contingut":"B-roll oficines","format":"B-roll","prioritat":"Mitjana"}]

Extreu TOTS els elements de contingut que es mencionin al document. Si no és un pla de contingut clar, crea una shot list genèrica basada en el tipus de client o sessió mencionada.`,
            },
          ],
        },
      ],
    })

    const raw = (message.content[0] as any).text?.trim() || '[]'

    // Parse the JSON response
    let shotList: { contingut: string; format: string; prioritat: string }[] = []
    try {
      // Strip any accidental markdown fences
      const cleaned = raw.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim()
      shotList = JSON.parse(cleaned)
      if (!Array.isArray(shotList)) shotList = []
    } catch {
      return NextResponse.json({ error: 'No s\'ha pogut parsejar la resposta de Claude', raw }, { status: 500 })
    }

    // Add default fields
    const items = shotList.map((item, i) => ({
      id: `${Date.now()}-${i}`,
      contingut: item.contingut || '',
      format: item.format || 'Vídeo',
      prioritat: (['Alta', 'Mitjana', 'Baixa'].includes(item.prioritat) ? item.prioritat : 'Mitjana') as 'Alta' | 'Mitjana' | 'Baixa',
      estat: 'pendent' as const,
    }))

    return NextResponse.json({ shot_list: items })
  } catch (err: any) {
    console.error('[generate-shotlist]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
