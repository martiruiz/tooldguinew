'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useJarvisVoice } from '@/hooks/useJarvisVoice'
import { JarvisNodeCanvas } from '@/components/agents/JarvisNodeCanvas'
import {
  Brain, Database, Zap, CheckCircle2, BarChart2,
  PenLine, Calendar, Film, Paintbrush, Globe,
  Activity, Scissors, Play, Award, Image, FileText,
  ClipboardList, Target, Scale, Lightbulb, DollarSign,
  TrendingUp, Search, SearchCheck, LineChart, Table2, Radio,
  ShieldCheck, Compass, Megaphone, Palette, Star,
  MousePointer2, MessageCircle, Share2, Trophy,
  type LucideProps,
} from 'lucide-react'

const AGENT_ICONS: Record<string, React.ComponentType<LucideProps>> = {
  '00_orchestrator': Brain,
  '01_memory': Database,
  '02_automation': Zap,
  '03_qa': CheckCircle2,
  '04_reporting': BarChart2,
  '40_contingut': PenLine,
  '41_calendari': Calendar,
  '42_filmmaker': Film,
  '43_disseny': Paintbrush,
  '44_localization': Globe,
  '50_jornada': Trophy,
  '51_cut': Scissors,
  '52_clip': Play,
  '53_brand': Award,
  '54_thumbnail': Image,
  '55_draft': FileText,
  '10_pm': ClipboardList,
  '13_account': Target,
  '14_legal': Scale,
  '15_client_insights': Lightbulb,
  '11_finances': DollarSign,
  '12_comercial': TrendingUp,
  '20_research': Search,
  '21_analytics': LineChart,
  '22_dades': Table2,
  '23_social_listening': Radio,
  '24_fact_check': ShieldCheck,
  '30_estrategia': Compass,
  '31_seo': SearchCheck,
  '32_paid': Megaphone,
  '33_creative_director': Palette,
  '34_influencer': Star,
  '35_web': MousePointer2,
  '60_cm': MessageCircle,
  '61_distribution': Share2,
}

function AgentIcon({ id, size = 14, color }: { id: string; size?: number; color?: string }) {
  const Icon = AGENT_ICONS[id] ?? Activity
  return <Icon size={size} strokeWidth={1.8} color={color} />
}

// ── SVG helpers ───────────────────────────────────────────────────────────────
const NODE_POS: Record<string, [number, number]> = {
  central:    [450, 265],
  produccio:  [450,  80],
  clients:    [162, 195],
  finances:   [738, 195],
  vendes:     [245, 445],
  estrategia: [655, 445],
}

// ── Types ─────────────────────────────────────────────────────────────────────
type AgentStatus = 'actiu' | 'aturat' | 'restringit' | 'pendent'
type AgentDef = {
  id: string; code: string; name: string; icon: string
  desc: string; trigger: string; status: AgentStatus; chat?: boolean
}
type Dept = {
  id: string; name: string; emoji: string; dot: string; glowColor: string
  agents: AgentDef[]; runsToday?: number; lastActivity?: string
}
type PanelTab = 'chat' | 'activitat' | 'edita'

// ── Static data ───────────────────────────────────────────────────────────────
const DEPTS: Dept[] = [
  {
    id: 'central', name: 'Sistema', emoji: '⬡', dot: '#2563EB', glowColor: '#3B82F6',
    agents: [
      { id: '00_orchestrator', code: '00', name: 'Orchestrator', icon: '🧠', status: 'actiu', chat: true, desc: 'Cervell del sistema. Rep tasques en llengua natural, executa 6 passos obligatoris i retorna un resultat revisat i accionable.', trigger: 'Totes les peticions en llengua natural. Punt d\'entrada únic del sistema.' },
      { id: '01_memory', code: '01', name: 'Memory', icon: '🗄️', status: 'actiu', chat: true, desc: 'Gestiona la memòria persistent del OS: clients, historial, decisions i contextos.', trigger: 'Qualsevol agent necessita recuperar o actualitzar context persistent.' },
      { id: '02_automation', code: '02', name: 'Automation', icon: '⚙️', status: 'actiu', chat: true, desc: 'Detecta processos repetitius, dissenya automatitzacions i connecta APIs.', trigger: 'S\'identifica un procés repetitiu o cal un workflow automàtic nou.' },
      { id: '03_qa', code: '03', name: 'QA', icon: '✅', status: 'actiu', chat: true, desc: 'Control de qualitat transversal. Valida CONTENT, VIDEO, DATA, SEO, PUBLISHING. Pot bloquejar el flux.', trigger: 'Obligatòriament, sempre, abans de lliurar o publicar qualsevol asset.' },
      { id: '04_reporting', code: '04', name: 'Reporting', icon: '📊', status: 'actiu', chat: true, desc: 'Business Intelligence transversal. Produeix informes per a client i equip.', trigger: 'Cal un informe de resultats, report mensual o executive summary.' },
    ],
  },
  {
    id: 'produccio', name: 'Producció', emoji: '✦', dot: '#059669', glowColor: '#10B981',
    agents: [
      { id: '40_contingut', code: '40', name: 'Contingut', icon: '✍️', status: 'actiu', chat: true, desc: 'Genera copies, captions i adaptacions per client i plataforma. Sempre aplica TOV i guidelines del client.', trigger: 'Cal copy, captions o contingut escrit per a RRSS, email o web.' },
      { id: '41_calendari', code: '41', name: 'Calendari', icon: '📅', status: 'actiu', chat: true, desc: 'Planifica el calendari editorial mensual per client, alineant dates esportives, formats i freqüència.', trigger: 'Cal planificar el calendari editorial d\'un client o mes.' },
      { id: '42_filmmaker', code: '42', name: 'Filmmaker', icon: '🎬', status: 'actiu', chat: true, desc: 'Dissenya plans de rodatge, guions visuals i briefings de producció de vídeo.', trigger: 'Cal un pla de rodatge, guió visual o briefing de producció audiovisual.' },
      { id: '43_disseny', code: '43', name: 'Disseny', icon: '🖌️', status: 'actiu', chat: true, desc: 'Especifica disseny gràfic per a peces de RRSS, stories, carrusels i material de marca.', trigger: 'Cal un briefing de disseny gràfic, especificació visual o guia d\'estil.' },
      { id: '44_localization', code: '44', name: 'Localization', icon: '🌍', status: 'actiu', chat: true, desc: 'Adapta i tradueix continguts (CA/ES/EN) mantenint coherència de marca i TOV.', trigger: 'Cal adaptar o traduir contingut a un altre idioma.' },
      { id: '50_jornada', code: '50', name: 'Jornada', icon: '⚽', status: 'actiu', chat: true, desc: 'Gestiona el pipeline de producció de jornada ASOBAL: planifica, coordina i executa el cicle complet.', trigger: 'Inici del cicle de jornada ASOBAL (dia de partit o preparació prèvia).' },
      { id: '51_cut', code: '51', name: 'Cut', icon: '✂️', status: 'actiu', chat: true, desc: 'Especifica el tall de vídeo de partits ASOBAL: moments clau, estructura i punts d\'entrada/sortida.', trigger: 'Cal especificar el muntatge de vídeo d\'un partit o jornada ASOBAL.' },
      { id: '52_clip', code: '52', name: 'Clip', icon: '🎞️', status: 'actiu', chat: true, desc: 'Gestiona la producció de clips i highlights per a plataformes (Reels, YouTube Shorts, TikTok).', trigger: 'Cal crear clips, highlights o contingut curt de vídeo ASOBAL.' },
      { id: '53_brand', code: '53', name: 'Brand', icon: '🏆', status: 'actiu', chat: true, desc: 'Gestiona la identitat visual ASOBAL: logos d\'equips, plantilles gràfiques i coherència de marca.', trigger: 'Cal aplicar la identitat visual ASOBAL o adaptar materials de marca.' },
      { id: '54_thumbnail', code: '54', name: 'Thumbnail', icon: '🖼️', status: 'actiu', chat: true, desc: 'Genera especificacions de thumbnails i packaging visual per a YouTube i VOD. Maximitza el CTR.', trigger: 'Cal crear thumbnails o packaging visual per a vídeos ASOBAL.' },
      { id: '55_draft', code: '55', name: 'Draft', icon: '📝', status: 'actiu', chat: true, desc: 'Prepara esborranys de posts, captions i descripcions per al pipeline ASOBAL.', trigger: 'Cal preparar els textos i copies de les publicacions de jornada ASOBAL.' },
    ],
  },
  {
    id: 'clients', name: 'Operacions', emoji: '◈', dot: '#0284C7', glowColor: '#0EA5E9',
    agents: [
      { id: '10_pm', code: '10', name: 'Project Mgr', icon: '📋', status: 'actiu', chat: true, desc: 'Converteix briefs en tasques estructurades, assigna responsables, controla deadlines i detecta bloquejos.', trigger: 'La tasca implica un projecte, deadline o assignació de responsable.' },
      { id: '13_account', code: '13', name: 'Account', icon: '🎯', status: 'actiu', chat: true, desc: 'Client Operating System. Memòria viva de cada compte: objectius, historial, TOV, contracte, feedback.', trigger: 'Cal context d\'un client, preparació de reunió o seguiment de compte.' },
      { id: '14_legal', code: '14', name: 'Legal', icon: '⚖️', status: 'actiu', chat: true, desc: 'Gestiona drets d\'imatge, música, contractes, propietat intel·lectual i compliance de plataformes.', trigger: 'Contingut amb música, imatges de tercers, contractes o riscos legals.' },
      { id: '15_client_insights', code: '15', name: 'Client Insights', icon: '💡', status: 'actiu', chat: true, desc: 'Captura i estructura la veu del client, satisfacció, feedback i intel·ligència de compte.', trigger: 'Recollida de feedback, anàlisi de satisfacció o detecció de patrons.' },
    ],
  },
  {
    id: 'finances', name: 'Finances', emoji: '◆', dot: '#D97706', glowColor: '#F59E0B',
    agents: [
      { id: '11_finances', code: '11', name: 'Finances', icon: '💰', status: 'restringit', chat: true, desc: 'Controla ingressos, despeses, marge per client i projecte, facturació pendent i previsió. Accés restringit.', trigger: 'Consulta financera — exclusivament per a Martí Ruiz.' },
    ],
  },
  {
    id: 'vendes', name: 'Comercial', emoji: '◇', dot: '#7C3AED', glowColor: '#8B5CF6',
    agents: [
      { id: '12_comercial', code: '12', name: 'Comercial', icon: '🤝', status: 'actiu', chat: true, desc: 'Gestiona oportunitats comercials, proposa propostes i fa seguiment. Mai envia propostes sense aprovació.', trigger: 'Nova oportunitat comercial o seguiment de prospecte.' },
      { id: '20_research', code: '20', name: 'Research', icon: '🔍', status: 'actiu', chat: true, desc: 'Analitza competència i detecta tendències de mercat. Genera insights estratègics per a decisions.', trigger: 'Cal investigar el mercat, competència o tendències del sector.' },
    ],
  },
  {
    id: 'estrategia', name: 'Estratègia', emoji: '◉', dot: '#0891B2', glowColor: '#06B6D4',
    agents: [
      { id: '21_analytics', code: '21', name: 'Analytics', icon: '📈', status: 'actiu', chat: true, desc: 'Anàlisi profunda de dades, patrons i correlacions entre mètriques de RRSS, audiència i contingut.', trigger: 'Cal anàlisi de tendències, comparatives de rendiment o correlació de dades.' },
      { id: '22_dades', code: '22', name: 'Dades', icon: '🗃️', status: 'actiu', chat: true, desc: 'Estructurador de dades esportives. Converteix resultats i estadístiques en entitats verificables.', trigger: 'Cal estructurar dades esportives: gols, marcadors, estadístiques de jugadors.' },
      { id: '23_social_listening', code: '23', name: 'Social Listen.', icon: '👂', status: 'actiu', chat: true, desc: 'Monitoritza converses, tendències i signals per a clients i competència. Alerta de crisi.', trigger: 'Cal monitoritzar mencions, tendències o alertes de crisi a les RRSS.' },
      { id: '24_fact_check', code: '24', name: 'Fact Check', icon: '🔎', status: 'actiu', chat: true, desc: 'Verifica dades esportives contra fonts primàries (SofaScore, fonts oficials). Bloqueja dades no verificades.', trigger: 'Cap dada esportiva crítica pot ser marcada VERIFIED sense passar per aquí.' },
      { id: '30_estrategia', code: '30', name: 'Estratègia', icon: '🎯', status: 'actiu', chat: true, desc: 'Defineix l\'estratègia trimestral, pilars de contingut i TOV. No canvia TOV sense aprovació de Martí.', trigger: 'Cal estratègia trimestral, planificació de pilars o revisió de TOV.' },
      { id: '31_seo', code: '31', name: 'SEO', icon: '🔎', status: 'actiu', chat: true, desc: 'Genera contingut optimitzat per cercadors, analitza keywords i optimitza arquitectura de contingut.', trigger: 'Cal contingut SEO, anàlisi de keywords o optimització per cercadors.' },
      { id: '32_paid', code: '32', name: 'Paid Media', icon: '📣', status: 'actiu', chat: true, desc: 'Planifica i optimitza campanyes Meta/Google. No modifica campanyes directament: genera briefs.', trigger: 'Cal gestionar campanyes de pagament, optimitzar ROAS o planificar inversió.' },
      { id: '33_creative_director', code: '33', name: 'Creative Dir.', icon: '🎨', status: 'actiu', chat: true, desc: 'Defineix la direcció creativa de campanyes, identitat visual i coherència de marca.', trigger: 'Cal un briefing creatiu, revisió de coherència de marca o campanya.' },
      { id: '34_influencer', code: '34', name: 'Influencer', icon: '🌟', status: 'actiu', chat: true, desc: 'Gestiona relacions amb creadors, esportistes i influencers. Genera briefs i fa seguiment.', trigger: 'Cal activació amb creadors, cerca d\'influencers o gestió de col·laboració.' },
      { id: '35_web', code: '35', name: 'Web & CRO', icon: '💻', status: 'actiu', chat: true, desc: 'Dissenya i optimitza pàgines web, landings i fluxos de conversió. Genera copywriting per a web.', trigger: 'Cal una landing page, copy web, auditoria CRO o millora de conversió.' },
      { id: '60_cm', code: '60', name: 'Community Mgr', icon: '💬', status: 'actiu', chat: true, desc: 'Prepara respostes a comentaris i DMs seguint la veu de cada client. No publica mai directament.', trigger: 'Hi ha comentaris o DMs a gestionar. Genera esborranys per aprovació.' },
      { id: '61_distribution', code: '61', name: 'Distribution', icon: '📡', status: 'actiu', chat: true, desc: 'Executa la publicació multicanal via Metricool. Gestiona calendaris i fa pre-flight checks.', trigger: 'Cal programar o publicar contingut aprovat (QA:APPROVED obligatori).' },
      { id: '70_linkedin', code: '70', name: 'LinkedIn', icon: '🔵', status: 'actiu', chat: true, desc: 'Super Agent Expert en Estratègia de LinkedIn i Copywriting Digital. Metodologia Luis Garau: TOFU/MOFU/BOFU, 15 claus de redacció, prospecció B2B i tancament per DM. Per a marca personal de Martí Ruiz i pàgines de clients.', trigger: 'Cal un post de LinkedIn, optimitzar un perfil, dissenyar estratègia de contingut o gestionar prospecció B2B.' },
    ],
  },
]

// ── System-wide activity log ───────────────────────────────────────────────────
type LogEntry = { time: string; agentName: string; color: string; msg: string; id: number }

function getActivity(_agentId: string) {
  return { status: 'EN ESPERA', log: ['Agent preparat. Envia una petició per activar-lo.'] }
}

// ── SVG: APEX-style curved spoke connection ────────────────────────────────────
function NetConnection({ deptId, x1, y1, x2, y2, color, active, delay, dur }: {
  deptId: string; x1: number; y1: number; x2: number; y2: number
  color: string; active: boolean; delay: string; dur: string
}) {
  const dx = x2 - x1, dy = y2 - y1
  const len = Math.hypot(dx, dy) || 1
  const bend = len * 0.14
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2
  const qx = mx + (-dy / len) * bend, qy = my + (dx / len) * bend
  const d = `M${x1},${y1} Q${qx},${qy} ${x2},${y2}`
  const pid = `nc_${deptId}`
  return (
    <g opacity={active ? 1 : 0.12}>
      <defs><path id={pid} d={d} /></defs>
      {/* glow layer */}
      <path d={d} fill="none" stroke={color} strokeWidth="6" opacity="0.07"
        style={{ filter: `blur(3px)` }} />
      {/* crisp spoke */}
      <path d={d} fill="none" stroke={color} strokeWidth="0.9"
        strokeDasharray="5 4" opacity={active ? 0.5 : 0.2} />
      {active && <>
        <circle r="3.5" fill={color} opacity="0"
          style={{ filter: `drop-shadow(0 0 4px ${color})` }}>
          <animateMotion dur={dur} begin={delay} repeatCount="indefinite"><mpath href={`#${pid}`} /></animateMotion>
          <animate attributeName="opacity" values="0;0.85;0.85;0" keyTimes="0;0.07;0.93;1" dur={dur} begin={delay} repeatCount="indefinite" />
        </circle>
        <circle r="1.5" fill="white" opacity="0">
          <animateMotion dur={dur} begin={delay} repeatCount="indefinite"><mpath href={`#${pid}`} /></animateMotion>
          <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.07;0.93;1" dur={dur} begin={delay} repeatCount="indefinite" />
        </circle>
      </>}
    </g>
  )
}

// CentralNode removed — replaced by JarvisNodeCanvas golden ring overlay

function TimeDisplay() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' }))
    update()
    const id = setInterval(update, 60_000)
    return () => clearInterval(id)
  }, [])
  return <span style={{ fontSize: 9, color: '#2A3A52', fontFamily: 'monospace' }}>{time}</span>
}

// ── SVG: APEX-style circular dept node ────────────────────────────────────────
function DeptNode({ dept, selected, onClick }: { dept: Dept; selected: boolean; onClick: () => void }) {
  const [cx, cy] = NODE_POS[dept.id]
  const r = 44
  const { dot, glowColor } = dept
  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      {/* outer pulse rings */}
      {[0, 1].map(i => (
        <circle key={i} cx={cx} cy={cy} r={r + 8 + i * 10} fill="none" stroke={glowColor} strokeWidth="0.8">
          <animate attributeName="opacity" dur={`${3 + i * 0.7}s`} begin={`${i * 1.2}s`} repeatCount="indefinite" values="0.4;0" />
          <animate attributeName="r" dur={`${3 + i * 0.7}s`} begin={`${i * 1.2}s`} repeatCount="indefinite" values={`${r};${r + 20 + i * 10}`} />
        </circle>
      ))}

      {/* selection ring */}
      {selected && (
        <circle cx={cx} cy={cy} r={r + 5} fill="none" stroke={dot} strokeWidth="1.8" opacity="0.9" />
      )}

      {/* soft halo */}
      <circle cx={cx} cy={cy} r={r + 16} fill={dot} opacity="0.06"
        style={{ filter: 'blur(8px)' }} />

      {/* main ring */}
      <circle cx={cx} cy={cy} r={r}
        fill={selected ? `${dot}22` : `${dot}12`}
        stroke={dot} strokeWidth={selected ? 1.8 : 1.2}
        opacity={selected ? 1 : 0.65} />

      {/* inner ring */}
      <circle cx={cx} cy={cy} r={r * 0.62}
        fill="none" stroke={dot} strokeWidth="0.6" opacity="0.3"
        strokeDasharray="4 3" />

      {/* emoji icon */}
      <text x={cx} y={cy + 6} textAnchor="middle" fontSize={22} fill={glowColor}
        style={{ userSelect: 'none', filter: `drop-shadow(0 0 6px ${glowColor}80)` }}>
        {dept.emoji}
      </text>

      {/* dept name */}
      <text x={cx} y={cy + r + 16} textAnchor="middle" fontSize={9.5} fontWeight="700"
        fill="#D0DCF0" letterSpacing="0.08em"
        style={{ userSelect: 'none', textTransform: 'uppercase' }}>
        {dept.name.toUpperCase()}
      </text>

      {/* agent status dots */}
      <g>
        {dept.agents.slice(0, 9).map((a, i) => {
          const n = Math.min(dept.agents.length, 9)
          const xoff = (i - (n - 1) / 2) * 7.5
          const isOn = a.status === 'actiu'
          const dotColor = isOn ? '#00C97A' : a.status === 'restringit' ? '#F59E0B' : a.status === 'aturat' ? '#EF4444' : '#2A3650'
          return (
            <g key={a.id}>
              <circle cx={cx + xoff} cy={cy + r + 26} r={2.5} fill={dotColor} />
              {isOn && (
                <circle cx={cx + xoff} cy={cy + r + 26} r={2.5} fill="none" stroke="#00C97A">
                  <animate attributeName="r" values="2.5;5.5;2.5" dur={`${1.9 + i * 0.2}s`} repeatCount="indefinite" begin={`${i * 0.14}s`} />
                  <animate attributeName="opacity" values="0.5;0;0.5" dur={`${1.9 + i * 0.2}s`} repeatCount="indefinite" begin={`${i * 0.14}s`} />
                </circle>
              )}
            </g>
          )
        })}
      </g>
    </g>
  )
}

// ── Left sidebar ──────────────────────────────────────────────────────────────
function Sidebar({
  selectedDept, selectedAgent, agentStatuses,
  onSelectDept, onSelectAgent,
}: {
  selectedDept: string | null; selectedAgent: string | null
  agentStatuses: Record<string, AgentStatus>
  onSelectDept: (id: string) => void; onSelectAgent: (id: string) => void
}) {
  const totalActive = DEPTS.reduce((s, d) => s + d.agents.filter(a => (agentStatuses[a.id] ?? a.status) === 'actiu').length, 0)
  const totalRuns = 0

  return (
    <div style={{ width: 230, background: '#080F20', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 10, flexShrink: 0 }}>
      {/* Header */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 7, padding: '6px 8px' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#E2E8F4', lineHeight: 1, fontFamily: 'monospace' }}>{totalActive}</div>
            <div style={{ fontSize: 8, color: '#3A4A62', fontWeight: 700, letterSpacing: '0.06em', marginTop: 2 }}>ACTIUS</div>
          </div>
          <div style={{ flex: 1, background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.18)', borderRadius: 7, padding: '6px 8px' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#E2E8F4', lineHeight: 1, fontFamily: 'monospace' }}>{totalRuns}</div>
            <div style={{ fontSize: 8, color: '#3A4A62', fontWeight: 700, letterSpacing: '0.06em', marginTop: 2 }}>RUNS AVUI</div>
          </div>
        </div>
      </div>

      {/* Dept + agent list */}
      <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none' }}>
        {DEPTS.map(dept => {
          const isExpanded = selectedDept === dept.id
          return (
            <div key={dept.id}>
              {/* Dept row */}
              <button
                onClick={() => onSelectDept(dept.id)}
                style={{
                  width: '100%', background: isExpanded ? `${dept.dot}12` : 'none',
                  border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)',
                  padding: '9px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9,
                  fontFamily: 'inherit',
                }}
              >
                <span style={{ fontSize: 13 }}>{dept.emoji}</span>
                <span style={{ flex: 1, fontSize: 10, fontWeight: 800, color: isExpanded ? dept.dot : '#5A6A85', letterSpacing: '0.07em', textTransform: 'uppercase', textAlign: 'left' }}>{dept.name}</span>
                <span style={{ fontSize: 9, fontFamily: 'monospace', color: isExpanded ? dept.dot : '#3A4A62', fontWeight: 700 }}>{dept.agents.length}</span>
                <span style={{ fontSize: 8, color: isExpanded ? dept.dot : '#2A3A52', transition: 'transform .15s', transform: isExpanded ? 'rotate(90deg)' : 'none' }}>▶</span>
              </button>

              {/* Agent list */}
              {isExpanded && (
                <div style={{ background: 'rgba(0,0,0,0.15)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  {dept.agents.map(a => {
                    const st = agentStatuses[a.id] ?? a.status
                    const sc = st === 'actiu' ? '#00C97A' : st === 'restringit' ? '#F59E0B' : st === 'aturat' ? '#EF4444' : '#3D4E6A'
                    const isSel = selectedAgent === a.id
                    return (
                      <button
                        key={a.id}
                        onClick={() => onSelectAgent(a.id)}
                        style={{
                          width: '100%', background: isSel ? `${dept.dot}18` : 'none',
                          border: 'none', borderLeft: `2px solid ${isSel ? dept.dot : 'transparent'}`,
                          padding: '7px 14px 7px 18px', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit',
                        }}
                      >
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: sc, flexShrink: 0 }} />
                        <AgentIcon id={a.id} size={12} color="#6A7A95" />
                        <span style={{ flex: 1, fontSize: 11, fontWeight: isSel ? 700 : 500, color: isSel ? '#E2E8F4' : '#6A7A95', textAlign: 'left' }}>{a.name}</span>
                        <span style={{ fontSize: 8, color: '#2A3A52', fontFamily: 'monospace' }}>{a.code}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981' }} />
        <span style={{ fontSize: 9, color: '#3A4A62', fontWeight: 700, letterSpacing: '0.06em', fontFamily: 'monospace' }}>SISTEMA OPERATIU</span>
        <span style={{ marginLeft: 'auto', fontSize: 8, color: '#2A3A52', fontFamily: 'monospace' }}>35 AGT</span>
      </div>
    </div>
  )
}

// ── Right panel: Agent detail ─────────────────────────────────────────────────
function AgentPanel({
  agent, dept, agentStatuses, onClose, onStatusChange, onLogEntry,
}: {
  agent: AgentDef; dept: Dept
  agentStatuses: Record<string, AgentStatus>
  onClose: () => void
  onStatusChange: (agentId: string, status: AgentStatus) => void
  onLogEntry: (agentName: string, color: string, msg: string) => void
}) {
  const [tab, setTab] = useState<PanelTab>('chat')
  const [chat, setChat] = useState<{ role: 'user' | 'agent'; text: string }[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [editName, setEditName] = useState(agent.name)
  const [editDesc, setEditDesc] = useState(agent.desc)
  const [editTrigger, setEditTrigger] = useState(agent.trigger)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [stopConfirm, setStopConfirm] = useState(false)
  const [savingMsgIdx, setSavingMsgIdx] = useState<number | null>(null)
  const [savedMsgIdxs, setSavedMsgIdxs] = useState<Set<number>>(new Set())

  const saveMessage = async (idx: number, text: string) => {
    setSavingMsgIdx(idx)
    const title = text.slice(0, 60).replace(/\n/g, ' ').trim() + (text.length > 60 ? '…' : '')
    await fetch('/api/agent-documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content: text, agent_id: agent.id, agent_name: agent.name, doc_type: 'contingut' }),
    })
    setSavedMsgIdxs(prev => new Set([...prev, idx]))
    setSavingMsgIdx(null)
  }
  const endRef = useRef<HTMLDivElement>(null)

  const ac = dept.dot
  const currentStatus = agentStatuses[agent.id] ?? agent.status
  const isStopped = currentStatus === 'aturat'
  const isRestricted = currentStatus === 'restringit'

  useEffect(() => {
    setTab('chat'); setChat([]); setHistoryLoaded(false)
    setEditName(agent.name); setEditDesc(agent.desc); setEditTrigger(agent.trigger)
    setStopConfirm(false)
  }, [agent.id])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chat])

  useEffect(() => {
    if (!agent.chat) return
    fetch(`/api/conversations?agentId=${agent.id}`)
      .then(r => r.json())
      .then(d => {
        if (d.messages?.length) setChat(d.messages.map((m: { role: string; content: string }) => ({ role: m.role === 'user' ? 'user' : 'agent', text: m.content })))
        setHistoryLoaded(true)
      })
      .catch(() => setHistoryLoaded(true))
  }, [agent.id])

  const send = async () => {
    if (!input.trim() || loading || isStopped) return
    const msg = input.trim(); setInput('')
    setChat(h => [...h, { role: 'user', text: msg }])
    setLoading(true)
    fetch('/api/conversations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agentId: agent.id, role: 'user', content: msg }) })
    try {
      const res = await fetch('/api/agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agentId: agent.id, message: msg }) })
      const data = await res.json()
      const reply = data.response ?? data.error ?? 'Error de resposta'
      setChat(h => [...h, { role: 'agent', text: reply }])
      fetch('/api/conversations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agentId: agent.id, role: 'assistant', content: reply }) })
      const preview = reply.slice(0, 72).replace(/\n/g, ' ') + (reply.length > 72 ? '…' : '')
      onLogEntry(agent.name, dept.dot, preview)
    } catch {
      setChat(h => [...h, { role: 'agent', text: 'Error de connexió.' }])
    } finally { setLoading(false) }
  }

  const clearHistory = () => {
    if (!confirm('Esborrar tot l\'historial d\'aquesta conversa?')) return
    fetch(`/api/conversations?agentId=${agent.id}`, { method: 'DELETE' }).then(() => setChat([]))
  }

  const saveEdit = async () => {
    setSaveState('saving')
    try {
      await fetch('/api/agent/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agentId: agent.id, name: editName, desc: editDesc, trigger: editTrigger }) })
    } catch {}
    setTimeout(() => setSaveState('saved'), 400)
    setTimeout(() => setSaveState('idle'), 2500)
  }

  const toggleStop = async () => {
    if (!stopConfirm && !isStopped) { setStopConfirm(true); return }
    const next: AgentStatus = isStopped ? 'actiu' : 'aturat'
    onStatusChange(agent.id, next)
    setStopConfirm(false)
    try {
      await fetch('/api/agent/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agentId: agent.id, status: next }) })
    } catch {}
  }

  const statusColor = currentStatus === 'actiu' ? '#00C97A' : currentStatus === 'restringit' ? '#F59E0B' : currentStatus === 'aturat' ? '#EF4444' : '#3D4E6A'
  const statusLabel = currentStatus === 'actiu' ? 'ONLINE' : currentStatus === 'restringit' ? 'RESTRICTED' : currentStatus === 'aturat' ? 'ATURAT' : 'PENDING'
  const activity = getActivity(agent.id)

  const TAB = (t: PanelTab) => ({
    flex: 1, padding: '7px 0', fontSize: 9, fontWeight: 800 as const,
    letterSpacing: '0.09em', textTransform: 'uppercase' as const,
    background: 'none', border: 'none', cursor: 'pointer',
    color: tab === t ? ac : '#3A4A62',
    borderBottom: `2px solid ${tab === t ? ac : 'transparent'}`,
    transition: 'all .15s',
  })

  return (
    <div style={{ width: 360, background: '#0D1525', borderLeft: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'panelIn .22s ease', flexShrink: 0 }}>
      <style>{`
        @keyframes panelIn{from{transform:translateX(12px);opacity:0}to{transform:translateX(0);opacity:1}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes actFadeIn{from{opacity:0;transform:translateY(-3px)}to{opacity:1;transform:translateY(0)}}
        textarea:focus,input:focus{outline:none}
        textarea{resize:vertical}
      `}</style>

      {/* Header */}
      <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0A1020', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: `${ac}20`, border: `1.5px solid ${ac}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><AgentIcon id={agent.id} size={18} color={ac} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#E2E8F4', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{agent.name}</div>
            <div style={{ fontSize: 9, color: '#3A4A62', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}>{dept.name} · {agent.code}</div>
          </div>
          <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
            {tab === 'chat' && chat.length > 0 && (
              <button onClick={clearHistory} title="Esborrar historial" style={{ background: 'none', border: '1px solid transparent', borderRadius: 6, cursor: 'pointer', color: '#3A4A62', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, transition: 'all .12s' }}>🗑</button>
            )}
            <button onClick={onClose} style={{ background: 'none', border: '1px solid transparent', borderRadius: 6, cursor: 'pointer', color: '#4B5A72', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, transition: 'all .12s' }}>✕</button>
          </div>
        </div>

        {/* Status row + stop/start */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 20, fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', background: `${statusColor}18`, border: `1px solid ${statusColor}35`, color: statusColor }}>
            <span style={{ width: 4.5, height: 4.5, borderRadius: '50%', background: statusColor, animation: currentStatus === 'actiu' ? 'blink 2s infinite' : 'none' }} />
            {statusLabel}
          </span>
          {!isRestricted && (
            stopConfirm ? (
              <div style={{ display: 'flex', gap: 4, animation: 'actFadeIn .15s ease' }}>
                <button onClick={toggleStop} style={{ fontSize: 9, fontWeight: 800, padding: '3px 9px', borderRadius: 20, border: '1px solid rgba(239,68,68,0.5)', background: 'rgba(239,68,68,0.15)', color: '#EF4444', cursor: 'pointer' }}>Confirma atur</button>
                <button onClick={() => setStopConfirm(false)} style={{ fontSize: 9, fontWeight: 700, padding: '3px 9px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)', background: 'none', color: '#4A5A72', cursor: 'pointer' }}>Cancel·la</button>
              </div>
            ) : (
              <button onClick={toggleStop} style={{ fontSize: 9, fontWeight: 700, padding: '3px 9px', borderRadius: 20, border: `1px solid ${isStopped ? 'rgba(0,201,122,0.35)' : 'rgba(255,255,255,0.1)'}`, background: isStopped ? 'rgba(0,201,122,0.1)' : 'none', color: isStopped ? '#00C97A' : '#4A5A72', cursor: 'pointer', transition: 'all .15s' }}>
                {isStopped ? '▶ Reprèn' : '◼ Atura'}
              </button>
            )
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0A1020', flexShrink: 0 }}>
        <button style={TAB('chat')} onClick={() => setTab('chat')}>Xat</button>
        <button style={TAB('activitat')} onClick={() => setTab('activitat')}>Activitat</button>
        <button style={TAB('edita')} onClick={() => setTab('edita')}>Edita</button>
      </div>

      {/* ── CHAT ─────────────────────────────────────────────────── */}
      {tab === 'chat' && (
        <>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
            <p style={{ margin: 0, fontSize: 12, color: '#7A8BA8', lineHeight: 1.65 }}>{agent.desc}</p>
          </div>
          <div style={{ padding: '7px 16px 8px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
            <div style={{ fontSize: 8, fontWeight: 700, color: '#2A3A52', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>Quan s'activa</div>
            <p style={{ margin: 0, fontSize: 11, color: '#4A5A72', lineHeight: 1.55 }}>{agent.trigger}</p>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 7, scrollbarWidth: 'none' }}>
            {!historyLoaded && <div style={{ textAlign: 'center', color: '#3A4A62', fontSize: 11, padding: '16px' }}>Carregant historial...</div>}
            {historyLoaded && chat.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px 14px' }}>
                <div style={{ marginBottom: 8, opacity: 0.4 }}><AgentIcon id={agent.id} size={28} color={ac} /></div>
                <div style={{ fontSize: 12, color: '#3A4A62', lineHeight: 1.7 }}>
                  {isStopped ? <><span style={{ color: '#EF4444' }}>Agent aturat.</span><br />Reprèn l'agent per poder xatejar.</> : <>Escriu en llengua natural.<br /><span style={{ color: ac, fontSize: 11 }}>"{agent.desc.split('.')[0]}"</span></>}
                </div>
              </div>
            )}
            {chat.map((m, i) => (
              <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '88%', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ padding: '8px 12px', borderRadius: 11, fontSize: 12.5, lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: m.role === 'user' ? ac : '#131E30', color: m.role === 'user' ? 'white' : '#C8D5E8', border: m.role === 'agent' ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>{m.text}</div>
                {m.role === 'agent' && (
                  <button
                    onClick={() => !savedMsgIdxs.has(i) && saveMessage(i, m.text)}
                    disabled={savingMsgIdx === i || savedMsgIdxs.has(i)}
                    style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 4, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.05em', padding: '2px 8px', borderRadius: 5, border: savedMsgIdxs.has(i) ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.08)', background: savedMsgIdxs.has(i) ? 'rgba(16,185,129,0.1)' : 'none', color: savedMsgIdxs.has(i) ? '#10B981' : '#3A4A62', cursor: savedMsgIdxs.has(i) ? 'default' : 'pointer', transition: 'all .15s' }}
                  >
                    {savedMsgIdxs.has(i) ? '✓ DESAT' : savingMsgIdx === i ? '···' : '↓ DESAR'}
                  </button>
                )}
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: 'flex-start', padding: '8px 12px', borderRadius: 11, fontSize: 13, background: '#131E30', border: '1px solid rgba(255,255,255,0.07)', color: ac, display: 'flex', gap: 5 }}>
                {[0, 1, 2].map(i => <span key={i} style={{ animation: `blink 1.2s ${i * 0.2}s infinite` }}>●</span>)}
              </div>
            )}
            <div ref={endRef} />
          </div>
          <div style={{ padding: '8px 12px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                disabled={isStopped}
                placeholder={isStopped ? 'Agent aturat' : `Escriu a ${agent.name}...`}
                style={{ flex: 1, background: '#131E30', border: `1px solid ${input && !isStopped ? ac + '45' : 'rgba(255,255,255,0.09)'}`, borderRadius: 8, padding: '8px 11px', fontSize: 12.5, fontFamily: 'inherit', color: isStopped ? '#3A4A62' : '#E2E8F4', transition: 'border-color .15s' }} />
              <button onClick={send} disabled={loading || !input.trim() || isStopped} style={{ background: ac, border: 'none', borderRadius: 8, padding: '8px 13px', color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 700, opacity: loading || !input.trim() || isStopped ? 0.3 : 1, flexShrink: 0, transition: 'opacity .15s' }}>→</button>
            </div>
          </div>
        </>
      )}

      {/* ── ACTIVITAT ────────────────────────────────────────────── */}
      {tab === 'activitat' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14, scrollbarWidth: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ padding: '5px 12px', borderRadius: 20, fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', background: activity.status === 'IDLE' ? 'rgba(42,58,82,.4)' : `${ac}20`, border: `1px solid ${activity.status === 'IDLE' ? 'rgba(42,58,82,.6)' : ac + '50'}`, color: activity.status === 'IDLE' ? '#3A4A62' : ac, display: 'flex', alignItems: 'center', gap: 6 }}>
              {activity.status !== 'IDLE' && <span style={{ width: 5, height: 5, borderRadius: '50%', background: ac, animation: 'blink 1.5s infinite' }} />}
              {activity.status}
            </div>
            <TimeDisplay />
          </div>

          <div>
            <div style={{ fontSize: 8, fontWeight: 700, color: '#2A3A52', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Registre d'accions</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {activity.log.map((entry, i) => (
                <div key={i} style={{ display: 'flex', gap: 9, padding: '7px 0', borderBottom: i < activity.log.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', animation: `actFadeIn .3s ease ${i * 0.08}s both` }}>
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: i === 0 ? ac : '#2A3A52', flexShrink: 0, marginTop: 5 }} />
                  <span style={{ fontSize: 11.5, color: i === 0 ? '#C8D5E8' : '#5A6A85', lineHeight: 1.5, flex: 1 }}>{entry}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.025)', borderRadius: 9, padding: '11px 13px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 8, fontWeight: 700, color: '#2A3A52', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 9 }}>Estadístiques</div>
            {[['Departament', dept.name], ['Estat', currentStatus]].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 11 }}>
                <span style={{ color: '#3A4A62' }}>{l}</span>
                <span style={{ color: '#8A9BB8', fontFamily: 'monospace', fontWeight: 700 }}>{v}</span>
              </div>
            ))}
          </div>

          <div style={{ background: `${ac}0A`, borderRadius: 9, padding: '11px 13px', border: `1px solid ${ac}18` }}>
            <div style={{ fontSize: 8, fontWeight: 700, color: ac + 'AA', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>S'activa quan</div>
            <p style={{ margin: 0, fontSize: 11.5, color: '#8A9BB8', lineHeight: 1.6 }}>{agent.trigger}</p>
          </div>
        </div>
      )}

      {/* ── EDITA ────────────────────────────────────────────────── */}
      {tab === 'edita' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 13, scrollbarWidth: 'none' }}>
          <div style={{ fontSize: 9, color: '#3A4A62', lineHeight: 1.6, padding: '8px 10px', background: 'rgba(37,99,235,0.06)', borderRadius: 8, border: '1px solid rgba(37,99,235,0.15)' }}>
            Els canvis modifiquen la configuració de l'agent. El prompt sistema s'edita a <span style={{ fontFamily: 'monospace', color: '#4A6A9A' }}>agents-prompts.json</span>.
          </div>

          {([
            { label: 'Nom', value: editName, set: setEditName, rows: 1 },
            { label: 'Descripció', value: editDesc, set: setEditDesc, rows: 3 },
            { label: 'Trigger / Quan s\'activa', value: editTrigger, set: setEditTrigger, rows: 2 },
          ] as const).map(({ label, value, set, rows }) => (
            <div key={label}>
              <div style={{ fontSize: 8, fontWeight: 700, color: '#3A4A62', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>{label}</div>
              {rows === 1 ? (
                <input value={value} onChange={e => set(e.target.value)} style={{ width: '100%', background: '#111D30', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '8px 10px', fontSize: 12.5, fontFamily: 'inherit', color: '#E2E8F4' }} />
              ) : (
                <textarea value={value} onChange={e => set(e.target.value)} rows={rows} style={{ width: '100%', background: '#111D30', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '8px 10px', fontSize: 12, fontFamily: 'inherit', color: '#E2E8F4', lineHeight: 1.55 }} />
              )}
            </div>
          ))}

          <div style={{ fontSize: 8, color: '#2A3A52', fontFamily: 'monospace', padding: '6px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)' }}>
            ID: {agent.id} · Code: {agent.code} · Dept: {dept.id}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={saveEdit} disabled={saveState === 'saving'} style={{ flex: 1, padding: '10px 0', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 800, letterSpacing: '0.06em', background: saveState === 'saved' ? '#059669' : ac, color: 'white', transition: 'background .3s', opacity: saveState === 'saving' ? 0.7 : 1 }}>
              {saveState === 'saving' ? 'Desant...' : saveState === 'saved' ? '✓ Desat' : 'Desa canvis'}
            </button>
            {!isRestricted && (
              <button onClick={toggleStop} style={{ padding: '10px 14px', borderRadius: 9, border: `1px solid ${isStopped ? 'rgba(0,201,122,0.4)' : 'rgba(239,68,68,0.35)'}`, cursor: 'pointer', fontSize: 11, fontWeight: 700, background: isStopped ? 'rgba(0,201,122,0.08)' : 'rgba(239,68,68,0.08)', color: isStopped ? '#00C97A' : '#EF4444', transition: 'all .15s' }}>
                {isStopped ? '▶ Reprèn' : '◼ Atura'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── System header bar ─────────────────────────────────────────────────────────
function SystemHeader({ agentStatuses }: { agentStatuses: Record<string, AgentStatus> }) {
  const total = DEPTS.reduce((s, d) => s + d.agents.length, 0)
  const actius = DEPTS.reduce((s, d) => s + d.agents.filter(a => (agentStatuses[a.id] ?? a.status) === 'actiu').length, 0)
  const restringit = DEPTS.reduce((s, d) => s + d.agents.filter(a => (agentStatuses[a.id] ?? a.status) === 'restringit').length, 0)
  const aturats = DEPTS.reduce((s, d) => s + d.agents.filter(a => (agentStatuses[a.id] ?? a.status) === 'aturat').length, 0)

  const chip = (label: string, val: number, color: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: `${color}12`, border: `1px solid ${color}28` }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 10, fontWeight: 800, color, fontFamily: 'monospace', letterSpacing: '0.04em' }}>{val}</span>
      <span style={{ fontSize: 9, color: color + 'AA', fontWeight: 600, letterSpacing: '0.06em' }}>{label}</span>
    </div>
  )

  return (
    <div style={{ height: 44, borderBottom: '1px solid rgba(255,255,255,0.07)', background: '#06091299', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', padding: '0 18px', gap: 14, flexShrink: 0, zIndex: 20 }}>
      <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', color: '#E2E8F4', fontFamily: 'monospace', marginRight: 4 }}>GUINEW AI OS</span>
      <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />
      {chip('AGENTS', total, '#3B82F6')}
      {chip('ACTIUS', actius, '#10B981')}
      {aturats > 0 && chip('ATURATS', aturats, '#EF4444')}
      {restringit > 0 && chip('RESTRINGIT', restringit, '#F59E0B')}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '3px 12px', borderRadius: 20, border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.08)' }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981', animation: 'online 2s infinite' }} />
        <span style={{ fontSize: 9, fontWeight: 800, color: '#10B981', letterSpacing: '0.1em', fontFamily: 'monospace' }}>SISTEMA ONLINE</span>
      </div>
    </div>
  )
}

// ── Activity log bar ───────────────────────────────────────────────────────────
function ActivityLogBar({ entries }: { entries: LogEntry[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ startY: number; startH: number } | null>(null)
  const [height, setHeight] = useState(160)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = 0
  }, [entries.length])

  const onDragStart = (e: React.MouseEvent) => {
    e.preventDefault()
    dragRef.current = { startY: e.clientY, startH: height }
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return
      const delta = dragRef.current.startY - ev.clientY
      setHeight(Math.max(80, Math.min(520, dragRef.current.startH + delta)))
    }
    const onUp = () => {
      dragRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const scrollBy = (dir: 1 | -1) => {
    scrollRef.current?.scrollBy({ top: dir * 80, behavior: 'smooth' })
  }

  return (
    <div style={{ height, borderTop: '1px solid rgba(255,255,255,0.06)', background: '#060912EE', backdropFilter: 'blur(8px)', flexShrink: 0, display: 'flex', flexDirection: 'column', userSelect: 'none' }}>
      {/* Drag handle */}
      <div
        onMouseDown={onDragStart}
        style={{ height: 8, cursor: 'ns-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
      >
        <div style={{ width: 36, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.1)' }} />
      </div>
      {/* Header */}
      <div style={{ padding: '3px 14px 5px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10B981', animation: 'online 1.8s infinite', flexShrink: 0 }} />
        <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.14em', color: '#3A4A62', fontFamily: 'monospace' }}>ACTIVITAT DEL SISTEMA</span>
        <span style={{ fontSize: 8, color: '#2A3A52', fontFamily: 'monospace' }}>{entries.length} entrades</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 3 }}>
          <button onClick={() => scrollBy(-1)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, width: 20, height: 20, cursor: 'pointer', color: '#4A5A72', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>↑</button>
          <button onClick={() => scrollBy(1)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, width: 20, height: 20, cursor: 'pointer', color: '#4A5A72', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>↓</button>
          <span style={{ fontSize: 8, color: '#1A2A3A', fontFamily: 'monospace', marginLeft: 4, lineHeight: '20px' }}>LIVE</span>
        </div>
      </div>
      {/* Log rows */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '0 14px 8px', scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.07) transparent' }}>
        {entries.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
            <span style={{ fontSize: 9, color: '#1A2A3A', fontFamily: 'monospace', flexShrink: 0, width: 44 }}>—</span>
            <span style={{ fontSize: 11, color: '#2A3A52', fontStyle: 'italic' }}>Sistema en espera — cap agent activat encara</span>
          </div>
        ) : entries.map((e, i) => (
          <div key={e.id} style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '3px 0', borderBottom: i < entries.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none', animation: i === 0 ? 'actFadeIn .3s ease' : 'none' }}>
            <span style={{ fontSize: 9, color: '#2A3A52', fontFamily: 'monospace', flexShrink: 0, width: 44 }}>{e.time}</span>
            <span style={{ fontSize: 10, fontWeight: 800, color: e.color, fontFamily: 'monospace', flexShrink: 0, minWidth: 96 }}>{e.agentName}</span>
            <span style={{ fontSize: 11, color: i === 0 ? '#9AABC8' : '#5A6A85', flex: 1, lineHeight: 1.4 }}>{e.msg}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Capa overview panel (shown when no agent selected) ────────────────────────
function CapaOverviewPanel({ agentStatuses, onSelectAgent }: {
  agentStatuses: Record<string, AgentStatus>
  onSelectAgent: (id: string) => void
}) {
  return (
    <div style={{ width: 360, borderLeft: '1px solid rgba(255,255,255,0.07)', background: '#0A1020', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
      <div style={{ padding: '13px 16px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', color: '#3A4A62', fontFamily: 'monospace' }}>DEPARTAMENTS · AGENTS</div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {DEPTS.map(dept => (
          <div key={dept.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, padding: '0 4px' }}>
              <span style={{ fontSize: 11 }}>{dept.emoji}</span>
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', color: dept.dot, textTransform: 'uppercase' }}>{dept.name}</span>
              <span style={{ fontSize: 8, color: '#2A3A52', fontFamily: 'monospace', marginLeft: 'auto' }}>{dept.agents.length} AGT</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
              {dept.agents.map(a => {
                const st = agentStatuses[a.id] ?? a.status
                const sc = st === 'actiu' ? '#10B981' : st === 'restringit' ? '#F59E0B' : st === 'aturat' ? '#EF4444' : '#3D4E6A'
                return (
                  <button
                    key={a.id}
                    onClick={() => onSelectAgent(a.id)}
                    style={{ background: `${dept.dot}0C`, border: `1px solid ${dept.dot}20`, borderRadius: 8, padding: '7px 9px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', textAlign: 'left', transition: 'all .12s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${dept.dot}1A`; (e.currentTarget as HTMLElement).style.borderColor = `${dept.dot}40` }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `${dept.dot}0C`; (e.currentTarget as HTMLElement).style.borderColor = `${dept.dot}20` }}
                  >
                    <AgentIcon id={a.id} size={13} color={dept.dot} />
                    <span style={{ flex: 1, fontSize: 10, fontWeight: 600, color: '#9AABC8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: sc, flexShrink: 0 }} />
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AgentsPage() {
  const [selectedDept, setSelectedDept] = useState<string | null>(null)
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [agentStatuses, setAgentStatuses] = useState<Record<string, AgentStatus>>({})
  const [logEntries, setLogEntries] = useState<LogEntry[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const logIdRef = useRef(0)
  const jarvis = useJarvisVoice()

  // JARVIS activates on first click on the golden ring (Chrome user gesture requirement)

  const addLogEntry = useCallback((agentName: string, color: string, msg: string) => {
    const now = new Date()
    const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`
    const entry: LogEntry = { time, agentName, color, msg, id: logIdRef.current++ }
    setLogEntries(prev => [entry, ...prev.slice(0, 49)])
  }, [])

  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&display=swap'
    document.head.appendChild(link)
    return () => { try { document.head.removeChild(link) } catch {} }
  }, [])

  const activeDept = DEPTS.find(d => d.id === selectedDept) ?? null
  const activeAgent = activeDept?.agents.find(a => a.id === selectedAgent) ?? null

  const selectDept = useCallback((id: string) => {
    if (selectedDept === id) {
      setSelectedDept(null); setSelectedAgent(null)
    } else {
      setSelectedDept(id)
      setSelectedAgent(DEPTS.find(d => d.id === id)?.agents[0]?.id ?? null)
    }
    setSidebarOpen(false) // close sidebar on mobile after selection
  }, [selectedDept])

  const selectAgent = useCallback((id: string) => {
    const dept = DEPTS.find(d => d.agents.some(a => a.id === id))
    if (dept) setSelectedDept(dept.id)
    setSelectedAgent(id)
  }, [])

  function handleStatusChange(agentId: string, status: AgentStatus) {
    setAgentStatuses(prev => ({ ...prev, [agentId]: status }))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', fontFamily: "'Manrope',system-ui,sans-serif", background: '#060C18' }}>
      <style>{`
        @keyframes online{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes actFadeIn{from{opacity:0;transform:translateY(-3px)}to{opacity:1;transform:translateY(0)}}
        .agents-sidebar{
          width:230px;background:#080F20;border-right:1px solid rgba(255,255,255,0.06);
          display:flex;flex-direction:column;overflow:hidden;z-index:20;flex-shrink:0;
          transition:transform .25s cubic-bezier(.4,0,.2,1);
        }
        @media(max-width:768px){
          .agents-sidebar{
            position:absolute;top:0;left:0;bottom:0;
            transform:translateX(-100%);
          }
          .agents-sidebar.open{transform:translateX(0);}
          .agents-sidebar-overlay{display:block!important;}
        }
        .agents-sidebar-overlay{display:none;position:absolute;inset:0;background:rgba(0,0,0,0.5);z-index:15;}
        .agents-right-panel{display:flex;flex-direction:column;overflow:hidden;}
        @media(max-width:768px){
          .agents-right-panel{position:absolute;inset:0;z-index:10;background:#080F20;}
          .agents-right-panel.hidden{display:none;}
        }
      `}</style>

      {/* Top header bar */}
      <SystemHeader agentStatuses={agentStatuses} />

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {/* Mobile sidebar overlay */}
        <div
          className="agents-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />

        {/* Left sidebar */}
        <div className={`agents-sidebar${sidebarOpen ? ' open' : ''}`}>
          <Sidebar
            selectedDept={selectedDept}
            selectedAgent={selectedAgent}
            agentStatuses={agentStatuses}
            onSelectDept={selectDept}
            onSelectAgent={selectAgent}
          />
        </div>

        {/* Center: graph + activity log */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

          {/* Mobile top bar with sidebar toggle */}
          <div style={{
            display: 'none', padding: '8px 12px', background: '#080F20',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            alignItems: 'center', gap: 10,
          }} className="agents-mobile-topbar">
            <button
              onClick={() => setSidebarOpen(s => !s)}
              style={{
                background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.25)',
                borderRadius: 7, padding: '6px 10px', cursor: 'pointer', color: '#f5a623',
                fontSize: 13, fontWeight: 700, letterSpacing: '0.04em',
              }}>
              ☰ Agents
            </button>
            <span style={{ color: '#4A5A78', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em' }}>
              GUINEW OS
            </span>
          </div>
          <style>{`@media(max-width:768px){.agents-mobile-topbar{display:flex!important;}}`}</style>

          {/* Graph */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 65% 55% at 50% 50%,#0d1a2e 0%,#050a14 100%)' }} />
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle,rgba(245,166,35,0.05) 1px,transparent 1px)', backgroundSize: '36px 36px' }} />
            <svg width="100%" height="100%" viewBox="0 0 900 560" preserveAspectRatio="xMidYMid meet" style={{ display: 'block', position: 'relative', zIndex: 1 }}>
              <defs>
                <radialGradient id="centerGlow" cx="50%" cy="47%" r="38%">
                  <stop offset="0%" stopColor="#f5a623" stopOpacity="0.08" />
                  <stop offset="60%" stopColor="#f5a623" stopOpacity="0.03" />
                  <stop offset="100%" stopColor="#f5a623" stopOpacity="0" />
                </radialGradient>
              </defs>
              <ellipse cx="450" cy="265" rx="200" ry="160" fill="url(#centerGlow)" opacity="0.7" />
              {[320, 370, 420].map((rx, i) => (
                <ellipse key={i} cx="450" cy="270" rx={rx} ry={rx * 0.6}
                  fill="none" stroke="#f5a62308" strokeWidth="0.6"
                  strokeDasharray={i % 2 ? '3 8' : '6 12'} />
              ))}
              {DEPTS.filter(d => d.id !== 'central').map((d, i) => {
                const [cx, cy] = NODE_POS[d.id]
                const [ox, oy] = NODE_POS.central
                return <NetConnection key={d.id} deptId={d.id} x1={ox} y1={oy} x2={cx} y2={cy} color={d.dot} active={true} delay={`${i * 0.65}s`} dur={`${3.4 + i * 0.35}s`} />
              })}
              {DEPTS.filter(d => d.id !== 'central').map(dept => (
                <DeptNode key={dept.id} dept={dept} selected={selectedDept === dept.id} onClick={() => selectDept(dept.id)} />
              ))}
            </svg>
            <JarvisNodeCanvas
              open={jarvis.open}
              state={jarvis.state}
              transcript={jarvis.transcript}
              history={jarvis.history}
              error={jarvis.error}
              getAmplitude={jarvis.getAmplitude}
              onClose={jarvis.closeJarvis}
              onSend={jarvis.send}
            />
          </div>

          {/* Activity log */}
          <ActivityLogBar entries={logEntries} />
        </div>

        {/* Right: agent panel or overview — hidden on mobile when no agent selected */}
        <div className={`agents-right-panel${!activeAgent ? ' hidden' : ''}`}
          style={{ width: activeAgent ? undefined : 280 }}>
          {activeAgent && activeDept ? (
            <AgentPanel
              agent={activeAgent}
              dept={activeDept}
              agentStatuses={agentStatuses}
              onClose={() => { setSelectedAgent(null); setSelectedDept(null) }}
              onStatusChange={handleStatusChange}
              onLogEntry={addLogEntry}
            />
          ) : (
            <CapaOverviewPanel agentStatuses={agentStatuses} onSelectAgent={selectAgent} />
          )}
        </div>
      </div>
    </div>
  )
}
