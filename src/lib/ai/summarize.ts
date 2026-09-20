import { getAnthropicClient } from './client'
import type { AiInsight } from '@/lib/intelligence/types'

const INSIGHT_DESCRIPTIONS: Record<string, string> = {
  overdue_tasks:                   'tasques vençudes',
  blocked_tasks:                   'tasques bloquejades',
  projects_at_risk:                'projectes en risc',
  clients_at_risk:                 'clients en risc',
  stale_opportunities:             'oportunitats estancades',
  opportunities_without_next_step: 'oportunitats sense next step',
  sessions_without_preparation:    'sessions sense preparació',
  overdue_content:                 'contingut vençut',
  unresolved_meetings:             'reunions sense notes',
  business_anomalies:              'anomalies de negoci',
}

export async function generateInsightSummary(insight: AiInsight): Promise<string> {
  const client = getAnthropicClient()
  const description = INSIGHT_DESCRIPTIONS[insight.type] ?? insight.type

  const prompt = `Ets un assistent intern de gestió per a l'agència Guinew. Analitza les següents dades objectives i escriu un resum clar i accionable en català (màxim 2 frases). No afegeixis recomanacions — només descriu el problema.

Tipus d'alerta: ${description}
Títol: ${insight.title}
Dades: ${JSON.stringify(insight.evidence, null, 2)}

Escriu el resum directament, sense cap prefix ni signatura.`

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content.find(b => b.type === 'text')?.text ?? ''
  return text.trim()
}
