'use client'

import { useState, useMemo } from 'react'
import { Plus, Trash2, Save, ChevronDown, ChevronUp, AlertTriangle, CheckCircle } from 'lucide-react'

export interface Ingres {
  id: string
  data: string
  clientName: string
  numFactura: string
  concepte: string
  base: number
  ivaPct: number
  iva: number
  total: number
  estat: 'Pendent' | 'Cobrat'
}

export interface GastoFiscal {
  id: string
  data: string
  proveidor: string
  concepte: string
  base: number
  ivaPct: number
  iva: number
  ivaDeduiblePct: number
  ivaDeduible: number
  irpfPct: number
  irpf: number
  total: number
  estat: 'Pendent' | 'Pagat'
}

export interface FiscalLiquidacio {
  id: string
  impost: 'IVA' | 'IRPF' | 'IS' | 'Altres'
  periode: string
  dataVenciment: string
  importCalculat: number
  importPagat: number
  dataPagament: string
  estat: 'Pendent' | 'Pagat' | 'Compensat'
  notes: string
}

export interface FiscalConfig {
  isTax: number
  ivaGeneral: number
  taxStartDate: string
}

export interface FiscalData {
  ingressos: Ingres[]
  gastos: GastoFiscal[]
  liquidacions: FiscalLiquidacio[]
  config: FiscalConfig
}

export const DEFAULT_FISCAL_CONFIG: FiscalConfig = {
  isTax: 25,
  ivaGeneral: 21,
  taxStartDate: '2026-07-01',
}

export const DEFAULT_FISCAL_DATA: FiscalData = {
  ingressos: [],
  gastos: [],
  liquidacions: [],
  config: DEFAULT_FISCAL_CONFIG,
}

function fmtEur(n: number) {
  return n.toLocaleString('ca-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

type FiscTab = 'resum' | 'ingressos' | 'gastos' | 'liquidacions' | 'config'

interface Props {
  fiscalData: FiscalData
  saveFiscal: (d: FiscalData) => void
  operativeResult: number
  totalFees: number
  directCosts: number
}

interface BaseKpis { totalFees: number; directCosts: number }

export function computeFiscalKpis(fiscalData: FiscalData, operativeResult: number, baseKpis?: BaseKpis) {
  const { ingressos, gastos, liquidacions, config } = fiscalData
  const ivaPct = (config?.ivaGeneral ?? 21) / 100

  // Use manual entries if available; otherwise auto-estimate from cartera
  const autoIng = ingressos.length === 0 && !!baseKpis
  const autoGas = gastos.length === 0 && !!baseKpis
  const ivaRepercutit = autoIng
    ? Math.round((baseKpis!.totalFees * ivaPct) * 100) / 100
    : ingressos.reduce((s, r) => s + (r.iva || 0), 0)
  const ivaDeduible = autoGas
    ? Math.round((baseKpis!.directCosts * ivaPct) * 100) / 100
    : gastos.reduce((s, g) => s + (g.ivaDeduible || 0), 0)
  const ivaNet = ivaRepercutit - ivaDeduible
  const irpfAcumulat = gastos.reduce((s, g) => s + (g.irpf || 0), 0)
  const isEstimat = Math.max(0, operativeResult) * ((config?.isTax ?? 25) / 100)
  const ivaPagat = liquidacions.filter(l => l.impost === 'IVA').reduce((s, l) => s + (l.importPagat || 0), 0)
  const irpfPagat = liquidacions.filter(l => l.impost === 'IRPF').reduce((s, l) => s + (l.importPagat || 0), 0)
  const isPagat = liquidacions.filter(l => l.impost === 'IS').reduce((s, l) => s + (l.importPagat || 0), 0)
  const ivaPendent = Math.max(0, ivaNet - ivaPagat)
  const irpfPendent = Math.max(0, irpfAcumulat - irpfPagat)
  const isPendent = Math.max(0, isEstimat - isPagat)
  const totalImpostos = ivaPendent + irpfPendent + isPendent
  return { ivaRepercutit, ivaDeduible, ivaNet, irpfAcumulat, isEstimat, ivaPagat, irpfPagat, isPagat, ivaPendent, irpfPendent, isPendent, totalImpostos, autoIng, autoGas }
}

export function FiscalitatSection({ fiscalData, saveFiscal, operativeResult, totalFees, directCosts }: Props) {
  const [tab, setTab] = useState<FiscTab>('resum')

  const fkpis = useMemo(() => computeFiscalKpis(fiscalData, operativeResult, { totalFees, directCosts }), [fiscalData, operativeResult, totalFees, directCosts])

  return (
    <div className="fsc-root">
      <div className="fsc-header">
        <div>
          <div className="fsc-title">Fiscalitat</div>
          <div className="fsc-sub">IVA · IRPF · Impost de Societats · Guinew Media4Sports SL · NIF B88810353</div>
        </div>
      </div>

      <div className="fsc-tabs">
        {(['resum', 'ingressos', 'gastos', 'liquidacions', 'config'] as FiscTab[]).map(t => (
          <button key={t} className={`fsc-tab${tab === t ? ' fsc-tab--active' : ''}`} onClick={() => setTab(t)}>
            {t === 'resum' ? 'Resum fiscal' : t === 'ingressos' ? 'Ingressos (IVA)' : t === 'gastos' ? 'Gastos (IVA/IRPF)' : t === 'liquidacions' ? 'Liquidacions' : 'Configuració'}
          </button>
        ))}
      </div>

      {tab === 'resum' && <FiscResumTab fkpis={fkpis} fiscalData={fiscalData} />}
      {tab === 'ingressos' && <IngressosTab fiscalData={fiscalData} saveFiscal={saveFiscal} />}
      {tab === 'gastos' && <GastosTab fiscalData={fiscalData} saveFiscal={saveFiscal} />}
      {tab === 'liquidacions' && <LiquidacionsTab fiscalData={fiscalData} saveFiscal={saveFiscal} fkpis={fkpis} />}
      {tab === 'config' && <FiscConfigTab fiscalData={fiscalData} saveFiscal={saveFiscal} />}

      <style jsx>{`
        .fsc-root { }
        .fsc-header { margin-bottom: 20px; }
        .fsc-title { font-size: 20px; font-weight: 700; color: #0F1B2D; letter-spacing: -0.02em; }
        .fsc-sub { font-size: 12px; color: #9CA3AF; margin-top: 2px; }
        .fsc-tabs { display: flex; gap: 4px; background: white; border: 1px solid #E8ECF2; border-radius: 12px; padding: 5px; margin-bottom: 24px; flex-wrap: wrap; }
        .fsc-tab { height: 34px; padding: 0 16px; border: none; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; background: transparent; color: #6B7280; transition: all 0.15s; white-space: nowrap; }
        .fsc-tab--active { background: #1B2B4B; color: white; font-weight: 600; }
        .fsc-tab:hover:not(.fsc-tab--active) { background: #F3F4F6; color: #111827; }
      `}</style>
    </div>
  )
}

/* ─── RESUM FISCAL ─── */
function FiscResumTab({ fkpis, fiscalData }: { fkpis: ReturnType<typeof computeFiscalKpis>; fiscalData: FiscalData }) {
  const kpiCards = [
    { label: 'IVA repercutit', value: fkpis.ivaRepercutit, sub: fkpis.autoIng ? `Auto-estimat des de Cartera (${fiscalData.config?.ivaGeneral ?? 21}% × fees)` : `${fiscalData.ingressos.length} factures registrades`, color: '#254067', estimat: fkpis.autoIng },
    { label: 'IVA deduïble', value: fkpis.ivaDeduible, sub: fkpis.autoGas ? `Auto-estimat des de Cartera (${fiscalData.config?.ivaGeneral ?? 21}% × costos directes)` : `${fiscalData.gastos.length} gastos registrats`, color: '#059669', estimat: fkpis.autoGas },
    { label: 'IRPF retingut', value: fkpis.irpfAcumulat, sub: fiscalData.gastos.length === 0 ? 'Afegeix gastos per calcular' : 'Retencions acumulades', color: '#7C3AED' },
    { label: 'IS estimat', value: fkpis.isEstimat, sub: `${fiscalData.config?.isTax ?? 25}% sobre resultat operatiu`, color: '#D97706', estimat: true },
  ]

  const pendentCards = [
    { label: 'IVA pendent', value: fkpis.ivaPendent, sub: `Net: ${fmtEur(fkpis.ivaNet)} − Pagat: ${fmtEur(fkpis.ivaPagat)}` },
    { label: 'IRPF pendent', value: fkpis.irpfPendent, sub: `Retingut: ${fmtEur(fkpis.irpfAcumulat)} − Pagat: ${fmtEur(fkpis.irpfPagat)}` },
    { label: 'IS pendent (estimat)', value: fkpis.isPendent, sub: `Estimat: ${fmtEur(fkpis.isEstimat)} − Pagat: ${fmtEur(fkpis.isPagat)}`, estimat: true },
    { label: 'TOTAL IMPOSTOS PENDENTS', value: fkpis.totalImpostos, sub: 'IVA + IRPF + IS estimat', total: true },
  ]

  const isAutoMode = fkpis.autoIng || fkpis.autoGas

  return (
    <div>
      {isAutoMode && (
        <div className="fsc-notice fsc-notice--auto">
          <AlertTriangle size={16} />
          <span>L&apos;IVA s&apos;ha <strong>auto-estimat des de les dades de Cartera</strong> ({fiscalData.config?.ivaGeneral ?? 21}% sobre fees i costos). Per valors exactes, afegeix les factures reals a les pestanyes <strong>Ingressos</strong> i <strong>Gastos</strong>.</span>
        </div>
      )}

      <div className="fsc-section-label">Acumulat del període fiscal</div>
      <div className="fsc-grid4">
        {kpiCards.map((k, i) => (
          <div key={i} className="fsc-kpi" style={{ borderTop: `3px solid ${k.color}` }}>
            <div className="fsc-kpi-label">{k.label}{k.estimat && <span className="fsc-badge-est">Estimat</span>}</div>
            <div className="fsc-kpi-value">{fmtEur(k.value)}</div>
            <div className="fsc-kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="fsc-section-label" style={{ marginTop: 24 }}>Impostos pendents d&apos;ingressar a Hisenda</div>
      <div className="fsc-grid4">
        {pendentCards.map((k, i) => (
          <div key={i} className={`fsc-kpi fsc-kpi--accent${k.total ? ' fsc-kpi--total' : ''}`}>
            <div className="fsc-kpi-label">{k.label}{k.estimat && <span className="fsc-badge-est">Estimat</span>}</div>
            <div className={`fsc-kpi-value ${k.value <= 0 ? 'fsc-kpi-value--zero' : 'fsc-kpi-value--alert'}`}>{fmtEur(k.value)}</div>
            <div className="fsc-kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="fsc-info-box">
        <CheckCircle size={14} />
        <span>Els imports d&apos;IS estan marcats com a <strong>Estimats</strong> fins que no es presenti la liquidació definitiva. L&apos;IVA i IRPF es calculen a partir de les factures i gastos introduïts.</span>
      </div>

      <style jsx>{`
        .fsc-notice { display: flex; align-items: flex-start; gap: 10px; background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 10px; padding: 14px 16px; margin-bottom: 20px; font-size: 13px; color: #92400E; }
        .fsc-notice--auto { background: #EFF6FF; border-color: #BFDBFE; color: #1E40AF; }
        .fsc-section-label { font-size: 11px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 10px; }
        .fsc-grid4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        @media (max-width: 1023px) { .fsc-grid4 { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 639px) { .fsc-grid4 { grid-template-columns: 1fr; } }
        .fsc-kpi { background: white; border-radius: 12px; border: 1px solid #E8ECF2; padding: 16px 18px; }
        .fsc-kpi--accent { background: #F8FAFF; border-color: #DDE3F0; }
        .fsc-kpi--total { background: #FEF2F2; border-color: #FECACA; border-top: 3px solid #DC2626 !important; }
        .fsc-kpi-label { font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
        .fsc-badge-est { background: #FEF3C7; color: #D97706; border-radius: 4px; padding: 1px 6px; font-size: 9px; font-weight: 700; letter-spacing: 0.06em; }
        .fsc-kpi-value { font-size: 22px; font-weight: 800; color: #111827; font-variant-numeric: tabular-nums; margin-bottom: 4px; }
        .fsc-kpi-value--zero { color: #059669; }
        .fsc-kpi-value--alert { color: #DC2626; }
        .fsc-kpi-sub { font-size: 11px; color: #9CA3AF; line-height: 1.4; }
        .fsc-info-box { display: flex; align-items: flex-start; gap: 8px; background: #F0FDF4; border: 1px solid #A7F3D0; border-radius: 10px; padding: 12px 14px; margin-top: 20px; font-size: 12px; color: #065F46; }
      `}</style>
    </div>
  )
}

/* ─── INGRESSOS ─── */
function IngressosTab({ fiscalData, saveFiscal }: { fiscalData: FiscalData; saveFiscal: (d: FiscalData) => void }) {
  const [rows, setRows] = useState<Ingres[]>(fiscalData.ingressos)
  const [saved, setSaved] = useState(false)

  function addRow() {
    const r: Ingres = { id: uid(), data: '', clientName: '', numFactura: '', concepte: '', base: 0, ivaPct: 21, iva: 0, total: 0, estat: 'Pendent' }
    setRows(prev => [r, ...prev])
  }

  function updateRow(id: string, field: keyof Ingres, val: string | number) {
    setRows(prev => prev.map(r => {
      if (r.id !== id) return r
      const next = { ...r, [field]: val }
      if (field === 'base' || field === 'ivaPct') {
        next.iva = Math.round((next.base * next.ivaPct / 100) * 100) / 100
        next.total = Math.round((next.base + next.iva) * 100) / 100
      }
      return next
    }))
  }

  function delRow(id: string) { setRows(prev => prev.filter(r => r.id !== id)) }

  function saveAll() {
    const next = { ...fiscalData, ingressos: rows }
    saveFiscal(next)
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  const totalBase = rows.reduce((s, r) => s + (r.base || 0), 0)
  const totalIva = rows.reduce((s, r) => s + (r.iva || 0), 0)
  const totalTotal = rows.reduce((s, r) => s + (r.total || 0), 0)

  return (
    <div>
      <div className="fst-topbar">
        <div>
          <div className="fst-title">Factures emeses (IVA repercutit)</div>
          <div className="fst-sub">Registra cada factura emesa per calcular l&apos;IVA repercutit acumulat.</div>
        </div>
        <div className="fst-actions">
          <button className="fst-btn-save" onClick={saveAll}><Save size={14} />{saved ? 'Guardat!' : 'Guardar'}</button>
          <button className="fst-btn-new" onClick={addRow}><Plus size={14} />Nova factura</button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="fst-empty">Cap factura registrada. Clica &quot;Nova factura&quot; per afegir-ne.</div>
      ) : (
        <div className="fst-table-wrap">
          <div className="fst-thead ing-cols">
            <div className="fst-th">Data</div>
            <div className="fst-th">Client</div>
            <div className="fst-th">Nº Factura</div>
            <div className="fst-th">Concepte</div>
            <div className="fst-th fst-th--r">Base (€)</div>
            <div className="fst-th fst-th--r">IVA %</div>
            <div className="fst-th fst-th--r">IVA (€)</div>
            <div className="fst-th fst-th--r">Total (€)</div>
            <div className="fst-th">Estat</div>
            <div className="fst-th"></div>
          </div>
          {rows.map(r => (
            <div key={r.id} className="fst-row ing-cols">
              <div className="fst-cell"><input className="fst-inp" type="date" value={r.data} onChange={e => updateRow(r.id, 'data', e.target.value)} /></div>
              <div className="fst-cell"><input className="fst-inp" value={r.clientName} onChange={e => updateRow(r.id, 'clientName', e.target.value)} placeholder="Client..." /></div>
              <div className="fst-cell"><input className="fst-inp" value={r.numFactura} onChange={e => updateRow(r.id, 'numFactura', e.target.value)} placeholder="F-001..." /></div>
              <div className="fst-cell"><input className="fst-inp" value={r.concepte} onChange={e => updateRow(r.id, 'concepte', e.target.value)} placeholder="Concepte..." /></div>
              <div className="fst-cell fst-cell--r"><input className="fst-inp fst-inp--num" type="number" min="0" step="0.01" value={r.base || ''} onChange={e => updateRow(r.id, 'base', parseFloat(e.target.value) || 0)} /></div>
              <div className="fst-cell fst-cell--r"><input className="fst-inp fst-inp--num" type="number" min="0" max="100" step="1" value={r.ivaPct} onChange={e => updateRow(r.id, 'ivaPct', parseFloat(e.target.value) || 0)} /></div>
              <div className="fst-cell fst-cell--r"><span className="fst-computed">{fmtEur(r.iva)}</span></div>
              <div className="fst-cell fst-cell--r"><span className="fst-computed fst-computed--total">{fmtEur(r.total)}</span></div>
              <div className="fst-cell">
                <select className="fst-sel" value={r.estat} onChange={e => updateRow(r.id, 'estat', e.target.value)}>
                  <option value="Pendent">Pendent</option>
                  <option value="Cobrat">Cobrat</option>
                </select>
              </div>
              <div className="fst-cell"><button className="fst-del" onClick={() => delRow(r.id)}><Trash2 size={13} /></button></div>
            </div>
          ))}
          <div className="fst-tfoot ing-cols">
            <div></div><div></div><div></div>
            <div className="fst-tf-lbl">TOTALS</div>
            <div className="fst-tf-val">{fmtEur(totalBase)}</div>
            <div></div>
            <div className="fst-tf-val">{fmtEur(totalIva)}</div>
            <div className="fst-tf-val">{fmtEur(totalTotal)}</div>
            <div></div><div></div>
          </div>
        </div>
      )}

      <style jsx>{`
        .fst-topbar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; gap: 16px; flex-wrap: wrap; }
        .fst-title { font-size: 16px; font-weight: 700; color: #111827; }
        .fst-sub { font-size: 12px; color: #9CA3AF; margin-top: 2px; }
        .fst-actions { display: flex; gap: 8px; flex-shrink: 0; }
        .fst-btn-save { height: 34px; padding: 0 14px; border: 1px solid #E5E7EB; border-radius: 8px; font-size: 13px; font-weight: 500; color: #374151; background: white; cursor: pointer; display: flex; align-items: center; gap: 6px; }
        .fst-btn-save:hover { border-color: #254067; color: #254067; }
        .fst-btn-new { height: 34px; padding: 0 16px; background: linear-gradient(135deg,#1B2B4B,#254067); color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; }
        .fst-btn-new:hover { opacity: 0.88; }
        .fst-empty { padding: 48px; text-align: center; font-size: 14px; color: #D1D5DB; background: white; border-radius: 12px; border: 1px solid #E8ECF2; }
        .fst-table-wrap { background: white; border: 1px solid #E8ECF2; border-radius: 12px; overflow: auto; }
        .ing-cols { display: grid; grid-template-columns: 110px 1fr 100px 1fr 100px 60px 100px 100px 90px 36px; gap: 4px; min-width: 860px; }
        .fst-thead { padding: 10px 16px; border-bottom: 1px solid #F3F4F6; background: #FAFAFA; align-items: center; }
        .fst-th { font-size: 10px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.07em; padding: 0 4px; }
        .fst-th--r { text-align: right; justify-self: end; }
        .fst-row { padding: 4px 16px; border-bottom: 1px solid #F9FAFB; align-items: center; }
        .fst-row:last-child { border-bottom: none; }
        .fst-row:hover { background: #FAFBFF; }
        .fst-cell { padding: 4px; display: flex; align-items: center; }
        .fst-cell--r { justify-content: flex-end; }
        .fst-inp { width: 100%; border: 1px solid transparent; border-radius: 6px; padding: 6px 8px; font-size: 12.5px; color: #111827; font-family: inherit; outline: none; background: transparent; }
        .fst-inp:hover { border-color: #D1D5DB; background: #F9FAFB; }
        .fst-inp:focus { border-color: #254067; background: white; }
        .fst-inp--num { text-align: right; }
        .fst-computed { font-size: 12.5px; font-weight: 600; color: #374151; font-variant-numeric: tabular-nums; padding: 0 8px; }
        .fst-computed--total { color: #254067; }
        .fst-sel { width: 100%; border: 1px solid transparent; border-radius: 6px; padding: 6px 8px; font-size: 12.5px; color: #374151; font-family: inherit; outline: none; background: transparent; cursor: pointer; }
        .fst-sel:focus { border-color: #254067; background: white; }
        .fst-del { width: 28px; height: 28px; border: 1px solid #FEE2E2; background: #FFF5F5; border-radius: 6px; cursor: pointer; color: #FCA5A5; display: flex; align-items: center; justify-content: center; }
        .fst-del:hover { background: #FEE2E2; color: #EF4444; }
        .fst-tfoot { padding: 12px 16px; background: #F8F9FB; border-top: 1px solid #E8ECF2; align-items: center; }
        .fst-tf-lbl { font-size: 11px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; padding: 0 4px; }
        .fst-tf-val { font-size: 13px; font-weight: 800; color: #111827; font-variant-numeric: tabular-nums; text-align: right; padding: 0 4px; }
      `}</style>
    </div>
  )
}

/* ─── GASTOS ─── */
function GastosTab({ fiscalData, saveFiscal }: { fiscalData: FiscalData; saveFiscal: (d: FiscalData) => void }) {
  const [rows, setRows] = useState<GastoFiscal[]>(fiscalData.gastos)
  const [saved, setSaved] = useState(false)

  function addRow() {
    const r: GastoFiscal = { id: uid(), data: '', proveidor: '', concepte: '', base: 0, ivaPct: 21, iva: 0, ivaDeduiblePct: 100, ivaDeduible: 0, irpfPct: 0, irpf: 0, total: 0, estat: 'Pendent' }
    setRows(prev => [r, ...prev])
  }

  function updateRow(id: string, field: keyof GastoFiscal, val: string | number) {
    setRows(prev => prev.map(r => {
      if (r.id !== id) return r
      const next = { ...r, [field]: val }
      if (['base', 'ivaPct', 'ivaDeduiblePct', 'irpfPct'].includes(field as string)) {
        next.iva = Math.round((next.base * next.ivaPct / 100) * 100) / 100
        next.ivaDeduible = Math.round((next.iva * next.ivaDeduiblePct / 100) * 100) / 100
        next.irpf = Math.round((next.base * next.irpfPct / 100) * 100) / 100
        next.total = Math.round((next.base + next.iva - next.irpf) * 100) / 100
      }
      return next
    }))
  }

  function delRow(id: string) { setRows(prev => prev.filter(r => r.id !== id)) }

  function saveAll() {
    const next = { ...fiscalData, gastos: rows }
    saveFiscal(next)
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  const totalIvaDeduible = rows.reduce((s, r) => s + (r.ivaDeduible || 0), 0)
  const totalIrpf = rows.reduce((s, r) => s + (r.irpf || 0), 0)

  return (
    <div>
      <div className="fst-topbar">
        <div>
          <div className="fst-title">Gastos (IVA deduïble i IRPF retingut)</div>
          <div className="fst-sub">Registra cada gasto per calcular l&apos;IVA deduïble i les retencions d&apos;IRPF acumulades.</div>
        </div>
        <div className="fst-actions">
          <button className="fst-btn-save" onClick={saveAll}><Save size={14} />{saved ? 'Guardat!' : 'Guardar'}</button>
          <button className="fst-btn-new" onClick={addRow}><Plus size={14} />Nou gasto</button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="fst-empty">Cap gasto registrat. Clica &quot;Nou gasto&quot; per afegir-ne.</div>
      ) : (
        <div className="fst-table-wrap">
          <div className="fst-thead gas-cols">
            <div className="fst-th">Data</div>
            <div className="fst-th">Proveïdor</div>
            <div className="fst-th">Concepte</div>
            <div className="fst-th fst-th--r">Base (€)</div>
            <div className="fst-th fst-th--r">IVA %</div>
            <div className="fst-th fst-th--r">IVA (€)</div>
            <div className="fst-th fst-th--r">Deduïble %</div>
            <div className="fst-th fst-th--r">IVA deduïble</div>
            <div className="fst-th fst-th--r">IRPF %</div>
            <div className="fst-th fst-th--r">IRPF (€)</div>
            <div className="fst-th">Estat</div>
            <div className="fst-th"></div>
          </div>
          {rows.map(r => (
            <div key={r.id} className="fst-row gas-cols">
              <div className="fst-cell"><input className="fst-inp" type="date" value={r.data} onChange={e => updateRow(r.id, 'data', e.target.value)} /></div>
              <div className="fst-cell"><input className="fst-inp" value={r.proveidor} onChange={e => updateRow(r.id, 'proveidor', e.target.value)} placeholder="Proveïdor..." /></div>
              <div className="fst-cell"><input className="fst-inp" value={r.concepte} onChange={e => updateRow(r.id, 'concepte', e.target.value)} placeholder="Concepte..." /></div>
              <div className="fst-cell fst-cell--r"><input className="fst-inp fst-inp--num" type="number" min="0" step="0.01" value={r.base || ''} onChange={e => updateRow(r.id, 'base', parseFloat(e.target.value) || 0)} /></div>
              <div className="fst-cell fst-cell--r"><input className="fst-inp fst-inp--num" type="number" min="0" max="100" step="1" value={r.ivaPct} onChange={e => updateRow(r.id, 'ivaPct', parseFloat(e.target.value) || 0)} /></div>
              <div className="fst-cell fst-cell--r"><span className="fst-computed">{fmtEur(r.iva)}</span></div>
              <div className="fst-cell fst-cell--r"><input className="fst-inp fst-inp--num" type="number" min="0" max="100" step="1" value={r.ivaDeduiblePct} onChange={e => updateRow(r.id, 'ivaDeduiblePct', parseFloat(e.target.value) || 0)} /></div>
              <div className="fst-cell fst-cell--r"><span className="fst-computed fst-computed--green">{fmtEur(r.ivaDeduible)}</span></div>
              <div className="fst-cell fst-cell--r"><input className="fst-inp fst-inp--num" type="number" min="0" max="100" step="1" value={r.irpfPct} onChange={e => updateRow(r.id, 'irpfPct', parseFloat(e.target.value) || 0)} /></div>
              <div className="fst-cell fst-cell--r"><span className="fst-computed fst-computed--purple">{fmtEur(r.irpf)}</span></div>
              <div className="fst-cell">
                <select className="fst-sel" value={r.estat} onChange={e => updateRow(r.id, 'estat', e.target.value)}>
                  <option value="Pendent">Pendent</option>
                  <option value="Pagat">Pagat</option>
                </select>
              </div>
              <div className="fst-cell"><button className="fst-del" onClick={() => delRow(r.id)}><Trash2 size={13} /></button></div>
            </div>
          ))}
          <div className="fst-tfoot gas-cols">
            <div></div><div></div>
            <div className="fst-tf-lbl">TOTALS</div>
            <div></div><div></div><div></div><div></div>
            <div className="fst-tf-val">{fmtEur(totalIvaDeduible)}</div>
            <div></div>
            <div className="fst-tf-val">{fmtEur(totalIrpf)}</div>
            <div></div><div></div>
          </div>
        </div>
      )}

      <style jsx>{`
        .fst-topbar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; gap: 16px; flex-wrap: wrap; }
        .fst-title { font-size: 16px; font-weight: 700; color: #111827; }
        .fst-sub { font-size: 12px; color: #9CA3AF; margin-top: 2px; }
        .fst-actions { display: flex; gap: 8px; flex-shrink: 0; }
        .fst-btn-save { height: 34px; padding: 0 14px; border: 1px solid #E5E7EB; border-radius: 8px; font-size: 13px; font-weight: 500; color: #374151; background: white; cursor: pointer; display: flex; align-items: center; gap: 6px; }
        .fst-btn-save:hover { border-color: #254067; color: #254067; }
        .fst-btn-new { height: 34px; padding: 0 16px; background: linear-gradient(135deg,#1B2B4B,#254067); color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; }
        .fst-btn-new:hover { opacity: 0.88; }
        .fst-empty { padding: 48px; text-align: center; font-size: 14px; color: #D1D5DB; background: white; border-radius: 12px; border: 1px solid #E8ECF2; }
        .fst-table-wrap { background: white; border: 1px solid #E8ECF2; border-radius: 12px; overflow: auto; }
        .gas-cols { display: grid; grid-template-columns: 110px 1fr 1fr 90px 55px 90px 75px 110px 60px 90px 80px 36px; gap: 4px; min-width: 1100px; }
        .fst-thead { padding: 10px 16px; border-bottom: 1px solid #F3F4F6; background: #FAFAFA; align-items: center; }
        .fst-th { font-size: 10px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.07em; padding: 0 4px; }
        .fst-th--r { text-align: right; justify-self: end; }
        .fst-row { padding: 4px 16px; border-bottom: 1px solid #F9FAFB; align-items: center; }
        .fst-row:last-child { border-bottom: none; }
        .fst-row:hover { background: #FAFBFF; }
        .fst-cell { padding: 4px; display: flex; align-items: center; }
        .fst-cell--r { justify-content: flex-end; }
        .fst-inp { width: 100%; border: 1px solid transparent; border-radius: 6px; padding: 6px 8px; font-size: 12.5px; color: #111827; font-family: inherit; outline: none; background: transparent; }
        .fst-inp:hover { border-color: #D1D5DB; background: #F9FAFB; }
        .fst-inp:focus { border-color: #254067; background: white; }
        .fst-inp--num { text-align: right; }
        .fst-computed { font-size: 12.5px; font-weight: 600; color: #374151; font-variant-numeric: tabular-nums; padding: 0 8px; }
        .fst-computed--green { color: #059669; }
        .fst-computed--purple { color: #7C3AED; }
        .fst-sel { width: 100%; border: 1px solid transparent; border-radius: 6px; padding: 6px 8px; font-size: 12.5px; color: #374151; font-family: inherit; outline: none; background: transparent; cursor: pointer; }
        .fst-sel:focus { border-color: #254067; background: white; }
        .fst-del { width: 28px; height: 28px; border: 1px solid #FEE2E2; background: #FFF5F5; border-radius: 6px; cursor: pointer; color: #FCA5A5; display: flex; align-items: center; justify-content: center; }
        .fst-del:hover { background: #FEE2E2; color: #EF4444; }
        .fst-tfoot { padding: 12px 16px; background: #F8F9FB; border-top: 1px solid #E8ECF2; align-items: center; }
        .fst-tf-lbl { font-size: 11px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; padding: 0 4px; }
        .fst-tf-val { font-size: 13px; font-weight: 800; color: #111827; font-variant-numeric: tabular-nums; text-align: right; padding: 0 4px; }
      `}</style>
    </div>
  )
}

/* ─── LIQUIDACIONS ─── */
function LiquidacionsTab({ fiscalData, saveFiscal, fkpis }: { fiscalData: FiscalData; saveFiscal: (d: FiscalData) => void; fkpis: ReturnType<typeof computeFiscalKpis> }) {
  const [rows, setRows] = useState<FiscalLiquidacio[]>(fiscalData.liquidacions)
  const [saved, setSaved] = useState(false)

  function addRow() {
    const r: FiscalLiquidacio = { id: uid(), impost: 'IVA', periode: '', dataVenciment: '', importCalculat: 0, importPagat: 0, dataPagament: '', estat: 'Pendent', notes: '' }
    setRows(prev => [r, ...prev])
  }

  function updateRow(id: string, field: keyof FiscalLiquidacio, val: string | number) {
    setRows(prev => prev.map(r => r.id !== id ? r : { ...r, [field]: val }))
  }

  function delRow(id: string) { setRows(prev => prev.filter(r => r.id !== id)) }

  function saveAll() {
    const next = { ...fiscalData, liquidacions: rows }
    saveFiscal(next)
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  const suggestions = [
    { impost: 'IVA' as const, import: fkpis.ivaPendent, label: 'IVA pendent' },
    { impost: 'IRPF' as const, import: fkpis.irpfPendent, label: 'IRPF pendent' },
    { impost: 'IS' as const, import: fkpis.isPendent, label: 'IS estimat pendent' },
  ].filter(s => s.import > 0)

  return (
    <div>
      <div className="fst-topbar">
        <div>
          <div className="fst-title">Liquidacions presentades a Hisenda</div>
          <div className="fst-sub">Registra els pagaments d&apos;impostos efectuats per descomptar-los del pendent.</div>
        </div>
        <div className="fst-actions">
          <button className="fst-btn-save" onClick={saveAll}><Save size={14} />{saved ? 'Guardat!' : 'Guardar'}</button>
          <button className="fst-btn-new" onClick={addRow}><Plus size={14} />Nova liquidació</button>
        </div>
      </div>

      {suggestions.length > 0 && (
        <div className="liq-suggestions">
          <div className="liq-sug-label">Impostos pendents detectats:</div>
          <div className="liq-sug-pills">
            {suggestions.map(s => (
              <div key={s.impost} className="liq-sug-pill">
                <span className="liq-sug-name">{s.label}</span>
                <span className="liq-sug-val">{fmtEur(s.import)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="fst-empty">Cap liquidació registrada. Clica &quot;Nova liquidació&quot; per afegir-ne.</div>
      ) : (
        <div className="fst-table-wrap">
          <div className="fst-thead liq-cols">
            <div className="fst-th">Impost</div>
            <div className="fst-th">Període</div>
            <div className="fst-th">Venciment</div>
            <div className="fst-th fst-th--r">Import calculat</div>
            <div className="fst-th fst-th--r">Import pagat</div>
            <div className="fst-th">Data pagament</div>
            <div className="fst-th">Estat</div>
            <div className="fst-th">Notes</div>
            <div className="fst-th"></div>
          </div>
          {rows.map(r => (
            <div key={r.id} className="fst-row liq-cols">
              <div className="fst-cell">
                <select className="fst-sel" value={r.impost} onChange={e => updateRow(r.id, 'impost', e.target.value)}>
                  <option value="IVA">IVA</option>
                  <option value="IRPF">IRPF</option>
                  <option value="IS">IS</option>
                  <option value="Altres">Altres</option>
                </select>
              </div>
              <div className="fst-cell"><input className="fst-inp" value={r.periode} onChange={e => updateRow(r.id, 'periode', e.target.value)} placeholder="T3 2026..." /></div>
              <div className="fst-cell"><input className="fst-inp" type="date" value={r.dataVenciment} onChange={e => updateRow(r.id, 'dataVenciment', e.target.value)} /></div>
              <div className="fst-cell fst-cell--r"><input className="fst-inp fst-inp--num" type="number" min="0" step="0.01" value={r.importCalculat || ''} onChange={e => updateRow(r.id, 'importCalculat', parseFloat(e.target.value) || 0)} /></div>
              <div className="fst-cell fst-cell--r"><input className="fst-inp fst-inp--num" type="number" min="0" step="0.01" value={r.importPagat || ''} onChange={e => updateRow(r.id, 'importPagat', parseFloat(e.target.value) || 0)} /></div>
              <div className="fst-cell"><input className="fst-inp" type="date" value={r.dataPagament} onChange={e => updateRow(r.id, 'dataPagament', e.target.value)} /></div>
              <div className="fst-cell">
                <select className="fst-sel" value={r.estat} onChange={e => updateRow(r.id, 'estat', e.target.value)}>
                  <option value="Pendent">Pendent</option>
                  <option value="Pagat">Pagat</option>
                  <option value="Compensat">Compensat</option>
                </select>
              </div>
              <div className="fst-cell"><input className="fst-inp" value={r.notes} onChange={e => updateRow(r.id, 'notes', e.target.value)} placeholder="Notes..." /></div>
              <div className="fst-cell"><button className="fst-del" onClick={() => delRow(r.id)}><Trash2 size={13} /></button></div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .fst-topbar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; gap: 16px; flex-wrap: wrap; }
        .fst-title { font-size: 16px; font-weight: 700; color: #111827; }
        .fst-sub { font-size: 12px; color: #9CA3AF; margin-top: 2px; }
        .fst-actions { display: flex; gap: 8px; flex-shrink: 0; }
        .fst-btn-save { height: 34px; padding: 0 14px; border: 1px solid #E5E7EB; border-radius: 8px; font-size: 13px; font-weight: 500; color: #374151; background: white; cursor: pointer; display: flex; align-items: center; gap: 6px; }
        .fst-btn-save:hover { border-color: #254067; color: #254067; }
        .fst-btn-new { height: 34px; padding: 0 16px; background: linear-gradient(135deg,#1B2B4B,#254067); color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; }
        .fst-btn-new:hover { opacity: 0.88; }
        .fst-empty { padding: 48px; text-align: center; font-size: 14px; color: #D1D5DB; background: white; border-radius: 12px; border: 1px solid #E8ECF2; }
        .fst-table-wrap { background: white; border: 1px solid #E8ECF2; border-radius: 12px; overflow: auto; }
        .liq-cols { display: grid; grid-template-columns: 80px 100px 110px 120px 110px 110px 100px 1fr 36px; gap: 4px; min-width: 900px; }
        .fst-thead { padding: 10px 16px; border-bottom: 1px solid #F3F4F6; background: #FAFAFA; align-items: center; }
        .fst-th { font-size: 10px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.07em; padding: 0 4px; }
        .fst-th--r { text-align: right; justify-self: end; }
        .fst-row { padding: 4px 16px; border-bottom: 1px solid #F9FAFB; align-items: center; }
        .fst-row:last-child { border-bottom: none; }
        .fst-row:hover { background: #FAFBFF; }
        .fst-cell { padding: 4px; display: flex; align-items: center; }
        .fst-cell--r { justify-content: flex-end; }
        .fst-inp { width: 100%; border: 1px solid transparent; border-radius: 6px; padding: 6px 8px; font-size: 12.5px; color: #111827; font-family: inherit; outline: none; background: transparent; }
        .fst-inp:hover { border-color: #D1D5DB; background: #F9FAFB; }
        .fst-inp:focus { border-color: #254067; background: white; }
        .fst-inp--num { text-align: right; }
        .fst-sel { width: 100%; border: 1px solid transparent; border-radius: 6px; padding: 6px 8px; font-size: 12.5px; color: #374151; font-family: inherit; outline: none; background: transparent; cursor: pointer; }
        .fst-sel:focus { border-color: #254067; background: white; }
        .fst-del { width: 28px; height: 28px; border: 1px solid #FEE2E2; background: #FFF5F5; border-radius: 6px; cursor: pointer; color: #FCA5A5; display: flex; align-items: center; justify-content: center; }
        .fst-del:hover { background: #FEE2E2; color: #EF4444; }
        .liq-suggestions { background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 10px; padding: 12px 16px; margin-bottom: 16px; }
        .liq-sug-label { font-size: 11px; font-weight: 700; color: #92400E; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
        .liq-sug-pills { display: flex; gap: 10px; flex-wrap: wrap; }
        .liq-sug-pill { display: flex; align-items: center; gap: 8px; background: white; border: 1px solid #FDE68A; border-radius: 20px; padding: 4px 12px; font-size: 12px; }
        .liq-sug-name { font-weight: 600; color: #92400E; }
        .liq-sug-val { font-weight: 800; color: #DC2626; font-variant-numeric: tabular-nums; }
      `}</style>
    </div>
  )
}

/* ─── CONFIG FISCAL ─── */
function FiscConfigTab({ fiscalData, saveFiscal }: { fiscalData: FiscalData; saveFiscal: (d: FiscalData) => void }) {
  const [config, setConfig] = useState<FiscalConfig>(fiscalData.config || DEFAULT_FISCAL_CONFIG)
  const [saved, setSaved] = useState(false)

  function saveConfig() {
    saveFiscal({ ...fiscalData, config })
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  return (
    <div>
      <div className="cfg-title">Configuració fiscal</div>
      <div className="cfg-card">
        <div className="cfg-row">
          <div className="cfg-field">
            <label>Data d&apos;inici exercici fiscal</label>
            <div className="cfg-desc">Les liquidacions i càlculs fiscals s&apos;apliquen des d&apos;aquesta data.</div>
            <input type="date" className="cfg-input" value={config.taxStartDate} onChange={e => setConfig(c => ({ ...c, taxStartDate: e.target.value }))} />
          </div>
          <div className="cfg-field">
            <label>Tipus IVA general (%)</label>
            <div className="cfg-desc">Percentatge d&apos;IVA per defecte al crear noves factures.</div>
            <input type="number" min="0" max="100" step="1" className="cfg-input" value={config.ivaGeneral} onChange={e => setConfig(c => ({ ...c, ivaGeneral: parseFloat(e.target.value) || 21 }))} />
          </div>
          <div className="cfg-field">
            <label>Tipus IS (%)</label>
            <div className="cfg-desc">Percentatge d&apos;Impost de Societats per calcular l&apos;IS estimat sobre el resultat operatiu.</div>
            <input type="number" min="0" max="100" step="1" className="cfg-input" value={config.isTax} onChange={e => setConfig(c => ({ ...c, isTax: parseFloat(e.target.value) || 25 }))} />
          </div>
        </div>
        <div className="cfg-info">
          <strong>Guinew Media4Sports SL</strong> · NIF B88810353 · Inici exercici: {config.taxStartDate} · IS: {config.isTax}% · IVA general: {config.ivaGeneral}%
        </div>
        <button className="cfg-save-btn" onClick={saveConfig}><Save size={15} />{saved ? 'Guardat!' : 'Guardar configuració'}</button>
      </div>

      <style jsx>{`
        .cfg-title { font-size: 20px; font-weight: 700; color: #0F1B2D; letter-spacing: -0.02em; margin-bottom: 20px; }
        .cfg-card { background: white; border-radius: 18px; border: 1px solid rgba(0,0,0,0.06); box-shadow: 0 2px 8px rgba(0,0,0,0.05); padding: 28px; max-width: 720px; }
        .cfg-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 20px; }
        @media (max-width: 639px) { .cfg-row { grid-template-columns: 1fr; } }
        .cfg-field { display: flex; flex-direction: column; gap: 4px; }
        .cfg-field label { font-size: 11.5px; font-weight: 600; color: #5A6478; letter-spacing: 0.03em; text-transform: uppercase; margin-bottom: 2px; }
        .cfg-desc { font-size: 11px; color: #A0A9BB; line-height: 1.4; margin-bottom: 6px; }
        .cfg-input { height: 40px; padding: 0 12px; border: 1.5px solid rgba(0,0,0,0.1); border-radius: 10px; font-size: 14px; color: #0F1B2D; outline: none; background: #FAFAFA; font-family: inherit; transition: border-color 0.15s; width: 100%; }
        .cfg-input:focus { border-color: #254067; background: white; }
        .cfg-info { background: #F0F4F9; border-radius: 8px; padding: 10px 14px; font-size: 12px; color: #374151; margin-bottom: 20px; }
        .cfg-save-btn { height: 40px; padding: 0 20px; background: linear-gradient(135deg,#1B2B4B,#254067); color: white; border: none; border-radius: 10px; font-size: 13.5px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 7px; box-shadow: 0 2px 8px rgba(37,64,103,0.3); }
        .cfg-save-btn:hover { opacity: 0.9; }
      `}</style>
    </div>
  )
}
