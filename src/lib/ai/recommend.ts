import { getAnthropicClient } from './client'
import type { AiInsight } from '@/lib/intelligence/types'

export interface RawRecommendation {
  action_type: string
  title: string
  rationale: string
  payload: Record<string, unknown>
}

export async function generateRecommendations(
  insight: AiInsight
): Promise<RawRecommendation[]> {
  const client = getAnthropicClient()

  const prompt = `Ets un assistent intern de gestió per a l'agència Guinew. Basant-te en l'alerta detectada, proposa 1-2 accions concretes. Respon ÚNICAMENT amb un array JSON vàlid, sense cap altre text.

Alerta: ${insight.title}
Detalls: ${JSON.stringify(insight.evidence, null, 2)}

Format de cada acció:
{
  "action_type": "update_task|send_notification|create_task|update_client_health|schedule_meeting",
  "title": "Descripció breu de l'acció",
  "rationale": "Per què es proposa aquesta acció (1 frase)",
  "payload": { "clau": "valor" }
}

Respon amb un array JSON:`

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content.find(b => b.type === 'text')?.text ?? '[]'

  try {
    const parsed = JSON.parse(text.trim())
    if (!Array.isArray(parsed)) return []
    return parsed.slice(0, 2) as RawRecommendation[]
  } catch {
    console.warn('[recommend] Failed to parse LLM response:', text)
    return []
  }
}
