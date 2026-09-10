'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MessageCircle, Bell, AtSign, CheckSquare, MessageSquare, ExternalLink, Check, Users, Send, ArrowLeft, Plus, Globe, Search, X, Hash } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'
import type { Notification } from '@/types'

interface ChatMsg {
  id: string; user_id: string; content: string; created_at: string
  profiles?: { id: string; full_name: string; avatar_url?: string }
}
interface Profile { id: string; full_name: string; avatar_url?: string }
interface Conversation {
  id: string; type: 'direct' | 'group'; name?: string; avatar_color?: string
  created_by: string; created_at: string; updated_at: string
  members?: Profile[]; lastMsg?: string; lastAt?: string
}
interface ConvMessage {
  id: string; conversation_id: string; user_id: string; content: string; created_at: string
}
interface Props {
  currentUserId: string; notifications: Notification[]
  chatMessages: ChatMsg[]; profiles: Profile[]
}

function fmtRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Ara'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return new Date(iso).toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' })
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' })
}
function openGroupChat() {
  window.dispatchEvent(new CustomEvent('toggle-team-chat', { detail: { open: true } }))
}
const GROUP_COLORS = ['#254067','#7C3AED','#059669','#D97706','#DC2626','#2563EB','#0891B2','#65A30D']

function Av({ p, size = 36 }: { p: Profile; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg,#1B2B4B,#3B6FD4)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.34, fontWeight: 700, flexShrink: 0, overflow: 'hidden', letterSpacing: '-0.5px' }}>
      {p.avatar_url ? <img src={p.avatar_url} alt={p.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : getInitials(p.full_name)}
    </div>
  )
}
function GrAv({ name, color, size = 36 }: { name: string; color?: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.32, background: color || '#254067', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.4, fontWeight: 800, flexShrink: 0 }}>
      {name.slice(0, 1).toUpperCase()}
    </div>
  )
}

// ── Chat panel for conversation_messages table ──
function ConvChat({ conv, currentUserId, profileMap, onBack }: {
  conv: Conversation; currentUserId: string; profileMap: Record<string, Profile>; onBack: () => void
}) {
  const [messages, setMessages] = useState<ConvMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const scrollBottom = useCallback(() => setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50), [])

  useEffect(() => {
    setMessages([]); setError(null)
    supabase.from('conversation_messages').select('*').eq('conversation_id', conv.id).order('created_at', { ascending: true }).limit(100)
      .then(({ data, error: err }) => {
        if (err) { setError(err.code === '42P01' ? 'migration' : err.message); return }
        setMessages(data || []); scrollBottom()
      })
    const ch = supabase.channel(`conv-${conv.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversation_messages', filter: `conversation_id=eq.${conv.id}` }, (payload: any) => {
        setMessages(prev => [...prev, payload.new as ConvMessage]); scrollBottom()
      }).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [conv.id])

  const send = async () => {
    const text = input.trim(); if (!text || sending) return
    setSending(true); setInput('')
    const opt: ConvMessage = { id: `opt-${Date.now()}`, conversation_id: conv.id, user_id: currentUserId, content: text, created_at: new Date().toISOString() }
    setMessages(prev => [...prev, opt]); scrollBottom()
    const { data } = await supabase.from('conversation_messages').insert({ conversation_id: conv.id, user_id: currentUserId, content: text }).select('*').single()
    if (data) setMessages(prev => prev.map(m => m.id === opt.id ? data : m))
    setSending(false)
  }

  const otherMembers = (conv.members || []).filter(m => m.id !== currentUserId)
  const headerName = conv.type === 'group' ? (conv.name || 'Grup') : (otherMembers[0]?.full_name || 'Conversa')

  return <ChatLayout
    onBack={onBack}
    header={conv.type === 'group'
      ? <><GrAv name={conv.name || 'G'} color={conv.avatar_color} size={34} /><div><div className="ch-name">{headerName}</div><div className="ch-sub">{(conv.members || []).length} membres</div></div></>
      : otherMembers[0] ? <><Av p={otherMembers[0]} size={34} /><div><div className="ch-name">{headerName}</div><div className="ch-sub">Conversa privada</div></div></> : null
    }
    messages={messages} error={error} currentUserId={currentUserId} profileMap={profileMap}
    bottomRef={bottomRef} input={input} setInput={setInput} send={send} sending={sending}
    emptyIcon={conv.type === 'group' ? <GrAv name={conv.name || 'G'} color={conv.avatar_color} size={56} /> : otherMembers[0] ? <Av p={otherMembers[0]} size={56} /> : null}
    emptyName={headerName} isMe={(msg: any) => msg.user_id === currentUserId}
    getSender={(msg: any) => profileMap[msg.user_id]} getContent={(msg: any) => msg.content}
    isSameUser={(a: any, b: any) => a.user_id === b.user_id}
  />
}

// ── Chat panel for direct_messages table ──
function DmChat({ peer, currentUserId, profileMap, onBack }: {
  peer: Profile; currentUserId: string; profileMap: Record<string, Profile>; onBack: () => void
}) {
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const scrollBottom = useCallback(() => setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50), [])

  useEffect(() => {
    setMessages([]); setError(null)
    supabase.from('direct_messages').select('*')
      .or(`and(from_user_id.eq.${currentUserId},to_user_id.eq.${peer.id}),and(from_user_id.eq.${peer.id},to_user_id.eq.${currentUserId})`)
      .order('created_at', { ascending: true }).limit(100)
      .then(({ data, error: err }) => {
        if (err) { setError(err.code === '42P01' ? 'migration' : err.message); return }
        setMessages(data || []); scrollBottom()
      })
    const ch = supabase.channel(`dm-${[currentUserId, peer.id].sort().join('-')}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages' }, (payload: any) => {
        const { from_user_id, to_user_id } = payload.new
        if ((from_user_id === peer.id && to_user_id === currentUserId) || (from_user_id === currentUserId && to_user_id === peer.id)) {
          setMessages(prev => [...prev, payload.new]); scrollBottom()
        }
      }).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [peer.id, currentUserId])

  const send = async () => {
    const text = input.trim(); if (!text || sending) return
    setSending(true); setInput('')
    const opt = { id: `opt-${Date.now()}`, from_user_id: currentUserId, to_user_id: peer.id, content: text, created_at: new Date().toISOString() }
    setMessages(prev => [...prev, opt]); scrollBottom()
    const { data } = await supabase.from('direct_messages').insert({ from_user_id: currentUserId, to_user_id: peer.id, content: text }).select('*').single()
    if (data) setMessages(prev => prev.map(m => m.id === opt.id ? data : m))
    setSending(false)
  }

  return <ChatLayout
    onBack={onBack}
    header={<><Av p={peer} size={34} /><div><div className="ch-name">{peer.full_name}</div><div className="ch-sub">Membre de l'equip</div></div></>}
    messages={messages} error={error} currentUserId={currentUserId} profileMap={profileMap}
    bottomRef={bottomRef} input={input} setInput={setInput} send={send} sending={sending}
    emptyIcon={<Av p={peer} size={56} />} emptyName={peer.full_name}
    isMe={(msg: any) => msg.from_user_id === currentUserId}
    getSender={(msg: any) => profileMap[msg.from_user_id] || peer}
    getContent={(msg: any) => msg.content}
    isSameUser={(a: any, b: any) => a.from_user_id === b.from_user_id}
  />
}

// ── Shared chat layout ──
function ChatLayout({ onBack, header, messages, error, currentUserId, profileMap, bottomRef, input, setInput, send, sending, emptyIcon, emptyName, isMe, getSender, getContent, isSameUser }: any) {
  if (error === 'migration') return (
    <div className="chat-panel">
      <div className="ch-header"><button className="ch-back" onClick={onBack}><ArrowLeft size={15} /></button>{header}</div>
      <div className="ch-empty"><MessageCircle size={36} strokeWidth={1.2} style={{ color: '#D1D5DB' }} /><p style={{ fontWeight: 600, color: '#374151' }}>Cal executar la migració</p></div>
    </div>
  )
  return (
    <div className="chat-panel">
      <div className="ch-header">
        <button className="ch-back" onClick={onBack}><ArrowLeft size={15} /></button>
        {header}
      </div>
      <div className="ch-messages">
        {messages.length === 0 && (
          <div className="ch-empty">{emptyIcon}<p className="ch-empty-name">{emptyName}</p><p className="ch-empty-sub">Comença la conversa</p></div>
        )}
        {messages.map((msg: any, i: number) => {
          const mine = isMe(msg)
          const sender = getSender(msg)
          const prev = messages[i - 1]
          const grouped = prev && isSameUser(prev, msg) && new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime() < 180000
          return (
            <div key={msg.id} className={`msg-row${mine ? ' msg-me' : ''}${grouped ? ' msg-grouped' : ''}`}>
              {!mine && (grouped ? <div className="msg-av-gap" /> : <Av p={sender || { id: '', full_name: '?' }} size={30} />)}
              <div className="msg-col">
                {!grouped && !mine && <span className="msg-name">{sender?.full_name || '?'} <span className="msg-ts">{fmtTime(msg.created_at)}</span></span>}
                <div className={`bubble${mine ? ' bubble-me' : ''}`}>{getContent(msg)}{grouped && <span className="bubble-ts">{fmtTime(msg.created_at)}</span>}</div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
      <div className="ch-input-wrap">
        <textarea className="ch-input" placeholder={`Missatge…`} value={input} rows={1}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} />
        <button className="ch-send" onClick={send} disabled={!input.trim() || sending}><Send size={14} /></button>
      </div>
    </div>
  )
}

// ── New conversation modal ──
function NewConvModal({ currentUserId, profiles, onClose, onCreate }: {
  currentUserId: string; profiles: Profile[]; onClose: () => void; onCreate: () => void
}) {
  const [type, setType] = useState<'direct' | 'group'>('direct')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [groupName, setGroupName] = useState('')
  const [groupColor, setGroupColor] = useState(GROUP_COLORS[0])
  const [creating, setCreating] = useState(false)
  const supabase = createClient()

  const others = profiles.filter(p => p.id !== currentUserId)
  const filtered = others.filter(p => p.full_name.toLowerCase().includes(search.toLowerCase()))
  const toggle = (id: string) => setSelected(type === 'direct' ? [id] : prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const canCreate = type === 'direct' ? selected.length === 1 : selected.length >= 1 && groupName.trim()

  const create = async () => {
    if (!canCreate || creating) return
    setCreating(true)
    const { data: conv, error } = await supabase.from('conversations').insert({
      type, name: type === 'group' ? groupName.trim() : null,
      avatar_color: type === 'group' ? groupColor : null, created_by: currentUserId,
    }).select('id').single()
    if (error || !conv) { setCreating(false); return }
    await supabase.from('conversation_members').insert([currentUserId, ...selected].map(uid => ({ conversation_id: conv.id, user_id: uid })))
    setCreating(false); onCreate()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-head">
          <div>
            <div className="modal-title">Nova conversa</div>
            <div className="modal-sub">Tria el tipus de xat</div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={14} /></button>
        </div>
        <div className="modal-type-row">
          {(['direct', 'group'] as const).map(t => (
            <button key={t} onClick={() => { setType(t); setSelected([]) }} className={`modal-type-btn${type === t ? ' active' : ''}`}>
              {t === 'direct' ? <><MessageCircle size={14} />Missatge directe</> : <><Users size={14} />Grup</>}
            </button>
          ))}
        </div>
        {type === 'group' && (
          <div className="modal-group-row">
            <input className="modal-input" placeholder="Nom del grup…" value={groupName} onChange={e => setGroupName(e.target.value)} />
            <div className="modal-colors">
              {GROUP_COLORS.slice(0, 6).map(c => (
                <button key={c} onClick={() => setGroupColor(c)} style={{ width: 22, height: 22, borderRadius: '50%', background: c, border: groupColor === c ? '3px solid #0F172A' : '2.5px solid white', outline: groupColor === c ? `2px solid ${c}` : 'none', cursor: 'pointer', padding: 0, transition: 'all 0.12s' }} />
              ))}
            </div>
          </div>
        )}
        <div className="modal-search-wrap">
          <Search size={13} style={{ color: '#9CA3AF', flexShrink: 0 }} />
          <input className="modal-search" placeholder="Cerca membre…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="modal-list">
          {filtered.map(p => {
            const sel = selected.includes(p.id)
            return (
              <button key={p.id} onClick={() => toggle(p.id)} className={`modal-user${sel ? ' selected' : ''}`}>
                <div style={{ position: 'relative' }}>
                  <Av p={p} size={36} />
                  {sel && <div className="modal-check"><Check size={11} strokeWidth={3} /></div>}
                </div>
                <span className="modal-user-name">{p.full_name}</span>
                {sel && <span className="modal-sel-badge">Seleccionat</span>}
              </button>
            )
          })}
        </div>
        <div className="modal-footer">
          <button className="modal-cancel" onClick={onClose}>Cancel·lar</button>
          <button className="modal-create" onClick={create} disabled={!canCreate || creating}>
            {creating ? 'Creant…' : 'Crear xat'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Active chat union type ──
type ActiveChat = { kind: 'global' } | { kind: 'direct'; peer: Profile } | { kind: 'conv'; conv: Conversation }

// ── Main messaging panel ──
function MessagingPanel({ currentUserId, profiles, profileMap }: {
  currentUserId: string; profiles: Profile[]; profileMap: Record<string, Profile>
}) {
  const [convs, setConvs] = useState<Conversation[]>([])
  const [dmPreviews, setDmPreviews] = useState<Record<string, { content: string; created_at: string }>>({})
  const [active, setActive] = useState<ActiveChat | null>(null)
  const [showNew, setShowNew] = useState(false)
  const supabase = createClient()

  const loadConvs = useCallback(async () => {
    const { data: myConvIds } = await supabase.from('conversation_members').select('conversation_id').eq('user_id', currentUserId)
    if (!myConvIds?.length) { setConvs([]); return }
    const ids = myConvIds.map((r: any) => r.conversation_id)
    const { data: convData } = await supabase.from('conversations').select('*').in('id', ids).order('updated_at', { ascending: false })
    if (!convData) { setConvs([]); return }
    const { data: membersData } = await supabase.from('conversation_members').select('conversation_id, user_id').in('conversation_id', ids)
    const { data: lastMsgs } = await supabase.from('conversation_messages').select('conversation_id, content, created_at').in('conversation_id', ids).order('created_at', { ascending: false }).limit(ids.length * 3)
    const lastMsgMap: Record<string, { content: string; created_at: string }> = {}
    for (const msg of (lastMsgs || [])) {
      if (!lastMsgMap[msg.conversation_id]) lastMsgMap[msg.conversation_id] = { content: msg.content, created_at: msg.created_at }
    }
    setConvs(convData.map((c: any) => ({
      ...c,
      members: (membersData || []).filter((m: any) => m.conversation_id === c.id).map((m: any) => profileMap[m.user_id]).filter(Boolean),
      lastMsg: lastMsgMap[c.id]?.content,
      lastAt: lastMsgMap[c.id]?.created_at,
    })))
  }, [currentUserId, profileMap])

  const loadDmPreviews = useCallback(async () => {
    const { data } = await supabase.from('direct_messages').select('from_user_id, to_user_id, content, created_at')
      .or(`from_user_id.eq.${currentUserId},to_user_id.eq.${currentUserId}`)
      .order('created_at', { ascending: false }).limit(200)
    if (!data) return
    const map: Record<string, { content: string; created_at: string }> = {}
    for (const row of data) {
      const peerId = row.from_user_id === currentUserId ? row.to_user_id : row.from_user_id
      if (!map[peerId]) map[peerId] = { content: row.content, created_at: row.created_at }
    }
    setDmPreviews(map)
  }, [currentUserId])

  useEffect(() => { loadConvs(); loadDmPreviews() }, [loadConvs, loadDmPreviews])
  useEffect(() => {
    const ch = supabase.channel('conv-updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversation_messages' }, () => loadConvs())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages' }, () => loadDmPreviews())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [loadConvs, loadDmPreviews])

  const others = profiles.filter(p => p.id !== currentUserId)
  const sortedPeers = [...others].sort((a, b) => {
    const pa = dmPreviews[a.id], pb = dmPreviews[b.id]
    if (pa && pb) return pb.created_at.localeCompare(pa.created_at)
    if (pa) return -1; if (pb) return 1
    return a.full_name.localeCompare(b.full_name)
  })
  const getConvName = (conv: Conversation) => {
    if (conv.type === 'group') return conv.name || 'Grup'
    const other = (conv.members || []).find(m => m.id !== currentUserId)
    return other?.full_name || 'Conversa'
  }

  const hasActive = !!active

  return (
    <div className="msg-panel">
      {/* ── Sidebar ── */}
      <div className="msg-sidebar">
        <div className="msg-sidebar-head">
          <span className="msg-sidebar-title">Missatgeria</span>
          <button className="msg-new-btn" onClick={() => setShowNew(true)} title="Nova conversa"><Plus size={14} /></button>
        </div>

        {/* Global */}
        <div className="conv-section">
          <button className={`conv-row${active?.kind === 'global' ? ' conv-row--active' : ''}`} onClick={() => setActive({ kind: 'global' })}>
            <div className="conv-row-icon global-icon"><Globe size={16} /></div>
            <div className="conv-row-body">
              <span className="conv-row-name">Chat de l'equip</span>
              <span className="conv-row-preview">Xat global · Tots els membres</span>
            </div>
          </button>
        </div>

        {/* Groups */}
        {convs.filter(c => c.type === 'group').length > 0 && (
          <>
            <div className="conv-label">Grups</div>
            {convs.filter(c => c.type === 'group').map(conv => {
              const isAct = active?.kind === 'conv' && (active as any).conv.id === conv.id
              return (
                <button key={conv.id} className={`conv-row${isAct ? ' conv-row--active' : ''}`} onClick={() => setActive({ kind: 'conv', conv })}>
                  <GrAv name={conv.name || 'G'} color={conv.avatar_color} size={38} />
                  <div className="conv-row-body">
                    <div className="conv-row-top"><span className="conv-row-name">{getConvName(conv)}</span>{conv.lastAt && <span className="conv-row-time">{fmtRelative(conv.lastAt)}</span>}</div>
                    <span className="conv-row-preview">{conv.lastMsg ? conv.lastMsg.slice(0, 42) + (conv.lastMsg.length > 42 ? '…' : '') : `${(conv.members || []).length} membres`}</span>
                  </div>
                </button>
              )
            })}
          </>
        )}

        {/* Direct conversations from conversations table */}
        {convs.filter(c => c.type === 'direct').map(conv => {
          const other = (conv.members || []).find(m => m.id !== currentUserId)
          if (!other) return null
          const isAct = active?.kind === 'conv' && (active as any).conv.id === conv.id
          return (
            <button key={conv.id} className={`conv-row${isAct ? ' conv-row--active' : ''}`} onClick={() => setActive({ kind: 'conv', conv })}>
              <div className="conv-av-wrap"><Av p={other} size={38} /><span className="online-dot" /></div>
              <div className="conv-row-body">
                <div className="conv-row-top"><span className="conv-row-name">{other.full_name}</span>{conv.lastAt && <span className="conv-row-time">{fmtRelative(conv.lastAt)}</span>}</div>
                <span className="conv-row-preview">{conv.lastMsg || 'Conversa directa'}</span>
              </div>
            </button>
          )
        })}

        {/* DMs from direct_messages table */}
        <div className="conv-label">Directes</div>
        {sortedPeers.map(peer => {
          const prev = dmPreviews[peer.id]
          const isAct = active?.kind === 'direct' && (active as any).peer.id === peer.id
          return (
            <button key={peer.id} className={`conv-row${isAct ? ' conv-row--active' : ''}`} onClick={() => setActive({ kind: 'direct', peer })}>
              <div className="conv-av-wrap"><Av p={peer} size={38} /><span className="online-dot" /></div>
              <div className="conv-row-body">
                <div className="conv-row-top">
                  <span className="conv-row-name">{peer.full_name}</span>
                  {prev && <span className="conv-row-time">{fmtRelative(prev.created_at)}</span>}
                </div>
                <span className="conv-row-preview">{prev ? prev.content.slice(0, 42) + (prev.content.length > 42 ? '…' : '') : 'Comença una conversa'}</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* ── Main panel ── */}
      <div className="msg-main">
        {!active && (
          <div className="ch-empty">
            <div style={{ width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg,#1B2B4B,#3B6FD4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(37,64,103,0.25)' }}>
              <MessageCircle size={28} color="white" strokeWidth={1.5} />
            </div>
            <p style={{ fontWeight: 700, fontSize: 16, color: '#0F172A', margin: '12px 0 4px' }}>Els teus missatges</p>
            <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', maxWidth: 260 }}>Selecciona una conversa o crea'n una de nova.</p>
            <button className="ch-start-btn" onClick={() => setShowNew(true)}><Plus size={14} />Nova conversa</button>
          </div>
        )}
        {active?.kind === 'global' && (
          <div className="ch-empty">
            <div style={{ width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg,#1B2B4B,#3B6FD4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(37,64,103,0.25)' }}>
              <Globe size={28} color="white" strokeWidth={1.5} />
            </div>
            <p style={{ fontWeight: 700, fontSize: 16, color: '#0F172A', margin: '12px 0 4px' }}>Chat de l'equip</p>
            <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', maxWidth: 260 }}>El xat global on tots els membres de l'agència estan connectats.</p>
            <button className="ch-start-btn" onClick={openGroupChat}><MessageCircle size={14} />Obrir chat</button>
          </div>
        )}
        {active?.kind === 'direct' && (
          <DmChat peer={(active as any).peer} currentUserId={currentUserId} profileMap={profileMap} onBack={() => setActive(null)} />
        )}
        {active?.kind === 'conv' && (
          <ConvChat conv={(active as any).conv} currentUserId={currentUserId} profileMap={profileMap} onBack={() => setActive(null)} />
        )}
      </div>

      {showNew && <NewConvModal currentUserId={currentUserId} profiles={profiles} onClose={() => setShowNew(false)} onCreate={() => { setShowNew(false); loadConvs() }} />}
    </div>
  )
}

// ── Notification icon map ──
const typeIcon: Record<string, { icon: typeof Bell; bg: string; color: string }> = {
  task_assigned: { icon: CheckSquare, bg: '#EFF6FF', color: '#3B82F6' },
  mention: { icon: AtSign, bg: '#EFF6FF', color: '#2563EB' },
  comment: { icon: MessageSquare, bg: '#FFF7ED', color: '#EA580C' },
  default: { icon: Bell, bg: '#F3F4F6', color: '#6B7280' },
}

// ── Root component ──
export function InboxContent({ currentUserId, notifications, chatMessages, profiles }: Props) {
  const [activeTab, setActiveTab] = useState<'notifs' | 'msgs' | 'chat'>('notifs')
  const [readIds, setReadIds] = useState<Set<string>>(new Set(notifications.filter(n => n.read).map(n => n.id)))
  const profileMap = Object.fromEntries(profiles.map(p => [p.id, p]))

  const markRead = async (id: string) => {
    setReadIds(prev => new Set(prev).add(id))
    await createClient().from('notifications').update({ read: true }).eq('id', id)
  }
  const markAllRead = async () => {
    const ids = notifications.filter(n => !readIds.has(n.id)).map(n => n.id)
    setReadIds(new Set(notifications.map(n => n.id)))
    if (!ids.length) return
    await createClient().from('notifications').update({ read: true }).in('id', ids)
  }
  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length

  return (
    <div className="inbox-root">
      {/* ── Header ── */}
      <div className="inbox-topbar">
        <div className="inbox-tabs">
          {([['notifs', Bell, 'Notificacions'], ['msgs', MessageCircle, 'Missatgeria'], ['chat', Globe, 'Chat global']] as const).map(([tab, Icon, label]) => (
            <button key={tab} className={`itab${activeTab === tab ? ' itab--on' : ''}`} onClick={() => setActiveTab(tab as any)}>
              <Icon size={13} />{label}
              {tab === 'notifs' && unreadCount > 0 && <span className="itab-badge">{unreadCount}</span>}
            </button>
          ))}
        </div>
        {activeTab === 'notifs' && unreadCount > 0 && (
          <button className="mark-all-btn" onClick={markAllRead}><Check size={11} />Tot llegit</button>
        )}
      </div>

      {/* ── Content ── */}
      <div className="inbox-body">
        {activeTab === 'notifs' && (
          <div className="notif-list">
            {notifications.length === 0 && <div className="empty-state"><Bell size={32} strokeWidth={1.2} style={{ color: '#D1D5DB' }} /><p>Cap notificació</p></div>}
            {notifications.map(notif => {
              const isRead = readIds.has(notif.id)
              const { icon: Icon, bg, color } = typeIcon[notif.type] ?? typeIcon.default
              const body = (notif.body ?? '').replace(/@\[([^\]]+)\]\([^)]+\)/g, '@$1')
              return (
                <div key={notif.id} className={`notif-row${!isRead ? ' notif-row--unread' : ''}`} onClick={() => markRead(notif.id)}>
                  <div className="notif-icon" style={{ background: bg }}>
                    <Icon size={14} color={color} />
                    {!isRead && <span className="notif-dot" />}
                  </div>
                  <div className="notif-body">
                    <div className="notif-title">{notif.title}</div>
                    {body && <div className="notif-sub">{body}</div>}
                  </div>
                  <div className="notif-meta">
                    <span className="notif-time">{fmtRelative(notif.created_at)}</span>
                    {notif.link && <a href={notif.link} className="notif-link" target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}><ExternalLink size={11} /></a>}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {activeTab === 'msgs' && (
          <MessagingPanel currentUserId={currentUserId} profiles={profiles} profileMap={profileMap} />
        )}

        {activeTab === 'chat' && (
          <div className="notif-list">
            <div className="chat-cta-bar">
              <span>Missatges recents de l'equip</span>
              <button className="chat-open-btn" onClick={openGroupChat}><MessageCircle size={13} />Obrir chat</button>
            </div>
            {chatMessages.length === 0 && <div className="empty-state"><MessageCircle size={32} strokeWidth={1.2} style={{ color: '#D1D5DB' }} /><p>Cap missatge recent</p></div>}
            {chatMessages.map(msg => {
              const sender = msg.profiles
              const name = sender?.full_name || 'Usuari'
              const body = (msg.content ?? '').replace(/@\[([^\]]+)\]\([^)]+\)/g, '@$1')
              return (
                <div key={msg.id} className="notif-row notif-row--clickable" onClick={openGroupChat}>
                  <div className="notif-av">
                    {sender?.avatar_url ? <img src={sender.avatar_url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : getInitials(name)}
                  </div>
                  <div className="notif-body">
                    <div className="notif-title">{name}</div>
                    {body && <div className="notif-sub">{body.length > 80 ? body.slice(0, 80) + '…' : body}</div>}
                  </div>
                  <div className="notif-meta"><span className="notif-time">{fmtRelative(msg.created_at)}</span></div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <style jsx global>{`
        /* ── Root layout ── */
        .inbox-root { display: flex; flex-direction: column; height: calc(100vh - 60px); padding: 24px 28px 32px; gap: 16px; }
        .inbox-topbar { display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; gap: 12px; }
        .inbox-tabs { display: flex; gap: 2px; background: #F1F3F5; padding: 3px; border-radius: 12px; }
        .itab { display: flex; align-items: center; gap: 6px; padding: 7px 16px; border-radius: 9px; border: none; background: none; cursor: pointer; font-size: 13px; font-weight: 500; color: #6B7280; font-family: inherit; transition: all 0.15s; white-space: nowrap; }
        .itab--on { background: white; color: #111827; font-weight: 600; box-shadow: 0 1px 6px rgba(0,0,0,0.1); }
        .itab-badge { min-width: 18px; height: 18px; background: #EF4444; border-radius: 9px; font-size: 10px; font-weight: 700; color: white; display: inline-flex; align-items: center; justify-content: center; padding: 0 4px; }
        .mark-all-btn { display: flex; align-items: center; gap: 5px; padding: 7px 13px; border-radius: 9px; border: 1.5px solid #E5E7EB; background: white; cursor: pointer; font-size: 12px; font-weight: 500; color: #6B7280; font-family: inherit; transition: all 0.15s; white-space: nowrap; }
        .mark-all-btn:hover { border-color: #9CA3AF; color: #374151; }
        .inbox-body { flex: 1; min-height: 0; background: white; border: 1px solid #E8EAED; border-radius: 16px; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 2px 12px rgba(0,0,0,0.04); }

        /* ── Notifications ── */
        .notif-list { display: flex; flex-direction: column; overflow-y: auto; flex: 1; }
        .notif-row { display: flex; align-items: flex-start; gap: 12px; padding: 14px 18px; border-bottom: 1px solid #F3F4F6; cursor: pointer; transition: background 0.1s; }
        .notif-row:last-child { border-bottom: none; }
        .notif-row:hover { background: #FAFBFC; }
        .notif-row--unread { background: #F0F6FF; }
        .notif-row--unread:hover { background: #E8F0FE; }
        .notif-row--clickable { cursor: pointer; }
        .notif-icon { position: relative; width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .notif-dot { position: absolute; top: -2px; right: -2px; width: 8px; height: 8px; background: #EF4444; border-radius: 50%; border: 2px solid white; }
        .notif-av { width: 36px; height: 36px; border-radius: 50%; background: #254067; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: white; flex-shrink: 0; overflow: hidden; }
        .notif-body { flex: 1; min-width: 0; }
        .notif-title { font-size: 13.5px; font-weight: 600; color: #111827; margin-bottom: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .notif-sub { font-size: 12.5px; color: #6B7280; line-height: 1.4; }
        .notif-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
        .notif-time { font-size: 11px; color: #B0B8C8; white-space: nowrap; }
        .notif-link { color: #9CA3AF; display: flex; align-items: center; transition: color 0.1s; }
        .notif-link:hover { color: #254067; }
        .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 56px 24px; color: #9CA3AF; font-size: 14px; flex: 1; }
        .chat-cta-bar { display: flex; align-items: center; justify-content: space-between; padding: 11px 18px; border-bottom: 1px solid #F3F4F6; background: #FAFBFC; font-size: 12.5px; color: #6B7280; }
        .chat-open-btn { display: flex; align-items: center; gap: 6px; padding: 6px 13px; border-radius: 8px; border: none; background: #254067; color: white; cursor: pointer; font-size: 12px; font-weight: 600; font-family: inherit; }

        /* ── Messaging panel ── */
        .msg-panel { display: flex; flex: 1; min-height: 0; width: 100%; }
        .msg-sidebar { width: 280px; min-width: 280px; max-width: 280px; border-right: 1px solid #EAECF0; overflow-y: auto; overflow-x: hidden; display: flex; flex-direction: column; background: #F8F9FB; flex-shrink: 0; }
        .msg-sidebar-head { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px 10px; border-bottom: 1px solid #EAECF0; background: white; position: sticky; top: 0; z-index: 2; flex-shrink: 0; }
        .msg-sidebar-title { font-size: 13px; font-weight: 700; color: #0F172A; letter-spacing: -0.2px; }
        .msg-new-btn { width: 28px; height: 28px; border-radius: 8px; border: none; background: linear-gradient(135deg,#1B2B4B,#3B6FD4); color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.15s; box-shadow: 0 2px 8px rgba(37,64,103,0.3); }
        .msg-new-btn:hover { transform: scale(1.06); box-shadow: 0 4px 12px rgba(37,64,103,0.4); }
        .conv-section { display: flex; flex-direction: column; padding: 8px 8px 0; }
        .conv-label { padding: 12px 16px 4px; font-size: 10px; font-weight: 800; color: #A8B5C8; text-transform: uppercase; letter-spacing: 0.12em; flex-shrink: 0; }
        .conv-row { display: flex; flex-direction: row; align-items: center; gap: 10px; width: 100%; padding: 9px 12px; margin: 1px 8px; width: calc(100% - 16px); border: none; background: transparent; cursor: pointer; text-align: left; border-radius: 10px; border-left: 3px solid transparent; transition: all 0.14s; box-sizing: border-box; flex-shrink: 0; }
        .conv-row:hover { background: white; border-left-color: #CBD5E1; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
        .conv-row--active { background: white !important; border-left-color: #254067 !important; box-shadow: 0 2px 8px rgba(0,0,0,0.08) !important; }
        .conv-row--active .conv-row-name { color: #254067 !important; }
        .conv-row-icon { width: 38px; height: 38px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .global-icon { background: linear-gradient(135deg,#1B2B4B,#3B6FD4); color: white; }
        .conv-av-wrap { position: relative; flex-shrink: 0; }
        .online-dot { position: absolute; bottom: 1px; right: 1px; width: 9px; height: 9px; border-radius: 50%; background: #22C55E; border: 2px solid #F8F9FB; display: block; }
        .conv-row--active .online-dot { border-color: white; }
        .conv-row-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
        .conv-row-top { display: flex; align-items: baseline; justify-content: space-between; gap: 6px; }
        .conv-row-name { font-size: 13px; font-weight: 600; color: #0F172A; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; min-width: 0; transition: color 0.14s; }
        .conv-row:hover .conv-row-name { color: #1B2B4B; }
        .conv-row-preview { font-size: 11.5px; color: #94A3B8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .conv-row-time { font-size: 10px; color: #CBD5E1; white-space: nowrap; flex-shrink: 0; font-weight: 500; }
        .msg-main { flex: 1; min-width: 0; display: flex; flex-direction: column; background: white; }

        /* ── Chat panel ── */
        .chat-panel { display: flex; flex-direction: column; height: 100%; }
        .ch-header { display: flex; align-items: center; gap: 10px; padding: 12px 18px; border-bottom: 1px solid #F0F2F5; flex-shrink: 0; background: white; }
        .ch-back { background: #F3F4F6; border: none; cursor: pointer; color: #6B7280; display: flex; align-items: center; padding: 7px; border-radius: 9px; transition: background 0.1s; flex-shrink: 0; }
        .ch-back:hover { background: #E5E7EB; color: #374151; }
        .ch-name { font-size: 14px; font-weight: 700; color: #0F172A; }
        .ch-sub { font-size: 11.5px; color: #94A3B8; margin-top: 1px; }
        .ch-messages { flex: 1; overflow-y: auto; padding: 16px 20px; display: flex; flex-direction: column; gap: 1px; }
        .ch-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; padding: 40px 24px; }
        .ch-empty-name { font-size: 16px; font-weight: 700; color: #0F172A; margin: 12px 0 4px; }
        .ch-empty-sub { font-size: 13px; color: #94A3B8; }
        .ch-start-btn { display: flex; align-items: center; gap: 7px; margin-top: 16px; padding: 10px 22px; border-radius: 11px; border: none; background: linear-gradient(135deg,#1B2B4B,#3B6FD4); color: white; font-size: 13.5px; font-weight: 600; cursor: pointer; font-family: inherit; box-shadow: 0 4px 14px rgba(37,64,103,0.28); transition: all 0.15s; }
        .ch-start-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(37,64,103,0.36); }

        /* ── Messages ── */
        .msg-row { display: flex; align-items: flex-end; gap: 8px; margin-top: 8px; }
        .msg-row.msg-grouped { margin-top: 2px; }
        .msg-me { flex-direction: row-reverse; }
        .msg-av-gap { width: 30px; flex-shrink: 0; }
        .msg-col { display: flex; flex-direction: column; max-width: 65%; }
        .msg-me .msg-col { align-items: flex-end; }
        .msg-name { font-size: 11px; font-weight: 600; color: #6B7280; margin-bottom: 3px; display: flex; align-items: baseline; gap: 6px; }
        .msg-ts { font-size: 10px; color: #B0B8C8; font-weight: 400; }
        .bubble { background: #F1F3F7; color: #111827; padding: 9px 13px; border-radius: 16px 16px 16px 4px; font-size: 13.5px; line-height: 1.48; word-break: break-word; position: relative; }
        .bubble-me { background: linear-gradient(135deg,#1B2B4B,#3167C8); color: white; border-radius: 16px 16px 4px 16px; }
        .bubble-ts { font-size: 9.5px; opacity: 0.45; margin-left: 8px; white-space: nowrap; vertical-align: bottom; }
        .ch-input-wrap { display: flex; gap: 8px; padding: 12px 16px 16px; border-top: 1px solid #F0F2F5; align-items: flex-end; flex-shrink: 0; background: white; }
        .ch-input { flex: 1; resize: none; border: 1.5px solid #E5E7EB; border-radius: 12px; padding: 10px 14px; font-size: 13.5px; font-family: inherit; outline: none; line-height: 1.45; max-height: 120px; overflow-y: auto; background: #FAFBFC; transition: border-color 0.15s, box-shadow 0.15s; color: #111827; }
        .ch-input:focus { border-color: #254067; box-shadow: 0 0 0 3px rgba(37,64,103,0.08); background: white; }
        .ch-send { width: 40px; height: 40px; border-radius: 12px; border: none; background: linear-gradient(135deg,#1B2B4B,#3167C8); color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.18s cubic-bezier(0.34,1.56,0.64,1); box-shadow: 0 3px 10px rgba(37,64,103,0.3); }
        .ch-send:disabled { background: #E5E7EB; color: #9CA3AF; box-shadow: none; cursor: default; }
        .ch-send:not(:disabled):hover { transform: translateY(-2px) scale(1.07); box-shadow: 0 6px 18px rgba(37,64,103,0.4); }
        .ch-send:not(:disabled):active { transform: scale(0.94); }

        /* ── Modal ── */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.38); display: flex; align-items: center; justify-content: center; z-index: 500; backdrop-filter: blur(5px); }
        .modal-box { background: white; border-radius: 20px; width: 420px; max-width: 92vw; box-shadow: 0 24px 72px rgba(0,0,0,0.18); overflow: hidden; }
        .modal-head { display: flex; align-items: flex-start; justify-content: space-between; padding: 22px 24px 16px; border-bottom: 1px solid #F0F2F5; }
        .modal-title { font-size: 16px; font-weight: 700; color: #0F172A; }
        .modal-sub { font-size: 12px; color: #9CA3AF; margin-top: 2px; }
        .modal-close { background: #F3F4F6; border: none; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #6B7280; transition: background 0.1s; }
        .modal-close:hover { background: #E5E7EB; }
        .modal-type-row { display: flex; gap: 8px; padding: 16px 24px 0; }
        .modal-type-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px; padding: 10px 0; border-radius: 11px; border: 2px solid #E5E7EB; background: white; color: #6B7280; font-size: 13px; font-weight: 500; cursor: pointer; font-family: inherit; transition: all 0.15s; }
        .modal-type-btn.active { border-color: #254067; background: #F0F4FF; color: #254067; font-weight: 700; }
        .modal-group-row { display: flex; gap: 10px; align-items: center; padding: 12px 24px 0; }
        .modal-input { flex: 1; padding: 9px 12px; border-radius: 9px; border: 1.5px solid #E5E7EB; font-size: 13.5px; outline: none; font-family: inherit; color: #111827; transition: border-color 0.15s; }
        .modal-input:focus { border-color: #254067; }
        .modal-colors { display: flex; gap: 5px; }
        .modal-search-wrap { display: flex; align-items: center; gap: 8px; margin: 12px 24px 0; background: #F8F9FB; border-radius: 10px; padding: 9px 13px; border: 1.5px solid #EAECF0; }
        .modal-search { flex: 1; border: none; background: none; outline: none; font-size: 13.5px; color: #374151; font-family: inherit; }
        .modal-list { max-height: 220px; overflow-y: auto; padding: 8px 24px; display: flex; flex-direction: column; gap: 2px; }
        .modal-user { display: flex; align-items: center; gap: 10px; width: 100%; padding: 8px 10px; border-radius: 11px; border: 1.5px solid transparent; background: none; cursor: pointer; text-align: left; transition: all 0.14s; }
        .modal-user:hover { background: #F8F9FB; border-color: #E5E7EB; }
        .modal-user.selected { background: #EEF2FF; border-color: #C7D4F5; }
        .modal-check { position: absolute; inset: 0; border-radius: 50%; background: rgba(37,64,103,0.35); display: flex; align-items: center; justify-content: center; color: white; }
        .modal-user-name { font-size: 13.5px; font-weight: 600; color: #111827; flex: 1; }
        .modal-user.selected .modal-user-name { color: #254067; }
        .modal-sel-badge { font-size: 10.5px; font-weight: 600; color: #254067; background: #E0E8FF; padding: 2px 7px; border-radius: 5px; white-space: nowrap; }
        .modal-footer { display: flex; gap: 8px; justify-content: flex-end; padding: 14px 24px 20px; border-top: 1px solid #F0F2F5; }
        .modal-cancel { padding: 9px 18px; border-radius: 10px; border: 1.5px solid #E5E7EB; background: white; color: #6B7280; font-size: 13px; font-weight: 500; cursor: pointer; font-family: inherit; transition: all 0.15s; }
        .modal-cancel:hover { border-color: #9CA3AF; color: #374151; }
        .modal-create { padding: 9px 22px; border-radius: 10px; border: none; background: linear-gradient(135deg,#1B2B4B,#3167C8); color: white; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; box-shadow: 0 3px 10px rgba(37,64,103,0.28); transition: all 0.15s; }
        .modal-create:disabled { background: #E5E7EB; color: #9CA3AF; box-shadow: none; cursor: default; }
        .modal-create:not(:disabled):hover { transform: translateY(-1px); box-shadow: 0 5px 16px rgba(37,64,103,0.38); }
      `}</style>
    </div>
  )
}
