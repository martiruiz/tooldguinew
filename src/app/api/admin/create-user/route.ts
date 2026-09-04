import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { email, full_name, role, position } = await req.json()

  if (!email || !full_name || !role) {
    return NextResponse.json({ error: 'Falten camps obligatoris.' }, { status: 400 })
  }

  // Verify caller is superadmin
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autoritzat.' }, { status: 401 })

  const { data: callerProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (callerProfile?.role !== 'superadmin') {
    return NextResponse.json({ error: 'Accés denegat.' }, { status: 403 })
  }

  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  let userId: string

  // Check if user already exists by email (listUsers with high limit)
  const { data: existingUsers } = await adminSupabase.auth.admin.listUsers({ perPage: 1000 })
  const existingUser = existingUsers?.users?.find(u => u.email === email)

  if (existingUser) {
    userId = existingUser.id
  } else {
    const tempPassword = Math.random().toString(36).slice(2, 12) + 'A1!'
    const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name, role, position },
    })

    if (createError) {
      console.error('Auth create error:', JSON.stringify(createError))
      return NextResponse.json({
        error: `Error creant l'usuari: ${createError.message}`
      }, { status: 400 })
    }

    userId = newUser.user.id
    // Wait for any DB trigger on auth.users to finish
    await new Promise(resolve => setTimeout(resolve, 800))
  }

  // Upsert profile (handles both: trigger already created it, or fresh insert)
  const { error: profileError } = await adminSupabase
    .from('profiles')
    .upsert(
      { id: userId, email, full_name, role, position: position || null, is_active: true },
      { onConflict: 'id' }
    )

  if (profileError) {
    console.error('Profile upsert error:', JSON.stringify(profileError))
    return NextResponse.json({ error: `Error al perfil: ${profileError.message}` }, { status: 400 })
  }

  // Send password reset so user can set their own password
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
  await adminSupabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}/update-password`,
  })

  return NextResponse.json({ success: true, userId })
}
