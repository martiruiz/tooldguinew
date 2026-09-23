import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import AnthropicSDK from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'

function getAgentPrompt(agentId: string): string {
  try {
    const jsonPath = path.join(process.cwd(), 'src/data/agents-prompts.json')
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
    const prompt = data[agentId]
    if (prompt && prompt.trim()) return prompt
  } catch {}

  return `Ets l'agent ${agentId} de l'Agència Guinew. Respon de forma professional, directa i en català o castellà según l'usuari. Mai inventis fets. Si no tens prou informació, indica-ho clarament.`
}

// POST /api/agent
// Body: { agentId: string, message: string, conversation_history?: MessageParam[] }
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!profile) return NextResponse.json({ error: 'Perfil no trobat' }, { status: 403 })

  const { agentId, message, conversation_history = [] } = await req.json()
  if (!agentId) return NextResponse.json({ error: 'agentId requerit' }, { status: 400 })
  if (!message?.trim()) return NextResponse.json({ error: 'Missatge buit' }, { status: 400 })

  // Finances: only superadmin / Martí
  if (agentId === '11_finances' && profile.role !== 'superadmin') {
    return NextResponse.json({
      response: 'La informació financera és confidencial. Accés restringit a l\'administrador.',
    })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY no configurat' }, { status: 500 })
  }
  const anthropic = new AnthropicSDK({ apiKey: process.env.ANTHROPIC_API_KEY })

  const systemPrompt = getAgentPrompt(agentId)
  const messages: AnthropicSDK.MessageParam[] = [
    ...conversation_history,
    { role: 'user', content: message },
  ]

  try {
    const response = await anthropic.messages.create({
      model: 'claude-opus-5',
      max_tokens: 4096,
      system: systemPrompt,
      messages,
    })

    const text = response.content
      .filter((b): b is AnthropicSDK.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('\n')

    return NextResponse.json({ response: text, usage: response.usage })
  } catch (err: any) {
    console.error(`[Agent ${agentId}] Error:`, err)
    return NextResponse.json({ error: err.message ?? 'Error intern' }, { status: 500 })
  }
}
