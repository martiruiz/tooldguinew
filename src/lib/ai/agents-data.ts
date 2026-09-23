export type AgentStatus = 'actiu' | 'restringit' | 'pendent'

export type Agent = {
  id: string       // e.g. "03_qa"
  code: string     // e.g. "03"
  slug: string     // e.g. "qa"
  name: string
  emoji: string
  capa: number
  capaName: string
  desc: string
  status: AgentStatus
  chat: boolean
  trigger: string
}

export const CAPES: { id: number; name: string; color: string; bg: string }[] = [
  { id: 0, name: 'Sistema',         color: '#EF4444', bg: '#1A0A0A' },
  { id: 1, name: 'Operacions',      color: '#3B82F6', bg: '#0A101A' },
  { id: 2, name: 'Intel·ligència',  color: '#8B5CF6', bg: '#100A1A' },
  { id: 3, name: 'Estratègia',      color: '#10B981', bg: '#0A1A12' },
  { id: 4, name: 'Producció',       color: '#F59E0B', bg: '#1A130A' },
  { id: 5, name: 'Pipeline ASOBAL', color: '#06B6D4', bg: '#0A171A' },
  { id: 6, name: 'Canal',           color: '#EC4899', bg: '#1A0A14' },
]

export const AGENTS: Agent[] = [
  // CAPA 0 — SISTEMA
  {
    id: '00_orchestrator', code: '00', slug: 'orchestrator',
    name: 'Orchestrator', emoji: '🧠', capa: 0, capaName: 'Sistema',
    status: 'actiu', chat: true,
    desc: 'Cervell del sistema. Rep tasques en llengua natural, executa 6 passos obligatoris i retorna un resultat revisat i accionable.',
    trigger: 'Totes les peticions en llengua natural. Punt d\'entrada únic del sistema.',
  },
  {
    id: '01_memory', code: '01', slug: 'memory',
    name: 'Memory', emoji: '🗄️', capa: 0, capaName: 'Sistema',
    status: 'actiu', chat: true,
    desc: 'Gestiona la memòria persistent de l\'OS: clients, historial, decisions, contextos i patrons detectats.',
    trigger: 'Quan qualsevol agent necessita recuperar o actualitzar context persistent.',
  },
  {
    id: '02_automation', code: '02', slug: 'automation',
    name: 'Automation', emoji: '⚙️', capa: 0, capaName: 'Sistema',
    status: 'actiu', chat: true,
    desc: 'Detecta processos repetitius, dissenya automatitzacions i connecta APIs. Exemple: pipeline ASOBAL post-partit.',
    trigger: 'Quan s\'identifica un procés repetitiu o quan cal un workflow automàtic nou.',
  },
  {
    id: '03_qa', code: '03', slug: 'qa',
    name: 'QA', emoji: '✅', capa: 0, capaName: 'Sistema',
    status: 'actiu', chat: true,
    desc: 'Control de qualitat transversal. Valida: CONTENT, VIDEO, DATA, SEO, FINANCE, PUBLISHING. Pot bloquejar el flux.',
    trigger: 'Obligatòriament, sempre, abans de lliurar o publicar qualsevol asset.',
  },
  {
    id: '04_reporting', code: '04', slug: 'reporting',
    name: 'Reporting', emoji: '📊', capa: 0, capaName: 'Sistema',
    status: 'actiu', chat: true,
    desc: 'Capa de Business Intelligence transversal. Consumeix analytics, finances, insights. Produeix informes per a client i equip.',
    trigger: 'Cal un informe de resultats, report mensual o executive summary.',
  },

  // CAPA 1 — OPERACIONS
  {
    id: '10_pm', code: '10', slug: 'pm',
    name: 'Project Manager', emoji: '📋', capa: 1, capaName: 'Operacions',
    status: 'actiu', chat: true,
    desc: 'Converteix briefs en tasques estructurades, assigna responsables, controla deadlines i detecta bloquejos.',
    trigger: 'La tasca implica un projecte, deadline o assignació de responsable.',
  },
  {
    id: '11_finances', code: '11', slug: 'finances',
    name: 'Finances', emoji: '💰', capa: 1, capaName: 'Operacions',
    status: 'restringit', chat: true,
    desc: 'Controla ingressos, despeses, marge per client, facturació pendent i previsió. Accés restringit: només Martí.',
    trigger: 'Consulta financera — exclusivament per a Martí Ruiz.',
  },
  {
    id: '12_comercial', code: '12', slug: 'comercial',
    name: 'Comercial', emoji: '🤝', capa: 1, capaName: 'Operacions',
    status: 'actiu', chat: true,
    desc: 'Gestiona oportunitats comercials, proposa propostes i fa seguiment. Mai envia propostes sense aprovació de Martí.',
    trigger: 'Nova oportunitat comercial o seguiment de prospecte.',
  },
  {
    id: '13_account', code: '13', slug: 'account',
    name: 'Account', emoji: '🎯', capa: 1, capaName: 'Operacions',
    status: 'actiu', chat: true,
    desc: 'Client Operating System. Coneix en tot moment: objectius, historial, TOV, contracte, feedback i pròxims passos de cada client.',
    trigger: 'Cal context d\'un client, preparació de reunió o seguiment de compte.',
  },
  {
    id: '14_legal', code: '14', slug: 'legal',
    name: 'Legal', emoji: '⚖️', capa: 1, capaName: 'Operacions',
    status: 'actiu', chat: true,
    desc: 'Gestiona drets d\'imatge, música, contractes, propietat intel·lectual i compliance de plataformes.',
    trigger: 'Contingut amb música, imatges de tercers, contractes o riscos legals.',
  },
  {
    id: '15_client_insights', code: '15', slug: 'client-insights',
    name: 'Client Insights', emoji: '💡', capa: 1, capaName: 'Operacions',
    status: 'actiu', chat: true,
    desc: 'Captura i estructura la veu del client, satisfacció, feedback i intel·ligència de compte.',
    trigger: 'Recollida de feedback, anàlisi de satisfacció o detecció de patrons de client.',
  },

  // CAPA 2 — INTEL·LIGÈNCIA
  {
    id: '20_research', code: '20', slug: 'research',
    name: 'Research', emoji: '🔍', capa: 2, capaName: 'Intel·ligència',
    status: 'actiu', chat: true,
    desc: 'Analitza competència, detecta tendències de mercat i genera insights estratègics per a decisions.',
    trigger: 'Cal investigar el mercat, competència o tendències del sector.',
  },
  {
    id: '21_analytics', code: '21', slug: 'analytics',
    name: 'Analytics', emoji: '📈', capa: 2, capaName: 'Intel·ligència',
    status: 'actiu', chat: true,
    desc: 'Anàlisi profunda de dades, patrons i correlacions entre mètriques de RRSS, audiència i contingut.',
    trigger: 'Cal anàlisi de tendències, comparatives de rendiment o correlació de dades.',
  },
  {
    id: '22_dades', code: '22', slug: 'dades',
    name: 'Dades', emoji: '🗃️', capa: 2, capaName: 'Intel·ligència',
    status: 'actiu', chat: true,
    desc: 'Estructurador de dades esportives. Converteix resultats, estadístiques i notícies en entitats verificables.',
    trigger: 'Cal estructurar dades esportives: gols, marcadors, estadístiques de jugadors.',
  },
  {
    id: '23_social_listening', code: '23', slug: 'social-listening',
    name: 'Social Listening', emoji: '👂', capa: 2, capaName: 'Intel·ligència',
    status: 'actiu', chat: true,
    desc: 'Monitoritza converses, tendències i signals rellevants per a clients i competència. Alerta de crisi.',
    trigger: 'Cal monitoritzar mencions, tendències o alertes de crisi a les RRSS.',
  },
  {
    id: '24_fact_check', code: '24', slug: 'fact-check',
    name: 'Fact Check', emoji: '🔎', capa: 2, capaName: 'Intel·ligència',
    status: 'actiu', chat: true,
    desc: 'Verifica dades esportives contra fonts primàries (SofaScore, fonts oficials). Bloqueja dades no verificades.',
    trigger: 'Cap dada esportiva crítica pot ser marcada VERIFIED sense passar per aquí.',
  },

  // CAPA 3 — ESTRATÈGIA
  {
    id: '30_estrategia', code: '30', slug: 'estrategia',
    name: 'Estratègia', emoji: '🎯', capa: 3, capaName: 'Estratègia',
    status: 'actiu', chat: true,
    desc: 'Defineix l\'estratègia trimestral, pilars de contingut i TOV. No canvia TOV sense aprovació de Martí.',
    trigger: 'Cal estratègia trimestral, planificació de pilars o revisió de TOV de client.',
  },
  {
    id: '31_seo', code: '31', slug: 'seo',
    name: 'SEO', emoji: '🔎', capa: 3, capaName: 'Estratègia',
    status: 'actiu', chat: true,
    desc: 'Genera contingut optimitzat per cercadors, analitza keywords i optimitza arquitectura de contingut.',
    trigger: 'Cal contingut SEO, anàlisi de keywords o optimització per cercadors.',
  },
  {
    id: '32_paid', code: '32', slug: 'paid',
    name: 'Paid Media', emoji: '📣', capa: 3, capaName: 'Estratègia',
    status: 'actiu', chat: true,
    desc: 'Planifica i optimitza campanyes Meta/Google. No modifica campanyes directament: genera briefs.',
    trigger: 'Cal gestionar campanyes de pagament, optimitzar ROAS o planificar inversió publicitària.',
  },
  {
    id: '33_creative_director', code: '33', slug: 'creative-director',
    name: 'Creative Director', emoji: '🎨', capa: 3, capaName: 'Estratègia',
    status: 'actiu', chat: true,
    desc: 'Defineix la direcció creativa de campanyes, identitat visual i coherència de marca entre clients.',
    trigger: 'Cal un briefing creatiu, revisió de coherència de marca o direcció de campanya.',
  },
  {
    id: '34_influencer', code: '34', slug: 'influencer',
    name: 'Influencer', emoji: '🌟', capa: 3, capaName: 'Estratègia',
    status: 'actiu', chat: true,
    desc: 'Gestiona relacions amb creadors, esportistes i influencers. Genera briefs i en fa el seguiment.',
    trigger: 'Cal activació amb creadors, cerca d\'influencers o gestió de col·laboració.',
  },
  {
    id: '35_web', code: '35', slug: 'web',
    name: 'Web & CRO', emoji: '💻', capa: 3, capaName: 'Estratègia',
    status: 'actiu', chat: true,
    desc: 'Dissenya i optimitza pàgines web, landings i fluxos de conversió. Genera copywriting per a web.',
    trigger: 'Cal una landing page, copy web, auditoria CRO o millora de conversió.',
  },

  // CAPA 4 — PRODUCCIÓ
  {
    id: '40_contingut', code: '40', slug: 'contingut',
    name: 'Contingut', emoji: '✍️', capa: 4, capaName: 'Producció',
    status: 'actiu', chat: true,
    desc: 'Genera copies, captions i adaptacions per client i plataforma. Sempre aplica TOV i guidelines del client.',
    trigger: 'Cal copy, captions o contingut escrit per a RRSS, email o web.',
  },
  {
    id: '41_calendari', code: '41', slug: 'calendari',
    name: 'Calendari', emoji: '📅', capa: 4, capaName: 'Producció',
    status: 'actiu', chat: true,
    desc: 'Planifica el calendari editorial mensual per client, alineant dates esportives, formats i freqüència.',
    trigger: 'Cal planificar el calendari editorial d\'un client o mes.',
  },
  {
    id: '42_filmmaker', code: '42', slug: 'filmmaker',
    name: 'Filmmaker', emoji: '🎬', capa: 4, capaName: 'Producció',
    status: 'actiu', chat: true,
    desc: 'Dissenya plans de rodatge, guions visuals i briefings de producció de vídeo per a clients.',
    trigger: 'Cal un pla de rodatge, guió visual o briefing de producció audiovisual.',
  },
  {
    id: '43_disseny', code: '43', slug: 'disseny',
    name: 'Disseny', emoji: '🖌️', capa: 4, capaName: 'Producció',
    status: 'actiu', chat: true,
    desc: 'Especifica disseny gràfic per a peces de RRSS, stories, carrusels i material de marca.',
    trigger: 'Cal un briefing de disseny gràfic, especificació visual o guia d\'estil.',
  },
  {
    id: '44_localization', code: '44', slug: 'localization',
    name: 'Localization', emoji: '🌍', capa: 4, capaName: 'Producció',
    status: 'actiu', chat: true,
    desc: 'Adapta i tradueix continguts a múltiples idiomes (CA/ES/EN) mantenint coherència de marca i TOV.',
    trigger: 'Cal adaptar o traduir contingut a un altre idioma.',
  },

  // CAPA 5 — PIPELINE ASOBAL
  {
    id: '50_jornada', code: '50', slug: 'jornada',
    name: 'Jornada', emoji: '⚽', capa: 5, capaName: 'Pipeline ASOBAL',
    status: 'actiu', chat: true,
    desc: 'Gestiona el pipeline de producció de jornada ASOBAL: planifica, coordina i executa el cicle complet.',
    trigger: 'Inici del cicle de jornada ASOBAL (dia de partit o preparació prèvia).',
  },
  {
    id: '51_cut', code: '51', slug: 'cut',
    name: 'Cut', emoji: '✂️', capa: 5, capaName: 'Pipeline ASOBAL',
    status: 'actiu', chat: true,
    desc: 'Especifica el tall de vídeo de partits ASOBAL: moments clau, estructura i punts d\'entrada/sortida.',
    trigger: 'Cal especificar el muntatge de vídeo d\'un partit o jornada ASOBAL.',
  },
  {
    id: '52_clip', code: '52', slug: 'clip',
    name: 'Clip', emoji: '🎞️', capa: 5, capaName: 'Pipeline ASOBAL',
    status: 'actiu', chat: true,
    desc: 'Gestiona la producció de clips i highlights per a plataformes (Reels, YouTube Shorts, TikTok).',
    trigger: 'Cal crear clips, highlights o contingut curt de vídeo ASOBAL.',
  },
  {
    id: '53_brand', code: '53', slug: 'brand',
    name: 'Brand ASOBAL', emoji: '🏆', capa: 5, capaName: 'Pipeline ASOBAL',
    status: 'actiu', chat: true,
    desc: 'Gestiona la identitat visual ASOBAL: logos d\'equips, plantilles gràfiques i coherència de marca.',
    trigger: 'Cal aplicar la identitat visual ASOBAL o adaptar materials de marca.',
  },
  {
    id: '54_thumbnail', code: '54', slug: 'thumbnail',
    name: 'Thumbnail', emoji: '🖼️', capa: 5, capaName: 'Pipeline ASOBAL',
    status: 'actiu', chat: true,
    desc: 'Genera especificacions de thumbnails i packaging visual per a YouTube i VOD. Maximitza el CTR.',
    trigger: 'Cal crear thumbnails o packaging visual per a vídeos ASOBAL.',
  },
  {
    id: '55_draft', code: '55', slug: 'draft',
    name: 'Draft', emoji: '📝', capa: 5, capaName: 'Pipeline ASOBAL',
    status: 'actiu', chat: true,
    desc: 'Prepara esborranys de posts, captions i descripcions per al pipeline ASOBAL.',
    trigger: 'Cal preparar els textos i copies de les publicacions de jornada ASOBAL.',
  },

  // CAPA 6 — CANAL
  {
    id: '60_cm', code: '60', slug: 'cm',
    name: 'Community Mgr', emoji: '💬', capa: 6, capaName: 'Canal',
    status: 'actiu', chat: true,
    desc: 'Prepara respostes a comentaris i DMs seguint la veu de cada client. No publica mai directament.',
    trigger: 'Hi ha comentaris o DMs a gestionar. Sempre genera esborranys per aprovació.',
  },
  {
    id: '61_distribution', code: '61', slug: 'distribution',
    name: 'Distribution', emoji: '📡', capa: 6, capaName: 'Canal',
    status: 'actiu', chat: true,
    desc: 'Executa la publicació multicanal via Metricool. Gestiona calendaris i fa pre-flight checks.',
    trigger: 'Cal programar o publicar contingut aprovat (QA:APPROVED obligatori).',
  },
]

export function getAgentById(id: string): Agent | undefined {
  return AGENTS.find(a => a.id === id)
}

export function getAgentsByLayer(capa: number): Agent[] {
  return AGENTS.filter(a => a.capa === capa)
}
