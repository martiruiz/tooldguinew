import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

// Templates summary for context
const TEMPLATES_CONTEXT = `
Categories de copys ASOBAL disponibles:
- Resultat final: posts de final de partit amb marcador LOCAL vs VISITANT
- Fantasy ASOBAL: posts de la Fantasy de la lliga
- ASOBAL TV: posts per promocionar ASOBAL.TV
- Horaris: publicació d'horaris de jornada
- MVP: posts del MVP de la jornada i del mes
- Resultats jornada: resum de jornada completa
- Classificació: publicació de classificació
- 7 Ideal: l'equip ideal de la jornada
- Top 5 Gols: vídeo dels 5 millors gols
- Top 5 Parades: vídeo de les 5 millors parades
- Imatge jornada: foto destacada de la jornada
- MVP del mes: MVP mensual per votació
`

export async function POST(req: NextRequest) {
  const { category, context, tone, platform, jornada } = await req.json()

  if (!category) {
    return NextResponse.json({ error: 'category is required' }, { status: 400 })
  }

  const platformLabel = platform === 'instagram' ? 'Instagram' : platform === 'twitter' ? 'Twitter/X (màx 280 caràcters)' : 'Instagram i Twitter'

  const prompt = `Ets l'equip de xarxes socials de la Liga NEXUS ENERGÍA ASOBAL (lliga professional de balonmano d'Espanya).

${TEMPLATES_CONTEXT}

Genera 3 variants de copy per a la categoria: "${category}"
${jornada ? `Jornada: ${jornada}` : ''}
${context ? `Context addicional: ${context}` : ''}
Plataforma: ${platformLabel}
To: ${tone || 'dinàmic i engrescador, propi d\'una lliga esportiva professional'}

Regles:
- Usa castellà (la lliga és castellana)
- Els noms de la lliga sempre amb el prefix "Liga NEXUS ENERGÍA ASOBAL"
- Usa emojis estratègicament
- Cada variant ha de ser diferent en estructura i gancho
- Per Twitter: màx 280 caràcters
- Per Instagram: entre 80-200 caràcters (sense hashtags, ja s'afegeixen a part)
- Usa {LOCAL}, {VISITANT}, {GOL_LOCAL}, {GOL_VISITANT}, {MVP}, {JORNADA} etc. com a placeholders si correspon

Retorna EXACTAMENT aquest format JSON (sense markdown):
{"variants": [{"text": "...", "note": "descripció curta del gancho"}, {"text": "...", "note": "..."}, {"text": "...", "note": "..."}]}`

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : ''

  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    const parsed = JSON.parse(jsonMatch?.[0] ?? raw)
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ variants: [{ text: raw, note: 'Generat per IA' }] })
  }
}
