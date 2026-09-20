'use client'

import { useState } from 'react'
import {
  Zap, AlertCircle, AlertTriangle, Info, CheckCircle2,
  Clock, PlayCircle, ThumbsUp, ThumbsDown, Loader2, X, RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Severity = 'critical' | 'warning' | 'info'
type RecStatus = 'pending' | 'approved' | 'rejected' | 'executed' | 'failed'

interface AiInsight {
  id: string
  type: string
  severity: Severity
  title: string
  summary: string
  evidence: Record<string, unknown>
  entity_type: string | null
  entity_id: string | null
  source: string
  created_at: string
}

interface AiRecommendation {
  id: string
  insight_id: string
  action_type: string
  title: string
  rationale: string
  payload: Record<string, unknown>
  requires_approval: boolean
  status: RecStatus
  created_at: string
  insight?: { title: string; severity: string; type: string } | null
}

interface AiRun {
  id: string
  trigger: string
  status: string
  insights_created: number
  duration_ms: number | null
  started_at: string
  completed_at: string | null
  error: string | null
}

interface Props {
  insights: AiInsight[]
  recommendations: AiRecommendation[]
  runs: AiRun[]
  currentUserId: string
  userRole?: string
}

const SEV_CFG: Record<Severity, { icon: React.ElementType; color: string; bg: string; border: string; label: string }> = {
  critical: { icon: AlertCircle,   color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', label: 'Crític'  },
  warning:  { icon: AlertTriangle, color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', label: 'Avís'    },
  info:     { icon: Info,          color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', label: 'Info'    },
}

type ActiveTab = 'insights' | 'recommendations' | 'runs'

export function IntelligenceDashboard({ insights: initial, recommendations: initRecs, runs: initRuns, currentUserId, userRole }: Props) {
  const [tab, setTab] = useState<ActiveTab>('insights')
  const [insights, setInsights] = useState(initial)
  const [recommendations, setRecommendations] = useState(initRecs)
  const [runs] = useState(initRuns)
  const [running, setRunning] = useState(false)
  const [runMsg, setRunMsg] = useState('')
  const [resolving, setResolving] = useState<string | null>(null)
  const [actioning, setActioning] = useState<string | null>(null)

  const isSuperAdmin = userRole === 'superadmin'

  const handleRunNow = async () => {
    setRunning(true)
    setRunMsg('')
    try {
      const res = await fetch('/api/intelligence/run', { method: 'POST' })
      const d = await res.json()
      if (res.ok) {
        setRunMsg(`✓ ${d.insights_created ?? 0} nous insights en ${d.duration_ms ?? 0}ms`)
        setTimeout(() => window.location.reload(), 1500)
      } else {
        setRunMsg(`Error: ${d.error}`)
      }
    } catch (e: any) {
      setRunMsg(`Error: ${e.message}`)
    }
    setRunning(false)
  }

  const handleResolve = async (id: string) => {
    setResolving(id)
    await fetch('/api/intelligence/insights', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, resolved: true }),
    })
    setInsights(prev => prev.filter(i => i.id !== id))
    setResolving(null)
  }

  const handleRecommendation = async (id: string, action: 'approve' | 'reject') => {
    setActioning(id)
    await fetch('/api/intelligence/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, id }),
    })
    setRecommendations(prev => prev.filter(r => r.id !== id))
    setActioning(null)
  }

  const critical = insights.filter(i => i.severity === 'critical')
  const warning  = insights.filter(i => i.severity === 'warning')
  const info     = insights.filter(i => i.severity === 'info')

  return (
    <div style={{ flex: 1, padding: '24px 28px 60px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '960px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1B2B4B' }}>Intel·ligència AI</h1>
          <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '2px' }}>
            Detectors automàtics · actualització diària a les 7:00 UTC
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {runMsg && <span style={{ fontSize: '12px', color: runMsg.startsWith('✓') ? '#16A34A' : '#DC2626' }}>{runMsg}</span>}
          <button
            onClick={handleRunNow}
            disabled={running}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 500,
              background: '#1B2B4B', color: '#fff', border: 'none', borderRadius: '7px',
              padding: '8px 16px', cursor: running ? 'not-allowed' : 'pointer', opacity: running ? 0.7 : 1,
            }}
          >
            {running ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={13} />}
            {running ? 'Executant...' : 'Executar ara'}
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {[
          { label: 'Crítics', value: critical.length, color: '#DC2626', bg: '#FEF2F2' },
          { label: 'Avisos', value: warning.length, color: '#D97706', bg: '#FFFBEB' },
          { label: 'Informatius', value: info.length, color: '#2563EB', bg: '#EFF6FF' },
          { label: 'Recomanacions', value: recommendations.length, color: '#7C3AED', bg: '#F5F3FF' },
        ].map(k => (
          <div key={k.label} style={{ background: k.bg, border: `1px solid ${k.color}22`, borderRadius: '10px', padding: '14px 16px' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid #E5E7EB', paddingBottom: '0' }}>
        {([
          { key: 'insights', label: `Insights (${insights.length})` },
          { key: 'recommendations', label: `Recomanacions (${recommendations.length})` },
          { key: 'runs', label: `Historial (${runs.length})` },
        ] as { key: ActiveTab; label: string }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              fontSize: '13px', fontWeight: tab === t.key ? 600 : 400,
              color: tab === t.key ? '#1B2B4B' : '#6B7280',
              background: 'none', border: 'none', borderBottom: tab === t.key ? '2px solid #1B2B4B' : '2px solid transparent',
              padding: '8px 16px', cursor: 'pointer', marginBottom: '-1px',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Insights tab */}
      {tab === 'insights' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {insights.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#6B7280' }}>
              <CheckCircle2 size={32} color="#16A34A" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: '14px' }}>Cap alerta activa. Tot sota control.</p>
            </div>
          ) : insights.map(ins => {
            const cfg = SEV_CFG[ins.severity]
            const Icon = cfg.icon
            return (
              <div key={ins.id} style={{
                background: '#fff', border: '1px solid #E5E7EB', borderLeft: `3px solid ${cfg.color}`,
                borderRadius: '8px', padding: '14px 16px', display: 'flex', gap: '12px', alignItems: 'flex-start',
              }}>
                <Icon size={15} color={cfg.color} strokeWidth={2} style={{ marginTop: '2px', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#1B2B4B' }}>{ins.title}</span>
                    <span style={{
                      fontSize: '10px', background: cfg.bg, color: cfg.color,
                      border: `1px solid ${cfg.border}`, borderRadius: '4px', padding: '1px 6px',
                    }}>{cfg.label}</span>
                    {ins.entity_type && (
                      <span style={{ fontSize: '10px', color: '#9CA3AF', background: '#F3F4F6', borderRadius: '4px', padding: '1px 6px' }}>
                        {ins.entity_type}
                      </span>
                    )}
                  </div>
                  {ins.summary && <p style={{ fontSize: '12px', color: '#6B7280', margin: '0 0 4px' }}>{ins.summary}</p>}
                  <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0 }}>
                    {new Date(ins.created_at).toLocaleString('ca-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    {' · '}{ins.type.replace(/_/g, ' ')}
                  </p>
                </div>
                {isSuperAdmin && (
                  <button
                    onClick={() => handleResolve(ins.id)}
                    disabled={resolving === ins.id}
                    title="Marcar com a resolt"
                    style={{ background: 'none', border: '1px solid #E5E7EB', borderRadius: '5px', padding: '4px 8px', cursor: 'pointer', color: '#6B7280', flexShrink: 0 }}
                  >
                    {resolving === ins.id ? <Loader2 size={12} /> : <X size={12} />}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Recommendations tab */}
      {tab === 'recommendations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {recommendations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#6B7280' }}>
              <Zap size={32} color="#D1D5DB" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: '14px' }}>Cap recomanació pendent d'aprovació.</p>
            </div>
          ) : recommendations.map(rec => (
            <div key={rec.id} style={{
              background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '14px 16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <PlayCircle size={15} color="#7C3AED" strokeWidth={2} style={{ marginTop: '2px', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#1B2B4B', margin: '0 0 2px' }}>{rec.title}</p>
                  {rec.rationale && <p style={{ fontSize: '12px', color: '#6B7280', margin: '0 0 4px' }}>{rec.rationale}</p>}
                  {rec.insight && (
                    <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0 }}>
                      Relacionat amb: {rec.insight.title}
                    </p>
                  )}
                  <p style={{ fontSize: '11px', color: '#9CA3AF', margin: '4px 0 0' }}>
                    Acció: <code style={{ background: '#F3F4F6', padding: '1px 4px', borderRadius: '3px' }}>{rec.action_type}</code>
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button
                    onClick={() => handleRecommendation(rec.id, 'approve')}
                    disabled={actioning === rec.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 500,
                      background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0',
                      borderRadius: '6px', padding: '5px 10px', cursor: 'pointer',
                    }}
                  >
                    <ThumbsUp size={12} /> Aprovar
                  </button>
                  <button
                    onClick={() => handleRecommendation(rec.id, 'reject')}
                    disabled={actioning === rec.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 500,
                      background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA',
                      borderRadius: '6px', padding: '5px 10px', cursor: 'pointer',
                    }}
                  >
                    <ThumbsDown size={12} /> Rebutjar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Runs tab */}
      {tab === 'runs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {runs.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#6B7280', textAlign: 'center', padding: '32px' }}>
              Cap execució registrada. Executa els detectors per primera vegada.
            </p>
          ) : runs.map(run => (
            <div key={run.id} style={{
              background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px',
              padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                background: run.status === 'completed' ? '#16A34A' : run.status === 'failed' ? '#DC2626' : '#D97706',
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#1B2B4B' }}>
                  {run.trigger} · {run.insights_created} insights
                </span>
                {run.error && <p style={{ fontSize: '11px', color: '#DC2626', margin: '2px 0 0' }}>{run.error}</p>}
              </div>
              <div style={{ fontSize: '11px', color: '#9CA3AF', textAlign: 'right' }}>
                <div>{new Date(run.started_at).toLocaleString('ca-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                {run.duration_ms && <div>{run.duration_ms}ms</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
