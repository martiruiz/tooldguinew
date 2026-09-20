export type InsightType =
  | 'overdue_tasks'
  | 'blocked_tasks'
  | 'projects_at_risk'
  | 'clients_at_risk'
  | 'stale_opportunities'
  | 'opportunities_without_next_step'
  | 'sessions_without_preparation'
  | 'overdue_content'
  | 'unresolved_meetings'
  | 'business_anomalies'

export type InsightSeverity = 'info' | 'warning' | 'critical'
export type InsightSource = 'detector' | 'llm' | 'manual'
export type EntityType = 'client' | 'project' | 'task' | 'opportunity'

export type RunStatus = 'running' | 'completed' | 'failed'
export type RecommendationStatus = 'pending' | 'approved' | 'rejected' | 'executed' | 'failed'

export interface AiRun {
  id: string
  trigger: 'cron' | 'manual' | 'webhook'
  detectors_run: string[]
  insights_created: number
  duration_ms: number | null
  status: RunStatus
  error: string | null
  started_at: string
  completed_at: string | null
}

export interface AiInsight {
  id: string
  type: InsightType
  severity: InsightSeverity
  entity_type: EntityType | null
  entity_id: string | null
  title: string
  summary: string
  evidence: Record<string, unknown>
  resolved: boolean
  resolved_at: string | null
  source: InsightSource
  run_id: string | null
  created_at: string
  updated_at: string
}

export interface AiRecommendation {
  id: string
  insight_id: string
  action_type: string
  title: string
  rationale: string
  payload: Record<string, unknown>
  requires_approval: boolean
  status: RecommendationStatus
  approved_by: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
}

export interface AiAction {
  id: string
  recommendation_id: string
  action_type: string
  executed_payload: Record<string, unknown>
  result: Record<string, unknown> | null
  success: boolean
  error_message: string | null
  executed_at: string
}

export interface DetectorRow {
  entity_type: string | null
  entity_id: string | null
  title: string
  evidence: Record<string, unknown>
  severity: string
}
