-- Migration 016: Historial de converses de l'Orchestrator
-- Desa els missatges de xat per agent per mantenir context entre sessions

CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ai_conversations_agent_id_idx ON ai_conversations(agent_id, created_at DESC);

ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read conversations"
  ON ai_conversations FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert conversations"
  ON ai_conversations FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Service role full access"
  ON ai_conversations FOR ALL TO service_role USING (true);
