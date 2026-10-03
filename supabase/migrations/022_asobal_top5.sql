-- Migration 022: Taula asobal_top5 per guardar l'ordre del Top 5 parades/gols per jornada
-- Compartida entre tots els usuaris (sense user_id)

CREATE TABLE IF NOT EXISTS asobal_top5 (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jornada     INTEGER NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('gol', 'aturada')),
  slots       JSONB NOT NULL DEFAULT '[]',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (jornada, type)
);

-- RLS: tots els usuaris autenticats poden llegir i escriure
ALTER TABLE asobal_top5 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "asobal_top5_select" ON asobal_top5
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "asobal_top5_insert" ON asobal_top5
  FOR INSERT TO authenticated WITH CHECK (TRUE);

CREATE POLICY "asobal_top5_update" ON asobal_top5
  FOR UPDATE TO authenticated USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "asobal_top5_delete" ON asobal_top5
  FOR DELETE TO authenticated USING (TRUE);

-- Habilita realtime
ALTER PUBLICATION supabase_realtime ADD TABLE asobal_top5;
