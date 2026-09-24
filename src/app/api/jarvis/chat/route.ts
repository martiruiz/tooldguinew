import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import AnthropicSDK from '@anthropic-ai/sdk'

function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY no configurat')
  return new AnthropicSDK({
    apiKey: process.env.ANTHROPIC_API_KEY,
    defaultHeaders: process.env.ANTHROPIC_WORKSPACE_ID
      ? { 'anthropic-workspace-id': process.env.ANTHROPIC_WORKSPACE_ID }
      : {},
  })
}

const JARVIS_SYSTEM = `Ets l'Orchestrator de Guinew OS — el cervell central d'IA de l'Agència Guinew. Coordines els agents especialitzats: Memòria, Automatització, Email, Analytics, Tasques, CRM, Estratègia, Finances i Contingut.

Respon sempre en català. To: professional, directe, intel·ligent — sense formalitats innecessàries.

Regles:
- Respostes concises (2-4 frases màxim), optimitzades per a veu
- Quan activis un agent específic, menciona'l naturalment a la resposta
- Si no tens accés a dades específiques, indica-ho i suggereix com obtenir-les
- Mai inventes dades ni resultats
- L'usuari és Martí Ruiz, director de Guinew Agency`

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })

  const { message, history } = await req.json()
  if (!message?.trim()) return NextResponse.json({ error: 'Missatge buit' }, { status: 400 })

  const client = getClient()

  const messages: AnthropicSDK.MessageParam[] = [
    ...(history ?? []).slice(-6).map((h: { role: string; text: string }) => ({
      role: h.role === 'user' ? 'user' as const : 'assistant' as const,
      content: h.text,
    })),
    { role: 'user', content: message },
  ]

  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 300,
    system: JARVIS_SYSTEM,
    messages,
  })

  const text = response.content.find(c => c.type === 'text')?.text ?? ''
  return NextResponse.json({ text })
}
