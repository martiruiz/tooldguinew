'use server'

import { createAdminClient } from '@/lib/supabase/serverAdmin'
import { createClient } from '@/lib/supabase/server'

type ItemPayload = {
  title: string
  status: string
  format: string | null
  channel: string | null
  client_id: string | null
  assigned_to: string | null
  due_date: string | null
  notes: string | null
}

export async function createContentItem(payload: ItemPayload) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('content_items')
    .insert({ ...payload, created_by: user.id })
    .select('id, created_at')
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function updateContentItem(id: string, payload: ItemPayload) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const admin = createAdminClient()
  const { error } = await admin
    .from('content_items')
    .update(payload)
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function deleteContentItem(id: string) {
  const admin = createAdminClient()
  const { error } = await admin
    .from('content_items')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function moveContentItem(id: string, status: string) {
  const admin = createAdminClient()
  const { error } = await admin
    .from('content_items')
    .update({ status })
    .eq('id', id)

  if (error) throw new Error(error.message)
}
