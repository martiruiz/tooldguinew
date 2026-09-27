-- Agent Documents: assets generats pels agents IA
CREATE TABLE IF NOT EXISTS agent_documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  content       TEXT NOT NULL,
  agent_id      TEXT NOT NULL,
  agent_name    TEXT NOT NULL,
  client_id     UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name   TEXT,
  doc_type      TEXT DEFAULT 'contingut',
  created_by    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE agent_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_documents_select" ON agent_documents
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "agent_documents_insert" ON agent_documents
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "agent_documents_delete" ON agent_documents
  FOR DELETE USING (auth.uid() = created_by);
