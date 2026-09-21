import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import AnthropicSDK from '@anthropic-ai/sdk'
import { ORCHESTRATOR_TOOLS, executeTool } from '@/lib/ai/orchestrator-tools'
import fs from 'fs'
import path from 'path'

function getOrchestratorClient(): AnthropicSDK {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY no configurat')
  return new AnthropicSDK({
    apiKey: process.env.ANTHROPIC_API_KEY,
    defaultHeaders: process.env.ANTHROPIC_WORKSPACE_ID
      ? { 'anthropic-workspace-id': process.env.ANTHROPIC_WORKSPACE_ID }
      : {},
  })
}

function getSystemPrompt(): string {
  try {
    const p = path.join(process.cwd(), 'src/lib/ai/orchestrator-system-prompt.md')
    return fs.readFileSync(p, 'utf-8')
  } catch {
    return `Ets l'Orchestrator de l'Agència Guinew. Executa les tasques usant les tools disponibles.
Regles no negociables:
- Mai inventis fets, resultats o notícies
- QA és obligatori en tot contingut
- Finances: només per a superadmin
- Crisi: para tot i notifica Martí`
  }
}

// POST /api/orchestrator
// Body: { message: string, conversation_history?: MessageParam[] }
export async function POST(req: NextRequest) {
  // Auth — requereix sessió activa
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Perfil no trobat' }, { status: 403 })

  const { message, conversation_history = [] } = await req.json()
  if (!message?.trim()) {
    return NextResponse.json({ error: 'Missatge buit' }, { status: 400 })
  }

  const anthropic = getOrchestratorClient()

  const messages: AnthropicSDK.MessageParam[] = [
    ...conversation_history,
    { role: 'user', content: message },
  ]

  try {
    let response = await anthropic.messages.create({
      model: 'claude-opus-5',
      max_tokens: 8192,
      system: getSystemPrompt(),
      tools: ORCHESTRATOR_TOOLS,
      messages,
    })

    // Agentic loop — continua fins que Claude deixa de cridar tools
    while (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter(
        (b): b is AnthropicSDK.ToolUseBlock => b.type === 'tool_use'
      )

      const toolResults: AnthropicSDK.ToolResultBlockParam[] = await Promise.all(
        toolUseBlocks.map(async (block) => ({
          type: 'tool_result' as const,
          tool_use_id: block.id,
          content: await executeTool(block.name, block.input as Record<string, any>),
        }))
      )

      messages.push({ role: 'assistant', content: response.content })
      messages.push({ role: 'user', content: toolResults })

      response = await anthropic.messages.create({
        model: 'claude-opus-5',
        max_tokens: 8192,
        system: getSystemPrompt(),
        tools: ORCHESTRATOR_TOOLS,
        messages,
      })
    }

    const text = response.content
      .filter((b): b is AnthropicSDK.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')

    return NextResponse.json({
      response: text,
      usage: response.usage,
    })
  } catch (err: any) {
    console.error('[Orchestrator] Error:', err)
    return NextResponse.json({ error: err.message ?? 'Error intern' }, { status: 500 })
  }
}
