import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { opportunities } = await req.json()

  if (!opportunities || opportunities.length === 0) {
    return NextResponse.json({ accions: [] })
  }

  const now = new Date()
  const summary = opportunities.map((o: any) => ({
    client: o.client_name,
    etapa: o.stage,
    valor: o.value,
    probabilitat: o.probability,
    dataCreacio: o.created_at,
    dataTancament: o.close_date || null,
  }))

  const prompt = `Ets un assistent de vendes per a una agència de màrqueting. Analitza les següents oportunitats del CRM i genera una llista de les 5 properes accions més urgents a fer.

Data actual: ${now.toISOString().split('T')[0]}

Oportunitats:
${JSON.stringify(summary, null, 2)}

Etapes del pipeline (en ordre):
- prospect: Lead inicial
- contactat: S'ha contactat
- qualificat: Lead qualificat
- proposta: Proposta enviada
- negociacio: En negociació
- tancant: A punt de tancar
- tancat_guanyat: Guanyat
- tancat_perdut: Perdut

Genera exactament 5 accions prioritzades. Per a cada acció retorna:
- client: nom del client
- accio: acció concreta i breu (màx 60 caràcters)
- urgencia: "alta", "mitja" o "baixa"
- motiu: raó breu de la urgència (màx 50 caràcters)

Respon ÚNICAMENT amb un JSON vàlid en aquest format exacte:
{"accions":[{"client":"...","accio":"...","urgencia":"...","motiu":"..."}]}`

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = (message.content[0] as any).text
    const parsed = JSON.parse(text)
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ accions: [] })
  }
}
