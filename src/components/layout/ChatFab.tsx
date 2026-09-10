'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MessageCircle, Send, ArrowLeft, X, Globe, Users, Plus, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'

interface Profile { id: string; full_name: string; avatar_url?: string }
interface Props { currentUserId?: string; profiles?: Profile[] }

interface DmPreview {
  peerId: string; peerName: string; peerAvatar?: string
  lastMsg: string; lastAt: string; unread: number
}
interface ConvPreview {
  id: string; type: 'direct' | 'group'; name: string; color?: string
  lastMsg: string; lastAt: string; members: Profile[]
}

function fmtTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Ara'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return new Date(iso).toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' })
}
function fmtClock(iso: string) {
  return new Date(iso).toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' })
}

function Av({ name, avatar, size = 36, color }: { name: string; avatar?: string; size?: number; color?: string }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: color || 'linear-gradient(135deg,#1B2B4B,#3B6FD4)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.34, fontWeight: 700, flexShrink: 0, overflow: 'hidden' }}>
      {avatar ? <img src={avatar} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : getInitials(name)}
    </div>
  )
}

type ChatTarget =
  | { kind: 'global' }
  | { kind: 'dm'; peer: Profile }
  | { kind: 'conv'; convId: string; name: string; color?: string }

function MiniChat({ target, currentUserId, profiles, onBack }: {
  target: ChatTarget; currentUserId: string; profiles: Profile[]; onBack: () => void
}) {
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const profileMap = Object.fromEntries(profiles.map(p => [p.id, p]))

  const scrollBottom = useCallback(() => setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 40), [])

  useEffect(() => {
    setMessages([])
    if (target.kind === 'global') {
      supabase.from('team_chat').select('*, profiles:profiles!team_chat_user_id_fkey(id,full_name,avatar_url)')
        .order('created_at', { ascending: true }).limit(60)
        .then(({ data }) => { setMessages(data || []); scrollBottom() })
      const ch = supabase.channel('fab-global')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'team_chat' }, (p: any) => {
          setMessages(prev => [...prev, p.new]); scrollBottom()
        }).subscribe()
      return () => { supabase.removeChannel(ch) }
    } else if (target.kind === 'dm') {
      const peerId = target.peer.id
      supabase.from('direct_messages').select('*')
        .or(`and(from_user_id.eq.${currentUserId},to_user_id.eq.${peerId}),and(from_user_id.eq.${peerId},to_user_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true }).limit(60)
        .then(({ data }) => { setMessages(data || []); scrollBottom() })
      const ch = supabase.channel(`fab-dm-${[currentUserId, peerId].sort().join('-')}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages' }, (p: any) => {
          const { from_user_id, to_user_id } = p.new
          if ((from_user_id === peerId && to_user_id === currentUserId) || (from_user_id === currentUserId && to_user_id === peerId)) {
            setMessages(prev => [...prev, p.new]); scrollBottom()
          }
        }).subscribe()
      return () => { supabase.removeChannel(ch) }
    } else {
      supabase.from('conversation_messages').select('*').eq('conversation_id', target.convId)
        .order('created_at', { ascending: true }).limit(60)
        .then(({ data }) => { setMessages(data || []); scrollBottom() })
      const ch = supabase.channel(`fab-conv-${target.convId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversation_messages', filter: `conversation_id=eq.${target.convId}` }, (p: any) => {
          setMessages(prev => [...prev, p.new]); scrollBottom()
        }).subscribe()
      return () => { supabase.removeChannel(ch) }
    }
  }, [target.kind, (target as any).peer?.id, (target as any).convId])

  const send = async () => {
    const text = input.trim(); if (!text || sending) return
    setSending(true); setInput('')
    const optId = `opt-${Date.now()}`
    if (target.kind === 'global') {
      const opt = { id: optId, user_id: currentUserId, content: text, created_at: new Date().toISOString() }
      setMessages(prev => [...prev, opt]); scrollBottom()
      const { data } = await supabase.from('team_chat').insert({ user_id: currentUserId, content: text }).select('*').single()
      if (data) setMessages(prev => prev.map(m => m.id === optId ? data : m))
    } else if (target.kind === 'dm') {
      const opt = { id: optId, from_user_id: currentUserId, to_user_id: target.peer.id, content: text, created_at: new Date().toISOString() }
      setMessages(prev => [...prev, opt]); scrollBottom()
      const { data } = await supabase.from('direct_messages').insert({ from_user_id: currentUserId, to_user_id: target.peer.id, content: text }).select('*').single()
      if (data) setMessages(prev => prev.map(m => m.id === optId ? data : m))
    } else {
      const opt = { id: optId, conversation_id: target.convId, user_id: currentUserId, content: text, created_at: new Date().toISOString() }
      setMessages(prev => [...prev, opt]); scrollBottom()
      const { data } = await supabase.from('conversation_messages').insert({ conversation_id: target.convId, user_id: currentUserId, content: text }).select('*').single()
      if (data) setMessages(prev => prev.map(m => m.id === optId ? data : m))
    }
    setSending(false)
  }

  const isMe = (msg: any) => {
    if (target.kind === 'global') return msg.user_id === currentUserId
    if (target.kind === 'dm') return msg.from_user_id === currentUserId
    return msg.user_id === currentUserId
  }
  const getSender = (msg: any): Profile | undefined => {
    if (target.kind === 'global') return profileMap[msg.user_id] || (msg.profiles as Profile)
    if (target.kind === 'dm') return profileMap[msg.from_user_id]
    return profileMap[msg.user_id]
  }
  const isSame = (a: any, b: any) => {
    if (target.kind === 'dm') return a.from_user_id === b.from_user_id
    return a.user_id === b.user_id
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid #F0F2F5', flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: '#F3F4F6', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', display: 'flex', color: '#6B7280' }}>
          <ArrowLeft size={13} />
        </button>
        {target.kind === 'global' && (
          <div style={{ width: 30, height: 30, borderRadius: 9, background: 'linear-gradient(135deg,#1B2B4B,#3B6FD4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Globe size={14} color="white" />
          </div>
        )}
        {target.kind === 'dm' && <Av name={target.peer.full_name} avatar={target.peer.avatar_url} size={30} />}
        {target.kind === 'conv' && (
          <div style={{ width: 30, height: 30, borderRadius: 9, background: target.color || '#254067', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: 'white' }}>
            {target.name.slice(0, 1)}
          </div>
        )}
        <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {target.kind === 'global' ? "Chat de l'equip" : target.kind === 'dm' ? target.peer.full_name : target.name}
        </span>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {messages.map((msg, i) => {
          const mine = isMe(msg)
          const sender = getSender(msg)
          const prev = messages[i - 1]
          const grouped = prev && isSame(prev, msg) && new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime() < 180000
          const text = msg.content || ''
          return (
            <div key={msg.id} style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginTop: grouped ? 2 : 8, flexDirection: mine ? 'row-reverse' : 'row' }}>
              {!mine && !grouped && <Av name={sender?.full_name || '?'} avatar={sender?.avatar_url} size={24} />}
              {!mine && grouped && <div style={{ width: 24, flexShrink: 0 }} />}
              <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start' }}>
                {!grouped && !mine && <span style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', marginBottom: 2, paddingLeft: 2 }}>{sender?.full_name}</span>}
                <div style={{ background: mine ? 'linear-gradient(135deg,#1B2B4B,#3167C8)' : '#F1F3F7', color: mine ? 'white' : '#111827', padding: '7px 11px', borderRadius: mine ? '14px 14px 3px 14px' : '14px 14px 14px 3px', fontSize: 13, lineHeight: 1.45, wordBreak: 'break-word' }}>
                  {text}
                  <span style={{ fontSize: 9, opacity: 0.45, marginLeft: 6, verticalAlign: 'bottom', whiteSpace: 'nowrap' }}>{fmtClock(msg.created_at)}</span>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: 6, padding: '8px 10px 10px', borderTop: '1px solid #F0F2F5', flexShrink: 0, alignItems: 'flex-end' }}>
        <textarea
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="Missatge…" rows={1}
          style={{ flex: 1, resize: 'none', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '7px 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none', lineHeight: 1.4, maxHeight: 80, overflowY: 'auto', background: '#FAFBFC', color: '#111827', transition: 'border-color 0.15s' }}
          onFocus={e => { e.target.style.borderColor = '#254067' }}
          onBlur={e => { e.target.style.borderColor = '#E5E7EB' }}
        />
        <button onClick={send} disabled={!input.trim() || sending}
          style={{ width: 34, height: 34, borderRadius: 10, border: 'none', background: input.trim() ? 'linear-gradient(135deg,#1B2B4B,#3167C8)' : '#E5E7EB', color: input.trim() ? 'white' : '#9CA3AF', cursor: input.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s', boxShadow: input.trim() ? '0 2px 8px rgba(37,64,103,0.3)' : 'none' }}>
          <Send size={13} />
        </button>
      </div>
    </div>
  )
}

export function ChatFab({ currentUserId, profiles = [] }: Props) {
  const [open, setOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [target, setTarget] = useState<ChatTarget | null>(null)
  const [unread, setUnread] = useState(0)
  const [dmPreviews, setDmPreviews] = useState<DmPreview[]>([])
  const [convPreviews, setConvPreviews] = useState<ConvPreview[]>([])
  const [search, setSearch] = useState('')
  const supabase = createClient()
  const profileMap = Object.fromEntries(profiles.map(p => [p.id, p]))

  // Listen for team chat + open-fab-chat events
  useEffect(() => {
    const onToggle = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail && typeof detail.open === 'boolean') setChatOpen(detail.open)
      else setChatOpen(v => !v)
    }
    const onUnread = (e: Event) => {
      setUnread((e as CustomEvent).detail?.count ?? 0)
    }
    const onOpenFab = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (!detail) return
      setOpen(true)
      if (detail.kind === 'dm' && detail.peer) {
        setTarget({ kind: 'dm', peer: detail.peer })
      } else if (detail.kind === 'conv' && detail.convId) {
        setTarget({ kind: 'conv', convId: detail.convId, name: detail.name, color: detail.color })
      } else if (detail.kind === 'global') {
        setTarget({ kind: 'global' })
      } else {
        setTarget(null) // open list
      }
    }
    window.addEventListener('toggle-team-chat', onToggle)
    window.addEventListener('chat-unread-update', onUnread)
    window.addEventListener('open-fab-chat', onOpenFab)
    return () => {
      window.removeEventListener('toggle-team-chat', onToggle)
      window.removeEventListener('chat-unread-update', onUnread)
      window.removeEventListener('open-fab-chat', onOpenFab)
    }
  }, [])

  const loadPreviews = useCallback(async () => {
    if (!currentUserId) return

    // DM previews
    const { data: dms } = await supabase.from('direct_messages')
      .select('from_user_id, to_user_id, content, created_at')
      .or(`from_user_id.eq.${currentUserId},to_user_id.eq.${currentUserId}`)
      .order('created_at', { ascending: false }).limit(200)

    if (dms) {
      const map: Record<string, DmPreview> = {}
      for (const row of dms) {
        const peerId = row.from_user_id === currentUserId ? row.to_user_id : row.from_user_id
        if (!map[peerId]) {
          const peer = profileMap[peerId]
          map[peerId] = { peerId, peerName: peer?.full_name || '?', peerAvatar: peer?.avatar_url, lastMsg: row.content, lastAt: row.created_at, unread: 0 }
        }
      }
      setDmPreviews(Object.values(map).sort((a, b) => b.lastAt.localeCompare(a.lastAt)).slice(0, 8))
    }

    // Conversation previews
    const { data: myConvIds } = await supabase.from('conversation_members').select('conversation_id').eq('user_id', currentUserId)
    if (myConvIds?.length) {
      const ids = myConvIds.map((r: any) => r.conversation_id)
      const { data: convData } = await supabase.from('conversations').select('*').in('id', ids).order('updated_at', { ascending: false })
      const { data: membersData } = await supabase.from('conversation_members').select('conversation_id, user_id').in('conversation_id', ids)
      const { data: lastMsgs } = await supabase.from('conversation_messages').select('conversation_id, content, created_at').in('conversation_id', ids).order('created_at', { ascending: false }).limit(ids.length * 3)
      const lastMap: Record<string, { content: string; created_at: string }> = {}
      for (const msg of (lastMsgs || [])) { if (!lastMap[msg.conversation_id]) lastMap[msg.conversation_id] = msg }
      setConvPreviews((convData || []).map((c: any) => ({
        id: c.id, type: c.type, name: c.name || 'Grup', color: c.avatar_color,
        lastMsg: lastMap[c.id]?.content || '',
        lastAt: lastMap[c.id]?.created_at || c.updated_at,
        members: (membersData || []).filter((m: any) => m.conversation_id === c.id).map((m: any) => profileMap[m.user_id]).filter(Boolean),
      })))
    }
  }, [currentUserId, profileMap])

  useEffect(() => {
    if (currentUserId) loadPreviews()
  }, [open, currentUserId, loadPreviews])

  // Always-on subscription: badge when closed, refresh when open
  useEffect(() => {
    if (!currentUserId) return
    const ch = supabase.channel('fab-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages' }, (p: any) => {
        if (!open && p.new.to_user_id === currentUserId) setUnread(n => n + 1)
        loadPreviews()
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversation_messages' }, () => {
        loadPreviews()
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversation_members' }, () => {
        loadPreviews()
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [currentUserId, open, loadPreviews])

  const toggleFab = () => {
    if (!currentUserId) {
      // fallback: toggle team chat
      window.dispatchEvent(new CustomEvent('toggle-team-chat'))
      return
    }
    setOpen(v => !v)
    setTarget(null)
  }

  const allItems = [
    ...convPreviews.map(c => ({ ...c, _type: 'conv' as const })),
    ...dmPreviews.map(d => ({ ...d, _type: 'dm' as const })),
  ].sort((a, b) => (b.lastAt || '').localeCompare(a.lastAt || ''))

  const searchLower = search.toLowerCase()
  const filtered = search
    ? allItems.filter(item => {
        const name = item._type === 'conv' ? item.name : item.peerName
        return name.toLowerCase().includes(searchLower)
      })
    : allItems

  const others = profiles.filter(p => p.id !== currentUserId)
  const filteredPeople = search ? others.filter(p => p.full_name.toLowerCase().includes(searchLower) && !dmPreviews.find(d => d.peerId === p.id)) : []

  return (
    <>
      {/* Floating panel */}
      {open && currentUserId && (
        <div style={{
          position: 'fixed', bottom: 84, right: 20, width: 340, height: 480,
          background: 'white', borderRadius: 18, boxShadow: '0 8px 40px rgba(0,0,0,0.18), 0 2px 12px rgba(0,0,0,0.08)',
          zIndex: 190, display: 'flex', flexDirection: 'column', overflow: 'hidden',
          border: '1px solid rgba(0,0,0,0.08)',
          animation: 'fabPanelIn 0.22s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          {/* Panel header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 10px', borderBottom: '1px solid #F0F2F5', flexShrink: 0, background: 'white' }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px' }}>
              {target ? null : 'Missatgeria'}
            </span>
            {!target && (
              <button onClick={() => { setOpen(false) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex', padding: 4, borderRadius: 8 }}>
                <X size={16} />
              </button>
            )}
          </div>

          {/* Chat view or list view */}
          {target && currentUserId ? (
            <MiniChat target={target} currentUserId={currentUserId} profiles={profiles} onBack={() => setTarget(null)} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              {/* Search */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 12px', background: '#F8F9FB', borderRadius: 10, padding: '8px 12px', border: '1.5px solid #EAECF0' }}>
                <Search size={13} style={{ color: '#9CA3AF', flexShrink: 0 }} />
                <input placeholder="Cerca conversa o persona…" value={search} onChange={e => setSearch(e.target.value)}
                  style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontSize: 13, color: '#374151', fontFamily: 'inherit' }} />
              </div>

              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                {/* Global chat */}
                {!search && (
                  <button onClick={() => setTarget({ kind: 'global' })} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'background 0.1s', borderBottom: '1px solid #F7F8FA' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F8F9FB')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                    <div style={{ width: 42, height: 42, borderRadius: 13, background: 'linear-gradient(135deg,#1B2B4B,#3B6FD4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(37,64,103,0.25)' }}>
                      <Globe size={18} color="white" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>Chat de l'equip</div>
                      <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 1 }}>Xat global · Tots els membres</div>
                    </div>
                  </button>
                )}

                {/* Conversations + DMs */}
                {filtered.map(item => {
                  if (item._type === 'conv') {
                    const conv = item as ConvPreview & { _type: 'conv' }
                    const otherMember = conv.type === 'direct' ? conv.members.find(m => m.id !== currentUserId) : null
                    return (
                      <button key={conv.id} onClick={() => setTarget({ kind: 'conv', convId: conv.id, name: conv.name, color: conv.color })}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'background 0.1s', borderBottom: '1px solid #F7F8FA' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#F8F9FB')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                        {conv.type === 'group' || !otherMember
                          ? <div style={{ width: 42, height: 42, borderRadius: 13, background: conv.color || '#254067', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: 'white', flexShrink: 0 }}>{conv.name.slice(0, 1)}</div>
                          : <Av name={otherMember.full_name} avatar={otherMember.avatar_url} size={42} />}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 6 }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.type === 'group' ? conv.name : otherMember?.full_name || conv.name}</span>
                            <span style={{ fontSize: 10, color: '#CBD5E1', fontWeight: 500, flexShrink: 0 }}>{conv.lastAt ? fmtTime(conv.lastAt) : ''}</span>
                          </div>
                          <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.lastMsg || (conv.type === 'group' ? `${conv.members.length} membres` : 'Conversa directa')}</div>
                        </div>
                      </button>
                    )
                  } else {
                    const dm = item as DmPreview & { _type: 'dm' }
                    const peer = profileMap[dm.peerId] || { id: dm.peerId, full_name: dm.peerName, avatar_url: dm.peerAvatar }
                    return (
                      <button key={dm.peerId} onClick={() => setTarget({ kind: 'dm', peer })}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'background 0.1s', borderBottom: '1px solid #F7F8FA' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#F8F9FB')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <Av name={dm.peerName} avatar={dm.peerAvatar} size={42} />
                          <span style={{ position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: '50%', background: '#22C55E', border: '2px solid white', display: 'block' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 6 }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dm.peerName}</span>
                            <span style={{ fontSize: 10, color: '#CBD5E1', fontWeight: 500, flexShrink: 0 }}>{fmtTime(dm.lastAt)}</span>
                          </div>
                          <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dm.lastMsg}</div>
                        </div>
                      </button>
                    )
                  }
                })}

                {/* People without DMs when searching */}
                {filteredPeople.map(p => (
                  <button key={p.id} onClick={() => setTarget({ kind: 'dm', peer: p })}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'background 0.1s', borderBottom: '1px solid #F7F8FA' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F8F9FB')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <Av name={p.full_name} avatar={p.avatar_url} size={42} />
                      <span style={{ position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: '50%', background: '#22C55E', border: '2px solid white', display: 'block' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>{p.full_name}</div>
                      <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 1 }}>Comença una conversa</div>
                    </div>
                  </button>
                ))}

                {filtered.length === 0 && filteredPeople.length === 0 && search && (
                  <div style={{ textAlign: 'center', padding: '32px 20px', color: '#9CA3AF', fontSize: 13 }}>Cap resultat per "{search}"</div>
                )}

                {!search && filtered.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '32px 20px', color: '#9CA3AF', fontSize: 13 }}>
                    Encara no tens converses.<br />Cerca un membre per començar.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* FAB button */}
      <button onClick={toggleFab} title="Missatgeria" style={{
        position: 'fixed', bottom: 24, right: 24, width: 52, height: 52, borderRadius: '50%', border: 'none',
        background: open ? 'linear-gradient(135deg,#1B3A6B,#1E4080)' : 'linear-gradient(135deg,#1B4B82,#2563EB)',
        color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200, boxShadow: open ? '0 4px 20px rgba(27,75,130,0.5)' : '0 4px 20px rgba(37,99,235,0.45)',
        transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)', transform: open ? 'scale(0.92)' : 'scale(1)',
      }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.transform = 'scale(1.08)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = open ? 'scale(0.92)' : 'scale(1)' }}>
        {open ? <X size={20} /> : <MessageCircle size={22} strokeWidth={1.8} />}
        {unread > 0 && !open && (
          <span style={{ position: 'absolute', top: 0, right: 0, minWidth: 18, height: 18, background: '#EF4444', borderRadius: 9, fontSize: 10, fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', border: '2px solid white' }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <style>{`
        @keyframes fabPanelIn {
          from { opacity: 0; transform: scale(0.92) translateY(12px); transform-origin: bottom right; }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </>
  )
}
