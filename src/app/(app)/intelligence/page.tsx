import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/serverAdmin'
import { redirect } from 'next/navigation'
import { Topbar } from '@/components/layout/Topbar'
import { IntelligenceDashboard } from '@/components/intelligence/IntelligenceDashboard'
import type { Profile } from '@/types'

export default async function IntelligencePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!['superadmin', 'manager'].includes(profile?.role)) redirect('/dashboard')

  const admin = createAdminClient()

  const [
    { data: insights },
    { data: recommendations },
    { data: runs },
  ] = await Promise.all([
    admin
      .from('ai_insights')
      .select('*')
      .eq('resolved', false)
      .order('severity', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(50),
    admin
      .from('ai_recommendations')
      .select('*, insight:ai_insights(title, severity, type)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(20),
    admin
      .from('ai_runs')
      .select('id, trigger, status, insights_created, duration_ms, started_at, completed_at, error')
      .order('started_at', { ascending: false })
      .limit(10),
  ])

  return (
    <>
      <Topbar user={profile as Profile} title="Intel·ligència AI" />
      <IntelligenceDashboard
        insights={insights || []}
        recommendations={recommendations || []}
        runs={runs || []}
        currentUserId={user.id}
        userRole={profile?.role}
      />
    </>
  )
}
