-- ============================================================
-- SISTEMA DE NOTIFICACIONS GUINEW OS
-- Executar a Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Taula de notificacions (in-app)
CREATE TABLE IF NOT EXISTS notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       text NOT NULL,
  title      text NOT NULL,
  body       text,
  link       text,
  read       boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own notifications" ON notifications FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Service role insert notifications" ON notifications FOR INSERT WITH CHECK (true);

-- 2. Preferències de notificació per usuari
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id               uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  -- In-app
  inapp_task_assigned   boolean DEFAULT true,
  inapp_meeting_created boolean DEFAULT true,
  inapp_session_assigned boolean DEFAULT true,
  inapp_deadline_today  boolean DEFAULT true,
  inapp_deadline_tomorrow boolean DEFAULT true,
  inapp_new_client      boolean DEFAULT false,
  inapp_crm_opportunity boolean DEFAULT false,
  -- Email
  email_task_assigned   boolean DEFAULT true,
  email_meeting_created boolean DEFAULT true,
  email_session_assigned boolean DEFAULT true,
  email_deadline_today  boolean DEFAULT false,
  email_deadline_tomorrow boolean DEFAULT false,
  email_new_client      boolean DEFAULT false,
  email_crm_opportunity boolean DEFAULT false,
  updated_at            timestamptz DEFAULT now()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own prefs" ON notification_preferences USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. Trigger: notificar quan s'assigna una tasca
CREATE OR REPLACE FUNCTION notify_task_assigned()
RETURNS TRIGGER AS $$
DECLARE
  pref_enabled boolean;
BEGIN
  IF NEW.responsible_id IS NOT NULL AND NEW.responsible_id != COALESCE(NEW.created_by, '00000000-0000-0000-0000-000000000000'::uuid) THEN
    IF (TG_OP = 'INSERT' OR OLD.responsible_id IS DISTINCT FROM NEW.responsible_id) THEN
      -- Check if user has inapp_task_assigned enabled (default true if no row)
      SELECT COALESCE(inapp_task_assigned, true) INTO pref_enabled
      FROM notification_preferences WHERE user_id = NEW.responsible_id;

      IF COALESCE(pref_enabled, true) THEN
        INSERT INTO notifications (user_id, type, title, body, link)
        VALUES (
          NEW.responsible_id,
          'task_assigned',
          'Nova tasca assignada: ' || NEW.title,
          'Tens una nova tasca assignada al teu nom.',
          '/tasks'
        );
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_task_assigned ON tasks;
CREATE TRIGGER trigger_task_assigned
  AFTER INSERT OR UPDATE OF responsible_id ON tasks
  FOR EACH ROW EXECUTE FUNCTION notify_task_assigned();

-- 4. Trigger: notificar venciment de tasques (executa diàriament via pg_cron o manualment)
-- Per activar recordatoris automàtics de deadlines, necessites pg_cron a Supabase Pro
-- o una Edge Function programada. Deixem la funció preparada:
CREATE OR REPLACE FUNCTION notify_upcoming_deadlines()
RETURNS void AS $$
DECLARE
  rec RECORD;
  pref_today boolean;
  pref_tomorrow boolean;
BEGIN
  FOR rec IN
    SELECT t.id, t.title, t.deadline, t.responsible_id, p.inapp_deadline_today, p.inapp_deadline_tomorrow
    FROM tasks t
    LEFT JOIN notification_preferences p ON p.user_id = t.responsible_id
    WHERE t.responsible_id IS NOT NULL
      AND t.status NOT IN ('done', 'cancelled')
      AND t.deadline IN (CURRENT_DATE, CURRENT_DATE + 1)
  LOOP
    IF rec.deadline = CURRENT_DATE AND COALESCE(rec.inapp_deadline_today, true) THEN
      INSERT INTO notifications (user_id, type, title, body, link)
      VALUES (rec.responsible_id, 'deadline_today', 'Termini avui: ' || rec.title, 'Aquesta tasca venç avui.', '/tasks')
      ON CONFLICT DO NOTHING;
    END IF;
    IF rec.deadline = CURRENT_DATE + 1 AND COALESCE(rec.inapp_deadline_tomorrow, true) THEN
      INSERT INTO notifications (user_id, type, title, body, link)
      VALUES (rec.responsible_id, 'deadline_tomorrow', 'Termini demà: ' || rec.title, 'Aquesta tasca venç demà.', '/tasks')
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
