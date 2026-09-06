'use client'

import { useMemo, useState, useEffect } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, ReferenceLine, ComposedChart,
} from 'recharts'

interface Opportunity {
  id: string
  client_name: string
  stage: string
  value: number
  probability: number
  close_date?: string
  responsible_id?: string
  created_at: string
}

interface StageConfig {
  key: string
  label: string
  color: string
}

interface Props {
  opportunities: Opportunity[]
  goal2026?: number
  goal2027?: number
  accentColor?: string
  stages?: StageConfig[]
  recurringByMonth?: number[]
}

const DEFAULT_STAGES: StageConfig[] = [
  { key: 'prospect',       label: 'Lead',        color: '#9A9A9A' },
  { key: 'contactat',      label: 'Contactat',   color: '#254067' },
  { key: 'qualificat',     label: 'Qualificat',  color: '#06B6D4' },
  { key: 'proposta',       label: 'Proposta',    color: '#3a6fa8' },
  { key: 'negociacio',     label: 'Negociació',  color: '#F59E0B' },
  { key: 'tancant',        label: 'Tancament',   color: '#F97316' },
  { key: 'tancat_guanyat', label: 'Guanyat',     color: '#16A34A' },
  { key: 'tancat_perdut',  label: 'Perdut',      color: '#DC2626' },
]

const FINANCES_KEY = 'guinew_finances_v2'
const KNOWN_ACCOUNTING_TOTALS = [13848.5, 11906.4, 27104.9, 19124.04, 32503.75, 44252, 25373.44, 20782.06, 0, 0, 0, 0]

export function AnalisiContent({
  opportunities,
  goal2026 = 300000,
  goal2027 = 1000000,
  accentColor = '#254067',
  stages: stagesProp,
  recurringByMonth: recurringByMonthProp,
}: Props) {
  const STAGES = stagesProp ?? DEFAULT_STAGES
  const now = new Date()

  const [accountingTotals, setAccountingTotals] = useState<number[]>(KNOWN_ACCOUNTING_TOTALS)
  useEffect(() => {
    if (recurringByMonthProp) return
    try {
      const raw = localStorage.getItem(FINANCES_KEY)
      const saved: number[] = raw ? (JSON.parse(raw).monthlyAccountingTotals ?? []) : []
      const merged = KNOWN_ACCOUNTING_TOTALS.map((def, i) =>
        (!saved[i] || saved[i] === 0) ? def : saved[i]
      )
      setAccountingTotals(merged)
    } catch {
      setAccountingTotals(KNOWN_ACCOUNTING_TOTALS)
    }
  }, [recurringByMonthProp])

  const byStage = useMemo(() => {
    const map: Record<string, Opportunity[]> = {}
    for (const o of opportunities) {
      if (!map[o.stage]) map[o.stage] = []
      map[o.stage].push(o)
    }
    return map
  }, [opportunities])

  const analyticsData = useMemo(() => {
    const year = now.getFullYear()
    const MONTHS = ['Gen','Feb','Mar','Abr','Mai','Jun','Jul','Ago','Set','Oct','Nov','Des']

    const effectiveAccounting = recurringByMonthProp ? null : accountingTotals
    const monthlyRevenue = MONTHS.map((m, i) => {
      const val = opportunities
        .filter(o => o.stage === 'tancat_guanyat' && o.close_date)
        .filter(o => { const d = new Date(o.close_date!); return d.getFullYear() === year && d.getMonth() === i })
        .reduce((s, o) => s + (Number(o.value) || 0), 0)
      const recurrent = recurringByMonthProp
        ? (recurringByMonthProp[i] ?? 0)
        : Math.max(0, (effectiveAccounting![i] ?? 0) - val)
      return { mes: m, valor: val, recurrent }
    })

    const activeStages = STAGES.filter(s => !['tancat_guanyat', 'tancat_perdut'].includes(s.key))
    const pipelineByStage = activeStages.map(s => ({
      etapa: s.label,
      valor: (byStage[s.key] || []).reduce((acc, o) => acc + (Number(o.value) || 0), 0),
      color: s.color,
    })).filter(d => d.valor > 0)

    const funnelData = activeStages.map(s => ({
      etapa: s.label,
      count: (byStage[s.key] || []).length,
      color: s.color,
    })).filter(d => d.count > 0)

    const won = opportunities.filter(o => o.stage === 'tancat_guanyat').length
    const lost = opportunities.filter(o => o.stage === 'tancat_perdut').length
    const winRate = [
      { name: 'Guanyat', value: won, color: '#16A34A' },
      { name: 'Perdut', value: lost, color: '#DC2626' },
    ].filter(d => d.value > 0)

    const GOAL_2026 = goal2026
    const GOAL_2027 = goal2027
    const ytdRevenue = opportunities
      .filter(o => o.stage === 'tancat_guanyat' && o.close_date)
      .filter(o => new Date(o.close_date!).getFullYear() === year)
      .reduce((s, o) => s + (Number(o.value) || 0), 0)

    const cumulativeData = MONTHS.map((m, i) => {
      const cumVal = opportunities
        .filter(o => o.stage === 'tancat_guanyat' && o.close_date)
        .filter(o => { const d = new Date(o.close_date!); return d.getFullYear() === year && d.getMonth() <= i })
        .reduce((s, o) => s + (Number(o.value) || 0), 0)
      return { mes: m, acumulat: cumVal }
    })

    const hasRecurring = monthlyRevenue.some(m => m.recurrent > 0)
    return { monthlyRevenue, pipelineByStage, funnelData, winRate, won, lost, ytdRevenue, GOAL_2026, GOAL_2027, cumulativeData, hasRecurring }
  }, [opportunities, byStage, goal2026, goal2027, recurringByMonthProp, accountingTotals])

  const [accions, setAccions] = useState<{ client: string; accio: string; urgencia: string; motiu: string }[]>([])
  const [loadingAccions, setLoadingAccions] = useState(true)

  useEffect(() => {
    fetch('/api/analisi/accions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ opportunities }),
    })
      .then(r => r.json())
      .then(d => setAccions(d.accions ?? []))
      .finally(() => setLoadingAccions(false))
  }, [])

  const kpiData = useMemo(() => {
    const m = now.getMonth()
    const y = now.getFullYear()

    const possiblesClientsMes = opportunities.filter(o => {
      const d = new Date(o.created_at)
      return d.getFullYear() === y && d.getMonth() === m && !['tancat_guanyat', 'tancat_perdut'].includes(o.stage)
    }).length

    const ingressosMes = opportunities
      .filter(o => {
        if (o.stage !== 'tancat_guanyat' || !o.close_date) return false
        const d = new Date(o.close_date)
        return d.getFullYear() === y && d.getMonth() === m
      })
      .reduce((s, o) => s + (Number(o.value) || 0), 0)

    const tractesEnProces = opportunities.filter(o =>
      !['tancat_guanyat', 'tancat_perdut'].includes(o.stage)
    ).length

    return { possiblesClientsMes, ingressosMes, tractesEnProces }
  }, [opportunities])

  return (
    <div className="analisi-page">
      <div className="kpi-section">
        <div className="kpi-left">
          <div className="kpi-card">
            <div className="kpi-label">Possibles clients aquest mes</div>
            <div className="kpi-value">{kpiData.possiblesClientsMes}</div>
            <div className="kpi-desc">noves oportunitats obertes</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Ingressos d&apos;aquest mes</div>
            <div className="kpi-value">
              {kpiData.ingressosMes >= 1000
                ? `€${(kpiData.ingressosMes / 1000).toFixed(1)}k`
                : `€${kpiData.ingressosMes}`}
            </div>
            <div className="kpi-desc">valor tancat amb èxit</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Tratos en procés</div>
            <div className="kpi-value">{kpiData.tractesEnProces}</div>
            <div className="kpi-desc">oportunitats actives</div>
          </div>
        </div>

        <div className="kpi-card kpi-accions-card">
          <div className="kpi-label">Properes accions</div>
          {loadingAccions ? (
            <div className="accions-loading">
              <div className="accions-loading-bar" />
              <div className="accions-loading-bar short" />
              <div className="accions-loading-bar" />
              <div className="accions-loading-bar short" />
              <div className="accions-loading-bar" />
            </div>
          ) : accions.length === 0 ? (
            <div className="accions-empty">Sense dades suficients</div>
          ) : (
            <ul className="accions-list">
              {accions.map((a, i) => (
                <li key={i} className="accio-item">
                  <span className={`urgencia-dot urgencia-${a.urgencia}`} />
                  <div className="accio-body">
                    <div className="accio-client">{a.client}</div>
                    <div className="accio-text">{a.accio}</div>
                    <div className="accio-motiu">{a.motiu}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="analytics-wrap">
        {/* Chart 1: Annual revenue line */}
        <div className="chart-card chart-wide">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 2 }}>
            <div>
              <div className="chart-title">Ingressos per mes ({now.getFullYear()})</div>
              <div className="chart-sub">Tancaments de vendes i ingressos recurrents</div>
            </div>
            <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#8A94A6', fontWeight: 600 }}>
                <div style={{ width: 24, height: 3, background: accentColor, borderRadius: 2 }} />
                Tancaments
              </div>
              {analyticsData.hasRecurring && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#8A94A6', fontWeight: 600 }}>
                  <div style={{ width: 24, height: 3, background: '#16A34A', borderRadius: 2 }} />
                  Recurrents
                </div>
              )}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={analyticsData.monthlyRevenue} margin={{ top: 12, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accentColor} stopOpacity={0.18} />
                  <stop offset="90%" stopColor={accentColor} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="areaFillRec" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#16A34A" stopOpacity={0.15} />
                  <stop offset="90%" stopColor="#16A34A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FA" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#A0A9BB' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#A0A9BB' }} axisLine={false} tickLine={false}
                tickFormatter={v => v >= 1000 ? `€${v/1000}k` : `€${v}`} />
              <Tooltip
                formatter={(v, name) => [`€${Number(v).toLocaleString('ca-ES')}`, name === 'recurrent' ? 'Recurrents' : 'Tancaments']}
                contentStyle={{ fontSize: 12.5, borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: '10px 14px', fontWeight: 600, color: '#1B2B4B' }}
                labelStyle={{ fontSize: 11, color: '#A0A9BB', fontWeight: 500, marginBottom: 2 }}
                cursor={{ stroke: '#254067', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area type="monotone" dataKey="valor" stroke={accentColor} strokeWidth={2.5}
                fill="url(#areaFill)"
                dot={{ r: 3, fill: accentColor, strokeWidth: 2, stroke: 'white' }}
                activeDot={{ r: 5, fill: accentColor, strokeWidth: 2, stroke: 'white' }} />
              {analyticsData.hasRecurring && (
                <Area type="monotone" dataKey="recurrent" stroke="#16A34A" strokeWidth={2}
                  fill="url(#areaFillRec)" strokeDasharray="5 3"
                  dot={{ r: 3, fill: '#16A34A', strokeWidth: 2, stroke: 'white' }}
                  activeDot={{ r: 5, fill: '#16A34A', strokeWidth: 2, stroke: 'white' }} />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 2: Pipeline value by active stage */}
        <div className="chart-card">
          <div className="chart-title">Valor d&apos;interès futur per etapa</div>
          <div className="chart-sub">Oportunitats actives no tancades</div>
          {analyticsData.pipelineByStage.length === 0 ? (
            <div className="chart-empty">Sense oportunitats actives</div>
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={analyticsData.pipelineByStage} margin={{ top: 12, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  {[
                    ['#60A5FA','#1a2e4a'], ['#3a6fa8','#1a2e4a'], ['#FB923C','#C2410C'],
                    ['#34D399','#059669'], ['#F472B6','#BE185D'], ['#38BDF8','#0369A1'],
                  ].map(([top, bot], idx) => (
                    <linearGradient key={idx} id={`abg${idx}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={top} />
                      <stop offset="100%" stopColor={bot} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FA" vertical={false} />
                <XAxis dataKey="etapa" tick={{ fontSize: 10, fill: '#A0A9BB' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#A0A9BB' }} axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1000 ? `€${v/1000}k` : `€${v}`} />
                <Tooltip
                  formatter={(v) => [`€${Number(v).toLocaleString('ca-ES')}`, 'Valor']}
                  contentStyle={{ fontSize: 12.5, borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: '10px 14px', fontWeight: 600, color: '#1B2B4B' }}
                  cursor={{ fill: 'rgba(37, 99, 235, 0.05)' }}
                />
                <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
                  {analyticsData.pipelineByStage.map((_, i) => (
                    <Cell key={i} fill={`url(#abg${i % 6})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Chart 3: Funnel by count */}
        <div className="chart-card">
          <div className="chart-title">Distribució del pipeline</div>
          <div className="chart-sub">Nombre d&apos;oportunitats per etapa</div>
          {analyticsData.funnelData.length === 0 ? (
            <div className="chart-empty">Sense dades</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '14px 0' }}>
              {(() => {
                const maxCount = Math.max(...analyticsData.funnelData.map(d => d.count), 1)
                return analyticsData.funnelData.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 11.5, color: '#8A94A6', width: 86, flexShrink: 0, textAlign: 'right', fontWeight: 500 }}>{d.etapa}</span>
                    <div style={{ flex: 1, background: '#F0F4FA', borderRadius: 8, height: 22, overflow: 'hidden' }}>
                      <div style={{
                        width: `${(d.count / maxCount) * 100}%`, height: '100%',
                        background: `linear-gradient(90deg, ${d.color}99, ${d.color})`,
                        borderRadius: 8, transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)'
                      }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: d.color, width: 20, flexShrink: 0 }}>{d.count}</span>
                  </div>
                ))
              })()}
            </div>
          )}
        </div>

        {/* Chart 5: Objectiu anual */}
        {(() => {
          const { ytdRevenue, GOAL_2026, GOAL_2027 } = analyticsData
          const fmt = (v: number) =>
            v >= 1000000 ? `€${(v/1000000).toFixed(v % 1000000 === 0 ? 0 : 1)}M`
            : v >= 1000 ? `€${(v/1000).toFixed(0)}k` : `€${v}`
          const fmtFull = (v: number) => `€${v.toLocaleString('ca-ES')}`

          function GoalChart({ label, achieved, goal, color }: { label: string; achieved: number; goal: number; color: string }) {
            const MAX = goal * 1.25
            const ticks = Array.from({ length: 7 }, (_, i) => Math.round((MAX / 6) * i))
            const achievedPct = Math.min((achieved / MAX) * 100, 100)
            const goalPct = (goal / MAX) * 100
            return (
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#1B2B4B', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 18 }}>
                  {label}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontSize: 11.5, color: '#8A94A6', width: 130, flexShrink: 0, textAlign: 'right', fontWeight: 500 }}>Tota l&apos;organització</span>
                  <div style={{ flex: 1, position: 'relative', height: 44 }}>
                    {/* Track */}
                    <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: 0, right: 0, height: 32, background: '#EBEBEB', borderRadius: 6, overflow: 'visible' }}>
                      {/* Achieved fill */}
                      <div style={{ width: `${achievedPct}%`, height: '100%', background: color, borderRadius: 6, transition: 'width 0.8s ease' }} />
                      {/* Goal vertical line */}
                      <div style={{ position: 'absolute', top: -8, bottom: -8, left: `${goalPct}%`, width: 2, background: '#1B2B4B', transform: 'translateX(-50%)' }}>
                        <div style={{ position: 'absolute', top: '50%', left: 6, transform: 'translateY(-50%)', fontSize: 10, fontWeight: 700, color: '#1B2B4B', whiteSpace: 'nowrap', background: 'white', padding: '2px 4px', borderRadius: 3, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
                          Objectiu: {fmtFull(goal)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* X axis ticks */}
                <div style={{ display: 'flex', marginLeft: 148, marginTop: 6 }}>
                  {ticks.map((t, i) => (
                    <div key={i} style={{ flex: 1, textAlign: i === 0 ? 'left' : 'right', fontSize: 10, color: '#B0B8C8', fontWeight: 500, position: 'relative' }}>
                      {i < ticks.length - 1 && <div style={{ position: 'absolute', top: -34, left: i === 0 ? 0 : 'auto', right: i === 0 ? 'auto' : 0, width: 1, height: 6, background: '#E0E4EA' }} />}
                      {fmt(t)}
                    </div>
                  ))}
                </div>
                <div style={{ marginLeft: 148, marginTop: 10, fontSize: 11, color: '#8A94A6', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: color, flexShrink: 0 }} />
                  Assolit · {fmtFull(achieved)}
                </div>
              </div>
            )
          }

          return (
            <div className="chart-card chart-wide">
              <GoalChart
                label={`Objectiu d'ingressos - ${now.getFullYear()}`}
                achieved={ytdRevenue}
                goal={GOAL_2026}
                color="#4ADE80"
              />
              <GoalChart
                label="Objectiu d'ingressos - 2027"
                achieved={ytdRevenue}
                goal={GOAL_2027}
                color="#60A5FA"
              />
            </div>
          )
        })()}

        {/* Chart 4: Win rate */}
        <div className="chart-card chart-wide">
          <div className="chart-title">Taxa de guany</div>
          <div className="chart-sub">Deals tancats: guanyats vs perduts</div>
          {analyticsData.winRate.length === 0 ? (
            <div className="chart-empty">Sense deals tancats</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 28, paddingTop: 14 }}>
              <div style={{ position: 'relative', filter: 'drop-shadow(0 4px 12px rgba(22, 163, 74, 0.18))' }}>
                <ResponsiveContainer width={150} height={150}>
                  <PieChart>
                    <defs>
                      <linearGradient id="awonPieGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#34D399" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                      <linearGradient id="alostPieGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#FCA5A5" />
                        <stop offset="100%" stopColor="#DC2626" />
                      </linearGradient>
                    </defs>
                    <Pie data={analyticsData.winRate} cx="50%" cy="50%" innerRadius={44} outerRadius={68}
                      dataKey="value" paddingAngle={3} strokeWidth={0}>
                      {analyticsData.winRate.map((_, i) => (
                        <Cell key={i} fill={`url(#${i === 0 ? 'awonPieGrad' : 'alostPieGrad'})`} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [v, 'deals']}
                      contentStyle={{ fontSize: 12.5, borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: '10px 14px' }} />
                  </PieChart>
                </ResponsiveContainer>
                {analyticsData.won + analyticsData.lost > 0 && (
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#0F1B2D', letterSpacing: '-0.5px', lineHeight: 1 }}>
                      {Math.round((analyticsData.won / (analyticsData.won + analyticsData.lost)) * 100)}%
                    </div>
                    <div style={{ fontSize: 9, color: '#8A94A6', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 2 }}>win rate</div>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #34D399, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: 'white' }}>{analyticsData.won}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#8A94A6', fontWeight: 500 }}>Guanyat</div>
                    <div style={{ fontSize: 10, color: '#34D399', fontWeight: 600 }}>deals tancats</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #FCA5A5, #DC2626)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: 'white' }}>{analyticsData.lost}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#8A94A6', fontWeight: 500 }}>Perdut</div>
                    <div style={{ fontSize: 10, color: '#DC2626', fontWeight: 600 }}>deals perduts</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .analisi-page {
          padding: 0 32px 40px;
        }

        .fin-section {
          padding-top: 28px;
          margin-bottom: 4px;
        }
        .fin-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
        }
        .fin-title {
          font-size: 11px;
          font-weight: 800;
          color: #A0A9BB;
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }
        .fin-period {
          font-size: 11px;
          color: #C0C8D6;
          font-weight: 500;
        }
        .fin-years {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
          gap: 16px;
        }
        .fin-year-col {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .fin-year-label {
          font-size: 12px;
          font-weight: 700;
          color: #1B2B4B;
          letter-spacing: -0.2px;
          padding-bottom: 2px;
          border-bottom: 2px solid #F0F4FA;
        }
        .fin-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        .fin-card {
          background: white;
          border: 1px solid rgba(0,0,0,0.06);
          border-radius: 14px;
          padding: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .fin-card-icon {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .fin-icon-blue { background: #EFF6FF; color: #3B82F6; }
        .fin-icon-red  { background: #FEF2F2; color: #EF4444; }
        .fin-icon-green{ background: #F0FDF4; color: #16A34A; }
        .fin-card-body { display: flex; flex-direction: column; gap: 3px; }
        .fin-card-label {
          font-size: 10px;
          font-weight: 700;
          color: #A0A9BB;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .fin-card-value {
          font-size: 17px;
          font-weight: 800;
          color: #0F1B2D;
          letter-spacing: -0.5px;
          line-height: 1.1;
        }
        .fin-value-green { color: #16A34A; }
        .fin-card-sub {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin-top: 2px;
        }
        .fin-pill {
          font-size: 10px;
          font-weight: 600;
          padding: 2px 7px;
          border-radius: 20px;
        }
        .fin-pill-green { background: #F0FDF4; color: #16A34A; }
        .fin-pill-amber { background: #FFFBEB; color: #D97706; }
        .fin-pill-gray  { background: #F1F5F9; color: #64748B; }

        /* Primary year: bigger cards */
        .fin-cards-primary { grid-template-columns: repeat(3, 1fr); gap: 14px; }
        .fin-card-lg { padding: 20px 22px; }
        .fin-card-value-lg { font-size: 24px; }

        /* Secondary year: compact row */
        .fin-secondary-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 10px;
          padding: 10px 16px;
          background: #F8FAFC;
          border-radius: 12px;
          flex-wrap: wrap;
        }
        .fin-secondary-label {
          font-size: 10px;
          font-weight: 800;
          color: #B0B8C8;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          flex-shrink: 0;
        }
        .fin-secondary-group {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .fin-secondary-year {
          font-size: 11px;
          font-weight: 700;
          color: #8A94A6;
          margin-right: 2px;
        }
        .fin-secondary-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .fin-secondary-key {
          font-size: 11px;
          color: #B0B8C8;
          font-weight: 500;
        }
        .fin-secondary-val {
          font-size: 12px;
          font-weight: 700;
          color: #4A5568;
        }
        .fin-secondary-green { color: #16A34A; }
        .fin-secondary-dot { color: #D0D8E4; font-size: 13px; }

        /* Client revenue section */
        .fin-client-section { margin-bottom: 4px; }
        .fin-client-chart { padding: 18px 22px; }
        .fin-client-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 5px 0;
        }
        .fin-client-name {
          font-size: 12px;
          font-weight: 600;
          color: #4A5568;
          width: 190px;
          flex-shrink: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .fin-client-bar-wrap {
          flex: 1;
          height: 18px;
          background: #F0F4FA;
          border-radius: 4px;
          overflow: hidden;
        }
        .fin-client-bar {
          height: 100%;
          background: linear-gradient(90deg, #3a6fa8, #254067);
          border-radius: 4px;
          transition: width 0.6s cubic-bezier(0.4,0,0.2,1);
          min-width: 4px;
        }
        .fin-client-val {
          font-size: 12px;
          font-weight: 700;
          color: #254067;
          width: 70px;
          text-align: right;
          flex-shrink: 0;
        }

        .kpi-section {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 16px;
          padding-top: 28px;
          margin-bottom: 20px;
        }
        .kpi-left {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          align-content: start;
        }
        .kpi-card {
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 18px;
          padding: 22px 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        .kpi-accions-card {
          display: flex;
          flex-direction: column;
          min-height: 160px;
        }
        .kpi-label {
          font-size: 11px;
          font-weight: 700;
          color: #A0A9BB;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          margin-bottom: 12px;
        }
        .kpi-value {
          font-size: 34px;
          font-weight: 800;
          color: #0F1B2D;
          letter-spacing: -1px;
          line-height: 1;
          margin-bottom: 6px;
        }
        .kpi-desc {
          font-size: 12px;
          color: #C0C8D6;
          font-weight: 500;
        }
        .accions-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin: 0;
          padding: 0;
          flex: 1;
        }
        .accio-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }
        .urgencia-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
          margin-top: 4px;
        }
        .urgencia-alta { background: #EF4444; box-shadow: 0 0 6px rgba(239,68,68,0.4); }
        .urgencia-mitja { background: #F59E0B; }
        .urgencia-baixa { background: #10B981; }
        .accio-body { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
        .accio-client { font-size: 12px; font-weight: 700; color: #0F1B2D; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .accio-text { font-size: 12px; color: #4A5568; line-height: 1.35; }
        .accio-motiu { font-size: 10.5px; color: #A0A9BB; font-weight: 500; margin-top: 1px; }
        .accions-loading {
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex: 1;
          padding-top: 4px;
        }
        .accions-loading-bar {
          height: 12px;
          background: linear-gradient(90deg, #F0F4FA 25%, #E2E8F0 50%, #F0F4FA 75%);
          background-size: 200% 100%;
          border-radius: 6px;
          animation: shimmer 1.5s infinite;
        }
        .accions-loading-bar.short { width: 65%; }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .accions-empty { font-size: 12px; color: #C8D0DC; padding: 24px 0; text-align: center; }

        .section-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 28px 0 14px 0; margin-top: 8px;
          position: relative;
        }
        .section-header::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(to right, #1B2B4B22, #1B2B4B08, transparent);
        }
        .section-title {
          font-size: 17px; font-weight: 800; color: #1B2B4B; letter-spacing: -0.5px;
          display: flex; align-items: center; gap: 10px;
        }
        .section-title::before {
          content: ''; display: block; width: 4px; height: 18px;
          background: #1B2B4B; border-radius: 2px;
        }

        .analytics-wrap {
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: auto auto;
          gap: 20px;
        }
        .chart-card {
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 18px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
          transition: box-shadow 0.2s ease, transform 0.2s ease;
        }
        .chart-card:hover {
          box-shadow: 0 8px 28px rgba(0, 0, 0, 0.09), 0 2px 6px rgba(0, 0, 0, 0.04);
          transform: translateY(-1px);
        }
        .chart-wide { grid-column: 1 / -1; }
        .chart-title { font-size: 15px; font-weight: 700; color: #0F1B2D; letter-spacing: -0.3px; }
        .chart-sub { font-size: 12px; color: #A0A9BB; margin-top: 3px; margin-bottom: 18px; font-weight: 500; }
        .chart-empty { font-size: 12px; color: #C8D0DC; text-align: center; padding: 48px 0; }

        @media (max-width: 900px) {
          .analisi-page { padding: 0 16px 32px; }
          .analytics-wrap { grid-template-columns: 1fr; }
          .chart-wide { grid-column: auto; }
        }
      `}</style>
    </div>
  )
}
