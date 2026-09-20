-- ============================================================
-- Migration 013: Capa AI — taules + detectors semàntics
-- Executar al SQL Editor del dashboard de Supabase
-- Totalment additiva: no modifica cap taula existent
-- ============================================================

-- ── ai_runs ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_runs (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger          text        NOT NULL CHECK (trigger IN ('cron','manual','webhook')),
  detectors_run    text[]      NOT NULL DEFAULT '{}',
  insights_created integer     NOT NULL DEFAULT 0,
  duration_ms      integer,
  status           text        NOT NULL DEFAULT 'running' CHECK (status IN ('running','completed','failed')),
  error            text,
  started_at       timestamptz NOT NULL DEFAULT now(),
  completed_at     timestamptz
);

CREATE INDEX IF NOT EXISTS ai_runs_started_at_idx ON public.ai_runs (started_at DESC);

-- ── ai_insights ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_insights (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  type        text        NOT NULL CHECK (type IN (
                'overdue_tasks','blocked_tasks','projects_at_risk',
                'clients_at_risk','stale_opportunities',
                'opportunities_without_next_step','sessions_without_preparation',
                'overdue_content','unresolved_meetings','business_anomalies'
              )),
  severity    text        NOT NULL CHECK (severity IN ('info','warning','critical')),
  entity_type text        CHECK (entity_type IN ('client','project','task','opportunity')),
  entity_id   uuid,
  title       text        NOT NULL,
  summary     text        NOT NULL DEFAULT '',
  evidence    jsonb       NOT NULL DEFAULT '{}'::jsonb,
  resolved    boolean     NOT NULL DEFAULT false,
  resolved_at timestamptz,
  source      text        NOT NULL DEFAULT 'detector' CHECK (source IN ('detector','llm','manual')),
  run_id      uuid        REFERENCES public.ai_runs(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_insights_entity_idx     ON public.ai_insights (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS ai_insights_unresolved_idx ON public.ai_insights (resolved, severity) WHERE resolved = false;
CREATE INDEX IF NOT EXISTS ai_insights_type_idx       ON public.ai_insights (type);
CREATE INDEX IF NOT EXISTS ai_insights_run_id_idx     ON public.ai_insights (run_id);

-- ── ai_recommendations ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_recommendations (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_id       uuid        NOT NULL REFERENCES public.ai_insights(id) ON DELETE CASCADE,
  action_type      text        NOT NULL,
  title            text        NOT NULL,
  rationale        text        NOT NULL DEFAULT '',
  payload          jsonb       NOT NULL DEFAULT '{}'::jsonb,
  requires_approval boolean    NOT NULL DEFAULT true,
  status           text        NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','approved','rejected','executed','failed')),
  approved_by      uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_recommendations_insight_idx ON public.ai_recommendations (insight_id);
CREATE INDEX IF NOT EXISTS ai_recommendations_status_idx  ON public.ai_recommendations (status) WHERE status = 'pending';

-- ── ai_actions ────────────────────────────────────────────────
-- Immutable audit log: no updated_at, no UPDATE/DELETE
CREATE TABLE IF NOT EXISTS public.ai_actions (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id uuid        NOT NULL REFERENCES public.ai_recommendations(id) ON DELETE RESTRICT,
  action_type       text        NOT NULL,
  executed_payload  jsonb       NOT NULL DEFAULT '{}'::jsonb,
  result            jsonb,
  success           boolean     NOT NULL,
  error_message     text,
  executed_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_actions_recommendation_idx ON public.ai_actions (recommendation_id);
CREATE INDEX IF NOT EXISTS ai_actions_executed_at_idx    ON public.ai_actions (executed_at DESC);

-- ============================================================
-- updated_at triggers
-- ============================================================

DO $$ BEGIN
  CREATE TRIGGER ai_insights_updated_at
    BEFORE UPDATE ON public.ai_insights
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER ai_recommendations_updated_at
    BEFORE UPDATE ON public.ai_recommendations
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE public.ai_runs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_actions         ENABLE ROW LEVEL SECURITY;

-- ai_runs: només superadmin pot llegir; escriptura via service_role
CREATE POLICY "ai_runs: superadmin read"
  ON public.ai_runs FOR SELECT TO authenticated
  USING (get_user_role() = 'superadmin');

-- ai_insights: superadmin i manager llegeixen; service_role escriu
CREATE POLICY "ai_insights: managers read"
  ON public.ai_insights FOR SELECT TO authenticated
  USING (get_user_role() IN ('superadmin','manager'));

CREATE POLICY "ai_insights: superadmin update"
  ON public.ai_insights FOR UPDATE TO authenticated
  USING (get_user_role() = 'superadmin')
  WITH CHECK (get_user_role() = 'superadmin');

-- ai_recommendations: managers llegeixen i poden aprovar/rebutjar
CREATE POLICY "ai_recommendations: managers read"
  ON public.ai_recommendations FOR SELECT TO authenticated
  USING (get_user_role() IN ('superadmin','manager'));

CREATE POLICY "ai_recommendations: managers update status"
  ON public.ai_recommendations FOR UPDATE TO authenticated
  USING (get_user_role() IN ('superadmin','manager'))
  WITH CHECK (get_user_role() IN ('superadmin','manager'));

-- ai_actions: immutable — managers llegeixen, ningú escriu via client
CREATE POLICY "ai_actions: managers read"
  ON public.ai_actions FOR SELECT TO authenticated
  USING (get_user_role() IN ('superadmin','manager'));

-- ============================================================
-- Detector functions (deterministes, sense LLM)
-- Cada funció retorna files per inserir a ai_insights
-- ============================================================

-- Detector 1: tasques vençudes
CREATE OR REPLACE FUNCTION public.detect_overdue_tasks()
RETURNS TABLE (
  entity_type text, entity_id uuid, title text, evidence jsonb, severity text
) LANGUAGE sql STABLE AS $$
  SELECT
    'task'::text,
    t.id,
    'Tasca vençuda: ' || t.title,
    jsonb_build_object(
      'task_id',     t.id,
      'task_title',  t.title,
      'due_date',    t.due_date,
      'days_overdue', EXTRACT(day FROM now() - t.due_date)::int,
      'project_id',  t.project_id,
      'responsible_id', t.responsible_id
    ),
    CASE
      WHEN t.due_date < now() - interval '7 days' THEN 'critical'
      ELSE 'warning'
    END
  FROM public.tasks t
  WHERE t.due_date IS NOT NULL
    AND t.due_date < now()
    AND t.status NOT IN ('done','cancelled')
$$;

-- Detector 2: tasques bloquejades > 48h
CREATE OR REPLACE FUNCTION public.detect_blocked_tasks()
RETURNS TABLE (
  entity_type text, entity_id uuid, title text, evidence jsonb, severity text
) LANGUAGE sql STABLE AS $$
  SELECT
    'task'::text,
    t.id,
    'Tasca bloquejada: ' || t.title,
    jsonb_build_object(
      'task_id',       t.id,
      'task_title',    t.title,
      'blocked_since', t.updated_at,
      'hours_blocked', EXTRACT(epoch FROM now() - t.updated_at)::int / 3600,
      'project_id',    t.project_id
    ),
    'warning'::text
  FROM public.tasks t
  WHERE t.status = 'blocked'
    AND t.updated_at < now() - interval '48 hours'
$$;

-- Detector 3: projectes en risc (>30% tasques vençudes o deadline proper)
CREATE OR REPLACE FUNCTION public.detect_projects_at_risk()
RETURNS TABLE (
  entity_type text, entity_id uuid, title text, evidence jsonb, severity text
) LANGUAGE sql STABLE AS $$
  WITH task_stats AS (
    SELECT
      project_id,
      COUNT(*) FILTER (WHERE status NOT IN ('done','cancelled')) AS total,
      COUNT(*) FILTER (
        WHERE status NOT IN ('done','cancelled')
          AND due_date IS NOT NULL
          AND due_date < now()
      ) AS overdue
    FROM public.tasks
    WHERE project_id IS NOT NULL
    GROUP BY project_id
  )
  SELECT
    'project'::text,
    p.id,
    'Projecte en risc: ' || p.name,
    jsonb_build_object(
      'project_id',      p.id,
      'project_name',    p.name,
      'deadline',        p.deadline,
      'total_tasks',     COALESCE(ts.total, 0),
      'overdue_tasks',   COALESCE(ts.overdue, 0),
      'overdue_pct',     CASE WHEN ts.total > 0 THEN ROUND((ts.overdue::numeric / ts.total) * 100) ELSE 0 END,
      'days_to_deadline', CASE WHEN p.deadline IS NOT NULL THEN EXTRACT(day FROM p.deadline::timestamptz - now())::int END
    ),
    CASE
      WHEN p.deadline IS NOT NULL AND p.deadline::timestamptz < now() THEN 'critical'
      WHEN COALESCE(ts.overdue, 0)::numeric / NULLIF(COALESCE(ts.total, 0), 0) > 0.5 THEN 'critical'
      ELSE 'warning'
    END
  FROM public.projects p
  LEFT JOIN task_stats ts ON ts.project_id = p.id
  WHERE p.status NOT IN ('completed','cancelled')
    AND (
      (p.deadline IS NOT NULL AND p.deadline::timestamptz < now() + interval '7 days')
      OR (ts.total > 0 AND (ts.overdue::numeric / ts.total) > 0.3)
    )
$$;

-- Detector 4: clients en risc
CREATE OR REPLACE FUNCTION public.detect_clients_at_risk()
RETURNS TABLE (
  entity_type text, entity_id uuid, title text, evidence jsonb, severity text
) LANGUAGE sql STABLE AS $$
  SELECT
    'client'::text,
    c.id,
    'Client en risc: ' || c.name,
    jsonb_build_object(
      'client_id',   c.id,
      'client_name', c.name,
      'health',      c.health,
      'status',      c.status
    ),
    CASE WHEN c.health = 'risk' THEN 'critical' ELSE 'warning' END
  FROM public.clients c
  WHERE c.status = 'active'
    AND c.health IN ('attention','risk')
$$;

-- Detector 5: oportunitats estancades > 14 dies
CREATE OR REPLACE FUNCTION public.detect_stale_opportunities()
RETURNS TABLE (
  entity_type text, entity_id uuid, title text, evidence jsonb, severity text
) LANGUAGE sql STABLE AS $$
  SELECT
    'opportunity'::text,
    o.id,
    'Oportunitat estancada: ' || o.client_name,
    jsonb_build_object(
      'opportunity_id',   o.id,
      'client_name',      o.client_name,
      'stage',            o.stage,
      'value',            o.value,
      'last_updated',     o.updated_at,
      'days_stale',       EXTRACT(day FROM now() - o.updated_at)::int
    ),
    'warning'::text
  FROM public.opportunities o
  WHERE o.status NOT IN ('won','lost')
    AND o.updated_at < now() - interval '14 days'
$$;

-- Detector 6: oportunitats sense next step
CREATE OR REPLACE FUNCTION public.detect_opportunities_without_next_step()
RETURNS TABLE (
  entity_type text, entity_id uuid, title text, evidence jsonb, severity text
) LANGUAGE sql STABLE AS $$
  SELECT
    'opportunity'::text,
    o.id,
    'Sense next step: ' || o.client_name,
    jsonb_build_object(
      'opportunity_id', o.id,
      'client_name',    o.client_name,
      'stage',          o.stage,
      'value',          o.value
    ),
    'warning'::text
  FROM public.opportunities o
  WHERE (o.next_step IS NULL OR TRIM(o.next_step) = '')
    AND o.status NOT IN ('won','lost')
    AND o.stage NOT IN ('prospect')
$$;

-- Detector 7: sessions properes sense briefing
CREATE OR REPLACE FUNCTION public.detect_sessions_without_preparation()
RETURNS TABLE (
  entity_type text, entity_id uuid, title text, evidence jsonb, severity text
) LANGUAGE sql STABLE AS $$
  SELECT
    'client'::text,
    s.client_id,
    'Sessió sense preparació: ' || COALESCE(c.name, s.client_id::text),
    jsonb_build_object(
      'session_id',   s.id,
      'client_id',    s.client_id,
      'client_name',  c.name,
      'session_date', s.date,
      'has_briefing', EXISTS (
        SELECT 1 FROM public.briefings b
        WHERE b.client_id = s.client_id
          AND b.created_at > now() - interval '7 days'
          AND COALESCE(b.content, '') != ''
      )
    ),
    'warning'::text
  FROM public.check_sessions s
  LEFT JOIN public.clients c ON c.id = s.client_id
  WHERE s.date IS NOT NULL
    AND s.date::timestamptz BETWEEN now() AND now() + interval '48 hours'
    AND NOT EXISTS (
      SELECT 1 FROM public.briefings b
      WHERE b.client_id = s.client_id
        AND b.created_at > now() - interval '7 days'
        AND COALESCE(b.content, '') != ''
    )
$$;

-- Detector 8: contingut publicable vençut
CREATE OR REPLACE FUNCTION public.detect_overdue_content()
RETURNS TABLE (
  entity_type text, entity_id uuid, title text, evidence jsonb, severity text
) LANGUAGE sql STABLE AS $$
  SELECT
    'client'::text,
    ci.client_id,
    'Contingut vençut: ' || COALESCE(ci.title, ci.platform),
    jsonb_build_object(
      'content_id',      ci.id,
      'client_id',       ci.client_id,
      'platform',        ci.platform,
      'scheduled_date',  ci.scheduled_date,
      'days_overdue',    EXTRACT(day FROM now() - ci.scheduled_date::timestamptz)::int,
      'status',          ci.status
    ),
    'warning'::text
  FROM public.content_items ci
  WHERE ci.scheduled_date IS NOT NULL
    AND ci.scheduled_date::timestamptz < now()
    AND ci.status NOT IN ('published','cancelled')
$$;

-- Detector 9: reunions passades sense notes o action items
CREATE OR REPLACE FUNCTION public.detect_unresolved_meetings()
RETURNS TABLE (
  entity_type text, entity_id uuid, title text, evidence jsonb, severity text
) LANGUAGE sql STABLE AS $$
  SELECT
    'client'::text,
    m.client_id,
    'Reunió sense notes: ' || COALESCE(m.title, 'Reunió ' || to_char(m.date, 'DD/MM')),
    jsonb_build_object(
      'meeting_id',    m.id,
      'client_id',     m.client_id,
      'meeting_title', m.title,
      'meeting_date',  m.date,
      'has_notes',     COALESCE(m.notes, '') != '',
      'has_actions',   COALESCE(m.action_items, '') != ''
    ),
    'info'::text
  FROM public.meetings m
  WHERE m.date IS NOT NULL
    AND m.date < now()
    AND m.date > now() - interval '7 days'
    AND (
      COALESCE(m.notes, '') = ''
      OR COALESCE(m.action_items, '') = ''
    )
$$;

-- Detector 10: anomalies de negoci (0 activitat en 7 dies)
CREATE OR REPLACE FUNCTION public.detect_business_anomalies()
RETURNS TABLE (
  entity_type text, entity_id uuid, title text, evidence jsonb, severity text
) LANGUAGE sql STABLE AS $$
  WITH recent_activity AS (
    SELECT COUNT(*) AS cnt
    FROM public.activity_logs
    WHERE created_at > now() - interval '7 days'
  )
  SELECT
    NULL::text,
    NULL::uuid,
    'Sense activitat registrada en 7 dies',
    jsonb_build_object(
      'activity_count_7d', (SELECT cnt FROM recent_activity),
      'checked_at',        now()
    ),
    'critical'::text
  WHERE (SELECT cnt FROM recent_activity) = 0
$$;
