import type Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/serverAdmin'

// ─── TOOL DEFINITIONS (per a la Claude API) ──────────────────────────────────

export const ORCHESTRATOR_TOOLS: Anthropic.Tool[] = [
  {
    name: 'get_client_context',
    description:
      "Carrega el context complet d'un client: informació bàsica, briefing (TOV, estratègia per plataforma) i projectes actius. Usar sempre abans de delegar a qualsevol agent de contingut.",
    input_schema: {
      type: 'object' as const,
      properties: {
        client_slug: {
          type: 'string',
          description: "Identificador únic del client (ex: 'asobal', 'girona-fc')",
        },
      },
      required: ['client_slug'],
    },
  },
  {
    name: 'get_content_history',
    description:
      'Recupera els últims continguts aprovats per a un client en una plataforma. Evita repeticions i apren dels continguts anteriors.',
    input_schema: {
      type: 'object' as const,
      properties: {
        client_id: { type: 'string', description: 'UUID del client' },
        channel: {
          type: 'string',
          enum: ['instagram', 'tiktok', 'linkedin', 'x', 'youtube', 'facebook'],
        },
        limit: { type: 'integer', default: 10 },
      },
      required: ['client_id', 'channel'],
    },
  },
  {
    name: 'create_content_draft',
    description:
      "Crea un esborrany de contingut. Sempre amb status 'idea' (entrada al pipeline). Mai publica directament.",
    input_schema: {
      type: 'object' as const,
      properties: {
        client_id: { type: 'string' },
        title: { type: 'string', description: "Títol intern (ex: 'Preview J3 ASOBAL Instagram')" },
        format: { type: 'string', description: "ex: 'reel', 'carrusel', 'story', 'post_static'" },
        channel: {
          type: 'string',
          enum: ['instagram', 'tiktok', 'linkedin', 'x', 'youtube', 'facebook'],
        },
        notes: {
          type: 'string',
          description: 'Contingut complet: copy, CTA, hashtags, notes visuals',
        },
        due_date: { type: 'string', description: 'Data publicació (YYYY-MM-DD)' },
      },
      required: ['client_id', 'title', 'channel', 'notes'],
    },
  },
  {
    name: 'update_content_status',
    description:
      "Actualitza l'estat d'un contingut al pipeline. L'usa QA per avançar o bloquejar.",
    input_schema: {
      type: 'object' as const,
      properties: {
        content_id: { type: 'string' },
        status: {
          type: 'string',
          enum: ['idea', 'produccio', 'revisio', 'publicat'],
          description: "Pipeline: idea → produccio → revisio → publicat",
        },
        notes: {
          type: 'string',
          description: "Notes sobre el canvi o motiu de bloqueig",
        },
      },
      required: ['content_id', 'status'],
    },
  },
  {
    name: 'create_task',
    description: 'Crea una tasca al sistema de projectes. Usar per estructurar el treball.',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string' },
        client_id: { type: 'string' },
        project_id: { type: 'string' },
        deadline: { type: 'string', description: 'Data límit ISO 8601 (YYYY-MM-DDThh:mm:ssZ)' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
        description: { type: 'string' },
      },
      required: ['title', 'client_id'],
    },
  },
  {
    name: 'create_ai_insight',
    description:
      "Registra una anomalia o bloqueig detectat. Usar quan QA detecta un problema de contingut o un agent detecta un risc.",
    input_schema: {
      type: 'object' as const,
      properties: {
        type: {
          type: 'string',
          enum: ['overdue_content', 'blocked_tasks', 'clients_at_risk', 'business_anomalies', 'projects_at_risk'],
          description: "Usar 'overdue_content' per bloquejos de QA, 'business_anomalies' per problemes generals",
        },
        severity: { type: 'string', enum: ['info', 'warning', 'critical'], description: "info = nota; warning = problema menor; critical = bloquejant (QA)" },
        entity_type: { type: 'string', enum: ['client', 'project', 'task', 'opportunity'], description: "Usar 'client' quan el problema és de contingut d'un client" },
        entity_id: { type: 'string', description: 'UUID de l\'entitat afectada (client_id, project_id, etc.)' },
        title: { type: 'string', description: "Resum breu (ex: 'QA bloqueja: data d·inici no confirmada')" },
        summary: { type: 'string', description: 'Explicació detallada del problema detectat' },
        evidence: { type: 'object', description: 'Evidència en JSON (ex: {content_id, motius_bloqueig})' },
      },
      required: ['type', 'severity', 'title', 'summary'],
    },
  },
  // ── Fase 2 tools ────────────────────────────────────────────────────────────
  {
    name: 'get_opportunity_context',
    description: 'Carrega una oportunitat comercial del CRM. Usar per al agent Comercial.',
    input_schema: {
      type: 'object' as const,
      properties: {
        opportunity_id: { type: 'string', description: 'UUID de la oportunitat' },
      },
      required: ['opportunity_id'],
    },
  },
  {
    name: 'create_opportunity',
    description: 'Crea una nova oportunitat comercial al CRM.',
    input_schema: {
      type: 'object' as const,
      properties: {
        company_name: { type: 'string' },
        contact_name: { type: 'string' },
        contact_email: { type: 'string' },
        estimated_value: { type: 'number' },
        services_interest: { type: 'array', items: { type: 'string' } },
        notes: { type: 'string' },
      },
      required: ['company_name'],
    },
  },
  {
    name: 'update_opportunity_status',
    description: "Avança l'estat d'una oportunitat (lead → qualificat → proposta → tancat_guanyat | tancat_perdut).",
    input_schema: {
      type: 'object' as const,
      properties: {
        opportunity_id: { type: 'string' },
        status: { type: 'string', enum: ['lead', 'qualificat', 'proposta', 'negociacio', 'tancat_guanyat', 'tancat_perdut'] },
        notes: { type: 'string' },
      },
      required: ['opportunity_id', 'status'],
    },
  },
  {
    name: 'create_draft_proposta',
    description: 'Crea un esborrany de proposta comercial. SEMPRE requereix aprovació de Martí. Mai envia directament.',
    input_schema: {
      type: 'object' as const,
      properties: {
        opportunity_id: { type: 'string' },
        title: { type: 'string' },
        services: { type: 'array', items: { type: 'string' } },
        price_range: { type: 'string', description: "ex: '1.200€–1.800€/mes'" },
        contingut: { type: 'string', description: 'Cos complet de la proposta' },
      },
      required: ['title', 'contingut'],
    },
  },
  {
    name: 'get_metric_reports',
    description: 'Carrega mètriques de rendiment per a un client. Usar per a Reporting, Analytics, Research i Paid Media.',
    input_schema: {
      type: 'object' as const,
      properties: {
        client_id: { type: 'string' },
        channel: { type: 'string', enum: ['instagram', 'tiktok', 'linkedin', 'x', 'youtube', 'facebook', 'google_ads', 'meta_ads'] },
        period_start: { type: 'string', description: 'YYYY-MM-DD' },
        period_end: { type: 'string', description: 'YYYY-MM-DD' },
        limit: { type: 'integer', default: 12 },
      },
      required: ['client_id'],
    },
  },
  {
    name: 'create_strategy_note',
    description: "Crea o actualitza un document d'estratègia per a un client. Usar per a Research, Analytics i Estratègia.",
    input_schema: {
      type: 'object' as const,
      properties: {
        client_id: { type: 'string' },
        title: { type: 'string' },
        content: { type: 'string', description: 'Document complet (markdown acceptat)' },
        type: { type: 'string', enum: ['estrategia_trimestral', 'pivot', 'insight_mercat', 'analisi_competencia', 'benchmark'], default: 'insight_mercat' },
        period: { type: 'string', description: "ex: 'Q4 2026'" },
      },
      required: ['client_id', 'title', 'content'],
    },
  },
  {
    name: 'create_campaign_brief',
    description: 'Crea un brief de campanya de paid media. Usar per al agent Paid Media.',
    input_schema: {
      type: 'object' as const,
      properties: {
        client_id: { type: 'string' },
        title: { type: 'string' },
        platform: { type: 'string', enum: ['meta', 'google_ads', 'tiktok', 'linkedin'] },
        objective: { type: 'string', enum: ['awareness', 'consideration', 'conversion', 'retention'] },
        budget_daily: { type: 'number' },
        period_start: { type: 'string', description: 'YYYY-MM-DD' },
        period_end: { type: 'string', description: 'YYYY-MM-DD' },
        contingut: { type: 'string', description: 'Brief complet de la campanya' },
      },
      required: ['client_id', 'title', 'platform', 'objective', 'contingut'],
    },
  },
  {
    name: 'create_recommendation',
    description:
      'Crea una recomanació que requereix aprovació humana. Usar quan el resultat final és un contingut llest per programar o una acció que cal confirmar.',
    input_schema: {
      type: 'object' as const,
      properties: {
        action_type: { type: 'string', description: "ex: 'programar_post', 'enviar_proposta'" },
        title: { type: 'string' },
        rationale: { type: 'string', description: 'Per quin motiu cal fer aquesta acció' },
        payload: { type: 'object', description: 'Dades per executar quan sigui aprovada' },
        insight_id: { type: 'string', description: 'UUID de insight relacionat (opcional)' },
      },
      required: ['action_type', 'title', 'rationale', 'payload'],
    },
  },
]

// ─── TOOL EXECUTORS ──────────────────────────────────────────────────────────

type ToolInput = Record<string, any>

async function get_client_context({ client_slug }: ToolInput) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('clients')
    .select(`
      id, name, slug, type, status, health, website, description, contracted_services,
      contact_name, contact_email,
      briefings ( objectives, positioning, tone, instagram, tiktok, linkedin, youtube, content ),
      projects ( id, name, status )
    `)
    .eq('slug', client_slug)
    .single()

  if (error || !data) return { error: `Client '${client_slug}' no trobat` }
  return data
}

async function get_content_history({ client_id, channel, limit = 10 }: ToolInput) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('content_items')
    .select('id, title, status, format, channel, notes, due_date, created_at')
    .eq('client_id', client_id)
    .eq('channel', channel)
    .in('status', ['aprovat', 'programat', 'publicat'])
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return { error: error.message }
  return { items: data, count: data?.length ?? 0 }
}

async function create_content_draft({
  client_id, title, format, channel, notes, due_date,
}: ToolInput) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('content_items')
    .insert({ client_id, title, format: format ?? null, channel, notes, status: 'idea', due_date: due_date ?? null })
    .select('id, title, status')
    .single()

  if (error) return { error: error.message }
  return { success: true, content_id: data.id, title: data.title, status: data.status }
}

async function update_content_status({ content_id, status, notes }: ToolInput) {
  const admin = createAdminClient()
  const update: Record<string, string> = { status }
  if (notes) update.notes = notes

  const { error } = await admin.from('content_items').update(update).eq('id', content_id)
  if (error) return { error: error.message }
  return { success: true, content_id, new_status: status }
}

async function create_task({
  title, client_id, project_id, deadline, priority = 'medium', description,
}: ToolInput) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('tasks')
    .insert({
      title, client_id,
      project_id: project_id ?? null,
      deadline: deadline ?? null,
      priority,
      description: description ?? null,
      status: 'todo',
    })
    .select('id, title')
    .single()

  if (error) return { error: error.message }
  return { success: true, task_id: data.id, title: data.title }
}

async function create_ai_insight({
  type, severity, entity_type, entity_id, title, summary, evidence,
}: ToolInput) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('ai_insights')
    .insert({
      type,
      severity,
      entity_type: entity_type ?? null,
      entity_id: entity_id ?? null,
      title,
      summary,
      evidence: evidence ?? {},
      source: 'llm',
      resolved: false,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  return { success: true, insight_id: data.id }
}

async function create_recommendation({
  action_type, title, rationale, payload, insight_id,
}: ToolInput) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('ai_recommendations')
    .insert({
      action_type, title, rationale, payload,
      requires_approval: true,
      status: 'pending',
      insight_id: insight_id ?? null,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  return { success: true, recommendation_id: data.id, requires_approval: true }
}

// ── Fase 2 executors ─────────────────────────────────────────────────────────

async function get_opportunity_context({ opportunity_id }: ToolInput) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('opportunities')
    .select('*')
    .eq('id', opportunity_id)
    .single()
  if (error || !data) return { error: `Oportunitat '${opportunity_id}' no trobada` }
  return data
}

async function create_opportunity({
  company_name, contact_name, contact_email, estimated_value, services_interest, notes,
}: ToolInput) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('opportunities')
    .insert({
      company_name, contact_name: contact_name ?? null,
      contact_email: contact_email ?? null,
      estimated_value: estimated_value ?? null,
      services_interest: services_interest ?? [],
      notes: notes ?? null,
      status: 'lead',
    })
    .select('id, company_name, status')
    .single()
  if (error) return { error: error.message }
  return { success: true, opportunity_id: data.id, company: data.company_name, status: data.status }
}

async function update_opportunity_status({ opportunity_id, status, notes }: ToolInput) {
  const admin = createAdminClient()
  const update: Record<string, string> = { status }
  if (notes) update.notes = notes
  const { error } = await admin.from('opportunities').update(update).eq('id', opportunity_id)
  if (error) return { error: error.message }
  return { success: true, opportunity_id, new_status: status }
}

async function create_draft_proposta({
  opportunity_id, title, services, price_range, contingut,
}: ToolInput) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('content_items')
    .insert({
      title, notes: contingut,
      format: 'proposta',
      channel: 'linkedin',
      status: 'draft',
      client_id: null,
    })
    .select('id, title')
    .single()
  if (error) return { error: error.message }
  return {
    success: true,
    draft_id: data.id,
    title: data.title,
    requires_approval: true,
    message: 'Proposta creada com a esborrany. Pendent aprovació de Martí.',
  }
}

async function get_metric_reports({
  client_id, channel, period_start, period_end, limit = 12,
}: ToolInput) {
  const admin = createAdminClient()
  let query = admin
    .from('metric_reports')
    .select('*')
    .eq('client_id', client_id)
    .order('period_start', { ascending: false })
    .limit(limit)
  if (channel) query = query.eq('channel', channel)
  if (period_start) query = query.gte('period_start', period_start)
  if (period_end) query = query.lte('period_end', period_end)
  const { data, error } = await query
  if (error) return { error: error.message }
  return { reports: data, count: data?.length ?? 0 }
}

async function create_strategy_note({
  client_id, title, content, type = 'insight_mercat', period,
}: ToolInput) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('strategies')
    .insert({
      client_id, title, content,
      type: type ?? 'insight_mercat',
      period: period ?? null,
      status: 'draft',
    })
    .select('id, title')
    .single()
  if (error) return { error: error.message }
  return { success: true, strategy_id: data.id, title: data.title }
}

async function create_campaign_brief({
  client_id, title, platform, objective, budget_daily, period_start, period_end, contingut,
}: ToolInput) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('content_items')
    .insert({
      client_id, title,
      format: `campaign_brief_${platform}`,
      channel: platform === 'meta' ? 'facebook' : 'linkedin',
      notes: contingut,
      status: 'draft',
    })
    .select('id, title')
    .single()
  if (error) return { error: error.message }
  return {
    success: true,
    brief_id: data.id,
    title: data.title,
    requires_approval: true,
  }
}

// ─── DISPATCHER ──────────────────────────────────────────────────────────────

const EXECUTORS: Record<string, (input: ToolInput) => Promise<any>> = {
  get_client_context,
  get_content_history,
  create_content_draft,
  update_content_status,
  create_task,
  create_ai_insight,
  create_recommendation,
  get_opportunity_context,
  create_opportunity,
  update_opportunity_status,
  create_draft_proposta,
  get_metric_reports,
  create_strategy_note,
  create_campaign_brief,
}

export async function executeTool(name: string, input: ToolInput): Promise<string> {
  const executor = EXECUTORS[name]
  if (!executor) return JSON.stringify({ error: `Tool '${name}' no implementada` })
  const result = await executor(input)
  return JSON.stringify(result)
}
