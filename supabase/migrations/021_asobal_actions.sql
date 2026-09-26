-- Migration 021: Taula asobal_actions per compartir gols/aturades entre usuaris

CREATE TABLE IF NOT EXISTS asobal_actions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_key   TEXT NOT NULL,          -- ex: 'j2_m3'
  type        TEXT NOT NULL CHECK (type IN ('gol', 'aturada')),
  equip       TEXT NOT NULL,
  jugador     TEXT NOT NULL,
  minut       TEXT NOT NULL DEFAULT '',
  top5        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Index per fer les consultes per jornada ràpides
CREATE INDEX IF NOT EXISTS asobal_actions_match_key_idx ON asobal_actions(match_key);

-- RLS: tots els usuaris autenticats poden llegir i escriure
ALTER TABLE asobal_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "asobal_actions_select" ON asobal_actions
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "asobal_actions_insert" ON asobal_actions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "asobal_actions_update" ON asobal_actions
  FOR UPDATE TO authenticated USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "asobal_actions_delete" ON asobal_actions
  FOR DELETE TO authenticated USING (TRUE);

-- Habilita realtime
ALTER PUBLICATION supabase_realtime ADD TABLE asobal_actions;
