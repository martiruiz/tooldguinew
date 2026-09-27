-- Migration 020: Corregeix detect_clients_at_risk per excloure "no clients"
-- Executar a: https://supabase.com/dashboard/project/imgzhnylwpugrejlliro/sql/new
--
-- La UI utilitza health = 'risk' per marcar "No client" i status = 'inactive'.
-- La funció anterior podia incloure'ls. Ara s'exclouen explícitament.

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
    'warning'::text
  FROM public.clients c
  WHERE c.status = 'active'          -- exclou clients inactius ("no clients")
    AND c.health = 'attention'       -- només clients amb atenció requerida
    AND c.health != 'risk'           -- exclou explícitament "no clients" (health=risk és la marca de "no client" a la UI)
$$;
