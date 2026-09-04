import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDriveClient, getOAuthClient } from '@/lib/google'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticat' }, { status: 401 })

    const { data: tokenRow, error: tokenErr } = await supabase
      .from('google_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (tokenErr || !tokenRow) {
      return NextResponse.json({ error: 'not_connected' }, { status: 403 })
    }

    // Refresh token if expired
    const oauth = getOAuthClient()
    oauth.setCredentials({
      access_token: tokenRow.access_token,
      refresh_token: tokenRow.refresh_token,
      expiry_date: tokenRow.expiry_date,
    })

    let accessToken: string | null | undefined
    try {
      const { token } = await oauth.getAccessToken()
      accessToken = token
    } catch {
      return NextResponse.json({ error: 'token_expired' }, { status: 403 })
    }

    if (!accessToken) {
      return NextResponse.json({ error: 'not_connected' }, { status: 403 })
    }

    const folderId = req.nextUrl.searchParams.get('folderId') || 'root'
    const drive = getDriveClient({ access_token: accessToken, refresh_token: tokenRow.refresh_token })

    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id,name,mimeType,size,modifiedTime,webViewLink,iconLink,thumbnailLink)',
      orderBy: 'folder,name',
      pageSize: 100,
    })

    return NextResponse.json({ files: res.data.files || [] })
  } catch (err: any) {
    console.error('[drive/files] error:', err.message)
    if (err.code === 401 || err.status === 401) {
      return NextResponse.json({ error: 'not_connected' }, { status: 403 })
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
