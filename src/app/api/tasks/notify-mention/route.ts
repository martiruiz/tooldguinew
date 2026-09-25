import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { notifyUser, getProfileForNotif } from '@/lib/notifications'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { mentionedIds, taskId, taskTitle, senderName, commentContent } = await req.json()
    if (!Array.isArray(mentionedIds) || mentionedIds.length === 0) {
      return NextResponse.json({ ok: true })
    }

    const preview = commentContent && commentContent.length > 100
      ? commentContent.slice(0, 100) + '…'
      : (commentContent || '')

    const taskLink = `/tasks?task=${taskId}`
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''

    await Promise.all(
      mentionedIds
        .filter((uid: string) => uid !== user.id)
        .map(async (uid: string) => {
          const profile = await getProfileForNotif(uid)
          if (!profile) return
          await notifyUser({
            userId: uid,
            email: profile.email,
            name: profile.name,
            type: 'mention',
            title: `${senderName} t'ha mencionat a la tasca "${taskTitle}"`,
            body: preview,
            link: taskLink,
            emailSubject: `${senderName} t'ha mencionat a Guinew OS`,
            emailHtml: mentionEmailHtml({
              senderName,
              taskTitle,
              commentContent: preview,
              taskUrl: `${appUrl}${taskLink}`,
            }),
          })
        })
    )

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[tasks/notify-mention]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

function mentionEmailHtml({
  senderName,
  taskTitle,
  commentContent,
  taskUrl,
}: {
  senderName: string
  taskTitle: string
  commentContent: string
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
        ${senderName} t'ha mencionat
      </h2>
      <p style="margin: 0 0 16px; color: #6B7280; font-size: 13px;">
        A un comentari de la tasca <strong style="color: #254067;">${taskTitle}</strong>
      </p>
      ${commentContent ? `
      <div style="background: #F9FAFB; border-left: 3px solid #254067; padding: 12px 16px; border-radius: 0 6px 6px 0; margin-bottom: 20px;">
        <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6;">${commentContent}</p>
      </div>` : ''}
      <a href="${taskUrl}" style="display: inline-block; background: #254067; color: white; padding: 11px 22px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600;">
        Veure la tasca →
      </a>
    </div>
    <div style="padding: 16px 28px; border-top: 1px solid #F0F0F0; color: #9CA3AF; font-size: 11px;">
      Agència Guinew · Plataforma interna
    </div>
  </div>
</body>
</html>`
}
