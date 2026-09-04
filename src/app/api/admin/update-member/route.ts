import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export async function PATCH(req: NextRequest) {
  // Verify caller is superadmin (cookie-auth client)
  const authClient = await createServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autoritzat.' }, { status: 401 })

  const { data: callerProfile } = await authClient.from('profiles').select('role').eq('id', user.id).single()
  if (callerProfile?.role !== 'superadmin') {
    return NextResponse.json({ error: 'Accés denegat.' }, { status: 403 })
  }

  const { memberId, full_name, position, role, is_active } = await req.json()
  if (!memberId) return NextResponse.json({ error: 'Falta memberId.' }, { status: 400 })

  const updates: Record<string, any> = {}
  if (full_name !== undefined) updates.full_name = full_name
  if (position !== undefined) updates.position = position || null
  if (role !== undefined) updates.role = role
  if (is_active !== undefined) updates.is_active = is_active

  // Use service role client to bypass RLS for admin update
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await adminClient
    .from('profiles')
    .update(updates)
    .eq('id', memberId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
