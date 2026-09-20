-- ============================================================
-- Migration 012: Correccions de policies RLS massa permissives
-- Executar al SQL Editor del dashboard de Supabase
-- ============================================================

-- ── tasks: DELETE ────────────────────────────────────────────
-- Problema: "Authenticated users can delete tasks" usa USING(true)
-- → qualsevol usuari autenticat pot esborrar qualsevol tasca
--
-- Correcció: només pot esborrar qui té la tasca assignada o és manager/superadmin

DROP POLICY IF EXISTS "Authenticated users can delete tasks" ON public.tasks;

CREATE POLICY "tasks: delete own or manager"
  ON public.tasks
  FOR DELETE
  TO authenticated
  USING (
    responsible_id = auth.uid()
    OR created_by = auth.uid()
    OR get_user_role() IN ('superadmin', 'manager')
  );

-- ── email_templates: DELETE ──────────────────────────────────
-- Problema: qualsevol autenticat pot esborrar qualsevol plantilla
-- Correcció: només managers i superadmins

DROP POLICY IF EXISTS "Users can delete email templates" ON public.email_templates;

CREATE POLICY "email_templates: delete managers only"
  ON public.email_templates
  FOR DELETE
  TO authenticated
  USING (
    get_user_role() IN ('superadmin', 'manager')
  );

-- ── email_templates: UPDATE ───────────────────────────────────
-- Problema: qualsevol autenticat pot editar qualsevol plantilla (USING(true))
-- Correcció: qui la va crear, o managers/superadmins

DROP POLICY IF EXISTS "Users can update email templates" ON public.email_templates;

CREATE POLICY "email_templates: update own or manager"
  ON public.email_templates
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR get_user_role() IN ('superadmin', 'manager')
  )
  WITH CHECK (
    created_by = auth.uid()
    OR get_user_role() IN ('superadmin', 'manager')
  );
