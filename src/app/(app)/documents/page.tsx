import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Topbar } from '@/components/layout/Topbar'
import { DocumentsContent } from '@/components/documents/DocumentsContent'
import type { Profile } from '@/types'

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const { data: tokenRow } = await supabase
    .from('google_tokens')
    .select('user_id, expiry_date')
    .eq('user_id', user.id)
    .single()

  const params = await searchParams

  return (
    <>
      <Topbar user={profile as Profile} title="Documents" />
      <DocumentsContent
        isConnected={!!tokenRow}
        justConnected={params.connected === '1'}
        error={params.error}
      />
    </>
  )
}
