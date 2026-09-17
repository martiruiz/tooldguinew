import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { notifyUser, getProfileForNotif } from '@/lib/notifications'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { taskId, taskTitle, assignedUserId } = await req.json()
    if (!taskId || !assignedUserId) return NextResponse.json({ error: 'taskId and assignedUserId required' }, { status: 400 })

    // Don't notify if assigning to yourself
    if (assignedUserId === user.id) return NextResponse.json({ ok: true })

    const [assignerProfile, assigneeProfile] = await Promise.all([
      getProfileForNotif(user.id),
      getProfileForNotif(assignedUserId),
    ])

    if (assigneeProfile && assignerProfile) {
      await notifyUser({
        userId: assignedUserId,
        email: assigneeProfile.email,
        name: assigneeProfile.name,
        type: 'task_assigned',
        title: `${assignerProfile.name} t'ha assignat una tasca`,
        body: taskTitle || 'Nova tasca assignada',
        link: `/tasks`,
        emailSubject: `Nova tasca assignada: ${taskTitle}`,
        emailHtml: undefined,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
