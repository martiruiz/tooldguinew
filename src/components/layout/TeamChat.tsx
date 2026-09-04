'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, Paperclip, Image, FileText, Link2, ExternalLink } from 'lucide-react'
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

function fmtTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return 'ara'
  if (diff < 3600000) return `fa ${Math.floor(diff / 60000)}m`
  const today = new Date(now); today.setHours(0, 0, 0, 0)
  const dDay = new Date(d); dDay.setHours(0, 0, 0, 0)
  if (dDay.getTime() === today.getTime()) return d.toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' })
  return `${d.toLocaleDateString('ca-ES', { day: '2-digit', month: 'short' })} ${d.toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' })}`
}

function AttachmentBubble({ att, isOwn }: { att: Attachment; isOwn: boolean }) {
  const base: React.CSSProperties = {
    borderRadius: 8, overflow: 'hidden',
    border: `1px solid ${isOwn ? '#2d4a7a' : '#374151'}`,
    maxWidth: 220, marginTop: 4,
  }
  if (att.type === 'image') {
    return (
      <a href={att.url} target="_blank" rel="noopener noreferrer" style={base}>
        <img src={att.url} alt={att.name} style={{ display: 'block', maxWidth: 220, maxHeight: 160, objectFit: 'cover' }} />
      </a>
    )
  }
  const icon = att.type === 'drive' ? '📁' : att.type === 'dropbox' ? '📦' : '📄'
  return (
    <a href={att.url} target="_blank" rel="noopener noreferrer"
      style={{ ...base, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: isOwn ? '#1d3461' : '#1F2937', textDecoration: 'none' }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ flex: 1, fontSize: 12, color: '#D1D5DB', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{att.name}</span>
      <ExternalLink size={11} color="#6B7280" />
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

export function TeamChat({ currentUserId, currentUserName, profiles }: Props) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [unread, setUnread] = useState(0)
  const [attachMenu, setAttachMenu] = useState(false)
  const [driveModal, setDriveModal] = useState(false)
  const [dropboxModal, setDropboxModal] = useState(false)
  const [linkInput, setLinkInput] = useState('')
  const [linkName, setLinkName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [typingUsers, setTypingUsers] = useState<{ id: string; name: string }[]>([])
  const [sendError, setSendError] = useState<string | null>(null)
  const feedRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const attachMenuRef = useRef<HTMLDivElement>(null)
  const typingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const broadcastChannelRef = useRef<any>(null)

  const profileMap = Object.fromEntries(profiles.map(p => [p.id, p]))

  const enrich = (row: any): ChatMessage => ({
    ...row,
    profile: profileMap[row.user_id],
    attachment: row.attachment || null,
  })

  const scrollBottom = () => {
    setTimeout(() => {
      if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight
    }, 50)
  }

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail && typeof detail.open === 'boolean') setOpen(detail.open)
      else setOpen(v => !v)
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
  }, [open])

  // Close attach menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node)) {
        setAttachMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.from('team_chat')
      .select('id, user_id, content, attachment, created_at')
      .order('created_at', { ascending: true })
      .limit(100)
      .then(({ data }) => {
        if (data) { setMessages(data.map(enrich)); scrollBottom() }
      })

    const channel = supabase.channel('team-chat-global')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'team_chat' }, async payload => {
        const { data } = await supabase.from('team_chat')
          .select('id, user_id, content, attachment, created_at')
          .eq('id', payload.new.id).single()
        if (!data) return
        const enriched = enrich(data)
        setMessages(prev => [...prev, enriched])
        scrollBottom()
        if (data.user_id !== currentUserId) {
          setUnread(prev => {
            const next = prev + 1
            window.dispatchEvent(new CustomEvent('chat-unread-update', { detail: { count: next } }))
            return next
          })
          const senderName = profileMap[data.user_id]?.full_name || 'Algú'
          if (Notification.permission === 'granted') {
            new Notification(`${senderName} · Guinew Chat`, {
              body: data.content || '📎 Fitxer adjunt',
              icon: '/logo-guinew-icon.png',
            })
          } else if (Notification.permission === 'default') {
            Notification.requestPermission()
          }
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [currentUserId])

  const sendMessage = async (attachment?: Attachment) => {
    const text = input.trim()
    if (!text && !attachment) return
    if (sending || uploading) return
    setSending(true)
    setSendError(null)
    const supabase = createClient()
    const optimisticId = crypto.randomUUID()
    const optimistic: ChatMessage = {
      id: optimisticId,
      user_id: currentUserId,
      content: text,
      attachment: attachment || null,
      created_at: new Date().toISOString(),
      profile: profileMap[currentUserId],
    }
    setMessages(prev => [...prev, optimistic])
    setInput('')
    scrollBottom()
    const { error } = await supabase.from('team_chat').insert({
      user_id: currentUserId,
      content: text,
      attachment: attachment || null,
    })
    if (error) {
      console.error('[TeamChat] send error:', error.message)
      setMessages(prev => prev.filter(m => m.id !== optimisticId))
      setInput(text)
      setSendError('No s\'ha pogut enviar el missatge. Verifica la connexió.')
    }
    setSending(false)
  }

  const handleKey = (e: React.KeyboardEvent) => {
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
    const url = linkInput.trim()
    if (!url) return
    await sendMessage({ url, name: linkName.trim() || 'Fitxer de Google Drive', type: 'drive' })
    setLinkInput(''); setLinkName(''); setDriveModal(false)
  }

  const sendDropboxLink = async () => {
    const url = linkInput.trim()
    if (!url) return
    await sendMessage({ url, name: linkName.trim() || 'Fitxer de Dropbox', type: 'dropbox' })
    setLinkInput(''); setLinkName(''); setDropboxModal(false)
  }

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
        capture={undefined}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', right: open ? 0 : -350, top: 0, bottom: 0,
        width: 350, background: '#0f1117', zIndex: 185,
        display: 'flex', flexDirection: 'column',
        transition: 'right 0.3s ease',
        boxShadow: open ? '-4px 0 24px rgba(0,0,0,0.35)' : 'none',
        borderLeft: '1px solid #1F2937',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 12px', borderBottom: '1px solid #1F2937', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #34D399, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageCircle size={13} color="white" />
            </div>
            <div>
              <div style={{ color: '#F9FAFB', fontWeight: 800, fontSize: 14, letterSpacing: '-0.01em' }}>Guinew Chat</div>
              <div style={{ color: '#4B5563', fontSize: 10.5 }}>{profiles.length} membres</div>
            </div>
          </div>
          <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', padding: 4 }}>
            <X size={15} />
          </button>
        </div>

        {/* Messages */}
        <div ref={feedRef} style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {messages.map((msg, i) => {
            const isOwn = msg.user_id === currentUserId
            const prev = messages[i - 1]
            const sameUser = prev && prev.user_id === msg.user_id
            const name = msg.profile?.full_name || 'Usuari'
            return (
              <div key={msg.id} style={{ display: 'flex', flexDirection: isOwn ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-start', marginTop: sameUser ? 0 : 6 }}>
                {/* Avatar */}
                {!isOwn && (
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%', background: '#374151',
                    color: '#D1D5DB', fontSize: 10.5, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', flexShrink: 0, marginTop: 2,
                    visibility: sameUser ? 'hidden' : 'visible',
                  }}>
                    {msg.profile?.avatar_url
                      ? <img src={msg.profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : getInitials(name)}
                  </div>
                )}
                <div style={{ maxWidth: '78%', display: 'flex', flexDirection: 'column', gap: 2, alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
                  {/* Sender name — always visible on first of group */}
                  {!sameUser && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ fontSize: 11.5, color: isOwn ? '#60A5FA' : '#9CA3AF', fontWeight: 700 }}>
                        {isOwn ? 'Tu' : name}
                      </span>
                      <span style={{ fontSize: 10, color: '#374151' }}>· {fmtTime(msg.created_at)}</span>
                    </div>
                  )}
                  {/* Text bubble */}
                  {msg.content && (
                    <div style={{
                      background: isOwn ? '#1B2B4B' : '#1F2937',
                      color: isOwn ? '#93C5FD' : '#E5E7EB',
                      borderRadius: isOwn ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                      padding: '7px 11px',
                      fontSize: 13,
                      lineHeight: 1.5,
                      wordBreak: 'break-word',
                    }}>
                      {msg.content}
                    </div>
                  )}
                  {/* Attachment */}
                  {msg.attachment && <AttachmentBubble att={msg.attachment} isOwn={isOwn} />}
                  {/* Timestamp for same-user follow-ups */}
                  {sameUser && (
                    <span style={{ fontSize: 9.5, color: '#2D3748' }}>{fmtTime(msg.created_at)}</span>
                  )}
                </div>
              </div>
            )
          })}
          {messages.length === 0 && (
            <div style={{ color: '#4B5563', fontSize: 13, textAlign: 'center', marginTop: 40 }}>
              Comença la conversa...
            </div>
          )}
          {uploading && (
            <div style={{ color: '#6B7280', fontSize: 12, textAlign: 'center', padding: 8 }}>
              Pujant fitxer...
            </div>
          )}
        </div>

        {/* Send error */}
        {sendError && (
          <div style={{ padding: '6px 14px', background: '#7f1d1d', color: '#FCA5A5', fontSize: 11.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <span>{sendError}</span>
            <button onClick={() => setSendError(null)} style={{ background: 'none', border: 'none', color: '#FCA5A5', cursor: 'pointer', fontSize: 13, lineHeight: 1 }}>×</button>
          </div>
        )}

        {/* Input area */}
        <div style={{ padding: '10px 14px', borderTop: '1px solid #1F2937', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
            {/* Attach button */}
            <div style={{ position: 'relative' }} ref={attachMenuRef}>
              <button
                onClick={() => setAttachMenu(v => !v)}
                title="Adjuntar fitxer"
                style={{
                  width: 36, height: 36, borderRadius: 10, border: 'none',
                  background: attachMenu ? '#374151' : '#1F2937',
                  color: '#6B7280', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'all 0.15s',
                }}
              >
                <Paperclip size={15} />
              </button>
              {attachMenu && (
                <div style={{
                  position: 'absolute', bottom: 44, left: 0, background: '#1F2937',
                  border: '1px solid #374151', borderRadius: 10, overflow: 'hidden',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)', zIndex: 10, minWidth: 190,
                }}>
                  <button
                    onClick={() => { setAttachMenu(false); fileInputRef.current?.click() }}
                    style={attachItemStyle}
                  >
                    <Image size={14} color="#60A5FA" />
                    <div>
                      <div style={{ fontSize: 12.5, color: '#E5E7EB', fontWeight: 600 }}>Foto o document</div>
                      <div style={{ fontSize: 10.5, color: '#6B7280' }}>Des de l'ordinador o mòbil</div>
                    </div>
                  </button>
                  <button
                    onClick={() => { setAttachMenu(false); setLinkInput(''); setLinkName(''); setDriveModal(true) }}
                    style={attachItemStyle}
                  >
                    <GoogleDriveIcon />
                    <div>
                      <div style={{ fontSize: 12.5, color: '#E5E7EB', fontWeight: 600 }}>Google Drive</div>
                      <div style={{ fontSize: 10.5, color: '#6B7280' }}>Compartir un fitxer de Drive</div>
                    </div>
                  </button>
                  <button
                    onClick={() => { setAttachMenu(false); setLinkInput(''); setLinkName(''); setDropboxModal(true) }}
                    style={{ ...attachItemStyle, borderBottom: 'none' }}
                  >
                    <DropboxIcon />
                    <div>
                      <div style={{ fontSize: 12.5, color: '#E5E7EB', fontWeight: 600 }}>Dropbox</div>
                      <div style={{ fontSize: 10.5, color: '#6B7280' }}>Compartir un fitxer de Dropbox</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Escriu un missatge..."
              rows={1}
              style={{
                flex: 1, background: '#1F2937', border: '1px solid #374151',
                borderRadius: 10, padding: '8px 12px', color: '#E5E7EB',
                fontSize: 13, outline: 'none', resize: 'none',
                fontFamily: 'inherit', lineHeight: 1.45,
                maxHeight: 100, overflowY: 'auto',
              }}
              onInput={e => {
                const t = e.target as HTMLTextAreaElement
                t.style.height = 'auto'
                t.style.height = Math.min(t.scrollHeight, 100) + 'px'
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || sending}
              style={{
                width: 36, height: 36, borderRadius: 10, border: 'none',
                background: input.trim() ? '#34D399' : '#1F2937',
                color: input.trim() ? '#0f1117' : '#4B5563',
                cursor: input.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'all 0.15s',
              }}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Google Drive modal */}
      {driveModal && (
        <div style={overlayStyle} onClick={e => e.target === e.currentTarget && setDriveModal(false)}>
          <div style={linkModalStyle}>
            <div style={linkModalHeader}>
              <GoogleDriveIcon />
              <span style={{ color: '#F9FAFB', fontWeight: 700, fontSize: 14 }}>Compartir des de Google Drive</span>
              <button onClick={() => setDriveModal(false)} style={closeBtn}><X size={13} /></button>
            </div>
            <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>Copia l'enllaç de compartició del teu fitxer a Google Drive i enganxa'l aquí.</p>
              <input value={linkName} onChange={e => setLinkName(e.target.value)} placeholder="Nom del fitxer (opcional)" style={linkInputStyle} />
              <input value={linkInput} onChange={e => setLinkInput(e.target.value)} placeholder="https://drive.google.com/..." style={linkInputStyle} autoFocus />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setDriveModal(false)} style={cancelBtnStyle}>Cancel·lar</button>
                <button onClick={sendDriveLink} disabled={!linkInput.trim()} style={confirmBtnStyle}>Compartir</button>
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
              <span style={{ color: '#F9FAFB', fontWeight: 700, fontSize: 14 }}>Compartir des de Dropbox</span>
              <button onClick={() => setDropboxModal(false)} style={closeBtn}><X size={13} /></button>
            </div>
            <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>Copia l'enllaç compartit del teu fitxer a Dropbox i enganxa'l aquí.</p>
              <input value={linkName} onChange={e => setLinkName(e.target.value)} placeholder="Nom del fitxer (opcional)" style={linkInputStyle} />
              <input value={linkInput} onChange={e => setLinkInput(e.target.value)} placeholder="https://www.dropbox.com/..." style={linkInputStyle} autoFocus />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setDropboxModal(false)} style={cancelBtnStyle}>Cancel·lar</button>
                <button onClick={sendDropboxLink} disabled={!linkInput.trim()} style={confirmBtnStyle}>Compartir</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const attachItemStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
  padding: '10px 14px', background: 'none', border: 'none',
  borderBottom: '1px solid #2D3748', cursor: 'pointer', textAlign: 'left',
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 600,
}

const linkModalStyle: React.CSSProperties = {
  background: '#1a1f2e', border: '1px solid #374151', borderRadius: 12,
  width: 380, maxWidth: '92vw', boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
  overflow: 'hidden',
}

const linkModalHeader: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8,
  padding: '14px 16px 12px', borderBottom: '1px solid #374151',
}

const closeBtn: React.CSSProperties = {
  marginLeft: 'auto', background: 'none', border: 'none',
  color: '#6B7280', cursor: 'pointer',
}

const linkInputStyle: React.CSSProperties = {
  width: '100%', height: 36, padding: '0 10px',
  background: '#0f1117', border: '1px solid #374151', borderRadius: 8,
  color: '#E5E7EB', fontSize: 12.5, outline: 'none', fontFamily: 'inherit',
}

const cancelBtnStyle: React.CSSProperties = {
  height: 32, padding: '0 12px', border: '1px solid #374151',
  borderRadius: 7, background: 'none', color: '#9CA3AF',
  fontSize: 12.5, cursor: 'pointer',
}

const confirmBtnStyle: React.CSSProperties = {
  height: 32, padding: '0 14px', border: 'none',
  borderRadius: 7, background: '#34D399', color: '#0f1117',
  fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
}

export function useChatUnread() {
  const badge = typeof document !== 'undefined'
    ? document.getElementById('chat-unread-badge')
    : null
  return badge ? parseInt(badge.dataset.count || '0') : 0
}
