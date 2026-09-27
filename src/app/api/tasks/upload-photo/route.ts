import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const BUCKET = 'task-photos'

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function POST(req: NextRequest) {
  const supabaseAdmin = getAdmin()
  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    const taskId = form.get('taskId') as string | null

    if (!file || !taskId) {
      return NextResponse.json({ error: 'Falta fitxer o taskId' }, { status: 400 })
    }

    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')

    if (!isImage && !isVideo) {
      return NextResponse.json({ error: 'Només s\'accepten imatges o vídeos' }, { status: 400 })
    }

    const maxSize = isVideo ? 200 * 1024 * 1024 : 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: isVideo ? 'El vídeo no pot superar 200 MB' : 'La imatge no pot superar 10 MB' }, { status: 400 })
    }

    // Ensure bucket exists
    const { data: buckets } = await supabaseAdmin.storage.listBuckets()
    if (!buckets?.find(b => b.name === BUCKET)) {
      await supabaseAdmin.storage.createBucket(BUCKET, { public: true })
    }

    const path = `tasks/${taskId}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`
    const bytes = await file.arrayBuffer()

    const { error } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: file.type, upsert: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path)

    return NextResponse.json({ url: data.publicUrl, path, type: isVideo ? 'video' : 'image' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const supabaseAdmin = getAdmin()
  try {
    const { path } = await req.json()
    if (!path) return NextResponse.json({ error: 'Falta path' }, { status: 400 })

    const { error } = await supabaseAdmin.storage.from(BUCKET).remove([path])
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
