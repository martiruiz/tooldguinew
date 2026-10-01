import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/serverAdmin'
import Anthropic from '@anthropic-ai/sdk'

// Vercel cron — executes via GET with Authorization header
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  const currentWeekday = now.getDay() // 0=Sunday, 1=Monday...

  // Fetch enabled schedules that should run now (±5 min window)
  const { data: schedules, error } = await admin
    .from('agent_schedules')
    .select('*')
    .eq('enabled', true)

  if (error || !schedules?.length) return NextResponse.json({ ran: 0 })

  const toRun = schedules.filter(s => {
    if (s.hour !== currentHour) return false
    if (Math.abs((s.minute ?? 0) - currentMinute) > 5) return false
    if (s.frequency === 'weekly' && s.weekday !== currentWeekday) return false
    return true
  })

  if (!toRun.length) return NextResponse.json({ ran: 0 })

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  let ran = 0

  for (const schedule of toRun) {
    try {
      const { data: config } = await admin
        .from('agent_configs')
        .select('system_prompt, memory')
        .eq('agent_id', schedule.agent_id)
        .single()

      const basePrompt = config?.system_prompt || `Ets un agent especialitzat de Guinew. Respon en català, de forma concisa.`
      const memory = config?.memory || ''
      const systemPrompt = memory
        ? `${basePrompt}\n\n---\nMEMÒRIA DE CONVERSES ANTERIORS:\n${memory}\n---`
        : basePrompt

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 800,
        system: systemPrompt,
        messages: [{ role: 'user', content: schedule.task }],
      })

      const output = message.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map(b => b.text).join('\n')

      // Save conversation
      await admin.from('ai_conversations').insert([
        { agent_id: schedule.agent_id, role: 'user', content: `[PROGRAMAT] ${schedule.task}` },
        { agent_id: schedule.agent_id, role: 'assistant', content: output },
      ])

      // Update last_run
      await admin.from('agent_schedules').update({ last_run: now.toISOString() }).eq('id', schedule.id)

      // Update agent memory
      try {
        const { data: cfg } = await admin.from('agent_configs').select('memory').eq('agent_id', schedule.agent_id).single()
        const existing = cfg?.memory || ''
        const date = now.toLocaleDateString('ca-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })
        const newLine = `[${date}] [CRON] ${schedule.task.slice(0, 60)}: ${output.slice(0, 120)}`
        const combined = (existing + '\n' + newLine).trim()
        const trimmed = combined.length > 800 ? combined.slice(combined.length - 800) : combined
        await admin.from('agent_configs').upsert(
          { agent_id: schedule.agent_id, memory: trimmed, updated_at: now.toISOString() },
          { onConflict: 'agent_id' }
        )
      } catch {}

      // Slack notification (optional)
      if (process.env.SLACK_WEBHOOK_URL) {
        try {
          await fetch(process.env.SLACK_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: `🤖 *${schedule.agent_id}* ha completat una tasca programada\n*Tasca:* ${schedule.task}\n*Resultat:* ${output.slice(0, 280)}${output.length > 280 ? '…' : ''}`,
            }),
          })
        } catch {}
      }

      ran++
    } catch {}
  }

  return NextResponse.json({ ran, timestamp: now.toISOString() })
}
