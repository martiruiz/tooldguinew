-- ============================================================
-- Migration 010: RLS per taules de tokens OAuth de Google
-- Executar al SQL Editor del dashboard de Supabase
--
-- NOTA: aquestes taules s'accedeixen EXCLUSIVAMENT via service_role
-- des de routes server-side. El client anon mai ha de llegir tokens.
-- ============================================================

-- ── google_calendar_tokens ───────────────────────────────────
-- Habilitar RLS si no està activa (IF NOT EXISTS no existeix per
-- ALTER TABLE ENABLE, però és idempotent: re-executar és segur)
ALTER TABLE IF EXISTS public.google_calendar_tokens ENABLE ROW LEVEL SECURITY;

-- Eliminar policies antigues si existien (per idempotència)
DROP POLICY IF EXISTS "google_calendar_tokens: own rows" ON public.google_calendar_tokens;
DROP POLICY IF EXISTS "Users can manage own google calendar tokens" ON public.google_calendar_tokens;
DROP POLICY IF EXISTS "Users can view own tokens" ON public.google_calendar_tokens;
DROP POLICY IF EXISTS "Users can insert own tokens" ON public.google_calendar_tokens;
DROP POLICY IF EXISTS "Users can update own tokens" ON public.google_calendar_tokens;
DROP POLICY IF EXISTS "Users can delete own tokens" ON public.google_calendar_tokens;

-- Policy: cada usuari només pot llegir i gestionar els seus propis tokens
-- Les escriptures del server (service_role) bypassen RLS per disseny
CREATE POLICY "google_calendar_tokens: own rows"
  ON public.google_calendar_tokens
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── google_tokens (Drive OAuth) ──────────────────────────────
ALTER TABLE IF EXISTS public.google_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "google_tokens: own rows" ON public.google_tokens;
DROP POLICY IF EXISTS "Users can manage own google tokens" ON public.google_tokens;
DROP POLICY IF EXISTS "Users can view own google tokens" ON public.google_tokens;

CREATE POLICY "google_tokens: own rows"
  ON public.google_tokens
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
