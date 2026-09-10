'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MessageCircle, X, Send, Paperclip, Image, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'

interface Attachment {
  url: string
  name: string
  type: 'image' | 'file' | 'drive' | 'dropbox'
  mime?: string
}

interface ChatMessage {
  id: string
  user_id: string
  content: string
  attachment?: Attachment | null
  created_at: string
  profile?: { full_name: string; avatar_url?: string }
}

interface Props {
  currentUserId: string
  currentUserName: string
  profiles: { id: string; full_name: string; avatar_url?: string }[]
}

const USER_COLORS = ['#60A5FA', '#34D399', '#F472B6', '#FBBF24', '#A78BFA', '#FB923C', '#38BDF8', '#4ADE80', '#F87171', '#818CF8']
function userColor(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length]
}

function fmtTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' })
}

function dateSepLabel(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  if (d.toDateString() === today.toDateString()) return 'Avui'
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return 'Ahir'
  return d.toLocaleDateString('ca-ES', { weekday: 'long', day: 'numeric', month: 'long' })
}

function isSameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString()
}

function parseMentions(content: string, profiles: { id: string; full_name: string }[]): string[] {
  const mentioned: string[] = []
  const regex = /@\[([^\]]+)\]\(([^)]+)\)/g
  let m
  while ((m = regex.exec(content)) !== null) {
    const uid = m[2]
    if (profiles.find(p => p.id === uid) && !mentioned.includes(uid)) mentioned.push(uid)
  }
  return mentioned
}

function renderContent(content: string, currentUserId: string) {
  const parts = content.split(/(@\[[^\]]+\]\([^)]+\))/g)
  return parts.map((part, i) => {
    const m = part.match(/^@\[([^\]]+)\]\(([^)]+)\)$/)
    if (m) {
      const isMe = m[2] === currentUserId
      return (
        <span key={i} style={{
          background: isMe ? 'rgba(52,211,153,0.25)' : 'rgba(255,255,255,0.15)',
          color: isMe ? '#34D399' : '#93C5FD',
          borderRadius: 4, padding: '1px 4px', fontWeight: 700,
        }}>@{m[1]}</span>
      )
    }
    return <span key={i}>{part}</span>
  })
}

function Avatar({ profile, size = 32 }: { profile?: { full_name: string; avatar_url?: string }; size?: number }) {
  const name = profile?.full_name || '?'
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, #1E3A5F, #254067)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', flexShrink: 0,
      border: '2px solid #1F2937',
    }}>
      {profile?.avatar_url
        ? <img src={profile.avatar_url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <span style={{ fontSize: size * 0.35, fontWeight: 700, color: '#93C5FD', letterSpacing: '-0.02em' }}>{getInitials(name)}</span>
      }
    </div>
  )
}

function AttachmentBubble({ att, isOwn }: { att: Attachment; isOwn: boolean }) {
  const bubbleBg = isOwn ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.06)'
  if (att.type === 'image') {
    return (
      <a href={att.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', borderRadius: 10, overflow: 'hidden', maxWidth: 200, marginTop: 4 }}>
        <img src={att.url} alt={att.name} style={{ display: 'block', maxWidth: 200, maxHeight: 150, objectFit: 'cover', width: '100%' }} />
      </a>
    )
  }
  const icon = att.type === 'drive' ? '📁' : att.type === 'dropbox' ? '📦' : '📄'
  return (
    <a href={att.url} target="_blank" rel="noopener noreferrer"
      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', marginTop: 4, background: bubbleBg, borderRadius: 8, textDecoration: 'none', maxWidth: 200 }}>
      <span style={{ fontSize: 15 }}>{icon}</span>
      <span style={{ flex: 1, fontSize: 11.5, color: 'rgba(255,255,255,0.7)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{att.name}</span>
      <ExternalLink size={10} color="rgba(255,255,255,0.4)" />
    </a>
  )
}

function GoogleDriveIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
      <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
      <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
      <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
      <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
      <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
      <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 27h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
    </svg>
  )
}

function DropboxIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 43 40" xmlns="http://www.w3.org/2000/svg">
      <path fill="#0061FF" d="M12.5 0L0 8.75l8.75 7L21.5 7.5 12.5 0zM0 22.75L12.5 31.5l9-7.5-12.75-8.75L0 22.75zM21.5 24l9 7.5 12.5-8.75-8.75-7.25L21.5 24zM43 8.75L30.5 0l-9 7.5 12.75 8.75L43 8.75zM21.5 26.25L12.5 33.5l-4-2.75V33.5l13 7.5 13-7.5v-2.75l-4 2.75-9-7.25z"/>
    </svg>
  )
}

function GoogleMeetChatIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="36" height="36" rx="8" fill="#00897B"/>
      <path d="M8 13a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V13Z" fill="white"/>
      <path d="M24 16l5-3v10l-5-3V16Z" fill="white"/>
    </svg>
  )
}

export function TeamChat({ currentUserId, currentUserName, profiles }: Props) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [unread, setUnread] = useState(0)
  const [attachMenu, setAttachMenu] = useState(false)
  const [driveModal, setDriveModal] = useState(false)
  const [dropboxModal, setDropboxModal] = useState(false)
  const [meetModal, setMeetModal] = useState(false)
  const [meetUrl, setMeetUrl] = useState('')
  const [linkInput, setLinkInput] = useState('')
  const [linkName, setLinkName] = useState('')
  // DM mode
  const [dmMode, setDmMode] = useState(false)
  const [dmPeer, setDmPeer] = useState<{ id: string; full_name: string; avatar_url?: string } | null>(null)
  const [dmMessages, setDmMessages] = useState<ChatMessage[]>([])
  const [dmInput, setDmInput] = useState('')
  const [dmSending, setDmSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [typingUsers, setTypingUsers] = useState<{ id: string; name: string }[]>([])
  const [sendError, setSendError] = useState<string | null>(null)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionOpen, setMentionOpen] = useState(false)
  const [mentionIdx, setMentionIdx] = useState(0)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const feedRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const attachMenuRef = useRef<HTMLDivElement>(null)
  const typingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const broadcastChRef = useRef<any>(null)
  const optimisticIdRef = useRef<string | null>(null)
  const typingCooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const profileMap = Object.fromEntries(profiles.map(p => [p.id, p]))

  const enrich = useCallback((row: any): ChatMessage => ({
    ...row,
    profile: profileMap[row.user_id],
    attachment: row.attachment || null,
  }), [profileMap])

  const mentionResults = mentionOpen
    ? profiles.filter(p => p.id !== currentUserId && p.full_name.toLowerCase().includes(mentionQuery.toLowerCase())).slice(0, 6)
    : []

  const scrollBottom = useCallback(() => {
    setTimeout(() => {
      if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight
    }, 40)
  }, [])

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail && typeof detail.open === 'boolean') setOpen(detail.open)
      else setOpen(v => !v)
      if (detail?.dmPeer) {
        setDmMode(true)
        setDmPeer(detail.dmPeer)
      }
    }
    window.addEventListener('toggle-team-chat', handler)
    return () => window.removeEventListener('toggle-team-chat', handler)
  }, [])

  useEffect(() => {
    if (open) {
      setUnread(0)
      window.dispatchEvent(new CustomEvent('chat-unread-update', { detail: { count: 0 } }))
      scrollBottom()
    }
  }, [open, scrollBottom])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node)) setAttachMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const supabase = createClient()

    // Initial load
    supabase.from('team_chat')
      .select('id, user_id, content, attachment, created_at')
      .order('created_at', { ascending: true })
      .limit(120)
      .then(({ data }) => {
        if (data) { setMessages(data.map(enrich)); scrollBottom() }
      })

    const ch = supabase.channel('team-chat-v3', { config: { broadcast: { self: false } } })
      // Instant delivery via broadcast (peer-to-peer, arrives before postgres_changes)
      // postgres_changes is the reliable fallback that ensures delivery — never skip it
      .on('broadcast', { event: 'new_message' }, ({ payload }: any) => {
        if (!payload?.id || payload.user_id === currentUserId) return
        setMessages(prev => prev.some(m => m.id === payload.id) ? prev : [...prev, payload])
        scrollBottom()
        // Unread count only — notification handled by postgres_changes to avoid duplicates
        if (!open) {
          setUnread(prev => {
            const next = prev + 1
            window.dispatchEvent(new CustomEvent('chat-unread-update', { detail: { count: next } }))
            return next
          })
        }
      })
      // Typing indicator
      .on('broadcast', { event: 'typing' }, ({ payload }: any) => {
        if (!payload?.user_id || payload.user_id === currentUserId) return
        const userName = profileMap[payload.user_id]?.full_name || payload.name || 'Algú'
        setTypingUsers(prev => prev.some(u => u.id === payload.user_id) ? prev : [...prev, { id: payload.user_id, name: userName }])
        clearTimeout(typingTimers.current[payload.user_id])
        typingTimers.current[payload.user_id] = setTimeout(() => {
          setTypingUsers(prev => prev.filter(u => u.id !== payload.user_id))
        }, 3500)
      })
      // DB guarantee layer — always fires for every INSERT regardless of broadcast
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'team_chat' }, async (payload: any) => {
        const newId = payload.new?.id
        if (!newId) return
        // Fetch full row (payload.new may lack joins/attachments)
        const { data } = await supabase.from('team_chat')
          .select('id, user_id, content, attachment, created_at')
          .eq('id', newId).single()
        if (!data) return
        const enriched = enrich(data)
        setMessages(prev => {
          // Already in state via optimistic update or broadcast — just ensure real id replaces optimistic
          if (prev.some(m => m.id === data.id)) return prev
          // Replace optimistic id for own messages
          if (data.user_id === currentUserId && optimisticIdRef.current) {
            const replaced = prev.map(m => m.id === optimisticIdRef.current ? enriched : m)
            optimisticIdRef.current = null
            return replaced
          }
          return [...prev, enriched]
        })
        scrollBottom()
        if (data.user_id !== currentUserId) {
          setUnread(prev => {
            const next = prev + 1
            window.dispatchEvent(new CustomEvent('chat-unread-update', { detail: { count: next } }))
            return next
          })
          const senderName = profileMap[data.user_id]?.full_name || 'Algú'
          const bodyText = (data.content || '📎 Fitxer adjunt').replace(/@\[([^\]]+)\]\([^)]+\)/g, '@$1')
          // In-app notification — skip if this is a mention (handled separately by /api/chat/mention)
          const isMentioningMe = /@\[[^\]]+\]\(([^)]+)\)/g.test(data.content || '') &&
            (data.content || '').includes(currentUserId)
          if (!isMentioningMe) {
            supabase.from('notifications').insert({
              user_id: currentUserId,
              type: 'comment',
              title: `${senderName} ha escrit al chat`,
              body: bodyText.length > 80 ? bodyText.slice(0, 80) + '…' : bodyText,
              link: null,
              read: false,
            })
          }
          if (Notification.permission === 'granted') {
            new Notification(`${senderName} · Guinew Chat`, {
              body: bodyText,
              icon: '/logo-guinew-icon.png',
            })
          }
        }
      })
      .subscribe()

    broadcastChRef.current = ch
    return () => { supabase.removeChannel(ch) }
  }, [currentUserId, enrich, scrollBottom])

  const sendMessage = async (attachment?: Attachment) => {
    const text = input.trim()
    if (!text && !attachment) return
    if (sending || uploading) return
    setSending(true)
    setSendError(null)

    const supabase = createClient()
    const optimisticId = crypto.randomUUID()
    optimisticIdRef.current = optimisticId
    const now = new Date().toISOString()
    const optimistic: ChatMessage = {
      id: optimisticId,
      user_id: currentUserId,
      content: text,
      attachment: attachment || null,
      created_at: now,
      profile: profileMap[currentUserId],
    }
    setMessages(prev => [...prev, optimistic])
    setInput('')
    setMentionOpen(false)
    scrollBottom()

    const { data: inserted, error } = await supabase.from('team_chat')
      .insert({ user_id: currentUserId, content: text, attachment: attachment || null })
      .select('id, user_id, content, attachment, created_at')
      .single()

    if (error) {
      setMessages(prev => prev.filter(m => m.id !== optimisticId))
      setInput(text)
      setSendError('No s\'ha pogut enviar el missatge.')
      optimisticIdRef.current = null
    } else if (inserted) {
      const realMsg = enrich(inserted)
      // Replace optimistic with real record (has real DB id)
      setMessages(prev => prev.map(m => m.id === optimisticId ? realMsg : m))
      optimisticIdRef.current = null
      // Broadcast to peers for instant delivery
      broadcastChRef.current?.send({ type: 'broadcast', event: 'new_message', payload: realMsg })
      // Mentions
      const mentionedIds = parseMentions(text, profiles).filter(id => id !== currentUserId)
      if (mentionedIds.length > 0) {
        fetch('/api/chat/mention', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mentionedIds, content: text, senderName: currentUserName }),
        }).catch(console.warn)
      }
    }
    setSending(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setInput(val)
    const pos = e.target.selectionStart
    const textBefore = val.slice(0, pos)
    const atMatch = textBefore.match(/@([^@\s]*)$/)
    if (atMatch) { setMentionQuery(atMatch[1]); setMentionOpen(true); setMentionIdx(0) }
    else setMentionOpen(false)

    // Broadcast typing (throttled)
    if (!typingCooldownRef.current) {
      broadcastChRef.current?.send({ type: 'broadcast', event: 'typing', payload: { user_id: currentUserId, name: currentUserName } })
      typingCooldownRef.current = setTimeout(() => { typingCooldownRef.current = null }, 2000)
    }
  }

  const insertMention = (profile: { id: string; full_name: string }) => {
    const pos = textareaRef.current?.selectionStart ?? input.length
    const textBefore = input.slice(0, pos)
    const atIdx = textBefore.lastIndexOf('@')
    const token = `@[${profile.full_name}](${profile.id})`
    const newVal = input.slice(0, atIdx) + token + ' ' + input.slice(pos)
    setInput(newVal)
    setMentionOpen(false)
    setMentionQuery('')
    setTimeout(() => textareaRef.current?.focus(), 0)
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (mentionOpen) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setMentionIdx(i => Math.min(i + 1, mentionResults.length - 1)); return }
      if (e.key === 'ArrowUp') { e.preventDefault(); setMentionIdx(i => Math.max(i - 1, 0)); return }
      if ((e.key === 'Enter' || e.key === 'Tab') && mentionResults[mentionIdx]) { e.preventDefault(); insertMention(mentionResults[mentionIdx]); return }
      if (e.key === 'Escape') { setMentionOpen(false); return }
    }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAttachMenu(false)
    setUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const path = `chat/${currentUserId}/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('chat-attachments').upload(path, file, { upsert: true })
      if (error) { console.error('[upload]', error.message); return }
      const { data: { publicUrl } } = supabase.storage.from('chat-attachments').getPublicUrl(path)
      const isImage = file.type.startsWith('image/')
      await sendMessage({ url: publicUrl, name: file.name, type: isImage ? 'image' : 'file', mime: file.type })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const sendDriveLink = async () => {
    if (!linkInput.trim()) return
    await sendMessage({ url: linkInput.trim(), name: linkName.trim() || 'Fitxer de Google Drive', type: 'drive' })
    setLinkInput(''); setLinkName(''); setDriveModal(false)
  }

  const sendDropboxLink = async () => {
    if (!linkInput.trim()) return
    await sendMessage({ url: linkInput.trim(), name: linkName.trim() || 'Fitxer de Dropbox', type: 'dropbox' })
    setLinkInput(''); setLinkName(''); setDropboxModal(false)
  }

  const sendMeetLink = async () => {
    const url = meetUrl.trim() || 'https://meet.google.com/new'
    await sendMessage({ url, name: 'Reunió de Google Meet', type: 'drive' })
    setMeetUrl(''); setMeetModal(false)
  }

  // DM: load and subscribe when peer selected
  useEffect(() => {
    if (!dmPeer) { setDmMessages([]); return }
    const supabase = createClient()
    supabase.from('direct_messages')
      .select('id, from_user_id, to_user_id, content, attachment, created_at')
      .or(`and(from_user_id.eq.${currentUserId},to_user_id.eq.${dmPeer.id}),and(from_user_id.eq.${dmPeer.id},to_user_id.eq.${currentUserId})`)
      .order('created_at', { ascending: true })
      .limit(100)
      .then(({ data }) => {
        if (data) setDmMessages(data.map((r: any) => ({ ...r, user_id: r.from_user_id, profile: profileMap[r.from_user_id] })))
      })

    const dmCh = supabase.channel(`dm-${[currentUserId, dmPeer.id].sort().join('-')}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages' }, async (payload: any) => {
        const { from_user_id, to_user_id, id } = payload.new ?? {}
        const isForMe = (from_user_id === dmPeer.id && to_user_id === currentUserId) || (from_user_id === currentUserId && to_user_id === dmPeer.id)
        if (!isForMe) return
        const { data } = await supabase.from('direct_messages').select('*').eq('id', id).single()
        if (data) setDmMessages(prev => prev.some(m => m.id === data.id) ? prev : [...prev, { ...data, user_id: data.from_user_id, profile: profileMap[data.from_user_id] }])
        scrollBottom()
      })
      .subscribe()
    return () => { supabase.removeChannel(dmCh) }
  }, [dmPeer, currentUserId, profileMap, scrollBottom])

  const sendDm = async () => {
    const text = dmInput.trim()
    if (!text || !dmPeer || dmSending) return
    setDmSending(true)
    const supabase = createClient()
    const optimisticId = crypto.randomUUID()
    const optimistic: ChatMessage = { id: optimisticId, user_id: currentUserId, content: text, attachment: null, created_at: new Date().toISOString(), profile: profileMap[currentUserId] }
    setDmMessages(prev => [...prev, optimistic])
    setDmInput('')
    scrollBottom()
    const { data } = await supabase.from('direct_messages').insert({ from_user_id: currentUserId, to_user_id: dmPeer.id, content: text }).select('*').single()
    if (data) setDmMessages(prev => prev.map(m => m.id === optimisticId ? { ...data, user_id: data.from_user_id, profile: profileMap[data.from_user_id] } : m))
    setDmSending(false)
  }

  return (
    <>
      <input ref={fileInputRef} type="file" accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip" style={{ display: 'none' }} onChange={handleFileSelect} />

      {/* Panel */}
      <div style={{
        position: 'fixed', right: open ? 0 : -390, top: 0, bottom: 0,
        width: 380, background: '#0B1120', zIndex: 185,
        display: 'flex', flexDirection: 'column',
        transition: 'right 0.28s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: open ? '-8px 0 40px rgba(0,0,0,0.5)' : 'none',
        borderLeft: '1px solid rgba(255,255,255,0.06)',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0, background: '#0D1527',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
            {dmMode && dmPeer ? (
              <button onClick={() => { setDmPeer(null) }} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px 6px', borderRadius: 8, display: 'flex', alignItems: 'center', fontSize: 11, gap: 4, flexShrink: 0 }}>
                ‹ Grup
              </button>
            ) : (
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, #1B4B82, #0D3060)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(27,75,130,0.4)', flexShrink: 0 }}>
                {dmMode ? <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#60A5FA" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> : <MessageCircle size={16} color="#60A5FA" />}
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ color: '#F1F5F9', fontWeight: 700, fontSize: 14.5, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {dmMode && dmPeer ? dmPeer.full_name : dmMode ? 'Missatge directe' : 'Guinew Chat'}
              </div>
              {!dmMode && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34D399', display: 'inline-block' }} />
                  <span style={{ color: '#64748B', fontSize: 11 }}>{profiles.length} membres en línia</span>
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={() => { setDmMode(v => !v); setDmPeer(null) }}
              title={dmMode ? 'Xat de grup' : 'Missatge directe'}
              style={{ background: dmMode ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.06)', border: 'none', color: dmMode ? '#60A5FA' : '#64748B', cursor: 'pointer', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.background = dmMode ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.06)')}
            >
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </button>
            <button onClick={() => setOpen(false)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#64748B', cursor: 'pointer', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}>
              <X size={14} />
            </button>
          </div>
        </div>

        {/* DM: peer selector */}
        {dmMode && !dmPeer && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontSize: 11, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', padding: '4px 4px 10px' }}>Selecciona un membre</div>
            {profiles.filter(p => p.id !== currentUserId).map(p => (
              <button key={p.id} onClick={() => setDmPeer(p)} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 10px', borderRadius: 10,
                background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
                transition: 'background 0.1s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <Avatar profile={p} size={34} />
                <span style={{ fontSize: 13.5, fontWeight: 600, color: '#E2E8F0' }}>{p.full_name}</span>
              </button>
            ))}
          </div>
        )}

        {/* DM: message thread */}
        {dmMode && dmPeer && (
          <>
            <div ref={feedRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 14px 8px', display: 'flex', flexDirection: 'column', gap: 2, scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent', backgroundImage: 'linear-gradient(rgba(11,17,32,0.72) 0%, rgba(11,17,32,0.72) 100%), url(/chat-bg.png)', backgroundSize: 'auto, 380px auto', backgroundRepeat: 'no-repeat, repeat', backgroundPosition: 'top left, top left' }}>
              {dmMessages.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 12, padding: '40px 20px', color: '#334155' }}>
                  <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  <p style={{ fontSize: 13, textAlign: 'center', lineHeight: 1.5 }}>Comença una conversa privada amb {dmPeer.full_name}</p>
                </div>
              )}
              {dmMessages.map((msg, i) => {
                const isOwn = msg.user_id === currentUserId
                const prev = dmMessages[i - 1]
                const next = dmMessages[i + 1]
                const sameUserPrev = prev && prev.user_id === msg.user_id
                const sameUserNext = next && next.user_id === msg.user_id
                const isFirstOfGroup = !sameUserPrev
                const isLastOfGroup = !sameUserNext
                const color = userColor(msg.user_id)
                const name = msg.profile?.full_name || 'Usuari'
                const ownBg = 'linear-gradient(135deg, #1B3A6B 0%, #1E4080 100%)'
                const otherBg = '#1A2236'
                return (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: isOwn ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 8, marginBottom: isLastOfGroup ? 6 : 2 }}>
                    {!isOwn && <div style={{ flexShrink: 0, visibility: isLastOfGroup ? 'visible' : 'hidden' }}><Avatar profile={msg.profile} size={30} /></div>}
                    <div style={{ maxWidth: '78%', display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start', gap: 1 }}>
                      {!isOwn && isFirstOfGroup && <span style={{ fontSize: 11.5, fontWeight: 700, color, paddingLeft: 2, marginBottom: 2 }}>{name}</span>}
                      <div style={{ position: 'relative' }}>
                        <div style={{ background: isOwn ? ownBg : otherBg, borderRadius: isOwn ? (isFirstOfGroup ? '18px 18px 4px 18px' : '18px 4px 4px 18px') : (isFirstOfGroup ? '18px 18px 18px 4px' : '4px 18px 18px 4px'), padding: '8px 12px 6px', boxShadow: isOwn ? '0 1px 6px rgba(27,75,130,0.3)' : '0 1px 4px rgba(0,0,0,0.3)', border: isOwn ? '1px solid rgba(96,165,250,0.12)' : '1px solid rgba(255,255,255,0.06)' }}>
                          {msg.content && <div style={{ fontSize: 13.5, lineHeight: 1.5, color: isOwn ? '#CBD5E1' : '#D1D5DB', wordBreak: 'break-word' }}>{renderContent(msg.content, currentUserId)}</div>}
                          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 3, marginTop: 3 }}>
                            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', whiteSpace: 'nowrap' }}>{fmtTime(msg.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{ padding: '10px 12px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, background: '#0D1527' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <textarea
                  value={dmInput}
                  onChange={e => setDmInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendDm() } }}
                  placeholder={`Missatge a ${dmPeer.full_name}...`}
                  rows={1}
                  style={{ flex: 1, boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '9px 13px', color: '#E2E8F0', fontSize: 13.5, outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: 1.45, maxHeight: 100, overflowY: 'auto' }}
                  onInput={e => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 100) + 'px' }}
                />
                <button
                  onClick={sendDm}
                  disabled={!dmInput.trim() || dmSending}
                  style={{ width: 40, height: 40, borderRadius: 12, border: 'none', background: dmInput.trim() ? 'linear-gradient(135deg, #1B4B82, #2563EB)' : 'rgba(255,255,255,0.05)', color: dmInput.trim() ? '#fff' : '#374151', cursor: dmInput.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.18s cubic-bezier(0.34,1.56,0.64,1)', boxShadow: dmInput.trim() ? '0 4px 14px rgba(37,99,235,0.4)' : 'none' }}
                  onMouseEnter={e => { if (dmInput.trim()) { e.currentTarget.style.transform = 'translateY(-1px) scale(1.05)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(37,99,235,0.5)' }}}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = dmInput.trim() ? '0 4px 14px rgba(37,99,235,0.4)' : 'none' }}
                  onMouseDown={e => { if (dmInput.trim()) e.currentTarget.style.transform = 'scale(0.95)' }}
                  onMouseUp={e => { if (dmInput.trim()) e.currentTarget.style.transform = 'translateY(-1px) scale(1.05)' }}
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Group chat: Messages feed */}
        {!dmMode && <div ref={feedRef} style={{
          flex: 1, overflowY: 'auto', padding: '16px 14px 8px',
          display: 'flex', flexDirection: 'column', gap: 2,
          scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent',
          backgroundImage: 'linear-gradient(rgba(11,17,32,0.72) 0%, rgba(11,17,32,0.72) 100%), url(/chat-bg.png)',
          backgroundSize: 'auto, 380px auto',
          backgroundRepeat: 'no-repeat, repeat',
          backgroundPosition: 'top left, top left',
        }}>
          {messages.map((msg, i) => {
            const isOwn = msg.user_id === currentUserId
            const prev = messages[i - 1]
            const next = messages[i + 1]
            const sameUserPrev = prev && prev.user_id === msg.user_id && isSameDay(prev.created_at, msg.created_at)
            const sameUserNext = next && next.user_id === msg.user_id && isSameDay(msg.created_at, next.created_at)
            const isFirstOfGroup = !sameUserPrev
            const isLastOfGroup = !sameUserNext
            const showDateSep = !prev || !isSameDay(prev.created_at, msg.created_at)
            const name = msg.profile?.full_name || 'Usuari'
            const color = userColor(msg.user_id)

            // Bubble colors
            const ownBg = 'linear-gradient(135deg, #1B3A6B 0%, #1E4080 100%)'
            const otherBg = '#1A2236'

            return (
              <div key={msg.id}>
                {showDateSep && (
                  <div style={{ display: 'flex', alignItems: 'center', margin: '14px 0 10px', gap: 10 }}>
                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                    <span style={{
                      fontSize: 11, color: '#475569', fontWeight: 600,
                      padding: '3px 12px', background: '#131E35', borderRadius: 20,
                      border: '1px solid rgba(255,255,255,0.06)',
                      whiteSpace: 'nowrap',
                    }}>
                      {dateSepLabel(msg.created_at)}
                    </span>
                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  flexDirection: isOwn ? 'row-reverse' : 'row',
                  alignItems: 'flex-end',
                  gap: 8,
                  marginBottom: isLastOfGroup ? 6 : 2,
                }}>
                  {/* Avatar — only for others, at bottom of group */}
                  {!isOwn && (
                    <div style={{ flexShrink: 0, visibility: isLastOfGroup ? 'visible' : 'hidden', marginBottom: 0 }}>
                      <Avatar profile={msg.profile} size={30} />
                    </div>
                  )}

                  <div style={{
                    maxWidth: '78%',
                    display: 'flex', flexDirection: 'column',
                    alignItems: isOwn ? 'flex-end' : 'flex-start',
                    gap: 1,
                  }}>
                    {/* Sender name — first of group for others */}
                    {!isOwn && isFirstOfGroup && (
                      <span style={{ fontSize: 11.5, fontWeight: 700, color, paddingLeft: 2, marginBottom: 2 }}>
                        {name}
                      </span>
                    )}

                    {/* Bubble */}
                    <div style={{ position: 'relative' }}>
                      <div style={{
                        background: isOwn ? ownBg : otherBg,
                        borderRadius: isOwn
                          ? (isFirstOfGroup ? '18px 18px 4px 18px' : '18px 4px 4px 18px')
                          : (isFirstOfGroup ? '18px 18px 18px 4px' : '4px 18px 18px 4px'),
                        padding: '8px 12px 6px',
                        boxShadow: isOwn
                          ? '0 1px 6px rgba(27,75,130,0.3)'
                          : '0 1px 4px rgba(0,0,0,0.3)',
                        border: isOwn
                          ? '1px solid rgba(96,165,250,0.12)'
                          : '1px solid rgba(255,255,255,0.06)',
                      }}>
                        {/* Tail — only on last of group */}
                        {isLastOfGroup && isOwn && (
                          <div style={{
                            position: 'absolute', bottom: 8, right: -7,
                            width: 0, height: 0,
                            borderTop: '7px solid transparent',
                            borderBottom: '0px solid transparent',
                            borderLeft: '8px solid #1E4080',
                          }} />
                        )}
                        {isLastOfGroup && !isOwn && (
                          <div style={{
                            position: 'absolute', bottom: 8, left: -7,
                            width: 0, height: 0,
                            borderTop: '7px solid transparent',
                            borderBottom: '0px solid transparent',
                            borderRight: '8px solid #1A2236',
                          }} />
                        )}

                        {msg.content && (
                          <div style={{ fontSize: 13.5, lineHeight: 1.5, color: isOwn ? '#CBD5E1' : '#D1D5DB', wordBreak: 'break-word' }}>
                            {renderContent(msg.content, currentUserId)}
                          </div>
                        )}

                        {msg.attachment && <AttachmentBubble att={msg.attachment} isOwn={isOwn} />}

                        {/* Timestamp inside bubble */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 3, marginTop: 3 }}>
                          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', whiteSpace: 'nowrap' }}>
                            {fmtTime(msg.created_at)}
                          </span>
                          {isOwn && (
                            <svg width="13" height="8" viewBox="0 0 13 8" fill="none">
                              <path d="M1 4L4 7L9 1" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M5 4L8 7L13 1" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {messages.length === 0 && !uploading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 12, padding: '40px 20px', color: '#334155' }}>
              <MessageCircle size={36} strokeWidth={1.2} />
              <p style={{ fontSize: 13, textAlign: 'center', lineHeight: 1.5 }}>Comença la conversa amb el teu equip</p>
            </div>
          )}

          {uploading && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '4px 0' }}>
              <div style={{ background: '#1A2236', borderRadius: 12, padding: '8px 14px', fontSize: 12, color: '#60A5FA' }}>
                Pujant fitxer...
              </div>
            </div>
          )}

          {/* Typing indicator */}
          {typingUsers.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 4 }}>
              <div style={{ width: 30, height: 30, flexShrink: 0 }} />
              <div style={{ background: '#1A2236', borderRadius: '18px 18px 18px 4px', padding: '10px 14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[0, 1, 2].map(j => (
                    <div key={j} style={{
                      width: 5, height: 5, borderRadius: '50%', background: '#475569',
                      animation: `typing-dot 1.4s ease-in-out ${j * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
              <span style={{ fontSize: 10.5, color: '#475569', marginBottom: 4 }}>
                {typingUsers.map(u => u.name.split(' ')[0]).join(', ')} {typingUsers.length === 1 ? 'escriu' : 'escriuen'}...
              </span>
            </div>
          )}
        </div>}

        {/* Send error — group mode only */}
        {!dmMode && sendError && (
          <div style={{ padding: '6px 14px', background: '#450a0a', color: '#FCA5A5', fontSize: 11.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, borderTop: '1px solid rgba(239,68,68,0.2)' }}>
            <span>{sendError}</span>
            <button onClick={() => setSendError(null)} style={{ background: 'none', border: 'none', color: '#FCA5A5', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
          </div>
        )}

        {/* Input area — group mode only */}
        {!dmMode && <div style={{ padding: '10px 12px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, background: '#0D1527' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            {/* Attach */}
            <div style={{ position: 'relative' }} ref={attachMenuRef}>
              <button
                onClick={() => setAttachMenu(v => !v)}
                title="Adjuntar fitxer"
                style={{
                  width: 40, height: 40, borderRadius: 12,
                  border: `1px solid ${attachMenu ? 'rgba(147,197,253,0.25)' : 'rgba(255,255,255,0.08)'}`,
                  background: attachMenu ? 'rgba(147,197,253,0.12)' : 'rgba(255,255,255,0.05)',
                  color: attachMenu ? '#93C5FD' : '#64748B', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!attachMenu) { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}}
                onMouseLeave={e => { if (!attachMenu) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#64748B'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}}
              >
                <Paperclip size={15} />
              </button>
              {attachMenu && (
                <div style={{
                  position: 'absolute', bottom: 46, left: 0,
                  background: '#131E35', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12, overflow: 'hidden',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.6)', zIndex: 10, minWidth: 200,
                }}>
                  {[
                    { icon: <Image size={14} color="#60A5FA" />, label: 'Foto o document', sub: 'Des de l\'ordinador', onClick: () => { setAttachMenu(false); fileInputRef.current?.click() } },
                    { icon: <GoogleDriveIcon />, label: 'Google Drive', sub: 'Compartir un fitxer', onClick: () => { setAttachMenu(false); setLinkInput(''); setLinkName(''); setDriveModal(true) } },
                    { icon: <DropboxIcon />, label: 'Dropbox', sub: 'Compartir un fitxer', onClick: () => { setAttachMenu(false); setLinkInput(''); setLinkName(''); setDropboxModal(true) } },
                    { icon: <GoogleMeetChatIcon />, label: 'Google Meet', sub: 'Crear o compartir reunió', onClick: () => { setAttachMenu(false); setMeetUrl(''); setMeetModal(true) } },
                  ].map((item, idx, arr) => (
                    <button key={idx} onClick={item.onClick} style={{
                      display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                      padding: '10px 14px', background: 'none', cursor: 'pointer', textAlign: 'left',
                      border: 'none', borderBottom: idx < arr.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                      transition: 'background 0.1s',
                    }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      {item.icon}
                      <div>
                        <div style={{ fontSize: 12.5, color: '#E2E8F0', fontWeight: 600 }}>{item.label}</div>
                        <div style={{ fontSize: 10.5, color: '#475569' }}>{item.sub}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Textarea + mention dropdown */}
            <div style={{ flex: 1, position: 'relative' }}>
              {mentionOpen && mentionResults.length > 0 && (
                <div style={{
                  position: 'absolute', bottom: '100%', left: 0, right: 0, marginBottom: 6,
                  background: '#131E35', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12,
                  overflow: 'hidden', boxShadow: '0 -8px 30px rgba(0,0,0,0.5)', zIndex: 10,
                }}>
                  {mentionResults.map((p, idx) => (
                    <button key={p.id} onMouseDown={e => { e.preventDefault(); insertMention(p) }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                        padding: '8px 12px', border: 'none', cursor: 'pointer', textAlign: 'left',
                        background: idx === mentionIdx ? 'rgba(96,165,250,0.12)' : 'transparent',
                        borderBottom: idx < mentionResults.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                        transition: 'background 0.1s',
                      }}>
                      <Avatar profile={p} size={26} />
                      <div>
                        <span style={{ fontSize: 12.5, color: '#E2E8F0', fontWeight: 600 }}>{p.full_name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKey}
                placeholder="Missatge..."
                rows={1}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12, padding: '9px 13px',
                  color: '#E2E8F0', fontSize: 13.5, outline: 'none', resize: 'none',
                  fontFamily: 'inherit', lineHeight: 1.45,
                  maxHeight: 100, overflowY: 'auto',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => (e.target.style.borderColor = 'rgba(96,165,250,0.3)')}
                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                onInput={e => {
                  const t = e.target as HTMLTextAreaElement
                  t.style.height = 'auto'
                  t.style.height = Math.min(t.scrollHeight, 100) + 'px'
                }}
              />
            </div>

            {/* Send */}
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || sending}
              style={{
                width: 40, height: 40, borderRadius: 12, border: 'none',
                background: input.trim() ? 'linear-gradient(135deg, #1B4B82, #2563EB)' : 'rgba(255,255,255,0.05)',
                color: input.trim() ? '#fff' : '#374151',
                cursor: input.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'all 0.18s cubic-bezier(0.34,1.56,0.64,1)',
                boxShadow: input.trim() ? '0 4px 14px rgba(37,99,235,0.4)' : 'none',
              }}
              onMouseEnter={e => { if (input.trim()) { e.currentTarget.style.transform = 'translateY(-1px) scale(1.05)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(37,99,235,0.5)' }}}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = input.trim() ? '0 4px 14px rgba(37,99,235,0.4)' : 'none' }}
              onMouseDown={e => { if (input.trim()) e.currentTarget.style.transform = 'translateY(0) scale(0.96)' }}
              onMouseUp={e => { if (input.trim()) e.currentTarget.style.transform = 'translateY(-1px) scale(1.05)' }}
            >
              <Send size={14} />
            </button>
          </div>
        </div>}
      </div>

      {/* Google Meet modal */}
      {meetModal && (
        <div style={overlayStyle} onClick={e => e.target === e.currentTarget && setMeetModal(false)}>
          <div style={linkModalStyle}>
            <div style={linkModalHeader}>
              <GoogleMeetChatIcon />
              <span style={{ color: '#F1F5F9', fontWeight: 700, fontSize: 14 }}>Google Meet</span>
              <button onClick={() => setMeetModal(false)} style={closeBtn}><X size={13} /></button>
            </div>
            <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: 12, color: '#64748B', margin: 0, lineHeight: 1.5 }}>Crea una nova reunió o enganxa l'URL d'una existent.</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => { window.open('https://meet.google.com/new', '_blank') }}
                  style={{ flex: 1, padding: '9px 12px', background: 'rgba(0,137,123,0.15)', border: '1px solid rgba(0,137,123,0.3)', borderRadius: 8, color: '#34D399', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit' }}
                >
                  Crear nova reunió ↗
                </button>
              </div>
              <input value={meetUrl} onChange={e => setMeetUrl(e.target.value)} placeholder="https://meet.google.com/xxx-xxxx-xxx" style={linkInputStyle} />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setMeetModal(false)} style={cancelBtnStyle}>Cancel·lar</button>
                <button onClick={sendMeetLink} style={confirmBtnStyle}>Compartir al chat</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Google Drive modal */}
      {driveModal && (
        <div style={overlayStyle} onClick={e => e.target === e.currentTarget && setDriveModal(false)}>
          <div style={linkModalStyle}>
            <div style={linkModalHeader}>
              <GoogleDriveIcon />
              <span style={{ color: '#F1F5F9', fontWeight: 700, fontSize: 14 }}>Compartir des de Google Drive</span>
              <button onClick={() => setDriveModal(false)} style={closeBtn}><X size={13} /></button>
            </div>
            <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: 12, color: '#64748B', margin: 0, lineHeight: 1.5 }}>Copia l'enllaç de compartició del fitxer a Google Drive i enganxa'l aquí.</p>
              <input value={linkName} onChange={e => setLinkName(e.target.value)} placeholder="Nom del fitxer (opcional)" style={linkInputStyle} />
              <input value={linkInput} onChange={e => setLinkInput(e.target.value)} placeholder="https://drive.google.com/..." style={linkInputStyle} autoFocus />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setDriveModal(false)} style={cancelBtnStyle}>Cancel·lar</button>
                <button onClick={sendDriveLink} disabled={!linkInput.trim()} style={{ ...confirmBtnStyle, opacity: !linkInput.trim() ? 0.5 : 1 }}>Compartir</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dropbox modal */}
      {dropboxModal && (
        <div style={overlayStyle} onClick={e => e.target === e.currentTarget && setDropboxModal(false)}>
          <div style={linkModalStyle}>
            <div style={linkModalHeader}>
              <DropboxIcon />
              <span style={{ color: '#F1F5F9', fontWeight: 700, fontSize: 14 }}>Compartir des de Dropbox</span>
              <button onClick={() => setDropboxModal(false)} style={closeBtn}><X size={13} /></button>
            </div>
            <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: 12, color: '#64748B', margin: 0, lineHeight: 1.5 }}>Copia l'enllaç compartit del fitxer a Dropbox i enganxa'l aquí.</p>
              <input value={linkName} onChange={e => setLinkName(e.target.value)} placeholder="Nom del fitxer (opcional)" style={linkInputStyle} />
              <input value={linkInput} onChange={e => setLinkInput(e.target.value)} placeholder="https://www.dropbox.com/..." style={linkInputStyle} autoFocus />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setDropboxModal(false)} style={cancelBtnStyle}>Cancel·lar</button>
                <button onClick={sendDropboxLink} disabled={!linkInput.trim()} style={{ ...confirmBtnStyle, opacity: !linkInput.trim() ? 0.5 : 1 }}>Compartir</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes typing-dot {
          0%, 60%, 100% { opacity: 0.25; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-3px); }
        }
      `}</style>
    </>
  )
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 600,
  backdropFilter: 'blur(4px)',
}

const linkModalStyle: React.CSSProperties = {
  background: '#0D1527', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14,
  width: 380, maxWidth: '92vw', boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
  overflow: 'hidden',
}

const linkModalHeader: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '14px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)',
}

const closeBtn: React.CSSProperties = {
  marginLeft: 'auto', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)',
  color: '#64748B', cursor: 'pointer', padding: 6, borderRadius: 8,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'all 0.15s',
}

const linkInputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10, padding: '10px 13px', color: '#E2E8F0',
  fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box',
  transition: 'border-color 0.15s',
}

const cancelBtnStyle: React.CSSProperties = {
  padding: '8px 16px', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 9, background: 'rgba(255,255,255,0.05)', color: '#94A3B8',
  cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
  transition: 'all 0.15s', letterSpacing: '0.01em',
}

const confirmBtnStyle: React.CSSProperties = {
  padding: '8px 18px', border: 'none',
  borderRadius: 9, background: 'linear-gradient(135deg, #1B4B82, #2563EB)',
  color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
  boxShadow: '0 2px 10px rgba(37,99,235,0.35)', transition: 'all 0.15s',
  letterSpacing: '0.01em',
}
