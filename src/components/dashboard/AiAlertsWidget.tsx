'use client'

import { useState } from 'react'
import { AlertTriangle, AlertCircle, Info, ChevronDown, ChevronUp, X, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AiInsightSummary {
  id: string
  type: string
  severity: 'info' | 'warning' | 'critical'
  title: string
  entity_type: string | null
  entity_id: string | null
  created_at: string
}

interface Props {
  insights: AiInsightSummary[]
  onRunNow?: () => void
}

const SEVERITY_CONFIG = {
  critical: { icon: AlertCircle, color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', label: 'Crític' },
  warning:  { icon: AlertTriangle, color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', label: 'Avís' },
  info:     { icon: Info, color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', label: 'Info' },
}

export function AiAlertsWidget({ insights, onRunNow }: Props) {
  const [expanded, setExpanded] = useState(true)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [resolving, setResolving] = useState<string | null>(null)

  const visible = insights.filter(i => !dismissed.has(i.id))
  const critical = visible.filter(i => i.severity === 'critical')
  const warning = visible.filter(i => i.severity === 'warning')
  const info = visible.filter(i => i.severity === 'info')

  if (visible.length === 0) return null

  const handleResolve = async (id: string) => {
    setResolving(id)
    try {
      await fetch('/api/intelligence/insights', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, resolved: true }),
      })
      setDismissed(prev => new Set([...prev, id]))
    } catch {}
    setResolving(null)
  }

  return (
    <div className="ai-alerts-widget" style={{ marginBottom: '16px' }}>
      {/* Header */}
      <div
        className="ai-alerts-header"
        onClick={() => setExpanded(e => !e)}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px',
          background: critical.length > 0 ? '#FEF2F2' : '#FFFBEB',
          border: `1px solid ${critical.length > 0 ? '#FECACA' : '#FDE68A'}`,
          borderRadius: expanded ? '8px 8px 0 0' : '8px',
          cursor: 'pointer', userSelect: 'none',
        }}
      >
        <Zap size={14} strokeWidth={2.5} color={critical.length > 0 ? '#DC2626' : '#D97706'} />
        <span style={{ fontWeight: 600, fontSize: '13px', color: '#1B2B4B', flex: 1 }}>
          Intel·ligència AI
          {critical.length > 0 && (
            <span style={{ marginLeft: '8px', background: '#DC2626', color: '#fff', borderRadius: '4px', fontSize: '11px', padding: '1px 6px' }}>
              {critical.length} crític{critical.length !== 1 ? 's' : ''}
            </span>
          )}
          {warning.length > 0 && (
            <span style={{ marginLeft: '6px', background: '#D97706', color: '#fff', borderRadius: '4px', fontSize: '11px', padding: '1px 6px' }}>
              {warning.length} avís{warning.length !== 1 ? 'os' : ''}
            </span>
          )}
          {info.length > 0 && (
            <span style={{ marginLeft: '6px', background: '#2563EB', color: '#fff', borderRadius: '4px', fontSize: '11px', padding: '1px 6px' }}>
              {info.length} info
            </span>
          )}
        </span>
        {onRunNow && (
          <button
            onClick={e => { e.stopPropagation(); onRunNow() }}
            style={{ fontSize: '11px', color: '#6B7280', background: 'none', border: '1px solid #D1D5DB', borderRadius: '4px', padding: '2px 8px', cursor: 'pointer' }}
          >
            Actualitzar
          </button>
        )}
        {expanded ? <ChevronUp size={14} color="#6B7280" /> : <ChevronDown size={14} color="#6B7280" />}
      </div>

      {/* Alerts list */}
      {expanded && (
        <div style={{
          border: '1px solid #E5E7EB', borderTop: 'none', borderRadius: '0 0 8px 8px',
          background: '#fff', overflow: 'hidden',
        }}>
          {visible.map((insight, idx) => {
            const cfg = SEVERITY_CONFIG[insight.severity]
            const Icon = cfg.icon
            return (
              <div
                key={insight.id}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  padding: '10px 14px',
                  borderBottom: idx < visible.length - 1 ? '1px solid #F3F4F6' : 'none',
                  background: idx === 0 && insight.severity === 'critical' ? '#FFFAFA' : '#fff',
                }}
              >
                <Icon size={14} strokeWidth={2} color={cfg.color} style={{ marginTop: '2px', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: '13px', color: '#1B2B4B', fontWeight: 500 }}>{insight.title}</span>
                  <span style={{ fontSize: '11px', color: '#9CA3AF', marginLeft: '8px' }}>
                    {new Date(insight.created_at).toLocaleDateString('ca-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <button
                  onClick={() => handleResolve(insight.id)}
                  disabled={resolving === insight.id}
                  title="Marcar com a resolt"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
                    color: '#9CA3AF', flexShrink: 0, opacity: resolving === insight.id ? 0.5 : 1,
                  }}
                >
                  <X size={13} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
