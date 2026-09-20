import { createAdminClient } from '@/lib/supabase/serverAdmin'
import { runAllDetectors, ALL_DETECTORS } from './detectors'
import { insertInsights } from './insights'
import type { InsightSeverity, InsightType, EntityType } from './types'

export interface RunResult {
  run_id: string
  insights_created: number
  duration_ms: number
  detector_summary: Record<string, number>
  errors: Record<string, string>
}

export async function runIntelligence(
  trigger: 'cron' | 'manual' | 'webhook' = 'manual'
): Promise<RunResult> {
  const admin = createAdminClient()
  const startedAt = Date.now()

  // Create run record
  const { data: runRow, error: runErr } = await admin
    .from('ai_runs')
    .insert({
      trigger,
      detectors_run: ALL_DETECTORS,
      status: 'running',
    })
    .select('id')
    .single()

  if (runErr) throw new Error(`Cannot create ai_run: ${runErr.message}`)
  const runId: string = runRow.id

  const detectorSummary: Record<string, number> = {}
  const errors: Record<string, string> = {}
  let totalInsights = 0

  try {
    const results = await runAllDetectors()

    for (const result of results) {
      detectorSummary[result.fnName] = 0

      if (result.error) {
        errors[result.fnName] = result.error
        console.warn(`[intelligence] detector ${result.fnName} failed:`, result.error)
        continue
      }

      if (result.rows.length === 0) continue

      const toInsert = result.rows.map(row => ({
        type: result.insightType as InsightType,
        severity: (row.severity as InsightSeverity) ?? 'warning',
        entity_type: (row.entity_type as EntityType) ?? null,
        entity_id: row.entity_id ?? null,
        title: row.title,
        evidence: row.evidence ?? {},
        run_id: runId,
      }))

      try {
        const inserted = await insertInsights(toInsert)
        detectorSummary[result.fnName] = inserted
        totalInsights += inserted
      } catch (err: any) {
        errors[result.fnName] = err.message
      }
    }

    const duration = Date.now() - startedAt

    await admin
      .from('ai_runs')
      .update({
        status: Object.keys(errors).length > 0 ? 'completed' : 'completed',
        insights_created: totalInsights,
        duration_ms: duration,
        completed_at: new Date().toISOString(),
        error: Object.keys(errors).length > 0
          ? JSON.stringify(errors)
          : null,
      })
      .eq('id', runId)

    return { run_id: runId, insights_created: totalInsights, duration_ms: duration, detector_summary: detectorSummary, errors }
  } catch (err: any) {
    await admin
      .from('ai_runs')
      .update({ status: 'failed', error: err.message, completed_at: new Date().toISOString() })
      .eq('id', runId)
    throw err
  }
}
