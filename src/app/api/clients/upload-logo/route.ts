import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const BUCKET = 'client-logos'

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    const clientId = form.get('clientId') as string | null

    if (!file || !clientId) {
      return NextResponse.json({ error: 'Falta fitxer o clientId' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: "Només s'accepten imatges" }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'La imatge no pot superar 5 MB' }, { status: 400 })
    }

    const { data: buckets } = await supabaseAdmin.storage.listBuckets()
    if (!buckets?.find(b => b.name === BUCKET)) {
      await supabaseAdmin.storage.createBucket(BUCKET, { public: true })
    }

    const ext = file.name.split('.').pop() || 'jpg'
    const path = `clients/${clientId}/logo.${ext}`
    const bytes = await file.arrayBuffer()

    const { error } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: file.type, upsert: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path)

    // Update the client's logo_url
    await supabaseAdmin.from('clients').update({ logo_url: data.publicUrl }).eq('id', clientId)

    return NextResponse.json({ url: data.publicUrl })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
