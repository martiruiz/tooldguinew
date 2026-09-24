'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useJarvisVoice, type JarvisVoiceState } from '@/hooks/useJarvisVoice'
import {
  Brain, Database, Zap, Mail, BarChart2, ClipboardList,
  Users, Target, DollarSign, PenLine, Mic, MicOff,
  ChevronRight, X,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

interface Agent {
  id: string
  name: string
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>
  color: string
  desc: string
  keywords: string[]
}

// ── Agent definitions ────────────────────────────────────────────────────────

const AGENTS: Agent[] = [
  { id: 'orchestrator', name: 'Orchestrator', icon: Brain,         color: '#00D4FF', desc: 'IA central',       keywords: ['orquestr', 'gestion', 'coordin', 'analitz'] },
  { id: 'memory',       name: 'Memòria',      icon: Database,      color: '#22C55E', desc: 'Gestió de context', keywords: ['record', 'memòr', 'histor', 'guarda'] },
  { id: 'automation',   name: 'Automatitz.',  icon: Zap,           color: '#F59E0B', desc: 'Tasques auto',     keywords: ['automat', 'programa', 'execut', 'workflow'] },
  { id: 'email',        name: 'Email',        icon: Mail,          color: '#EC4899', desc: 'Correu',          keywords: ['email', 'correu', 'missatg', 'envia'] },
  { id: 'analytics',    name: 'Analytics',    icon: BarChart2,     color: '#8B5CF6', desc: 'Dades i mètriques', keywords: ['analíti', 'dada', 'mètric', 'informe', 'estadístic'] },
  { id: 'tasks',        name: 'Tasques',      icon: ClipboardList, color: '#06B6D4', desc: 'Gestió de tasques', keywords: ['tasca', 'to-do', 'pendent', 'deadline', 'entrega'] },
  { id: 'crm',          name: 'CRM',          icon: Users,         color: '#10B981', desc: 'Clients',         keywords: ['client', 'crm', 'contacte', 'empresa', 'proposta'] },
  { id: 'strategy',     name: 'Estratègia',   icon: Target,        color: '#F97316', desc: 'Planificació',    keywords: ['estratèg', 'planif', 'objectiu', 'meta', 'priorit'] },
  { id: 'finances',     name: 'Finances',     icon: DollarSign,    color: '#EAB308', desc: 'Comptabilitat',   keywords: ['financer', 'factur', 'pressupost', 'pagament', 'ingrés'] },
  { id: 'content',      name: 'Contingut',    icon: PenLine,       color: '#A78BFA', desc: 'Creació de text', keywords: ['contingut', 'redacta', 'escriu', 'text', 'post', 'copy'] },
]

// ── State label ──────────────────────────────────────────────────────────────

const STATE_LABELS: Record<JarvisVoiceState, string> = {
  idle: 'STANDBY',
  listening: 'ESCOLTANT',
  thinking: 'PENSANT',
  speaking: 'PARLANT',
}

const STATE_COLORS: Record<JarvisVoiceState, string> = {
  idle: '#2A3A52',
  listening: '#00D4FF',
  thinking: '#F59E0B',
  speaking: '#22C55E',
}

// ── Active agents detection ──────────────────────────────────────────────────

function detectActiveAgents(text: string): Set<string> {
  const lower = text.toLowerCase()
  const active = new Set<string>()
  for (const agent of AGENTS) {
    if (agent.keywords.some(kw => lower.includes(kw))) active.add(agent.id)
  }
  if (active.size === 0) active.add('orchestrator')
  return active
}

// ── Mic pulse animation ──────────────────────────────────────────────────────

function MicButton({ state, onClick, disabled }: { state: JarvisVoiceState; onClick: () => void; disabled?: boolean }) {
  const isListening = state === 'listening'
  const isThinking  = state === 'thinking'
  const isSpeaking  = state === 'speaking'
  const color = STATE_COLORS[state]

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        position: 'relative',
        width: 72, height: 72,
        borderRadius: '50%',
        border: `2px solid ${color}`,
        background: isListening ? `${color}20` : 'rgba(0,212,255,0.05)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all .25s',
        flexShrink: 0,
        boxShadow: isListening ? `0 0 24px ${color}60` : isSpeaking ? `0 0 16px ${color}40` : 'none',
      }}
    >
      {/* Pulse ring when listening */}
      {isListening && (
        <span style={{
          position: 'absolute', inset: -8,
          borderRadius: '50%',
          border: `1px solid ${color}50`,
          animation: 'orch-pulse 1.5s ease-out infinite',
        }} />
      )}
      {isThinking || isSpeaking
        ? <MicOff size={26} color={color} strokeWidth={1.5} />
        : <Mic     size={26} color={color} strokeWidth={1.5} />
      }
    </button>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function AgentsPage() {
  const v = useJarvisVoice()
  const [activeAgents, setActiveAgents] = useState<Set<string>>(new Set(['orchestrator']))
  const [lastActiveAgents, setLastActiveAgents] = useState<Set<string>>(new Set(['orchestrator']))
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [v.history])

  // Detect active agents from latest Orchestrator response
  useEffect(() => {
    const last = v.history.at(-1)
    if (last?.role === 'jarvis') {
      const detected = detectActiveAgents(last.text)
      setActiveAgents(detected)
      setLastActiveAgents(detected)
      // Fade back to just orchestrator after 4s
      const t = setTimeout(() => setActiveAgents(new Set(['orchestrator'])), 4000)
      return () => clearTimeout(t)
    }
  }, [v.history])

  const handleMicClick = useCallback(() => {
    if (!v.open) {
      v.openJarvis()
    } else if (v.state === 'idle') {
      v.startListening()
    } else if (v.state === 'listening') {
      // Manual commit via send
      v.send(v.transcript || '')
    }
    // thinking/speaking: ignore clicks
  }, [v])

  const handleClose = useCallback(() => {
    v.closeJarvis()
  }, [v])

  return (
    <div style={{
      display: 'flex', height: '100%', overflow: 'hidden',
      background: '#070A12', fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <style>{`
        @keyframes orch-pulse {
          0%   { transform: scale(1);   opacity: .6; }
          100% { transform: scale(1.6); opacity: 0;  }
        }
        @keyframes orch-fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1A2540; border-radius: 2px; }
      `}</style>

      {/* ── LEFT: Agent list ─────────────────────────────────────── */}
      <div style={{
        width: 220, flexShrink: 0,
        borderRight: '1px solid #111827',
        display: 'flex', flexDirection: 'column',
        background: '#0A0E1A',
        overflowY: 'auto',
      }}>
        <div style={{ padding: '20px 16px 12px', fontSize: 9, fontWeight: 800, letterSpacing: '0.15em', color: '#2A3A52', textTransform: 'uppercase' }}>
          Agents disponibles
        </div>

        {AGENTS.map(agent => {
          const Icon = agent.icon
          const isActive = activeAgents.has(agent.id)
          const wasActive = lastActiveAgents.has(agent.id)
          return (
            <div key={agent.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 16px',
              borderLeft: `2px solid ${isActive ? agent.color : 'transparent'}`,
              background: isActive ? `${agent.color}08` : 'transparent',
              transition: 'all .3s',
            }}>
              <Icon
                size={15}
                strokeWidth={isActive ? 2 : 1.5}
                color={isActive ? agent.color : '#2A3A52'}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: isActive ? 600 : 400, color: isActive ? agent.color : '#4A5A7A', transition: 'color .3s', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {agent.name}
                </div>
                <div style={{ fontSize: 9, color: '#2A3A52', marginTop: 1 }}>{agent.desc}</div>
              </div>
              {isActive && (
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: agent.color, flexShrink: 0, boxShadow: `0 0 6px ${agent.color}` }} />
              )}
            </div>
          )
        })}
      </div>

      {/* ── RIGHT: Conversation ──────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 20px',
          borderBottom: '1px solid #111827',
          background: '#0A0E1A',
        }}>
          <Brain size={16} color="#00D4FF" strokeWidth={1.5} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#E2E8F0', letterSpacing: '0.05em' }}>
            ORCHESTRATOR
          </span>
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
            padding: '3px 8px', borderRadius: 4,
            background: `${STATE_COLORS[v.state]}15`,
            border: `1px solid ${STATE_COLORS[v.state]}40`,
            color: STATE_COLORS[v.state],
            marginLeft: 4, transition: 'all .3s',
          }}>
            {STATE_LABELS[v.state]}
          </span>
          {v.open && (
            <button onClick={handleClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#2A3A52', display: 'flex', alignItems: 'center' }}>
              <X size={16} />
            </button>
          )}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Empty state */}
          {v.history.length === 0 && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, opacity: .35 }}>
              <Brain size={48} color="#00D4FF" strokeWidth={1} />
              <div style={{ fontSize: 13, color: '#4A5A7A', textAlign: 'center', lineHeight: 1.6 }}>
                {v.open
                  ? 'Escoltant… digues quelcom'
                  : 'Prem el micròfon per iniciar la conversa'}
              </div>
            </div>
          )}

          {/* Message list */}
          {v.history.map((msg, i) => (
            <div key={i} style={{
              display: 'flex',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              gap: 10,
              animation: 'orch-fade-in .3s ease both',
            }}>
              {msg.role === 'jarvis' && (
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#00D4FF15', border: '1px solid #00D4FF30', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                  <Brain size={13} color="#00D4FF" strokeWidth={1.5} />
                </div>
              )}
              <div style={{
                maxWidth: '72%',
                padding: '10px 14px',
                borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                background: msg.role === 'user' ? '#00D4FF15' : '#0D1325',
                border: `1px solid ${msg.role === 'user' ? '#00D4FF25' : '#111827'}`,
                fontSize: 13.5, lineHeight: 1.6,
                color: msg.role === 'user' ? '#A8D4E6' : '#C8D5E8',
              }}>
                {msg.text}
              </div>
            </div>
          ))}

          {/* Thinking indicator */}
          {v.state === 'thinking' && (
            <div style={{ display: 'flex', gap: 10, animation: 'orch-fade-in .2s ease both' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#00D4FF15', border: '1px solid #00D4FF30', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Brain size={13} color="#00D4FF" strokeWidth={1.5} />
              </div>
              <div style={{ padding: '10px 16px', background: '#0D1325', border: '1px solid #111827', borderRadius: '14px 14px 14px 4px', display: 'flex', gap: 5, alignItems: 'center' }}>
                {[0,1,2].map(n => (
                  <span key={n} style={{ width: 5, height: 5, borderRadius: '50%', background: '#00D4FF50', animation: `orch-pulse 1.2s ease ${n * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Voice controls ───────────────────────────────────── */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid #111827',
          background: '#0A0E1A',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>

          {/* Live transcript */}
          {v.state === 'listening' && v.transcript && (
            <div style={{
              padding: '8px 14px', borderRadius: 8,
              background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)',
              fontSize: 12, color: '#5A8EA8', fontStyle: 'italic', lineHeight: 1.4,
              animation: 'orch-fade-in .2s ease both',
            }}>
              "{v.transcript}"
            </div>
          )}

          {/* Error */}
          {v.error && (
            <div style={{
              padding: '7px 12px', borderRadius: 6,
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              fontSize: 11, color: '#EF4444',
            }}>
              {v.error}
            </div>
          )}

          {/* Mic row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <MicButton
              state={v.state}
              onClick={handleMicClick}
              disabled={v.state === 'thinking' || v.state === 'speaking'}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: STATE_COLORS[v.state], fontWeight: 600, letterSpacing: '0.08em', transition: 'color .3s' }}>
                {STATE_LABELS[v.state]}
              </div>
              <div style={{ fontSize: 10, color: '#2A3A52', marginTop: 2 }}>
                {v.state === 'idle' && !v.open && 'Prem per iniciar'}
                {v.state === 'idle' && v.open  && 'Prem per parlar'}
                {v.state === 'listening'        && 'Parla ara…'}
                {v.state === 'thinking'         && 'Processant…'}
                {v.state === 'speaking'         && 'Reproduint resposta…'}
              </div>
            </div>
            {/* Active agents mini-indicators */}
            <div style={{ display: 'flex', gap: 4 }}>
              {AGENTS.filter(a => activeAgents.has(a.id)).map(a => {
                const Icon = a.icon
                return (
                  <div key={a.id} title={a.name} style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: `${a.color}15`, border: `1px solid ${a.color}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={11} color={a.color} strokeWidth={1.5} />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
