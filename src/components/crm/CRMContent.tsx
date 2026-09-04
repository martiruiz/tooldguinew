'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Search, Plus, Building2, Globe, TrendingUp, X, Loader2,
  Star, Trash2, Calendar,
} from 'lucide-react'
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from 'recharts'
import { getInitials, clientTypeLabels } from '@/lib/utils'
import { NewClientModal } from '@/components/clients/NewClientModal'

// ─── Types ───────────────────────────────────────
interface Client {
  id: string; name: string; type: string; status: string
  email?: string; phone?: string; website?: string; contact_name?: string; logo_url?: string
  projects?: { count: number }[]
}

interface Opportunity {
  id: string; client_id?: string; client_name: string
  stage: string; value: number; probability: number
  close_date?: string; responsible_id?: string
  score?: number; score_notes?: string; description?: string
  analysis_answers?: Record<string, number>
  created_at: string; updated_at: string
  next_step?: string; next_step_date?: string
  lead_source?: string; lost_reason?: string; services?: string
}

interface Profile { id: string; full_name: string }

interface Props {
  clients: Client[]
  opportunities: Opportunity[]
  profiles: Profile[]
  currentUserId: string
}

// ─── Constants ───────────────────────────────────
const STAGES = [
  { key: 'prospect',       label: 'Lead',        color: '#9A9A9A', bg: '#F5F5F5' },
  { key: 'contactat',      label: 'Contactat',   color: '#3B82F6', bg: '#EFF6FF' },
  { key: 'qualificat',     label: 'Qualificat',  color: '#06B6D4', bg: '#ECFEFF' },
  { key: 'proposta',       label: 'Proposta',    color: '#8B5CF6', bg: '#F5F3FF' },
  { key: 'negociacio',     label: 'Negociació',  color: '#F59E0B', bg: '#FFFBEB' },
  { key: 'tancant',        label: 'Tancament',   color: '#F97316', bg: '#FFF7ED' },
  { key: 'tancat_guanyat', label: 'Guanyat',     color: '#16A34A', bg: '#F0FDF4' },
  { key: 'tancat_perdut',  label: 'Perdut',      color: '#DC2626', bg: '#FEF2F2' },
]

const NEXT_STEP_OPTIONS = [
  { value: '', label: 'Sense next step' },
  { value: 'trucada', label: '📞 Fer trucada' },
  { value: 'proposta', label: '📄 Enviar proposta' },
  { value: 'follow_up', label: '↩️ Fer follow-up' },
  { value: 'reunio', label: '🤝 Reunió' },
  { value: 'pressupost', label: '💰 Enviar pressupost' },
  { value: 'esperar', label: '⏳ Esperar resposta' },
  { value: 'renovacio', label: '🔄 Renovació' },
  { value: 'altres', label: '✏️ Altres' },
]

const LEAD_SOURCE_OPTIONS = [
  { value: '', label: 'Desconegut' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'web', label: 'Web' },
  { value: 'referencia', label: 'Referència' },
  { value: 'networking', label: 'Networking' },
  { value: 'outbound', label: 'Outbound' },
  { value: 'client_actual', label: 'Client actual' },
  { value: 'esdeveniment', label: 'Esdeveniment' },
  { value: 'marca_personal', label: 'Marca personal Martí' },
  { value: 'inbound', label: 'Inbound' },
]

const LOST_REASON_OPTIONS = [
  { value: '', label: 'Selecciona motiu...' },
  { value: 'preu', label: 'Preu' },
  { value: 'competencia', label: 'Competència' },
  { value: 'sense_pressupost', label: 'Sense pressupost' },
  { value: 'timing', label: 'Timing' },
  { value: 'no_resposta', label: 'No resposta' },
  { value: 'client_intern', label: 'Client intern' },
  { value: 'no_encaix', label: 'No encaix' },
  { value: 'cancel_lat', label: 'Projecte cancel·lat' },
  { value: 'altres', label: 'Altres' },
]

const ACTIVE_STAGES = STAGES.filter(s => !['tancat_guanyat', 'tancat_perdut'].includes(s.key))

// ─── Qualificació interna ─────────────────────────
const ANALYSIS_QUESTIONS = [
  {
    key: 'q1',
    question: 'Quin és el pressupost disponible del client?',
    options: [
      { label: 'Alt (+€3.000/mes)', score: 3 },
      { label: 'Mitjà (€500–€3.000/mes)', score: 2 },
      { label: 'Baix o desconegut (<€500)', score: 1 },
    ],
  },
  {
    key: 'q2',
    question: 'Quina és la urgència del projecte?',
    options: [
      { label: 'Alta — vol començar immediatament', score: 3 },
      { label: 'Mitjana — en els propers 1–3 mesos', score: 2 },
      { label: 'Baixa — sense data clara', score: 1 },
    ],
  },
  {
    key: 'q3',
    question: 'Com s\'alinea amb els serveis de Guinew?',
    options: [
      { label: 'Alt encaix — necessita exactament el que oferim', score: 3 },
      { label: 'Parcial — alguns serveis coincideixen', score: 2 },
      { label: 'Baix — poc encaix o massa customització', score: 1 },
    ],
  },
  {
    key: 'q4',
    question: 'Qui pren les decisions al client?',
    options: [
      { label: 'Un sol decisor — procés àgil', score: 3 },
      { label: '2–3 persones — procés moderat', score: 2 },
      { label: 'Múltiples departaments — procés lent', score: 1 },
    ],
  },
  {
    key: 'q5',
    question: 'Quin és el potencial de creixement de la relació?',
    options: [
      { label: 'Alt — pot ampliar serveis amb el temps', score: 3 },
      { label: 'Mitjà — relació estable però limitada', score: 2 },
      { label: 'Baix — projecte únic o puntual', score: 1 },
    ],
  },
]

function calcAnalysisScore(answers: Record<string, number>): number {
  return ANALYSIS_QUESTIONS.reduce((total, q) => {
    const selected = answers[q.key]
    if (selected === undefined) return total
    return total + (q.options[selected]?.score || 0)
  }, 0)
}

function analysisResult(score: number, answered: number): { label: string; color: string; bg: string } | null {
  if (answered < 5) return null
  if (score >= 13) return { label: 'Excel·lent client potencial', color: '#16A34A', bg: '#F0FDF4' }
  if (score >= 9)  return { label: 'Client interessant', color: '#D97706', bg: '#FFFBEB' }
  return { label: 'Client amb risc o poc encaix', color: '#DC2626', bg: '#FEF2F2' }
}

const statusColors: Record<string, { bg: string; color: string }> = {
  active:   { bg: '#F0FDF4', color: '#16A34A' },
  inactive: { bg: '#F5F5F5', color: '#9A9A9A' },
  prospect: { bg: '#FFFBEB', color: '#D97706' },
  churned:  { bg: '#FEF2F2', color: '#DC2626' },
}
const statusLabels: Record<string, string> = {
  active: 'Actiu', inactive: 'Inactiu', prospect: 'Prospecte', churned: 'Perdut',
}

function fmtEur(n: number | undefined | null) {
  return '€' + (n || 0).toLocaleString('ca-ES')
}

function stageInfo(key: string) {
  return STAGES.find(s => s.key === key) || STAGES[0]
}

const BLANK_FORM = {
  client_id: '', client_name: '', stage: 'prospect',
  value: '', probability: '30', close_date: '',
  responsible_id: '', score_notes: '', description: '',
  next_step: '', next_step_date: '', lead_source: '', lost_reason: '', services: '',
}
const BLANK_ANSWERS: Record<string, number> = {}

// ─── Component ───────────────────────────────────
export function CRMContent({ clients, opportunities: initialOps, profiles, currentUserId }: Props) {
  // tab state removed — all sections now visible on one page
  const [opportunities, setOpportunities] = useState<Opportunity[]>(initialOps)

  // Editable stage labels
  const [stageLabels, setStageLabels] = useState<Record<string, string>>(() => {
    if (typeof window === 'undefined') return {}
    try { return JSON.parse(localStorage.getItem('guinew_stage_labels') || '{}') } catch { return {} }
  })
  const [editingStage, setEditingStage] = useState<string | null>(null)
  const [editingLabel, setEditingLabel] = useState('')

  const getStageLabel = (key: string, defaultLabel: string) => stageLabels[key] || defaultLabel

  // Drag & drop
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverStage, setDragOverStage] = useState<string | null>(null)

  const onDragStart = (e: React.DragEvent, opId: string) => {
    setDraggingId(opId)
    e.dataTransfer.effectAllowed = 'move'
  }
  const onDragOver = (e: React.DragEvent, stageKey: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverStage(stageKey)
  }
  const onDrop = async (e: React.DragEvent, stageKey: string) => {
    e.preventDefault()
    if (!draggingId) return
    const op = opportunities.find(o => o.id === draggingId)
    if (op && op.stage !== stageKey) await moveStage(op, stageKey)
    setDraggingId(null)
    setDragOverStage(null)
  }
  const onDragEnd = () => { setDraggingId(null); setDragOverStage(null) }

  const saveStageLabel = (key: string) => {
    const trimmed = editingLabel.trim()
    if (trimmed) {
      const updated = { ...stageLabels, [key]: trimmed }
      setStageLabels(updated)
      localStorage.setItem('guinew_stage_labels', JSON.stringify(updated))
    }
    setEditingStage(null)
  }

  // Client list state
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Tots')
  const [clientPage, setClientPage] = useState(1)
  const [showNewClient, setShowNewClient] = useState(false)
  const CRM_PAGE_SIZE = 10

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editOp, setEditOp] = useState<Opportunity | null>(null)
  const [form, setForm] = useState({ ...BLANK_FORM })
  const [analysisAnswers, setAnalysisAnswers] = useState<Record<string, number>>({ ...BLANK_ANSWERS })
  const [saving, setSaving] = useState(false)
  const [saveErr, setSaveErr] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [monthlyTarget, setMonthlyTarget] = useState<number>(0)
  const [editingTarget, setEditingTarget] = useState(false)
  const [targetInput, setTargetInput] = useState('')

  useEffect(() => {
    const stored = parseInt(localStorage.getItem('guinew_monthly_target') || '0') || 0
    if (stored) setMonthlyTarget(stored)
  }, [])

  // ─── KPIs ─────────────────────────────────────
  const now = new Date()
  const kpis = useMemo(() => {
    const active = opportunities.filter(o => !['tancat_guanyat', 'tancat_perdut'].includes(o.stage))
    const won = opportunities.filter(o => o.stage === 'tancat_guanyat')
    const lost = opportunities.filter(o => o.stage === 'tancat_perdut')

    const pipeline = active.reduce((s, o) => s + (Number(o.value) || 0), 0)
    const pipelineWeighted = active.reduce((s, o) =>
      s + (Number(o.value) || 0) * ((Number(o.probability) || 0) / 100), 0)

    const forecastThisMonth = active
      .filter(o => {
        if (!o.close_date) return false
        const d = new Date(o.close_date)
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
      })
      .reduce((s, o) => s + (Number(o.value) || 0) * ((Number(o.probability) || 0) / 100), 0)

    const winRate = won.length + lost.length > 0
      ? Math.round((won.length / (won.length + lost.length)) * 100) : 0
    const avgTicket = won.length > 0
      ? Math.round(won.reduce((s, o) => s + (Number(o.value) || 0), 0) / won.length) : 0

    const wonWithDates = won.filter(o => o.close_date && o.created_at)
    const avgCycleDays = wonWithDates.length > 0
      ? Math.round(wonWithDates.reduce((s, o) => {
          const days = (new Date(o.close_date!).getTime() - new Date(o.created_at).getTime()) / 86400000
          return s + days
        }, 0) / wonWithDates.length)
      : 0

    const coverage = monthlyTarget > 0 ? (pipeline / monthlyTarget) : 0

    return { pipeline, pipelineWeighted, forecastThisMonth, winRate, avgTicket, avgCycleDays, coverage }
  }, [opportunities, monthlyTarget])

  // ─── Client detail modal ─────────────────────
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clientForm, setClientForm] = useState<Partial<Client>>({})
  const [clientSaving, setClientSaving] = useState(false)
  const [clientErr, setClientErr] = useState('')
  const [clientsList, setClientsList] = useState<Client[]>(clients)
  const [logoUploading, setLogoUploading] = useState(false)
  const [previewLogo, setPreviewLogo] = useState<string | null>(null)

  const openClientModal = (c: Client) => {
    setSelectedClient(c)
    setClientForm({ name: c.name, type: c.type, status: c.status, website: c.website || '' })
    setPreviewLogo(c.logo_url || null)
    setClientErr('')
  }
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedClient) return
    setLogoUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('clientId', selectedClient.id)
    const res = await fetch('/api/clients/upload-logo', { method: 'POST', body: fd })
    const j = await res.json()
    if (j.url) {
      setPreviewLogo(j.url + '?t=' + Date.now())
      setClientsList(prev => prev.map(c => c.id === selectedClient.id ? { ...c, logo_url: j.url } : c))
    } else {
      setClientErr(j.error || 'Error pujant la imatge')
    }
    setLogoUploading(false)
  }
  const handleClientSave = async () => {
    if (!selectedClient) return
    setClientSaving(true); setClientErr('')
    const res = await fetch(`/api/clients/${selectedClient.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clientForm),
    })
    if (res.ok) {
      setClientsList(prev => prev.map(c => c.id === selectedClient.id ? { ...c, ...clientForm } as Client : c))
      setSelectedClient(null)
    } else {
      const j = await res.json().catch(() => ({}))
      setClientErr(j.error || 'Error desant')
    }
    setClientSaving(false)
  }

  // ─── Client list filtered ──────────────────────
  const statusFilterMap: Record<string, string> = {
    Actiu: 'active', Prospecte: 'prospect', Inactiu: 'inactive', Perdut: 'churned',
  }
  const filteredClients = useMemo(() => clientsList.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = c.name.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.contact_name?.toLowerCase().includes(q)
    const matchStatus = statusFilter === 'Tots' || c.status === statusFilterMap[statusFilter]
    return matchSearch && matchStatus
  }), [clientsList, search, statusFilter])

  const crmTotalPages = Math.max(1, Math.ceil(filteredClients.length / CRM_PAGE_SIZE))
  const crmSafePage = Math.min(clientPage, crmTotalPages)
  const paginatedClients = filteredClients.slice((crmSafePage - 1) * CRM_PAGE_SIZE, crmSafePage * CRM_PAGE_SIZE)

  // ─── Pipeline grouped ─────────────────────────
  const byStage = useMemo(() => {
    const map: Record<string, Opportunity[]> = {}
    STAGES.forEach(s => { map[s.key] = [] })
    opportunities.forEach(o => {
      if (map[o.stage]) map[o.stage].push(o)
      else map['prospect'].push(o)
    })
    return map
  }, [opportunities])

  // ─── Analytics data ───────────────────────────
  const analyticsData = useMemo(() => {
    const year = now.getFullYear()
    const MONTHS = ['Gen','Feb','Mar','Abr','Mai','Jun','Jul','Ago','Set','Oct','Nov','Des']
    const monthlyRevenue = MONTHS.map((m, i) => {
      const val = opportunities
        .filter(o => o.stage === 'tancat_guanyat' && o.close_date)
        .filter(o => { const d = new Date(o.close_date!); return d.getFullYear() === year && d.getMonth() === i })
        .reduce((s, o) => s + (Number(o.value) || 0), 0)
      return { mes: m, valor: val }
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
    return { monthlyRevenue, pipelineByStage, funnelData, winRate, won, lost }
  }, [opportunities, byStage])

  // ─── Modal helpers ────────────────────────────
  const openCreate = (stageKey?: string) => {
    setEditOp(null)
    setForm({ ...BLANK_FORM, ...(stageKey ? { stage: stageKey } : {}) })
    setAnalysisAnswers({})
    setSaveErr('')
    setShowModal(true)
  }
  const openEdit = (op: Opportunity) => {
    setEditOp(op)
    setForm({
      client_id: op.client_id || '',
      client_name: op.client_name,
      stage: op.stage,
      value: String(op.value || ''),
      probability: String(op.probability || ''),
      close_date: op.close_date || '',
      responsible_id: op.responsible_id || '',
      score_notes: op.score_notes || '',
      description: op.description || '',
      next_step: op.next_step || '',
      next_step_date: op.next_step_date || '',
      lead_source: op.lead_source || '',
      lost_reason: op.lost_reason || '',
      services: op.services || '',
    })
    setAnalysisAnswers(op.analysis_answers || {})
    setSaveErr('')
    setConfirmDelete(false)
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.client_name.trim()) { setSaveErr('El nom del client és obligatori'); return }
    setSaving(true); setSaveErr('')
    try {
      const answeredCount = Object.keys(analysisAnswers).length
      const computedScore = answeredCount > 0 ? calcAnalysisScore(analysisAnswers) : null
      const body = {
        ...form,
        value: parseFloat(form.value) || 0,
        probability: parseInt(form.probability) || 0,
        score: computedScore,
        close_date: form.close_date || null,
        responsible_id: form.responsible_id || null,
        client_id: form.client_id || null,
        analysis_answers: answeredCount > 0 ? analysisAnswers : null,
        next_step: form.next_step || null,
        next_step_date: form.next_step_date || null,
        lead_source: form.lead_source || null,
        lost_reason: form.lost_reason || null,
        services: form.services || null,
      }
      const url = editOp ? `/api/crm/opportunities/${editOp.id}` : '/api/crm/opportunities'
      const method = editOp ? 'PATCH' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const json = await res.json()
      if (json.error) { setSaveErr(json.error); return }
      if (editOp) {
        setOpportunities(prev => prev.map(o => o.id === editOp.id ? json.opportunity : o))
      } else {
        setOpportunities(prev => [json.opportunity, ...prev])
      }
      setShowModal(false)
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    await fetch(`/api/crm/opportunities/${id}`, { method: 'DELETE' })
    setOpportunities(prev => prev.filter(o => o.id !== id))
    setDeleting(null)
    setConfirmDelete(false)
    if (showModal) setShowModal(false)
  }

  const moveStage = async (op: Opportunity, newStage: string) => {
    const res = await fetch(`/api/crm/opportunities/${op.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: newStage }),
    })
    const json = await res.json()
    if (!json.error) setOpportunities(prev => prev.map(o => o.id === op.id ? { ...o, stage: newStage } : o))
  }

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  const [tooltipState, setTooltipState] = useState<{ id: string; x: number; yTop: number; yBottom: number } | null>(null)

  const KPI_INFO: Record<string, string> = {
    pipeline: 'Suma del valor de totes les oportunitats actives (no tancades). Indica el potencial de facturació actual.',
    pipeline_ponderat: 'Cada oportunitat es multiplica pel seu % de probabilitat. Dona una visió més realista del que es pot tancar.',
    forecast: 'Suma ponderada (valor × probabilitat) de les oportunitats amb data de tancament prevista aquest mes.',
    objectiu: 'Objectiu de facturació mensual. Fes clic al valor per editar-lo. Es guarda localment al navegador.',
    win_rate: 'Percentatge d\'oportunitats guanyades sobre el total de deals tancats (guanyats + perduts).',
    ticket_mitja: 'Valor mig de les oportunitats guanyades. Ajuda a entendre el tamany típic dels teus projectes.',
    cicle_venda: 'Temps mig (en dies) des de la creació d\'una oportunitat fins que es tanca com a guanyada.',
    pipeline_coverage: 'Ratio entre el pipeline actiu i l\'objectiu mensual. 3x o més és considerat saludable.',
  }

  // Close tooltip on outside click
  useEffect(() => {
    if (!tooltipState) return
    function handler() { setTooltipState(null) }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [tooltipState])

  const InfoIcon = ({ id }: { id: string }) => {
    const btnRef = useRef<HTMLButtonElement>(null)
    return (
      <span style={{ display: 'inline-flex', marginLeft: 4 }}>
        <button
          ref={btnRef}
          onClick={e => {
            e.stopPropagation()
            if (tooltipState?.id === id) { setTooltipState(null); return }
            const rect = btnRef.current!.getBoundingClientRect()
            setTooltipState({ id, x: rect.left + rect.width / 2, yTop: rect.top, yBottom: rect.bottom })
          }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1, color: '#C0C0C0', display: 'inline-flex', alignItems: 'center' }}
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm-1 4h2v4H7V8z"/></svg>
        </button>
      </span>
    )
  }

  // Fixed tooltip — appears above if enough space, else below
  const TooltipPopup = (() => {
    if (!tooltipState) return null
    const TOOLTIP_HEIGHT = 140 // approximate
    const MARGIN = 12
    const showAbove = tooltipState.yTop > TOOLTIP_HEIGHT + MARGIN + 60
    const posStyle = showAbove
      ? { bottom: `${window.innerHeight - tooltipState.yTop + MARGIN}px` }
      : { top: `${tooltipState.yBottom + MARGIN}px` }
    return (
      <div style={{
        position: 'fixed',
        left: tooltipState.x,
        transform: 'translateX(-50%)',
        ...posStyle,
        background: 'white',
        color: '#3C4B61',
        fontSize: 13,
        lineHeight: 1.65,
        fontWeight: 400,
        padding: '14px 18px',
        borderRadius: 16,
        width: 272,
        zIndex: 99999,
        boxShadow: '0 12px 40px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.07)',
        border: '1px solid rgba(0,0,0,0.08)',
        pointerEvents: 'none',
        whiteSpace: 'normal',
      }}>
        {showAbove ? (
          /* Arrow pointing down */
          <span style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', display: 'block' }}>
            <span style={{ display: 'block', width: 0, height: 0, borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderTop: '7px solid rgba(0,0,0,0.07)' }} />
            <span style={{ display: 'block', width: 0, height: 0, borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderTop: '7px solid white', marginTop: -8 }} />
          </span>
        ) : (
          /* Arrow pointing up */
          <span style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', display: 'block' }}>
            <span style={{ display: 'block', width: 0, height: 0, borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderBottom: '7px solid rgba(0,0,0,0.07)' }} />
            <span style={{ display: 'block', width: 0, height: 0, borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderBottom: '7px solid white', marginTop: -6 }} />
          </span>
        )}
        <span style={{ display: 'block', fontWeight: 700, color: '#0F1B2D', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7, paddingBottom: 7, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          Com es calcula
        </span>
        {KPI_INFO[tooltipState.id]}
      </div>
    )
  })()

  const clientOptions = clients.map(c => ({ id: c.id, name: c.name }))

  return (
    <>
    <div className="crm-page">
      {/* KPIs — Row 1 */}
      <div className="kpi-row">
        <div className="kpi-card">
          <div className="kpi-lbl">Pipeline<InfoIcon id="pipeline" /></div>
          <div className="kpi-val">{fmtEur(kpis.pipeline)}</div>
          <div className="kpi-sub">Total oportunitats actives</div>
        </div>
        <div className="kpi-card kpi-card--accent">
          <div className="kpi-lbl">Pipeline ponderat<InfoIcon id="pipeline_ponderat" /></div>
          <div className="kpi-val" style={{ color: '#1B2B4B' }}>{fmtEur(Math.round(kpis.pipelineWeighted))}</div>
          <div className="kpi-sub">Valor × probabilitat</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-lbl">Forecast aquest mes<InfoIcon id="forecast" /></div>
          <div className="kpi-val">{fmtEur(Math.round(kpis.forecastThisMonth))}</div>
          <div className="kpi-sub">Closes previstos al mes</div>
        </div>
        <div className="kpi-card kpi-card--target" onClick={() => { setEditingTarget(true); setTargetInput(String(monthlyTarget || '')) }} title="Fes clic per editar l'objectiu">
          <div className="kpi-lbl">Objectiu mensual<InfoIcon id="objectiu" /></div>
          {editingTarget ? (
            <input
              className="kpi-target-input"
              type="number"
              value={targetInput}
              autoFocus
              onChange={e => setTargetInput(e.target.value)}
              onBlur={() => {
                const v = parseInt(targetInput) || 0
                setMonthlyTarget(v)
                localStorage.setItem('guinew_monthly_target', String(v))
                setEditingTarget(false)
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const v = parseInt(targetInput) || 0
                  setMonthlyTarget(v)
                  localStorage.setItem('guinew_monthly_target', String(v))
                  setEditingTarget(false)
                }
                if (e.key === 'Escape') setEditingTarget(false)
              }}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <div className="kpi-val">
              {monthlyTarget > 0 ? (
                <span>
                  {fmtEur(Math.round(kpis.forecastThisMonth))}
                  <span style={{ fontSize: 14, color: '#9A9A9A', fontWeight: 500 }}> / {fmtEur(monthlyTarget)}</span>
                </span>
              ) : (
                <span style={{ fontSize: 14, color: '#C0C0C0', fontWeight: 400 }}>Defineix un objectiu →</span>
              )}
            </div>
          )}
          {monthlyTarget > 0 && !editingTarget && (
            <div className="kpi-progress-bar">
              <div className="kpi-progress-fill" style={{ width: `${Math.min((kpis.forecastThisMonth / monthlyTarget) * 100, 100)}%`, background: kpis.forecastThisMonth >= monthlyTarget ? '#16A34A' : '#1B2B4B' }} />
            </div>
          )}
        </div>
      </div>

      {/* KPIs — Row 2 */}
      <div className="kpi-row-2">
        <div className="kpi2">
          <span className="kpi2-val">{kpis.winRate}%</span>
          <span className="kpi2-lbl">Win rate<InfoIcon id="win_rate" /></span>
        </div>
        <div className="kpi2-sep" />
        <div className="kpi2">
          <span className="kpi2-val">{fmtEur(kpis.avgTicket)}</span>
          <span className="kpi2-lbl">Ticket mitjà<InfoIcon id="ticket_mitja" /></span>
        </div>
        <div className="kpi2-sep" />
        <div className="kpi2">
          <span className="kpi2-val">{kpis.avgCycleDays > 0 ? `${kpis.avgCycleDays} dies` : '—'}</span>
          <span className="kpi2-lbl">Cicle mitjà de venda<InfoIcon id="cicle_venda" /></span>
        </div>
        <div className="kpi2-sep" />
        <div className="kpi2">
          <span className="kpi2-val" style={{ color: kpis.coverage >= 3 ? '#16A34A' : kpis.coverage >= 1.5 ? '#F59E0B' : '#DC2626' }}>
            {monthlyTarget > 0 ? `${kpis.coverage.toFixed(1)}x` : '—'}
          </span>
          <span className="kpi2-lbl">Pipeline coverage<InfoIcon id="pipeline_coverage" /></span>
        </div>
      </div>

      {/* ── PIPELINE SECTION ── */}
      <div className="section-header">
        <div className="section-title">Pipeline</div>
        <button className="btn-primary" onClick={() => openCreate()}><Plus size={14} />Nova oportunitat</button>
      </div>
      <div className="pipeline-wrap">
          {STAGES.map(stage => {
            const ops = byStage[stage.key] || []
            const stageTotal = ops.reduce((s, o) => s + (o.value || 0), 0)
            return (
              <div key={stage.key} className="pipeline-col">
                <div className="col-header" style={{ borderTopColor: stage.color }}>
                  {editingStage === stage.key ? (
                    <input
                      className="col-title-input"
                      value={editingLabel}
                      onChange={e => setEditingLabel(e.target.value)}
                      onBlur={() => saveStageLabel(stage.key)}
                      onKeyDown={e => { if (e.key === 'Enter') saveStageLabel(stage.key); if (e.key === 'Escape') setEditingStage(null) }}
                      autoFocus
                      style={{ color: stage.color }}
                    />
                  ) : (
                    <div
                      className="col-title"
                      style={{ color: stage.color, cursor: 'text' }}
                      onClick={() => { setEditingStage(stage.key); setEditingLabel(getStageLabel(stage.key, stage.label)) }}
                      title="Fes clic per editar"
                    >
                      {getStageLabel(stage.key, stage.label)}
                    </div>
                  )}
                  <div className="col-meta">{ops.length} · {fmtEur(stageTotal)}</div>
                </div>
                <div
                  className={`col-cards${dragOverStage === stage.key && draggingId ? ' drag-over' : ''}`}
                  onDragOver={e => onDragOver(e, stage.key)}
                  onDragLeave={() => setDragOverStage(null)}
                  onDrop={e => onDrop(e, stage.key)}
                  onDoubleClick={e => { if ((e.target as HTMLElement).closest('.op-card')) return; openCreate(stage.key) }}
                  title="Doble clic per crear nova oportunitat"
                >
                  {ops.map(op => {
                    const daysSinceUpdate = op.updated_at
                      ? Math.floor((Date.now() - new Date(op.updated_at).getTime()) / 86400000) : 0
                    const isStale = daysSinceUpdate >= 7
                    const responsible = profiles.find(p => p.id === op.responsible_id)
                    const nextStepLabel = NEXT_STEP_OPTIONS.find(o => o.value === op.next_step)?.label
                    return (
                      <div
                        key={op.id}
                        className={`op-card${draggingId === op.id ? ' dragging' : ''}`}
                        draggable
                        onDragStart={e => onDragStart(e, op.id)}
                        onDragEnd={onDragEnd}
                        onClick={() => openEdit(op)}
                      >
                        <div className="op-card-top">
                          <div className="op-name">{op.client_name}</div>
                          {isStale && (
                            <span className="op-stale" title={`Sense activitat fa ${daysSinceUpdate} dies`}>⚠</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                          <div className="op-value">{fmtEur(op.value)}</div>
                          {op.probability > 0 && <span style={{ fontSize: 11, color: '#9A9A9A' }}>{op.probability}%</span>}
                        </div>
                        {(op.services || op.description) && (
                          <div className="op-desc">{(op.services || op.description || '').slice(0, 40)}</div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          {op.close_date && (
                            <div className="op-date"><Calendar size={10} />{new Date(op.close_date + 'T12:00:00').toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' })}</div>
                          )}
                          {responsible && (
                            <div className="op-resp" title={responsible.full_name}>{getInitials(responsible.full_name)}</div>
                          )}
                          {isStale && (
                            <div className="op-stale-label">{daysSinceUpdate}d sense activitat</div>
                          )}
                        </div>
                        {nextStepLabel && (
                          <div className="op-next-step">{nextStepLabel}</div>
                        )}
                        {op.probability > 0 && (
                          <div className="op-prob-bar">
                            <div className="op-prob-fill" style={{ width: `${op.probability}%`, background: stage.color }} />
                          </div>
                        )}
                        {op.score != null && (
                          <div className="op-score">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star key={i} size={9} fill={i < op.score! ? '#F59E0B' : 'none'} color={i < op.score! ? '#F59E0B' : '#D0D0D0'} />
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {ops.length === 0 && (
                    <div className="col-empty">Cap oportunitat</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

      {/* ── CLIENTS SECTION ── */}
      <div className="section-header">
        <div className="section-title">Clients</div>
        <button className="btn-primary" onClick={() => setShowNewClient(true)}><Plus size={14} />Nou client</button>
      </div>
      <div className="toolbar">
            <div className="search-wrap">
              <Search size={14} color="#9A9A9A" />
              <input type="text" placeholder="Buscar per nom, email, contacte..." value={search}
                onChange={e => { setSearch(e.target.value); setClientPage(1) }} className="search-input" />
            </div>
            <div className="filters">
              {['Tots', 'Actiu', 'Prospecte', 'Inactiu', 'Perdut'].map(f => (
                <button key={f} onClick={() => { setStatusFilter(f); setClientPage(1) }}
                  className={`filter-btn${statusFilter === f ? ' active' : ''}`}>{f}</button>
              ))}
            </div>
          </div>
          <div className="count">
            {filteredClients.length} clients
            {crmTotalPages > 1 && <span style={{ color: '#C0C9D8', fontWeight: 400 }}> · pàgina {crmSafePage} de {crmTotalPages}</span>}
          </div>
          <div className="table-wrap">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Client</th><th>Tipus</th><th>Estat</th>
                  <th>Contacte</th><th>Email</th><th>Telèfon</th><th>Campanyes</th><th></th>
                </tr>
              </thead>
              <tbody>
                {paginatedClients.map(client => {
                  const badge = statusColors[client.status] || statusColors.inactive
                  const projectCount = client.projects?.[0]?.count ?? 0
                  return (
                    <tr key={client.id} onClick={() => openClientModal(client)} style={{ cursor: 'pointer' }}>
                      <td>
                        <div className="client-cell">
                          <div className="client-avatar">
                            {client.logo_url ? <img src={client.logo_url} alt={client.name} /> : getInitials(client.name)}
                          </div>
                          <div>
                            <div className="client-name">{client.name}</div>
                            {client.website && (
                              <a href={client.website} target="_blank" rel="noreferrer" className="client-web">
                                <Globe size={10} />{client.website.replace(/^https?:\/\//, '')}
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                      <td><span className="type-badge">{clientTypeLabels?.[client.type] ?? client.type}</span></td>
                      <td><span className="status-badge" style={{ background: badge.bg, color: badge.color }}>{statusLabels[client.status] ?? client.status}</span></td>
                      <td className="text-sm">{client.contact_name || '—'}</td>
                      <td>{client.email ? <a href={`mailto:${client.email}`} className="link">{client.email}</a> : <span className="muted">—</span>}</td>
                      <td className="text-sm">{client.phone || '—'}</td>
                      <td><div className="projects-count"><TrendingUp size={12} color="#9A9A9A" />{projectCount}</div></td>
                      <td></td>
                    </tr>
                  )
                })}
                {filteredClients.length === 0 && (
                  <tr><td colSpan={8} className="empty-row"><Building2 size={24} color="#D0D0D0" /><span>Cap client trobat</span></td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {crmTotalPages > 1 && (
            <div className="crm-pagination">
              <button
                className="crm-pag-btn"
                onClick={() => setClientPage(p => Math.max(1, p - 1))}
                disabled={crmSafePage === 1}
              >‹ Anterior</button>
              <div className="crm-pag-pages">
                {Array.from({ length: crmTotalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    className={`crm-pag-num${p === crmSafePage ? ' crm-pag-num--active' : ''}`}
                    onClick={() => setClientPage(p)}
                  >{p}</button>
                ))}
              </div>
              <button
                className="crm-pag-btn"
                onClick={() => setClientPage(p => Math.min(crmTotalPages, p + 1))}
                disabled={crmSafePage === crmTotalPages}
              >Següent ›</button>
            </div>
          )}

      {/* ── ANALYTICS SECTION ── */}
      <div className="section-header">
        <div className="section-title">Analítica</div>
      </div>
      <div className="analytics-wrap">
          {/* Chart 1: Annual revenue line */}
          <div className="chart-card chart-wide">
            <div className="chart-title">Ingressos tancats per mes ({new Date().getFullYear()})</div>
            <div className="chart-sub">Valor total tancat amb èxit cada mes</div>
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={analyticsData.monthlyRevenue} margin={{ top: 12, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.18} />
                    <stop offset="90%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F4FA" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#A0A9BB' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#A0A9BB' }} axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1000 ? `€${v/1000}k` : `€${v}`} />
                <Tooltip
                  formatter={(v) => [`€${Number(v).toLocaleString('ca-ES')}`, 'Ingressos']}
                  contentStyle={{ fontSize: 12.5, borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: '10px 14px', fontWeight: 600, color: '#1B2B4B' }}
                  labelStyle={{ fontSize: 11, color: '#A0A9BB', fontWeight: 500, marginBottom: 2 }}
                  cursor={{ stroke: '#2563EB', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area type="monotone" dataKey="valor" stroke="#2563EB" strokeWidth={2.5}
                  fill="url(#areaFill)"
                  dot={{ r: 3, fill: '#2563EB', strokeWidth: 2, stroke: 'white' }}
                  activeDot={{ r: 5, fill: '#2563EB', strokeWidth: 2, stroke: 'white' }} />
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
                      ['#60A5FA','#1D4ED8'], ['#A78BFA','#6D28D9'], ['#FB923C','#C2410C'],
                      ['#34D399','#059669'], ['#F472B6','#BE185D'], ['#38BDF8','#0369A1'],
                    ].map(([top, bot], idx) => (
                      <linearGradient key={idx} id={`bg${idx}`} x1="0" y1="0" x2="0" y2="1">
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
                      <Cell key={i} fill={`url(#bg${i % 6})`} />
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

          {/* Chart 4: Win rate */}
          <div className="chart-card">
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
                        <linearGradient id="wonPieGrad" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#34D399" />
                          <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                        <linearGradient id="lostPieGrad" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#FCA5A5" />
                          <stop offset="100%" stopColor="#DC2626" />
                        </linearGradient>
                      </defs>
                      <Pie data={analyticsData.winRate} cx="50%" cy="50%" innerRadius={44} outerRadius={68}
                        dataKey="value" paddingAngle={3} strokeWidth={0}>
                        {analyticsData.winRate.map((_, i) => (
                          <Cell key={i} fill={`url(#${i === 0 ? 'wonPieGrad' : 'lostPieGrad'})`} />
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

      {/* ── CLIENT MODAL ── */}
      {selectedClient && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSelectedClient(null)}>
          <div className="modal" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <label style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }} title="Canviar foto">
                  <div className="client-avatar" style={{ width: 44, height: 44, fontSize: 15 }}>
                    {previewLogo ? <img src={previewLogo} alt={selectedClient.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : getInitials(selectedClient.name)}
                  </div>
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '0')}>
                    {logoUploading ? <Loader2 size={14} color="white" /> : <span style={{ fontSize: 10, color: 'white', fontWeight: 700 }}>FOTO</span>}
                  </div>
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
                </label>
                <h2 style={{ fontSize: 16 }}>{selectedClient.name}</h2>
              </div>
              <button className="close-btn" onClick={() => setSelectedClient(null)}><X size={15} /></button>
            </div>
            <div className="modal-body">
              <div className="form-field">
                <label>Nom</label>
                <input className="form-input" value={clientForm.name || ''} onChange={e => setClientForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="form-row-2">
                <div className="form-field">
                  <label>Tipus</label>
                  <select className="form-select" value={clientForm.type || ''} onChange={e => setClientForm(p => ({ ...p, type: e.target.value }))}>
                    {['empresa', 'club_esportiu', 'federacio', 'torneig', 'esdeveniment', 'altres'].map(t => (
                      <option key={t} value={t}>{clientTypeLabels?.[t] ?? t}</option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label>Estat</label>
                  <select className="form-select" value={clientForm.status || ''} onChange={e => setClientForm(p => ({ ...p, status: e.target.value }))}>
                    <option value="active">Actiu</option>
                    <option value="prospect">Prospecte</option>
                    <option value="inactive">Inactiu</option>
                    <option value="churned">Perdut</option>
                  </select>
                </div>
              </div>
              <div className="form-field">
                <label>Web</label>
                <input className="form-input" value={clientForm.website || ''} onChange={e => setClientForm(p => ({ ...p, website: e.target.value }))} />
              </div>
              {clientErr && <div style={{ color: '#DC2626', fontSize: 12, marginTop: 4 }}>{clientErr}</div>}
            </div>
            <div className="modal-footer">
              <Link href={`/clients/${selectedClient.id}`} className="btn-secondary" style={{ marginRight: 'auto' }}>Veure fitxa completa</Link>
              <button className="btn-secondary" onClick={() => setSelectedClient(null)}>Cancel·lar</button>
              <button className="btn-primary" onClick={handleClientSave} disabled={clientSaving}>
                {clientSaving ? <Loader2 size={14} className="spin" /> : null}
                Desar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL ── */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2>{editOp ? 'Editar oportunitat' : 'Nova oportunitat'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}><X size={15} /></button>
            </div>
            <div className="modal-body">
              {/* Client */}
              <div className="form-row-2">
                <div className="form-field">
                  <label>Client existent</label>
                  <select className="form-select" value={form.client_id}
                    onChange={e => {
                      const cl = clientOptions.find(c => c.id === e.target.value)
                      setForm(p => ({ ...p, client_id: e.target.value, client_name: cl?.name || p.client_name }))
                    }}>
                    <option value="">Selecciona o escriu manualment...</option>
                    {clientOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label>Nom del client *</label>
                  <input className="form-input" value={form.client_name} onChange={f('client_name')} placeholder="Nom del client o empresa" />
                </div>
              </div>

              {/* Stage + Value + Prob */}
              <div className="form-row-3">
                <div className="form-field">
                  <label>Etapa</label>
                  <select className="form-select" value={form.stage} onChange={f('stage')}>
                    {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label>Valor (€)</label>
                  <input className="form-input" type="number" min="0" value={form.value} onChange={f('value')} placeholder="0" />
                </div>
                <div className="form-field">
                  <label>Probabilitat (%)</label>
                  <input className="form-input" type="number" min="0" max="100" value={form.probability} onChange={f('probability')} />
                </div>
              </div>

              {/* Services */}
              <div className="form-field">
                <label>Serveis</label>
                <input className="form-input" value={form.services} onChange={f('services')} placeholder="Ex: Social Media + Content Production" />
              </div>

              {/* Close date + Responsible */}
              <div className="form-row-2">
                <div className="form-field">
                  <label>Data de tancament</label>
                  <input className="form-input" type="date" value={form.close_date} onChange={f('close_date')} />
                </div>
                <div className="form-field">
                  <label>Responsable</label>
                  <select className="form-select" value={form.responsible_id} onChange={f('responsible_id')}>
                    <option value="">Sense assignar</option>
                    {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                  </select>
                </div>
              </div>

              {/* Next step + date */}
              <div className="form-row-2">
                <div className="form-field">
                  <label>Next step</label>
                  <select className="form-select" value={form.next_step} onChange={f('next_step')}>
                    {NEXT_STEP_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label>Data next step</label>
                  <input className="form-input" type="date" value={form.next_step_date} onChange={f('next_step_date')} />
                </div>
              </div>

              {/* Lead source + Lost reason (if applicable) */}
              <div className="form-row-2">
                <div className="form-field">
                  <label>Origen del lead</label>
                  <select className="form-select" value={form.lead_source} onChange={f('lead_source')}>
                    {LEAD_SOURCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                {form.stage === 'tancat_perdut' && (
                  <div className="form-field">
                    <label>Motiu de pèrdua *</label>
                    <select className="form-select" value={form.lost_reason} onChange={f('lost_reason')} style={{ borderColor: !form.lost_reason ? '#F59E0B' : undefined }}>
                      {LOST_REASON_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* Internal analysis */}
              <div className="analysis-section">
                <div className="analysis-header">
                  <div className="analysis-title">Anàlisi interna</div>
                  {(() => {
                    const answered = Object.keys(analysisAnswers).length
                    const score = calcAnalysisScore(analysisAnswers)
                    const result = analysisResult(score, answered)
                    return result ? (
                      <div className="analysis-result" style={{ background: result.bg, color: result.color }}>
                        {result.label} · {score}/15
                      </div>
                    ) : answered > 0 ? (
                      <div className="analysis-progress">{answered}/5 preguntes</div>
                    ) : null
                  })()}
                </div>
                {ANALYSIS_QUESTIONS.map((q, qi) => (
                  <div key={q.key} className="analysis-q">
                    <div className="analysis-q-label"><span className="analysis-q-num">{qi + 1}</span>{q.question}</div>
                    <div className="analysis-options">
                      {q.options.map((opt, oi) => {
                        const selected = analysisAnswers[q.key] === oi
                        return (
                          <button
                            key={oi}
                            type="button"
                            className={`analysis-opt${selected ? ' selected' : ''}`}
                            onClick={() => setAnalysisAnswers(prev => ({
                              ...prev,
                              [q.key]: prev[q.key] === oi ? -1 : oi,
                            }))}
                          >
                            <span className="opt-dot" />
                            {opt.label}
                            <span className="opt-score">{opt.score}pt</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
                <div className="form-field" style={{ marginTop: 4 }}>
                  <label>Notes addicionals</label>
                  <input className="form-input" value={form.score_notes} onChange={f('score_notes')}
                    placeholder="Ex: Alt potencial, bon timing..." />
                </div>
                <div className="form-field">
                  <label>Descripció / context</label>
                  <textarea className="form-textarea" rows={2} value={form.description} onChange={f('description')}
                    placeholder="Context de l'oportunitat, necessitats, competidors..." />
                </div>
              </div>
            </div>
            {saveErr && <div className="save-error">{saveErr}</div>}
            <div className="modal-footer">
              {editOp && !confirmDelete && (
                <button className="btn-danger" onClick={() => setConfirmDelete(true)}>
                  <Trash2 size={13} />
                  Esborrar
                </button>
              )}
              {editOp && confirmDelete && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12.5, color: '#DC2626', fontWeight: 600 }}>Segur?</span>
                  <button
                    onClick={() => handleDelete(editOp.id)}
                    disabled={deleting === editOp.id}
                    style={{ padding: '5px 12px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
                    {deleting === editOp.id ? 'Esborrant...' : 'Sí, esborrar'}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    style={{ padding: '5px 10px', background: '#F5F5F5', border: 'none', borderRadius: 6, fontSize: 12.5, cursor: 'pointer' }}>
                    No
                  </button>
                </div>
              )}
              <div style={{ flex: 1 }} />
              <button className="btn-cancel" onClick={() => { setShowModal(false); setConfirmDelete(false) }}>Cancel·lar</button>
              <button className="btn-confirm" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 size={13} className="spin" /> : null}
                {editOp ? 'Desar canvis' : 'Crear oportunitat'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .crm-page { flex: 1; padding: 24px 28px 40px; display: flex; flex-direction: column; gap: 20px; overflow-y: auto; }

        /* KPIs Row 1 */
        .kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .kpi-card {
          background: white; border: 1px solid #ECECEC; border-radius: 12px; padding: 16px 20px;
          display: flex; flex-direction: column; gap: 4px;
        }
        .kpi-card--accent { border-color: #1B2B4B30; background: #1B2B4B08; }
        .kpi-card--target { cursor: pointer; transition: border-color 0.15s; }
        .kpi-card--target:hover { border-color: #1B2B4B60; }
        .kpi-lbl { font-size: 10.5px; font-weight: 600; color: #9A9A9A; text-transform: uppercase; letter-spacing: 0.05em; }
        .kpi-val { font-size: 24px; font-weight: 700; color: #0a0a0a; letter-spacing: -0.02em; line-height: 1.1; }
        .kpi-sub { font-size: 10.5px; color: #C0C0C0; margin-top: 2px; }
        .kpi-target-input {
          font-size: 22px; font-weight: 700; color: #0a0a0a; letter-spacing: -0.02em;
          border: none; border-bottom: 2px solid #1B2B4B; background: transparent;
          outline: none; width: 100%; font-family: inherit; padding: 0;
        }
        .kpi-progress-bar {
          height: 4px; background: #F0F0F0; border-radius: 2px; overflow: hidden; margin-top: 4px;
        }
        .kpi-progress-fill { height: 100%; border-radius: 2px; transition: width 0.5s ease; }

        /* KPIs Row 2 */
        .kpi-row-2 {
          display: flex; align-items: center; gap: 0;
          background: white; border: 1px solid #ECECEC; border-radius: 10px; padding: 12px 20px;
        }
        .kpi2 { display: flex; flex-direction: column; align-items: center; gap: 2px; flex: 1; }
        .kpi2-val { font-size: 16px; font-weight: 700; color: #0a0a0a; letter-spacing: -0.01em; }
        .kpi2-lbl { font-size: 10px; color: #9A9A9A; font-weight: 500; text-align: center; }
        .kpi2-sep { width: 1px; height: 32px; background: #ECECEC; flex-shrink: 0; }

        /* Section headers */
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
        :global(.btn-primary) {
          display: flex; align-items: center; gap: 6px;
          height: 34px; padding: 0 14px; background: #1B2B4B; color: white;
          border: none; border-radius: 8px; font-size: 13px; font-weight: 600;
          cursor: pointer; text-decoration: none; transition: background 0.15s; white-space: nowrap; font-family: inherit;
        }
        :global(.btn-primary:hover) { background: #4A82C6; }

        /* Pipeline */
        .pipeline-wrap {
          display: flex; gap: 12px; overflow-x: auto; padding-bottom: 8px; align-items: flex-start;
          min-height: 400px;
        }
        .pipeline-col {
          flex: 0 0 215px;
          background: white;
          border: 1px solid rgba(0,0,0,0.06);
          border-radius: 18px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03);
          display: flex; flex-direction: column; max-height: calc(100vh - 280px);
          overflow: hidden;
          transition: box-shadow 0.2s ease;
        }
        .pipeline-col:hover {
          box-shadow: 0 6px 20px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04);
        }
        .col-header {
          padding: 14px 16px 10px;
          border-top: 3px solid #9A9A9A;
          border-radius: 17px 17px 0 0;
          background: rgba(255,255,255,0.9);
        }
        .col-title {
          font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
        }
        .col-title:hover { opacity: 0.65; }
        .col-title-input {
          font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
          border: none; border-bottom: 1px solid currentColor; background: transparent;
          outline: none; width: 100%; font-family: inherit; padding: 0;
        }
        .col-meta { font-size: 11px; color: #A0A9BB; margin-top: 3px; font-weight: 500; }
        .col-cards {
          flex: 1; overflow-y: auto; padding: 8px 10px 10px;
          display: flex; flex-direction: column; gap: 8px;
        }
        .col-empty { text-align: center; font-size: 12px; color: #C8D0DC; padding: 24px 0; }

        /* Op cards */
        .op-card {
          background: #FAFCFF;
          border: 1px solid rgba(0,0,0,0.06);
          border-radius: 12px;
          padding: 12px 13px;
          display: flex; flex-direction: column; gap: 6px;
          transition: box-shadow 0.2s ease, border-color 0.2s ease, transform 0.15s ease, opacity 0.15s;
          cursor: grab;
        }
        .op-card:hover {
          box-shadow: 0 4px 14px rgba(0,0,0,0.09);
          border-color: rgba(37,99,235,0.18);
          transform: translateY(-1px);
          background: white;
        }
        .op-card:active { cursor: grabbing; transform: scale(0.98); }
        .op-card.dragging { opacity: 0.35; }
        .col-cards.drag-over { background: rgba(37,99,235,0.04); border-radius: 0 0 16px 16px; }
        .op-card-top { display: flex; align-items: flex-start; gap: 6px; }
        .op-name { flex: 1; font-size: 13px; font-weight: 600; color: #0F1B2D; line-height: 1.3; }
        .op-stale { font-size: 12px; flex-shrink: 0; cursor: default; }
        .op-value { font-size: 14px; font-weight: 700; color: #1B2B4B; }
        .op-desc { font-size: 11px; color: #A0A9BB; line-height: 1.3; }
        .op-date { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #A0A9BB; }
        .op-resp {
          width: 20px; height: 20px; border-radius: 50%;
          background: linear-gradient(135deg, #3B6FD4, #1B2B4B);
          color: white;
          font-size: 8px; font-weight: 700; display: flex; align-items: center; justify-content: center;
        }
        .op-stale-label { font-size: 10px; color: #DC2626; font-weight: 600; }
        .op-next-step {
          font-size: 10.5px; color: #5A70A0; background: rgba(37,99,235,0.07);
          border-radius: 6px; padding: 2px 7px; display: inline-block; font-weight: 500;
        }
        .op-score { display: flex; align-items: center; gap: 2px; }
        .op-score-note { font-size: 10px; color: #A0A9BB; margin-left: 4px; }
        .op-prob-bar { height: 4px; border-radius: 4px; background: rgba(0,0,0,0.06); overflow: hidden; }
        .op-prob-fill { height: 100%; border-radius: 4px; opacity: 0.85; }
        .op-moves { display: flex; flex-wrap: wrap; gap: 3px; margin-top: 2px; opacity: 0; transition: opacity 0.15s; }
        .op-card:hover .op-moves { opacity: 1; }
        .move-btn {
          font-size: 10px; font-weight: 500; padding: 2px 6px; border-radius: 4px;
          border: none; cursor: pointer; font-family: inherit; transition: opacity 0.15s;
        }
        .move-btn:hover { opacity: 0.75; }

        /* Analysis */
        .analysis-header { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 4px; }
        .analysis-result { font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 20px; }
        .analysis-progress { font-size: 12px; color: #9A9A9A; }
        .analysis-q { display: flex; flex-direction: column; gap: 6px; }
        .analysis-q-label { font-size: 12.5px; font-weight: 600; color: #0a0a0a; display: flex; gap: 8px; align-items: flex-start; }
        .analysis-q-num {
          display: inline-flex; align-items: center; justify-content: center;
          width: 18px; height: 18px; border-radius: 50%; background: #1B2B4B; color: white;
          font-size: 10px; font-weight: 700; flex-shrink: 0; margin-top: 1px;
        }
        .analysis-options { display: flex; flex-direction: column; gap: 4px; padding-left: 26px; }
        .analysis-opt {
          display: flex; align-items: center; gap: 8px;
          padding: 7px 10px; border: 1px solid #E8E8E8; border-radius: 8px;
          background: white; cursor: pointer; font-size: 12.5px; color: #5C5C5C;
          font-family: inherit; text-align: left; transition: all 0.15s;
        }
        .analysis-opt:hover { border-color: #1B2B4B50; color: #0a0a0a; }
        .analysis-opt.selected { border-color: #1B2B4B; background: #1B2B4B0A; color: #1B2B4B; font-weight: 600; }
        .opt-dot {
          width: 12px; height: 12px; border-radius: 50%; border: 2px solid #D0D0D0;
          flex-shrink: 0; transition: all 0.15s;
        }
        .analysis-opt.selected .opt-dot { border-color: #1B2B4B; background: #1B2B4B; }
        .opt-score { margin-left: auto; font-size: 11px; color: #9A9A9A; flex-shrink: 0; font-weight: 500; }

        /* Analytics */
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

        /* Client list */
        .toolbar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .search-wrap {
          display: flex; align-items: center; gap: 8px;
          height: 36px; padding: 0 12px; border: 1px solid #E8E8E8;
          border-radius: 8px; background: white; flex: 1; min-width: 200px; max-width: 320px;
        }
        .search-input { flex: 1; border: none; outline: none; font-size: 13.5px; background: transparent; }
        .search-input::placeholder { color: #C0C0C0; }
        .filters { display: flex; gap: 4px; flex-wrap: wrap; }
        .filter-btn {
          height: 34px; padding: 0 12px; border: 1px solid #E8E8E8;
          border-radius: 7px; font-size: 13px; color: #5C5C5C;
          background: white; cursor: pointer; transition: all 0.15s;
        }
        .filter-btn.active { background: #1B2B4B0F; border-color: #1B2B4B30; color: #1B2B4B; font-weight: 600; }
        .count { font-size: 12.5px; color: #9A9A9A; }

        .crm-pagination {
          display: flex; align-items: center; justify-content: center;
          gap: 8px; padding: 16px 0 4px;
        }
        .crm-pag-btn {
          height: 34px; padding: 0 14px;
          border: 1px solid rgba(0,0,0,0.08); border-radius: 10px;
          background: white; font-size: 12.5px; font-weight: 500; color: #5C6B80;
          cursor: pointer; transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05); font-family: inherit;
        }
        .crm-pag-btn:hover:not(:disabled) {
          background: #F5F8FF; border-color: rgba(37,99,235,0.2); color: #1B2B4B;
        }
        .crm-pag-btn:disabled { opacity: 0.35; cursor: default; }
        .crm-pag-pages { display: flex; gap: 4px; }
        .crm-pag-num {
          width: 34px; height: 34px;
          border: 1px solid rgba(0,0,0,0.08); border-radius: 10px;
          background: white; font-size: 12.5px; font-weight: 500; color: #5C6B80;
          cursor: pointer; transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05); font-family: inherit;
        }
        .crm-pag-num:hover { background: #F5F8FF; border-color: rgba(37,99,235,0.2); color: #1B2B4B; }
        .crm-pag-num--active {
          background: linear-gradient(135deg, #1B2B4B, #2563EB);
          border-color: transparent; color: white; font-weight: 700;
          box-shadow: 0 2px 8px rgba(37,99,235,0.3);
        }
        .crm-pag-num--active:hover { background: linear-gradient(135deg, #0F1E33, #1D4ED8); color: white; }
        .table-wrap { overflow-x: auto; border: 1px solid #ECECEC; border-radius: 12px; background: white; }
        .crm-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
        .crm-table thead th {
          padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 600;
          color: #9A9A9A; letter-spacing: 0.04em; text-transform: uppercase;
          border-bottom: 1px solid #F0F0F0; white-space: nowrap; background: #FAFAFA;
        }
        .crm-table tbody tr { border-bottom: 1px solid #F8F8F8; transition: background 0.1s; }
        .crm-table tbody tr:last-child { border-bottom: none; }
        .crm-table tbody tr:hover { background: #FAFAFA; }
        .crm-table td { padding: 12px 16px; color: #0a0a0a; vertical-align: middle; }
        .client-cell { display: flex; align-items: center; gap: 10px; }
        .client-avatar {
          width: 32px; height: 32px; border-radius: 8px; background: #F0F0F0;
          font-size: 11px; font-weight: 700; color: #5C5C5C;
          display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0;
        }
        .client-avatar img { width: 100%; height: 100%; object-fit: contain; }
        .client-name { font-weight: 600; font-size: 13.5px; }
        .client-web { display: flex; align-items: center; gap: 3px; font-size: 11px; color: #9A9A9A; text-decoration: none; margin-top: 2px; }
        .type-badge { font-size: 11px; color: #5C5C5C; background: #F0F0F0; padding: 2px 8px; border-radius: 5px; }
        .status-badge { font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 5px; white-space: nowrap; }
        .text-sm { font-size: 13px; color: #5C5C5C; }
        .muted { color: #C0C0C0; }
        .link { color: #1B2B4B; text-decoration: none; font-size: 13px; }
        .projects-count { display: flex; align-items: center; gap: 5px; font-size: 13px; color: #5C5C5C; }
        .view-btn {
          display: inline-block; padding: 5px 12px; border: 1px solid #E8E8E8;
          border-radius: 6px; font-size: 12px; color: #5C5C5C; text-decoration: none; transition: all 0.15s;
        }
        .view-btn:hover { border-color: #1B2B4B; color: #1B2B4B; }
        .empty-row { text-align: center; padding: 60px 24px !important; color: #9A9A9A; }

        /* Modal */
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5);
          display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 24px;
        }
        .modal {
          background: white; border-radius: 16px; width: 100%; max-width: 600px;
          max-height: 90vh; display: flex; flex-direction: column;
          box-shadow: 0 20px 60px rgba(0,0,0,0.2);
        }
        .modal-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 24px; border-bottom: 1px solid #F0F0F0;
        }
        .modal-header h2 { font-size: 16px; font-weight: 700; color: #0a0a0a; }
        .close-btn { border: none; background: none; cursor: pointer; color: #9A9A9A; padding: 4px; border-radius: 6px; }
        .close-btn:hover { background: #F0F0F0; color: #0a0a0a; }
        .modal-body { padding: 20px 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; }
        .form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .form-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
        .form-field { display: flex; flex-direction: column; gap: 5px; }
        .form-field label { font-size: 11px; font-weight: 600; color: #5C5C5C; text-transform: uppercase; letter-spacing: 0.04em; }
        .form-input {
          height: 36px; padding: 0 10px; border: 1px solid #E8E8E8; border-radius: 8px;
          font-size: 13.5px; color: #0a0a0a; font-family: inherit; outline: none; background: white;
        }
        .form-input:focus { border-color: #1B2B4B60; }
        .form-select {
          height: 36px; padding: 0 10px; border: 1px solid #E8E8E8; border-radius: 8px;
          font-size: 13.5px; color: #0a0a0a; font-family: inherit; outline: none; background: white; cursor: pointer;
        }
        .form-textarea {
          padding: 8px 10px; border: 1px solid #E8E8E8; border-radius: 8px;
          font-size: 13.5px; color: #0a0a0a; font-family: inherit; outline: none; resize: vertical; background: white;
        }
        .analysis-section {
          border: 1px solid #E8E8E8; border-radius: 10px; padding: 14px;
          background: #FAFAFA; display: flex; flex-direction: column; gap: 12px;
        }
        .analysis-title { font-size: 11px; font-weight: 700; color: #1B2B4B; text-transform: uppercase; letter-spacing: 0.05em; }
        .star-input { display: flex; gap: 4px; margin-top: 4px; }
        .star-btn { border: none; background: none; cursor: pointer; padding: 2px; border-radius: 4px; transition: transform 0.1s; }
        .star-btn:hover { transform: scale(1.2); }
        .save-error { margin: 0 24px 4px; padding: 8px 12px; background: #FEF2F2; color: #DC2626; border-radius: 8px; font-size: 13px; }
        .modal-footer {
          display: flex; align-items: center; gap: 8px;
          padding: 16px 24px; border-top: 1px solid #F0F0F0;
        }
        .btn-cancel, .btn-secondary {
          display: inline-flex; align-items: center; gap: 6px; text-decoration: none;
          height: 36px; padding: 0 16px; border: 1px solid #E8E8E8; border-radius: 8px;
          font-size: 13.5px; color: #5C5C5C; background: white; cursor: pointer; font-family: inherit;
        }
        .btn-confirm {
          display: flex; align-items: center; gap: 6px;
          height: 36px; padding: 0 18px; background: #1B2B4B; color: white;
          border: none; border-radius: 8px; font-size: 13.5px; font-weight: 600;
          cursor: pointer; font-family: inherit; transition: background 0.15s;
        }
        .btn-confirm:hover { background: #4A82C6; }
        .btn-confirm:disabled { opacity: 0.6; cursor: default; }
        .btn-danger {
          display: flex; align-items: center; gap: 6px;
          height: 36px; padding: 0 14px; background: white; color: #DC2626;
          border: 1px solid #FECACA; border-radius: 8px; font-size: 13px;
          cursor: pointer; font-family: inherit; transition: all 0.15s;
        }
        .btn-danger:hover { background: #FEF2F2; }
        :global(.spin) { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 768px) {
          /* Page layout */
          .crm-page { padding: 12px 14px 32px; gap: 14px; }

          /* KPI Row 1 — 2 columns */
          .kpi-row { grid-template-columns: 1fr 1fr; gap: 8px; }
          .kpi-card { padding: 12px 14px; }
          .kpi-val { font-size: 20px; }
          .kpi-lbl { font-size: 9.5px; }

          /* KPI Row 2 — 2x2 grid */
          .kpi-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0; padding: 0; }
          .kpi2 { padding: 12px 8px; }
          .kpi2-sep { display: none; }
          .kpi2:nth-child(1) { border-bottom: 1px solid #ECECEC; border-right: 1px solid #ECECEC; }
          .kpi2:nth-child(3) { border-bottom: 1px solid #ECECEC; border-right: 1px solid #ECECEC; }
          .kpi2:nth-child(5) { border-right: 1px solid #ECECEC; }
          .kpi2-val { font-size: 15px; }

          /* Section headers */
          .section-header { padding: 20px 0 10px 0; }
          .section-title { font-size: 15px; }

          /* Pipeline — horizontal scroll with smaller cards */
          .pipeline-wrap { gap: 8px; padding-bottom: 12px; min-height: 300px; }
          .pipeline-col { flex: 0 0 180px; max-height: calc(100vh - 220px); }

          /* Clients — replace table with cards */
          .table-wrap { border: none; background: transparent; border-radius: 0; }
          .crm-table thead { display: none; }
          .crm-table, .crm-table tbody { display: block; }
          .crm-table tbody tr {
            display: flex; flex-direction: column; background: white;
            border: 1px solid #ECECEC; border-radius: 12px; margin-bottom: 8px;
            padding: 12px 14px; gap: 8px; border-bottom: 1px solid #ECECEC !important;
          }
          .crm-table td { padding: 0; border: none; }
          .crm-table td:nth-child(1) { order: 1; }
          .crm-table td:nth-child(2) { order: 3; }
          .crm-table td:nth-child(3) { order: 2; }
          .crm-table td:nth-child(4) { display: none; }
          .crm-table td:nth-child(5) { display: none; }
          .crm-table td:nth-child(6) { display: none; }
          .crm-table td:nth-child(7) { display: none; }
          .crm-table td:nth-child(8) { display: none; }
          .crm-table tr:first-child { margin-top: 0; }
          .toolbar { gap: 8px; }
          .search-wrap { max-width: 100%; }
          .filters { gap: 4px; }
          .filter-btn { height: 30px; padding: 0 10px; font-size: 12px; }

          /* Analytics — single column */
          .analytics-wrap { grid-template-columns: 1fr; }
          .chart-wide { grid-column: auto; }

          /* Modal — full screen on mobile */
          .modal-overlay { padding: 0; align-items: flex-end; }
          .modal {
            border-radius: 20px 20px 0 0; max-width: 100%; max-height: 92vh;
            border-bottom-left-radius: 0; border-bottom-right-radius: 0;
          }
          .form-row-2, .form-row-3 { grid-template-columns: 1fr; }
          .modal-footer { flex-wrap: wrap; }
          .modal-footer .btn-cancel, .modal-footer .btn-secondary { display: none; }
        }
      `}</style>
    </div>
    {showNewClient && (
      <NewClientModal
        profiles={profiles}
        onClose={() => setShowNewClient(false)}
        onCreated={(newClient) => {
          setClientsList(prev => [newClient, ...prev])
          setShowNewClient(false)
        }}
      />
    )}
    {TooltipPopup}
    </>
  )
}
