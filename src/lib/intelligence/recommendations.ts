import { createAdminClient } from '@/lib/supabase/serverAdmin'
import type { AiRecommendation, RecommendationStatus } from './types'

export async function createRecommendation(rec: {
  insight_id: string
  action_type: string
  title: string
  rationale: string
  payload: Record<string, unknown>
  requires_approval?: boolean
}): Promise<AiRecommendation> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('ai_recommendations')
    .insert({ ...rec, requires_approval: rec.requires_approval ?? true, status: 'pending' })
    .select('*')
    .single()

  if (error) throw new Error(`createRecommendation: ${error.message}`)
  return data as AiRecommendation
}

export async function getPendingRecommendations(): Promise<AiRecommendation[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('ai_recommendations')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`getPendingRecommendations: ${error.message}`)
  return (data ?? []) as AiRecommendation[]
}

export async function updateRecommendationStatus(
  id: string,
  status: Extract<RecommendationStatus, 'approved' | 'rejected'>,
  approvedBy: string
): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('ai_recommendations')
    .update({
      status,
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('status', 'pending') // only pending can be approved/rejected

  if (error) throw new Error(`updateRecommendationStatus: ${error.message}`)
}
