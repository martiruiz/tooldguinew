-- Agent runs: tracks each agent execution with real-time logs and approval checkpoints

CREATE TABLE IF NOT EXISTS agent_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id TEXT NOT NULL,
  dept_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running'
    CHECK (status IN ('running','awaiting_approval','completed','failed','cancelled')),
  title TEXT,
  current_step TEXT,
  draft_content JSONB,
  client_slug TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS agent_run_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
  level TEXT NOT NULL DEFAULT 'info'
    CHECK (level IN ('info','step','tool','warning','error','checkpoint')),
  message TEXT NOT NULL,
  data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índexs per a polling ràpid
CREATE INDEX IF NOT EXISTS agent_runs_status_idx ON agent_runs(status);
CREATE INDEX IF NOT EXISTS agent_runs_updated_idx ON agent_runs(updated_at DESC);
CREATE INDEX IF NOT EXISTS agent_run_logs_run_idx ON agent_run_logs(run_id, created_at DESC);

-- RLS
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_run_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage agent_runs"
  ON agent_runs FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage agent_run_logs"
  ON agent_run_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Trigger: updated_at automàtic
CREATE OR REPLACE FUNCTION update_agent_runs_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agent_runs_updated_at
  BEFORE UPDATE ON agent_runs
  FOR EACH ROW EXECUTE FUNCTION update_agent_runs_updated_at();

-- Realtime: habilitar subscripcions
ALTER PUBLICATION supabase_realtime ADD TABLE agent_runs;
ALTER PUBLICATION supabase_realtime ADD TABLE agent_run_logs;
