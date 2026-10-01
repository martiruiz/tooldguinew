'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useJarvisVoice, type JarvisVoiceState } from '@/hooks/useJarvisVoice'
import {
  Database, Zap, Mail, BarChart2, ClipboardList,
  Users, Target, DollarSign, PenLine, Mic, MicOff,
  Square, Edit3, Eye, X, Send, Play, Pause, Loader2,
  Copy, Check, Maximize2, Trash2, AlertCircle,
  LayoutList, LayoutGrid, ChevronRight,
} from 'lucide-react'
import { BekaCore } from '@/components/agents/BekaCore'
import VoiceSelector from '@/components/agents/VoiceSelector'

// ── Types ──────────────────────────────────────────────────────────────────────

type AgentStatus = 'idle' | 'running' | 'done' | 'error' | 'paused' | 'awaiting_approval'

interface AgentDef {
  id: string
  num: string
  name: string
  desc: string
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>
  color: string
  defaultPrompt: string
  keywords: string[]
}

interface AgentRun {
  status: AgentStatus
  output: string
  runId?: string
  startedAt?: string
  taskDesc?: string
  usage?: { input: number; output: number }
}

interface AgentSchedule {
  id: string
  agent_id: string
  task: string
  frequency: 'daily' | 'weekly'
  weekday?: number
  hour: number
  minute: number
  enabled: boolean
  last_run?: string
}

interface ConvMessage { role: 'user' | 'assistant'; content: string; created_at?: string }
interface ChatMsg { role: 'user' | 'agent'; text: string; agentId?: string; ts: string }

// ── Agent definitions ──────────────────────────────────────────────────────────

const AGENTS: AgentDef[] = [
  { id: 'orchestrator', num: '00', name: 'BEKA', desc: 'IA central', icon: Zap, color: '#00D4FF',
    defaultPrompt: 'Ets BEKA, la intel·ligència central de Guinew. Coordines tots els agents i prens decisions estratègiques. Respon en català, concis i directe. Usuari: Martí Ruiz, CEO de Guinew.',
    keywords: ['beka', 'orquestr', 'coordin', 'central', 'gestiona'] },
  { id: 'memory', num: '01', name: 'Memòria', desc: 'Gestió de context', icon: Database, color: '#22C55E',
    defaultPrompt: 'Ets l\'agent de Memòria de Guinew. Guardes i recuperes context, historial i informació rellevant de l\'agència. Respon en català.',
    keywords: ['record', 'memòr', 'histor', 'guarda', 'context'] },
  { id: 'automation', num: '02', name: 'Automatitz.', desc: 'Tasques auto', icon: Zap, color: '#F59E0B',
    defaultPrompt: 'Ets l\'agent d\'Automatització de Guinew. Automatitzes processos, workflows i seqüències repetitives. Respon en català.',
    keywords: ['automat', 'workflow', 'programa', 'execut', 'seqüència'] },
  { id: 'email', num: '03', name: 'Email', desc: 'Correu', icon: Mail, color: '#EC4899',
    defaultPrompt: 'Ets l\'agent d\'Email de Guinew. Redactes, organitzes i gestiones el correu electrònic. Escriu emails professionals en català (o castellà/anglès si cal).',
    keywords: ['email', 'correu', 'missatg', 'envia', 'redact'] },
  { id: 'analytics', num: '04', name: 'Analytics', desc: 'Dades i mètriques', icon: BarChart2, color: '#8B5CF6',
    defaultPrompt: 'Ets l\'agent d\'Analytics de Guinew. Analitzes dades, generes informes i interpretes mètriques de xarxes socials i campanyes. Respon en català.',
    keywords: ['analíti', 'dada', 'mètric', 'informe', 'estadístic', 'resultats'] },
  { id: 'tasks', num: '05', name: 'Tasques', desc: 'Gestió de tasques', icon: ClipboardList, color: '#06B6D4',
    defaultPrompt: 'Ets l\'agent de Tasques de Guinew. Gestiones tasques, deadlines i seguiment de projectes. Respon en català, amb llistes clares.',
    keywords: ['tasca', 'to-do', 'pendent', 'deadline', 'entrega', 'projecte'] },
  { id: 'crm', num: '06', name: 'CRM', desc: 'Clients', icon: Users, color: '#10B981',
    defaultPrompt: 'Ets l\'agent de CRM de Guinew. Gestiones relacions amb clients, oportunitats comercials i pipeline de vendes. Respon en català.',
    keywords: ['client', 'crm', 'oportunitat', 'comercial', 'pipeline', 'venda'] },
  { id: 'strategy', num: '07', name: 'Estratègia', desc: 'Planificació', icon: Target, color: '#F97316',
    defaultPrompt: 'Ets l\'agent d\'Estratègia de Guinew. Defineixis estratègies digitals, plans de contingut i roadmaps per als clients. Respon en català.',
    keywords: ['estratèg', 'planif', 'objectiu', 'meta', 'priorit', 'pla'] },
  { id: 'finances', num: '08', name: 'Finances', desc: 'Comptabilitat', icon: DollarSign, color: '#EAB308',
    defaultPrompt: 'Ets l\'agent de Finances de Guinew. Gestiones facturació, pressupostos i comptabilitat. IMPORTANT: Respon NOMÉS a Martí Ruiz (superadmin). No comparteixis dades financeres amb altres usuaris.',
    keywords: ['financer', 'factur', 'pressupost', 'pagament', 'ingrés', 'cost'] },
  { id: 'content', num: '09', name: 'Contingut', desc: 'Creació de text', icon: PenLine, color: '#A78BFA',
    defaultPrompt: 'Ets l\'agent de Contingut de Guinew. Crees posts, copies, guions i textos per a xarxes socials i campanyes. Respon en català, tret que el client sigui en castellà.',
    keywords: ['contingut', 'redacta', 'escriu', 'text', 'post', 'copy', 'guió'] },
]

// ── Config ─────────────────────────────────────────────────────────────────────

const STATE_COLORS: Record<JarvisVoiceState, string> = {
  idle: '#2A3A52', listening: '#00D4FF', thinking: '#F59E0B', speaking: '#22C55E',
}
const STATUS_CFG: Record<AgentStatus, { color: string; label: string }> = {
  idle:               { color: '#2A3A52', label: 'Inactiu' },
  running:            { color: '#00D4FF', label: 'En curs' },
  done:               { color: '#22C55E', label: 'Completat' },
  error:              { color: '#EF4444', label: 'Error' },
  paused:             { color: '#F59E0B', label: 'Pausat' },
  awaiting_approval:  { color: '#F97316', label: 'Aprovació' },
}

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16)
  return `${r},${g},${b}`
}
function ts() { return new Date().toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }

function detectAgents(text: string): string[] {
  const lower = text.toLowerCase()
  return AGENTS.filter(a => a.keywords.some(kw => lower.includes(kw))).map(a => a.id)
}


// ── Agent Card ─────────────────────────────────────────────────────────────────

function AgentCard({ agent, run, isActive, onClick }: {
  agent: AgentDef; run: AgentRun; isActive: boolean; onClick: () => void
}) {
  const Icon = agent.icon
  const cfg = STATUS_CFG[run.status]
  const running = run.status === 'running'
  return (
    <button onClick={onClick} style={{
      background: isActive ? `linear-gradient(135deg,rgba(${hexToRgb(agent.color)},0.13) 0%,rgba(${hexToRgb(agent.color)},0.04) 100%)` : 'rgba(255,255,255,0.02)',
      border: `1px solid ${isActive ? agent.color+'55' : 'rgba(255,255,255,0.06)'}`,
      borderRadius: 10, padding: '10px 12px', cursor: 'pointer', textAlign: 'left',
      transition: 'all 0.2s', position: 'relative', overflow: 'hidden', width: '100%',
    }}>
      {running && <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(90deg,transparent,rgba(${hexToRgb(agent.color)},0.07),transparent)`, animation: 'shimmer 1.8s linear infinite' }} />}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, background: `rgba(${hexToRgb(agent.color)},0.12)`, border: `1px solid rgba(${hexToRgb(agent.color)},0.25)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={13} color={agent.color} strokeWidth={1.8} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.18)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 1 }}>{agent.num}</div>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: isActive ? agent.color : 'rgba(255,255,255,0.65)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{agent.name}</div>
          <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.28)', marginTop: 1 }}>{agent.desc}</div>
        </div>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, flexShrink: 0, marginTop: 4, boxShadow: running ? `0 0 8px ${cfg.color}` : 'none', transition: 'box-shadow .3s' }} />
      </div>
      {run.output && (
        <div style={{ marginTop: 7, fontSize: 10, color: 'rgba(255,255,255,0.28)', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
          {run.output}
        </div>
      )}
    </button>
  )
}

// ── Agent Node (radial layout) ─────────────────────────────────────────────────

function AgentNode({ agent, run, isActive, labelSide, onClick }: {
  agent: AgentDef; run: AgentRun; isActive: boolean
  labelSide: 'left' | 'right' | 'top' | 'bottom'; onClick: () => void
}) {
  const Icon = agent.icon
  const cfg = STATUS_CFG[run.status]
  const running = run.status === 'running'
  const rgb = hexToRgb(agent.color)

  const label = (
    <div style={{ textAlign: 'center', maxWidth: 80 }}>
      <div style={{
        fontSize: 9.5, fontWeight: isActive ? 700 : 500,
        color: isActive ? agent.color : 'rgba(255,255,255,0.28)',
        whiteSpace: 'nowrap', letterSpacing: '0.01em', transition: 'color 0.35s',
      }}>
        {agent.name}
      </div>
      {(running || isActive) && (
        <div style={{ fontSize: 7.5, color: `rgba(${rgb},0.55)`, marginTop: 1, whiteSpace: 'nowrap' }}>
          {running ? '◉ actiu' : agent.desc}
        </div>
      )}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
      {labelSide === 'top' && label}
      <button onClick={onClick} style={{
        width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
        background: isActive
          ? `radial-gradient(circle at 35% 35%, rgba(${rgb},0.28) 0%, rgba(${rgb},0.07) 100%)`
          : 'rgba(255,255,255,0.02)',
        border: `1.5px solid ${isActive ? agent.color + 'BB' : 'rgba(255,255,255,0.07)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: isActive ? `0 0 22px rgba(${rgb},0.38), 0 0 7px rgba(${rgb},0.14) inset` : 'none',
        transition: 'all 0.35s ease', position: 'relative',
      }}>
        <Icon size={15} color={isActive ? agent.color : '#253040'} strokeWidth={isActive ? 2.1 : 1.5} />
        <div style={{
          position: 'absolute', bottom: -1, right: -1, width: 10, height: 10,
          borderRadius: '50%', background: cfg.color, border: '1.5px solid #070A12',
          boxShadow: running ? `0 0 8px ${cfg.color}` : 'none', transition: 'box-shadow 0.3s',
        }} />
      </button>
      {(labelSide === 'bottom' || labelSide === 'left' || labelSide === 'right') && label}
    </div>
  )
}

// ── Floating Chat ──────────────────────────────────────────────────────────────

function FloatingChat({ msgs, input, onInput, onSend, onMic, voiceState, selectedAgent, agents, bekaEnabled, onToggleBeka, onVoiceSettings }: {
  msgs: ChatMsg[]
  input: string
  onInput: (v: string) => void
  onSend: () => void
  onMic: () => void
  voiceState: JarvisVoiceState
  selectedAgent: string | null
  agents: AgentDef[]
  bekaEnabled: boolean
  onToggleBeka: () => void
  onVoiceSettings: () => void
}) {
  const endRef = useRef<HTMLDivElement>(null)
  const [prevAgent, setPrevAgent] = useState(selectedAgent)
  const [agentFlash, setAgentFlash] = useState(false)
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])
  useEffect(() => {
    if (selectedAgent !== prevAgent) {
      setPrevAgent(selectedAgent)
      setAgentFlash(true)
      setTimeout(() => setAgentFlash(false), 700)
    }
  }, [selectedAgent, prevAgent])
  const selDef = agents.find(a => a.id === selectedAgent)
  const rgb = selDef ? hexToRgb(selDef.color) : '0,212,255'
  const col = selDef?.color ?? '#00D4FF'
  const AgentIcon = selDef?.icon

  return (
    <div style={{
      position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
      width: 'min(460px, calc(100% - 40px))', zIndex: 8,
      background: 'rgba(5,9,20,0.88)', backdropFilter: 'blur(20px)',
      border: `1px solid rgba(${rgb},0.25)`,
      borderRadius: 14, overflow: 'hidden',
      boxShadow: `0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(${rgb},0.08)`,
      transition: 'border-color .3s, box-shadow .3s',
    }}>
      {/* Title bar — agent actiu prominent */}
      <div style={{ padding: '8px 14px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          {/* Agent indicator chip */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '3px 8px 3px 5px', borderRadius: 20,
            background: `rgba(${rgb},0.10)`,
            border: `1px solid rgba(${rgb},${agentFlash ? '0.6' : '0.2'})`,
            transition: 'border-color .3s',
            boxShadow: agentFlash ? `0 0 12px rgba(${rgb},0.4)` : 'none',
          }}>
            {AgentIcon ? (
              <div style={{ width: 16, height: 16, borderRadius: 5, background: `rgba(${rgb},0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AgentIcon size={9} color={col} strokeWidth={2} />
              </div>
            ) : (
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00D4FF', flexShrink: 0 }} />
            )}
            <span style={{ fontSize: 10, fontWeight: 700, color: col, letterSpacing: '0.04em' }}>
              {selDef ? selDef.name : 'BEKA'}
            </span>
          </div>
          {selDef && selDef.id !== 'orchestrator' && (
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.06em' }}>via BEKA</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, letterSpacing: '0.10em', color: voiceState !== 'idle' ? col : 'rgba(255,255,255,0.14)', transition: 'color .2s' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: voiceState !== 'idle' ? col : 'rgba(255,255,255,0.1)', boxShadow: voiceState !== 'idle' ? `0 0 6px ${col}` : 'none', transition: 'all .2s' }} />
            {voiceState !== 'idle' ? voiceState.toUpperCase() : 'STANDBY'}
          </div>
          <button onClick={onVoiceSettings} title="Configurar veu de BEKA" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 0 2px', color: 'rgba(255,255,255,0.18)', fontSize: 10, lineHeight: 1 }}>⚙</button>
        </div>
      </div>

      {/* Messages */}
      {msgs.length > 0 && (
        <div style={{ maxHeight: 150, overflowY: 'auto', padding: '8px 14px 4px', display: 'flex', flexDirection: 'column', gap: 5 }}>
          {msgs.slice(-8).map((msg, i) => {
            const agDef = msg.agentId ? agents.find(a => a.id === msg.agentId) : null
            const agRgb = agDef ? hexToRgb(agDef.color) : rgb
            return (
              <div key={i} style={{ display: 'flex', gap: 6, justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', animation: 'fadeUp .15s ease' }}>
                {msg.role === 'agent' && agDef && (
                  <div style={{ width: 17, height: 17, borderRadius: 5, flexShrink: 0, marginTop: 1, background: `rgba(${agRgb},0.15)`, border: `1px solid rgba(${agRgb},0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {(() => { const Icon = agDef.icon; return <Icon size={8} color={agDef.color} strokeWidth={2} /> })()}
                  </div>
                )}
                <div style={{ maxWidth: '75%', padding: '5px 9px', borderRadius: 7, fontSize: 10.5, lineHeight: 1.5, background: msg.role === 'user' ? `rgba(${rgb},0.09)` : 'rgba(255,255,255,0.04)', border: `1px solid ${msg.role === 'user' ? `rgba(${rgb},0.18)` : 'rgba(255,255,255,0.05)'}`, color: msg.role === 'user' ? `rgba(200,230,255,0.85)` : 'rgba(255,255,255,0.55)', userSelect: 'text' }}>
                  {msg.role === 'agent' && agDef && agDef.id !== 'orchestrator' && (
                    <div style={{ fontSize: 8, color: agDef.color, fontWeight: 700, marginBottom: 2, opacity: 0.7 }}>{agDef.name.toUpperCase()}</div>
                  )}
                  {msg.text}
                </div>
              </div>
            )
          })}
          <div ref={endRef} />
        </div>
      )}

      {/* Input row */}
      <div style={{ padding: msgs.length > 0 ? '5px 10px 10px' : '10px', display: 'flex', gap: 6, alignItems: 'center' }}>
        <button onClick={onToggleBeka} title={bekaEnabled ? 'Desactivar BEKA per veu' : 'Activar BEKA per veu — digues "BEKA"'} style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, border: `1.5px solid ${bekaEnabled ? 'rgba(0,212,255,0.6)' : 'rgba(255,255,255,0.08)'}`, background: bekaEnabled ? 'rgba(0,212,255,0.10)' : 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: bekaEnabled ? '0 0 10px rgba(0,212,255,0.35)' : 'none', transition: 'all .2s' }}>
          <Zap size={11} color={bekaEnabled ? '#00D4FF' : 'rgba(255,255,255,0.2)'} strokeWidth={1.8} />
        </button>
        <button onClick={onMic} style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, border: `1.5px solid ${voiceState !== 'idle' ? col : 'rgba(255,255,255,0.1)'}`, background: voiceState === 'listening' ? `rgba(${rgb},0.12)` : 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: voiceState !== 'idle' ? `0 0 8px rgba(${rgb},0.3)` : 'none', transition: 'all .2s' }}>
          {voiceState === 'thinking' || voiceState === 'speaking'
            ? <MicOff size={11} color={col} strokeWidth={1.5} />
            : <Mic size={11} color={voiceState !== 'idle' ? col : 'rgba(255,255,255,0.3)'} strokeWidth={1.5} />}
        </button>
        <input
          value={input} onChange={e => onInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && input.trim()) onSend() }}
          placeholder={selDef && selDef.id !== 'orchestrator' ? `Missatge a ${selDef.name}…` : '▸ Escriu a BEKA o a qualsevol agent…'}
          style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(${rgb},0.12)`, borderRadius: 10, color: 'rgba(255,255,255,0.82)', fontSize: 12, padding: '6px 10px', fontFamily: 'inherit', outline: 'none', letterSpacing: '0.01em', transition: 'border-color .2s' }}
        />
        <button onClick={onSend} style={{ width: 30, height: 30, borderRadius: 7, flexShrink: 0, background: input.trim() ? `rgba(${rgb},0.18)` : 'rgba(255,255,255,0.03)', border: input.trim() ? `1px solid rgba(${rgb},0.35)` : '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() ? 'pointer' : 'default', color: input.trim() ? col : '#253545', transition: 'all .15s' }}>
          <Send size={11} />
        </button>
      </div>
    </div>
  )
}

// ── Wave background canvas ─────────────────────────────────────────────────────

function BekaBackground({ paused }: { paused: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef  = useRef(0)
  const timeRef   = useRef(0)
  const pausedRef = useRef(paused)
  useEffect(() => { pausedRef.current = paused }, [paused])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    let W = 0, H = 0

    const resize = () => {
      W = canvas.offsetWidth; H = canvas.offsetHeight
      canvas.width  = W * dpr
      canvas.height = H * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    // Micro-particles
    type MicroPt = { x: number; y: number; vx: number; vy: number; alpha: number; r: number }
    const microParticles: MicroPt[] = Array.from({ length: 50 }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0002,
      vy: (Math.random() - 0.5) * 0.0002,
      alpha: 0.05 + Math.random() * 0.10,
      r: 0.8 + Math.random() * 0.7,
    }))

    // Grid line helper
    const drawGrid = (x0: number, y0: number, cols: number, rows: number, cellW: number, cellH: number, alpha: number) => {
      ctx.strokeStyle = `rgba(40,90,200,${alpha})`
      ctx.lineWidth = 0.4
      for (let c = 0; c <= cols; c++) {
        ctx.beginPath(); ctx.moveTo(x0 + c * cellW, y0); ctx.lineTo(x0 + c * cellW, y0 + rows * cellH); ctx.stroke()
      }
      for (let r = 0; r <= rows; r++) {
        ctx.beginPath(); ctx.moveTo(x0, y0 + r * cellH); ctx.lineTo(x0 + cols * cellW, y0 + r * cellH); ctx.stroke()
      }
    }

    const draw = () => {
      if (!pausedRef.current) timeRef.current += 0.007
      const t = timeRef.current

      // ── Base: near-black ──────────────────────────────────────
      ctx.fillStyle = '#03060f'
      ctx.fillRect(0, 0, W, H)

      // ── Top-left violet glow (pulsing slowly) ─────────────────
      const vlPulse = 0.52 + 0.06 * Math.sin(t * 0.28)
      const vl = ctx.createRadialGradient(W * -0.05, H * -0.08, 0, W * -0.05, H * -0.08, W * 0.72)
      vl.addColorStop(0,   `rgba(80,30,170,${vlPulse})`)
      vl.addColorStop(0.4, `rgba(40,10,100,${vlPulse * 0.45})`)
      vl.addColorStop(1,   'rgba(0,0,0,0)')
      ctx.fillStyle = vl
      ctx.fillRect(0, 0, W, H)

      // ── Bottom-right electric blue glow (drifts + pulses) ─────
      const bx = W * (0.88 + 0.04 * Math.sin(t * 0.18))
      const by = H * (0.78 + 0.05 * Math.sin(t * 0.23 + 1.2))
      const blPulse = 0.80 + 0.12 * Math.sin(t * 0.35)
      const bl = ctx.createRadialGradient(bx, by, 0, bx, by, W * 0.75)
      bl.addColorStop(0,   `rgba(0,100,255,${blPulse})`)
      bl.addColorStop(0.3, `rgba(0,60,210,${blPulse * 0.55})`)
      bl.addColorStop(0.65,`rgba(0,20,100,${blPulse * 0.18})`)
      bl.addColorStop(1,   'rgba(0,0,0,0)')
      ctx.fillStyle = bl
      ctx.fillRect(0, 0, W, H)

      // ── Secondary mid-blue shimmer (moves in a slow arc) ──────
      const sx = W * (0.55 + 0.12 * Math.sin(t * 0.14 + 2.0))
      const sy = H * (0.60 + 0.10 * Math.cos(t * 0.11 + 0.5))
      const sl = ctx.createRadialGradient(sx, sy, 0, sx, sy, W * 0.45)
      sl.addColorStop(0,   `rgba(0,60,200,${0.28 + 0.08 * Math.sin(t * 0.22)})`)
      sl.addColorStop(1,   'rgba(0,0,0,0)')
      ctx.fillStyle = sl
      ctx.fillRect(0, 0, W, H)

      // ── Subtle horizontal wave bands ──────────────────────────
      for (let i = 0; i < 3; i++) {
        const yBase = H * (0.35 + i * 0.22) + Math.sin(t * 0.20 + i * 1.8) * H * 0.04
        const bh = H * (0.12 + 0.03 * Math.sin(t * 0.15 + i))
        const wo = 0.04 + 0.02 * Math.sin(t * 0.3 + i * 2.1)
        const wv = ctx.createLinearGradient(0, yBase - bh, 0, yBase + bh)
        wv.addColorStop(0,   'rgba(0,0,0,0)')
        wv.addColorStop(0.5, `rgba(0,50,180,${wo})`)
        wv.addColorStop(1,   'rgba(0,0,0,0)')
        ctx.fillStyle = wv
        ctx.fillRect(0, yBase - bh, W, bh * 2)
      }

      // ── Corner grids ──────────────────────────────────────────
      const cell = 28
      const gAlpha = 0.10 + 0.03 * Math.sin(t * 0.18)
      // Top-right
      drawGrid(W - cell * 5, 0, 5, 4, cell, cell, gAlpha * 0.55)
      // Bottom-left
      drawGrid(0, H - cell * 4, 4, 4, cell, cell, gAlpha * 0.55)

      // ── Micro-particles ───────────────────────────────────────
      for (const p of microParticles) {
        if (!pausedRef.current) {
          p.x += p.vx; p.y += p.vy
          if (p.x < 0) p.x = 1; if (p.x > 1) p.x = 0
          if (p.y < 0) p.y = 1; if (p.y > 1) p.y = 0
        }
        ctx.beginPath(); ctx.arc(p.x * W, p.y * H, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(0,174,239,${p.alpha})`; ctx.fill()
      }

      // ── Edge vignette ─────────────────────────────────────────
      const vig = ctx.createRadialGradient(W * 0.5, H * 0.5, W * 0.15, W * 0.5, H * 0.5, W * 0.9)
      vig.addColorStop(0, 'rgba(0,0,0,0)')
      vig.addColorStop(1, 'rgba(0,0,8,0.68)')
      ctx.fillStyle = vig
      ctx.fillRect(0, 0, W, H)

      frameRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(frameRef.current); ro.disconnect() }
  }, [])

  return (
    <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }} />
  )
}

// ── Normalised agent positions (x/y in ±1 units, z in world-px) ───────────────
// x: left(-)/right(+), y: up(-)/down(+).
// At default zoom agents project to ~90% of canvas width and ~84% of height.

const AGENT_CAT: Record<string, string> = {
  memory: 'CONEIXEMENT', automation: 'PROCESSOS', email: 'COMUNICACIÓ',
  analytics: 'DADES', tasks: 'PRODUCTIVITAT', crm: 'CLIENTS',
  strategy: 'CREIXEMENT', finances: 'CONTROL', content: 'CREATIVITAT',
}

const AGENT_NORM: Record<string, { x: number; y: number; z: number }> = {
  memory:     { x: -0.78, y: -0.68, z:  110 },
  automation: { x: -1.00, y:  0.03, z:  -22 },
  email:      { x: -0.72, y:  0.70, z:   84 },
  analytics:  { x: -0.43, y:  0.96, z:  -86 },
  tasks:      { x:  0.43, y: -0.96, z:  -86 },
  crm:        { x:  1.00, y: -0.03, z:  -22 },
  strategy:   { x:  0.72, y: -0.70, z:   84 },
  finances:   { x:  0.78, y:  0.68, z:  110 },
  content:    { x:  0.00, y:  1.02, z:  -58 },
}

// ── 3D Radial Canvas ───────────────────────────────────────────────────────────

function AgentRadial3D({ agents, runs, activeAgents, selectedAgent, onSelect, bekaSizeRef, targetCamRef }: {
  agents: AgentDef[]
  runs: Record<string, AgentRun>
  activeAgents: Set<string>
  selectedAgent: string | null
  onSelect: (id: string | null) => void
  bekaSizeRef: React.MutableRefObject<number>
  targetCamRef: React.MutableRefObject<number>
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef  = useRef(0)
  const camZRef   = useRef(900)
  const projRef   = useRef<Record<string, { x: number; y: number; r: number }>>({})

  const runsRef   = useRef(runs)
  const activeRef = useRef(activeAgents)
  const selRef    = useRef(selectedAgent)
  useEffect(() => { runsRef.current   = runs },         [runs])
  useEffect(() => { activeRef.current = activeAgents }, [activeAgents])
  useEffect(() => { selRef.current    = selectedAgent }, [selectedAgent])

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const bekaExclude = (bekaSizeRef.current ?? 380) * 0.42
    if (Math.hypot(mx - rect.width / 2, my - rect.height / 2) < bekaExclude) return

    let best: string | null = null
    let bestDist = Infinity
    for (const [id, p] of Object.entries(projRef.current)) {
      const d = Math.hypot(mx - p.x, my - p.y)
      if (d < p.r + 20 && d < bestDist) { bestDist = d; best = id }
    }
    onSelect(best === selRef.current ? null : best)
  }, [onSelect, bekaSizeRef])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx   = canvas.getContext('2d')!
    const dpr   = window.devicePixelRatio || 1
    const FOCAL    = 520
    const INIT_CAM = 900
    const BEKA_BASE = 380

    const nonBeka = agents.filter(a => a.id !== 'orchestrator')

    const bezPt = (t: number, x0: number, y0: number, mx2: number, my2: number, x1: number, y1: number) => ({
      x: (1-t)*(1-t)*x0 + 2*(1-t)*t*mx2 + t*t*x1,
      y: (1-t)*(1-t)*y0 + 2*(1-t)*t*my2 + t*t*y1,
    })

    // ── Agent icon drawing (compact geometric approximations) ─────────────────
    const drawAgentIcon = (id: string, cx: number, cy: number, s: number, rgb: string, alpha: number) => {
      if (s < 4) return  // too small to draw
      ctx.save()
      ctx.strokeStyle = `rgba(${rgb},${alpha})`
      ctx.fillStyle   = `rgba(${rgb},${alpha * 0.9})`
      ctx.lineWidth   = Math.max(0.8, s * 0.12)
      ctx.lineCap  = 'round'; ctx.lineJoin = 'round'
      switch (id) {
        case 'memory': {
          ctx.beginPath(); ctx.ellipse(cx, cy - s*0.38, s*0.68, s*0.22, 0, 0, Math.PI*2); ctx.stroke()
          ctx.beginPath(); ctx.moveTo(cx - s*0.68, cy - s*0.38); ctx.lineTo(cx - s*0.68, cy + s*0.38)
          ctx.moveTo(cx + s*0.68, cy - s*0.38); ctx.lineTo(cx + s*0.68, cy + s*0.38); ctx.stroke()
          ctx.beginPath(); ctx.ellipse(cx, cy + s*0.38, s*0.68, s*0.22, 0, 0, Math.PI*2); ctx.stroke()
          break
        }
        case 'automation': {
          ctx.beginPath()
          ctx.moveTo(cx + s*0.2,  cy - s)
          ctx.lineTo(cx - s*0.3,  cy - s*0.04)
          ctx.lineTo(cx + s*0.06, cy - s*0.04)
          ctx.lineTo(cx - s*0.2,  cy + s)
          ctx.stroke(); break
        }
        case 'email': {
          ctx.beginPath(); ctx.rect(cx - s*0.78, cy - s*0.5, s*1.56, s); ctx.stroke()
          ctx.beginPath()
          ctx.moveTo(cx - s*0.78, cy - s*0.5)
          ctx.lineTo(cx, cy + s*0.1)
          ctx.lineTo(cx + s*0.78, cy - s*0.5); ctx.stroke(); break
        }
        case 'analytics': {
          ctx.fillRect(cx - s*0.65, cy - s*0.15, s*0.36, s*0.65)
          ctx.fillRect(cx - s*0.17, cy - s*0.72, s*0.36, s*1.22)
          ctx.fillRect(cx + s*0.31, cy - s*0.44, s*0.36, s*0.94)
          break
        }
        case 'tasks': {
          ctx.beginPath()
          ctx.moveTo(cx - s*0.62, cy - s*0.1)
          ctx.lineTo(cx - s*0.18, cy + s*0.5)
          ctx.lineTo(cx + s*0.65, cy - s*0.65); ctx.stroke(); break
        }
        case 'crm': {
          ctx.beginPath(); ctx.arc(cx, cy - s*0.28, s*0.42, 0, Math.PI*2); ctx.stroke()
          ctx.beginPath(); ctx.arc(cx, cy + s*0.58, s*0.62, Math.PI, 0, false); ctx.stroke(); break
        }
        case 'strategy': {
          ctx.beginPath(); ctx.arc(cx, cy, s*0.88, 0, Math.PI*2); ctx.stroke()
          ctx.beginPath(); ctx.arc(cx, cy, s*0.44, 0, Math.PI*2); ctx.stroke()
          ctx.beginPath(); ctx.arc(cx, cy, s*0.12, 0, Math.PI*2); ctx.fill(); break
        }
        case 'finances': {
          ctx.font = `700 ${Math.round(s * 1.75)}px Inter,system-ui,sans-serif`
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
          ctx.fillText('$', cx, cy + s*0.06); break
        }
        case 'content': {
          const a = -Math.PI / 4
          const len = s * 1.1
          const x1 = cx - Math.cos(a)*len*0.5, y1 = cy - Math.sin(a)*len*0.5
          const x2 = cx + Math.cos(a)*len*0.5, y2 = cy + Math.sin(a)*len*0.5
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()
          ctx.beginPath(); ctx.arc(x2, y2, s*0.18, 0, Math.PI*2); ctx.fill(); break
        }
      }
      ctx.restore()
    }

    const draw = () => {
      camZRef.current += (targetCamRef.current - camZRef.current) * 0.07
      const camZ  = camZRef.current
      const active = activeRef.current
      const sel    = selRef.current
      const rnz    = runsRef.current
      const t      = performance.now() / 1000

      bekaSizeRef.current = Math.round(Math.min(540, Math.max(80, BEKA_BASE * INIT_CAM / camZ)))

      const W = canvas.offsetWidth
      const H = canvas.offsetHeight
      if (Math.round(canvas.width / dpr) !== W || Math.round(canvas.height / dpr) !== H) {
        canvas.width  = Math.round(W * dpr)
        canvas.height = Math.round(H * dpr)
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      }
      ctx.clearRect(0, 0, W, H)

      const CX = W / 2
      const CY = H / 2
      // Fixed 2D radial positions — nodes never move with zoom
      const RX = (W / 2) * 0.84
      const RY = (H / 2) * 0.78

      const project = (norm: { x: number; y: number; z: number }) => {
        return {
          x: CX + norm.x * RX,
          y: CY + norm.y * RY,
          r: Math.max(26, 30 + norm.z * 0.04),
          depth: 900,
        }
      }

      const sorted = [...nonBeka].sort((a, b) =>
        (AGENT_NORM[a.id]?.z ?? 0) - (AGENT_NORM[b.id]?.z ?? 0)
      )

      const bekaScreenR = bekaSizeRef.current * 0.19

      // ── Connection lines ──────────────────────────────────────────────────────
      for (const agent of sorted) {
        const norm = AGENT_NORM[agent.id]; if (!norm) continue
        const proj = project(norm); if (!proj) continue
        const isAct = active.has(agent.id) || sel === agent.id
        const rgb   = hexToRgb(agent.color)
        const fo    = 1

        const dx = proj.x - CX; const dy = proj.y - CY
        const dist = Math.sqrt(dx*dx + dy*dy) || 1
        const ux = dx/dist; const uy = dy/dist

        const sx0 = CX + ux * bekaScreenR
        const sy0 = CY + uy * bekaScreenR
        const sx1 = proj.x - ux * proj.r * 0.82
        const sy1 = proj.y - uy * proj.r * 0.82
        const perp = 0.10
        const cx2  = (sx0 + sx1) / 2 + uy * dist * perp * (norm.z > 0 ? 1 : -1)
        const cy2  = (sy0 + sy1) / 2 - ux * dist * perp * (norm.z > 0 ? 1 : -1)

        if (isAct) {
          const grad = ctx.createLinearGradient(sx0, sy0, sx1, sy1)
          grad.addColorStop(0,   `rgba(${rgb},0.15)`)
          grad.addColorStop(0.5, `rgba(${rgb},0.55)`)
          grad.addColorStop(1,   `rgba(${rgb},0.85)`)

          ctx.beginPath(); ctx.moveTo(sx0, sy0); ctx.quadraticCurveTo(cx2, cy2, sx1, sy1)
          ctx.strokeStyle = `rgba(${rgb},0.06)`; ctx.lineWidth = 16; ctx.stroke()
          ctx.beginPath(); ctx.moveTo(sx0, sy0); ctx.quadraticCurveTo(cx2, cy2, sx1, sy1)
          ctx.strokeStyle = `rgba(${rgb},0.12)`; ctx.lineWidth = 8; ctx.stroke()
          ctx.beginPath(); ctx.moveTo(sx0, sy0); ctx.quadraticCurveTo(cx2, cy2, sx1, sy1)
          ctx.strokeStyle = `rgba(${rgb},0.28)`; ctx.lineWidth = 2.5; ctx.stroke()
          ctx.beginPath(); ctx.moveTo(sx0, sy0); ctx.quadraticCurveTo(cx2, cy2, sx1, sy1)
          ctx.strokeStyle = grad; ctx.lineWidth = 1.2; ctx.stroke()

          const endGlow = ctx.createRadialGradient(sx1, sy1, 0, sx1, sy1, 12)
          endGlow.addColorStop(0, `rgba(${rgb},0.65)`); endGlow.addColorStop(1, 'rgba(0,0,0,0)')
          ctx.fillStyle = endGlow
          ctx.beginPath(); ctx.arc(sx1, sy1, 12, 0, Math.PI * 2); ctx.fill()
        } else {
          // Idle: visible blue line
          ctx.beginPath(); ctx.moveTo(sx0, sy0); ctx.quadraticCurveTo(cx2, cy2, sx1, sy1)
          ctx.strokeStyle = `rgba(0,174,239,0.12)`; ctx.lineWidth = 6; ctx.stroke()
          ctx.beginPath(); ctx.moveTo(sx0, sy0); ctx.quadraticCurveTo(cx2, cy2, sx1, sy1)
          ctx.strokeStyle = `rgba(0,174,239,0.45)`; ctx.lineWidth = 1.2; ctx.stroke()
        }
      }

      // ── Flowing particles (ALL connections always animate) ───────────────────
      for (const agent of nonBeka) {
        const norm = AGENT_NORM[agent.id]; if (!norm) continue
        const proj = project(norm); if (!proj) continue
        const isAct = active.has(agent.id) || sel === agent.id
        const isRun = rnz[agent.id]?.status === 'running'
        const fo    = 1

        const dx = proj.x - CX; const dy = proj.y - CY
        const dist = Math.sqrt(dx*dx + dy*dy) || 1
        const ux = dx/dist; const uy = dy/dist
        const sx0 = CX + ux * bekaScreenR; const sy0 = CY + uy * bekaScreenR
        const sx1 = proj.x - ux * proj.r * 0.82; const sy1 = proj.y - uy * proj.r * 0.82
        const perp = 0.10
        const cx2  = (sx0 + sx1) / 2 + uy * dist * perp * (norm.z > 0 ? 1 : -1)
        const cy2  = (sy0 + sy1) / 2 - ux * dist * perp * (norm.z > 0 ? 1 : -1)

        const speed      = isRun ? 2.2 : isAct ? 1.3 : 0.42
        const nParticles = isRun ? 4   : isAct ? 2   : 1
        const baseAlpha  = isRun ? 0.95 : isAct ? 0.72 : 0.22
        const baseR      = isRun ? 3.2  : isAct ? 2.1  : 1.3

        for (let pi = 0; pi < nParticles; pi++) {
          const ph = ((t * speed + pi / nParticles + agents.indexOf(agent) * 0.29) % 1 + 1) % 1
          const bp = bezPt(ph, sx0, sy0, cx2, cy2, sx1, sy1)
          const pr = baseR * Math.min(1.5, fo)
          const fadeEdge = Math.min(ph * 5, 1) * Math.min((1 - ph) * 5, 1)
          ctx.beginPath(); ctx.arc(bp.x, bp.y, pr, 0, Math.PI * 2)
          ctx.fillStyle = isAct ? agent.color : 'rgba(255,255,255,0.8)'
          ctx.globalAlpha = baseAlpha * fo * fadeEdge
          ctx.fill()
        }
        ctx.globalAlpha = 1
      }

      // ── Agent nodes ───────────────────────────────────────────────────────────
      const newProj: Record<string, { x: number; y: number; r: number }> = {}

      for (const agent of sorted) {
        const norm = AGENT_NORM[agent.id]; if (!norm) continue
        const proj = project(norm); if (!proj) continue
        const isAct = active.has(agent.id) || sel === agent.id
        const isRun = rnz[agent.id]?.status === 'running'
        const rgb   = hexToRgb(agent.color)
        const r     = proj.r
        const fo    = 1

        newProj[agent.id] = { x: proj.x, y: proj.y, r }

        if (isAct) {
          const glow = ctx.createRadialGradient(proj.x, proj.y, 0, proj.x, proj.y, r * 3.5)
          glow.addColorStop(0, `rgba(${rgb},${0.28 * fo})`); glow.addColorStop(0.5, `rgba(${rgb},${0.10 * fo})`); glow.addColorStop(1, 'rgba(0,0,0,0)')
          ctx.fillStyle = glow
          ctx.beginPath(); ctx.arc(proj.x, proj.y, r * 3.5, 0, Math.PI * 2); ctx.fill()
        }

        if (isRun) {
          const pulse = 0.5 + 0.5 * Math.sin(t * 4.2)
          // Outer glow ring (wide)
          ctx.beginPath(); ctx.arc(proj.x, proj.y, r + 10 + pulse * 8, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(${rgb},${0.15 * pulse * fo})`; ctx.lineWidth = 3; ctx.stroke()
          // Inner pulse ring
          ctx.beginPath(); ctx.arc(proj.x, proj.y, r + 4 + pulse * 6, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(${rgb},${0.45 * pulse * fo})`; ctx.lineWidth = 1.2; ctx.stroke()
        }

        // Luminous exterior ring for active agents
        if (isAct) {
          const ringPulse = 0.6 + 0.4 * Math.sin(t * 2.8)
          ctx.beginPath(); ctx.arc(proj.x, proj.y, r + 5, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(${rgb},${0.25 * ringPulse * fo})`; ctx.lineWidth = 1.5; ctx.stroke()
          ctx.beginPath(); ctx.arc(proj.x, proj.y, r + 7, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(${rgb},${0.10 * ringPulse * fo})`; ctx.lineWidth = 2.5; ctx.stroke()
        }

        const fill = ctx.createRadialGradient(proj.x - r*0.28, proj.y - r*0.28, 0, proj.x, proj.y, r)
        if (isAct) {
          fill.addColorStop(0, `rgba(${rgb},0.50)`); fill.addColorStop(1, `rgba(${rgb},0.10)`)
        } else {
          fill.addColorStop(0, `rgba(255,255,255,0.11)`); fill.addColorStop(1, `rgba(255,255,255,0.02)`)
        }
        ctx.fillStyle = fill
        ctx.beginPath(); ctx.arc(proj.x, proj.y, r, 0, Math.PI * 2); ctx.fill()

        // Glass dome specular highlight (3D sphere illusion)
        ctx.save()
        ctx.beginPath(); ctx.arc(proj.x, proj.y, r - 0.5, 0, Math.PI * 2); ctx.clip()
        const glassSpec = ctx.createRadialGradient(
          proj.x - r * 0.30, proj.y - r * 0.38, 0,
          proj.x - r * 0.06, proj.y - r * 0.06, r * 0.84
        )
        glassSpec.addColorStop(0,    `rgba(255,255,255,${isAct ? 0.42 : 0.25})`)
        glassSpec.addColorStop(0.38, `rgba(255,255,255,${isAct ? 0.10 : 0.05})`)
        glassSpec.addColorStop(1,    'rgba(0,0,0,0)')
        ctx.fillStyle = glassSpec
        ctx.fillRect(proj.x - r, proj.y - r, r * 2, r * 2)
        // Active extra glow layer inside dome
        if (isAct) {
          const innerGlow = ctx.createRadialGradient(proj.x, proj.y, 0, proj.x, proj.y, r * 0.9)
          innerGlow.addColorStop(0,   `rgba(${rgb},${0.18 * fo})`)
          innerGlow.addColorStop(0.6, `rgba(${rgb},${0.06 * fo})`)
          innerGlow.addColorStop(1,   'rgba(0,0,0,0)')
          ctx.fillStyle = innerGlow
          ctx.fillRect(proj.x - r, proj.y - r, r * 2, r * 2)
        }
        ctx.restore()

        if (isAct) {
          ctx.beginPath(); ctx.arc(proj.x, proj.y, r + 2.5, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(${rgb},${0.18 * fo})`; ctx.lineWidth = 1.5; ctx.stroke()
        }
        ctx.beginPath(); ctx.arc(proj.x, proj.y, r, 0, Math.PI * 2)
        ctx.strokeStyle = isAct ? agent.color + 'DD' : `rgba(255,255,255,0.22)`
        ctx.lineWidth = isAct ? 1.6 : 1.0; ctx.stroke()

        // icon inside node
        const iconRgb   = isAct ? hexToRgb(agent.color) : '255,255,255'
        const iconAlpha = isAct ? 0.80 : 0.50
        drawAgentIcon(agent.id, proj.x, proj.y, r * 0.44, iconRgb, iconAlpha)

        const fs = Math.max(11, Math.min(14, r * 0.58))
        ctx.font = `${isAct ? 700 : 500} ${fs}px Inter,system-ui,sans-serif`
        ctx.textAlign = 'center'; ctx.textBaseline = 'top'
        ctx.fillStyle = isAct ? agent.color : `rgba(255,255,255,0.55)`
        ctx.fillText(agent.name, proj.x, proj.y + r + 6)

        const catFs = Math.max(8, Math.min(9.5, r * 0.34))
        const catText = (AGENT_CAT[agent.id] ?? '').split('').join(' ')
        ctx.font = `600 ${catFs}px Inter,system-ui,sans-serif`
        ctx.fillStyle = isAct ? `rgba(${rgb},0.55)` : `rgba(255,255,255,0.22)`
        ctx.fillText(catText, proj.x, proj.y + r + 6 + fs + 3)

        if (isAct) {
          const stCfg = STATUS_CFG[rnz[agent.id]?.status ?? 'idle']
          const stFs = Math.max(7, Math.min(9, r * 0.28))
          ctx.font = `700 ${stFs}px Inter,system-ui,sans-serif`
          ctx.fillStyle = `rgba(${rgb},0.80)`
          ctx.fillText(stCfg.label.toUpperCase(), proj.x, proj.y + r + 6 + fs + 3 + catFs + 5)
        }

        const cfg  = STATUS_CFG[rnz[agent.id]?.status ?? 'idle']
        const dotR = Math.max(3.5, r * 0.19)
        ctx.fillStyle = cfg.color
        if (isRun) { ctx.shadowColor = cfg.color; ctx.shadowBlur = 10 }
        ctx.beginPath(); ctx.arc(proj.x + r * 0.68, proj.y - r * 0.68, dotR, 0, Math.PI * 2); ctx.fill()
        ctx.shadowBlur = 0
      }

      projRef.current = newProj
      frameRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(frameRef.current)
  }, [agents, targetCamRef, bekaSizeRef])

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 2, cursor: 'crosshair' }}
    />
  )
}

// ── Agent Panel ────────────────────────────────────────────────────────────────

function AgentPanel({ agent, run, prompt, onClose, onStop, onRun, onSavePrompt, convHistory, onClearHistory, schedules, onAddSchedule, onDeleteSchedule, onToggleSchedule, memory, onClearMemory }: {
  agent: AgentDef; run: AgentRun; prompt: string; onClose: () => void
  onStop: () => void; onRun: (t: string) => void; onSavePrompt: (p: string) => void
  convHistory: ConvMessage[]; onClearHistory: () => void
  schedules: AgentSchedule[]; onAddSchedule: (s: Omit<AgentSchedule,'id'>) => void; onDeleteSchedule: (id: string) => void; onToggleSchedule: (id: string, enabled: boolean) => void
  memory: string; onClearMemory: () => void
}) {
  const Icon = agent.icon
  const cfg = STATUS_CFG[run.status]
  const running = run.status === 'running'
  const [task, setTask] = useState('')
  const [editPrompt, setEditPrompt] = useState(false)
  const [promptDraft, setPromptDraft] = useState(prompt)
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'output' | 'history' | 'schedule'>('output')
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [schedForm, setSchedForm] = useState({ task: '', frequency: 'daily' as 'daily'|'weekly', weekday: 1, hour: 9, minute: 0 })
  const [histSearch, setHistSearch] = useState('')
  const outputEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { outputEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [run.output])
  useEffect(() => { setPromptDraft(prompt) }, [prompt])

  // Cost estimate (Claude Sonnet 4.5 pricing)
  const costEstimate = run.usage
    ? ((run.usage.input * 3 + run.usage.output * 15) / 1_000_000).toFixed(4)
    : null
  const totalTokens = run.usage ? run.usage.input + run.usage.output : null

  const copyOutput = () => {
    const text = run.output || convHistory.map(m => `${m.role === 'user' ? 'TU' : agent.name}: ${m.content}`).join('\n\n')
    if (!text) return
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  const downloadOutput = (format: 'txt' | 'md') => {
    const text = run.output
    if (!text) return
    const date = new Date().toLocaleString('ca-ES', { dateStyle: 'short', timeStyle: 'short' })
    const content = format === 'md'
      ? `# ${agent.name} — ${run.taskDesc || 'Output'}\n*${date}*\n\n---\n\n${text}`
      : `${agent.name} — ${run.taskDesc || 'Output'}\n${date}\n\n${text}`
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${agent.id}-${Date.now()}.${format}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const WEEKDAYS = ['Diu','Dll','Dim','Dmc','Dij','Div','Dis']

  return (
    <div style={{ width: 340, flexShrink: 0, background: '#080C18', borderLeft: `1px solid rgba(${hexToRgb(agent.color)},0.2)`, display: 'flex', flexDirection: 'column', animation: 'slideIn .2s ease' }}>
      {/* Header */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 9, background: `rgba(${hexToRgb(agent.color)},0.05)` }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: `rgba(${hexToRgb(agent.color)},0.14)`, border: `1px solid rgba(${hexToRgb(agent.color)},0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={14} color={agent.color} strokeWidth={1.8} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: agent.color }}>{agent.name}</div>
          <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.28)' }}>{agent.desc}</div>
        </div>
        {/* X moved to floating button group alongside PAUSAR */}
      </div>

      {/* Status bar */}
      <div style={{ padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, boxShadow: running ? `0 0 8px ${cfg.color}` : 'none' }} />
        <span style={{ fontSize: 10.5, color: cfg.color, fontWeight: 600 }}>{cfg.label}</span>
        {run.taskDesc && <span style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.22)', marginLeft: 2, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{run.taskDesc}</span>}
        <div style={{ display: 'flex', gap: 5, marginLeft: 'auto' }}>
          {running ? (
            <button onClick={onStop} style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 9px', borderRadius: 5, border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.08)', color: '#EF4444', fontSize: 10.5, fontWeight: 600, cursor: 'pointer' }}>
              <Square size={9} fill="#EF4444" /> Parar
            </button>
          ) : (
            <button onClick={() => task.trim() && onRun(task)} style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 9px', borderRadius: 5, border: `1px solid rgba(${hexToRgb(agent.color)},0.35)`, background: `rgba(${hexToRgb(agent.color)},0.08)`, color: agent.color, fontSize: 10.5, fontWeight: 600, cursor: 'pointer' }}>
              <Play size={9} /> Executar
            </button>
          )}
          <button onClick={() => { setEditPrompt(e => !e); setPromptDraft(prompt) }} style={{ display: 'flex', alignItems: 'center', padding: '3px 7px', borderRadius: 5, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', fontSize: 10.5, cursor: 'pointer' }}>
            <Edit3 size={10} />
          </button>
        </div>
      </div>

      {/* Prompt editor */}
      {editPrompt && (
        <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5 }}>Prompt del sistema</div>
          <textarea value={promptDraft} onChange={e => setPromptDraft(e.target.value)}
            style={{ width: '100%', minHeight: 80, boxSizing: 'border-box', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 6, color: 'rgba(255,255,255,0.7)', fontSize: 10.5, lineHeight: 1.5, padding: '7px 9px', resize: 'vertical', outline: 'none', fontFamily: 'inherit' }} />
          <div style={{ display: 'flex', gap: 5, marginTop: 5 }}>
            <button onClick={() => { onSavePrompt(promptDraft); setEditPrompt(false) }} style={{ flex: 1, padding: '4px', borderRadius: 5, background: `rgba(${hexToRgb(agent.color)},0.14)`, border: `1px solid rgba(${hexToRgb(agent.color)},0.3)`, color: agent.color, fontSize: 10.5, fontWeight: 600, cursor: 'pointer' }}>Guardar</button>
            <button onClick={() => setEditPrompt(false)} style={{ padding: '4px 9px', borderRadius: 5, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.35)', fontSize: 10.5, cursor: 'pointer' }}>Cancel</button>
          </div>
          {memory && (
            <div style={{ marginTop: 8, padding: '7px 9px', background: 'rgba(0,0,0,0.2)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.25)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Memòria activa</span>
                <button onClick={onClearMemory} style={{ fontSize: 8.5, color: 'rgba(239,68,68,0.4)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Esborrar</button>
              </div>
              <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.22)', lineHeight: 1.5, maxHeight: 72, overflowY: 'auto', userSelect: 'text' }}>{memory}</div>
            </div>
          )}
        </div>
      )}

      {/* Task input */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5 }}>
          {running ? 'Modificar tasca en curs' : 'Nova tasca'}
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          <input value={task} onChange={e => setTask(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && task.trim()) { onRun(task); setTask('') } }}
            placeholder={running ? 'Redirecciona l\'execució…' : `Digues-li a ${agent.name} que faci…`}
            style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 6, color: 'rgba(255,255,255,0.8)', fontSize: 11, padding: '6px 9px', outline: 'none', fontFamily: 'inherit' }} />
          <button onClick={() => { if (task.trim()) { onRun(task); setTask('') } }}
            style={{ width: 30, height: 30, borderRadius: 6, background: `rgba(${hexToRgb(agent.color)},0.18)`, border: `1px solid rgba(${hexToRgb(agent.color)},0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: agent.color, flexShrink: 0 }}>
            <Send size={11} />
          </button>
        </div>
      </div>

      {/* Tab selector */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        {(['output', 'history', 'schedule'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            flex: 1, padding: '7px 0', fontSize: 9.5, fontWeight: 600, letterSpacing: '0.06em',
            background: 'none', border: 'none', cursor: 'pointer', textTransform: 'uppercase',
            color: activeTab === tab ? agent.color : 'rgba(255,255,255,0.22)',
            borderBottom: activeTab === tab ? `2px solid ${agent.color}` : '2px solid transparent',
            transition: 'color .15s',
          }}>
            {tab === 'output' ? 'Output' : tab === 'history' ? `Historial (${convHistory.length / 2 | 0})` : `Cron (${schedules.filter(s => s.agent_id === agent.id).length})`}
          </button>
        ))}
      </div>

      {/* Output tab */}
      {activeTab === 'output' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Eye size={9} /> Output en temps real
            {running && <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#00D4FF', animation: 'brainBreath 0.9s ease infinite' }} />}
            {costEstimate && !running && (
              <span style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.2)', fontWeight: 500, letterSpacing: '0.03em', textTransform: 'none', marginLeft: 2 }}>
                ~${costEstimate} · {totalTokens! > 999 ? `${(totalTokens! / 1000).toFixed(1)}k` : totalTokens} tok
              </span>
            )}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
              {run.output && (
                <>
                  <button onClick={() => downloadOutput('md')} title="Descarregar .md" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.25)', padding: 2, display: 'flex', alignItems: 'center', fontSize: 8, gap: 2 }}>
                    ↓md
                  </button>
                  <button onClick={() => downloadOutput('txt')} title="Descarregar .txt" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.25)', padding: 2, display: 'flex', alignItems: 'center', fontSize: 8, gap: 2 }}>
                    ↓txt
                  </button>
                  <button onClick={() => setExpanded(true)} title="Expandir" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.25)', padding: 2, display: 'flex', alignItems: 'center' }}>
                    <Maximize2 size={10} />
                  </button>
                </>
              )}
              <button onClick={copyOutput} title="Copiar" style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#22C55E' : 'rgba(255,255,255,0.25)', padding: 2, display: 'flex', alignItems: 'center', transition: 'color .2s' }}>
                {copied ? <Check size={10} /> : <Copy size={10} />}
              </button>
            </div>
          </div>
          {run.output ? (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word', userSelect: 'text' }}>
              {run.output}
              {running && <span style={{ animation: 'blink 1s step-end infinite', color: agent.color }}>▋</span>}
            </div>
          ) : (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.12)', textAlign: 'center', marginTop: 20 }}>
              {convHistory.length > 0 ? 'Escriu una tasca per iniciar.' : 'Cap activitat recent.'}
            </div>
          )}
          <div ref={outputEndRef} />
        </div>
      )}

      {/* History tab */}
      {activeTab === 'history' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {convHistory.length > 0 ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.06em' }}>{convHistory.length / 2 | 0} CONVERSES GUARDADES</span>
                <button onClick={onClearHistory} title="Esborrar historial" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(239,68,68,0.4)', display: 'flex', alignItems: 'center', gap: 3, fontSize: 9, padding: 0 }}>
                  <Trash2 size={9} /> Netejar
                </button>
              </div>
              <input
                value={histSearch}
                onChange={e => setHistSearch(e.target.value)}
                placeholder="Cercar a l'historial…"
                style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 6, color: 'rgba(255,255,255,0.6)', fontSize: 10.5, padding: '5px 9px', outline: 'none', fontFamily: 'inherit', marginBottom: 2 }}
              />
              {convHistory.filter(m => !histSearch || m.content.toLowerCase().includes(histSearch.toLowerCase())).map((m, i) => (
                <div key={i} style={{ fontSize: 10.5, color: m.role === 'user' ? 'rgba(200,230,255,0.6)' : 'rgba(255,255,255,0.45)', lineHeight: 1.6, padding: '6px 9px', background: m.role === 'user' ? 'rgba(0,212,255,0.05)' : 'rgba(255,255,255,0.02)', borderRadius: 6, borderLeft: `2px solid ${m.role === 'user' ? 'rgba(0,212,255,0.3)' : 'rgba(255,255,255,0.12)'}`, userSelect: 'text' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 8, color: m.role === 'user' ? '#00D4FF' : `rgba(${hexToRgb(agent.color)},0.6)`, fontWeight: 700 }}>{m.role === 'user' ? 'TU' : agent.name.toUpperCase()}</span>
                    {m.created_at && <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.15)' }}>{new Date(m.created_at).toLocaleString('ca-ES', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}</span>}
                  </div>
                  {m.content}
                </div>
              ))}
            </>
          ) : (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.12)', textAlign: 'center', marginTop: 20 }}>Cap historial guardat.</div>
          )}
        </div>
      )}

      {/* Schedule tab */}
      {activeTab === 'schedule' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Execucions programades</span>
            <button onClick={() => setShowScheduleForm(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 5, border: `1px solid rgba(${hexToRgb(agent.color)},0.3)`, background: `rgba(${hexToRgb(agent.color)},0.08)`, color: agent.color, fontSize: 9.5, fontWeight: 600, cursor: 'pointer' }}>
              + Nova
            </button>
          </div>

          {showScheduleForm && (
            <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 7 }}>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Nova programació</div>
              <textarea
                value={schedForm.task}
                onChange={e => setSchedForm(f => ({ ...f, task: e.target.value }))}
                placeholder="Tasca a executar…"
                style={{ width: '100%', boxSizing: 'border-box', minHeight: 56, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 6, color: 'rgba(255,255,255,0.7)', fontSize: 10.5, lineHeight: 1.5, padding: '6px 9px', resize: 'vertical', outline: 'none', fontFamily: 'inherit' }}
              />
              <div style={{ display: 'flex', gap: 5 }}>
                <select value={schedForm.frequency} onChange={e => setSchedForm(f => ({ ...f, frequency: e.target.value as 'daily'|'weekly' }))}
                  style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 5, color: 'rgba(255,255,255,0.6)', fontSize: 10.5, padding: '4px 6px', outline: 'none' }}>
                  <option value="daily">Cada dia</option>
                  <option value="weekly">Cada setmana</option>
                </select>
                {schedForm.frequency === 'weekly' && (
                  <select value={schedForm.weekday} onChange={e => setSchedForm(f => ({ ...f, weekday: +e.target.value }))}
                    style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 5, color: 'rgba(255,255,255,0.6)', fontSize: 10.5, padding: '4px 6px', outline: 'none' }}>
                    {WEEKDAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                )}
              </div>
              <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Hora:</span>
                <input type="number" min={0} max={23} value={schedForm.hour} onChange={e => setSchedForm(f => ({ ...f, hour: +e.target.value }))}
                  style={{ width: 46, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 5, color: 'rgba(255,255,255,0.6)', fontSize: 10.5, padding: '4px 6px', outline: 'none', textAlign: 'center' }} />
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>:</span>
                <input type="number" min={0} max={59} step={5} value={schedForm.minute} onChange={e => setSchedForm(f => ({ ...f, minute: +e.target.value }))}
                  style={{ width: 46, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 5, color: 'rgba(255,255,255,0.6)', fontSize: 10.5, padding: '4px 6px', outline: 'none', textAlign: 'center' }} />
              </div>
              <div style={{ display: 'flex', gap: 5 }}>
                <button onClick={() => {
                  if (!schedForm.task.trim()) return
                  onAddSchedule({ agent_id: agent.id, task: schedForm.task, frequency: schedForm.frequency, weekday: schedForm.frequency === 'weekly' ? schedForm.weekday : undefined, hour: schedForm.hour, minute: schedForm.minute, enabled: true })
                  setSchedForm({ task: '', frequency: 'daily', weekday: 1, hour: 9, minute: 0 })
                  setShowScheduleForm(false)
                }} style={{ flex: 1, padding: '4px', borderRadius: 5, background: `rgba(${hexToRgb(agent.color)},0.14)`, border: `1px solid rgba(${hexToRgb(agent.color)},0.3)`, color: agent.color, fontSize: 10.5, fontWeight: 600, cursor: 'pointer' }}>Guardar</button>
                <button onClick={() => setShowScheduleForm(false)} style={{ padding: '4px 9px', borderRadius: 5, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.35)', fontSize: 10.5, cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          )}

          {schedules.filter(s => s.agent_id === agent.id).length === 0 && !showScheduleForm ? (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.12)', textAlign: 'center', marginTop: 20 }}>Cap programació activa.</div>
          ) : (
            schedules.filter(s => s.agent_id === agent.id).map(s => (
              <div key={s.id} style={{ background: s.enabled ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)', border: `1px solid ${s.enabled ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)'}`, borderRadius: 7, padding: '8px 10px' }}>
                <div style={{ fontSize: 10.5, color: s.enabled ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)', lineHeight: 1.4, marginBottom: 5 }}>{s.task}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>
                    {s.frequency === 'daily' ? 'Diari' : `${WEEKDAYS[s.weekday ?? 1]}`} {String(s.hour).padStart(2,'0')}:{String(s.minute ?? 0).padStart(2,'0')}
                  </span>
                  {s.last_run && <span style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.15)' }}>Últim: {new Date(s.last_run).toLocaleString('ca-ES', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}</span>}
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 5 }}>
                    <button onClick={() => onToggleSchedule(s.id, !s.enabled)} style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, border: `1px solid ${s.enabled ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)'}`, background: s.enabled ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)', color: s.enabled ? '#22C55E' : 'rgba(255,255,255,0.3)', cursor: 'pointer', fontWeight: 600 }}>
                      {s.enabled ? 'ON' : 'OFF'}
                    </button>
                    <button onClick={() => onDeleteSchedule(s.id)} style={{ fontSize: 9, padding: '2px 5px', borderRadius: 4, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)', color: 'rgba(239,68,68,0.4)', cursor: 'pointer' }}>✕</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Expanded output modal */}
      {expanded && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(3,6,15,0.92)', backdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: `rgba(${hexToRgb(agent.color)},0.14)`, border: `1px solid rgba(${hexToRgb(agent.color)},0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={12} color={agent.color} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: agent.color, flex: 1 }}>{agent.name} — Output complet</span>
            {run.output && (
              <>
                <button onClick={() => downloadOutput('md')} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', fontSize: 10.5, cursor: 'pointer' }}>↓ .md</button>
                <button onClick={() => downloadOutput('txt')} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', fontSize: 10.5, cursor: 'pointer' }}>↓ .txt</button>
              </>
            )}
            <button onClick={copyOutput} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, background: copied ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.05)', border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'}`, color: copied ? '#22C55E' : 'rgba(255,255,255,0.5)', fontSize: 10.5, cursor: 'pointer', transition: 'all .2s' }}>
              {copied ? <><Check size={10} /> Copiat!</> : <><Copy size={10} /> Copiar</>}
            </button>
            <button onClick={() => setExpanded(false)} style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.35)' }}>
              <X size={12} />
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
            <pre style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, userSelect: 'text' }}>
              {run.output}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function AgentsPage() {
  const v = useJarvisVoice()

  // Agent run state (real-time output + status)
  const [runs, setRuns] = useState<Record<string, AgentRun>>(() =>
    Object.fromEntries(AGENTS.map(a => [a.id, { status: 'idle' as AgentStatus, output: '' }]))
  )
  // Prompts (localStorage)
  const [prompts, setPrompts] = useState<Record<string, string>>(() => {
    if (typeof window === 'undefined') return Object.fromEntries(AGENTS.map(a => [a.id, a.defaultPrompt]))
    try {
      const saved = JSON.parse(localStorage.getItem('guinew-agent-prompts') || '{}')
      return Object.fromEntries(AGENTS.map(a => [a.id, saved[a.id] || a.defaultPrompt]))
    } catch { return Object.fromEntries(AGENTS.map(a => [a.id, a.defaultPrompt])) }
  })
  // Conversation history per agent (from Supabase)
  const [convHistories, setConvHistories] = useState<Record<string, ConvMessage[]>>({})
  // Chat
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatting, setChatting] = useState(false)
  // UI
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [activeAgents, setActiveAgents] = useState<Set<string>>(new Set(['orchestrator']))

  const chatEndRef       = useRef<HTMLDivElement>(null)
  const abortRefs        = useRef<Record<string, AbortController>>({})
  const bekaSizeRef      = useRef<number>(380)
  const radialMapRef     = useRef<HTMLDivElement>(null)
  const cam3DTargetRef   = useRef(900)
  const [bekaPaused, setBekaPaused] = useState(false)
  const [bekaVoiceEnabled, setBekaVoiceEnabled] = useState(false)
  const [showVoiceSelector, setShowVoiceSelector] = useState(false)
  const [micError, setMicError] = useState<string | null>(null)
  const [listView, setListView] = useState(false)
  const [schedules, setSchedules] = useState<AgentSchedule[]>([])
  const [memories, setMemories] = useState<Record<string, string>>({})
  const bekaRecogRef        = useRef<any>(null)
  const bekaVoiceEnabledRef = useRef(false)

  const toggleBekaVoice = useCallback(() => {
    setBekaVoiceEnabled(prev => {
      const next = !prev
      bekaVoiceEnabledRef.current = next
      if (!next) { try { bekaRecogRef.current?.abort() } catch {} ; bekaRecogRef.current = null }
      return next
    })
  }, [])

  // Wake-word listener: continuously listens for "BEKA" when bekaVoiceEnabled
  useEffect(() => {
    if (!bekaVoiceEnabled) return
    const startWakeWord = () => {
      if (!bekaVoiceEnabledRef.current) return
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (!SR) return
      try { bekaRecogRef.current?.abort() } catch {}
      const recog = new SR()
      recog.lang = navigator.language || 'ca-ES'
      recog.continuous = true
      recog.interimResults = true
      recog.onresult = (e: any) => {
        const text = Array.from(e.results).map((r: any) => r[0].transcript).join('').toLowerCase()
        if (text.includes('beka')) {
          try { recog.abort() } catch {}
          bekaRecogRef.current = null
          v.openJarvis()
        }
      }
      recog.onerror = (e: any) => {
        if (e.error !== 'aborted' && bekaVoiceEnabledRef.current) setTimeout(startWakeWord, 1000)
      }
      recog.onend = () => {
        if (bekaVoiceEnabledRef.current) setTimeout(startWakeWord, 300)
      }
      recog.start()
      bekaRecogRef.current = recog
    }
    startWakeWord()
    return () => { try { bekaRecogRef.current?.abort() } catch {} ; bekaRecogRef.current = null }
  }, [bekaVoiceEnabled])

  // Wheel listener on the radial container — catches events from all child elements
  useEffect(() => {
    const el = radialMapRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      cam3DTargetRef.current = Math.min(1800, Math.max(240, cam3DTargetRef.current + e.deltaY * 1.5))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  // ── Load conversation history from Supabase on mount ──────────────────────
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch('/api/conversations?agentId=orchestrator')
        if (res.ok) {
          const { messages } = await res.json()
          if (messages?.length) {
            setConvHistories(prev => ({ ...prev, orchestrator: messages }))
          }
        }
      } catch {}
    }
    loadHistory()
  }, [])

  // ── Load agent prompts from Supabase on mount (point 5) ───────────────────
  useEffect(() => {
    async function loadPrompts() {
      try {
        const res = await fetch('/api/agents/config')
        if (!res.ok) return
        const { configs } = await res.json()
        if (!configs?.length) return
        setPrompts(prev => {
          const next = { ...prev }
          for (const c of configs) {
            if (c.agent_id && c.system_prompt) next[c.agent_id] = c.system_prompt
          }
          try { localStorage.setItem('guinew-agent-prompts', JSON.stringify(next)) } catch {}
          return next
        })
        const memMap: Record<string, string> = {}
        for (const c of configs) {
          if (c.agent_id && c.memory) memMap[c.agent_id] = c.memory
        }
        setMemories(memMap)
      } catch {}
    }
    loadPrompts()
  }, [])

  // ── Load schedules from Supabase on mount (point 7) ──────────────────────
  useEffect(() => {
    fetch('/api/agents/schedule')
      .then(r => r.json())
      .then(({ schedules: s }) => { if (s?.length) setSchedules(s) })
      .catch(() => {})
  }, [])

  const addSchedule = useCallback(async (s: Omit<AgentSchedule, 'id'>) => {
    try {
      const res = await fetch('/api/agents/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(s),
      })
      if (res.ok) {
        const { schedule } = await res.json()
        if (schedule) setSchedules(prev => [schedule, ...prev])
      }
    } catch {}
  }, [])

  const deleteSchedule = useCallback(async (id: string) => {
    setSchedules(prev => prev.filter(s => s.id !== id))
    try { await fetch(`/api/agents/schedule?id=${id}`, { method: 'DELETE' }) } catch {}
  }, [])

  const clearMemory = useCallback(async (agentId: string) => {
    setMemories(prev => ({ ...prev, [agentId]: '' }))
    try { await fetch(`/api/agents/config?agentId=${agentId}`, { method: 'DELETE' }) } catch {}
  }, [])

  const toggleSchedule = useCallback(async (id: string, enabled: boolean) => {
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, enabled } : s))
    try {
      await fetch('/api/agents/schedule', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, enabled }),
      })
    } catch {}
  }, [])

  // Load history for selected agent when panel opens
  useEffect(() => {
    if (!selectedAgent || convHistories[selectedAgent]) return
    fetch(`/api/conversations?agentId=${selectedAgent}`)
      .then(r => r.json())
      .then(({ messages }) => {
        if (messages?.length) setConvHistories(prev => ({ ...prev, [selectedAgent]: messages }))
      })
      .catch(() => {})
  }, [selectedAgent])

  // ── Save BEKA voice exchanges to Supabase ─────────────────────────────────
  useEffect(() => {
    const last = v.history.at(-1)
    if (!last) return

    // Detect which agents are active from response text
    if (last.role === 'jarvis') {
      const detected = detectAgents(last.text)
      const active = new Set<string>(['orchestrator', ...detected])
      setActiveAgents(active)

      // Auto-open panel for the most relevant non-orchestrator agent
      const nonBeka = detected.filter(id => id !== 'orchestrator')
      if (nonBeka.length > 0) setSelectedAgent(nonBeka[0])

      const t = setTimeout(() => setActiveAgents(new Set(['orchestrator'])), 5000)
      return () => clearTimeout(t)
    }
  }, [v.history])

  // ── Poll active runs from Supabase every 4s ───────────────────────────────
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch('/api/agents/runs')
        if (!res.ok) return
        const { runs: dbRuns } = await res.json()
        if (!dbRuns?.length) return
        setRuns(prev => {
          const next = { ...prev }
          for (const r of dbRuns) {
            if (!r.agent_id) continue
            const current = next[r.agent_id]
            // Only update if not currently streaming locally
            if (current?.status !== 'running' || !current.output) {
              next[r.agent_id] = {
                status: r.status === 'completed' ? 'done' : r.status === 'failed' ? 'error' : r.status === 'cancelled' ? 'paused' : r.status,
                output: current?.output || r.current_step || '',
                runId: r.id,
                startedAt: r.created_at ? new Date(r.created_at).toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' }) : undefined,
                taskDesc: r.title,
              }
            }
          }
          return next
        })
      } catch {}
    }
    poll()
    const interval = setInterval(poll, 4000)
    return () => clearInterval(interval)
  }, [])

  // Scroll chat
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMsgs])

  // ── Run agent with real Claude streaming ──────────────────────────────────
  const runAgent = useCallback(async (agentId: string, task: string, onResult?: (text: string) => void) => {
    // Abort any existing stream
    abortRefs.current[agentId]?.abort()
    const abort = new AbortController()
    abortRefs.current[agentId] = abort

    const agent = AGENTS.find(a => a.id === agentId)!
    const history = (convHistories[agentId] || []).slice(-8)

    // Create run in Supabase
    let runId: string | undefined
    try {
      const r = await fetch('/api/agents/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', agent_id: agentId, title: task }),
      })
      if (r.ok) { const d = await r.json(); runId = d.run?.id }
    } catch {}

    setRuns(prev => ({ ...prev, [agentId]: { status: 'running', output: '', runId, startedAt: ts(), taskDesc: task } }))
    setSelectedAgent(agentId)

    try {
      // BEKA (orchestrator) uses the full agentic loop with tools
      if (agentId === 'orchestrator') {
        const conversationHistory = history.map((h: { role: string; content: string }) => ({
          role: h.role === 'user' ? 'user' : 'assistant',
          content: h.content,
        }))

        const res = await fetch('/api/orchestrator', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: task, conversation_history: conversationHistory }),
          signal: abort.signal,
        })

        if (!res.ok) throw new Error(`Error ${res.status}`)
        const data = await res.json()
        if (data.error) throw new Error(data.error)

        const fullOutput = data.response ?? ''
        const orchUsage = data.usage ? { input: data.usage.input_tokens, output: data.usage.output_tokens } : undefined
        setRuns(prev => ({ ...prev, [agentId]: { ...prev[agentId], output: fullOutput, status: 'done', usage: orchUsage } }))
        setConvHistories(prev => ({
          ...prev,
          [agentId]: [...(prev[agentId] || []),
            { role: 'user', content: task },
            { role: 'assistant', content: fullOutput },
          ],
        }))
        // Persist to Supabase
        const base = { method: 'POST', headers: { 'Content-Type': 'application/json' } }
        fetch('/api/conversations', { ...base, body: JSON.stringify({ agentId, role: 'user', content: task }) }).catch(() => {})
        fetch('/api/conversations', { ...base, body: JSON.stringify({ agentId, role: 'assistant', content: fullOutput }) }).catch(() => {})
        if (runId) fetch('/api/agents/runs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'complete', run_id: runId, result: fullOutput.slice(0, 200) }) }).catch(() => {})
        onResult?.(fullOutput)
        return
      }

      // All other agents use streaming chat
      const res = await fetch('/api/agents/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, message: task, systemPrompt: prompts[agentId], history }),
        signal: abort.signal,
      })

      if (!res.ok || !res.body) throw new Error(`Error ${res.status}`)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullOutput = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const lines = decoder.decode(value).split('\n')
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const payload = JSON.parse(line.slice(6))
            if (payload.text) {
              fullOutput += payload.text
              setRuns(prev => ({ ...prev, [agentId]: { ...prev[agentId], output: fullOutput } }))
            }
            if (payload.done) {
              const streamUsage = payload.usage ? { input: payload.usage.input, output: payload.usage.output } : undefined
              setRuns(prev => ({ ...prev, [agentId]: { ...prev[agentId], status: 'done', usage: streamUsage } }))
              setConvHistories(prev => ({
                ...prev,
                [agentId]: [...(prev[agentId] || []),
                  { role: 'user', content: task },
                  { role: 'assistant', content: fullOutput },
                ],
              }))
              // Persist to Supabase
              const base2 = { method: 'POST', headers: { 'Content-Type': 'application/json' } }
              fetch('/api/conversations', { ...base2, body: JSON.stringify({ agentId, role: 'user', content: task }) }).catch(() => {})
              fetch('/api/conversations', { ...base2, body: JSON.stringify({ agentId, role: 'assistant', content: fullOutput }) }).catch(() => {})
              if (runId) fetch('/api/agents/runs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'complete', run_id: runId, result: fullOutput.slice(0, 200) }) }).catch(() => {})
            }
            if (payload.error) throw new Error(payload.error)
          } catch {}
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return
      setRuns(prev => ({ ...prev, [agentId]: { ...prev[agentId], status: 'error', output: `Error: ${err.message}` } }))
      if (runId) fetch('/api/agents/runs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'fail', run_id: runId, error: err.message }) }).catch(() => {})
    }
  }, [prompts, convHistories])

  // ── Stop agent ────────────────────────────────────────────────────────────
  const stopAgent = useCallback(async (agentId: string) => {
    abortRefs.current[agentId]?.abort()
    const runId = runs[agentId]?.runId
    setRuns(prev => ({ ...prev, [agentId]: { ...prev[agentId], status: 'paused' } }))
    if (runId) {
      fetch('/api/agents/runs', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ run_id: runId, action: 'cancel' }) }).catch(() => {})
    }
  }, [runs])

  // ── Clear conversation history ────────────────────────────────────────────
  const clearHistory = useCallback(async (agentId: string) => {
    setConvHistories(prev => ({ ...prev, [agentId]: [] }))
    try { await fetch(`/api/conversations?agentId=${agentId}`, { method: 'DELETE' }) } catch {}
  }, [])

  // ── Save prompt ───────────────────────────────────────────────────────────
  const savePrompt = useCallback((agentId: string, prompt: string) => {
    setPrompts(prev => {
      const next = { ...prev, [agentId]: prompt }
      try { localStorage.setItem('guinew-agent-prompts', JSON.stringify(next)) } catch {}
      return next
    })
    // Persist to Supabase
    fetch('/api/agents/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId, systemPrompt: prompt }),
    }).catch(() => {})
  }, [])

  // ── Chat send ─────────────────────────────────────────────────────────────
  const sendChat = useCallback(async (text: string) => {
    if (!text.trim() || chatting) return
    const targetId = selectedAgent || 'orchestrator'
    const agent = AGENTS.find(a => a.id === targetId)!
    const now = ts()

    setChatMsgs(prev => [...prev, { role: 'user', text, ts: now }])
    setChatting(true)

    // Detect agents mentioned and activate them
    const detected = detectAgents(text)
    if (detected.length) setActiveAgents(new Set(['orchestrator', ...detected]))

    // For chat: get reply, show in chat panel, and speak if BEKA
    try {
      const replyTs = ts()
      if (targetId === 'orchestrator') {
        // BEKA: show thinking placeholder, then speak the reply when it arrives
        setChatMsgs(prev => [...prev, { role: 'agent', text: '⚙️ Processant amb eines...', agentId: targetId, ts: replyTs }])
        runAgent(targetId, text, (fullReply) => {
          // Replace placeholder with real reply in chat
          setChatMsgs(prev => {
            const idx = [...prev].reverse().findIndex(m => m.role === 'agent' && m.agentId === targetId && m.ts === replyTs)
            if (idx === -1) return [...prev, { role: 'agent', text: fullReply, agentId: targetId, ts: replyTs }]
            const realIdx = prev.length - 1 - idx
            return [...prev.slice(0, realIdx), { ...prev[realIdx], text: fullReply }, ...prev.slice(realIdx + 1)]
          })
          // Speak first 2-3 sentences (max ~400 chars)
          const shortReply = fullReply
            .replace(/[*_`#>]/g, '')           // strip markdown
            .split(/(?<=[.!?])\s+/)
            .slice(0, 3)
            .join(' ')
            .slice(0, 400)
          if (shortReply.trim()) v.speak(shortReply)
        })
      } else {
        // Other agents: start the panel run (fire and forget)
        runAgent(targetId, text)
        const res = await fetch('/api/agents/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentId: targetId,
            message: text,
            systemPrompt: prompts[targetId] + '\n\nPer al xat: respostes molt breus (1-2 frases màxim).',
            history: (convHistories[targetId] || []).slice(-6),
          }),
        })
        if (res.ok && res.body) {
          const reader = res.body.getReader()
          const decoder = new TextDecoder()
          let reply = ''
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            const lines = decoder.decode(value).split('\n')
            for (const line of lines) {
              if (!line.startsWith('data: ')) continue
              try {
                const p = JSON.parse(line.slice(6))
                if (p.text) {
                  reply += p.text
                  setChatMsgs(prev => {
                    const last = prev[prev.length - 1]
                    if (last?.role === 'agent' && last.agentId === targetId && last.ts === replyTs) {
                      return [...prev.slice(0, -1), { ...last, text: reply }]
                    }
                    return [...prev, { role: 'agent', text: reply, agentId: targetId, ts: replyTs }]
                  })
                }
                if (p.done) break
              } catch {}
            }
          }
        }
      }
    } catch {}
    setChatting(false)
  }, [selectedAgent, chatting, prompts, convHistories, runAgent, v])

  // ── Voice mic ─────────────────────────────────────────────────────────────
  const handleMic = useCallback(() => {
    if (bekaPaused) return
    const SR = typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
    if (!SR) {
      setMicError('El teu navegador no suporta reconeixement de veu. Prova Chrome o Edge.')
      setTimeout(() => setMicError(null), 5000)
      return
    }
    setMicError(null)
    if (!v.open) v.openJarvis()
    else if (v.state === 'idle') v.startListening()
    else if (v.state === 'listening') v.send(v.transcript || '')
  }, [v, bekaPaused])

  const selectedDef = AGENTS.find(a => a.id === selectedAgent)
  const runningCount = Object.values(runs).filter(r => r.status === 'running').length

  // Derive BEKA visual state
  const bekaState = bekaPaused ? 'idle' as const
    : v.state !== 'idle' ? v.state
    : activeAgents.size > 1 ? 'executing' as const
    : 'idle' as const

  const togglePause = useCallback(() => {
    setBekaPaused(prev => {
      const next = !prev
      if (next) v.closeJarvis()
      return next
    })
  }, [v])

  const reducedMotion = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: '#070A12', fontFamily: "'Inter',system-ui,sans-serif", color: '#fff' }}>
      <style>{`
        @keyframes shimmer     { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
        @keyframes slideIn     { from{transform:translateX(16px);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes blink       { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes fadeUp      { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin        { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes brainBreath { 0%,100%{opacity:.4;transform:scale(1)} 50%{opacity:1;transform:scale(1.5)} }
        ::-webkit-scrollbar{width:3px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:#1A2540;border-radius:2px}
        textarea:focus,input:focus{outline:none}
        button:hover{opacity:.88}
      `}</style>

      {/* ── CENTER + CARDS ─────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* ── RADIAL AGENT MAP ─────────────────────────────────── */}
        <div ref={radialMapRef} style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0, background: '#030912' }}>

          {/* Wave background */}
          <BekaBackground paused={bekaPaused} />

          {/* Premium header overlay */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
            pointerEvents: 'none',
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            padding: '18px 28px',
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.12em' }}>GUINEW</div>
              <div style={{ fontSize: 10, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.18)', marginTop: 2 }}>AI OPERATING SYSTEM</div>
            </div>
            <div style={{ fontSize: 10, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.18)', textAlign: 'right' }}>
              v2026.1 &nbsp;● ONLINE
            </div>
          </div>

          {/* Floating button group: vista toggle + X + PAUSAR */}
          <div style={{
            position: 'absolute', top: 10, right: 10, zIndex: 25,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <button onClick={() => setListView(v => !v)} title={listView ? 'Vista visual 3D' : 'Vista llista'} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 28, height: 28, borderRadius: 8, cursor: 'pointer',
              background: listView ? 'rgba(0,212,255,0.10)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${listView ? 'rgba(0,212,255,0.35)' : 'rgba(255,255,255,0.1)'}`,
              color: listView ? '#00D4FF' : 'rgba(255,255,255,0.35)',
              transition: 'all 0.2s',
            }}>
              {listView ? <LayoutGrid size={11} /> : <LayoutList size={11} />}
            </button>
            {selectedAgent && (
              <button onClick={() => setSelectedAgent(null)} title="Tancar panell" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 28, height: 28, borderRadius: 20, cursor: 'pointer',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.35)',
              }}>
                <X size={11} />
              </button>
            )}
            <button onClick={togglePause} title={bekaPaused ? 'Reprendre BEKA' : 'Pausar BEKA'} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 10px', borderRadius: 20,
              background: bekaPaused ? 'rgba(0,200,255,0.10)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${bekaPaused ? 'rgba(0,200,255,0.35)' : 'rgba(255,255,255,0.1)'}`,
              color: bekaPaused ? '#00D4FF' : 'rgba(255,255,255,0.35)',
              fontSize: 9.5, fontWeight: 700, letterSpacing: '0.06em', cursor: 'pointer',
              transition: 'all 0.25s',
            }}>
              {bekaPaused
                ? <><Play size={9} fill="currentColor" /> REPRENDRE</>
                : <><Pause size={9} /> PAUSAR</>
              }
            </button>
          </div>

          {/* Paused overlay label */}
          {bekaPaused && (
            <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 5,
              fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', color: 'rgba(0,200,255,0.3)',
              textTransform: 'uppercase' }}>
              ⏸ BEKA EN PAUSA
            </div>
          )}

          {/* Vista llista (point 4) */}
          {listView && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 4, overflowY: 'auto', padding: '70px 24px 200px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, alignContent: 'start' }}>
              {AGENTS.map(agent => {
                const run = runs[agent.id]
                const cfg = STATUS_CFG[run?.status ?? 'idle']
                const isRunning = run?.status === 'running'
                const isSelected = selectedAgent === agent.id
                const rgb = hexToRgb(agent.color)
                const Icon = agent.icon
                const lastMsg = convHistories[agent.id]?.filter(m => m.role === 'assistant').at(-1)
                return (
                  <button key={agent.id} onClick={() => { setSelectedAgent(isSelected ? null : agent.id) }} style={{
                    background: isSelected ? `rgba(${rgb},0.10)` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isSelected ? agent.color + '55' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 12, padding: '12px 14px', cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.2s', position: 'relative', overflow: 'hidden',
                  }}>
                    {isRunning && <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(90deg,transparent,rgba(${rgb},0.07),transparent)`, animation: 'shimmer 1.8s linear infinite' }} />}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, background: `rgba(${rgb},0.13)`, border: `1px solid rgba(${rgb},0.25)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={14} color={agent.color} strokeWidth={1.8} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: isSelected ? agent.color : 'rgba(255,255,255,0.75)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{agent.name}</div>
                        <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.25)', marginTop: 1 }}>{agent.desc}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, boxShadow: isRunning ? `0 0 8px ${cfg.color}` : 'none' }} />
                        <span style={{ fontSize: 8.5, color: cfg.color, fontWeight: 600 }}>{cfg.label}</span>
                      </div>
                    </div>
                    {lastMsg && (
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 7 }}>
                        {lastMsg.content.slice(0, 120)}{lastMsg.content.length > 120 ? '…' : ''}
                      </div>
                    )}
                    {isSelected && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 7, fontSize: 9.5, color: agent.color }}>
                        <ChevronRight size={10} /> Panell obert
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* 3D Radial canvas */}
          <div style={{ display: listView ? 'none' : 'block', position: 'absolute', inset: 0 }}>
          <AgentRadial3D
            agents={AGENTS}
            runs={runs}
            activeAgents={activeAgents}
            selectedAgent={selectedAgent}
            onSelect={setSelectedAgent}
            bekaSizeRef={bekaSizeRef}
            targetCamRef={cam3DTargetRef}
          />
          </div>

          {/* BEKA Core centered — size driven by bekaSizeRef via AgentRadial3D */}
          <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', zIndex: 3 }}>
            <BekaCore
              state={bekaState}
              activeAgents={Array.from(activeAgents)}
              amplitudeRef={v.amplitudeRef}
              audioElRef={v.audioElRef}
              reducedMotion={reducedMotion}
              sizeRef={bekaSizeRef}
            />
          </div>

          {/* Transcript bubble — shown above the floating chat */}
          {v.state === 'listening' && v.transcript && (
            <div style={{ position: 'absolute', bottom: 86, left: '50%', transform: 'translateX(-50%)', zIndex: 9,
              maxWidth: 280, padding: '5px 11px', borderRadius: 8,
              background: 'rgba(0,200,255,0.04)', border: '1px solid rgba(0,200,255,0.12)',
              fontSize: 11, color: 'rgba(0,200,255,0.6)', fontStyle: 'italic', textAlign: 'center', animation: 'fadeUp .2s ease' }}>
              "{v.transcript}"
            </div>
          )}
          {(v.error || micError) && (
            <div style={{
              position: 'absolute', bottom: 88, left: '50%', transform: 'translateX(-50%)', zIndex: 9,
              maxWidth: 320, width: 'calc(100% - 40px)',
              background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 10, padding: '8px 12px',
              display: 'flex', alignItems: 'flex-start', gap: 8, animation: 'fadeUp .2s ease',
            }}>
              <AlertCircle size={13} color="#EF4444" style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 11, color: 'rgba(255,160,160,0.9)', lineHeight: 1.4, flex: 1 }}>
                {micError || v.error}
              </span>
              <button onClick={() => setMicError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(239,68,68,0.5)', padding: 0, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                <X size={11} />
              </button>
            </div>
          )}

          {/* B E K A status watermark */}
          <div style={{
            position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)',
            zIndex: 7, pointerEvents: 'none', textAlign: 'center',
          }}>
            <div style={{ fontSize: 9, letterSpacing: '0.35em', color: 'rgba(255,255,255,0.12)' }}>B E K A</div>
            <div style={{ fontSize: 9, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.10)', marginTop: 3 }}>
              {v.state !== 'idle' ? `● ${v.state.toUpperCase()}` : '● ONLINE'}
            </div>
          </div>

          {/* Floating chat */}
          <FloatingChat
            msgs={chatMsgs}
            input={chatInput}
            onInput={setChatInput}
            onSend={() => { if (chatInput.trim()) { sendChat(chatInput); setChatInput('') } }}
            onMic={handleMic}
            voiceState={v.state}
            selectedAgent={selectedAgent}
            agents={AGENTS}
            bekaEnabled={bekaVoiceEnabled}
            onToggleBeka={toggleBekaVoice}
            onVoiceSettings={() => setShowVoiceSelector(true)}
          />

          {showVoiceSelector && <VoiceSelector onClose={() => setShowVoiceSelector(false)} />}

          {/* Detail Panel overlay */}
          {selectedAgent && selectedDef && (
            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, zIndex: 10, animation: 'slideIn .2s ease' }}>
              <AgentPanel
                agent={selectedDef}
                run={runs[selectedAgent]}
                prompt={prompts[selectedAgent]}
                convHistory={convHistories[selectedAgent] || []}
                onClose={() => setSelectedAgent(null)}
                onStop={() => stopAgent(selectedAgent)}
                onRun={task => runAgent(selectedAgent, task)}
                onSavePrompt={p => savePrompt(selectedAgent, p)}
                onClearHistory={() => clearHistory(selectedAgent)}
                schedules={schedules}
                onAddSchedule={addSchedule}
                onDeleteSchedule={deleteSchedule}
                onToggleSchedule={toggleSchedule}
                memory={memories[selectedAgent] || ''}
                onClearMemory={() => clearMemory(selectedAgent)}
              />
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
