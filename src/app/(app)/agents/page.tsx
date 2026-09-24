'use client'

import { useState, useEffect, useRef } from 'react'

// ── Node positions in SVG canvas (900×560) ───────────────────────────────────
const NODE_POS: Record<string, [number, number]> = {
  central:    [450, 265],
  produccio:  [450,  80],
  clients:    [162, 195],
  finances:   [738, 195],
  vendes:     [245, 445],
  estrategia: [655, 445],
}

function hexPts(cx: number, cy: number, r: number, flat = false): string {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (i * 60 + (flat ? 0 : 30)) * Math.PI / 180
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`
  }).join(' ')
}

// ── Data types ────────────────────────────────────────────────────────────────
type AgentDef = {
  id: string; code: string; name: string; icon: string
  desc: string; trigger: string; status: 'actiu' | 'restringit' | 'pendent'
  chat?: boolean; accent?: string
}
type Dept = {
  id: string; name: string; emoji: string; dot: string; glowColor: string
  agents: AgentDef[]; fase: 1 | 2
  runsToday?: number; lastActivity?: string
}

const DEPTS: Dept[] = [
  {
    id: 'central', name: 'Sistema', emoji: '⬡',
    dot: '#2563EB', glowColor: '#3B82F6', fase: 1, runsToday: 5, lastActivity: '1m ago',
    agents: [
      { id: '00_orchestrator', code: '00', name: 'Orchestrator', icon: '🧠', status: 'actiu', chat: true,
        desc: 'Cervell del sistema. Rep tasques en llengua natural, executa 6 passos obligatoris i retorna un resultat revisat i accionable.',
        trigger: 'Totes les peticions en llengua natural. Punt d\'entrada únic del sistema.' },
      { id: '01_memory', code: '01', name: 'Memory', icon: '🗄️', status: 'actiu', chat: true,
        desc: 'Gestiona la memòria persistent del OS: clients, historial, decisions i contextos.',
        trigger: 'Qualsevol agent necessita recuperar o actualitzar context persistent.' },
      { id: '02_automation', code: '02', name: 'Automation', icon: '⚙️', status: 'actiu', chat: true,
        desc: 'Detecta processos repetitius, dissenya automatitzacions i connecta APIs. Exemple: pipeline ASOBAL post-partit.',
        trigger: 'S\'identifica un procés repetitiu o cal un workflow automàtic nou.' },
      { id: '03_qa', code: '03', name: 'QA', icon: '✅', status: 'actiu', chat: true,
        desc: 'Control de qualitat transversal. Valida CONTENT, VIDEO, DATA, SEO, PUBLISHING. Pot bloquejar el flux.',
        trigger: 'Obligatòriament, sempre, abans de lliurar o publicar qualsevol asset.' },
      { id: '04_reporting', code: '04', name: 'Reporting', icon: '📊', status: 'actiu', chat: true,
        desc: 'Business Intelligence transversal. Consumeix analytics, finances, insights. Produeix informes per a client i equip.',
        trigger: 'Cal un informe de resultats, report mensual o executive summary.' },
    ],
  },
  {
    id: 'produccio', name: 'Producció', emoji: '✦',
    dot: '#059669', glowColor: '#10B981', fase: 1, runsToday: 12, lastActivity: '30s ago',
    agents: [
      { id: '40_contingut', code: '40', name: 'Contingut', icon: '✍️', status: 'actiu', chat: true,
        desc: 'Genera copies, captions i adaptacions per client i plataforma. Sempre aplica TOV i guidelines del client.',
        trigger: 'Cal copy, captions o contingut escrit per a RRSS, email o web.' },
      { id: '41_calendari', code: '41', name: 'Calendari', icon: '📅', status: 'actiu', chat: true,
        desc: 'Planifica el calendari editorial mensual per client, alineant dates esportives, formats i freqüència.',
        trigger: 'Cal planificar el calendari editorial d\'un client o mes.' },
      { id: '42_filmmaker', code: '42', name: 'Filmmaker', icon: '🎬', status: 'actiu', chat: true,
        desc: 'Dissenya plans de rodatge, guions visuals i briefings de producció de vídeo.',
        trigger: 'Cal un pla de rodatge, guió visual o briefing de producció audiovisual.' },
      { id: '43_disseny', code: '43', name: 'Disseny', icon: '🖌️', status: 'actiu', chat: true,
        desc: 'Especifica disseny gràfic per a peces de RRSS, stories, carrusels i material de marca.',
        trigger: 'Cal un briefing de disseny gràfic, especificació visual o guia d\'estil.' },
      { id: '44_localization', code: '44', name: 'Localization', icon: '🌍', status: 'actiu', chat: true,
        desc: 'Adapta i tradueix continguts (CA/ES/EN) mantenint coherència de marca i TOV.',
        trigger: 'Cal adaptar o traduir contingut a un altre idioma.' },
      { id: '50_jornada', code: '50', name: 'Jornada', icon: '⚽', status: 'actiu', chat: true,
        desc: 'Gestiona el pipeline de producció de jornada ASOBAL: planifica, coordina i executa el cicle complet.',
        trigger: 'Inici del cicle de jornada ASOBAL (dia de partit o preparació prèvia).' },
      { id: '51_cut', code: '51', name: 'Cut', icon: '✂️', status: 'actiu', chat: true,
        desc: 'Especifica el tall de vídeo de partits ASOBAL: moments clau, estructura i punts d\'entrada/sortida.',
        trigger: 'Cal especificar el muntatge de vídeo d\'un partit o jornada ASOBAL.' },
      { id: '52_clip', code: '52', name: 'Clip', icon: '🎞️', status: 'actiu', chat: true,
        desc: 'Gestiona la producció de clips i highlights per a plataformes (Reels, YouTube Shorts, TikTok).',
        trigger: 'Cal crear clips, highlights o contingut curt de vídeo ASOBAL.' },
      { id: '53_brand', code: '53', name: 'Brand', icon: '🏆', status: 'actiu', chat: true,
        desc: 'Gestiona la identitat visual ASOBAL: logos d\'equips, plantilles gràfiques i coherència de marca.',
        trigger: 'Cal aplicar la identitat visual ASOBAL o adaptar materials de marca.' },
      { id: '54_thumbnail', code: '54', name: 'Thumbnail', icon: '🖼️', status: 'actiu', chat: true,
        desc: 'Genera especificacions de thumbnails i packaging visual per a YouTube i VOD. Maximitza el CTR.',
        trigger: 'Cal crear thumbnails o packaging visual per a vídeos ASOBAL.' },
      { id: '55_draft', code: '55', name: 'Draft', icon: '📝', status: 'actiu', chat: true,
        desc: 'Prepara esborranys de posts, captions i descripcions per al pipeline ASOBAL.',
        trigger: 'Cal preparar els textos i copies de les publicacions de jornada ASOBAL.' },
    ],
  },
  {
    id: 'clients', name: 'Operacions', emoji: '◈',
    dot: '#0284C7', glowColor: '#0EA5E9', fase: 1, runsToday: 4, lastActivity: '8m ago',
    agents: [
      { id: '10_pm', code: '10', name: 'Project Mgr', icon: '📋', status: 'actiu', chat: true,
        desc: 'Converteix briefs en tasques estructurades, assigna responsables, controla deadlines i detecta bloquejos.',
        trigger: 'La tasca implica un projecte, deadline o assignació de responsable.' },
      { id: '13_account', code: '13', name: 'Account', icon: '🎯', status: 'actiu', chat: true,
        desc: 'Client Operating System. Memòria viva de cada compte: objectius, historial, TOV, contracte, feedback.',
        trigger: 'Cal context d\'un client, preparació de reunió o seguiment de compte.' },
      { id: '14_legal', code: '14', name: 'Legal', icon: '⚖️', status: 'actiu', chat: true,
        desc: 'Gestiona drets d\'imatge, música, contractes, propietat intel·lectual i compliance de plataformes.',
        trigger: 'Contingut amb música, imatges de tercers, contractes o riscos legals.' },
      { id: '15_client_insights', code: '15', name: 'Client Insights', icon: '💡', status: 'actiu', chat: true,
        desc: 'Captura i estructura la veu del client, satisfacció, feedback i intel·ligència de compte.',
        trigger: 'Recollida de feedback, anàlisi de satisfacció o detecció de patrons.' },
    ],
  },
  {
    id: 'finances', name: 'Finances', emoji: '◆',
    dot: '#D97706', glowColor: '#F59E0B', fase: 1, runsToday: 1, lastActivity: '2h ago',
    agents: [
      { id: '11_finances', code: '11', name: 'Finances', icon: '💰', status: 'restringit', chat: true,
        desc: 'Controla ingressos, despeses, marge per client i projecte, facturació pendent i previsió. Accés restringit.',
        trigger: 'Consulta financera — exclusivament per a Martí Ruiz.' },
    ],
  },
  {
    id: 'vendes', name: 'Comercial', emoji: '◇',
    dot: '#7C3AED', glowColor: '#8B5CF6', fase: 1, runsToday: 2, lastActivity: '45m ago',
    agents: [
      { id: '12_comercial', code: '12', name: 'Comercial', icon: '🤝', status: 'actiu', chat: true,
        desc: 'Gestiona oportunitats comercials, proposa propostes i fa seguiment. Mai envia propostes sense aprovació.',
        trigger: 'Nova oportunitat comercial o seguiment de prospecte.' },
      { id: '20_research', code: '20', name: 'Research', icon: '🔍', status: 'actiu', chat: true,
        desc: 'Analitza competència i detecta tendències de mercat. Genera insights estratègics per a decisions.',
        trigger: 'Cal investigar el mercat, competència o tendències del sector.' },
    ],
  },
  {
    id: 'estrategia', name: 'Estratègia', emoji: '◉',
    dot: '#0891B2', glowColor: '#06B6D4', fase: 1, runsToday: 6, lastActivity: '3m ago',
    agents: [
      { id: '21_analytics', code: '21', name: 'Analytics', icon: '📈', status: 'actiu', chat: true,
        desc: 'Anàlisi profunda de dades, patrons i correlacions entre mètriques de RRSS, audiència i contingut.',
        trigger: 'Cal anàlisi de tendències, comparatives de rendiment o correlació de dades.' },
      { id: '22_dades', code: '22', name: 'Dades', icon: '🗃️', status: 'actiu', chat: true,
        desc: 'Estructurador de dades esportives. Converteix resultats i estadístiques en entitats verificables.',
        trigger: 'Cal estructurar dades esportives: gols, marcadors, estadístiques de jugadors.' },
      { id: '23_social_listening', code: '23', name: 'Social Listen.', icon: '👂', status: 'actiu', chat: true,
        desc: 'Monitoritza converses, tendències i signals per a clients i competència. Alerta de crisi.',
        trigger: 'Cal monitoritzar mencions, tendències o alertes de crisi a les RRSS.' },
      { id: '24_fact_check', code: '24', name: 'Fact Check', icon: '🔎', status: 'actiu', chat: true,
        desc: 'Verifica dades esportives contra fonts primàries (SofaScore, fonts oficials). Bloqueja dades no verificades.',
        trigger: 'Cap dada esportiva crítica pot ser marcada VERIFIED sense passar per aquí.' },
      { id: '30_estrategia', code: '30', name: 'Estratègia', icon: '🎯', status: 'actiu', chat: true,
        desc: 'Defineix l\'estratègia trimestral, pilars de contingut i TOV. No canvia TOV sense aprovació de Martí.',
        trigger: 'Cal estratègia trimestral, planificació de pilars o revisió de TOV.' },
      { id: '31_seo', code: '31', name: 'SEO', icon: '🔎', status: 'actiu', chat: true,
        desc: 'Genera contingut optimitzat per cercadors, analitza keywords i optimitza arquitectura de contingut.',
        trigger: 'Cal contingut SEO, anàlisi de keywords o optimització per cercadors.' },
      { id: '32_paid', code: '32', name: 'Paid Media', icon: '📣', status: 'actiu', chat: true,
        desc: 'Planifica i optimitza campanyes Meta/Google. No modifica campanyes directament: genera briefs.',
        trigger: 'Cal gestionar campanyes de pagament, optimitzar ROAS o planificar inversió.' },
      { id: '33_creative_director', code: '33', name: 'Creative Dir.', icon: '🎨', status: 'actiu', chat: true,
        desc: 'Defineix la direcció creativa de campanyes, identitat visual i coherència de marca.',
        trigger: 'Cal un briefing creatiu, revisió de coherència de marca o campanya.' },
      { id: '34_influencer', code: '34', name: 'Influencer', icon: '🌟', status: 'actiu', chat: true,
        desc: 'Gestiona relacions amb creadors, esportistes i influencers. Genera briefs i fa seguiment.',
        trigger: 'Cal activació amb creadors, cerca d\'influencers o gestió de col·laboració.' },
      { id: '35_web', code: '35', name: 'Web & CRO', icon: '💻', status: 'actiu', chat: true,
        desc: 'Dissenya i optimitza pàgines web, landings i fluxos de conversió. Genera copywriting per a web.',
        trigger: 'Cal una landing page, copy web, auditoria CRO o millora de conversió.' },
      { id: '60_cm', code: '60', name: 'Community Mgr', icon: '💬', status: 'actiu', chat: true,
        desc: 'Prepara respostes a comentaris i DMs seguint la veu de cada client. No publica mai directament.',
        trigger: 'Hi ha comentaris o DMs a gestionar. Genera esborranys per aprovació.' },
      { id: '61_distribution', code: '61', name: 'Distribution', icon: '📡', status: 'actiu', chat: true,
        desc: 'Executa la publicació multicanal via Metricool. Gestiona calendaris i fa pre-flight checks.',
        trigger: 'Cal programar o publicar contingut aprovat (QA:APPROVED obligatori).' },
    ],
  },
]

// Per-agent activity samples
const AGENT_ACTIVITY: Record<string, { status: string; log: string[] }> = {
  '00_orchestrator': { status: 'PROCESSANT', log: ['Tasca rebuda: "post ASOBAL J4"', 'Activant Contingut + QA', 'Context ASOBAL carregat', 'Delegant a 40_contingut', 'Esperant resposta QA'] },
  '01_memory': { status: 'IDLE', log: ['Context BIWPA actualitzat', 'Historial TPE recuperat (12 sessions)', 'Decisió desada: "no publicar diumenges"'] },
  '02_automation': { status: 'ACTIU', log: ['Pipeline J4 ASOBAL executant-se', 'Webhook post-partit activat', 'Metricool programat automàticament', '3 clips processats'] },
  '03_qa': { status: 'REVISANT', log: ['PASS — Post ASOBAL J3 ✓', 'REJECT — Caption massa llarg (>150 chars)', 'PASS_WITH_WARNINGS — Story Nautivela', 'HUMAN_REVIEW → Contingut amb menor'] },
  '04_reporting': { status: 'IDLE', log: ['Report ASOBAL Octubre generat', 'Executive summary enviat a Martí', 'KPIs BIWPA Q3 analitzats'] },
  '40_contingut': { status: 'GENERANT', log: ['Caption post J4 ASOBAL (3 variants)', 'Story announcement Kanbesport', 'Thread LinkedIn SWC generant...'] },
  '41_calendari': { status: 'IDLE', log: ['Calendari BIWPA Novembre → 18 posts', 'Calendari ASOBAL J4-J8 planificat', 'Conflicte detectat: BIWPA vs Elite Fut'] },
  '50_jornada': { status: 'ACTIU', log: ['Pipeline J4 iniciat', '8 partits identificats', 'Clips pendents: 16', 'Jornada anterior tancada ✓'] },
  '54_thumbnail': { status: 'GENERANT', log: ['Spec "J4 Resum Complet" → CTR opt.', 'Thumbnail BCN vs PSG exportat', 'A/B test: títol curt vs llarg'] },
  '21_analytics': { status: 'ANALITZANT', log: ['ASOBAL IG: +12.3% engagement', 'Millor hora: dimarts 20h', 'Reels vs Carrusels: Reels x3.2'] },
  '24_fact_check': { status: 'VERIFICANT', log: ['VERIFIED — PSG 32:29 GRA (J3)', 'CONFLICTING — Gols jugador 7 vs 8', 'VERIFIED — Classificació J3 confirmada'] },
  '61_distribution': { status: 'PROGRAMANT', log: ['Post ASOBAL → Dijous 20:00 IG ✓', 'Story → Divendres 09:00 programada', 'Pre-flight check: 3/3 OK'] },
}

function getAgentActivity(agentId: string) {
  return AGENT_ACTIVITY[agentId] ?? {
    status: 'IDLE',
    log: ['Cap activitat recent registrada.', 'L\'agent s\'activarà quan rebi una petició.'],
  }
}

// ── Network connection ────────────────────────────────────────────────────────
function NetConnection({ deptId, x1, y1, x2, y2, color, active, delay, dur }: {
  deptId: string; x1: number; y1: number; x2: number; y2: number
  color: string; active: boolean; delay: string; dur: string
}) {
  const ocx = 450, ocy = 265
  const cpx1 = x1 + (ocx - x1) * 0.45, cpy1 = y1 + (ocy - y1) * 0.45
  const cpx2 = x2 + (ocx - x2) * 0.45, cpy2 = y2 + (ocy - y2) * 0.45
  const d = `M${x1},${y1} C${cpx1},${cpy1} ${cpx2},${cpy2} ${x2},${y2}`
  const pid = `nc_${deptId}`
  return (
    <g opacity={active ? 1 : 0.15}>
      <defs><path id={pid} d={d} /></defs>
      <path d={d} fill="none" stroke={color} strokeWidth="8" opacity="0.05" />
      <path d={d} fill="none" stroke={color} strokeWidth="1.2" strokeDasharray="6,6" opacity={active ? 0.4 : 0.2} />
      {active && <>
        <circle r="4.5" fill={color} opacity="0">
          <animateMotion dur={dur} begin={delay} repeatCount="indefinite"><mpath href={`#${pid}`} /></animateMotion>
          <animate attributeName="opacity" values="0;0.7;0.7;0" keyTimes="0;0.08;0.92;1" dur={dur} begin={delay} repeatCount="indefinite" />
        </circle>
        <circle r="2" fill="white" opacity="0">
          <animateMotion dur={dur} begin={delay} repeatCount="indefinite"><mpath href={`#${pid}`} /></animateMotion>
          <animate attributeName="opacity" values="0;0.95;0.95;0" keyTimes="0;0.08;0.92;1" dur={dur} begin={delay} repeatCount="indefinite" />
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
  const { dot, glowColor } = dept
  const activeCount = dept.agents.filter(a => a.status === 'actiu').length

  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      {[1, 2].map(i => (
        <polygon key={i} points={hexPts(cx, cy, r + 4)} fill="none" stroke={glowColor} strokeWidth="1">
          <animate attributeName="opacity" dur={`${2.8 + i * 0.6}s`} begin={`${(i - 1) * 1.1}s`} repeatCount="indefinite" values="0.45;0" />
        </polygon>
      ))}
      {selected && <polygon points={hexPts(cx, cy, r + 2)} fill="none" stroke={dot} strokeWidth="2.5" opacity="0.7" />}
      <polygon points={hexPts(cx, cy, r)} fill={`${dot}18`} />
      <polygon points={hexPts(cx, cy, r)} fill="none" stroke={dot} strokeWidth={selected ? 2 : 1.5} opacity={selected ? 1 : 0.6} />
      <polygon points={hexPts(cx, cy, ri)} fill={`${dot}14`} />
      <polygon points={hexPts(cx, cy, ri)} fill="none" stroke={dot} strokeWidth="0.7" opacity="0.35" />
      <circle cx={cx} cy={cy} r={r * 0.35} fill={dot} opacity="0.07" />
      <text x={cx} y={cy + (isCenter ? 5 : 4)} textAnchor="middle" fontSize={isCenter ? 24 : 20} fill={glowColor}
        style={{ userSelect: 'none', filter: `drop-shadow(0 0 6px ${glowColor}90)` }}>{dept.emoji}</text>
      <text x={cx} y={cy + r + 17} textAnchor="middle" fontSize={isCenter ? 11 : 10} fontWeight="700"
        fill="#E2E8F4" letterSpacing="0.06em" style={{ userSelect: 'none', textTransform: 'uppercase' }}>{dept.name.toUpperCase()}</text>
      <g>
        {dept.agents.map((a, i) => {
          const n = Math.min(dept.agents.length, 9)
          const xoff = (Math.min(i, 8) - (n - 1) / 2) * 8
          const isOn = a.status === 'actiu'
          return (
            <g key={a.id}>
              <circle cx={cx + xoff} cy={cy + r + 28} r={2.8} fill={isOn ? '#00C97A' : a.status === 'restringit' ? '#F59E0B' : '#2A3650'} />
              {isOn && (
                <circle cx={cx + xoff} cy={cy + r + 28} r={2.8} fill="none" stroke="#00C97A">
                  <animate attributeName="r" values="2.8;6;2.8" dur={`${1.8 + i * 0.25}s`} repeatCount="indefinite" begin={`${i * 0.15}s`} />
                  <animate attributeName="opacity" values="0.5;0;0.5" dur={`${1.8 + i * 0.25}s`} repeatCount="indefinite" begin={`${i * 0.15}s`} />
                </circle>
              )}
            </g>
          )
        })}
      </g>
      {(dept.runsToday ?? 0) > 0 && (
        <circle cx={cx + r - 5} cy={cy - r + 5} r={5} fill="#00C97A">
          <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
        </circle>
      )}
    </g>
  )
}

// ── Agent panel with tabs ─────────────────────────────────────────────────────
type PanelTab = 'chat' | 'activitat' | 'edita'

function AgentPanel({ agent, dept, onClose }: { agent: AgentDef; dept: Dept; onClose: () => void }) {
  const [tab, setTab] = useState<PanelTab>('chat')
  const [chat, setChat] = useState<{ role: 'user' | 'agent'; text: string }[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [editName, setEditName] = useState(agent.name)
  const [editDesc, setEditDesc] = useState(agent.desc)
  const [editTrigger, setEditTrigger] = useState(agent.trigger)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const endRef = useRef<HTMLDivElement>(null)
  const ac = agent.accent ?? dept.dot

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chat])

  useEffect(() => {
    if (!agent.chat) return
    fetch(`/api/conversations?agentId=${agent.id}`)
      .then(r => r.json())
      .then(d => {
        if (d.messages?.length) {
          setChat(d.messages.map((m: { role: string; content: string }) => ({
            role: m.role === 'user' ? 'user' : 'agent', text: m.content,
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
    fetch('/api/conversations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agentId: agent.id, role: 'user', content: msg }) })
    try {
      const res = await fetch('/api/agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agentId: agent.id, message: msg }) })
      const data = await res.json()
      const reply = data.response ?? data.error ?? 'Error de resposta'
      setChat(h => [...h, { role: 'agent', text: reply }])
      fetch('/api/conversations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agentId: agent.id, role: 'assistant', content: reply }) })
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
      await fetch('/api/agent/config', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: agent.id, name: editName, desc: editDesc, trigger: editTrigger }),
      })
    } catch {}
    setTimeout(() => setSaveState('saved'), 400)
    setTimeout(() => setSaveState('idle'), 2500)
  }

  const statusColor = agent.status === 'actiu' ? '#00C97A' : agent.status === 'restringit' ? '#F59E0B' : '#3D4E6A'
  const statusLabel = agent.status === 'actiu' ? 'ONLINE' : agent.status === 'restringit' ? 'RESTRICTED' : 'PENDING'
  const activity = getAgentActivity(agent.id)

  const TAB_STYLE = (t: PanelTab) => ({
    flex: 1, padding: '7px 0', fontSize: 9, fontWeight: 800 as const,
    letterSpacing: '0.09em', textTransform: 'uppercase' as const,
    background: 'none', border: 'none', cursor: 'pointer',
    color: tab === t ? ac : '#3A4A62',
    borderBottom: `2px solid ${tab === t ? ac : 'transparent'}`,
    transition: 'all .15s',
  })

  return (
    <div style={{ width: 360, background: '#0D1525', borderLeft: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'panelIn .22s ease' }}>
      <style>{`
        @keyframes panelIn{from{transform:translateX(12px);opacity:0}to{transform:translateX(0);opacity:1}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes actFadeIn{from{opacity:0;transform:translateY(-3px)}to{opacity:1;transform:translateY(0)}}
        textarea:focus,input:focus{outline:none}
        textarea{resize:vertical}
      `}</style>

      {/* ── Header */}
      <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0A1020' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, marginBottom: 11 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: `${ac}20`, border: `1.5px solid ${ac}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{agent.icon}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: '#E2E8F4', marginBottom: 2 }}>{agent.name}</div>
            <div style={{ fontSize: 9, color: '#3A4A62', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}>{dept.name} · {agent.code}</div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {tab === 'chat' && chat.length > 0 && <button onClick={clearHistory} title="Esborrar historial" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3A4A62', width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>🗑</button>}
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4B5A72', width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>✕</button>
          </div>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 20, fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', background: `${statusColor}18`, border: `1px solid ${statusColor}35`, color: statusColor }}>
          <span style={{ width: 4.5, height: 4.5, borderRadius: '50%', background: statusColor, animation: agent.status === 'actiu' ? 'blink 2s infinite' : 'none' }} />
          {statusLabel}
        </span>
      </div>

      {/* ── Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0A1020' }}>
        <button style={TAB_STYLE('chat')} onClick={() => setTab('chat')}>Xat</button>
        <button style={TAB_STYLE('activitat')} onClick={() => setTab('activitat')}>Activitat</button>
        <button style={TAB_STYLE('edita')} onClick={() => setTab('edita')}>Edita</button>
      </div>

      {/* ── Tab: CHAT */}
      {tab === 'chat' && (
        <>
          <div style={{ padding: '10px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <p style={{ margin: 0, fontSize: 12.5, color: '#7A8BA8', lineHeight: 1.65 }}>{agent.desc}</p>
          </div>
          <div style={{ padding: '8px 18px 9px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: 8.5, fontWeight: 700, color: '#2A3A52', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Quan s'activa</div>
            <p style={{ margin: 0, fontSize: 11.5, color: '#4A5A72', lineHeight: 1.55 }}>{agent.trigger}</p>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 7, scrollbarWidth: 'none' }}>
            {!historyLoaded && <div style={{ textAlign: 'center', color: '#3A4A62', fontSize: 11, padding: '16px' }}>Carregant historial...</div>}
            {historyLoaded && chat.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px 14px' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{agent.icon}</div>
                <div style={{ fontSize: 12, color: '#3A4A62', lineHeight: 1.7 }}>Escriu en llengua natural.<br /><span style={{ color: ac, fontSize: 11 }}>"{agent.desc.split('.')[0]}"</span></div>
              </div>
            )}
            {chat.map((m, i) => (
              <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '88%', padding: '8px 12px', borderRadius: 11, fontSize: 12.5, lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: m.role === 'user' ? ac : '#131E30', color: m.role === 'user' ? 'white' : '#C8D5E8', border: m.role === 'agent' ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>{m.text}</div>
            ))}
            {loading && (
              <div style={{ alignSelf: 'flex-start', padding: '8px 12px', borderRadius: 11, fontSize: 13, background: '#131E30', border: '1px solid rgba(255,255,255,0.07)', color: ac, display: 'flex', gap: 5 }}>
                {[0, 1, 2].map(i => <span key={i} style={{ animation: `blink 1.2s ${i * 0.2}s infinite` }}>●</span>)}
              </div>
            )}
            <div ref={endRef} />
          </div>
          <div style={{ padding: '8px 12px 14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                placeholder={`Escriu a ${agent.name}...`}
                style={{ flex: 1, background: '#131E30', border: `1px solid ${input ? ac + '45' : 'rgba(255,255,255,0.09)'}`, borderRadius: 8, padding: '8px 11px', fontSize: 12.5, fontFamily: 'inherit', color: '#E2E8F4', transition: 'border-color .15s' }} />
              <button onClick={send} disabled={loading || !input.trim()} style={{ background: ac, border: 'none', borderRadius: 8, padding: '8px 13px', color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 700, opacity: loading || !input.trim() ? 0.3 : 1, flexShrink: 0, transition: 'opacity .15s' }}>→</button>
            </div>
          </div>
        </>
      )}

      {/* ── Tab: ACTIVITAT */}
      {tab === 'activitat' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 16, scrollbarWidth: 'none' }}>
          {/* Status badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ padding: '6px 14px', borderRadius: 20, fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', background: activity.status === 'IDLE' ? 'rgba(42,58,82,.4)' : `${ac}20`, border: `1px solid ${activity.status === 'IDLE' ? 'rgba(42,58,82,.6)' : ac + '50'}`, color: activity.status === 'IDLE' ? '#3A4A62' : ac, display: 'flex', alignItems: 'center', gap: 6 }}>
              {activity.status !== 'IDLE' && <span style={{ width: 5, height: 5, borderRadius: '50%', background: ac, animation: 'blink 1.5s infinite' }} />}
              {activity.status}
            </div>
            <span style={{ fontSize: 9, color: '#2A3A52', fontFamily: 'monospace' }}>{new Date().toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          {/* Live log */}
          <div>
            <div style={{ fontSize: 8.5, fontWeight: 700, color: '#2A3A52', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Registre d'accions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {activity.log.map((entry, i) => (
                <div key={i} style={{ display: 'flex', gap: 9, padding: '7px 0', borderBottom: i < activity.log.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', animation: `actFadeIn .3s ease ${i * 0.08}s both` }}>
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: i === 0 ? ac : '#2A3A52', flexShrink: 0, marginTop: 5 }} />
                  <span style={{ fontSize: 11.5, color: i === 0 ? '#C8D5E8' : '#5A6A85', lineHeight: 1.5, flex: 1 }}>{entry}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 8.5, fontWeight: 700, color: '#2A3A52', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Estadístiques</div>
            {[
              ['Runs avui', String(dept.runsToday ?? 0)],
              ['Última activitat', dept.lastActivity ?? '—'],
              ['Dept.', dept.name],
              ['Estat', agent.status],
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 11 }}>
                <span style={{ color: '#3A4A62' }}>{l}</span>
                <span style={{ color: '#8A9BB8', fontFamily: 'monospace', fontWeight: 700 }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Trigger */}
          <div style={{ background: `${ac}0A`, borderRadius: 10, padding: '12px 14px', border: `1px solid ${ac}20` }}>
            <div style={{ fontSize: 8.5, fontWeight: 700, color: ac + 'AA', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>S'activa quan</div>
            <p style={{ margin: 0, fontSize: 11.5, color: '#8A9BB8', lineHeight: 1.6 }}>{agent.trigger}</p>
          </div>
        </div>
      )}

      {/* ── Tab: EDITA */}
      {tab === 'edita' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14, scrollbarWidth: 'none' }}>
          <div style={{ fontSize: 9, color: '#3A4A62', lineHeight: 1.6, padding: '8px 10px', background: 'rgba(37,99,235,0.06)', borderRadius: 8, border: '1px solid rgba(37,99,235,0.18)' }}>
            Els canvis aquí modifiquen la configuració de l'agent en temps real. El prompt sistema s'edita a <span style={{ fontFamily: 'monospace', color: '#4A6A9A' }}>agents-prompts.json</span>.
          </div>

          {[
            { label: 'Nom', value: editName, set: setEditName, rows: 1 },
            { label: 'Descripció', value: editDesc, set: setEditDesc, rows: 3 },
            { label: 'Trigger / Quan s\'activa', value: editTrigger, set: setEditTrigger, rows: 2 },
          ].map(({ label, value, set, rows }) => (
            <div key={label}>
              <div style={{ fontSize: 8.5, fontWeight: 700, color: '#3A4A62', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
              {rows === 1 ? (
                <input value={value} onChange={e => set(e.target.value)} style={{ width: '100%', background: '#111D30', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '8px 10px', fontSize: 12.5, fontFamily: 'inherit', color: '#E2E8F4' }} />
              ) : (
                <textarea value={value} onChange={e => set(e.target.value)} rows={rows} style={{ width: '100%', background: '#111D30', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '8px 10px', fontSize: 12, fontFamily: 'inherit', color: '#E2E8F4', lineHeight: 1.55 }} />
              )}
            </div>
          ))}

          <div style={{ fontSize: 8.5, color: '#2A3A52', fontFamily: 'monospace', padding: '6px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)' }}>
            ID: {agent.id} · Code: {agent.code} · Dept: {dept.id}
          </div>

          <button onClick={saveEdit} disabled={saveState === 'saving'} style={{ padding: '10px 0', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 800, letterSpacing: '0.06em', background: saveState === 'saved' ? '#059669' : ac, color: 'white', transition: 'background .3s', opacity: saveState === 'saving' ? 0.7 : 1 }}>
            {saveState === 'saving' ? 'Desant...' : saveState === 'saved' ? '✓ Desat' : 'Desa canvis'}
          </button>
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
  const totalRuns = DEPTS.reduce((s, d) => s + (liveStats[d.id]?.runsToday ?? d.runsToday ?? 0), 0)

  useEffect(() => {
    const go = async () => {
      try {
        const res = await fetch('/api/agents/stats')
        if (!res.ok) return
        const data = await res.json()
        const stats: Record<string, { runsToday: number; lastActivity: string }> = {}
        for (const dept of DEPTS) {
          let runs = dept.runsToday ?? 0; let last = dept.lastActivity ?? '—'
          for (const a of dept.agents) {
            const r = data.runsToday?.[a.id]; const l = data.lastActivity?.[a.id]
            if (r != null) runs += r
            if (l) last = formatAgo(l)
          }
          stats[dept.id] = { runsToday: runs, lastActivity: last }
        }
        setLiveStats(stats)
      } catch {}
    }
    go(); const t = setInterval(go, 30_000); return () => clearInterval(t)
  }, [])

  function formatAgo(iso: string) {
    const d = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
    if (d < 60) return `${d}s ago`; if (d < 3600) return `${Math.floor(d / 60)}m ago`
    if (d < 86400) return `${Math.floor(d / 3600)}h ago`; return `${Math.floor(d / 86400)}d ago`
  }

  function selectDept(id: string) {
    if (selectedDept === id) { setSelectedDept(null); setSelectedAgent(null) }
    else { setSelectedDept(id); setSelectedAgent(DEPTS.find(d => d.id === id)?.agents[0]?.id ?? null) }
  }

  function cardOffset(id: string): [number, number] {
    const offsets: Record<string, [number, number]> = {
      central: [14, 0], produccio: [10, -12],
      clients: [-180, 15], finances: [8, 15],
      vendes: [-182, 10], estrategia: [8, 10],
    }
    return offsets[id] ?? [10, 0]
  }

  const totalAgents = DEPTS.reduce((s, d) => s + d.agents.length, 0)

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: "'Manrope','Inter',system-ui,sans-serif", position: 'relative', background: '#060C18' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 60% at 50% 50%,#0C1E3A 0%,#060C18 100%)', zIndex: 0 }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle,rgba(37,99,235,0.08) 1px,transparent 1px)', backgroundSize: '32px 32px', zIndex: 0 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(6,12,24,0.4) 0%,transparent 30%,transparent 70%,rgba(6,12,24,0.6) 100%)', zIndex: 0 }} />

      {/* Status bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: activeAgent ? 360 : 0, zIndex: 20, background: 'rgba(6,12,24,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(37,99,235,0.15)', padding: '0 24px', height: 44, display: 'flex', alignItems: 'center', gap: 0 }}>
        <style>{`@keyframes online{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.14em', color: '#E2E8F4', fontFamily: '"SF Mono","Fira Code",monospace', marginRight: 22 }}>GUINEW AI OS</span>
        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)', marginRight: 22 }} />
        <div style={{ display: 'flex', gap: 24, fontSize: 10, fontFamily: '"SF Mono","Fira Code",monospace', letterSpacing: '0.06em' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#4A5A78' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563EB', boxShadow: '0 0 7px #2563EB' }} />
            <span style={{ color: '#8A9BB8' }}>{activeCount} PROCESSOS ACTIUS</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669', boxShadow: '0 0 7px #059669' }} />
            <span style={{ color: '#8A9BB8' }}>{totalRuns} RUNS AVUI</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 7px #10B981', animation: 'online 2.4s infinite' }} />
            <span style={{ color: '#8A9BB8' }}>SISTEMA OPERATIU</span>
          </span>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.07em', padding: '3px 10px', borderRadius: 20, background: 'rgba(0,201,122,0.1)', border: '1px solid rgba(0,201,122,0.25)', color: '#00C97A', fontFamily: '"SF Mono",monospace' }}>{totalAgents} AGENTS ACTIUS</span>
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
          <ellipse cx="450" cy="265" rx="260" ry="200" fill="url(#centerGlow)" />
          {DEPTS.filter(d => d.id !== 'central').map((d, i) => {
            const [cx, cy] = NODE_POS[d.id]
            const [ox, oy] = NODE_POS.central
            return <NetConnection key={d.id} deptId={d.id} x1={ox} y1={oy} x2={cx} y2={cy} color={d.dot} active={true} delay={`${i * 0.65}s`} dur={`${3.4 + i * 0.35}s`} />
          })}
          {DEPTS.map(dept => (
            <DeptNode key={dept.id} dept={dept} selected={selectedDept === dept.id} onClick={() => selectDept(dept.id)} />
          ))}
        </svg>

        {/* HTML info cards */}
        {DEPTS.map(dept => {
          const [cx, cy] = NODE_POS[dept.id] ?? [450, 265]
          const [ox, oy] = cardOffset(dept.id)
          const isSel = selectedDept === dept.id
          const stat = liveStats[dept.id]
          const runs = stat?.runsToday ?? dept.runsToday ?? 0
          const last = stat?.lastActivity ?? dept.lastActivity ?? '—'
          const left = `calc(${((cx + 55 + ox) / 900) * 100}%)`
          const top = `calc(44px + ${((cy + oy) / 560) * 100}%)`

          return (
            <div key={dept.id} style={{
              position: 'absolute', left, top,
              background: isSel ? 'rgba(10,20,40,0.96)' : 'rgba(8,16,32,0.78)',
              backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
              border: `1px solid ${isSel ? dept.dot + '55' : 'rgba(37,99,235,0.18)'}`,
              borderRadius: 11, padding: '11px 15px',
              boxShadow: isSel ? `0 8px 40px ${dept.dot}22,0 0 0 1px ${dept.dot}20` : '0 4px 20px rgba(0,0,0,0.4)',
              minWidth: 148, maxWidth: 185, cursor: 'pointer', zIndex: 10, transform: 'translateY(-50%)',
              transition: 'border-color .15s,box-shadow .15s',
            }} onClick={() => selectDept(dept.id)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: dept.dot, boxShadow: `0 0 5px ${dept.dot}` }} />
                <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', color: '#8A9BB8', flex: 1 }}>{dept.name.toUpperCase()}</span>
                {runs > 0 && <span style={{ fontSize: 8, color: '#10B981', fontWeight: 800 }}>●</span>}
              </div>
              <div style={{ display: 'flex', gap: 3, alignItems: 'baseline', marginBottom: 5 }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: '#E2E8F4', lineHeight: 1, letterSpacing: '-0.02em' }}>{dept.agents.length}</span>
                <span style={{ fontSize: 9, color: '#3A4A62', fontWeight: 700, letterSpacing: '0.04em' }}>{dept.agents.length === 1 ? 'AGENT' : 'AGENTS'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: isSel ? 8 : 0 }}>
                {[['RUNS AVUI', String(runs)], ['ÚLTIMA ACT.', last]].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 9, color: '#3A4A62' }}>
                    <span style={{ letterSpacing: '0.04em' }}>{l}</span>
                    <span style={{ fontWeight: 700, color: '#6A7A95', fontFamily: '"SF Mono","Fira Code",monospace' }}>{v}</span>
                  </div>
                ))}
              </div>

              {isSel && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {dept.agents.map(a => {
                    const sc = a.status === 'actiu' ? '#00C97A' : a.status === 'restringit' ? '#F59E0B' : '#3D4E6A'
                    return (
                      <button key={a.id} onClick={e => { e.stopPropagation(); setSelectedAgent(a.id) }} style={{
                        background: selectedAgent === a.id ? `${dept.dot}18` : 'none',
                        border: `1px solid ${selectedAgent === a.id ? dept.dot + '40' : 'transparent'}`,
                        borderRadius: 6, padding: '4px 7px', cursor: 'pointer',
                        fontSize: 10.5, fontWeight: selectedAgent === a.id ? 700 : 500,
                        color: selectedAgent === a.id ? dept.dot : '#5A6A85',
                        textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6,
                        fontFamily: "'Manrope','Inter',system-ui,sans-serif",
                      }}>
                        <span style={{ width: 4, height: 4, borderRadius: '50%', background: sc, flexShrink: 0 }} />
                        <span>{a.icon}</span>
                        <span style={{ flex: 1 }}>{a.name}</span>
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

      {/* Agent panel */}
      {activeAgent && activeDept && (
        <AgentPanel agent={activeAgent} dept={activeDept} onClose={() => { setSelectedDept(null); setSelectedAgent(null) }} />
      )}
    </div>
  )
}
