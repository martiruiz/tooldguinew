import { createAdminClient } from '@/lib/supabase/serverAdmin'
import type { DetectorRow, InsightType } from './types'

const DETECTOR_MAP: Record<string, InsightType> = {
  detect_overdue_tasks:                    'overdue_tasks',
  detect_blocked_tasks:                    'blocked_tasks',
  detect_projects_at_risk:                 'projects_at_risk',
  detect_clients_at_risk:                  'clients_at_risk',
  detect_stale_opportunities:              'stale_opportunities',
  detect_opportunities_without_next_step:  'opportunities_without_next_step',
  detect_sessions_without_preparation:     'sessions_without_preparation',
  detect_overdue_content:                  'overdue_content',
  detect_unresolved_meetings:              'unresolved_meetings',
  detect_business_anomalies:              'business_anomalies',
}

export const ALL_DETECTORS = Object.keys(DETECTOR_MAP)

export interface DetectorResult {
  fnName: string
  insightType: InsightType
  rows: DetectorRow[]
  error?: string
}

export async function runDetector(fnName: string): Promise<DetectorResult> {
  const insightType = DETECTOR_MAP[fnName]
  if (!insightType) throw new Error(`Unknown detector: ${fnName}`)

  const admin = createAdminClient()
  const { data, error } = await admin.rpc(fnName as any)

  if (error) {
    return { fnName, insightType, rows: [], error: error.message }
  }

  return {
    fnName,
    insightType,
    rows: (data ?? []) as DetectorRow[],
  }
}

export async function runAllDetectors(): Promise<DetectorResult[]> {
  return Promise.all(ALL_DETECTORS.map(runDetector))
}
