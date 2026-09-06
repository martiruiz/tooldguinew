import { createClient as createAdmin } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

const getAdmin = () => createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type NotifType =
  | 'task_assigned'
  | 'meeting_created'
  | 'session_assigned'
  | 'deadline_today'
  | 'deadline_tomorrow'
  | 'new_client'
  | 'crm_opportunity'
  | 'mention'

interface CreateNotifOptions {
  userId: string
  type: NotifType
  title: string
  body?: string
  link?: string
}

// Check if user has this notification enabled
async function isEnabled(userId: string, type: NotifType, channel: 'inapp' | 'email'): Promise<boolean> {
  const admin = getAdmin()
  const { data } = await admin
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (!data) return true // default: all enabled

  const key = `${channel}_${type}` as keyof typeof data
  return data[key] !== false
}

// Create an in-app notification
export async function createNotification(opts: CreateNotifOptions) {
  const enabled = await isEnabled(opts.userId, opts.type, 'inapp')
  if (!enabled) return

  const admin = getAdmin()
  await admin.from('notifications').insert({
    user_id: opts.userId,
    type: opts.type,
    title: opts.title,
    body: opts.body || null,
    link: opts.link || null,
    read: false,
  })
}

// Send an email via Gmail SMTP
export async function sendEmailNotification(opts: {
  toEmail: string
  toName: string
  subject: string
  htmlContent: string
  userId: string
  type: NotifType
}) {
  const gmailUser = process.env.GMAIL_USER
  const gmailPass = process.env.GMAIL_APP_PASSWORD
  if (!gmailUser || !gmailPass) return // not configured

  const enabled = await isEnabled(opts.userId, opts.type, 'email')
  if (!enabled) return

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: gmailUser, pass: gmailPass },
    })

    await transporter.sendMail({
      from: `"Guinew OS" <${gmailUser}>`,
      to: `"${opts.toName}" <${opts.toEmail}>`,
      subject: opts.subject,
      html: opts.htmlContent,
    })
  } catch (err) {
    console.warn('[notifications] Gmail send failed:', err)
  }
}

// Notify one user (in-app + email if preferences allow)
export async function notifyUser(opts: {
  userId: string
  email: string
  name: string
  type: NotifType
  title: string
  body: string
  link?: string
  emailSubject?: string
  emailHtml?: string
}) {
  await Promise.all([
    createNotification({ userId: opts.userId, type: opts.type, title: opts.title, body: opts.body, link: opts.link }),
    sendEmailNotification({
      userId: opts.userId,
      toEmail: opts.email,
      toName: opts.name,
      type: opts.type,
      subject: opts.emailSubject || opts.title,
      htmlContent: opts.emailHtml || emailTemplate({ title: opts.title, body: opts.body, link: opts.link }),
    }),
  ])
}

function emailTemplate({ title, body, link }: { title: string; body?: string; link?: string }) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, Arial, sans-serif; background: #F4F6F9; margin: 0; padding: 24px;">
  <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
    <div style="background: #254067; padding: 24px 28px;">
      <div style="color: white; font-size: 18px; font-weight: 700;">Guinew OS</div>
    </div>
    <div style="padding: 28px;">
      <h2 style="margin: 0 0 12px; color: #111827; font-size: 16px;">${title}</h2>
      ${body ? `<p style="margin: 0 0 20px; color: #4B5563; font-size: 14px; line-height: 1.6;">${body}</p>` : ''}
      ${link ? `<a href="${process.env.NEXT_PUBLIC_APP_URL}${link}" style="display: inline-block; background: #254067; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600;">Veure detalls</a>` : ''}
    </div>
    <div style="padding: 16px 28px; border-top: 1px solid #F0F0F0; color: #9CA3AF; font-size: 11px;">
      Agència Guinew · Plataforma interna
    </div>
  </div>
</body>
</html>`
}

// Get profile info for notification (email + name)
export async function getProfileForNotif(userId: string): Promise<{ email: string; name: string } | null> {
  const admin = getAdmin()
  const { data: { user } } = await admin.auth.admin.getUserById(userId)
  if (!user?.email) return null
  const { data: profile } = await admin.from('profiles').select('full_name').eq('id', userId).single()
  return { email: user.email, name: profile?.full_name || user.email }
}
