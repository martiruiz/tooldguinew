-- ============================================================
-- Migration 018: Agent runs — taules per monitoritzar agents
-- ============================================================

CREATE TABLE IF NOT EXISTS public.agent_runs (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id       text        NOT NULL,
  dept_id        text        NOT NULL,
  status         text        NOT NULL DEFAULT 'running'
                   CHECK (status IN ('running','awaiting_approval','completed','failed','cancelled')),
  title          text,
  current_step   text,
  draft_content  jsonb,
  client_slug    text,
  started_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  completed_at   timestamptz
);

CREATE INDEX IF NOT EXISTS agent_runs_status_idx    ON public.agent_runs (status) WHERE status IN ('running','awaiting_approval');
CREATE INDEX IF NOT EXISTS agent_runs_agent_idx     ON public.agent_runs (agent_id);
CREATE INDEX IF NOT EXISTS agent_runs_updated_idx   ON public.agent_runs (updated_at DESC);

CREATE TABLE IF NOT EXISTS public.agent_run_logs (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id     uuid        NOT NULL REFERENCES public.agent_runs(id) ON DELETE CASCADE,
  level      text        NOT NULL DEFAULT 'info'
               CHECK (level IN ('info','step','tool','warning','error','checkpoint')),
  message    text        NOT NULL,
  data       jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_run_logs_run_idx ON public.agent_run_logs (run_id, created_at);

-- updated_at trigger
DO $$ BEGIN
  CREATE TRIGGER agent_runs_updated_at
    BEFORE UPDATE ON public.agent_runs
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RLS
ALTER TABLE public.agent_runs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_run_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_runs: managers read"
  ON public.agent_runs FOR SELECT TO authenticated
  USING (get_user_role() IN ('superadmin','manager'));

CREATE POLICY "agent_run_logs: managers read"
  ON public.agent_run_logs FOR SELECT TO authenticated
  USING (get_user_role() IN ('superadmin','manager'));
