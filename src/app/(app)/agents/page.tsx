'use client'

import { useState, useEffect, useRef } from 'react'

// ── Node positions in SVG canvas (900×560) ──────────────────────────────────
const NODE_POS: Record<string, [number, number]> = {
  central:    [450, 265],
  produccio:  [450,  85],
  clients:    [168, 202],
  finances:   [732, 202],
  vendes:     [248, 450],
  estrategia: [652, 450],
}

// ── Hex polygon helper ────────────────────────────────────────────────────────
function hexPts(cx: number, cy: number, r: number, flat = false): string {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (i * 60 + (flat ? 0 : 30)) * Math.PI / 180
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`
  }).join(' ')
}

// ── Data types ────────────────────────────────────────────────────────────────
type DeptAgent = {
  id: string; name: string; icon: string; desc: string
  tools: string[]; trigger: string; chat?: boolean
  jacket?: string; status: string; accent?: string
}
type Dept = {
  id: string; name: string; emoji: string
  dot: string; glowColor: string
  agents: DeptAgent[]
  fase: 1 | 2
  runsToday?: number; lastActivity?: string
}

const DEPTS: Dept[] = [
  {
    id: 'central', name: 'Orchestrator', emoji: '⬡',
    dot: '#2563EB', glowColor: '#3B82F6',
    agents: [{ id: 'orchestrator', name: 'Orchestrator', icon: '🧠', status: 'actiu', accent: '#2563EB', chat: true,
      desc: 'Cervell del sistema. Rep peticions en llengua natural, carrega context, decideix quins agents activar i en quin ordre.',
      tools: ['get_client_context','create_content_draft','update_content_status','create_task','create_ai_insight','create_recommendation'],
      trigger: 'Rep totes les peticions. Punt d\'entrada únic del sistema.' }],
    fase: 1, runsToday: 3, lastActivity: '4m ago',
  },
  {
    id: 'produccio', name: 'Producció', emoji: '✦',
    dot: '#059669', glowColor: '#10B981',
    agents: [
      { id: 'contingut', name: 'Contingut', icon: '✍️', status: 'actiu', accent: '#059669', desc: 'Genera copy adaptat al client.', tools: ['create_content_draft','get_content_history'], trigger: 'Cal generar copy o captions per a RRSS.' },
      { id: 'cm', name: 'Community Mgr', icon: '💬', status: 'actiu', accent: '#059669', desc: 'Classifica comentaris i redacta respostes. Mai publica sol.', tools: ['create_content_draft'], trigger: 'Hi ha comentaris a gestionar.' },
      { id: 'calendari', name: 'Calendari', icon: '📅', status: 'actiu', accent: '#059669', desc: 'Planifica el calendari editorial mensual.', tools: ['create_content_draft','get_content_history'], trigger: 'Cal planificar un calendari editorial.' },
      { id: 'qa', name: 'QA', icon: '✅', status: 'actiu', accent: '#059669', desc: 'Revisor obligatori. Pot bloquejar el flux.', tools: ['update_content_status','create_ai_insight'], trigger: 'Sempre, obligatòriament, abans de lliurar contingut.' },
    ],
    fase: 1, runsToday: 8, lastActivity: '2m ago',
  },
  {
    id: 'clients', name: 'Clients', emoji: '◈',
    dot: '#0284C7', glowColor: '#0EA5E9',
    agents: [
      { id: 'pm', name: 'Project Manager', icon: '📋', status: 'actiu', accent: '#0284C7', desc: 'Crea i actualitza tasques. Detecta blocadors.', tools: ['create_task'], trigger: 'La tasca implica un projecte o deadline.' },
      { id: 'reporting', name: 'Reporting', icon: '📊', status: 'actiu', accent: '#0284C7', desc: 'Genera informes mensuals per client.', tools: ['get_metric_reports'], trigger: 'Es demana un informe de resultats.' },
    ],
    fase: 1, runsToday: 2, lastActivity: '18m ago',
  },
  {
    id: 'finances', name: 'Finances', emoji: '◆',
    dot: '#D97706', glowColor: '#F59E0B',
    agents: [
      { id: 'finances', name: 'Finances', icon: '💰', status: 'restringit', accent: '#D97706', desc: 'Accés restringit. Controla marges i facturació.', tools: ['get_finance_summary'], trigger: 'Consulta financera — només per a Martí.' },
    ],
    fase: 1, runsToday: 1, lastActivity: '1h ago',
  },
  {
    id: 'vendes', name: 'Vendes', emoji: '◇',
    dot: '#7C3AED', glowColor: '#8B5CF6',
    agents: [
      { id: 'comercial', name: 'Comercial', icon: '🤝', status: 'actiu', accent: '#7C3AED', desc: 'Gestiona oportunitats comercials i proposa propostes. Mai envia propostes sense aprovació de Martí.', tools: ['create_opportunity','create_draft_proposta'], trigger: 'Nova oportunitat o seguiment comercial.' },
      { id: 'research', name: 'Research', icon: '🔍', status: 'actiu', accent: '#7C3AED', desc: 'Analitza competència i detecta tendències de mercat.', tools: ['create_strategy_note'], trigger: 'Cal investigar el mercat o competència.' },
    ],
    fase: 1, runsToday: 0, lastActivity: '—',
  },
  {
    id: 'estrategia', name: 'Estratègia', emoji: '◉',
    dot: '#0891B2', glowColor: '#06B6D4',
    agents: [
      { id: 'seo', name: 'SEO', icon: '🔎', status: 'actiu', accent: '#0891B2', desc: 'Genera contingut optimitzat per cercadors i analitza keywords.', tools: ['get_client_context','create_content_draft','create_recommendation'], trigger: 'Cal contingut SEO o anàlisi de keywords.' },
      { id: 'paid', name: 'Paid Media', icon: '📣', status: 'actiu', accent: '#0891B2', desc: 'Planifica i optimitza campanyes Meta/Google. No modifica campanyes directament.', tools: ['get_client_context','get_metric_reports','create_campaign_brief','create_recommendation'], trigger: 'Cal gestionar campanyes de pagament o ROAS.' },
      { id: 'analytics', name: 'Analytics', icon: '📈', status: 'actiu', accent: '#0891B2', desc: 'Anàlisi profunda de dades, patrons i correlacions.', tools: ['get_client_context','get_metric_reports','get_content_history','create_ai_insight','create_strategy_note'], trigger: 'Cal anàlisi de tendències o comparatives.' },
      { id: 'estrategia_ag', name: 'Estratègia', icon: '🎯', status: 'actiu', accent: '#0891B2', desc: 'Defineix estratègia trimestral, pilars i TOV. No canvia TOV sense aprovació de Martí.', tools: ['get_client_context','get_metric_reports','create_strategy_note','create_recommendation','create_task'], trigger: 'Cal estratègia trimestral o planificació.' },
    ],
    fase: 1, runsToday: 0, lastActivity: '—',
  },
]

// ── Network connection ────────────────────────────────────────────────────────
function NetConnection({ deptId, x1, y1, x2, y2, color, active, delay, dur }: {
  deptId: string; x1: number; y1: number; x2: number; y2: number
  color: string; active: boolean; delay: string; dur: string
}) {
  const ocx = 450, ocy = 265
  const cpx1 = x1 + (ocx - x1) * 0.45
  const cpy1 = y1 + (ocy - y1) * 0.45
  const cpx2 = x2 + (ocx - x2) * 0.45
  const cpy2 = y2 + (ocy - y2) * 0.45
  const d = `M${x1},${y1} C${cpx1},${cpy1} ${cpx2},${cpy2} ${x2},${y2}`
  const pid = `nc_${deptId}`
  return (
    <g opacity={active ? 1 : 0.15}>
      <defs><path id={pid} d={d} /></defs>
      <path d={d} fill="none" stroke={color} strokeWidth="8" opacity="0.05" />
      <path d={d} fill="none" stroke={color} strokeWidth="1.2" strokeDasharray="6,6" opacity={active ? 0.4 : 0.2} />
      {active && <>
        <circle r="4.5" fill={color} opacity="0">
          <animateMotion dur={dur} begin={delay} repeatCount="indefinite"><mpath href={`#${pid}`}/></animateMotion>
          <animate attributeName="opacity" values="0;0.7;0.7;0" keyTimes="0;0.08;0.92;1" dur={dur} begin={delay} repeatCount="indefinite"/>
        </circle>
        <circle r="2" fill="white" opacity="0">
          <animateMotion dur={dur} begin={delay} repeatCount="indefinite"><mpath href={`#${pid}`}/></animateMotion>
          <animate attributeName="opacity" values="0;0.95;0.95;0" keyTimes="0;0.08;0.92;1" dur={dur} begin={delay} repeatCount="indefinite"/>
        </circle>
      </>}
    </g>
  )
}

// ── Department node ───────────────────────────────────────────────────────────
function DeptNode({ dept, selected, onClick }: { dept: Dept; selected: boolean; onClick: () => void }) {
  const [cx, cy] = NODE_POS[dept.id] ?? [450, 265]
  const isCenter = dept.id === 'central'
  const r = isCenter ? 62 : 50
  const ri = r * 0.68
  const active = dept.fase === 1
  const { dot, glowColor } = dept
  const activeAgents = dept.agents.filter(a => a.status === 'actiu').length

  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      {/* Outer pulse rings */}
      {active && [1, 2].map(i => (
        <polygon key={i} points={hexPts(cx, cy, r + 4)} fill="none" stroke={glowColor} strokeWidth="1">
          <animate attributeName="points" dur="0.01s" fill="freeze" to={hexPts(cx, cy, r + 4)} />
          <animate attributeName="r" dur={`${2.8 + i * 0.6}s`} begin={`${(i-1) * 1.1}s`} repeatCount="indefinite"
            values={`${r+4};${r+28}`} />
          <animate attributeName="opacity" dur={`${2.8 + i * 0.6}s`} begin={`${(i-1) * 1.1}s`} repeatCount="indefinite"
            values="0.45;0" />
        </polygon>
      ))}

      {/* Hover/select glow */}
      {selected && (
        <polygon points={hexPts(cx, cy, r + 2)} fill="none" stroke={dot} strokeWidth="2.5" opacity="0.6" />
      )}

      {/* Outer hex */}
      <polygon points={hexPts(cx, cy, r)} fill={`${dot}18`} />
      <polygon points={hexPts(cx, cy, r)} fill="none" stroke={dot} strokeWidth={selected ? 2 : 1.5} opacity={active ? (selected ? 1 : 0.6) : 0.3} />

      {/* Inner hex */}
      <polygon points={hexPts(cx, cy, ri)} fill={`${dot}14`} />
      <polygon points={hexPts(cx, cy, ri)} fill="none" stroke={dot} strokeWidth="0.7" opacity={active ? 0.35 : 0.15} />

      {/* Center glow spot */}
      {active && <circle cx={cx} cy={cy} r={r * 0.35} fill={dot} opacity="0.07" />}

      {/* Emoji / symbol */}
      <text x={cx} y={cy + (isCenter ? 5 : 4)} textAnchor="middle"
        fontSize={isCenter ? 24 : 20} fill={active ? glowColor : '#4B5A72'}
        style={{ userSelect: 'none', filter: active ? `drop-shadow(0 0 6px ${glowColor}90)` : 'none' }}>
        {dept.emoji}
      </text>

      {/* Name */}
      <text x={cx} y={cy + r + 17} textAnchor="middle"
        fontSize={isCenter ? 11 : 10} fontWeight="700"
        fill={active ? '#E2E8F4' : '#4B5A72'}
        letterSpacing="0.06em" style={{ userSelect: 'none', textTransform: 'uppercase' }}>
        {dept.name.toUpperCase()}
      </text>

      {/* Agent process indicators */}
      <g>
        {dept.agents.map((a, i) => {
          const n = dept.agents.length
          const xoff = (i - (n - 1) / 2) * 9
          const isOn = a.status === 'actiu'
          return (
            <g key={a.id}>
              <circle cx={cx + xoff} cy={cy + r + 28} r={3.2}
                fill={isOn ? '#00C97A' : '#2A3650'}
                stroke={isOn ? '#00C97A40' : 'none'} strokeWidth="1"
              />
              {isOn && (
                <circle cx={cx + xoff} cy={cy + r + 28} r={3.2} fill="none" stroke="#00C97A">
                  <animate attributeName="r" values="3.2;6;3.2" dur={`${1.8 + i * 0.3}s`} repeatCount="indefinite" begin={`${i * 0.2}s`} />
                  <animate attributeName="opacity" values="0.5;0;0.5" dur={`${1.8 + i * 0.3}s`} repeatCount="indefinite" begin={`${i * 0.2}s`} />
                </circle>
              )}
            </g>
          )
        })}
      </g>

      {/* Fase 2 badge */}
      {!active && (
        <text x={cx} y={cy + r + 42} textAnchor="middle" fontSize="8" fontWeight="600"
          fill="#3A4A62" letterSpacing="0.08em" style={{ userSelect: 'none' }}>
          FASE 2 · EN CONSTRUCCIÓ
        </text>
      )}

      {/* Active run indicator */}
      {active && (dept.runsToday ?? 0) > 0 && (
        <circle cx={cx + r - 5} cy={cy - r + 5} r={5} fill="#00C97A">
          <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
        </circle>
      )}
    </g>
  )
}

// ── Agent panel ───────────────────────────────────────────────────────────────
function AgentPanel({ agent, dept, onClose }: { agent: DeptAgent; dept: Dept; onClose: () => void }) {
  const [chat, setChat] = useState<{ role: 'user' | 'agent'; text: string }[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chat])

  // Carregar historial en obrir el panell
  useEffect(() => {
    if (!agent.chat) return
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
  }, [agent.id, agent.chat])

  const send = async () => {
    if (!input.trim() || loading) return
    const msg = input.trim(); setInput('')
    setChat(h => [...h, { role: 'user', text: msg }])
    setLoading(true)
    // Desar missatge de l'usuari
    fetch('/api/conversations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agentId: agent.id, role: 'user', content: msg }) })
    try {
      const res = await fetch('/api/orchestrator', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: msg }) })
      const data = await res.json()
      const reply = data.response ?? data.error
      setChat(h => [...h, { role: 'agent', text: reply }])
      // Desar resposta de l'agent
      fetch('/api/conversations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agentId: agent.id, role: 'assistant', content: reply }) })
    } catch {
      setChat(h => [...h, { role: 'agent', text: 'Error de connexió.' }])
    }
    finally { setLoading(false) }
  }

  const clearHistory = () => {
    if (!confirm('Esborrar tot l\'historial d\'aquesta conversa?')) return
    fetch(`/api/conversations?agentId=${agent.id}`, { method: 'DELETE' })
      .then(() => setChat([]))
  }

  const ac = agent.accent ?? dept.dot
  const statusColor = agent.status === 'actiu' ? '#00C97A' : agent.status === 'restringit' ? '#F59E0B' : '#3D4E6A'
  const statusLabel = agent.status === 'actiu' ? 'ONLINE' : agent.status === 'restringit' ? 'RESTRICTED' : 'PENDING · FASE 2'

  return (
    <div style={{ width: 360, background: '#0D1525', borderLeft: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'panelIn .22s ease' }}>
      <style>{`
        @keyframes panelIn{from{transform:translateX(12px);opacity:0}to{transform:translateX(0);opacity:1}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}
      `}</style>

      <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0A1020' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: `${ac}20`, border: `1.5px solid ${ac}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{agent.icon}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#E2E8F4', letterSpacing: '-0.01em', marginBottom: 2 }}>{agent.name}</div>
            <div style={{ fontSize: 10, color: '#4B5A72', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{dept.name} · FASE {dept.fase}</div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {agent.chat && chat.length > 0 && (
              <button onClick={clearHistory} title="Esborrar historial" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3A4A62', width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>🗑</button>
            )}
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4B5A72', width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>✕</button>
          </div>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', background: `${statusColor}18`, border: `1px solid ${statusColor}35`, color: statusColor }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusColor, animation: agent.status === 'actiu' ? 'blink 2s infinite' : 'none' }} />
          {statusLabel}
        </span>
      </div>

      <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <p style={{ margin: 0, fontSize: 13, color: '#8A9BB8', lineHeight: 1.65 }}>{agent.desc}</p>
      </div>

      <div style={{ padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: '#3A4A62', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>Quan s'activa</div>
        <p style={{ margin: 0, fontSize: 12, color: '#5A6A85', lineHeight: 1.55 }}>{agent.trigger}</p>
      </div>

      {agent.tools.length > 0 && (
        <div style={{ padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#3A4A62', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 7 }}>Tools</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {agent.tools.map(t => (
              <span key={t} style={{ padding: '2px 7px', borderRadius: 5, fontSize: 10, background: `${ac}14`, border: `1px solid ${ac}28`, color: ac, fontFamily: '"SF Mono","Fira Code",monospace' }}>{t}</span>
            ))}
          </div>
        </div>
      )}

      {agent.chat ? (
        <>
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8, scrollbarWidth: 'none' }}>
            {!historyLoaded && (
              <div style={{ textAlign: 'center', color: '#3A4A62', fontSize: 11, padding: '20px 16px' }}>Carregant historial...</div>
            )}
            {historyLoaded && chat.length === 0 && (
              <div style={{ textAlign: 'center', color: '#3A4A62', fontSize: 12, padding: '24px 16px', lineHeight: 1.7 }}>
                Escriu una tasca en llengua natural.<br />
                <span style={{ color: ac, fontSize: 11 }}>"Crea un post d'ASOBAL per la J3"</span>
              </div>
            )}
            {chat.map((m, i) => (
              <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '88%', padding: '9px 13px', borderRadius: 12, fontSize: 12.5, lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: m.role === 'user' ? ac : '#131E30', color: m.role === 'user' ? 'white' : '#C8D5E8', border: m.role === 'agent' ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>{m.text}</div>
            ))}
            {loading && <div style={{ alignSelf: 'flex-start', padding: '9px 13px', borderRadius: 12, fontSize: 12.5, background: '#131E30', border: '1px solid rgba(255,255,255,0.07)', color: ac }}>Processant...</div>}
            <div ref={endRef} />
          </div>
          <div style={{ padding: '10px 14px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', gap: 7 }}>
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} placeholder="Escriu un missatge..." style={{ flex: 1, background: '#131E30', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, padding: '9px 12px', fontSize: 12.5, outline: 'none', fontFamily: 'inherit', color: '#E2E8F4' }} />
              <button onClick={send} disabled={loading || !input.trim()} style={{ background: ac, border: 'none', borderRadius: 9, padding: '9px 14px', color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 700, opacity: loading || !input.trim() ? 0.35 : 1, flexShrink: 0 }}>→</button>
            </div>
          </div>
        </>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          {agent.status === 'pendent' ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: `${ac}18`, border: `1px solid ${ac}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, margin: '0 auto 12px' }}>{agent.icon}</div>
              <div style={{ fontSize: 13, color: '#5A6A85', lineHeight: 1.6 }}>Procés en construcció.<br /><span style={{ color: '#3A4A62', fontSize: 11 }}>S'activarà a la Fase {dept.fase}.</span></div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#5A6A85', fontSize: 12, lineHeight: 1.7 }}>Procés activat per l'Orchestrator.</div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AgentsPage() {
  const [selectedDept, setSelectedDept] = useState<string | null>(null)
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [liveStats, setLiveStats] = useState<Record<string, { runsToday: number; lastActivity: string }>>({})

  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap'
    document.head.appendChild(link)
    return () => { try { document.head.removeChild(link) } catch {} }
  }, [])

  const activeDept = DEPTS.find(d => d.id === selectedDept) ?? null
  const activeAgent = activeDept?.agents.find(a => a.id === selectedAgent) ?? null
  const activeCount = DEPTS.reduce((s, d) => s + d.agents.filter(a => a.status === 'actiu').length, 0)
  const totalRuns = DEPTS.reduce((s, d) => s + (d.runsToday ?? 0), 0)

  useEffect(() => {
    const go = async () => {
      try {
        const res = await fetch('/api/agents/stats')
        if (!res.ok) return
        const data = await res.json()
        const stats: Record<string, { runsToday: number; lastActivity: string }> = {}
        for (const dept of DEPTS) {
          let runs = dept.runsToday ?? 0
          let last = dept.lastActivity ?? '—'
          for (const agent of dept.agents) {
            const r = data.runsToday?.[agent.id]
            const l = data.lastActivity?.[agent.id]
            if (r != null) runs += r
            if (l) last = formatAgo(l)
          }
          stats[dept.id] = { runsToday: runs, lastActivity: last }
        }
        setLiveStats(stats)
      } catch {}
    }
    go()
    const t = setInterval(go, 30_000)
    return () => clearInterval(t)
  }, [])

  function formatAgo(iso: string) {
    const d = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
    if (d < 60) return `${d}s ago`
    if (d < 3600) return `${Math.floor(d/60)}m ago`
    if (d < 86400) return `${Math.floor(d/3600)}h ago`
    return `${Math.floor(d/86400)}d ago`
  }

  function selectDept(id: string) {
    if (selectedDept === id) { setSelectedDept(null); setSelectedAgent(null) }
    else { setSelectedDept(id); setSelectedAgent(DEPTS.find(d => d.id === id)?.agents[0]?.id ?? null) }
  }

  // Card position: to the right of each node
  function cardOffset(id: string): [number, number] {
    const offsets: Record<string, [number, number]> = {
      central:    [14, 0],
      produccio:  [10, -10],
      clients:    [-175, 15],
      finances:   [8, 15],
      vendes:     [-178, 10],
      estrategia: [8, 10],
    }
    return offsets[id] ?? [10, 0]
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: "'Manrope','Inter',system-ui,sans-serif", position: 'relative', background: '#060C18' }}>

      {/* Background: radial grid */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 60% at 50% 50%,#0C1E3A 0%,#060C18 100%)', zIndex: 0 }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle,rgba(37,99,235,0.08) 1px,transparent 1px)', backgroundSize: '32px 32px', zIndex: 0 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(6,12,24,0.4) 0%,transparent 30%,transparent 70%,rgba(6,12,24,0.6) 100%)', zIndex: 0 }} />

      {/* Status bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: activeAgent ? 360 : 0, zIndex: 20,
        background: 'rgba(6,12,24,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(37,99,235,0.15)',
        padding: '0 24px', height: 44, display: 'flex', alignItems: 'center', gap: 0,
      }}>
        <style>{`@keyframes online{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.14em', color: '#E2E8F4', fontFamily: '"SF Mono","Fira Code",monospace', marginRight: 22 }}>GUINEW AI OS</span>
        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)', marginRight: 22 }} />
        <div style={{ display: 'flex', gap: 24, fontSize: 10, fontFamily: '"SF Mono","Fira Code",monospace', letterSpacing: '0.06em' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#4A5A78' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563EB', boxShadow: '0 0 7px #2563EB' }} />
            <span style={{ color: '#8A9BB8' }}>{activeCount} PROCESSOS ACTIUS</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#4A5A78' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669', boxShadow: '0 0 7px #059669' }} />
            <span style={{ color: '#8A9BB8' }}>{totalRuns} RUNS AVUI</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#4A5A78' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 7px #10B981', animation: 'online 2.4s infinite' }} />
            <span style={{ color: '#8A9BB8' }}>SISTEMA OPERATIU</span>
          </span>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.07em', padding: '3px 10px', borderRadius: 20, background: 'rgba(0,201,122,0.1)', border: '1px solid rgba(0,201,122,0.25)', color: '#00C97A', fontFamily: '"SF Mono",monospace' }}>13 AGENTS ACTIUS</span>
        </div>
      </div>

      {/* Network graph */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', marginTop: 44, zIndex: 1 }}>
        <svg width="100%" height="100%" viewBox="0 0 900 560" preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
          <defs>
            <radialGradient id="centerGlow" cx="50%" cy="47%" r="35%">
              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
            </radialGradient>
            <filter id="glow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feComposite in="b" in2="SourceGraphic" operator="over" />
            </filter>
          </defs>

          {/* Ambient center glow */}
          <ellipse cx="450" cy="265" rx="260" ry="200" fill="url(#centerGlow)" />

          {/* Connections */}
          {DEPTS.filter(d => d.id !== 'central').map((d, i) => {
            const [cx, cy] = NODE_POS[d.id]
            const [ox, oy] = NODE_POS.central
            return (
              <NetConnection key={d.id} deptId={d.id}
                x1={ox} y1={oy} x2={cx} y2={cy}
                color={d.dot} active={d.fase === 1}
                delay={`${i * 0.65}s`} dur={`${3.4 + i * 0.35}s`}
              />
            )
          })}

          {/* Nodes */}
          {DEPTS.map(dept => (
            <DeptNode key={dept.id} dept={dept}
              selected={selectedDept === dept.id}
              onClick={() => dept.fase === 1 && selectDept(dept.id)}
            />
          ))}
        </svg>

        {/* HTML info cards overlaid near each node */}
        {DEPTS.map(dept => {
          const [cx, cy] = NODE_POS[dept.id] ?? [450, 265]
          const [ox, oy] = cardOffset(dept.id)
          const isSel = selectedDept === dept.id
          const isPending = dept.fase > 1
          const stat = liveStats[dept.id]
          const runs = stat?.runsToday ?? dept.runsToday ?? 0
          const last = stat?.lastActivity ?? dept.lastActivity ?? '—'
          // Convert SVG coords to % for positioning
          const svgW = 900, svgH = 560
          const left = `calc(${((cx + 55 + ox) / svgW) * 100}%)`
          const top = `calc(44px + ${((cy + oy) / svgH) * 100}%)`

          return (
            <div key={dept.id} style={{
              position: 'absolute', left, top,
              background: isSel ? 'rgba(10,20,40,0.96)' : 'rgba(8,16,32,0.78)',
              backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
              border: `1px solid ${isSel ? dept.dot + '55' : 'rgba(37,99,235,0.18)'}`,
              borderRadius: 11, padding: '11px 15px',
              boxShadow: isSel ? `0 8px 40px ${dept.dot}22,0 0 0 1px ${dept.dot}20` : '0 4px 20px rgba(0,0,0,0.4)',
              minWidth: 142, maxWidth: 175,
              opacity: isPending ? 0.5 : 1,
              cursor: isPending ? 'default' : 'pointer',
              transition: 'border-color .15s,box-shadow .15s',
              zIndex: 10, transform: 'translateY(-50%)',
            }} onClick={() => !isPending && selectDept(dept.id)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: isPending ? '#2A3650' : dept.dot, boxShadow: isPending ? 'none' : `0 0 5px ${dept.dot}` }} />
                <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', color: '#8A9BB8', flex: 1 }}>{dept.name.toUpperCase()}</span>
                {!isPending && runs > 0 && <span style={{ fontSize: 8, color: '#10B981', fontWeight: 800 }}>●</span>}
              </div>
              <div style={{ display: 'flex', gap: 3, alignItems: 'baseline', marginBottom: 5 }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: isPending ? '#2A3650' : '#E2E8F4', lineHeight: 1, letterSpacing: '-0.02em' }}>{dept.agents.length}</span>
                <span style={{ fontSize: 9, color: '#3A4A62', fontWeight: 700, letterSpacing: '0.04em' }}>{dept.agents.length === 1 ? 'PROCÉS' : 'PROCESSOS'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[['RUNS AVUI', isPending ? '—' : String(runs)], ['ÚLTIMA ACT.', isPending ? '—' : last]].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 9, color: '#3A4A62' }}>
                    <span style={{ letterSpacing: '0.04em' }}>{l}</span>
                    <span style={{ fontWeight: 700, color: isPending ? '#2A3650' : '#6A7A95', fontFamily: '"SF Mono","Fira Code",monospace' }}>{v}</span>
                  </div>
                ))}
              </div>
              {isSel && !isPending && (
                <div style={{ marginTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {dept.agents.map(a => (
                    <button key={a.id} onClick={e => { e.stopPropagation(); setSelectedAgent(a.id) }} style={{
                      background: selectedAgent === a.id ? `${dept.dot}18` : 'none',
                      border: `1px solid ${selectedAgent === a.id ? dept.dot + '40' : 'transparent'}`,
                      borderRadius: 6, padding: '4px 7px', cursor: 'pointer',
                      fontSize: 11, fontWeight: selectedAgent === a.id ? 700 : 500,
                      color: selectedAgent === a.id ? dept.dot : '#5A6A85',
                      textAlign: 'left', display: 'flex', alignItems: 'center', gap: 5,
                      fontFamily: "'Manrope','Inter',system-ui,sans-serif",
                    }}>
                      <span>{a.icon}</span><span style={{ fontSize: 10 }}>{a.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Agent panel */}
      {activeAgent && activeDept && (
        <AgentPanel agent={activeAgent} dept={activeDept} onClose={() => { setSelectedDept(null); setSelectedAgent(null) }} />
      )}
    </div>
  )
}
