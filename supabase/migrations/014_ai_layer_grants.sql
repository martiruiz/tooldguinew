-- Migration 014: Grants per a l'Orchestrator (service_role)
-- Permet que el client admin (service_role) pugui escriure a taules clau
-- usades per l'agentic loop de l'Orchestrator.
--
-- Executar al SQL Editor del dashboard de Supabase.

-- Grants explícits a service_role per a taules de l'Orchestrator
GRANT INSERT, UPDATE ON public.tasks TO service_role;
GRANT INSERT ON public.ai_insights TO service_role;
GRANT INSERT ON public.ai_recommendations TO service_role;

-- Assegurar que content_items és accessible
GRANT SELECT, INSERT, UPDATE ON public.content_items TO service_role;

-- Per si hi ha sequences associades
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;
