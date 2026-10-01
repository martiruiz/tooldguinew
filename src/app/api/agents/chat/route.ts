import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/serverAdmin'
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

function buildMemoryLine(task: string, reply: string): string {
  const date = new Date().toLocaleDateString('ca-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })
  return `[${date}] ${task.slice(0, 60)}: ${reply.slice(0, 120)}`
}

async function updateMemory(agentId: string, task: string, reply: string) {
  try {
    const admin = createAdminClient()
    const { data } = await admin.from('agent_configs').select('memory').eq('agent_id', agentId).single()
    const existing = data?.memory || ''
    const newLine = buildMemoryLine(task, reply)
    // Keep last ~800 chars of memory
    const combined = (existing + '\n' + newLine).trim()
    const trimmed = combined.length > 800 ? combined.slice(combined.length - 800) : combined
    await admin.from('agent_configs').upsert(
      { agent_id: agentId, memory: trimmed, updated_at: new Date().toISOString() },
      { onConflict: 'agent_id' }
    )
  } catch {}
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('No autoritzat', { status: 401 })

  const { agentId, message, systemPrompt, history = [] } = await req.json()
  if (!agentId || !message?.trim()) return new Response('agentId i message requerits', { status: 400 })

  const anthropic = getAnthropic()

  // Load agent memory
  let agentMemory = ''
  try {
    const admin = createAdminClient()
    const { data } = await admin.from('agent_configs').select('memory').eq('agent_id', agentId).single()
    agentMemory = data?.memory || ''
  } catch {}

  const memoryBlock = agentMemory
    ? `\n\n---\nMEMÒRIA DE CONVERSES ANTERIORS (resum):\n${agentMemory}\n---`
    : ''

  const fullSystemPrompt = (systemPrompt || `Ets un agent especialitzat de l'Agència Guinew. Respon en català, de forma concisa i professional.`) + memoryBlock

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
        const claudeStream = anthropic.messages.stream({
          model: 'claude-sonnet-4-5',
          max_tokens: 600,
          system: fullSystemPrompt,
          messages,
        })

        for await (const chunk of claudeStream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            const text = chunk.delta.text
            fullText += text
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
          }
        }

        const finalMsg = await claudeStream.finalMessage()
        const usage = finalMsg.usage

        // Save assistant response + update memory (fire and forget)
        supabase.from('ai_conversations').insert({
          agent_id: agentId,
          role: 'assistant',
          content: fullText,
        }).then(() => {})

        updateMemory(agentId, message, fullText)

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, usage: { input: usage.input_tokens, output: usage.output_tokens } })}\n\n`))
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
