import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { notifyUser, getProfileForNotif } from '@/lib/notifications'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { watcherUserId, taskId, taskTitle, assignerName } = await req.json()
    if (!watcherUserId || !taskId) {
      return NextResponse.json({ error: 'watcherUserId i taskId són obligatoris' }, { status: 400 })
    }

    // Don't notify if you added yourself
    if (watcherUserId === user.id) return NextResponse.json({ ok: true })

    const watcherProfile = await getProfileForNotif(watcherUserId)
    if (!watcherProfile) return NextResponse.json({ ok: true })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
    const taskLink = `/tasks?task=${taskId}`

    await notifyUser({
      userId: watcherUserId,
      email: watcherProfile.email,
      name: watcherProfile.name,
      type: 'task_watching',
      title: `${assignerName} t'ha assignat el seguiment de "${taskTitle}"`,
      body: 'Rebràs notificacions sobre els canvis d\'aquesta tasca.',
      link: taskLink,
      emailSubject: `${assignerName} t'ha assignat el seguiment d'una tasca`,
      emailHtml: watcherEmailHtml({
        assignerName,
        taskTitle,
        taskUrl: `${appUrl}${taskLink}`,
      }),
    })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[tasks/notify-watcher]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

function watcherEmailHtml({
  assignerName,
  taskTitle,
  taskUrl,
}: {
  assignerName: string
  taskTitle: string
  taskUrl: string
}) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, Arial, sans-serif; background: #F4F6F9; margin: 0; padding: 24px;">
  <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
    <div style="background: #254067; padding: 24px 28px;">
      <div style="color: white; font-size: 18px; font-weight: 700;">Guinew OS</div>
    </div>
    <div style="padding: 28px;">
      <h2 style="margin: 0 0 8px; color: #111827; font-size: 16px;">
        Tens una nova tasca en seguiment
      </h2>
      <p style="margin: 0 0 16px; color: #6B7280; font-size: 13px;">
        <strong>${assignerName}</strong> t'ha afegit com a responsable de seguiment de:
      </p>
      <div style="background: #F9FAFB; border-left: 3px solid #254067; padding: 12px 16px; border-radius: 0 6px 6px 0; margin-bottom: 20px;">
        <p style="margin: 0; color: #111827; font-size: 14px; font-weight: 600;">${taskTitle}</p>
      </div>
      <p style="margin: 0 0 20px; color: #6B7280; font-size: 13px;">
        Rebràs avisos sobre els comentaris i canvis d'estat d'aquesta tasca.
      </p>
      <a href="${taskUrl}" style="display: inline-block; background: #254067; color: white; padding: 11px 22px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600;">
        Veure la tasca →
      </a>
    </div>
    <div style="padding: 16px 28px; border-top: 1px solid #F0F0F0; color: #9CA3AF; font-size: 11px;">
      Agència Guinew · Plataforma interna · Pots gestionar les teves notificacions des del teu perfil.
    </div>
  </div>
</body>
</html>`
}
