import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY no configurada al .env.local' }, { status: 500 })
    }

    const formData = await req.formData()
    const file = formData.get('pdf') as File | null
    if (!file) return NextResponse.json({ error: 'Cap PDF rebut' }, { status: 400 })
    const extraPrompt = (formData.get('prompt') as string | null)?.trim() || ''

    const buffer = await file.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')

    const workspaceId = process.env.ANTHROPIC_WORKSPACE_ID
    const client = new Anthropic({
      apiKey,
      ...(workspaceId ? { defaultHeaders: { 'anthropic-workspace-id': workspaceId } } : {}),
    })

    const response = await client.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: { type: 'base64', media_type: 'application/pdf', data: base64 },
            },
            {
              type: 'text',
              text: `Ets un expert en Social Media Analytics. Analitza aquest informe de xarxes socials i extreu totes les dades en format JSON estructurat, seguit d'una anàlisi professional en català.${extraPrompt ? `\n\nContext addicional proporcionat per l'usuari: ${extraPrompt}` : ''}

Retorna EXACTAMENT en aquest format (primer el JSON entre triple backticks, després l'anàlisi):

\`\`\`json
{
  "period_start": "YYYY-MM-DD",
  "period_end": "YYYY-MM-DD",
  "platform": "instagram",
  "account_handle": "@handle",
  "community": {
    "followers": 0,
    "followers_balance": 0,
    "total_content": 0
  },
  "reach": {
    "total_views": 0,
    "avg_daily_reach": 0
  },
  "posts": {
    "count": 0,
    "avg_engagement": 0,
    "avg_reach_per_post": 0,
    "interactions": { "likes": 0, "comments": 0, "saves": 0, "shares": 0, "total": 0 }
  },
  "reels": {
    "count": 0,
    "avg_engagement": 0,
    "avg_reach_per_reel": 0,
    "interactions": { "likes": 0, "comments": 0, "saves": 0, "shares": 0, "total": 0 },
    "ranking": [
      { "title": "text", "views": 0, "reach": 0, "likes": 0, "engagement": 0 }
    ]
  },
  "demographics": {
    "gender": { "female": 0, "male": 0, "unknown": 0 },
    "age_groups": { "13-17": 0, "18-24": 0, "25-34": 0, "35-44": 0, "45-54": 0, "55-64": 0, "65+": 0 },
    "top_countries": [{ "country": "", "pct": 0 }],
    "top_cities": [{ "city": "", "pct": 0 }]
  }
}
\`\`\`

ANÀLISI:
Escriu aquí una anàlisi professional de 300-500 paraules en català que inclogui: resum del rendiment del mes, punts forts, punts de millora, el contingut que ha funcionat millor i recomanacions concretes per al proper mes.`,
            },
          ],
        },
      ],
    })

    console.log('Claude response stop_reason:', response.stop_reason)
    console.log('Claude response content blocks:', response.content.length)
    response.content.forEach((block, i) => console.log(`  block[${i}] type:`, (block as any).type))

    const textBlock = response.content.find((b: any) => b.type === 'text') as any
    const text: string = textBlock?.text || ''

    if (!text) {
      const stopReason = response.stop_reason
      return NextResponse.json({
        error: `Claude no ha retornat text. stop_reason: ${stopReason}, blocks: ${response.content.length}. Torna-ho a intentar.`
      }, { status: 500 })
    }

    // Extract JSON block
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/)
    let rawData = {}
    if (jsonMatch) {
      try { rawData = JSON.parse(jsonMatch[1]) } catch (e) {
        console.error('JSON parse error:', e)
      }
    }

    // Extract analysis
    const analysisMatch = text.match(/ANÀLISI:\n?([\s\S]*)/)
    const analysis = analysisMatch ? analysisMatch[1].trim() : text.replace(/```json[\s\S]*?```/, '').trim()

    return NextResponse.json({ rawData, analysis })
  } catch (err: any) {
    console.error('Analyze route error:', err)
    return NextResponse.json({ error: err.message || 'Error processant el PDF' }, { status: 500 })
  }
}
