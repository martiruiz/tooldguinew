'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { AGENTS, CAPES, type Agent, type AgentStatus } from '@/lib/ai/agents-data'

// ── Simulated activity feed ───────────────────────────────────────────────────
const ACTIVITY_POOL = [
  { agent: '03_qa', msg: 'PASS — Post ASOBAL J3 validat' },
  { agent: '40_contingut', msg: 'Caption generat per @asobal (3 variants)' },
  { agent: '00_orchestrator', msg: 'Tasca assignada a Contingut + QA' },
  { agent: '61_distribution', msg: 'Programat: Dijous 20:00 → Instagram ASOBAL' },
  { agent: '24_fact_check', msg: 'VERIFIED — Marcador J3 PSG 32:29 GRA' },
  { agent: '23_social_listening', msg: 'Tendència detectada: #HandballEuropa' },
  { agent: '41_calendari', msg: 'Calendari BIWPA Novembre generat (18 posts)' },
  { agent: '13_account', msg: 'Reunió ASOBAL preparada per dimarts 10h' },
  { agent: '54_thumbnail', msg: 'Spec thumbnail: "J3 · Resum Complet" CTR opt.' },
  { agent: '21_analytics', msg: 'ASOBAL IG: +12.3% engagement setmana' },
]

type ActivityItem = { id: number; time: string; agent: string; agentName: string; agentEmoji: string; msg: string; color: string }

function useActivityFeed() {
  const [items, setItems] = useState<ActivityItem[]>([])
  const counter = useRef(0)

  useEffect(() => {
    const add = () => {
      const pool = ACTIVITY_POOL[Math.floor(Math.random() * ACTIVITY_POOL.length)]
      const agentData = AGENTS.find(a => a.id === pool.agent)
      const capa = CAPES.find(c => c.id === (agentData?.capa ?? 0))
      setItems(prev => [{
        id: counter.current++,
        time: new Date().toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        agent: pool.agent,
        agentName: agentData?.name ?? pool.agent,
        agentEmoji: agentData?.emoji ?? '🤖',
        msg: pool.msg,
        color: capa?.color ?? '#4A5A78',
      }, ...prev.slice(0, 29)])
    }
    add()
    const t = setInterval(add, 3500 + Math.random() * 3000)
    return () => clearInterval(t)
  }, [])

  return items
}

// ── Agent card ────────────────────────────────────────────────────────────────
function AgentCard({
  agent, color, selected, active, onClick,
}: {
  agent: Agent; color: string; selected: boolean; active: boolean; onClick: () => void
}) {
  const statusColor = agent.status === 'actiu' ? '#00C97A' : agent.status === 'restringit' ? '#F59E0B' : '#3D4E6A'

  return (
    <button onClick={onClick} style={{
      position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
      padding: '10px 11px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
      width: 110, minHeight: 88, flexShrink: 0,
      background: selected ? `${color}20` : active ? `${color}0C` : 'rgba(255,255,255,0.03)',
      border: `1px solid ${selected ? color + '60' : active ? color + '28' : 'rgba(255,255,255,0.06)'}`,
      boxShadow: selected ? `0 0 18px ${color}30, 0 0 0 1px ${color}30` : 'none',
      transition: 'all .15s',
      fontFamily: "'Manrope','Inter',system-ui,sans-serif",
    }}>
      {/* Status dot */}
      <span style={{
        position: 'absolute', top: 7, right: 7,
        width: 5, height: 5, borderRadius: '50%',
        background: statusColor,
        boxShadow: agent.status === 'actiu' ? `0 0 5px ${statusColor}` : 'none',
      }} />
      {active && agent.status === 'actiu' && (
        <span style={{
          position: 'absolute', top: 7, right: 7,
          width: 5, height: 5, borderRadius: '50%',
          border: `1px solid ${statusColor}`,
          animation: 'ping 2s ease-in-out infinite',
        }} />
      )}

      <span style={{ fontSize: 20, marginBottom: 5, lineHeight: 1 }}>{agent.emoji}</span>
      <span style={{
        fontSize: 10.5, fontWeight: 700, color: selected ? color : '#C8D5E8',
        letterSpacing: '-0.01em', lineHeight: 1.3, marginBottom: 3,
      }}>{agent.name}</span>
      <span style={{
        fontSize: 9, color: '#4A5A78', fontWeight: 600,
        letterSpacing: '0.04em', lineHeight: 1.3,
      }}>{agent.code}</span>
    </button>
  )
}

// ── Chat panel ────────────────────────────────────────────────────────────────
function ChatPanel({ agent, color, onClose }: { agent: Agent; color: string; onClose: () => void }) {
  const [chat, setChat] = useState<{ role: 'user' | 'agent'; text: string }[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chat])

  useEffect(() => {
    fetch(`/api/conversations?agentId=${agent.id}`)
      .then(r => r.json())
      .then(d => {
        if (d.messages?.length) {
          setChat(d.messages.map((m: { role: string; content: string }) => ({
            role: m.role === 'user' ? 'user' : 'agent',
            text: m.content,
          })))
        }
        setHistoryLoaded(true)
      })
      .catch(() => setHistoryLoaded(true))
  }, [agent.id])

  const send = async () => {
    if (!input.trim() || loading) return
    const msg = input.trim(); setInput('')
    setChat(h => [...h, { role: 'user', text: msg }])
    setLoading(true)
    fetch('/api/conversations', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId: agent.id, role: 'user', content: msg }),
    })
    try {
      const res = await fetch('/api/agent', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: agent.id, message: msg }),
      })
      const data = await res.json()
      const reply = data.response ?? data.error ?? 'Error de resposta'
      setChat(h => [...h, { role: 'agent', text: reply }])
      fetch('/api/conversations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: agent.id, role: 'assistant', content: reply }),
      })
    } catch {
      setChat(h => [...h, { role: 'agent', text: 'Error de connexió.' }])
    } finally { setLoading(false) }
  }

  const clearHistory = () => {
    if (!confirm('Esborrar tot l\'historial d\'aquesta conversa?')) return
    fetch(`/api/conversations?agentId=${agent.id}`, { method: 'DELETE' }).then(() => setChat([]))
  }

  const statusLabel = agent.status === 'actiu' ? 'ONLINE' : agent.status === 'restringit' ? 'RESTRICTED' : 'PENDING'
  const statusColor = agent.status === 'actiu' ? '#00C97A' : agent.status === 'restringit' ? '#F59E0B' : '#3D4E6A'

  return (
    <div style={{
      width: 360, background: '#0A1020',
      borderLeft: '1px solid rgba(255,255,255,0.07)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      animation: 'panelIn .2s ease',
    }}>
      {/* Header */}
      <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#080E1C' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, marginBottom: 10 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 10,
            background: `${color}18`, border: `1.5px solid ${color}35`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, flexShrink: 0,
          }}>{agent.emoji}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#E2E8F4', marginBottom: 2 }}>{agent.name}</div>
            <div style={{ fontSize: 9.5, color: '#3A4A62', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
              CAPA {agent.capa} · {agent.capaName} · {agent.code}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {chat.length > 0 && (
              <button onClick={clearHistory} title="Esborrar historial" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3A4A62', width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>🗑</button>
            )}
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4B5A72', width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>✕</button>
          </div>
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '3px 9px', borderRadius: 20,
          fontSize: 9, fontWeight: 800, letterSpacing: '0.08em',
          background: `${statusColor}18`, border: `1px solid ${statusColor}35`, color: statusColor,
        }}>
          <span style={{ width: 4.5, height: 4.5, borderRadius: '50%', background: statusColor, animation: agent.status === 'actiu' ? 'blink 2s infinite' : 'none' }} />
          {statusLabel}
        </span>
      </div>

      {/* Description */}
      <div style={{ padding: '10px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <p style={{ margin: 0, fontSize: 12.5, color: '#7A8BA8', lineHeight: 1.65 }}>{agent.desc}</p>
      </div>

      {/* Trigger */}
      <div style={{ padding: '8px 18px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontSize: 8.5, fontWeight: 700, color: '#2A3A52', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Quan s'activa</div>
        <p style={{ margin: 0, fontSize: 11.5, color: '#4A5A72', lineHeight: 1.55 }}>{agent.trigger}</p>
      </div>

      {/* Chat */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 7, scrollbarWidth: 'none' }}>
        {!historyLoaded && (
          <div style={{ textAlign: 'center', color: '#3A4A62', fontSize: 11, padding: '16px' }}>Carregant historial...</div>
        )}
        {historyLoaded && chat.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px 12px' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{agent.emoji}</div>
            <div style={{ fontSize: 12, color: '#3A4A62', lineHeight: 1.7 }}>
              Parla directament amb {agent.name}.<br />
              <span style={{ color: color, fontSize: 11 }}>Escriu en català o castellà.</span>
            </div>
          </div>
        )}
        {chat.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '88%', padding: '8px 12px', borderRadius: 11,
            fontSize: 12.5, lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            background: m.role === 'user' ? color : '#111D30',
            color: m.role === 'user' ? 'white' : '#C8D5E8',
            border: m.role === 'agent' ? '1px solid rgba(255,255,255,0.07)' : 'none',
          }}>{m.text}</div>
        ))}
        {loading && (
          <div style={{
            alignSelf: 'flex-start', padding: '8px 12px', borderRadius: 11,
            fontSize: 12.5, background: '#111D30', border: '1px solid rgba(255,255,255,0.07)',
            color: color, display: 'flex', gap: 4, alignItems: 'center',
          }}>
            <span style={{ animation: 'blink 1s infinite' }}>●</span>
            <span style={{ animationDelay: '.3s', animation: 'blink 1s infinite' }}>●</span>
            <span style={{ animationDelay: '.6s', animation: 'blink 1s infinite' }}>●</span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '8px 12px 14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder={`Escriu a ${agent.name}...`}
            style={{
              flex: 1, background: '#111D30',
              border: `1px solid ${input ? color + '40' : 'rgba(255,255,255,0.09)'}`,
              borderRadius: 8, padding: '8px 11px', fontSize: 12.5,
              outline: 'none', fontFamily: 'inherit', color: '#E2E8F4',
              transition: 'border-color .15s',
            }}
          />
          <button onClick={send} disabled={loading || !input.trim()} style={{
            background: color, border: 'none', borderRadius: 8,
            padding: '8px 13px', color: 'white', cursor: 'pointer',
            fontSize: 14, fontWeight: 700,
            opacity: loading || !input.trim() ? 0.3 : 1,
            flexShrink: 0, transition: 'opacity .15s',
          }}>→</button>
        </div>
      </div>
    </div>
  )
}

// ── Layer row ─────────────────────────────────────────────────────────────────
function LayerRow({ capa, agents, selectedId, onSelect, activeAgentIds }: {
  capa: typeof CAPES[number]
  agents: Agent[]
  selectedId: string | null
  onSelect: (a: Agent) => void
  activeAgentIds: Set<string>
}) {
  return (
    <div style={{ display: 'flex', gap: 0, alignItems: 'stretch', minHeight: 116 }}>
      {/* Layer label */}
      <div style={{
        width: 126, flexShrink: 0,
        borderRight: `2px solid ${capa.color}30`,
        padding: '12px 16px',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 5,
        background: `${capa.color}06`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: capa.color, boxShadow: `0 0 6px ${capa.color}` }} />
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', color: capa.color, textTransform: 'uppercase' }}>CAPA {capa.id}</span>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#C8D5E8', lineHeight: 1.2 }}>{capa.name}</div>
        <div style={{ fontSize: 9, color: '#3A4A62', fontWeight: 600 }}>{agents.length} agents</div>
      </div>

      {/* Agent cards */}
      <div style={{ flex: 1, padding: '12px 14px', display: 'flex', flexWrap: 'wrap', gap: 7, alignContent: 'flex-start' }}>
        {agents.map(agent => (
          <AgentCard
            key={agent.id}
            agent={agent}
            color={capa.color}
            selected={selectedId === agent.id}
            active={activeAgentIds.has(agent.id)}
            onClick={() => onSelect(agent)}
          />
        ))}
      </div>
    </div>
  )
}

// ── Activity ticker ───────────────────────────────────────────────────────────
function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <div style={{
      height: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0,
      scrollbarWidth: 'none',
    }}>
      {items.map(item => (
        <div key={item.id} style={{
          display: 'flex', alignItems: 'baseline', gap: 8,
          padding: '5px 16px', borderBottom: '1px solid rgba(255,255,255,0.03)',
          animation: 'fadeIn .3s ease',
        }}>
          <span style={{ fontSize: 9, color: '#2A3A52', fontFamily: '"SF Mono","Fira Code",monospace', flexShrink: 0, width: 60 }}>{item.time}</span>
          <span style={{ fontSize: 11, flexShrink: 0 }}>{item.agentEmoji}</span>
          <span style={{ fontSize: 9.5, fontWeight: 700, color: item.color, flexShrink: 0 }}>{item.agentName}</span>
          <span style={{ fontSize: 11, color: '#6A7A95', lineHeight: 1.4, flex: 1 }}>{item.msg}</span>
        </div>
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AgentsPage() {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [activeAgentIds, setActiveAgentIds] = useState<Set<string>>(new Set(['00_orchestrator', '03_qa', '40_contingut']))
  const activityFeed = useActivityFeed()

  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap'
    document.head.appendChild(link)
    return () => { try { document.head.removeChild(link) } catch {} }
  }, [])

  // Rotate active agents for visual effect
  useEffect(() => {
    const t = setInterval(() => {
      const candidates = AGENTS.filter(a => a.status === 'actiu')
      const count = 3 + Math.floor(Math.random() * 4)
      const shuffled = [...candidates].sort(() => Math.random() - 0.5).slice(0, count)
      setActiveAgentIds(new Set(shuffled.map(a => a.id)))
    }, 5000)
    return () => clearInterval(t)
  }, [])

  const handleSelect = useCallback((agent: Agent) => {
    setSelectedAgent(prev => prev?.id === agent.id ? null : agent)
  }, [])

  const activeCount = AGENTS.filter(a => a.status === 'actiu').length
  const selectedColor = selectedAgent ? (CAPES.find(c => c.id === selectedAgent.capa)?.color ?? '#4A5A78') : '#4A5A78'

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden',
      fontFamily: "'Manrope','Inter',system-ui,sans-serif",
      background: '#060C18', color: '#E2E8F4',
    }}>
      <style>{`
        @keyframes panelIn { from { transform: translateX(12px); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
        @keyframes ping { 0%{transform:scale(1);opacity:0.5} 100%{transform:scale(2.8);opacity:0} }
        @keyframes online { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      {/* ── Status bar */}
      <div style={{
        height: 44, flexShrink: 0,
        background: 'rgba(6,12,24,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(37,99,235,0.15)',
        padding: '0 20px', display: 'flex', alignItems: 'center', gap: 0,
        zIndex: 20,
      }}>
        <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '0.14em', color: '#E2E8F4', fontFamily: '"SF Mono","Fira Code",monospace', marginRight: 20 }}>GUINEW AI OS</span>
        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)', marginRight: 20 }} />
        <div style={{ display: 'flex', gap: 20, fontSize: 9.5, fontFamily: '"SF Mono","Fira Code",monospace', letterSpacing: '0.06em' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 5.5, height: 5.5, borderRadius: '50%', background: '#2563EB', boxShadow: '0 0 6px #2563EB' }} />
            <span style={{ color: '#8A9BB8' }}>{AGENTS.length} AGENTS</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 5.5, height: 5.5, borderRadius: '50%', background: '#00C97A', boxShadow: '0 0 6px #00C97A', animation: 'online 2.4s infinite' }} />
            <span style={{ color: '#8A9BB8' }}>{activeCount} ACTIUS</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 5.5, height: 5.5, borderRadius: '50%', background: '#F59E0B' }} />
            <span style={{ color: '#8A9BB8' }}>1 RESTRINGIT</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 5.5, height: 5.5, borderRadius: '50%', background: '#8B5CF6', boxShadow: '0 0 6px #8B5CF6', animation: 'online 3s infinite' }} />
            <span style={{ color: '#8A9BB8' }}>SISTEMA ONLINE</span>
          </span>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.07em', padding: '3px 10px', borderRadius: 20, background: 'rgba(0,201,122,0.1)', border: '1px solid rgba(0,201,122,0.25)', color: '#00C97A', fontFamily: '"SF Mono",monospace' }}>7 CAPES · 35 AGENTS</span>
        </div>
      </div>

      {/* ── Main content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Left: 7 layers */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

          {/* Grid background */}
          <div style={{
            position: 'fixed', inset: '44px 0 0 0',
            backgroundImage: 'radial-gradient(circle,rgba(37,99,235,0.05) 1px,transparent 1px)',
            backgroundSize: '28px 28px', pointerEvents: 'none', zIndex: 0,
          }} />

          {/* Layer rows */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            {CAPES.map((capa, ci) => {
              const layerAgents = AGENTS.filter(a => a.capa === capa.id)
              return (
                <div key={capa.id}>
                  <LayerRow
                    capa={capa}
                    agents={layerAgents}
                    selectedId={selectedAgent?.id ?? null}
                    onSelect={handleSelect}
                    activeAgentIds={activeAgentIds}
                  />
                  {ci < CAPES.length - 1 && (
                    <div style={{
                      height: 1, margin: '0 0',
                      background: `linear-gradient(to right, ${capa.color}20, ${CAPES[ci + 1].color}20)`,
                    }} />
                  )}
                </div>
              )
            })}
          </div>

          {/* Activity log */}
          <div style={{
            borderTop: '1px solid rgba(37,99,235,0.2)',
            background: 'rgba(6,12,24,0.97)',
            flexShrink: 0, zIndex: 2,
          }}>
            <div style={{
              padding: '8px 16px 6px',
              display: 'flex', alignItems: 'center', gap: 8,
              borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#00C97A', boxShadow: '0 0 5px #00C97A', animation: 'online 2s infinite' }} />
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', color: '#3A4A62', textTransform: 'uppercase' }}>Activitat del sistema</span>
              <span style={{ fontSize: 9, color: '#2A3A52', fontFamily: '"SF Mono",monospace', marginLeft: 'auto' }}>LIVE</span>
            </div>
            <ActivityFeed items={activityFeed} />
          </div>
        </div>

        {/* Right: chat panel */}
        {selectedAgent && (
          <ChatPanel
            agent={selectedAgent}
            color={selectedColor}
            onClose={() => setSelectedAgent(null)}
          />
        )}
      </div>
    </div>
  )
}
