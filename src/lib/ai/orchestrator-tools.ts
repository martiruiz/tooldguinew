import type Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/serverAdmin'
import { getDriveClient, getOAuthClient } from '@/lib/google'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

function writeToAdobeBridge(app: 'premiere' | 'aftereffects' | 'photoshop', scriptName: string, jsxCode: string): string | null {
  const bridgePath = process.env.ADOBE_BRIDGE_PATH
  if (!bridgePath) return null
  const pendingDir = path.join(bridgePath, 'pending', app)
  try {
    fs.mkdirSync(pendingDir, { recursive: true })
    const filePath = path.join(pendingDir, `${Date.now()}_${scriptName}.jsx`)
    fs.writeFileSync(filePath, jsxCode, 'utf8')
    return filePath
  } catch { return null }
}

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
    name: 'save_metricool_metrics',
    description: 'Desa mètriques de Metricool a la base de dades. Usar quan s\'han obtingut dades de Metricool i cal persistir-les per a l\'agent Analytics o Reporting.',
    input_schema: {
      type: 'object' as const,
      properties: {
        client_slug: { type: 'string', description: "Slug del client (ex: 'asobal', 'biwpa', 'elite-fut-academy')" },
        platform: { type: 'string', enum: ['instagram', 'facebook', 'tiktok', 'youtube', 'twitter', 'linkedin'] },
        period_start: { type: 'string', description: 'YYYY-MM-DD' },
        period_end: { type: 'string', description: 'YYYY-MM-DD' },
        metrics: { type: 'object', description: 'Objecte JSON amb les mètriques obtingudes de Metricool' },
      },
      required: ['client_slug', 'platform', 'period_start', 'period_end', 'metrics'],
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
  {
    name: 'search_google_drive',
    description:
      "Cerca fitxers a Google Drive de l'agència: plans de contingut, assets, estratègies, briefs de clients. Usar per obtenir context actualitzat de Drive abans de crear contingut o estratègia.",
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: "Text de cerca (ex: 'ASOBAL estrategia', 'TPE contingut', 'BIWPA brief')",
        },
        file_type: {
          type: 'string',
          enum: ['any', 'spreadsheet', 'document', 'presentation', 'folder', 'image', 'video'],
          description: "Filtrar per tipus de fitxer. 'any' per defecte.",
        },
        limit: { type: 'integer', default: 10, description: 'Màxim de resultats' },
      },
      required: ['query'],
    },
  },
  {
    name: 'generate_premiere_script',
    description:
      "Genera un script ExtendScript (.jsx) per a Adobe Premiere Pro. Usar per a l'Agent Filmmaker quan cal crear una seqüència, afegir text overlays o configurar l'exportació.",
    input_schema: {
      type: 'object' as const,
      properties: {
        format: {
          type: 'string',
          enum: ['reel_9x16', 'post_4x5', 'story_9x16', 'carrusel_1x1', 'youtube_16x9'],
          description: "Format de la seqüència",
        },
        sequence_name: { type: 'string', description: "ex: 'J03_TOP5_GOLES_DECATHLON'" },
        duration_seconds: { type: 'number', description: 'Durada total en segons' },
        text_overlays: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              text: { type: 'string' },
              time_in: { type: 'number', description: 'Segon on apareix' },
              time_out: { type: 'number', description: 'Segon on desapareix' },
              position: { type: 'string', enum: ['top', 'center', 'bottom'], default: 'bottom' },
              style: { type: 'string', enum: ['title', 'sponsor', 'caption'], default: 'title' },
            },
          },
          description: "Textos que s'han d'afegir al vídeo (títols, sponsors, subtítols)",
        },
        export_preset: {
          type: 'string',
          enum: ['instagram_reel', 'instagram_post', 'tiktok', 'youtube'],
          description: 'Preset d\'exportació',
        },
        client_slug: { type: 'string', description: "Slug del client per a branding (ex: 'asobal')" },
        notes: { type: 'string', description: 'Notes addicionals per al filmmaker' },
      },
      required: ['format', 'sequence_name'],
    },
  },
  {
    name: 'schedule_metricool_post',
    description:
      "Prepara un post per a programació via Metricool. Crea l'esborrany a Supabase amb status 'pendent_metricool' i retorna les dades formatades per a l'aprovació humana. NO publica directament — requereix aprovació.",
    input_schema: {
      type: 'object' as const,
      properties: {
        client_slug: { type: 'string', description: "Slug del client (ex: 'asobal')" },
        platform: {
          type: 'string',
          enum: ['instagram', 'facebook', 'tiktok', 'youtube', 'twitter', 'linkedin'],
        },
        post_type: {
          type: 'string',
          enum: ['feed', 'story', 'reel', 'carousel'],
          description: "Tipus de publicació",
        },
        caption: { type: 'string', description: 'Text del post (copy final, ja validat per QA)' },
        scheduled_date: { type: 'string', description: 'Data i hora de publicació (ISO 8601: YYYY-MM-DDTHH:mm:ss)' },
        hashtags: { type: 'array', items: { type: 'string' }, description: 'Hashtags sense #' },
        notes_filmmaker: { type: 'string', description: 'Notes per al filmmaker (format, text on-screen, acció)' },
        content_id: { type: 'string', description: 'UUID del content_item a Supabase (per actualitzar status)' },
      },
      required: ['client_slug', 'platform', 'post_type', 'caption', 'scheduled_date'],
    },
  },
  {
    name: 'ingest_sports_data',
    description:
      "Agent DADES: ingereix i guarda dades esportives estructurades d'una jornada (resultats, classificació, MVP, estadístiques). Crida'l sempre que arribin resultats de partits per a ASOBAL o qualsevol client esportiu.",
    input_schema: {
      type: 'object' as const,
      properties: {
        client_slug: { type: 'string', description: "Slug del client (ex: 'asobal')" },
        jornada: { type: 'string', description: "Identificador de jornada (ex: 'J03')" },
        matches: {
          type: 'array',
          description: 'Llista de partits de la jornada',
          items: {
            type: 'object',
            properties: {
              home: { type: 'string' },
              away: { type: 'string' },
              score_home: { type: 'integer' },
              score_away: { type: 'integer' },
              mvp: { type: 'string' },
              top_scorers: { type: 'array', items: { type: 'object' } },
              date: { type: 'string' },
            },
            required: ['home', 'away'],
          },
        },
        standings: {
          type: 'array',
          description: 'Classificació actualitzada post-jornada',
          items: {
            type: 'object',
            properties: {
              pos: { type: 'integer' },
              club: { type: 'string' },
              pts: { type: 'integer' },
              pj: { type: 'integer' },
            },
          },
        },
        top_stats: {
          type: 'object',
          description: "Estadístiques destacades: màxim golejador, millor porter, etc.",
        },
        confirmed: { type: 'boolean', description: 'Les dades han estat verificades per l\'equip', default: false },
      },
      required: ['client_slug', 'jornada', 'matches'],
    },
  },
  {
    name: 'get_sports_data',
    description:
      "Recupera les dades esportives d'una jornada guardades prèviament via ingest_sports_data. Usar abans de generar contingut de resultats per tenir les dades estructurades.",
    input_schema: {
      type: 'object' as const,
      properties: {
        client_slug: { type: 'string' },
        jornada: { type: 'string', description: "ex: 'J03'. Si s'omet, retorna la jornada més recent." },
      },
      required: ['client_slug'],
    },
  },
  {
    name: 'generate_design_brief',
    description:
      "Agent DIS: genera un brief de disseny estructurat per a Photoshop, After Effects o dissenyador humà. Inclou dimensions, tipografia, paleta, copy per capes i placement de sponsor. Pot generar script .jsx per a automatitzacions.",
    input_schema: {
      type: 'object' as const,
      properties: {
        client_slug: { type: 'string' },
        content_type: {
          type: 'string',
          description: "ex: 'post_estatic', 'carrusel', 'story_text', 'grafic_clasificacion', 'namestrip', 'motion_graphic', 'banner_sponsor', 'poster_event'",
        },
        format: {
          type: 'string',
          enum: ['post_4x5', 'story_9x16', 'carrusel_1x1', 'youtube_16x9', 'banner_web'],
        },
        copy: { type: 'string', description: 'Text final aprovat per QA per a les capes de text' },
        elements: {
          type: 'array',
          items: { type: 'string' },
          description: "Assets visuals necessaris (ex: ['Logo NEXUS transparència', 'Foto Aleix Gómez', 'Escut Barça'])",
        },
        sponsor: { type: 'string', description: 'Sponsor a incloure (opcional)' },
        tool: {
          type: 'string',
          enum: ['photoshop', 'after_effects', 'canva', 'manual'],
          description: "Eina de disseny destí",
          default: 'photoshop',
        },
        batch_data: {
          type: 'array',
          items: { type: 'object' },
          description: "Si és un batch (ex: 10 posts amb dades dinàmiques), llista d'objectes amb les variables de cada peça",
        },
        notes: { type: 'string', description: 'Instruccions específiques per al dissenyador' },
      },
      required: ['client_slug', 'content_type', 'format'],
    },
  },
  {
    name: 'generate_aftereffects_script',
    description:
      "Agent DIS: genera un script ExtendScript (.jsx) per a Adobe After Effects. Usar per a motion graphics, namestrips animats, grafics de classificació en moviment, bumpers de sponsor i overlays de text animat.",
    input_schema: {
      type: 'object' as const,
      properties: {
        client_slug: { type: 'string' },
        comp_name: { type: 'string', description: "Nom de la composició (ex: 'ASOBAL_NAMESTRIP_J03')" },
        comp_type: {
          type: 'string',
          enum: ['namestrip', 'clasificacion_animada', 'score_overlay', 'sponsor_bumper', 'lower_third', 'custom'],
          description: 'Tipus de composició a crear',
        },
        duration_seconds: { type: 'number', description: 'Durada en segons' },
        format: {
          type: 'string',
          enum: ['reel_9x16', 'post_4x5', 'story_9x16', 'youtube_16x9'],
        },
        text_layers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              text: { type: 'string' },
              font: { type: 'string' },
              size: { type: 'number' },
              color: { type: 'string' },
              position: { type: 'string', enum: ['top', 'center', 'bottom', 'custom'] },
              animation: { type: 'string', enum: ['fade', 'slide_up', 'slide_in', 'scale', 'none'] },
              time_in: { type: 'number' },
              time_out: { type: 'number' },
            },
          },
        },
        sponsor: { type: 'string', description: 'Sponsor per incloure (opcional)' },
        export_preset: { type: 'string', description: "Preset d'exportació (ex: 'H.264 Instagram Reel')" },
        notes: { type: 'string' },
      },
      required: ['client_slug', 'comp_name', 'comp_type', 'format'],
    },
  },
  {
    name: 'detect_and_split_video',
    description:
      "Agent CLIP: usa ffmpeg per detectar talls de plans en un vídeo de resum de partit i dividir-lo en clips individuals. Retorna la llista de clips amb timestamps. Necessita ffmpeg instal·lat al sistema.",
    input_schema: {
      type: 'object' as const,
      properties: {
        video_path: { type: 'string', description: 'Ruta absoluta al vídeo de resum (ex: /Volumes/SSD/ASOBAL/J05/resum.mp4)' },
        output_dir: { type: 'string', description: 'Directori on desar els clips. Si no existeix, es crea automàticament.' },
        threshold: { type: 'number', description: 'Sensibilitat de detecció de talls (0.1=molt sensible, 0.5=menys). Default: 0.3', default: 0.3 },
        min_clip_duration: { type: 'number', description: 'Durada mínima d\'un clip en segons. Default: 4', default: 4 },
        max_clip_duration: { type: 'number', description: 'Durada màxima d\'un clip en segons. Default: 45', default: 45 },
        match_summary: { type: 'string', description: 'Resum del partit en text. Ajuda a identificar quins clips corresponen a gols/aturades.' },
        jornada: { type: 'string', description: "Identificador de jornada (ex: 'J05')" },
        match: { type: 'string', description: "Nom del partit (ex: 'BARA_vs_BIDASOA')" },
      },
      required: ['video_path', 'output_dir'],
    },
  },
  {
    name: 'generate_photoshop_psd_script',
    description:
      "Agent DIS: genera un script ExtendScript (.jsx) per automatitzar HORARIO J1_V3.psd. Mostra el grup de contingut correcte, actualitza text i logos, i exporta el gràfic final com a JPG. L'envia automàticament a Photoshop via Adobe Bridge.",
    input_schema: {
      type: 'object' as const,
      properties: {
        content_type: {
          type: 'string',
          enum: ['FINAL_PARTIDO', 'RESULTADOS_JORNADA', 'HORARIOS', 'MVP', '7_IDEAL', 'CLASIFICACION', 'DECLAS', 'FICHAJE', 'FOTO_JORNADA', 'PROMO_APP', 'PROMO_ASOBAL_TV'],
          description: 'Tipus de contingut a generar. Determina quin grup de capes s\'activa al PSD.',
        },
        jornada: { type: 'string', description: "Número de jornada (ex: 'J05' o '5')" },
        output_path: { type: 'string', description: 'Ruta on exportar el JPG final. Si no s\'especifica, exporta al Desktop.' },
        data: {
          type: 'object',
          description: 'Dades dinàmiques per omplir el template. Depèn del content_type.',
          properties: {
            home_team: { type: 'string', description: "Abreviatura equip local (ex: 'fcb', 'bmg', 'bidasoa', 'nav', 'atl', 'tor', 'ade', 'can', 'cue', 'eon', 'pue', 'psg')" },
            away_team: { type: 'string', description: 'Abreviatura equip visitant' },
            score_home: { type: 'integer', description: 'Gols equip local' },
            score_away: { type: 'integer', description: 'Gols equip visitant' },
            home_team_full: { type: 'string', description: 'Nom complet equip local (ex: FC Barcelona)' },
            away_team_full: { type: 'string', description: 'Nom complet equip visitant' },
            mvp_name: { type: 'string', description: 'Nom del MVP (per MVP)' },
            mvp_club: { type: 'string', description: 'Club del MVP' },
            player_stat: { type: 'string', description: 'Estadística destacada del jugador (ex: 13 GOLES · 76% EFICÀCIA)' },
            matches: {
              type: 'array',
              description: 'Per a RESULTADOS_JORNADA o HORARIOS: llista de partits',
              items: {
                type: 'object',
                properties: {
                  home: { type: 'string' }, away: { type: 'string' },
                  score_home: { type: 'integer' }, score_away: { type: 'integer' },
                  date: { type: 'string' }, time: { type: 'string' },
                }
              }
            },
            quote: { type: 'string', description: 'Per a DECLAS: text de la declaració' },
            quote_author: { type: 'string', description: 'Per a DECLAS: autor de la declaració' },
            player_name: { type: 'string', description: 'Per a FICHAJE: nom del fitxatge' },
            player_from: { type: 'string', description: 'Per a FICHAJE: club d\'origen' },
          }
        },
      },
      required: ['content_type', 'jornada'],
    },
  },
  {
    name: 'trigger_local_agent',
    description:
      "Llança un agent local a l'ordinador de Martí per a tasques que requereixen processament de vídeo, Adobe Creative, o scripts Python locals. Crea una tasca a Supabase que el worker local recollirà i executarà. Usar per: jornada ASOBAL, tallar clips, reencuadrar vídeos, processar imatges amb YOLO, scripts Premiere/AE/Photoshop.",
    input_schema: {
      type: 'object' as const,
      properties: {
        script: {
          type: 'string',
          enum: ['jornada_runner', 'cut_clips', 'vertical_reframe', 'brand_overlay', 'yolo_extract_frames', 'dropbox_upload', 'apply_prompts', 'cut_plays'],
          description: 'Script local a executar',
        },
        title: {
          type: 'string',
          description: 'Descripció breu de la tasca (ex: "Processar jornada J03 ASOBAL")',
        },
        params: {
          type: 'object',
          description: 'Paràmetres específics del script (ex: config JSON per jornada_runner, paths per cut_clips...)',
        },
        client_slug: {
          type: 'string',
          description: 'Client relacionat (ex: asobal)',
        },
      },
      required: ['script', 'title'],
    },
  },
  {
    name: 'update_client_memory',
    description:
      "Agent MEM: actualitza la memòria d'un client a Supabase (standings, estadístiques, jugadors, novetats). Crida'l sempre que hi hagi dades noves d'una jornada o fitxatge per mantenir el context fresc.",
    input_schema: {
      type: 'object' as const,
      properties: {
        client_slug: { type: 'string' },
        update_type: {
          type: 'string',
          enum: ['jornada_resultats', 'fitxatge', 'estadistiques', 'novetats', 'calibracio_kb'],
        },
        data: {
          type: 'object',
          description: 'Dades a actualitzar (format lliure JSON, s\'emmagatzema a briefings)',
        },
        summary: { type: 'string', description: 'Resum en text dels canvis aplicats (màx 500 caràcters)' },
        source: { type: 'string', description: "Font de les dades (ex: 'asobal.es', 'equip Gonzalo', 'DADES agent J03')" },
      },
      required: ['client_slug', 'update_type', 'data', 'summary'],
    },
  },
  {
    name: 'search_dropbox',
    description:
      "Cerca fitxers i carpetes al Dropbox de l'agència (app AGENT GUINEW). Útil per localitzar clips de vídeo, fotos, assets de producció o qualsevol recurs per nom o paraula clau.",
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: "Paraula clau de cerca (ex: 'ASOBAL J03', 'TOP5 GOLES', 'logo NEXUS')" },
        path: { type: 'string', description: "Carpeta on cercar (ex: '/ASOBAL/J03'). Omitir per cercar a tot el Dropbox.", default: '' },
        file_type: {
          type: 'string',
          enum: ['any', 'image', 'video', 'document', 'folder'],
          description: "Filtra per tipus de fitxer",
          default: 'any',
        },
        limit: { type: 'integer', description: 'Màxim de resultats', default: 10 },
      },
      required: ['query'],
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

// ─── TOOL: save_metricool_metrics ────────────────────────────────────────────

const METRICOOL_BRAND_MAP: Record<string, { brandId: number; handle: string }> = {
  'asobal':            { brandId: 6824092, handle: 'asobal' },
  'biwpa':             { brandId: 5525437, handle: 'biwpa' },
  'elite-fut-academy': { brandId: 4286845, handle: 'elitefutacademy' },
}

async function save_metricool_metrics({
  client_slug, platform, period_start, period_end, metrics,
}: ToolInput) {
  const admin = createAdminClient()
  const brand = METRICOOL_BRAND_MAP[client_slug]

  const { data: client } = await admin.from('clients').select('id').eq('slug', client_slug).single()
  if (!client) return { error: `Client '${client_slug}' no trobat` }

  const { data, error } = await admin
    .from('metric_reports')
    .insert({
      client_id: client.id,
      platform: platform ?? 'instagram',
      account_handle: brand?.handle ?? null,
      period_start,
      period_end,
      raw_data: { brand_id: brand?.brandId, metrics, source: 'metricool_mcp' },
      ai_analysis: null,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  return { success: true, report_id: data.id, client_slug, platform, period: `${period_start} → ${period_end}` }
}

// ─── TOOL: search_google_drive ───────────────────────────────────────────────

const MIME_TYPE_MAP: Record<string, string> = {
  spreadsheet: 'application/vnd.google-apps.spreadsheet',
  document: 'application/vnd.google-apps.document',
  presentation: 'application/vnd.google-apps.presentation',
  folder: 'application/vnd.google-apps.folder',
  image: 'image/',
  video: 'video/',
}

async function search_google_drive({ query, file_type = 'any', limit = 10 }: ToolInput) {
  const admin = createAdminClient()

  // Carregar els tokens de Drive de Martí (admin)
  const { data: tokenRow } = await admin
    .from('google_tokens')
    .select('access_token, refresh_token, expiry_date')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!tokenRow) return { error: 'Google Drive no connectat. Cal autoritzar a Settings → Google Drive.' }

  try {
    const oauth = getOAuthClient()
    oauth.setCredentials({
      access_token: tokenRow.access_token,
      refresh_token: tokenRow.refresh_token,
      expiry_date: tokenRow.expiry_date,
    })
    const { token } = await oauth.getAccessToken()
    if (!token) return { error: 'Token de Drive caducat. Reconnecta a Settings.' }

    const drive = getDriveClient({ access_token: token, refresh_token: tokenRow.refresh_token })

    let q = `fullText contains '${query.replace(/'/g, "\\'")}' and trashed = false`
    if (file_type !== 'any' && MIME_TYPE_MAP[file_type]) {
      q += ` and mimeType contains '${MIME_TYPE_MAP[file_type]}'`
    }

    const res = await drive.files.list({
      q,
      fields: 'files(id,name,mimeType,modifiedTime,webViewLink,size)',
      orderBy: 'modifiedTime desc',
      pageSize: limit,
    })

    const files = res.data.files ?? []
    return {
      count: files.length,
      files: files.map(f => ({
        name: f.name,
        type: f.mimeType?.replace('application/vnd.google-apps.', '') ?? f.mimeType,
        modified: f.modifiedTime,
        url: f.webViewLink,
        id: f.id,
      })),
    }
  } catch (err: any) {
    return { error: `Error de Drive: ${err.message}` }
  }
}

// ─── TOOL: generate_premiere_script ──────────────────────────────────────────

const PREMIERE_RESOLUTIONS: Record<string, { w: number; h: number; fps: number }> = {
  reel_9x16:    { w: 1080, h: 1920, fps: 30 },
  post_4x5:     { w: 1080, h: 1350, fps: 30 },
  story_9x16:   { w: 1080, h: 1920, fps: 30 },
  carrusel_1x1: { w: 1080, h: 1080, fps: 30 },
  youtube_16x9: { w: 1920, h: 1080, fps: 30 },
}

const EXPORT_PRESETS: Record<string, string> = {
  instagram_reel: 'H.264 — Instagram 1080p',
  instagram_post: 'H.264 — Instagram 1080p',
  tiktok:         'H.264 — TikTok 1080p',
  youtube:        'H.264 — YouTube 1080p Full HD',
}

async function generate_premiere_script({
  format, sequence_name, duration_seconds = 30, text_overlays = [], export_preset, client_slug, notes,
}: ToolInput) {
  const res = PREMIERE_RESOLUTIONS[format] ?? PREMIERE_RESOLUTIONS.reel_9x16
  const exportName = EXPORT_PRESETS[export_preset ?? 'instagram_reel']

  const overlayCode = (text_overlays as any[]).map((o, i) => `
  // Text overlay ${i + 1}: ${o.text}
  var textClip${i} = seq.videoTracks[1].insertClip(app.project.rootItem.children[0], ${o.time_in ?? 0});
  // Position: ${o.position ?? 'bottom'} | Style: ${o.style ?? 'title'}
  // NOTE: Replace app.project.rootItem.children[0] with the actual title clip
`).join('')

  const script = `// ═══════════════════════════════════════════════════════════
// Guinew AI OS — Script Premiere Pro
// Seqüència: ${sequence_name}
// Client: ${client_slug ?? 'guinew'}
// Format: ${format} (${res.w}×${res.h} @ ${res.fps}fps)
// Generat automàticament per l'Agent Filmmaker
// ═══════════════════════════════════════════════════════════

$.writeln("Iniciant: ${sequence_name}");

// 1. CREAR SEQÜÈNCIA
var seqSettings = {
  videoFrameRate: ${res.fps},
  videoFrameWidth: ${res.w},
  videoFrameHeight: ${res.h},
  videoPixelAspectRatio: 1.0,
  audioSampleRate: 48000,
  audioChannelType: 1,
  audioChannelCount: 2
};

// Mètode recomanat: New Sequence from preset
// Ves a: File → New → Sequence → ${format === 'youtube_16x9' ? 'Digital → 1080p @ 30fps' : 'Digital → Vertical 1080×1920 @ 30fps'}
// Nom: ${sequence_name}

var seq = app.project.activeSequence;
if (!seq) {
  alert("ERROR: Obre o crea primer la seqüència '${sequence_name}'");
} else {
  $.writeln("Seqüència activa: " + seq.name);

  // 2. DURADA TOTAL: ${duration_seconds}s
  // La durada la controla el teu muntatge — assegura que el contingut acaba a ${duration_seconds}s

  // 3. TEXT OVERLAYS
  ${overlayCode || '  // Cap text overlay definit — afegeix-los manualment si cal'}

  // 4. EXPORTACIÓ
  // Quan el muntatge estigui llest:
  // File → Export → Media
  // Preset: ${exportName}
  // Output: ${sequence_name}.mp4
  // Assegura't que "Match Sequence Settings" NO està activat

  $.writeln("✅ Script completat per: ${sequence_name}");
  $.writeln("Exporta com: ${exportName}");
  ${notes ? `$.writeln("NOTES: ${notes.replace(/\n/g, '\\n')}");` : ''}
}
`

  // Guardar a Supabase com a production brief
  const admin = createAdminClient()
  const { data } = await admin
    .from('content_items')
    .insert({
      client_id: null,
      title: `[PREMIERE] ${sequence_name}`,
      format: 'premiere_script',
      channel: 'production',
      notes: `FORMAT: ${format} | ${res.w}×${res.h}\nEXPORT: ${exportName}\n\nSCRIPT:\n${script}`,
      status: 'idea',
    })
    .select('id')
    .single()

  const bridgeFilePath = writeToAdobeBridge('premiere', sequence_name.replace(/\s+/g, '_'), script)

  return {
    success: true,
    sequence_name,
    format,
    resolution: `${res.w}×${res.h} @ ${res.fps}fps`,
    export_preset: exportName,
    script,
    content_id: data?.id,
    bridge_dispatched: !!bridgeFilePath,
    bridge_path: bridgeFilePath,
    instructions: bridgeFilePath
      ? `✅ Script enviat automàticament a Premiere Pro (adobe-bridge). Si el listener està actiu, s'executarà en ≤3s.`
      : `Copia el script i executa'l a Premiere: File → Scripts → Run Script.`,
  }
}

// ─── TOOL: schedule_metricool_post ───────────────────────────────────────────

async function schedule_metricool_post({
  client_slug, platform, post_type, caption, scheduled_date, hashtags, notes_filmmaker, content_id,
}: ToolInput) {
  const admin = createAdminClient()

  const { data: client } = await admin.from('clients').select('id, name').eq('slug', client_slug).single()
  if (!client) return { error: `Client '${client_slug}' no trobat` }

  const hashtagText = hashtags?.length ? '\n\n' + hashtags.map((h: string) => `#${h}`).join(' ') : ''
  const fullCaption = caption + hashtagText

  // Desar el post pendent d'aprovació
  const { data: draft, error } = await admin
    .from('content_items')
    .insert({
      client_id: client.id,
      title: `[${platform.toUpperCase()}] ${post_type} — ${scheduled_date.slice(0, 10)}`,
      format: post_type,
      channel: platform,
      notes: `CAPTION:\n${fullCaption}\n\nNOTES FILMMAKER:\n${notes_filmmaker ?? 'Cap'}`,
      status: 'revisio',
      due_date: scheduled_date.slice(0, 10),
    })
    .select('id, title')
    .single()

  if (error) return { error: error.message }

  // Si hi havia content_id previ, actualitzar-lo
  if (content_id) {
    await admin.from('content_items').update({ status: 'revisio' }).eq('id', content_id)
  }

  return {
    success: true,
    draft_id: draft.id,
    requires_approval: true,
    metricool_ready: {
      platform,
      post_type,
      caption: fullCaption,
      scheduled_date,
      client: client.name,
      notes_filmmaker: notes_filmmaker ?? null,
    },
    message: `Post preparat. Pendent aprovació humana per programar via Metricool el ${scheduled_date}.`,
  }
}

// ─── TOOL: ingest_sports_data ────────────────────────────────────────────────

async function ingest_sports_data({ client_slug, jornada, matches, standings, top_stats, confirmed = false }: ToolInput) {
  const admin = createAdminClient()
  const { data: client } = await admin.from('clients').select('id, name').eq('slug', client_slug).single()
  if (!client) return { error: `Client '${client_slug}' no trobat` }

  const payload = {
    jornada,
    matches: matches ?? [],
    standings: standings ?? [],
    top_stats: top_stats ?? {},
    confirmed,
    ingested_at: new Date().toISOString(),
  }

  const { data: item, error } = await admin
    .from('content_items')
    .insert({
      client_id: client.id,
      title: `[DADES] ${client.name} ${jornada} — Resultats`,
      format: 'jornada_resultats',
      channel: 'datos',
      notes: JSON.stringify(payload),
      status: 'idea',
      due_date: new Date().toISOString().slice(0, 10),
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  const winner = matches?.find((m: any) => (m.score_home ?? 0) !== (m.score_away ?? 0))
  const mvps = matches?.map((m: any) => m.mvp).filter(Boolean) ?? []

  return {
    success: true,
    data_id: item.id,
    jornada,
    matches_count: matches?.length ?? 0,
    confirmed,
    mvps,
    top_team: standings?.[0]?.club ?? null,
    message: `Dades de ${jornada} guardades (${matches?.length ?? 0} partits). Llestes per a CON, FILM i MEM.`,
    next_agents: ['CON', 'FILM', 'MEM'],
  }
}

// ─── TOOL: get_sports_data ───────────────────────────────────────────────────

async function get_sports_data({ client_slug, jornada }: ToolInput) {
  const admin = createAdminClient()
  const { data: client } = await admin.from('clients').select('id').eq('slug', client_slug).single()
  if (!client) return { error: `Client '${client_slug}' no trobat` }

  let query = admin
    .from('content_items')
    .select('id, title, notes, created_at')
    .eq('client_id', client.id)
    .eq('format', 'jornada_resultats')
    .order('created_at', { ascending: false })

  if (jornada) query = query.ilike('title', `%${jornada}%`)

  const { data, error } = await query.limit(1).single()
  if (error || !data) return { error: `No hi ha dades de ${jornada ?? 'cap jornada'} per a ${client_slug}` }

  try {
    const parsed = JSON.parse(data.notes ?? '{}')
    return { success: true, data_id: data.id, retrieved_at: data.created_at, ...parsed }
  } catch {
    return { error: 'Error parsejant les dades guardades' }
  }
}

// ─── TOOL: generate_design_brief ─────────────────────────────────────────────

const FORMAT_DIMENSIONS: Record<string, { px: string; ratio: string }> = {
  post_4x5:     { px: '1080×1350px', ratio: '4:5' },
  story_9x16:   { px: '1080×1920px', ratio: '9:16' },
  carrusel_1x1: { px: '1080×1080px', ratio: '1:1' },
  youtube_16x9: { px: '1920×1080px', ratio: '16:9' },
  banner_web:   { px: '1200×628px',  ratio: '1.91:1' },
}

const SPONSOR_PLACEMENT: Record<string, Record<string, string>> = {
  'NEXUS ENERGÍA':  { default: 'Cantonada inferior dreta — 120px alçada — 20px marge', story_9x16: '80px alçada — safe zone inferior' },
  DECATHLON:        { default: 'Centrat horitzontal inferior — 100px alçada — 3s finals' },
  ARTIPUBLI:        { default: 'Centrat inferior — fons blanc semi-transparent — 3s finals' },
}

async function generate_design_brief({ client_slug, content_type, format, copy, elements, sponsor, tool = 'photoshop', batch_data, notes }: ToolInput) {
  const admin = createAdminClient()
  const { data: client } = await admin.from('clients').select('id, name').eq('slug', client_slug).single()
  if (!client) return { error: `Client '${client_slug}' no trobat` }

  const dims = FORMAT_DIMENSIONS[format] ?? { px: 'Especificar', ratio: '—' }
  const isAsobal = client_slug === 'asobal'

  const brief = {
    client: client.name,
    content_type,
    format,
    dimensions: dims.px,
    aspect_ratio: dims.ratio,
    tool,
    typography: isAsobal
      ? { primary: 'SQUEEZE (MAJÚSCULES)', secondary: 'Montserrat Bold', body: 'Montserrat Regular' }
      : { primary: 'Seguir brand guidelines del client' },
    colors: isAsobal
      ? { text_stories: '#FFFFFF', background: 'Negre o de marca', accent: 'Blau ASOBAL #003087' }
      : { note: 'Consultar brand guidelines del client' },
    copy_layers: copy ?? null,
    visual_elements: elements ?? [],
    sponsor: sponsor ?? null,
    sponsor_placement: sponsor ? (SPONSOR_PLACEMENT[sponsor]?.[format] ?? SPONSOR_PLACEMENT[sponsor]?.default ?? 'Seguir brand guidelines ASOBAL') : null,
    is_batch: !!batch_data,
    batch_count: batch_data?.length ?? null,
    batch_variables: batch_data ?? null,
    notes: notes ?? null,
    resolution: '72dpi (web) — 300dpi si va a impressió',
    color_mode: 'RGB sRGB',
    created_at: new Date().toISOString(),
  }

  const { data: item, error } = await admin
    .from('content_items')
    .insert({
      client_id: client.id,
      title: `[DIS] ${content_type} — ${format}`,
      format: 'design_brief',
      channel: 'production',
      notes: JSON.stringify(brief),
      status: 'idea',
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  return {
    success: true,
    brief_id: item.id,
    brief,
    message: `Brief de disseny creat per a ${tool}. Pendent lliurament al dissenyador.`,
    requires_approval: false,
  }
}

// ─── TOOL: generate_aftereffects_script ──────────────────────────────────────

const AE_RESOLUTIONS: Record<string, [number, number]> = {
  reel_9x16:   [1080, 1920],
  post_4x5:    [1080, 1350],
  story_9x16:  [1080, 1920],
  youtube_16x9:[1920, 1080],
}

async function generate_aftereffects_script({ client_slug, comp_name, comp_type, duration_seconds = 5, format, text_layers = [], sponsor, export_preset, notes }: ToolInput) {
  const admin = createAdminClient()
  const { data: client } = await admin.from('clients').select('id, name').eq('slug', client_slug).single()
  if (!client) return { error: `Client '${client_slug}' no trobat` }

  const [width, height] = AE_RESOLUTIONS[format] ?? [1080, 1920]
  const fps = 30

  const layerCode = text_layers.map((l: any, i: number) => {
    const timeIn = l.time_in ?? 0
    const timeOut = l.time_out ?? duration_seconds
    const color = l.color ? l.color.replace('#', '').match(/.{2}/g)?.map((c: string) => (parseInt(c, 16) / 255).toFixed(3)).join(', ') : '1, 1, 1'
    return `
  // Capa ${i + 1}: ${l.text ?? 'TEXT'}
  var textLayer${i} = comp.layers.addText("${(l.text ?? '').replace(/"/g, '\\"')}");
  var textDoc${i} = textLayer${i}.property("Source Text").value;
  textDoc${i}.font = "${l.font ?? 'Squeeze-Bold'}";
  textDoc${i}.fontSize = ${l.size ?? 72};
  textDoc${i}.fillColor = [${color ?? '1, 1, 1'}];
  textDoc${i}.justification = ParagraphJustification.CENTER_JUSTIFY;
  textLayer${i}.property("Source Text").setValue(textDoc${i});
  textLayer${i}.inPoint = ${timeIn};
  textLayer${i}.outPoint = ${timeOut};`
  }).join('\n')

  const jsx = `// ─── After Effects Script: ${comp_name} ───────────────────────────────────
// Client: ${client.name} | Tipus: ${comp_type} | Format: ${format}
// Generat per Agent DIS — Guinew AI OS
// INSTRUCCIONS: File → Scripts → Run Script → selecciona aquest fitxer
// ─────────────────────────────────────────────────────────────────────────

(function() {
  var proj = app.project;

  // Crear composició
  var comp = proj.items.addComp(
    "${comp_name}",
    ${width}, ${height},   // amplada x alçada
    1,                      // pixel aspect ratio
    ${duration_seconds},    // durada en segons
    ${fps}                  // fps
  );

  app.beginUndoGroup("${comp_name}");
  ${layerCode}

  // Afegir fons negre per defecte
  var solidLayer = comp.layers.addSolid([0, 0, 0], "Fons", ${width}, ${height}, 1, ${duration_seconds});
  solidLayer.moveToEnd();

  app.endUndoGroup();

  // Obrir la composició
  comp.openInViewer();
  alert("✓ Composició '${comp_name}' creada!\\nDurada: ${duration_seconds}s | ${width}x${height} | ${fps}fps\\nNotes: ${notes ?? 'Cap nota addicional'}");
})();`

  const { data: item, error } = await admin
    .from('content_items')
    .insert({
      client_id: client.id,
      title: `[AE] ${comp_name} — ${comp_type}`,
      format: 'aftereffects_script',
      channel: 'production',
      notes: JSON.stringify({ comp_name, comp_type, format, duration_seconds, text_layers, sponsor, export_preset, jsx, notes }),
      status: 'idea',
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  const bridgeFilePath = writeToAdobeBridge('aftereffects', comp_name.replace(/\s+/g, '_'), jsx)

  return {
    success: true,
    script_id: item.id,
    comp_name,
    comp_type,
    format,
    dimensions: `${width}x${height}`,
    duration_seconds,
    jsx_code: jsx,
    bridge_dispatched: !!bridgeFilePath,
    bridge_path: bridgeFilePath,
    message: bridgeFilePath
      ? `✅ Script After Effects '${comp_name}' enviat automàticament (adobe-bridge). Si el listener AE està actiu, la composició es crearà en ≤3s.`
      : `Script After Effects '${comp_name}' generat. Copia el codi i executa'l a AE: File → Scripts → Run Script.`,
  }
}

// ─── TOOL: update_client_memory ──────────────────────────────────────────────

async function update_client_memory({ client_slug, update_type, data, summary, source }: ToolInput) {
  const admin = createAdminClient()
  const { data: client } = await admin.from('clients').select('id, name').eq('slug', client_slug).single()
  if (!client) return { error: `Client '${client_slug}' no trobat` }

  const memoryPayload = {
    update_type,
    data,
    summary,
    source: source ?? 'MEM agent',
    updated_at: new Date().toISOString(),
  }

  // Guardar l'update com a briefing o insight per a futura referència
  const { data: item, error } = await admin
    .from('content_items')
    .insert({
      client_id: client.id,
      title: `[MEM] ${client.name} — ${update_type} — ${new Date().toISOString().slice(0, 10)}`,
      format: 'memory_update',
      channel: 'datos',
      notes: JSON.stringify(memoryPayload),
      status: 'idea',
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  return {
    success: true,
    memory_id: item.id,
    client: client.name,
    update_type,
    summary,
    source,
    message: `Memòria de ${client.name} actualitzada (${update_type}). Context fresc disponible per a tots els agents.`,
  }
}

// ─── TOOL: detect_and_split_video ────────────────────────────────────────────

async function detect_and_split_video({
  video_path, output_dir, threshold = 0.3,
  min_clip_duration = 4, max_clip_duration = 45,
  match_summary, jornada, match,
}: ToolInput) {
  // Check ffmpeg is available
  try { execSync('which ffmpeg', { stdio: 'pipe' }) }
  catch { return { error: 'ffmpeg no instal·lat. Executa: brew install ffmpeg' } }

  if (!fs.existsSync(video_path)) return { error: `Vídeo no trobat: ${video_path}` }

  fs.mkdirSync(output_dir, { recursive: true })

  // Step 1: detect scene changes with ffprobe
  let sceneOutput: string
  try {
    sceneOutput = execSync(
      `ffprobe -v quiet -show_frames -of json -select_streams v ` +
      `-skip_frame nokey -f lavfi "movie=${video_path.replace(/'/g, "\\'")}` +
      `,select='gt(scene,${threshold})'" 2>&1`,
      { maxBuffer: 10 * 1024 * 1024 }
    ).toString()
  } catch {
    // Fallback: use ffmpeg scene detection filter
    try {
      sceneOutput = execSync(
        `ffmpeg -i "${video_path}" -vf "select='gt(scene,${threshold})',showinfo" -f null - 2>&1`,
        { maxBuffer: 10 * 1024 * 1024 }
      ).toString()
    } catch (e: any) {
      return { error: `Error executant ffprobe/ffmpeg: ${e.message?.substring(0, 200)}` }
    }
  }

  // Parse timestamps from ffmpeg showinfo output
  const timeRegex = /pts_time:(\d+\.?\d*)/g
  const timestamps: number[] = [0]
  let m: RegExpExecArray | null
  while ((m = timeRegex.exec(sceneOutput)) !== null) {
    const t = parseFloat(m[1])
    if (t > 0) timestamps.push(t)
  }

  // Get total duration
  let duration = 0
  try {
    const dur = execSync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${video_path}"`,
      { stdio: ['pipe', 'pipe', 'pipe'] }
    ).toString().trim()
    duration = parseFloat(dur)
  } catch {}
  if (duration > 0) timestamps.push(duration)

  // Build clip list filtering by min/max duration
  const clips: { index: number; start: number; end: number; duration: number; path: string }[] = []
  const prefix = match ? match.replace(/\s+/g, '_') : 'clip'
  const baseName = jornada ? `${jornada}_${prefix}` : prefix

  for (let i = 0; i < timestamps.length - 1; i++) {
    const start = timestamps[i]
    const end = timestamps[i + 1]
    const dur = end - start
    if (dur < min_clip_duration || dur > max_clip_duration) continue

    const clipPath = path.join(output_dir, `${baseName}_${String(i + 1).padStart(2, '0')}.mp4`)
    clips.push({ index: i + 1, start: Math.round(start * 10) / 10, end: Math.round(end * 10) / 10, duration: Math.round(dur * 10) / 10, path: clipPath })
  }

  if (clips.length === 0) {
    return {
      error: 'No s\'han detectat talls de plans. Prova amb un threshold més baix (ex: 0.15).',
      video_path, threshold, timestamps_found: timestamps.length,
    }
  }

  // Step 2: extract clips
  const errors: string[] = []
  for (const clip of clips) {
    try {
      execSync(
        `ffmpeg -y -ss ${clip.start} -i "${video_path}" -t ${clip.duration} ` +
        `-c:v libx264 -preset fast -crf 23 -c:a aac -movflags +faststart "${clip.path}" 2>&1`,
        { maxBuffer: 5 * 1024 * 1024 }
      )
    } catch (e: any) {
      errors.push(`Clip ${clip.index}: ${e.message?.substring(0, 100)}`)
    }
  }

  // Step 3: if match_summary provided, tag clips with context
  let taggedClips = clips.map(c => ({ ...c, tags: [] as string[], description: '' }))
  if (match_summary) {
    const words = match_summary.toLowerCase()
    taggedClips = taggedClips.map(c => {
      const tags: string[] = []
      if (words.includes('gol') || words.includes('goal')) tags.push('gol')
      if (words.includes('parada') || words.includes('aturada') || words.includes('save')) tags.push('parada')
      if (words.includes('penalt')) tags.push('penal')
      return { ...c, tags }
    })
  }

  return {
    success: true,
    video_path,
    total_clips: clips.length,
    clips: taggedClips,
    output_dir,
    errors: errors.length > 0 ? errors : undefined,
    next_step: `Tens ${clips.length} clips a ${output_dir}. Usa l'agent CLIP per seleccionar els millors per a Top 5 Gols i Top 5 Parades.`,
  }
}

// ─── TOOL: generate_photoshop_psd_script ─────────────────────────────────────

const PSD_PATH = "/Volumes/SSDMRG/CLIENTS ACTUALS/ASOBAL/DISEÑOS/01PSD/HORARIO J1_V3.psd"
const LOGOS_PATH = "/Volumes/SSDMRG/CLIENTS ACTUALS/ASOBAL/CLUBES"

// Mapping: team slug → layer names used in the PSD
const TEAM_LAYER_MAP: Record<string, string[]> = {
  fcb:     ['fcb', 'BARA', 'fcb copia', 'BARA copia', 'BARA copia 2'],
  bmg:     ['bmg', 'BM GRANOLLERS', 'bmg copia', 'BM GRANOLLERS copia', 'BM GRANOLLERS copia 2'],
  bidasoa: ['bidasoa', 'BIDASOA IRUN', 'bidasoa copia', 'BIDASOA IRUN copia', 'BIDASOA IRUN copia 2'],
  nav:     ['nav', 'BM NAVA', 'nav copia', 'BM NAVA copia', 'BM NAVA copia 2'],
  atl:     ['atl', 'AT. VALLADOLID', 'AT VALLADOLID', 'atl copia', 'AT. VALLADOLID copia 2'],
  tor:     ['tor', 'BM TORRELAVEGA', 'tor copia', 'BM TORRELAVEGA copia 2'],
  ade:     ['ade', 'ADEMAR LEON', 'ade copia', 'ADEMAR LEON copia 2'],
  can:     ['can', 'CANGAS', 'can copia', 'CANGAS copia 2'],
  cue:     ['cue', 'CUENCA', 'cue copia 2'],
  eon:     ['eon', 'EON ALICANTE', 'club156', 'club156 copia', 'EON ALICANTE copia 2'],
  pue:     ['pue', 'PUENTE GENIL', 'pue copia', 'PUENTE GENIL copia 2'],
  psg:     ['psg', 'PSG', 'psg copia', 'psg copia 2'],
  vda:     ['VDA', 'AT VALLADOLD', 'vda copia'],
  ara:     ['ara', 'ARANDA', 'ara copia', 'ARANDA copia 2'],
  proin:   ['PROIN', 'PROIN copia 2'],
  club22:  ['club22', 'club22 copia'],
  club157: ['club157', 'club157 copia'],
  club158: ['club158', 'club158 copia'],
}

// Groups visible per content_type
const PSD_GROUP_MAP: Record<string, string> = {
  FOTO_JORNADA:     'FOTO DE LA JORNADA',
  PROMO_APP:        'PROMO APP',
  PROMO_ASOBAL_TV:  'PROMO ASOBAL TV',
  HORARIOS:         'HORARIOS',
  DECLAS:           'DECLAS',
  RESULTADOS_JORNADA: 'RESULTADOS JORNADA',
  FINAL_PARTIDO:    'FINAL PARTIDO',
  FICHAJE:          'FICHAJE',
  '7_IDEAL':        '7 IDEAL',
  MVP:              'MVP',
  CLASIFICACION:    'CLASIFICACIÓN',
}

async function generate_photoshop_psd_script({ content_type, jornada, output_path, data = {} }: ToolInput) {
  const groupName = PSD_GROUP_MAP[content_type]
  if (!groupName) return { error: `content_type '${content_type}' no reconegut` }

  const allGroups = Object.values(PSD_GROUP_MAP)

  // Build hide-all + show-one logic
  const groupVisibility = allGroups.map(g =>
    `  setGroupVisible(doc, "${g}", ${g === groupName ? 'true' : 'false'});`
  ).join('\n')

  // Build team logo visibility (show correct, hide rest)
  const homeSlug = (data.home_team ?? '').toLowerCase()
  const awaySlug = (data.away_team ?? '').toLowerCase()

  const homeLayerNames = TEAM_LAYER_MAP[homeSlug] ?? []
  const awayLayerNames = TEAM_LAYER_MAP[awaySlug] ?? []
  const allTeamLayers = [...new Set(Object.values(TEAM_LAYER_MAP).flat())]

  const teamLogic = allTeamLayers.map(ln => {
    const isHome = homeLayerNames.includes(ln)
    const isAway = awayLayerNames.includes(ln)
    return `  setLayerVisible(doc, "${ln.replace(/"/g, '\\"')}", ${isHome || isAway ? 'true' : 'false'});`
  }).join('\n')

  const outputFile = output_path ?? `/Users/martiruiz/Desktop/ASOBAL_${content_type}_${jornada}_${Date.now()}.jpg`

  const score_home = data.score_home ?? 0
  const score_away = data.score_away ?? 0

  const jsx = `// Guinew AI OS — ASOBAL PSD Automation
// Generated: ${new Date().toISOString()}
// Content: ${content_type} · ${jornada}
#target photoshop

var psdPath = "${PSD_PATH.replace(/\\/g, '\\\\')}";
var outputPath = "${outputFile.replace(/\\/g, '\\\\')}";

// ── Helpers ──────────────────────────────────────────────────────────────────
function setGroupVisible(doc, groupName, visible) {
  try {
    for (var i = 0; i < doc.layerSets.length; i++) {
      if (doc.layerSets[i].name === groupName) {
        doc.layerSets[i].visible = visible;
        return true;
      }
    }
  } catch(e) {}
  return false;
}

function setLayerVisible(doc, layerName, visible) {
  function searchLayers(layers) {
    for (var i = 0; i < layers.length; i++) {
      var l = layers[i];
      if (l.name === layerName) { l.visible = visible; return true; }
      if (l.typename === 'LayerSet') { if (searchLayers(l.layers)) return true; }
    }
    return false;
  }
  searchLayers(doc.layers);
}

function setTextLayer(doc, layerName, newText) {
  function searchAndSet(layers) {
    for (var i = 0; i < layers.length; i++) {
      var l = layers[i];
      if (l.name === layerName && l.kind === LayerKind.TEXT) {
        l.textItem.contents = String(newText);
        return true;
      }
      if (l.typename === 'LayerSet') { if (searchAndSet(l.layers)) return true; }
    }
    return false;
  }
  searchAndSet(doc.layers);
}

// ── Main ─────────────────────────────────────────────────────────────────────
var doc = app.open(new File(psdPath));

// 1. Show only the target group
${groupVisibility}

// 2. Update jornada text
setTextLayer(doc, "JORNADA 1", "${jornada}");
setTextLayer(doc, "JORNADA 2", "${jornada}");

// 3. Update score (FINAL_PARTIDO / RESULTADOS)
${content_type === 'FINAL_PARTIDO' || content_type === 'RESULTADOS_JORNADA' ? `
setTextLayer(doc, "MARCADOR", "${score_home} - ${score_away}");
setTextLayer(doc, "27", "${score_home}");
setTextLayer(doc, "33", "${score_away}");
setTextLayer(doc, "32", "${score_home}");
` : '// No score update for this content type'}

// 4. Update team names
${data.home_team_full ? `setTextLayer(doc, "EQUIPOS", "${data.home_team_full} - ${data.away_team_full ?? ''}");` : ''}
${data.mvp_name ? `setTextLayer(doc, "ADRIË FIGUERAS", "${data.mvp_name}");` : ''}
${data.player_stat ? `setTextLayer(doc, "13 GOLES á 76% EFICACIA", "${data.player_stat}");` : ''}
${data.quote ? `setTextLayer(doc, "SERç UN PARTIDO MUY DIFêCIL", "${data.quote}");` : ''}
${data.quote_author ? `setTextLayer(doc, "El Puente Genil es un equipo mu", "${data.quote_author}");` : ''}

// 5. Show correct team logos (hide all others)
${teamLogic}

// 6. Export as JPG
var jpgFile = new File(outputPath);
var jpgOptions = new JPEGSaveOptions();
jpgOptions.quality = 12;
jpgOptions.formatOptions = FormatOptions.STANDARDBASELINE;
doc.saveAs(jpgFile, jpgOptions, true, Extension.LOWERCASE);

// 7. Alert and close
alert("✅ Guinew AI OS\\nExportat: " + outputPath);
doc.close(SaveOptions.DONOTSAVECHANGES);
`

  const bridgeFilePath = writeToAdobeBridge('photoshop', `ASOBAL_${content_type}_${jornada}`, jsx)

  return {
    success: true,
    content_type,
    jornada,
    home_team: homeSlug || null,
    away_team: awaySlug || null,
    output_path: outputFile,
    script: jsx,
    bridge_dispatched: !!bridgeFilePath,
    bridge_path: bridgeFilePath,
    instructions: bridgeFilePath
      ? `✅ Script enviat a Photoshop via Adobe Bridge. Si el listener està actiu, s'executarà en ≤3s.`
      : `Copia el script i executa'l a Photoshop: Fitxer → Scripts → Examinar.`,
  }
}

// ─── TOOL: search_dropbox ────────────────────────────────────────────────────

const DROPBOX_MIME_FILTER: Record<string, string[]> = {
  image: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic'],
  video: ['.mp4', '.mov', '.avi', '.mkv', '.mxf', '.prproj'],
  document: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.md'],
  folder: [],
}

async function search_dropbox({ query, path = '', file_type = 'any', limit = 10 }: ToolInput) {
  const token = process.env.DROPBOX_ACCESS_TOKEN
  if (!token) return { error: 'DROPBOX_ACCESS_TOKEN no configurat a .env.local' }

  const body: Record<string, any> = {
    query,
    options: {
      path: path || '',
      max_results: Math.min(limit, 50),
      file_status: 'active',
    },
  }

  if (file_type === 'folder') {
    body.options.file_categories = [{ '.tag': 'folder' }]
  } else if (file_type !== 'any') {
    body.options.file_categories = [{ '.tag': file_type }]
  }

  const res = await fetch('https://api.dropboxapi.com/2/files/search_v2', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    return { error: `Dropbox API error ${res.status}: ${err}` }
  }

  const data = await res.json()
  const matches = (data.matches ?? []).slice(0, limit)

  const extensions = DROPBOX_MIME_FILTER[file_type] ?? []
  const files = matches
    .map((m: any) => m.metadata?.metadata)
    .filter(Boolean)
    .filter((f: any) => {
      if (extensions.length === 0) return true
      return extensions.some((ext) => f.name?.toLowerCase().endsWith(ext))
    })
    .map((f: any) => ({
      name: f.name,
      path: f.path_display,
      type: f['.tag'],
      size: f.size ? `${Math.round(f.size / 1024)}KB` : null,
      modified: f.client_modified ?? f.server_modified ?? null,
    }))

  return { count: files.length, query, files }
}

// ─── TOOL: trigger_local_agent ────────────────────────────────────────────────

async function trigger_local_agent({ script, title, params = {}, client_slug }: ToolInput) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('agent_runs')
    .insert({
      agent_id: script,
      dept_id: 'local',
      title,
      client_slug: client_slug ?? null,
      status: 'pending',
      current_step: `Esperant worker local: ${script}`,
      draft_content: { script, params },
    })
    .select()
    .single()

  if (error) return { error: error.message }

  return {
    ok: true,
    run_id: data.id,
    message: `✓ Tasca local creada: "${title}". El worker a l'ordinador de Martí l'executarà en el proper cicle de polling (cada 30s). Script: ${script}`,
    params_summary: Object.keys(params).length ? Object.keys(params).join(', ') : 'cap',
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
  save_metricool_metrics,
  schedule_metricool_post,
  search_google_drive,
  generate_premiere_script,
  search_dropbox,
  ingest_sports_data,
  get_sports_data,
  generate_design_brief,
  generate_aftereffects_script,
  detect_and_split_video,
  generate_photoshop_psd_script,
  trigger_local_agent,
  update_client_memory,
}

export async function executeTool(name: string, input: ToolInput): Promise<string> {
  const executor = EXECUTORS[name]
  if (!executor) return JSON.stringify({ error: `Tool '${name}' no implementada` })
  const result = await executor(input)
  return JSON.stringify(result)
}
