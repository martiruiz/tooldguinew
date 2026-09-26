import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

function getAnthropic() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY no configurat')
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    defaultHeaders: process.env.ANTHROPIC_WORKSPACE_ID
      ? { 'anthropic-workspace-id': process.env.ANTHROPIC_WORKSPACE_ID }
      : undefined,
  })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('No autoritzat', { status: 401 })

  const { agentId, message, systemPrompt, history = [] } = await req.json()
  if (!agentId || !message?.trim()) return new Response('agentId i message requerits', { status: 400 })

  const anthropic = getAnthropic()

  // Build message history (last 10 exchanges)
  const messages: Anthropic.MessageParam[] = [
    ...history.slice(-10).map((h: { role: string; content: string }) => ({
      role: h.role === 'user' ? 'user' as const : 'assistant' as const,
      content: h.content,
    })),
    { role: 'user', content: message },
  ]

  // Save user message to DB (fire and forget)
  supabase.from('ai_conversations').insert({
    agent_id: agentId,
    role: 'user',
    content: message,
  }).then(() => {})

  // Stream Claude response
  const encoder = new TextEncoder()
  let fullText = ''

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const claude = anthropic.messages.stream({
          model: 'claude-sonnet-4-5',
          max_tokens: 600,
          system: systemPrompt || `Ets un agent especialitzat de l'Agència Guinew. Respon en català, de forma concisa i professional.`,
          messages,
        })

        for await (const chunk of claude) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            const text = chunk.delta.text
            fullText += text
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
          }
        }

        // Save assistant response to DB
        await supabase.from('ai_conversations').insert({
          agent_id: agentId,
          role: 'assistant',
          content: fullText,
        })

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
        controller.close()
      } catch (err: any) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
