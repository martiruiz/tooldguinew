'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Trash2, Save, ArrowUpRight, ArrowDownRight, Pencil, Download, ChevronUp, ChevronDown, ArrowLeft } from 'lucide-react'

interface ClientBasic { id: string; name: string; type: string; status: string; logo_url?: string | null; responsible_id?: string | null }
interface ProfileBasic { id: string; full_name: string }

interface Collaborator { id: string; name: string; role: string; cost: number }
interface OtherCost { id: string; name: string; amount: number }

interface ClientRecord {
  id: string
  clientId?: string        // FK to Supabase clients.id
  clientName: string
  tipo: 'Recurrent' | 'Puntual'
  estado: 'Actiu' | 'Inactiu'
  fee: number
  marginObjective: number  // 0 = use global
  startDate: string
  endDate: string
  responsible: string
  services: string
  observations: string
  collaborators: Collaborator[]
  otherCosts: OtherCost[]
  photoUrl?: string        // base64 or URL for client logo
}

interface Supplier {
  id: string
  name: string
  category: string
  contact: string
  notes: string
  monthlyFee: number      // COBRO MENSUAL TOTAL (acordat)
  structureAmount: number // DE ESTRUCTURA (equip/redes)
}
interface StructureCost { id: string; name: string; category?: string; amount: number; supplierRef?: string }

interface FinanceData {
  records: ClientRecord[]
  suppliers: Supplier[]
  structureCosts: StructureCost[]
  marginObjective: number
  allocationMode?: 'proportional' | 'equal'
}

const STORAGE_KEY = 'guinew_finances_v2'

function _uid(s: string) { return 'seed-' + s }

const SEED_RECORDS: ClientRecord[] = [
  { id: _uid('90cup'),      clientName: '90 CUP',                        tipo: 'Puntual',   estado: 'Actiu', fee: 1600,   marginObjective: 0, startDate: '', endDate: '', responsible: 'Marti Ruiz Garcia',     services: '', observations: '', collaborators: [{ id: _uid('90cup-c'), name: '', role: '', cost: 0 }], otherCosts: [{ id: _uid('90cup-oc'), name: 'Cost directe', amount: 400 }] },
  { id: _uid('albums'),     clientName: 'Albums digitals',               tipo: 'Puntual',   estado: 'Actiu', fee: 3340,   marginObjective: 0, startDate: '', endDate: '', responsible: 'Marti Ruiz Garcia',     services: '', observations: '', collaborators: [{ id: _uid('albums-c'), name: '', role: '', cost: 0 }], otherCosts: [{ id: _uid('albums-oc'), name: 'Cost directe', amount: 3317 }] },
  { id: _uid('asobal'),     clientName: 'ASOBAL',                        tipo: 'Recurrent', estado: 'Actiu', fee: 4200,   marginObjective: 0, startDate: '', endDate: '', responsible: 'Marti Ruiz Garcia',     services: '', observations: '', collaborators: [{ id: _uid('asobal-c'), name: '', role: '', cost: 0 }], otherCosts: [{ id: _uid('asobal-oc'), name: 'Cost directe', amount: 1782.29 }] },
  { id: _uid('bestcup'),    clientName: 'Best Cup',                      tipo: 'Puntual',   estado: 'Actiu', fee: 4608,   marginObjective: 0, startDate: '', endDate: '', responsible: 'Marti Ruiz Garcia',     services: '', observations: '', collaborators: [{ id: _uid('bestcup-c'), name: '', role: '', cost: 0 }], otherCosts: [{ id: _uid('bestcup-oc'), name: 'Cost directe', amount: 2498 }] },
  { id: _uid('biwpa-r'),    clientName: 'Biwpa',                         tipo: 'Recurrent', estado: 'Actiu', fee: 2000,   marginObjective: 0, startDate: '', endDate: '', responsible: 'Gonzalo Perez',          services: '', observations: '', collaborators: [{ id: _uid('biwpa-r-c'), name: '', role: '', cost: 0 }], otherCosts: [{ id: _uid('biwpa-r-oc'), name: 'Cost directe', amount: 800 }] },
  { id: _uid('biwpa-p'),    clientName: 'Biwpa',                         tipo: 'Puntual',   estado: 'Actiu', fee: 1650,   marginObjective: 0, startDate: '', endDate: '', responsible: 'Marti Ruiz Garcia',     services: '', observations: '', collaborators: [{ id: _uid('biwpa-p-c'), name: '', role: '', cost: 0 }], otherCosts: [{ id: _uid('biwpa-p-oc'), name: 'Cost directe', amount: 500 }] },
  { id: _uid('collell-p'),  clientName: 'El Collell',                    tipo: 'Puntual',   estado: 'Actiu', fee: 8000,   marginObjective: 0, startDate: '', endDate: '', responsible: 'Marti Ruiz Garcia',     services: '', observations: '', collaborators: [{ id: _uid('collell-p-c'), name: '', role: '', cost: 0 }], otherCosts: [{ id: _uid('collell-p-oc'), name: 'Cost directe', amount: 3650 }] },
  { id: _uid('collell-r'),  clientName: 'El Collell',                    tipo: 'Recurrent', estado: 'Actiu', fee: 2000,   marginObjective: 0, startDate: '', endDate: '', responsible: 'Josep Cabedo',           services: '', observations: '', collaborators: [{ id: _uid('collell-r-c'), name: '', role: '', cost: 0 }], otherCosts: [{ id: _uid('collell-r-oc'), name: 'Cost directe', amount: 1300 }] },
  { id: _uid('elitefut-r'), clientName: 'Elite Fut',                     tipo: 'Recurrent', estado: 'Actiu', fee: 800,    marginObjective: 0, startDate: '', endDate: '', responsible: 'Bernat Serra Bonafonte', services: '', observations: '', collaborators: [{ id: _uid('elitefut-r-c'), name: '', role: '', cost: 0 }], otherCosts: [{ id: _uid('elitefut-r-oc'), name: 'Cost directe', amount: 500 }] },
  { id: _uid('elitefut-p'), clientName: 'Elite Fut',                     tipo: 'Puntual',   estado: 'Actiu', fee: 1940,   marginObjective: 0, startDate: '', endDate: '', responsible: 'Bernat Serra Bonafonte', services: '', observations: '', collaborators: [{ id: _uid('elitefut-p-c'), name: '', role: '', cost: 0 }], otherCosts: [{ id: _uid('elitefut-p-oc'), name: 'Cost directe', amount: 2077 }] },
  { id: _uid('parra'),      clientName: 'Esports Parra',                 tipo: 'Recurrent', estado: 'Actiu', fee: 1000,   marginObjective: 0, startDate: '', endDate: '', responsible: 'Juliet Manin',           services: '', observations: '', collaborators: [{ id: _uid('parra-c'), name: '', role: '', cost: 0 }], otherCosts: [{ id: _uid('parra-oc'), name: 'Cost directe', amount: 500 }] },
  { id: _uid('fch1'),       clientName: 'Federació Catalana de Handbol', tipo: 'Puntual',   estado: 'Actiu', fee: 4900,   marginObjective: 0, startDate: '', endDate: '', responsible: 'Marti Ruiz Garcia',     services: '', observations: '', collaborators: [{ id: _uid('fch1-c'), name: '', role: '', cost: 0 }], otherCosts: [{ id: _uid('fch1-oc'), name: 'Cost directe', amount: 1484 }] },
  { id: _uid('fch2'),       clientName: 'Federació Catalana de Handbol', tipo: 'Puntual',   estado: 'Actiu', fee: 490,    marginObjective: 0, startDate: '', endDate: '', responsible: 'Marti Ruiz Garcia',     services: '', observations: '', collaborators: [{ id: _uid('fch2-c'), name: '', role: '', cost: 0 }], otherCosts: [{ id: _uid('fch2-oc'), name: 'Cost directe', amount: 200 }] },
  { id: _uid('fch3'),       clientName: 'Federació Catalana de Handbol', tipo: 'Puntual',   estado: 'Actiu', fee: 490,    marginObjective: 0, startDate: '', endDate: '', responsible: 'Marti Ruiz Garcia',     services: '', observations: '', collaborators: [{ id: _uid('fch3-c'), name: '', role: '', cost: 0 }], otherCosts: [{ id: _uid('fch3-oc'), name: 'Cost directe', amount: 200 }] },
  { id: _uid('futbolin'),   clientName: 'Futbol In',                     tipo: 'Recurrent', estado: 'Actiu', fee: 2200,   marginObjective: 0, startDate: '', endDate: '', responsible: 'Pau Condom',             services: '', observations: '', collaborators: [{ id: _uid('futbolin-c'), name: '', role: '', cost: 0 }], otherCosts: [{ id: _uid('futbolin-oc'), name: 'Cost directe', amount: 750 }] },
  { id: _uid('kanbe'),      clientName: 'Kanbe',                         tipo: 'Recurrent', estado: 'Actiu', fee: 2000,   marginObjective: 0, startDate: '', endDate: '', responsible: 'Juliet Manin',           services: '', observations: '', collaborators: [{ id: _uid('kanbe-c'), name: '', role: '', cost: 0 }], otherCosts: [{ id: _uid('kanbe-oc'), name: 'Cost directe', amount: 750 }] },
  { id: _uid('nautivela'),  clientName: 'Nautivela',                     tipo: 'Recurrent', estado: 'Actiu', fee: 1400,   marginObjective: 0, startDate: '', endDate: '', responsible: 'Juliet Manin',           services: '', observations: '', collaborators: [{ id: _uid('nautivela-c'), name: '', role: '', cost: 0 }], otherCosts: [{ id: _uid('nautivela-oc'), name: 'Cost directe', amount: 500 }] },
  { id: _uid('proodos'),    clientName: 'Proodos',                       tipo: 'Recurrent', estado: 'Actiu', fee: 1000,   marginObjective: 0, startDate: '', endDate: '', responsible: 'Juliet Manin',           services: '', observations: '', collaborators: [{ id: _uid('proodos-c'), name: '', role: '', cost: 0 }], otherCosts: [{ id: _uid('proodos-oc'), name: 'Cost directe', amount: 500 }] },
  { id: _uid('puntoblanco'),clientName: 'Punto Blanco',                  tipo: 'Recurrent', estado: 'Actiu', fee: 2400,   marginObjective: 0, startDate: '', endDate: '', responsible: 'Juliet Manin',           services: '', observations: '', collaborators: [{ id: _uid('puntoblanco-c'), name: '', role: '', cost: 0 }], otherCosts: [{ id: _uid('puntoblanco-oc'), name: 'Cost directe', amount: 800 }] },
  { id: _uid('sanescup'),   clientName: 'SanesCup',                      tipo: 'Puntual',   estado: 'Actiu', fee: 1900,   marginObjective: 0, startDate: '', endDate: '', responsible: 'Marti Ruiz Garcia',     services: '', observations: '', collaborators: [{ id: _uid('sanescup-c'), name: '', role: '', cost: 0 }], otherCosts: [{ id: _uid('sanescup-oc'), name: 'Cost directe', amount: 455.5 }] },
  { id: _uid('tpe'),        clientName: 'TPE',                           tipo: 'Recurrent', estado: 'Actiu', fee: 3500,   marginObjective: 0, startDate: '', endDate: '', responsible: 'Alicia Grima',           services: '', observations: '', collaborators: [{ id: _uid('tpe-c'), name: '', role: '', cost: 0 }], otherCosts: [{ id: _uid('tpe-oc'), name: 'Cost directe', amount: 1900 }] },
  { id: _uid('villareal'),  clientName: 'Villareal FC',                  tipo: 'Puntual',   estado: 'Actiu', fee: 950,    marginObjective: 0, startDate: '', endDate: '', responsible: 'Bernat Serra Bonafonte', services: '', observations: '', collaborators: [{ id: _uid('villareal-c'), name: '', role: '', cost: 0 }], otherCosts: [{ id: _uid('villareal-oc'), name: 'Cost directe', amount: 400 }] },
]

function _suid(s: string) { return 'seed-sup-' + s }

const SEED_SUPPLIERS: Supplier[] = [
  { id: _suid('albert'),      name: 'Albert',              category: 'Host',                  contact: '', notes: '', monthlyFee: 0,    structureAmount: 0   },
  { id: _suid('aliciagrima'), name: 'Alicia Grima',        category: 'Social Media Manager',  contact: '', notes: '', monthlyFee: 1400, structureAmount: 0   },
  { id: _suid('bernatruiz'),  name: 'Bernat Ruiz Garcia',  category: 'SCP',                   contact: '', notes: '', monthlyFee: 500,  structureAmount: 500 },
  { id: _suid('bernatserra'), name: 'Bernat Serra Bonafonte', category: 'Content Manager',    contact: '', notes: '', monthlyFee: 3250, structureAmount: 0   },
  { id: _suid('bielcosano'),  name: 'Biel Cosano',         category: 'Fotografo',             contact: '', notes: '', monthlyFee: 0,    structureAmount: 0   },
  { id: _suid('davidfern'),   name: 'David Fernandez',     category: 'Fotografo',             contact: '', notes: '', monthlyFee: 0,    structureAmount: 0   },
  { id: _suid('enricseg'),    name: 'Enric Segura',        category: 'Fotografo',             contact: '', notes: '', monthlyFee: 0,    structureAmount: 0   },
  { id: _suid('gastostpe'),   name: 'gastos TPE CUP',      category: 'Fotografo',             contact: '', notes: '', monthlyFee: 0,    structureAmount: 0   },
  { id: _suid('gonzaloper'),  name: 'Gonzalo Perez',       category: 'Social Media Manager',  contact: '', notes: '', monthlyFee: 1600, structureAmount: 0   },
  { id: _suid('joelllobet'),  name: 'Joel Llobet',         category: 'Fotografo',             contact: '', notes: '', monthlyFee: 0,    structureAmount: 0   },
  { id: _suid('josepcab'),    name: 'Josep Cabedo',        category: 'Social Media Manager',  contact: '', notes: '', monthlyFee: 1300, structureAmount: 500 },
  { id: _suid('julietman'),   name: 'Juliet Manin',        category: 'Social Media Manager',  contact: '', notes: '', monthlyFee: 1500, structureAmount: 200 },
  { id: _suid('miamoral'),    name: 'Mia Moral',           category: 'Fotografo',             contact: '', notes: '', monthlyFee: 0,    structureAmount: 0   },
  { id: _suid('paucondom'),   name: 'Pau Condom',          category: 'Content Creator',       contact: '', notes: '', monthlyFee: 1500, structureAmount: 0   },
  { id: _suid('pautorr'),     name: 'Pau Torradas Cura',   category: 'Fotografo',             contact: '', notes: '', monthlyFee: 0,    structureAmount: 0   },
  { id: _suid('tomascucc'),   name: 'Tomas Cuccioleta',    category: 'Setter SCP',            contact: '', notes: '', monthlyFee: 510,  structureAmount: 510 },
]

function _scid(s: string) { return 'seed-sc-' + s }

const SEED_STRUCTURE_COSTS: StructureCost[] = [
  { id: _scid('josepcab'),  name: 'Josep Cabedo',      category: 'Social Media manager Guinew', amount: 500,  supplierRef: _suid('josepcab')  },
  { id: _scid('julietman'), name: 'Juliet Manin',      category: 'Social Media Guinew',         amount: 200,  supplierRef: _suid('julietman') },
  { id: _scid('bernatruiz'),name: 'Bernat Ruiz Garcia',category: 'SCP',                         amount: 500,  supplierRef: _suid('bernatruiz')},
  { id: _scid('tomascucc'), name: 'Tomas Cuccioleta',  category: 'SCP',                         amount: 510,  supplierRef: _suid('tomascucc') },
  { id: _scid('gastosvari'),name: 'Gastos Varios',     category: 'Software',                    amount: 2500, supplierRef: ''                 },
]

const defaultData: FinanceData = {
  records: SEED_RECORDS,
  suppliers: SEED_SUPPLIERS,
  structureCosts: SEED_STRUCTURE_COSTS,
  marginObjective: 50,
  allocationMode: 'proportional',
}

type Section = 'resum' | 'cartera' | 'proveidors' | 'estructura' | 'grafics' | 'configuracio'

function formatEur(n: number) {
  return n.toLocaleString('ca-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function newRecord(clientName = ''): ClientRecord {
  return {
    id: uid(), clientName: clientName || 'Nou client', tipo: 'Recurrent', estado: 'Actiu',
    fee: 0, marginObjective: 0, startDate: '', endDate: '', responsible: '',
    services: '', observations: '', collaborators: [{ id: uid(), name: '', role: '', cost: 0 }], otherCosts: [],
  }
}

function recordDirectCost(r: ClientRecord) {
  return r.collaborators.reduce((s, c) => s + (c.cost || 0), 0) + r.otherCosts.reduce((s, c) => s + (c.amount || 0), 0)
}

export function FinancesContent({ clients, profiles }: { clients: ClientBasic[]; profiles: ProfileBasic[] }) {
  const searchParams = useSearchParams()
  const section = (searchParams.get('s') as Section) || 'resum'
  const [data, setData] = useState<FinanceData>(defaultData)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        let changed = false
        const hasSeededRecords = parsed.records?.some((r: ClientRecord) => r.id?.startsWith('seed-'))
        if (!parsed.records || parsed.records.length === 0 || !hasSeededRecords) {
          parsed.records = SEED_RECORDS; changed = true
        }
        const hasSeededSuppliers = parsed.suppliers?.some((s: Supplier) => s.id?.startsWith('seed-sup-'))
        if (!parsed.suppliers || parsed.suppliers.length === 0 || !hasSeededSuppliers) {
          parsed.suppliers = SEED_SUPPLIERS; changed = true
        }
        const hasSeededSC = parsed.structureCosts?.some((sc: StructureCost) => sc.id?.startsWith('seed-sc-'))
        if (!parsed.structureCosts || parsed.structureCosts.length === 0 || !hasSeededSC) {
          parsed.structureCosts = SEED_STRUCTURE_COSTS; changed = true
        }
        if (changed) localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
        setData(parsed)
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData))
      }
    } catch {}
  }, [])

  const save = useCallback((next: FinanceData) => {
    setData(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }, [])

  const kpis = useMemo(() => {
    const records = data.records.filter(r => r.estado === 'Actiu')
    const totalRecurrent = records.filter(r => r.tipo === 'Recurrent').reduce((s, r) => s + r.fee, 0)
    const totalProjects = records.filter(r => r.tipo === 'Puntual').reduce((s, r) => s + r.fee, 0)
    const totalFees = totalRecurrent + totalProjects
    const directCosts = records.reduce((s, r) => s + recordDirectCost(r), 0)
    const suppliersTotal = data.suppliers.reduce((s, sup) => s + (sup.structureAmount || 0), 0)
    const structureCosts = data.structureCosts.reduce((s, sc) => s + (sc.amount || 0), 0) + suppliersTotal
    const contributionMargin = totalFees - directCosts
    const operativeResult = contributionMargin - structureCosts
    const globalMarginPct = totalFees > 0 ? (contributionMargin / totalFees) * 100 : 0
    const annualForecast = totalRecurrent * 12 + totalProjects
    return { totalRecurrent, totalProjects, totalFees, directCosts, structureCosts, contributionMargin, operativeResult, globalMarginPct, annualForecast }
  }, [data])

  const clientProfitability = useMemo(() => {
    const grouped: Record<string, { fee: number; directCost: number; marginObjective: number; clientId?: string }> = {}
    for (const r of data.records.filter(r => r.estado === 'Actiu')) {
      const key = r.clientName
      if (!grouped[key]) grouped[key] = { fee: 0, directCost: 0, marginObjective: r.marginObjective || data.marginObjective, clientId: r.clientId }
      grouped[key].fee += r.fee
      grouped[key].directCost += recordDirectCost(r)
    }
    const totalFees = kpis.totalFees
    return Object.entries(grouped).map(([name, g]) => {
      const alloc = totalFees > 0 ? kpis.structureCosts * (g.fee / totalFees) : 0
      const marginEur = g.fee - g.directCost - alloc
      const margin = g.fee > 0 ? (marginEur / g.fee) * 100 : 0
      return { name, fee: g.fee, marginEur, margin, marginObjective: g.marginObjective, clientId: g.clientId }
    })
  }, [data, kpis])

  const adequate = clientProfitability.filter(c => c.margin >= c.marginObjective)
  const belowObj = clientProfitability.filter(c => c.margin >= 0 && c.margin < c.marginObjective)
  const deficit = clientProfitability.filter(c => c.margin < 0)

  return (
    <div className="fin-root">
      {saved && <div className="fin-saved-toast">Dades guardades</div>}

      {section === 'resum' && (
        <ResumSection kpis={kpis} adequate={adequate} belowObj={belowObj} deficit={deficit} marginObjective={data.marginObjective} />
      )}
      {section === 'cartera' && (
        <CarteraSection data={data} save={save} clients={clients} profiles={profiles} kpis={kpis} marginObjective={data.marginObjective} />
      )}
      {section === 'proveidors' && (
        <ProveidorsSection data={data} save={save} />
      )}
      {section === 'grafics' && (
        <GraficsSection data={data} kpis={kpis} marginObjective={data.marginObjective} />
      )}
      {section === 'estructura' && (
        <EstructuraSection data={data} save={save} />
      )}
      {section === 'configuracio' && (
        <ConfiguracioSection data={data} save={save} />
      )}

      <style jsx>{`
        .fin-root {
          padding: 28px 32px;
          background: #F6F8FC;
          min-height: calc(100vh - 60px);
          position: relative;
        }
        @media (max-width: 767px) {
          .fin-root { padding: 16px 14px 80px; }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .fin-root { padding: 20px 20px 40px; }
        }
        .fin-saved-toast {
          position: fixed; bottom: 24px; right: 24px; padding: 10px 18px;
          background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 10px;
          font-size: 13px; font-weight: 600; color: #059669;
          box-shadow: 0 4px 16px rgba(0,0,0,0.1); z-index: 200;
        }
      `}</style>
    </div>
  )
}

/* ─── RESUM ─── */
function ResumSection({ kpis, adequate, belowObj, deficit, marginObjective }: any) {
  const [activeGroup, setActiveGroup] = useState<'adequate' | 'below' | 'deficit' | null>(null)

  const kpi1 = [
    { label: 'Pressupost mensual recurrent', value: formatEur(kpis.totalRecurrent), sub: `${adequate.length + belowObj.length + deficit.length} clients actius`, color: '#2563EB' },
    { label: 'Pressupost projectes puntuals', value: formatEur(kpis.totalProjects), sub: 'Projectes en curs', color: '#7C3AED' },
    { label: 'Costos directes', value: formatEur(kpis.directCosts), sub: 'Equip + despeses directes', color: '#DC2626' },
    { label: 'Gastos d\'estructura', value: formatEur(kpis.structureCosts), sub: 'Repartiment proporcional al fee', color: '#D97706' },
  ]
  const marginPct = kpis.globalMarginPct
  const kpi2 = [
    { label: 'Marge de contribució', value: formatEur(kpis.contributionMargin), sub: '= Ingressos − Costos directes', positive: kpis.contributionMargin >= 0 },
    { label: 'Resultat operatiu estimat', value: formatEur(kpis.operativeResult), sub: '= Marge contribució − Estructura', positive: kpis.operativeResult >= 0 },
    { label: 'Marge global de cartera', value: marginPct.toFixed(1) + '%', sub: `Objectiu: ${marginObjective.toFixed(1)}%`, positive: marginPct >= marginObjective },
    { label: 'Previsió anual', value: formatEur(kpis.annualForecast), sub: 'Recurrent × 12 + Projectes', positive: true },
  ]
  const groups = [
    { id: 'adequate' as const, label: 'Rendibilitat adequada', count: adequate.length, color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', clients: adequate },
    { id: 'below' as const, label: 'Per sota l\'objectiu', count: belowObj.length, color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', clients: belowObj },
    { id: 'deficit' as const, label: 'Deficitari', count: deficit.length, color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', clients: deficit },
  ]
  const activeGroupData = groups.find(g => g.id === activeGroup)

  return (
    <div>
      <div className="rs-title">Resum general</div>
      <div className="rs-grid">
        {kpi1.map((k, i) => (
          <div key={i} className="rs-kpi" style={{ borderTop: `3px solid ${k.color}` }}>
            <div className="rs-kpi-label">{k.label}</div>
            <div className="rs-kpi-value">{k.value}</div>
            <div className="rs-kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>
      <div className="rs-grid rs-grid--accent">
        {kpi2.map((k, i) => (
          <div key={i} className="rs-kpi rs-kpi--accent">
            <div className="rs-kpi-label">{k.label}</div>
            <div className={`rs-kpi-value ${k.positive ? 'rs-kpi-value--pos' : 'rs-kpi-value--neg'}`}>
              {k.positive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              {k.value}
            </div>
            <div className="rs-kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>
      <div className="rs-section-title">Clients actius per nivell de rendibilitat</div>
      <div className="rs-sub-hint">Fes clic en una targeta per veure quins clients la componen.</div>
      <div className="rs-prof-grid">
        {groups.map(g => (
          <button key={g.id} className={`rs-prof-card${activeGroup === g.id ? ' rs-prof-card--active' : ''}`}
            style={{ background: g.bg, borderColor: activeGroup === g.id ? g.color : g.border }}
            onClick={() => setActiveGroup(activeGroup === g.id ? null : g.id)}>
            <div className="rs-prof-count" style={{ color: g.color }}>{g.count}</div>
            <div className="rs-prof-label" style={{ color: g.color }}>{g.label}</div>
          </button>
        ))}
      </div>
      {activeGroupData && activeGroupData.clients.length > 0 && (
        <div className="rs-client-table-wrap">
          <table className="rs-client-table">
            <thead><tr><th>Client</th><th>Fee</th><th>Marge €</th><th>Marge %</th><th></th></tr></thead>
            <tbody>
              {activeGroupData.clients.map((c: any) => (
                <tr key={c.name}>
                  <td className="rs-ct-name">
                    {c.clientId
                      ? <Link href={`/clients/${c.clientId}`} className="rs-ct-link">{c.name}</Link>
                      : c.name}
                  </td>
                  <td className="rs-ct-fee">{formatEur(c.fee)}</td>
                  <td className="rs-ct-margin-eur" style={{ color: activeGroupData.color }}>{formatEur(c.marginEur)}</td>
                  <td><span className="rs-ct-pct" style={{ color: activeGroupData.color, background: activeGroupData.color + '15', border: `1px solid ${activeGroupData.color}25` }}>{c.margin.toFixed(1)}%</span></td>
                  <td>
                    {c.clientId && (
                      <Link href={`/clients/${c.clientId}`} className="rs-ct-goto" title="Veure client">→</Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="rs-ct-footer">
            <Link href="/finances?s=cartera" className="rs-ct-cartera-link">
              Veure tots a la cartera →
            </Link>
          </div>
        </div>
      )}
      {activeGroupData && activeGroupData.clients.length === 0 && (
        <div className="rs-client-table-empty">Cap client en aquest grup</div>
      )}
      <style jsx>{`
        .rs-title { font-size: 20px; font-weight: 700; color: #0F1B2D; letter-spacing: -0.02em; margin-bottom: 20px; }
        .rs-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; margin-bottom: 14px; }
        .rs-kpi { background: white; border-radius: 18px; padding: 20px 20px 18px; border: 1px solid rgba(0,0,0,0.06); box-shadow: 0 2px 8px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03); transition: all 0.18s; }
        .rs-kpi:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,0.08); }
        .rs-kpi--accent { border-top: 3px solid #2563EB; }
        .rs-kpi-label { font-size: 11px; font-weight: 600; color: #A0A9BB; letter-spacing: 0.04em; text-transform: uppercase; margin-bottom: 10px; line-height: 1.4; }
        .rs-kpi-value { font-size: 22px; font-weight: 700; color: #0F1B2D; letter-spacing: -0.02em; margin-bottom: 6px; display: flex; align-items: center; gap: 4px; }
        .rs-kpi-value--pos { color: #059669; }
        .rs-kpi-value--neg { color: #DC2626; }
        .rs-kpi-sub { font-size: 11.5px; color: #A0A9BB; line-height: 1.4; }
        .rs-section-title { font-size: 15px; font-weight: 700; color: #0F1B2D; margin: 28px 0 2px; }
        .rs-sub-hint { font-size: 12px; color: #A0A9BB; margin-bottom: 14px; }
        .rs-prof-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; }
        .rs-prof-card { border: 2px solid; border-radius: 18px; padding: 24px 22px; text-align: left; cursor: pointer; transition: all 0.18s; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
        .rs-prof-card:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(0,0,0,0.09); }
        .rs-prof-card--active { box-shadow: 0 6px 24px rgba(0,0,0,0.12); transform: translateY(-1px); }
        .rs-prof-count { font-size: 36px; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 6px; }
        .rs-prof-label { font-size: 13.5px; font-weight: 600; }
        .rs-client-table-wrap { margin-top: 16px; background: white; border-radius: 16px; border: 1px solid rgba(0,0,0,0.06); box-shadow: 0 2px 8px rgba(0,0,0,0.05); overflow: hidden; }
        .rs-client-table { width: 100%; border-collapse: collapse; }
        .rs-client-table thead tr { border-bottom: 1px solid rgba(0,0,0,0.07); }
        .rs-client-table th { padding: 12px 18px; text-align: left; font-size: 10.5px; font-weight: 700; color: #A0A9BB; letter-spacing: 0.06em; text-transform: uppercase; }
        .rs-client-table td { padding: 13px 18px; border-bottom: 1px solid rgba(0,0,0,0.04); vertical-align: middle; }
        .rs-client-table tbody tr:last-child td { border-bottom: none; }
        .rs-client-table tbody tr:hover { background: #F8FAFF; }
        .rs-ct-name { font-size: 13.5px; font-weight: 600; color: #0F1B2D; }
        .rs-ct-link { font-size: 13.5px; font-weight: 600; color: #2563EB; text-decoration: none; }
        .rs-ct-link:hover { text-decoration: underline; }
        .rs-ct-goto { font-size: 14px; color: #A0A9BB; text-decoration: none; padding: 4px 8px; border-radius: 6px; transition: all 0.15s; }
        .rs-ct-goto:hover { color: #2563EB; background: #EFF6FF; }
        .rs-ct-fee { font-size: 13.5px; font-weight: 500; color: #5A6478; }
        .rs-ct-margin-eur { font-size: 13.5px; font-weight: 700; }
        .rs-ct-pct { font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 20px; }
        .rs-ct-footer { padding: 12px 18px; border-top: 1px solid rgba(0,0,0,0.05); text-align: right; }
        .rs-ct-cartera-link { font-size: 12.5px; font-weight: 600; color: #2563EB; text-decoration: none; opacity: 0.8; transition: opacity 0.15s; }
        .rs-ct-cartera-link:hover { opacity: 1; text-decoration: underline; }
        .rs-client-table-empty { margin-top: 14px; padding: 24px; text-align: center; font-size: 13.5px; color: #A0A9BB; background: white; border-radius: 14px; border: 1px solid rgba(0,0,0,0.06); }
        @media (max-width: 767px) {
          .rs-grid { grid-template-columns: 1fr 1fr; }
          .rs-prof-grid { grid-template-columns: 1fr; gap: 10px; }
          .rs-prof-card { padding: 16px 18px; border-radius: 14px; display: flex; align-items: center; gap: 14px; }
          .rs-prof-count { font-size: 28px; margin-bottom: 0; }
          .rs-client-table-wrap { overflow-x: auto; }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .rs-grid { grid-template-columns: 1fr 1fr; }
          .rs-prof-grid { grid-template-columns: repeat(3,1fr); }
        }
      `}</style>
    </div>
  )
}

/* ─── CARTERA ─── */
function CarteraSection({ data, save, clients, profiles, kpis, marginObjective }: any) {
  const [view, setView] = useState<'table' | 'form'>('table')
  const [editRecord, setEditRecord] = useState<ClientRecord | null>(null)

  const openNew = () => { setEditRecord(newRecord()); setView('form') }
  const openEdit = (r: ClientRecord) => { setEditRecord({ ...r }); setView('form') }
  const back = () => { setView('table'); setEditRecord(null) }

  const saveRecord = (r: ClientRecord) => {
    const exists = data.records.find((rec: ClientRecord) => rec.id === r.id)
    const nextRecords = exists
      ? data.records.map((rec: ClientRecord) => rec.id === r.id ? r : rec)
      : [...data.records, r]
    save({ ...data, records: nextRecords })
    back()
  }

  const deleteRecord = (id: string) => {
    save({ ...data, records: data.records.filter((r: ClientRecord) => r.id !== id) })
    back()
  }

  if (view === 'form' && editRecord) {
    return <RecordForm record={editRecord} clients={clients} profiles={profiles} data={data} kpis={kpis} marginObjective={marginObjective} onBack={back} onSave={saveRecord} onDelete={deleteRecord} />
  }

  const updateRecord = (id: string, field: keyof ClientRecord, value: any) =>
    save({ ...data, records: data.records.map((r: ClientRecord) => r.id === id ? { ...r, [field]: value } : r) })

  return <CarteraTable data={data} kpis={kpis} marginObjective={marginObjective} onNew={openNew} onEdit={openEdit} onUpdate={updateRecord} onDelete={(id: string) => save({ ...data, records: data.records.filter((r: ClientRecord) => r.id !== id) })} />
}

/* ─── CARTERA TABLE ─── */
const AVATAR_COLORS = ['#1B2B4B','#2563EB','#7C3AED','#059669','#D97706','#0891B2','#9333EA','#DC2626','#0D9488']
const getAvatarColor = (name: string) => AVATAR_COLORS[(name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % AVATAR_COLORS.length]
const getInitials = (name: string) => name.trim().split(/\s+/).map((w: string) => w[0]).join('').slice(0,2).toUpperCase()

const CT_COLS = [
  { id: 'estat',       label: 'Estat',        sortKey: null,        width: 88  },
  { id: 'fee',         label: 'Fee',          sortKey: 'fee',       width: 104 },
  { id: 'dc',          label: 'Cost directe', sortKey: 'dc',        width: 104 },
  { id: 'margenEur',   label: 'Marge',        sortKey: 'margenEur', width: 104 },
  { id: 'margenPct',   label: '%',            sortKey: 'margenPct', width: 72  },
  { id: 'rent',        label: 'Rendibilitat', sortKey: 'rentKey',   width: 164 },
  { id: 'responsible', label: 'Responsable',  sortKey: null,        width: 110 },
]

function CarteraTable({ data, kpis, marginObjective, onNew, onEdit, onUpdate, onDelete }: any) {
  const [filterTipo, setFilterTipo] = useState('all')
  const [filterRent, setFilterRent] = useState('all')
  const [filterEstat, setFilterEstat] = useState('all')
  const [sortCol, setSortCol] = useState('clientName')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set())
  const [showColMenu, setShowColMenu] = useState(false)
  const [colOrder, setColOrder] = useState(() => CT_COLS.map((_, i) => i))
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  const toggleCol = (id: string) => setHiddenCols(prev => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  })
  const visibleCtCols = colOrder.filter(ci => !hiddenCols.has(CT_COLS[ci].id))

  const totalFees = kpis.totalFees
  const rentConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
    adequate: { label: 'Rendibilitat adequada', color: '#059669', bg: '#F0FDF4', border: '#BBF7D0' },
    below: { label: 'Per sota l\'objectiu', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
    deficit: { label: 'Deficitari', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
  }

  const rows = useMemo(() => data.records.map((r: ClientRecord) => {
    const dc = recordDirectCost(r)
    const alloc = totalFees > 0 ? kpis.structureCosts * (r.fee / totalFees) : 0
    const margenEur = r.fee - dc - alloc
    const margenPct = r.fee > 0 ? (margenEur / r.fee) * 100 : 0
    const obj = r.marginObjective || marginObjective
    const rentKey = margenPct >= obj ? 'adequate' : margenPct >= 0 ? 'below' : 'deficit'
    return { ...r, dc, margenEur, margenPct, rentKey }
  }), [data.records, kpis, marginObjective])

  const filtered = useMemo(() => {
    let r = rows
    if (filterTipo !== 'all') r = r.filter((row: any) => row.tipo.toLowerCase() === filterTipo)
    if (filterRent !== 'all') r = r.filter((row: any) => row.rentKey === filterRent)
    if (filterEstat !== 'all') r = r.filter((row: any) => row.estado.toLowerCase() === filterEstat)
    return [...r].sort((a: any, b: any) => {
      let av = a[sortCol], bv = b[sortCol]
      if (typeof av === 'string') { av = av.toLowerCase(); bv = bv.toLowerCase() }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [rows, filterTipo, filterRent, filterEstat, sortCol, sortDir])

  const exportCSV = () => {
    const header = ['Client','Tipus','Estat','Fee','Cost directe','Marge €','Marge %','Responsable','Rendibilitat']
    const csvRows = filtered.map((r: any) => [
      r.clientName, r.tipo, r.estado, r.fee.toFixed(2), r.dc.toFixed(2),
      r.margenEur.toFixed(2), r.margenPct.toFixed(1)+'%', r.responsible||'', rentConfig[r.rentKey].label
    ])
    const csv = [header, ...csvRows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'cartera.csv'; a.click()
  }

  return (
    <div>
      <div className="ct-topbar">
        <div>
          <div className="ct-title">Cartera de clients</div>
          <div className="ct-sub">{filtered.length} {filtered.length === 1 ? 'client' : 'clients'}</div>
        </div>
        <div className="ct-actions">
          <div style={{ position: 'relative' }}>
            <button className="ct-btn-export" onClick={() => setShowColMenu(v => !v)}>
              Columnes{hiddenCols.size > 0 ? ` (${CT_COLS.length - hiddenCols.size}/${CT_COLS.length})` : ' ▾'}
            </button>
            {showColMenu && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setShowColMenu(false)} />
                <div className="ct-col-menu">
                  {CT_COLS.map(col => (
                    <label key={col.id} className="ct-col-menu-item">
                      <input type="checkbox" checked={!hiddenCols.has(col.id)} onChange={() => toggleCol(col.id)} />
                      {col.label === 'Resp.' ? 'Responsable' : col.label}
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
          <button className="ct-btn-export" onClick={exportCSV}><Download size={14} />Exportar CSV</button>
          <button className="ct-btn-new" onClick={onNew}><Plus size={14} />Nou registre</button>
        </div>
      </div>

      <div className="ct-toolbar">
        <div className="ct-filters">
          {[
            { label: 'Tipus', value: filterTipo, set: setFilterTipo, opts: [['all','Tots'],['recurrent','Recurrent'],['puntual','Puntual']] },
            { label: 'Estat', value: filterEstat, set: setFilterEstat, opts: [['all','Tots'],['actiu','Actiu'],['inactiu','Inactiu']] },
            { label: 'Rendibilitat', value: filterRent, set: setFilterRent, opts: [['all','Totes'],['adequate','Rendibilitat adequada'],['below','Per sota l\'objectiu'],['deficit','Deficitari']] },
          ].map(f => (
            <div key={f.label} className="ct-filter-group">
              <label>{f.label}</label>
              <select value={f.value} onChange={e => f.set(e.target.value)}>
                {f.opts.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          ))}
        </div>
        <div className="ct-sort-wrap">
          <label className="ct-sort-label">Ordenar per</label>
          <select className="ct-sort-select" value={sortCol} onChange={e => { setSortCol(e.target.value); setSortDir('asc') }}>
            <option value="clientName">Nom</option>
            <option value="fee">Fee</option>
            <option value="dc">Cost directe</option>
            <option value="margenEur">Marge €</option>
            <option value="margenPct">Marge %</option>
            <option value="rentKey">Rendibilitat</option>
          </select>
          <button className="ct-sort-dir" onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}>
            {sortDir === 'asc' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="ct-empty">Cap registre. Fes clic a «Nou registre» per afegir el primer client.</div>
      ) : (
        <div className="ct-list">
          {/* Header row */}
          <div className="ct-header">
            <div className="ct-header-left">Client</div>
            <div className="ct-header-right">
              {visibleCtCols.map((ci, pos) => {
                const col = CT_COLS[ci]
                return (
                  <div
                    key={col.id}
                    className={`ct-hcell${col.id === 'responsible' ? ' ct-hcell--resp' : ''}${dragIdx === pos ? ' ct-hcell--dragging' : ''}${dragOverIdx === pos && dragIdx !== pos ? ' ct-hcell--over' : ''}`}
                    style={{ width: col.width, flexShrink: 0, cursor: dragIdx !== null ? 'grabbing' : 'grab' }}
                    draggable
                    onDragStart={() => setDragIdx(pos)}
                    onDragOver={e => { e.preventDefault(); setDragOverIdx(pos) }}
                    onDrop={e => {
                      e.preventDefault()
                      if (dragIdx === null || dragIdx === pos) { setDragIdx(null); setDragOverIdx(null); return }
                      const fromCi = visibleCtCols[dragIdx]
                      const toCi = visibleCtCols[pos]
                      const fromOrdIdx = colOrder.indexOf(fromCi)
                      const toOrdIdx = colOrder.indexOf(toCi)
                      const next = [...colOrder]
                      next.splice(fromOrdIdx, 1)
                      next.splice(toOrdIdx, 0, fromCi)
                      setColOrder(next); setDragIdx(null); setDragOverIdx(null)
                    }}
                    onDragEnd={() => { setDragIdx(null); setDragOverIdx(null) }}
                  >
                    {col.label === 'Resp.' ? 'Resp.' : col.label}
                  </div>
                )
              })}
              <div style={{ width: 60, flexShrink: 0 }} />
            </div>
          </div>

          {filtered.map((row: any) => {
            const initials = getInitials(row.clientName)
            const avatarBg = getAvatarColor(row.clientName)
            const rc = rentConfig[row.rentKey]
            const respInitials = row.responsible ? getInitials(row.responsible) : ''
            const respBg = row.responsible ? getAvatarColor(row.responsible) : '#9CA3AF'
            const up = (field: keyof ClientRecord, val: any) => onUpdate(row.id, field, val)
            return (
              <div key={row.id} className="ct-card">
                {/* Left: avatar + nom + tipus */}
                <div className="ct-card-left">
                  {row.photoUrl
                    ? <img src={row.photoUrl} alt="" className="ct-avatar ct-avatar--photo" />
                    : <div className="ct-avatar" style={{ background: avatarBg }}>{initials}</div>
                  }
                  <div className="ct-card-inputs">
                    {row.clientId ? (
                      <Link href={`/clients/${row.clientId}`} className="ct-name ct-name-link">{row.clientName}</Link>
                    ) : (
                      <input className="ct-inline-input ct-inline-input--name" value={row.clientName} placeholder="Nom del client..." onChange={e => up('clientName', e.target.value)} onClick={e => e.stopPropagation()} />
                    )}
                    <select className="ct-inline-select" value={row.tipo} onChange={e => up('tipo', e.target.value)} onClick={e => e.stopPropagation()}>
                      <option value="Recurrent">Recurrent</option>
                      <option value="Puntual">Puntual</option>
                    </select>
                  </div>
                </div>

                {/* Right: stat columns */}
                <div className="ct-card-right">
                  {visibleCtCols.map(ci => {
                    const col = CT_COLS[ci]
                    if (col.id === 'estat') return (
                      <div key={col.id} className="ct-stat" style={{ width: col.width, flexShrink: 0 }}>
                        <button
                          className={`ct-estat ct-estat--${row.estado === 'Actiu' ? 'active' : 'inactive'} ct-estat--btn`}
                          onClick={e => { e.stopPropagation(); up('estado', row.estado === 'Actiu' ? 'Inactiu' : 'Actiu') }}
                        >
                          <span className="ct-estat-dot" />{row.estado}
                        </button>
                      </div>
                    )
                    if (col.id === 'fee') return (
                      <div key={col.id} className="ct-stat" style={{ width: col.width, flexShrink: 0 }}>
                        <input className="ct-num-input" type="number" min="0" value={row.fee || ''} placeholder="0" onClick={e => e.stopPropagation()} onChange={e => up('fee', parseFloat(e.target.value) || 0)} />
                      </div>
                    )
                    if (col.id === 'dc') return (
                      <div key={col.id} className="ct-stat" style={{ width: col.width, flexShrink: 0 }}>
                        <span className="ct-cost-dir">{formatEur(row.dc)}</span>
                      </div>
                    )
                    if (col.id === 'margenEur') return (
                      <div key={col.id} className="ct-stat" style={{ width: col.width, flexShrink: 0 }}>
                        <span className="ct-margin-eur" style={{ color: rc.color }}>{formatEur(row.margenEur)}</span>
                      </div>
                    )
                    if (col.id === 'margenPct') return (
                      <div key={col.id} className="ct-stat" style={{ width: col.width, flexShrink: 0 }}>
                        <span className="ct-pct-val">{row.margenPct.toFixed(1)}%</span>
                      </div>
                    )
                    if (col.id === 'rent') return (
                      <div key={col.id} className="ct-stat ct-stat--rent" style={{ width: col.width, flexShrink: 0 }}>
                        <span className="ct-rent-badge" style={{ color: rc.color, background: rc.bg, border: `1px solid ${rc.border}` }}>{rc.label}</span>
                      </div>
                    )
                    if (col.id === 'responsible') return (
                      <div key={col.id} className="ct-stat ct-stat--resp" style={{ width: col.width, flexShrink: 0 }} title={row.responsible || ''}>
                        <input className="ct-resp-input" value={row.responsible || ''} placeholder="—" onClick={e => e.stopPropagation()} onChange={e => up('responsible', e.target.value)} />
                      </div>
                    )
                    return null
                  })}
                  <div className="ct-card-actions">
                    <button className="ct-action-btn ct-action-btn--edit" onClick={() => onEdit(row)} title="Editar detalls"><Pencil size={12}/></button>
                    <button className="ct-action-btn ct-action-btn--del" onClick={() => onDelete(row.id)}><Trash2 size={13}/></button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <style jsx>{`
        /* ── Topbar ── */
        .ct-topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; gap: 16px; }
        .ct-title { font-size: 19px; font-weight: 700; color: #111827; letter-spacing: -0.02em; }
        .ct-sub { font-size: 12.5px; color: #9CA3AF; margin-top: 2px; }
        .ct-actions { display: flex; gap: 8px; flex-shrink: 0; align-items: center; }
        .ct-btn-export { height: 34px; padding: 0 14px; border: 1px solid #E5E7EB; border-radius: 8px; font-size: 13px; font-weight: 500; color: #374151; background: white; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.12s; white-space: nowrap; }
        .ct-btn-export:hover { border-color: #2563EB; color: #2563EB; }
        .ct-btn-new { height: 34px; padding: 0 16px; background: linear-gradient(135deg,#1B2B4B,#2563EB); color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 1px 6px rgba(37,99,235,0.25); transition: opacity 0.12s; }
        .ct-btn-new:hover { opacity: 0.88; }

        /* Column visibility menu */
        .ct-col-menu { position: absolute; top: calc(100% + 6px); right: 0; background: white; border: 1px solid #E5E7EB; border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); padding: 8px; z-index: 200; min-width: 170px; display: flex; flex-direction: column; gap: 2px; }
        .ct-col-menu-item { display: flex; align-items: center; gap: 8px; padding: 6px 10px; border-radius: 6px; font-size: 13px; color: #374151; cursor: pointer; font-weight: 500; transition: background 0.1s; user-select: none; }
        .ct-col-menu-item:hover { background: #F3F4F6; }
        .ct-col-menu-item input[type="checkbox"] { width: 15px; height: 15px; accent-color: #2563EB; cursor: pointer; flex-shrink: 0; }

        /* ── Toolbar ── */
        .ct-toolbar { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; margin-bottom: 14px; flex-wrap: wrap; }
        .ct-filters { display: flex; gap: 10px; flex-wrap: wrap; align-items: flex-end; }
        .ct-filter-group { display: flex; flex-direction: column; gap: 3px; }
        .ct-filter-group label { font-size: 10px; font-weight: 700; color: #9CA3AF; letter-spacing: 0.07em; text-transform: uppercase; }
        .ct-filter-group select { height: 32px; padding: 0 10px; border: 1px solid #E5E7EB; border-radius: 7px; font-size: 13px; color: #111827; background: white; outline: none; cursor: pointer; font-family: inherit; min-width: 120px; transition: border-color 0.12s; }
        .ct-filter-group select:focus { border-color: #2563EB; }
        .ct-sort-wrap { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
        .ct-sort-label { font-size: 10px; font-weight: 700; color: #9CA3AF; letter-spacing: 0.07em; text-transform: uppercase; white-space: nowrap; }
        .ct-sort-select { height: 32px; padding: 0 10px; border: 1px solid #E5E7EB; border-radius: 7px; font-size: 13px; color: #111827; background: white; outline: none; cursor: pointer; font-family: inherit; transition: border-color 0.12s; }
        .ct-sort-select:focus { border-color: #2563EB; }
        .ct-sort-dir { width: 32px; height: 32px; border: 1px solid #E5E7EB; border-radius: 7px; background: white; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #6B7280; transition: all 0.12s; }
        .ct-sort-dir:hover { border-color: #2563EB; color: #2563EB; }

        /* ── Card layout (Proveïdors-style flex) ── */
        .ct-list { display: flex; flex-direction: column; gap: 5px; }

        /* Header row */
        .ct-header { display: flex; align-items: center; gap: 16px; padding: 9px 20px; background: #F8F9FB; border-radius: 10px; border: 1px solid #F0F2F6; margin-bottom: 4px; }
        .ct-header-left { width: 260px; flex-shrink: 0; font-size: 10.5px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.07em; }
        .ct-header-right { display: flex; align-items: center; flex: 1; gap: 20px; justify-content: space-between; }
        .ct-hcell { font-size: 10.5px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.07em; white-space: nowrap; text-align: right; border-radius: 6px; padding: 3px 5px; user-select: none; transition: background 0.12s, color 0.12s, outline 0.12s; }
        .ct-hcell--resp { text-align: center; }
        .ct-hcell--dragging { opacity: 0.25; background: #E5E7EB; }
        .ct-hcell--over { background: #DBEAFE; color: #1D4ED8; outline: 2px solid #3B82F6; outline-offset: 1px; }

        .ct-card { display: flex; align-items: center; background: white; border-radius: 12px; border: 1px solid #E8ECF2; padding: 14px 20px; gap: 16px; transition: border-color 0.15s, box-shadow 0.15s; }
        .ct-card:hover { border-color: #C7D2E4; box-shadow: 0 2px 10px rgba(0,0,0,0.06); }

        .ct-card-left { display: flex; align-items: center; gap: 14px; width: 260px; flex-shrink: 0; }
        .ct-card-right { display: flex; align-items: center; flex: 1; gap: 20px; justify-content: space-between; }
        .ct-card-actions { display: flex; align-items: center; flex-shrink: 0; gap: 4px; }
        .ct-card-inputs { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }

        /* Client info */
        .ct-avatar { width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: white; flex-shrink: 0; letter-spacing: -0.02em; }
        .ct-avatar--photo { object-fit: cover; }
        .ct-card-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .ct-name { font-size: 14px; font-weight: 700; color: #111827; letter-spacing: -0.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ct-name-link { text-decoration: none; color: #2563EB; }
        .ct-name-link:hover { text-decoration: underline; }
        .ct-tipo { font-size: 12px; color: #9CA3AF; font-weight: 500; }
        /* Inline editable inputs */
        .ct-inline-input { width: 100%; border: 1px solid transparent; border-radius: 6px; font-size: 14px; font-weight: 700; color: #111827; font-family: inherit; outline: none; background: transparent; padding: 1px 0; transition: border-color 0.12s, background 0.12s, padding 0.12s; cursor: default; letter-spacing: -0.01em; }
        .ct-inline-input:hover { background: #F3F4F6; padding: 1px 6px; cursor: text; }
        .ct-inline-input:focus { border-color: #2563EB; background: white; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); padding: 1px 6px; cursor: text; }
        .ct-inline-select { border: 1px solid transparent; border-radius: 6px; font-size: 12px; font-weight: 500; color: #9CA3AF; font-family: inherit; outline: none; background: transparent; padding: 1px 0; transition: border-color 0.12s, background 0.12s; cursor: default; appearance: none; }
        .ct-inline-select:hover { background: #F3F4F6; padding: 1px 4px; cursor: pointer; }
        .ct-inline-select:focus { border-color: #2563EB; background: white; padding: 1px 4px; cursor: pointer; }
        .ct-num-input { width: 100%; height: 28px; padding: 0 4px; border: 1px solid transparent; border-radius: 6px; font-size: 14px; font-weight: 600; color: #111827; text-align: right; font-family: inherit; outline: none; font-variant-numeric: tabular-nums; background: transparent; transition: border-color 0.12s, background 0.12s; cursor: default; }
        .ct-num-input:hover { background: #F3F4F6; cursor: text; }
        .ct-num-input:focus { border-color: #2563EB; background: white; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); cursor: text; }
        .ct-resp-input { width: 100%; border: 1px solid transparent; border-radius: 6px; font-size: 11px; font-weight: 600; color: #374151; text-align: center; font-family: inherit; outline: none; background: transparent; padding: 2px 2px; transition: border-color 0.12s, background 0.12s; cursor: default; }
        .ct-resp-input:hover { background: #F3F4F6; cursor: text; }
        .ct-resp-input:focus { border-color: #2563EB; background: white; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); cursor: text; }
        .ct-estat--btn { background: none; border: none; cursor: pointer; padding: 0; font-family: inherit; }

        /* Stat columns */
        .ct-stat { display: flex; align-items: center; justify-content: flex-end; }
        .ct-stat-lbl { font-size: 9.5px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.07em; white-space: nowrap; }
        .ct-stat--resp { justify-content: center; }

        /* Estat */
        .ct-estat { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 600; white-space: nowrap; }
        .ct-estat-dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; flex-shrink: 0; }
        .ct-estat--active { color: #16A34A; }
        .ct-estat--inactive { color: #9CA3AF; }

        /* Numeric values */
        .ct-fee { font-size: 14px; font-weight: 600; color: #111827; font-variant-numeric: tabular-nums; white-space: nowrap; }
        .ct-cost-dir { font-size: 14px; font-weight: 500; color: #DC2626; font-variant-numeric: tabular-nums; white-space: nowrap; }
        .ct-margin-eur { font-size: 14px; font-weight: 700; font-variant-numeric: tabular-nums; white-space: nowrap; }
        .ct-pct-val { font-size: 14px; font-weight: 600; color: #374151; font-variant-numeric: tabular-nums; white-space: nowrap; }

        /* Rendibilitat badge */
        .ct-rent-badge { font-size: 11.5px; font-weight: 600; padding: 3px 10px; border-radius: 99px; white-space: nowrap; }

        /* Responsable avatar */
        .ct-resp-avatar { width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10.5px; font-weight: 700; color: white; }
        .ct-resp-none { font-size: 13px; color: #D1D5DB; }

        /* Actions */
        .ct-action-btn { width: 28px; height: 28px; border: 1px solid #E5E7EB; border-radius: 7px; background: white; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #9CA3AF; transition: all 0.12s; }
        .ct-action-btn:hover { border-color: #2563EB; color: #2563EB; background: #EEF2FF; }
        .ct-action-btn--del { color: #FCA5A5; border-color: #FEE2E2; background: #FFF5F5; }
        .ct-action-btn--del:hover { border-color: #EF4444; color: #EF4444; background: #FEE2E2; }
        .ct-action-btn--edit { color: #9CA3AF; }
        .ct-action-btn--edit:hover { color: #2563EB; border-color: #2563EB; background: #EEF2FF; }

        /* Empty */
        .ct-empty { padding: 52px; text-align: center; font-size: 14px; color: #D1D5DB; background: white; border-radius: 12px; border: 1px solid #E8ECF2; }

        @media (max-width: 767px) {
          .ct-topbar { flex-direction: column; align-items: flex-start; gap: 10px; }
          .ct-actions { width: 100%; justify-content: flex-end; }
          .ct-header { display: none; }
          .ct-card { flex-direction: column; align-items: flex-start; gap: 10px; padding: 12px 14px; }
          .ct-card-left { width: 100%; }
          .ct-card-right { width: 100%; overflow-x: auto; padding-bottom: 4px; }
          .ct-toolbar { flex-direction: column; gap: 8px; }
          .ct-filters { width: 100%; }
          .ct-filter-group select { min-width: 0; width: 100%; }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .ct-header { display: none; }
          .ct-card { padding: 12px 16px; }
        }
      `}</style>
    </div>
  )
}

/* ─── RECORD FORM ─── */
function RecordForm({ record, clients, profiles, data, kpis, marginObjective, onBack, onSave, onDelete }: any) {
  const [r, setR] = useState<ClientRecord>({ ...record })
  const [confirmDelete, setConfirmDelete] = useState(false)

  const set = (field: keyof ClientRecord, value: any) => setR(prev => ({ ...prev, [field]: value }))

  const totalFees = kpis.totalFees + (r.fee - (data.records.find((rec: ClientRecord) => rec.id === r.id)?.fee ?? 0))
  const dc = recordDirectCost(r)
  const alloc = totalFees > 0 ? kpis.structureCosts * (r.fee / Math.max(totalFees, r.fee)) : 0
  const margenContr = r.fee - dc
  const resultatEst = margenContr - alloc
  const margenPct = r.fee > 0 ? (margenContr / r.fee) * 100 : 0

  const addCollab = () => setR(prev => ({ ...prev, collaborators: [...prev.collaborators, { id: uid(), name: '', role: '', cost: 0 }] }))
  const updateCollab = (id: string, field: keyof Collaborator, value: any) =>
    setR(prev => ({ ...prev, collaborators: prev.collaborators.map(c => c.id === id ? { ...c, [field]: value } : c) }))
  const removeCollab = (id: string) => setR(prev => ({ ...prev, collaborators: prev.collaborators.filter(c => c.id !== id) }))

  const addOtherCost = () => setR(prev => ({ ...prev, otherCosts: [...prev.otherCosts, { id: uid(), name: '', amount: 0 }] }))
  const updateOtherCost = (id: string, field: keyof OtherCost, value: any) =>
    setR(prev => ({ ...prev, otherCosts: prev.otherCosts.map(c => c.id === id ? { ...c, [field]: value } : c) }))
  const removeOtherCost = (id: string) => setR(prev => ({ ...prev, otherCosts: prev.otherCosts.filter(c => c.id !== id) }))

  const teamCost = r.collaborators.reduce((s, c) => s + (c.cost || 0), 0)
  const otherTotal = r.otherCosts.reduce((s, c) => s + (c.amount || 0), 0)

  const kpiCards = [
    { label: 'Fee', value: formatEur(r.fee), accent: false },
    { label: 'Cost directe', value: formatEur(dc), accent: false },
    { label: 'Marge contribució', value: formatEur(margenContr), sub: margenPct.toFixed(1) + '%', accent: true, positive: margenContr >= 0 },
    { label: 'Resultat tras estructura', value: formatEur(resultatEst), sub: `${r.fee > 0 ? ((resultatEst / r.fee) * 100).toFixed(1) : '0.0'}% · estructura assignada ${formatEur(alloc)}`, accent: true, positive: resultatEst >= 0 },
  ]

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => set('photoUrl', ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const initials = r.clientName.trim().split(/\s+/).map((w: string) => w[0]).join('').slice(0,2).toUpperCase()
  const avatarBg = getAvatarColor(r.clientName || 'X')

  return (
    <div className="rf-root">
      {/* Back */}
      <button className="rf-back" onClick={onBack}><ArrowLeft size={14} />Tornar a la cartera</button>

      {/* Client name */}
      <div className="rf-name-row">
        {/* Photo avatar */}
        <label className="rf-photo-wrap" title="Clica per canviar la foto">
          {r.photoUrl ? (
            <img src={r.photoUrl} alt="" className="rf-photo-img" />
          ) : (
            <div className="rf-photo-placeholder" style={{ background: avatarBg }}>{initials}</div>
          )}
          <div className="rf-photo-overlay">📷</div>
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
        </label>

        <div className="rf-name-wrap">
          <div className="rf-name-label">Client</div>
          <select className="rf-client-select" value={r.clientId || ''} onChange={e => {
            const found = clients.find((c: ClientBasic) => c.id === e.target.value)
            if (found) { set('clientId', found.id); set('clientName', found.name) }
            else set('clientId', '')
          }}>
            <option value="">Sense vincle (nom lliure)</option>
            {clients.map((c: ClientBasic) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {!r.clientId && (
            <input className="rf-name-input" value={r.clientName} onChange={e => set('clientName', e.target.value)} placeholder="Nom del client" style={{ marginTop: 6 }} />
          )}
        </div>
        <div className="rf-header-actions">
          <button className={`rf-toggle-btn ${r.estado === 'Inactiu' ? 'rf-toggle-btn--inactive' : ''}`}
            onClick={() => set('estado', r.estado === 'Actiu' ? 'Inactiu' : 'Actiu')}>
            {r.estado === 'Actiu' ? 'Actiu' : 'Inactiu'}
          </button>
        </div>
      </div>

      {/* KPI mini-cards */}
      <div className="rf-kpis">
        {kpiCards.map((k, i) => (
          <div key={i} className={`rf-kpi${k.accent ? ' rf-kpi--accent' : ''}`}>
            <div className="rf-kpi-label">{k.label}</div>
            <div className={`rf-kpi-value${k.accent ? (k.positive ? ' rf-kpi-value--pos' : ' rf-kpi-value--neg') : ''}`}>{k.value}</div>
            {k.sub && <div className="rf-kpi-sub">{k.sub}</div>}
          </div>
        ))}
      </div>

      {/* Dades del contracte */}
      <div className="rf-card">
        <div className="rf-card-title">Dades del contracte</div>
        <div className="rf-form-grid">
          <div className="rf-field">
            <label>Tipus de servei</label>
            <select value={r.tipo} onChange={e => set('tipo', e.target.value)}>
              <option value="Recurrent">Recurrent (quota mensual)</option>
              <option value="Puntual">Puntual</option>
            </select>
          </div>
          <div className="rf-field">
            <label>Estat</label>
            <select value={r.estado} onChange={e => set('estado', e.target.value)}>
              <option value="Actiu">Actiu</option>
              <option value="Inactiu">Inactiu</option>
            </select>
          </div>
          <div className="rf-field">
            <label>Fee {r.tipo === 'Recurrent' ? 'mensual' : 'puntual'} (sense IVA)</label>
            <input type="number" min="0" step="50" value={r.fee || ''} placeholder="0.00" onChange={e => set('fee', parseFloat(e.target.value) || 0)} />
          </div>
          <div className="rf-field">
            <label>Marge objectiu % <span className="rf-label-hint">(opcional, si no s'usa el global)</span></label>
            <input type="number" min="0" max="100" value={r.marginObjective || ''} placeholder={`${marginObjective} (global)`} onChange={e => set('marginObjective', parseFloat(e.target.value) || 0)} />
          </div>
          <div className="rf-field">
            <label>Data d'inici</label>
            <input type="date" value={r.startDate} onChange={e => set('startDate', e.target.value)} />
          </div>
          <div className="rf-field">
            <label>Data de fi (si aplica)</label>
            <input type="date" value={r.endDate} onChange={e => set('endDate', e.target.value)} />
          </div>
          <div className="rf-field rf-field--wide">
            <label>Responsable / equip assignat</label>
            <input value={r.responsible} placeholder="Nom del responsable" onChange={e => set('responsible', e.target.value)} />
          </div>
        </div>
        <div className="rf-field rf-field--block" style={{ marginTop: 14 }}>
          <label>Serveis inclosos</label>
          <input value={r.services} placeholder="Ex. gestió de xarxes + 2 sessions/m" onChange={e => set('services', e.target.value)} />
        </div>
        <div className="rf-field rf-field--block" style={{ marginTop: 12 }}>
          <label>Observacions</label>
          <textarea value={r.observations} placeholder="Notes rellevants sobre aquest client..." rows={3} onChange={e => set('observations', e.target.value)} />
        </div>
      </div>

      {/* Col·laboradors */}
      <div className="rf-card">
        <div className="rf-card-header">
          <div className="rf-card-title">Col·laboradors assignats</div>
          <button className="rf-add-btn" onClick={addCollab}><Plus size={14} />Afegir col·laborador</button>
        </div>
        <div className="rf-card-hint">El nom s'autocompleta amb la teva llista de Proveïdors.</div>
        <div className="rf-collab-table">
          <div className="rf-collab-header">
            <span>Nom</span><span>Rol</span><span>Cost</span><span></span>
          </div>
          {r.collaborators.map(c => (
            <div key={c.id} className="rf-collab-row">
              <input className="rf-collab-input" value={c.name} placeholder="Escriu o tria un proveïdor" onChange={e => updateCollab(c.id, 'name', e.target.value)} />
              <input className="rf-collab-input" value={c.role} placeholder="Fotògraf, CM..." onChange={e => updateCollab(c.id, 'role', e.target.value)} />
              <input className="rf-collab-input rf-collab-input--num" type="number" min="0" value={c.cost || ''} placeholder="0.00" onChange={e => updateCollab(c.id, 'cost', parseFloat(e.target.value) || 0)} />
              <button className="rf-remove-btn" onClick={() => removeCollab(c.id)}><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
        <div className="rf-collab-total">Cost equip: <strong>{formatEur(teamCost)}</strong></div>
      </div>

      {/* Altres despeses directes */}
      <div className="rf-card">
        <div className="rf-card-header">
          <div className="rf-card-title">Altres despeses directes</div>
          <button className="rf-add-btn" onClick={addOtherCost}><Plus size={14} />Afegir despesa</button>
        </div>
        {r.otherCosts.length === 0 && <div className="rf-empty-hint">Sense despeses directes registrades.</div>}
        {r.otherCosts.map(c => (
          <div key={c.id} className="rf-other-row">
            <input className="rf-collab-input rf-collab-input--grow" value={c.name} placeholder="Descripció (ex. desplaçaments)" onChange={e => updateOtherCost(c.id, 'name', e.target.value)} />
            <input className="rf-collab-input rf-collab-input--num" type="number" min="0" value={c.amount || ''} placeholder="0.00" onChange={e => updateOtherCost(c.id, 'amount', parseFloat(e.target.value) || 0)} />
            <button className="rf-remove-btn" onClick={() => removeOtherCost(c.id)}><Trash2 size={13} /></button>
          </div>
        ))}
        {r.otherCosts.length > 0 && <div className="rf-collab-total">Total despeses: <strong>{formatEur(otherTotal)}</strong></div>}
      </div>

      {/* Bottom bar */}
      <div className="rf-bottom-bar">
        <button className="rf-save-btn" onClick={() => onSave(r)}><Save size={15} />Guardar</button>
        {confirmDelete ? (
          <div className="rf-confirm-del">
            <span>Eliminar aquest registre?</span>
            <button className="rf-confirm-yes" onClick={() => onDelete(r.id)}>Sí, eliminar</button>
            <button className="rf-confirm-no" onClick={() => setConfirmDelete(false)}>Cancel·lar</button>
          </div>
        ) : (
          <button className="rf-del-btn" onClick={() => setConfirmDelete(true)}><Trash2 size={14} />Eliminar registre</button>
        )}
      </div>

      <style jsx>{`
        .rf-root { padding-bottom: 40px; }
        .rf-back { display: flex; align-items: center; gap: 6px; background: none; border: none; cursor: pointer; font-size: 13px; font-weight: 500; color: #5A6478; padding: 0 0 18px; transition: color 0.15s; }
        .rf-back:hover { color: #2563EB; }
        .rf-name-row { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
        .rf-name-wrap { flex: 1; }
        .rf-photo-wrap { position: relative; width: 64px; height: 64px; border-radius: 14px; overflow: hidden; cursor: pointer; flex-shrink: 0; display: block; }
        .rf-photo-img { width: 100%; height: 100%; object-fit: cover; border-radius: 14px; }
        .rf-photo-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 700; color: white; border-radius: 14px; }
        .rf-photo-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; font-size: 20px; opacity: 0; transition: opacity 0.15s; border-radius: 14px; }
        .rf-photo-wrap:hover .rf-photo-overlay { opacity: 1; }
        .rf-name-label { font-size: 11px; font-weight: 600; color: #A0A9BB; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 6px; }
        .rf-client-select { width: 100%; height: 44px; padding: 0 14px; border: 1.5px solid rgba(0,0,0,0.1); border-radius: 12px; font-size: 16px; font-weight: 600; color: #0F1B2D; outline: none; background: white; font-family: inherit; transition: border-color 0.15s; cursor: pointer; }
        .rf-client-select:focus { border-color: #2563EB; }
        .rf-name-input { width: 100%; height: 48px; padding: 0 16px; border: 1.5px solid rgba(0,0,0,0.1); border-radius: 12px; font-size: 20px; font-weight: 700; color: #0F1B2D; outline: none; background: white; font-family: inherit; transition: border-color 0.15s; }
        .rf-name-input:focus { border-color: #2563EB; }
        .rf-header-actions { display: flex; gap: 8px; }
        .rf-toggle-btn { height: 36px; padding: 0 16px; border: 1.5px solid #059669; border-radius: 9px; font-size: 13px; font-weight: 600; color: #059669; background: #ECFDF5; cursor: pointer; transition: all 0.15s; }
        .rf-toggle-btn--inactive { border-color: #9CA3AF; color: #9CA3AF; background: #F3F4F6; }

        .rf-kpis { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 20px; }
        .rf-kpi { background: white; border-radius: 14px; padding: 16px 18px; border: 1px solid rgba(0,0,0,0.06); box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
        .rf-kpi--accent { border-left: 3px solid #2563EB; }
        .rf-kpi-label { font-size: 10px; font-weight: 700; color: #A0A9BB; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 8px; }
        .rf-kpi-value { font-size: 20px; font-weight: 700; color: #0F1B2D; letter-spacing: -0.02em; }
        .rf-kpi-value--pos { color: #059669; }
        .rf-kpi-value--neg { color: #DC2626; }
        .rf-kpi-sub { font-size: 11px; color: #A0A9BB; margin-top: 4px; line-height: 1.4; }

        .rf-card { background: white; border-radius: 18px; border: 1px solid rgba(0,0,0,0.06); box-shadow: 0 2px 8px rgba(0,0,0,0.05); padding: 22px 24px; margin-bottom: 14px; }
        .rf-card-title { font-size: 15px; font-weight: 700; color: #0F1B2D; margin-bottom: 16px; }
        .rf-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
        .rf-card-hint { font-size: 12px; color: #A0A9BB; margin-bottom: 14px; line-height: 1.4; }
        .rf-empty-hint { font-size: 13px; color: #A0A9BB; padding: 12px 0; }
        .rf-add-btn { height: 32px; padding: 0 12px; background: linear-gradient(135deg,#1B2B4B,#2563EB); color: white; border: none; border-radius: 8px; font-size: 12.5px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 5px; box-shadow: 0 2px 6px rgba(37,99,235,0.25); }
        .rf-add-btn:hover { opacity: 0.9; }

        .rf-form-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        .rf-field { display: flex; flex-direction: column; gap: 5px; }
        .rf-field--wide { grid-column: span 2; }
        .rf-field--block { display: flex; flex-direction: column; gap: 5px; }
        .rf-field label { font-size: 11px; font-weight: 600; color: #5A6478; letter-spacing: 0.03em; text-transform: uppercase; }
        .rf-label-hint { font-size: 10px; color: #A0A9BB; font-weight: 400; text-transform: none; letter-spacing: 0; }
        .rf-field input, .rf-field select, .rf-field textarea, .rf-field--block input, .rf-field--block textarea {
          height: 38px; padding: 0 11px; border: 1.5px solid rgba(0,0,0,0.09); border-radius: 9px; font-size: 13px; color: #0F1B2D; outline: none; background: #FAFAFA; font-family: inherit; transition: border-color 0.15s;
        }
        .rf-field textarea, .rf-field--block textarea { height: auto; padding: 10px 11px; resize: vertical; }
        .rf-field input:focus, .rf-field select:focus, .rf-field textarea:focus, .rf-field--block input:focus, .rf-field--block textarea:focus { border-color: #2563EB; background: white; }

        .rf-collab-table { display: flex; flex-direction: column; gap: 6px; }
        .rf-collab-header { display: grid; grid-template-columns: 1fr 1fr 120px 32px; gap: 8px; padding: 0 0 4px; font-size: 10px; font-weight: 700; color: #A0A9BB; letter-spacing: 0.06em; text-transform: uppercase; }
        .rf-collab-row, .rf-other-row { display: grid; grid-template-columns: 1fr 1fr 120px 32px; gap: 8px; align-items: center; }
        .rf-other-row { grid-template-columns: 1fr 120px 32px; }
        .rf-collab-input { height: 36px; padding: 0 10px; border: 1.5px solid rgba(0,0,0,0.09); border-radius: 8px; font-size: 13px; color: #0F1B2D; outline: none; background: #FAFAFA; font-family: inherit; transition: border-color 0.15s; }
        .rf-collab-input--grow { flex: 1; }
        .rf-collab-input--num { text-align: right; }
        .rf-collab-input:focus { border-color: #2563EB; background: white; }
        .rf-remove-btn { width: 32px; height: 32px; border: 1px solid rgba(0,0,0,0.08); border-radius: 7px; background: white; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #DC2626; transition: background 0.15s; }
        .rf-remove-btn:hover { background: #FEF2F2; }
        .rf-collab-total { font-size: 13px; color: #5A6478; margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(0,0,0,0.05); }

        .rf-bottom-bar { position: sticky; bottom: 0; background: white; border-top: 1px solid rgba(0,0,0,0.06); padding: 14px 24px; margin: 20px -32px -28px; display: flex; align-items: center; justify-content: space-between; gap: 12px; box-shadow: 0 -4px 16px rgba(0,0,0,0.06); }
        .rf-save-btn { height: 38px; padding: 0 20px; background: linear-gradient(135deg,#1B2B4B,#2563EB); color: white; border: none; border-radius: 10px; font-size: 13.5px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 7px; box-shadow: 0 2px 8px rgba(37,99,235,0.3); }
        .rf-save-btn:hover { opacity: 0.9; }
        .rf-del-btn { height: 38px; padding: 0 16px; border: 1.5px solid #FECACA; border-radius: 10px; background: white; color: #DC2626; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.15s; }
        .rf-del-btn:hover { background: #FEF2F2; }
        .rf-confirm-del { display: flex; align-items: center; gap: 10px; }
        .rf-confirm-del span { font-size: 13px; font-weight: 500; color: #DC2626; }
        .rf-confirm-yes { height: 34px; padding: 0 14px; background: #DC2626; color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
        .rf-confirm-no { height: 34px; padding: 0 14px; border: 1px solid rgba(0,0,0,0.1); border-radius: 8px; background: white; color: #5A6478; font-size: 13px; cursor: pointer; }
      `}</style>
    </div>
  )
}

/* ─── PROVEÏDORS ─── */
function newSupplier(): Supplier {
  return { id: uid(), name: '', category: '', contact: '', notes: '', monthlyFee: 0, structureAmount: 0 }
}

const PV_COLS = [
  { id: 'activeClients',  label: 'Clients actius',  contact: false },
  { id: 'structure',      label: 'Estructura',       contact: false },
  { id: 'monthlyFee',     label: 'Mensual total',    contact: false },
  { id: 'totalInClients', label: 'Total en clients', contact: false },
  { id: 'contact',        label: 'Contacte / Notes', contact: true  },
]

function ProveidorsSection({ data, save }: { data: FinanceData; save: (d: FinanceData) => void }) {
  const [sortCol, setSortCol] = useState('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set())
  const [colOrder, setColOrder] = useState(() => PV_COLS.map((_, i) => i))
  const [showColMenu, setShowColMenu] = useState(false)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  const togglePvCol = (id: string) => setHiddenCols(prev => {
    const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next
  })
  const visibleCols = colOrder.filter(ci => !hiddenCols.has(PV_COLS[ci].id))

  // compute per-supplier stats from records
  const supplierStats = useMemo(() => {
    const stats: Record<string, { activeClients: number; totalInClients: number }> = {}
    for (const s of data.suppliers) {
      stats[s.id] = { activeClients: 0, totalInClients: 0 }
    }
    for (const rec of data.records.filter(r => r.estado === 'Actiu')) {
      for (const col of rec.collaborators) {
        const sup = data.suppliers.find(s => s.name && col.name && s.name.toLowerCase() === col.name.toLowerCase())
        if (sup) {
          stats[sup.id].activeClients++
          stats[sup.id].totalInClients += col.cost || 0
        }
      }
    }
    return stats
  }, [data.suppliers, data.records])

  const rows = useMemo(() => {
    return data.suppliers.map(s => ({
      ...s,
      activeClients: supplierStats[s.id]?.activeClients ?? 0,
      totalInClients: supplierStats[s.id]?.totalInClients ?? 0,
    }))
  }, [data.suppliers, supplierStats])

  const sorted = useMemo(() => {
    return [...rows].sort((a: any, b: any) => {
      let av = a[sortCol] ?? '', bv = b[sortCol] ?? ''
      if (typeof av === 'string') { av = av.toLowerCase(); bv = bv.toLowerCase() }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [rows, sortCol, sortDir])

  const toggleSort = (key: string | null) => {
    if (!key) return
    if (sortCol === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(key); setSortDir('asc') }
  }

  const updateSupplier = (id: string, field: keyof Supplier, value: any) => {
    save({ ...data, suppliers: data.suppliers.map(s => s.id === id ? { ...s, [field]: value } : s) })
  }

  const addSupplier = () => {
    save({ ...data, suppliers: [...data.suppliers, newSupplier()] })
  }

  const removeSupplier = (id: string) => {
    save({ ...data, suppliers: data.suppliers.filter(s => s.id !== id) })
  }

  const exportCSV = () => {
    const header = ['Nom','Categoria','Clients actius','Estructura','Mensual total','Total en clients','Contacte','Notes']
    const csvRows = sorted.map((r: any) => [r.name, r.category, r.activeClients, formatEur(r.structureAmount), formatEur(r.monthlyFee), formatEur(r.totalInClients), r.contact, r.notes])
    const csv = [header, ...csvRows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'proveidors.csv'; a.click()
  }

  const totalMonthly = data.suppliers.reduce((s, sup) => s + (sup.monthlyFee || 0), 0)
  const totalStructure = data.suppliers.reduce((s, sup) => s + (sup.structureAmount || 0), 0)
  const totalInClients = Object.values(supplierStats).reduce((s, v) => s + v.totalInClients, 0)

  return (
    <div>
      <div className="pv-topbar">
        <div>
          <div className="pv-title">Proveïdors</div>
          <div className="pv-sub">{sorted.length} {sorted.length === 1 ? 'proveïdor' : 'proveïdors'}</div>
        </div>
        <div className="pv-topbar-right">
          <div className="pv-sort-wrap">
            <label className="pv-sort-label">Ordenar per</label>
            <select className="pv-sort-select" value={sortCol} onChange={e => { setSortCol(e.target.value); setSortDir('asc') }}>
              <option value="name">Nom</option>
              <option value="category">Categoria</option>
              <option value="activeClients">Clients actius</option>
              <option value="structureAmount">Estructura</option>
              <option value="monthlyFee">Mensual total</option>
              <option value="totalInClients">Total en clients</option>
            </select>
            <button className="pv-sort-dir" onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}>
              {sortDir === 'asc' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
            </button>
          </div>
          <div style={{ position: 'relative' }}>
            <button className="pv-btn-cols" onClick={() => setShowColMenu(v => !v)}>Columnes ▾</button>
            {showColMenu && (
              <>
                <div className="pv-col-overlay" onClick={() => setShowColMenu(false)} />
                <div className="pv-col-menu">
                  {PV_COLS.map(col => (
                    <label key={col.id} className="pv-col-item">
                      <input type="checkbox" checked={!hiddenCols.has(col.id)} onChange={() => togglePvCol(col.id)} />
                      {col.label}
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
          <button className="pv-btn-export" onClick={exportCSV}><Download size={14}/>Exportar CSV</button>
          <button className="pv-btn-new" onClick={addSupplier}><Plus size={14}/>Nou proveïdor</button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="pv-empty">Cap proveïdor registrat. Fes clic a «Nou proveïdor» per afegir-ne un.</div>
      ) : (
        <div className="pv-list">
          {/* Header row */}
          <div className="pv-header">
            <div className="pv-header-left">Proveïdor</div>
            <div className="pv-header-right">
              {visibleCols.map((ci, pos) => {
                const col = PV_COLS[ci]
                return (
                  <div
                    key={col.id}
                    className={`pv-hcell ${col.contact ? 'pv-hcell--contact' : 'pv-hcell--num'}${dragIdx === pos ? ' pv-hcell--dragging' : ''}${dragOverIdx === pos && dragIdx !== pos ? ' pv-hcell--over' : ''}`}
                    draggable
                    onDragStart={() => setDragIdx(pos)}
                    onDragOver={e => { e.preventDefault(); setDragOverIdx(pos) }}
                    onDrop={e => {
                      e.preventDefault()
                      if (dragIdx === null || dragIdx === pos) { setDragIdx(null); setDragOverIdx(null); return }
                      const fromCi = visibleCols[dragIdx]
                      const toCi = visibleCols[pos]
                      const fromOrdIdx = colOrder.indexOf(fromCi)
                      const toOrdIdx = colOrder.indexOf(toCi)
                      const next = [...colOrder]
                      next.splice(fromOrdIdx, 1)
                      next.splice(toOrdIdx, 0, fromCi)
                      setColOrder(next); setDragIdx(null); setDragOverIdx(null)
                    }}
                    onDragEnd={() => { setDragIdx(null); setDragOverIdx(null) }}
                    style={{ cursor: dragIdx !== null ? 'grabbing' : 'grab' }}
                  >
                    {col.label}
                  </div>
                )
              })}
              <div className="pv-hcell pv-hcell--del" />
            </div>
          </div>

          {sorted.map((row: any) => {
            const up = (field: keyof Supplier, val: any) => updateSupplier(row.id, field, val)
            const initials = row.name ? getInitials(row.name) : '?'
            const avatarBg = row.name ? getAvatarColor(row.name) : '#9CA3AF'
            return (
              <div key={row.id} className="pv-card">
                {/* Left: avatar + name + category */}
                <div className="pv-card-left">
                  <div className="pv-avatar" style={{ background: avatarBg }}>{initials}</div>
                  <div className="pv-card-inputs">
                    <input className="pv-input pv-input--name" value={row.name} placeholder="Nom del proveïdor..." onChange={e => up('name', e.target.value)} />
                    <input className="pv-input pv-input--cat" value={row.category} placeholder="Categoria..." onChange={e => up('category', e.target.value)} />
                  </div>
                </div>

                {/* Right: stats + editable fields + delete */}
                <div className="pv-card-right">
                  {visibleCols.map(ci => {
                    const col = PV_COLS[ci]
                    if (col.id === 'activeClients') return <div key={col.id} className="pv-stat"><span className="pv-stat-val pv-stat-val--main">{row.activeClients}</span></div>
                    if (col.id === 'structure') return <div key={col.id} className="pv-stat"><input className="pv-num-input" type="number" min="0" value={row.structureAmount || ''} placeholder="0" onChange={e => up('structureAmount', parseFloat(e.target.value) || 0)} /></div>
                    if (col.id === 'monthlyFee') return <div key={col.id} className="pv-stat"><input className="pv-num-input" type="number" min="0" value={row.monthlyFee || ''} placeholder="0" onChange={e => up('monthlyFee', parseFloat(e.target.value) || 0)} /></div>
                    if (col.id === 'totalInClients') return <div key={col.id} className="pv-stat"><span className="pv-stat-val pv-stat-val--blue">{formatEur(row.totalInClients)}</span></div>
                    if (col.id === 'contact') return (
                      <div key={col.id} className="pv-contact-group">
                        <input className="pv-input pv-input--contact" value={row.contact} placeholder="Telèfon / email" onChange={e => up('contact', e.target.value)} />
                        <input className="pv-input pv-input--notes" value={row.notes} placeholder="Notes..." onChange={e => up('notes', e.target.value)} />
                      </div>
                    )
                    return null
                  })}
                  <button className="pv-del-btn" onClick={() => removeSupplier(row.id)}><Trash2 size={14}/></button>
                </div>
              </div>
            )
          })}

          {/* Totals footer */}
          <div className="pv-totals">
            <span className="pv-totals-label">Totals</span>
            <div className="pv-totals-right">
              <div className="pv-total-item"><span className="pv-stat-lbl">Estructura</span><span className="pv-total-val">{formatEur(totalStructure)}</span></div>
              <div className="pv-total-item"><span className="pv-stat-lbl">Mensual total</span><span className="pv-total-val">{formatEur(totalMonthly)}</span></div>
              <div className="pv-total-item"><span className="pv-stat-lbl">Total en clients</span><span className="pv-total-val pv-total-val--blue">{formatEur(totalInClients)}</span></div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        /* ── Topbar ── */
        .pv-topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; gap: 16px; }
        .pv-title { font-size: 19px; font-weight: 700; color: #111827; letter-spacing: -0.02em; }
        .pv-sub { font-size: 12.5px; color: #9CA3AF; margin-top: 2px; }
        .pv-topbar-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .pv-sort-wrap { display: flex; align-items: center; gap: 6px; margin-right: 4px; }
        .pv-sort-label { font-size: 10px; font-weight: 700; color: #9CA3AF; letter-spacing: 0.07em; text-transform: uppercase; white-space: nowrap; }
        .pv-sort-select { height: 32px; padding: 0 10px; border: 1px solid #E5E7EB; border-radius: 7px; font-size: 13px; color: #111827; background: white; outline: none; cursor: pointer; font-family: inherit; transition: border-color 0.12s; }
        .pv-sort-select:focus { border-color: #2563EB; }
        .pv-sort-dir { width: 32px; height: 32px; border: 1px solid #E5E7EB; border-radius: 7px; background: white; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #6B7280; transition: all 0.12s; }
        .pv-sort-dir:hover { border-color: #2563EB; color: #2563EB; }
        .pv-btn-export { height: 34px; padding: 0 14px; border: 1px solid #E5E7EB; border-radius: 8px; font-size: 13px; font-weight: 500; color: #374151; background: white; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.12s; }
        .pv-btn-export:hover { border-color: #2563EB; color: #2563EB; }
        .pv-btn-new { height: 34px; padding: 0 16px; background: linear-gradient(135deg,#1B2B4B,#2563EB); color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 1px 6px rgba(37,99,235,0.25); transition: opacity 0.12s; white-space: nowrap; }
        .pv-btn-new:hover { opacity: 0.88; }
        .pv-btn-cols { height: 34px; padding: 0 14px; border: 1px solid #E5E7EB; border-radius: 8px; font-size: 13px; font-weight: 500; color: #374151; background: white; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.12s; }
        .pv-btn-cols:hover { border-color: #2563EB; color: #2563EB; }
        .pv-col-overlay { position: fixed; inset: 0; z-index: 49; }
        .pv-col-menu { position: absolute; top: calc(100% + 6px); right: 0; z-index: 50; background: white; border: 1px solid #E5E7EB; border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.10); padding: 8px; min-width: 180px; }
        .pv-col-item { display: flex; align-items: center; gap: 8px; padding: 7px 10px; border-radius: 7px; font-size: 13px; color: #374151; cursor: pointer; transition: background 0.1s; user-select: none; }
        .pv-col-item:hover { background: #F3F4F6; }
        .pv-col-item input[type="checkbox"] { width: 14px; height: 14px; cursor: pointer; accent-color: #2563EB; }

        /* ── List ── */
        .pv-list { display: flex; flex-direction: column; gap: 5px; }

        /* ── Header row ── */
        .pv-header { display: flex; align-items: center; gap: 16px; padding: 9px 20px; background: #F8F9FB; border-radius: 10px; border: 1px solid #F0F2F6; margin-bottom: 6px; }
        .pv-header-left { width: 240px; flex-shrink: 0; font-size: 10.5px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.07em; }
        .pv-header-right { display: flex; align-items: center; flex: 1; gap: 16px; justify-content: space-between; }
        .pv-hcell { font-size: 10.5px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.07em; white-space: nowrap; border-radius: 6px; padding: 3px 5px; user-select: none; transition: background 0.12s, color 0.12s, outline 0.12s; }
        .pv-hcell--num { min-width: 90px; text-align: right; }
        .pv-hcell--dragging { opacity: 0.25; background: #E5E7EB; }
        .pv-hcell--over { background: #DBEAFE; color: #1D4ED8; outline: 2px solid #3B82F6; outline-offset: 1px; }
        .pv-hcell--contact { min-width: 150px; flex: 1; max-width: 260px; }
        .pv-hcell--del { width: 30px; flex-shrink: 0; }

        /* ── Card ── */
        .pv-card { display: flex; align-items: center; background: white; border-radius: 12px; border: 1px solid #E8ECF2; padding: 15px 20px; gap: 16px; transition: border-color 0.15s, box-shadow 0.15s; }
        .pv-card:hover { border-color: #C7D2E4; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }

        /* ── Card left ── */
        .pv-card-left { display: flex; align-items: center; gap: 14px; width: 240px; flex-shrink: 0; }
        .pv-avatar { width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: white; flex-shrink: 0; letter-spacing: -0.02em; }
        .pv-card-inputs { display: flex; flex-direction: column; gap: 3px; flex: 1; min-width: 0; }
        .pv-input { width: 100%; border: none; outline: none; background: transparent; font-family: inherit; padding: 2px 0; transition: background 0.12s, padding 0.12s; cursor: default; }
        .pv-input:hover { background: #F3F4F6; border-radius: 4px; padding: 2px 6px; cursor: text; }
        .pv-input:focus { background: #EEF2FF; border-radius: 4px; padding: 2px 6px; cursor: text; }
        .pv-input--name { font-size: 14px; font-weight: 700; color: #111827; letter-spacing: -0.01em; }
        .pv-input--name::placeholder { color: #D1D5DB; font-weight: 500; }
        .pv-input--cat { font-size: 12px; color: #9CA3AF; font-weight: 500; }
        .pv-input--cat::placeholder { color: #E5E7EB; }
        .pv-input--contact { font-size: 13px; color: #374151; font-weight: 500; }
        .pv-input--notes { font-size: 12px; color: #9CA3AF; }
        .pv-input--contact::placeholder, .pv-input--notes::placeholder { color: #D1D5DB; }

        /* ── Card right ── */
        .pv-card-right { display: flex; align-items: center; flex: 1; gap: 16px; justify-content: space-between; }

        /* Stats */
        .pv-stat { display: flex; align-items: flex-end; justify-content: flex-end; min-width: 90px; }
        .pv-stat-val { font-size: 14px; font-weight: 600; color: #374151; white-space: nowrap; font-variant-numeric: tabular-nums; }
        .pv-stat-val--main { font-size: 15px; font-weight: 700; color: #111827; }
        .pv-stat-val--blue { font-size: 14px; font-weight: 700; color: #2563EB; }

        /* Numeric input — invisible by default, editable on click */
        .pv-num-input { width: 90px; height: 30px; padding: 0 4px; border: 1px solid transparent; border-radius: 7px; font-size: 14px; font-weight: 600; color: #111827; text-align: right; font-family: inherit; outline: none; font-variant-numeric: tabular-nums; background: transparent; transition: border-color 0.12s, background 0.12s, padding 0.12s; cursor: default; }
        .pv-num-input:hover { background: #F3F4F6; cursor: text; }
        .pv-num-input:focus { border-color: #2563EB; background: white; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); padding: 0 8px; cursor: text; }
        .pv-num-input::placeholder { color: #D1D5DB; font-weight: 400; }

        /* Contact + notes group */
        .pv-contact-group { display: flex; flex-direction: column; gap: 4px; min-width: 150px; flex: 1; max-width: 260px; }

        /* Delete */
        .pv-del-btn { width: 30px; height: 30px; border: 1px solid #FEE2E2; background: #FFF5F5; border-radius: 8px; cursor: pointer; color: #FCA5A5; display: flex; align-items: center; justify-content: center; transition: all 0.12s; flex-shrink: 0; }
        .pv-del-btn:hover { background: #FEE2E2; border-color: #EF4444; color: #EF4444; }

        /* Empty */
        .pv-empty { padding: 52px; text-align: center; font-size: 14px; color: #D1D5DB; background: white; border-radius: 12px; border: 1px solid #E8ECF2; }

        /* Totals footer */
        .pv-totals { display: flex; align-items: center; justify-content: space-between; padding: 13px 20px; background: #F8F9FB; border-radius: 12px; border: 1px solid #E8ECF2; margin-top: 4px; }
        .pv-totals-label { font-size: 12.5px; font-weight: 700; color: #374151; letter-spacing: -0.01em; }
        .pv-totals-right { display: flex; align-items: center; gap: 32px; }
        .pv-total-item { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; }
        .pv-total-item-lbl { font-size: 10px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.07em; }
        .pv-total-val { font-size: 14px; font-weight: 700; color: #111827; font-variant-numeric: tabular-nums; }
        .pv-total-val--blue { color: #2563EB; }
      `}</style>
    </div>
  )
}

/* ─── GRÀFICS ─── */
function GraficsSection({ data, kpis }: any) {
  const router = useRouter()

  const recurrent = kpis.totalRecurrent
  const puntual = kpis.totalProjects
  const total = recurrent + puntual || 1

  const records = data.records.filter((r: ClientRecord) => r.estado === 'Actiu')
  const clientMap: Record<string, { fee: number; cost: number }> = {}
  for (const r of records) {
    if (!clientMap[r.clientName]) clientMap[r.clientName] = { fee: 0, cost: 0 }
    clientMap[r.clientName].fee += r.fee
    clientMap[r.clientName].cost += recordDirectCost(r)
  }
  const clients = Object.entries(clientMap)
    .map(([name, v]) => ({ name, fee: v.fee, cost: v.cost, margin: v.fee > 0 ? ((v.fee - v.cost) / v.fee) * 100 : 0 }))
    .sort((a, b) => b.fee - a.fee)
  const maxVal = Math.max(...clients.flatMap(c => [c.fee, c.cost]), 1)

  // ── Donut chart ──
  const DW = 320, DH = 320
  const dcx = DW / 2, dcy = DH / 2
  const outerR = 110, innerR = 66
  const rAngle = (recurrent / total) * 2 * Math.PI

  function donutArc(start: number, end: number, ro: number, ri: number) {
    if (end - start >= 2 * Math.PI - 0.001) end = start + 2 * Math.PI - 0.001
    const o1x = dcx + ro * Math.cos(start - Math.PI / 2)
    const o1y = dcy + ro * Math.sin(start - Math.PI / 2)
    const o2x = dcx + ro * Math.cos(end - Math.PI / 2)
    const o2y = dcy + ro * Math.sin(end - Math.PI / 2)
    const i1x = dcx + ri * Math.cos(end - Math.PI / 2)
    const i1y = dcy + ri * Math.sin(end - Math.PI / 2)
    const i2x = dcx + ri * Math.cos(start - Math.PI / 2)
    const i2y = dcy + ri * Math.sin(start - Math.PI / 2)
    const large = end - start > Math.PI ? 1 : 0
    return `M ${o1x.toFixed(1)} ${o1y.toFixed(1)} A ${ro} ${ro} 0 ${large} 1 ${o2x.toFixed(1)} ${o2y.toFixed(1)} L ${i1x.toFixed(1)} ${i1y.toFixed(1)} A ${ri} ${ri} 0 ${large} 0 ${i2x.toFixed(1)} ${i2y.toFixed(1)} Z`
  }

  // ── Bar chart ──
  const bW = 16, bGap = 4, grpGap = 20, mL = 60, mB = 76, mT = 20, bH = 240
  const grpW = bW * 2 + bGap + grpGap
  const svgW = mL + clients.length * grpW + 16
  const svgH = bH + mB + mT

  function niceY(val: number) {
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M'
    if (val >= 1000) return (val / 1000).toFixed(0) + 'k'
    return val.toFixed(0)
  }

  // ── Margin bars ──
  const mBH = 160, mML = 130, mMT = 12, mMB = 12, mBarH = 20, mGap = 6
  const maxMargin = 100
  const marginSvgH = mMT + clients.length * (mBarH + mGap) + mMB

  const rPct = total > 1 ? Math.round((recurrent / total) * 100) : (recurrent > 0 ? 100 : 0)
  const pPct = 100 - rPct

  return (
    <div>
      <div className="gr-header">
        <div>
          <div className="gr-title">Gràfics</div>
          <div className="gr-sub">Visió visual dels números clau de l'agència</div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="gr-kpi-row">
        <div className="gr-kpi">
          <div className="gr-kpi-dot" style={{ background: 'linear-gradient(135deg,#3B82F6,#2563EB)' }} />
          <div>
            <div className="gr-kpi-val">{formatEur(recurrent)}</div>
            <div className="gr-kpi-lbl">Recurrent · {rPct}%</div>
          </div>
        </div>
        <div className="gr-kpi-sep" />
        <div className="gr-kpi">
          <div className="gr-kpi-dot" style={{ background: 'linear-gradient(135deg,#1B2B4B,#374151)' }} />
          <div>
            <div className="gr-kpi-val">{formatEur(puntual)}</div>
            <div className="gr-kpi-lbl">Puntual · {pPct}%</div>
          </div>
        </div>
        <div className="gr-kpi-sep" />
        <div className="gr-kpi">
          <div className="gr-kpi-dot" style={{ background: 'linear-gradient(135deg,#10B981,#059669)' }} />
          <div>
            <div className="gr-kpi-val">{formatEur(recurrent + puntual)}</div>
            <div className="gr-kpi-lbl">Total facturació</div>
          </div>
        </div>
        <div className="gr-kpi-sep" />
        <div className="gr-kpi">
          <div className="gr-kpi-dot" style={{ background: 'linear-gradient(135deg,#8B5CF6,#7C3AED)' }} />
          <div>
            <div className="gr-kpi-val">{clients.length}</div>
            <div className="gr-kpi-lbl">Clients actius</div>
          </div>
        </div>
      </div>

      {/* Row 1: donut + margin */}
      <div className="gr-row">
        {/* Donut */}
        <div className="gr-card gr-card--donut">
          <div className="gr-card-title">Recurrent vs. puntual</div>
          <div className="gr-card-sub">Distribució del pressupost total</div>
          <svg viewBox={`0 0 ${DW} ${DH}`} width={DW} height={DH} style={{ display: 'block', margin: '0 auto', overflow: 'visible' }}>
            <defs>
              <linearGradient id="grad-rec" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#1D4ED8" />
              </linearGradient>
              <linearGradient id="grad-pun" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#374151" />
                <stop offset="100%" stopColor="#111827" />
              </linearGradient>
              <filter id="donut-shadow">
                <feDropShadow dx="0" dy="2" stdDeviation="6" floodColor="#2563EB" floodOpacity="0.18" />
              </filter>
            </defs>
            {total > 1 ? (
              <>
                {recurrent > 0 && (
                  <path d={donutArc(0, rAngle, outerR, innerR)} fill="url(#grad-rec)" filter="url(#donut-shadow)" />
                )}
                {puntual > 0 && (
                  <path d={donutArc(rAngle, 2 * Math.PI, outerR, innerR)} fill="url(#grad-pun)" />
                )}
              </>
            ) : recurrent > 0 ? (
              <path d={donutArc(0, 2 * Math.PI - 0.001, outerR, innerR)} fill="url(#grad-rec)" filter="url(#donut-shadow)" />
            ) : (
              <circle cx={dcx} cy={dcy} r={outerR} fill="none" stroke="#F3F4F6" strokeWidth={outerR - innerR} />
            )}
            {/* Center text */}
            <text x={dcx} y={dcy - 10} textAnchor="middle" fontSize="22" fontWeight="800" fill="#111827">{rPct}%</text>
            <text x={dcx} y={dcy + 10} textAnchor="middle" fontSize="11" fill="#9CA3AF">Recurrent</text>
            {/* Legend */}
            <g transform={`translate(${dcx - 70}, ${DH - 28})`}>
              <rect x="0" y="0" width="10" height="10" rx="3" fill="url(#grad-rec)" />
              <text x="15" y="9" fontSize="11" fill="#374151" fontWeight="500">Recurrent</text>
              <rect x="82" y="0" width="10" height="10" rx="3" fill="url(#grad-pun)" />
              <text x="97" y="9" fontSize="11" fill="#374151" fontWeight="500">Puntual</text>
            </g>
          </svg>
        </div>

        {/* Margin bars */}
        <div className="gr-card gr-card--margin">
          <div className="gr-card-title">Marge per client</div>
          <div className="gr-card-sub">% de marge sobre facturació</div>
          {clients.length === 0 ? (
            <div className="gr-empty">Sense clients actius</div>
          ) : (
            <svg viewBox={`0 0 520 ${marginSvgH}`} width="100%" height={marginSvgH} style={{ display: 'block' }}>
              <defs>
                <linearGradient id="grad-marg-hi" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
                <linearGradient id="grad-marg-mid" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#D97706" />
                </linearGradient>
                <linearGradient id="grad-marg-lo" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#DC2626" />
                </linearGradient>
              </defs>
              {/* 50% reference */}
              {(() => {
                const rx = mML + (50 / maxMargin) * (520 - mML - 8)
                return <line x1={rx} y1={mMT} x2={rx} y2={marginSvgH - mMB} stroke="#E5E7EB" strokeWidth="1" strokeDasharray="3,3" />
              })()}
              <text x={mML + (50 / maxMargin) * (520 - mML - 8)} y={mMT - 2} textAnchor="middle" fontSize="9" fill="#D1D5DB">50%</text>
              {clients.map((c, i) => {
                const y = mMT + i * (mBarH + mGap)
                const barW = Math.max((c.margin / maxMargin) * (520 - mML - 8), 0)
                const gradId = c.margin >= 40 ? 'grad-marg-hi' : c.margin >= 20 ? 'grad-marg-mid' : 'grad-marg-lo'
                return (
                  <g key={c.name}>
                    <text x={mML - 6} y={y + mBarH / 2 + 4} textAnchor="end" fontSize="10.5" fill="#374151" fontWeight="500">
                      {c.name.length > 14 ? c.name.slice(0, 14) + '…' : c.name}
                    </text>
                    <rect x={mML} y={y} width={520 - mML - 8} height={mBarH} rx="6" fill="#F9FAFB" />
                    <rect x={mML} y={y} width={barW} height={mBarH} rx="6" fill={`url(#${gradId})`} />
                    <text x={mML + barW + 5} y={y + mBarH / 2 + 4} fontSize="10" fill="#6B7280" fontWeight="600">
                      {c.margin.toFixed(0)}%
                    </text>
                  </g>
                )
              })}
            </svg>
          )}
        </div>
      </div>

      {/* Bar chart: ingrés vs cost — full width */}
      <div className="gr-card">
        <div className="gr-card-title">Ingrés vs. cost directe per client</div>
        <div className="gr-card-sub">Clients actius ordenats per facturació</div>
        {clients.length === 0 ? (
          <div className="gr-empty">Sense clients actius</div>
        ) : (
          <div className="gr-bar-scroll">
            <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%" height={svgH} style={{ display: 'block', minWidth: Math.max(svgW, 400) }}>
              <defs>
                <linearGradient id="grad-fee" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#60A5FA" />
                  <stop offset="100%" stopColor="#1D4ED8" />
                </linearGradient>
                <linearGradient id="grad-cost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6B7280" />
                  <stop offset="100%" stopColor="#1B2B4B" />
                </linearGradient>
              </defs>
              {/* Y grid */}
              {[0, 0.25, 0.5, 0.75, 1].map(pct => {
                const yy = mT + bH - pct * bH
                return (
                  <g key={pct}>
                    <line x1={mL} y1={yy} x2={svgW} y2={yy} stroke={pct === 0 ? '#E5E7EB' : '#F3F4F6'} strokeWidth={pct === 0 ? 1 : 0.7} />
                    <text x={mL - 7} y={yy + 4} textAnchor="end" fontSize="9.5" fill="#9CA3AF">{niceY(pct * maxVal)}</text>
                  </g>
                )
              })}
              {/* Bars */}
              {clients.map((c, i) => {
                const gx = mL + i * grpW
                const fH = (c.fee / maxVal) * bH
                const cH = (c.cost / maxVal) * bH
                const midX = gx + bW + bGap / 2
                return (
                  <g key={c.name} style={{ cursor: 'pointer' }} onClick={() => router.push('/finances?s=cartera')}>
                    <rect x={gx} y={mT + bH - fH} width={bW} height={fH} fill="url(#grad-fee)" rx="3" />
                    <rect x={gx + bW + bGap} y={mT + bH - cH} width={bW} height={cH} fill="url(#grad-cost)" rx="3" />
                    <text x={midX} y={mT + bH + 12} textAnchor="end" fontSize="9" fill="#374151" fontWeight="500"
                      transform={`rotate(-40, ${midX}, ${mT + bH + 12})`}>
                      {c.name.length > 13 ? c.name.slice(0, 13) + '…' : c.name}
                    </text>
                  </g>
                )
              })}
              {/* Legend */}
              <g transform={`translate(${mL}, ${svgH - 14})`}>
                <rect x="0" y="0" width="10" height="10" rx="3" fill="url(#grad-fee)" />
                <text x="14" y="8" fontSize="10" fill="#374151" fontWeight="500">Fee / Ingrés</text>
                <rect x="90" y="0" width="10" height="10" rx="3" fill="url(#grad-cost)" />
                <text x="104" y="8" fontSize="10" fill="#374151" fontWeight="500">Cost directe</text>
              </g>
            </svg>
          </div>
        )}
      </div>

      <style jsx>{`
        .gr-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; }
        .gr-title { font-size: 19px; font-weight: 700; color: #111827; letter-spacing: -0.02em; margin-bottom: 3px; }
        .gr-sub { font-size: 12.5px; color: #9CA3AF; }

        .gr-kpi-row {
          display: flex; align-items: center; gap: 0;
          background: white; border: 1px solid #E8ECF2; border-radius: 14px;
          padding: 16px 24px; margin-bottom: 14px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        .gr-kpi { display: flex; align-items: center; gap: 12px; flex: 1; }
        .gr-kpi-dot { width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0; }
        .gr-kpi-val { font-size: 16px; font-weight: 800; color: #111827; letter-spacing: -0.02em; }
        .gr-kpi-lbl { font-size: 11px; color: #9CA3AF; font-weight: 500; margin-top: 1px; }
        .gr-kpi-sep { width: 1px; height: 40px; background: #F0F2F6; margin: 0 20px; flex-shrink: 0; }

        .gr-row { display: grid; grid-template-columns: 340px 1fr; gap: 14px; margin-bottom: 14px; }
        @media (max-width: 900px) { .gr-row { grid-template-columns: 1fr; } }

        .gr-card {
          background: white; border-radius: 14px; border: 1px solid #E8ECF2;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04); padding: 24px;
        }
        .gr-card--donut { display: flex; flex-direction: column; }
        .gr-card--margin { display: flex; flex-direction: column; overflow: hidden; }
        .gr-card--mt { margin-top: 0; }
        .gr-card-title { font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 3px; }
        .gr-card-sub { font-size: 11.5px; color: #9CA3AF; margin-bottom: 20px; }
        .gr-empty { font-size: 13px; color: #9CA3AF; padding: 40px 0; text-align: center; }
        .gr-bar-scroll { overflow-x: auto; }
      `}</style>
    </div>
  )
}

/* ─── ESTRUCTURA ─── */
const ES_COLORS = ['#1B2B4B','#2563EB','#7C3AED','#059669','#D97706','#0891B2','#9333EA','#DC2626','#0D9488']
function esColor(name: string) { return ES_COLORS[(name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % ES_COLORS.length] }
function esInitials(name: string) { return name.trim().split(/\s+/).map((w: string) => w[0]).join('').slice(0,2).toUpperCase() || '?' }

function EstructuraSection({ data, save }: { data: FinanceData; save: (d: FinanceData) => void }) {
  const allocationMode = data.allocationMode || 'proportional'

  const update = (id: string, field: keyof StructureCost, value: any) =>
    save({ ...data, structureCosts: data.structureCosts.map(sc => sc.id === id ? { ...sc, [field]: value } : sc) })
  const addCost = () =>
    save({ ...data, structureCosts: [...data.structureCosts, { id: uid(), name: '', category: '', amount: 0, supplierRef: '' }] })
  const remove = (id: string) =>
    save({ ...data, structureCosts: data.structureCosts.filter(sc => sc.id !== id) })
  const total = data.structureCosts.reduce((s, sc) => s + (sc.amount || 0), 0)

  const exportCSV = () => {
    const header = ['Descripció','Categoria','Import mensual','Proveïdor associat']
    const rows = data.structureCosts.map(sc => {
      const sup = data.suppliers.find(s => s.id === sc.supplierRef)
      return [sc.name, sc.category || '', sc.amount.toFixed(2), sup?.name || '']
    })
    const csv = [header, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'estructura.csv'; a.click()
  }

  return (
    <div>
      {/* Topbar */}
      <div className="es-topbar">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="es-title">Gastos d'estructura</div>
          <div className="es-sub">Gastos generals que no depenen d'un client concret</div>
          <div className="es-hint">Si aquest gasto és el pagament a una persona (p.ex. gestió d'equip o de xarxes de GUINEW, no lligat a un client), vincula'l a la seva fitxa a «Proveïdor associat» perquè aquest cobro se sumi correctament a Proveïdors.</div>
        </div>
        <div className="es-actions">
          <button className="es-btn-export" onClick={exportCSV}><Download size={14}/>Exportar CSV</button>
          <button className="es-btn-new" onClick={addCost}><Plus size={14}/>Afegir gasto</button>
        </div>
      </div>

      {/* Allocation criteria */}
      <div className="es-alloc-card">
        <div className="es-alloc-title">Criteri de repartiment entre clients actius</div>
        <div className="es-alloc-opts">
          <label className="es-alloc-opt">
            <input type="radio" name="es-alloc" checked={allocationMode === 'proportional'}
              onChange={() => save({ ...data, allocationMode: 'proportional' })} />
            Proporcional al pressupost de cada client
          </label>
          <label className="es-alloc-opt">
            <input type="radio" name="es-alloc" checked={allocationMode === 'equal'}
              onChange={() => save({ ...data, allocationMode: 'equal' })} />
            Parts iguals entre clients actius
          </label>
        </div>
      </div>

      {/* Table */}
      {data.structureCosts.length === 0 ? (
        <div className="es-empty">Cap gasto d'estructura. Fes clic a «Afegir gasto» per afegir-ne un.</div>
      ) : (
        <div className="es-table-wrap">
          <div className="es-thead">
            <div className="es-th es-th--desc">Descripció</div>
            <div className="es-th es-th--cat">Categoria</div>
            <div className="es-th es-th--amount">Importe mensual</div>
            <div className="es-th es-th--sup">Proveïdor associat</div>
            <div className="es-th es-th--del"></div>
          </div>
          {data.structureCosts.map(sc => (
            <div key={sc.id} className="es-row">
              <div className="es-cell es-cell--desc">
                <input className="es-inp" value={sc.name} placeholder="Descripció del gasto..." onChange={e => update(sc.id, 'name', e.target.value)} />
              </div>
              <div className="es-cell es-cell--cat">
                <input className="es-inp" value={sc.category || ''} placeholder="Categoria..." onChange={e => update(sc.id, 'category', e.target.value)} />
              </div>
              <div className="es-cell es-cell--amount">
                <input className="es-inp es-inp--num" type="number" min="0" value={sc.amount || ''} placeholder="0" onChange={e => update(sc.id, 'amount', parseFloat(e.target.value) || 0)} />
              </div>
              <div className="es-cell es-cell--sup">
                <select className="es-inp es-sel" value={sc.supplierRef || ''} onChange={e => update(sc.id, 'supplierRef', e.target.value)}>
                  <option value="">— Gasto general (sense proveïdor) —</option>
                  {data.suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="es-cell es-cell--del">
                <button className="es-del-btn" onClick={() => remove(sc.id)}><Trash2 size={14}/></button>
              </div>
            </div>
          ))}
          <div className="es-tfoot">
            <span className="es-tfoot-lbl">Total gastos d'estructura</span>
            <span className="es-tfoot-val">{formatEur(total)}</span>
          </div>
        </div>
      )}

      <style jsx>{`
        /* Topbar */
        .es-topbar { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; gap: 20px; }
        .es-title { font-size: 19px; font-weight: 700; color: #111827; letter-spacing: -0.02em; }
        .es-sub { font-size: 12.5px; color: #6B7280; margin-top: 2px; }
        .es-hint { font-size: 11.5px; color: #9CA3AF; margin-top: 5px; line-height: 1.5; max-width: 680px; }
        .es-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; padding-top: 2px; }
        .es-btn-export { height: 34px; padding: 0 14px; border: 1px solid #E5E7EB; border-radius: 8px; font-size: 13px; font-weight: 500; color: #374151; background: white; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.12s; white-space: nowrap; }
        .es-btn-export:hover { border-color: #2563EB; color: #2563EB; }
        .es-btn-new { height: 34px; padding: 0 16px; background: linear-gradient(135deg,#1B2B4B,#2563EB); color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 1px 6px rgba(37,99,235,0.25); transition: opacity 0.12s; white-space: nowrap; }
        .es-btn-new:hover { opacity: 0.88; }

        /* Allocation card */
        .es-alloc-card { background: white; border: 1px solid #E8ECF2; border-radius: 12px; padding: 14px 20px; margin-bottom: 12px; }
        .es-alloc-title { font-size: 13px; font-weight: 700; color: #111827; margin-bottom: 10px; }
        .es-alloc-opts { display: flex; gap: 24px; flex-wrap: wrap; }
        .es-alloc-opt { display: flex; align-items: center; gap: 8px; font-size: 13.5px; color: #374151; cursor: pointer; font-weight: 500; }
        .es-alloc-opt input[type="radio"] { accent-color: #2563EB; width: 15px; height: 15px; cursor: pointer; }

        /* Table */
        .es-table-wrap { background: white; border: 1px solid #E8ECF2; border-radius: 12px; overflow: hidden; }
        .es-thead { display: grid; grid-template-columns: 1fr 18% 14% 24% 44px; padding: 11px 20px; border-bottom: 1px solid #F3F4F6; background: #FAFAFA; gap: 8px; }
        .es-th { font-size: 10.5px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.07em; display: flex; align-items: center; padding: 0 4px; }
        .es-th--amount { justify-content: flex-end; }
        .es-th--del { justify-content: flex-end; }
        .es-row { display: grid; grid-template-columns: 1fr 18% 14% 24% 44px; padding: 0 20px; border-bottom: 1px solid #F3F4F6; align-items: center; transition: background 0.1s; gap: 8px; }
        .es-row:last-child { border-bottom: none; }
        .es-row:hover { background: #FAFBFF; }
        .es-cell { padding: 8px 4px; display: flex; align-items: center; }
        .es-cell--amount { justify-content: flex-end; }
        .es-cell--del { justify-content: flex-end; }
        .es-inp { width: 100%; border: 1px solid transparent; border-radius: 7px; padding: 7px 8px; font-size: 13.5px; color: #111827; font-family: inherit; outline: none; background: transparent; transition: border-color 0.12s, background 0.12s; cursor: default; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .es-inp:hover { border-color: #D1D5DB; background: #F9FAFB; cursor: text; }
        .es-inp:focus { border-color: #2563EB; background: white; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); cursor: text; }
        .es-inp::placeholder { color: #C9CDD4; }
        .es-inp--num { text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; }
        .es-sel { width: 100%; cursor: pointer; border: 1px solid transparent; border-radius: 7px; background: transparent; transition: border-color 0.12s, background 0.12s; padding: 7px 8px; font-size: 13px; color: #374151; font-family: inherit; outline: none; }
        .es-sel:hover { border-color: #D1D5DB; background: #F9FAFB; }
        .es-sel:focus { border-color: #2563EB; background: white; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }
        .es-del-btn { width: 28px; height: 28px; border: 1px solid #FEE2E2; background: #FFF5F5; border-radius: 7px; cursor: pointer; color: #FCA5A5; display: flex; align-items: center; justify-content: center; transition: all 0.12s; flex-shrink: 0; }
        .es-del-btn:hover { background: #FEE2E2; border-color: #EF4444; color: #EF4444; }
        .es-tfoot { display: flex; align-items: center; justify-content: space-between; padding: 14px 22px; background: #F8F9FB; border-top: 1px solid #E8ECF2; }
        .es-tfoot-lbl { font-size: 12px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; }
        .es-tfoot-val { font-size: 16px; font-weight: 800; color: #111827; font-variant-numeric: tabular-nums; }
        .es-empty { padding: 52px; text-align: center; font-size: 14px; color: #D1D5DB; background: white; border-radius: 12px; border: 1px solid #E8ECF2; }
      `}</style>
    </div>
  )
}

/* ─── CONFIGURACIÓ ─── */
function ConfiguracioSection({ data, save }: { data: FinanceData; save: (d: FinanceData) => void }) {
  const [marginObjective, setMarginObjective] = useState(String(data.marginObjective || 50))

  return (
    <div>
      <div className="cfg-title">Configuració</div>
      <div className="cfg-card">
        <div className="cfg-section-title">Objectiu de marge global</div>
        <div className="cfg-desc">Percentatge de marge mínim que s'espera obtenir. Cada registre pot tenir el seu propi objectiu que substitueix aquest valor global.</div>
        <div className="cfg-field">
          <label>Objectiu de marge (%)</label>
          <input type="number" min="0" max="100" step="1" className="cfg-input" value={marginObjective} onChange={e => setMarginObjective(e.target.value)} placeholder="p.ex. 50" />
        </div>
        <button className="cfg-save-btn" onClick={() => save({ ...data, marginObjective: parseFloat(marginObjective) || 50 })}>
          <Save size={15} />Guardar configuració
        </button>
      </div>
      <style jsx>{`
        .cfg-title { font-size: 20px; font-weight: 700; color: #0F1B2D; letter-spacing: -0.02em; margin-bottom: 20px; }
        .cfg-card { background: white; border-radius: 18px; border: 1px solid rgba(0,0,0,0.06); box-shadow: 0 2px 8px rgba(0,0,0,0.05); padding: 28px; max-width: 560px; }
        .cfg-section-title { font-size: 14px; font-weight: 700; color: #0F1B2D; margin-bottom: 4px; }
        .cfg-desc { font-size: 12.5px; color: #A0A9BB; margin-bottom: 14px; line-height: 1.5; }
        .cfg-field { display: flex; flex-direction: column; gap: 6px; }
        .cfg-field label { font-size: 11.5px; font-weight: 600; color: #5A6478; letter-spacing: 0.03em; text-transform: uppercase; }
        .cfg-input { height: 40px; padding: 0 12px; border: 1.5px solid rgba(0,0,0,0.1); border-radius: 10px; font-size: 14px; color: #0F1B2D; outline: none; background: #FAFAFA; font-family: inherit; transition: border-color 0.15s; max-width: 280px; }
        .cfg-input:focus { border-color: #2563EB; background: white; }
        .cfg-save-btn { margin-top: 24px; height: 40px; padding: 0 20px; background: linear-gradient(135deg,#1B2B4B,#2563EB); color: white; border: none; border-radius: 10px; font-size: 13.5px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 7px; box-shadow: 0 2px 8px rgba(37,99,235,0.3); }
        .cfg-save-btn:hover { opacity: 0.9; }
      `}</style>
    </div>
  )
}
