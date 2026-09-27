-- Migration 019: Permet a TOTS els usuaris autenticats crear sessions, campanyes i tasques
-- Executar a: https://supabase.com/dashboard/project/imgzhnylwpugrejlliro/sql/new

-- ─── CONTENT_SESSIONS ─────────────────────────────────────────────────────────
-- La taula existeix però no té polítiques RLS per a inserció
ALTER TABLE IF EXISTS content_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "All users select content_sessions"   ON content_sessions;
DROP POLICY IF EXISTS "All users insert content_sessions"   ON content_sessions;
DROP POLICY IF EXISTS "All users update content_sessions"   ON content_sessions;
DROP POLICY IF EXISTS "All users delete content_sessions"   ON content_sessions;

CREATE POLICY "All users select content_sessions"
  ON content_sessions FOR SELECT TO authenticated USING (true);

CREATE POLICY "All users insert content_sessions"
  ON content_sessions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "All users update content_sessions"
  ON content_sessions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "All users delete content_sessions"
  ON content_sessions FOR DELETE TO authenticated USING (true);

GRANT ALL ON content_sessions TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ─── PROJECTS (campanyes) ─────────────────────────────────────────────────────
-- Elimina la restricció que només managers/admins poden gestionar projectes
DROP POLICY IF EXISTS "Managers and admins can manage projects" ON projects;
DROP POLICY IF EXISTS "All authenticated users can manage projects" ON projects;

CREATE POLICY "All authenticated users can manage projects"
  ON projects FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

GRANT ALL ON projects TO authenticated;

-- ─── TASKS ────────────────────────────────────────────────────────────────────
-- Obre l'UPDATE a tots (no només al responsible_id o managers)
DROP POLICY IF EXISTS "Responsible users and managers can update tasks" ON tasks;
DROP POLICY IF EXISTS "tasks: update own or manager" ON tasks;
DROP POLICY IF EXISTS "All authenticated users can update tasks" ON tasks;

CREATE POLICY "All authenticated users can update tasks"
  ON tasks FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

GRANT ALL ON tasks TO authenticated;
