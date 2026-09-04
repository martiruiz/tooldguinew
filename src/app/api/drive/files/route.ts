import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDriveClient, getOAuthClient } from '@/lib/google'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticat' }, { status: 401 })

  const { data: tokenRow } = await supabase
    .from('google_tokens')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!tokenRow) return NextResponse.json({ error: 'not_connected' }, { status: 403 })

  // Refresca el token si ha caducat
  const oauth = getOAuthClient()
  oauth.setCredentials({
    access_token: tokenRow.access_token,
    refresh_token: tokenRow.refresh_token,
    expiry_date: tokenRow.expiry_date,
  })
  const { token } = await oauth.getAccessToken()

  const folderId = req.nextUrl.searchParams.get('folderId') || 'root'
  const drive = getDriveClient({ access_token: token!, refresh_token: tokenRow.refresh_token })

  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'files(id,name,mimeType,size,modifiedTime,webViewLink,iconLink,thumbnailLink)',
    orderBy: 'folder,name',
    pageSize: 100,
  })

  return NextResponse.json({ files: res.data.files || [] })
}
