import { createAdminClient } from '@/lib/supabase/serverAdmin'
import type { AiInsight, InsightSeverity, InsightType, EntityType } from './types'

export async function insertInsights(
  rows: Array<{
    type: InsightType
    severity: InsightSeverity
    entity_type: EntityType | null
    entity_id: string | null
    title: string
    evidence: Record<string, unknown>
    run_id: string
  }>
): Promise<number> {
  if (rows.length === 0) return 0
  const admin = createAdminClient()
  const { error, count } = await admin
    .from('ai_insights')
    .insert(rows.map(r => ({ ...r, summary: '', source: 'detector' })))
    .select('id')
    .returns<{ id: string }[]>()

  if (error) throw new Error(`insertInsights: ${error.message}`)
  return rows.length
}

export async function getInsights(opts: {
  entityType?: EntityType
  entityId?: string
  severity?: InsightSeverity
  type?: InsightType
  resolved?: boolean
  limit?: number
}): Promise<AiInsight[]> {
  const admin = createAdminClient()
  let q = admin
    .from('ai_insights')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(opts.limit ?? 50)

  if (opts.entityType) q = q.eq('entity_type', opts.entityType)
  if (opts.entityId)   q = q.eq('entity_id', opts.entityId)
  if (opts.severity)   q = q.eq('severity', opts.severity)
  if (opts.type)       q = q.eq('type', opts.type)
  if (opts.resolved !== undefined) q = q.eq('resolved', opts.resolved)

  const { data, error } = await q
  if (error) throw new Error(`getInsights: ${error.message}`)
  return (data ?? []) as AiInsight[]
}

export async function resolveInsight(id: string): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('ai_insights')
    .update({ resolved: true, resolved_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(`resolveInsight: ${error.message}`)
}

export async function updateInsightSummary(id: string, summary: string): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('ai_insights')
    .update({ summary })
    .eq('id', id)
  if (error) throw new Error(`updateInsightSummary: ${error.message}`)
}
