-- =============================================
-- GUINEW OS — Database Schema
-- Supabase PostgreSQL
-- =============================================
-- Segur per re-executar: fa DROP + CREATE

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables (ordre invers per les dependències)
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS integrations CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS metrics CASCADE;
DROP TABLE IF EXISTS process_steps CASCADE;
DROP TABLE IF EXISTS processes CASCADE;
DROP TABLE IF EXISTS strategies CASCADE;
DROP TABLE IF EXISTS briefings CASCADE;
DROP TABLE IF EXISTS meetings CASCADE;
DROP TABLE IF EXISTS task_checklists CASCADE;
DROP TABLE IF EXISTS task_comments CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS project_members CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
DROP FUNCTION IF EXISTS handle_new_user CASCADE;
DROP FUNCTION IF EXISTS get_user_role CASCADE;

-- =============================================
-- PROFILES (extends Supabase auth.users)
-- =============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'team_member' CHECK (role IN ('superadmin', 'manager', 'team_member')),
  position TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- CLIENTS
-- =============================================
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'altres' CHECK (type IN (
    'club_esportiu', 'federacio', 'esdeveniment', 'torneig',
    'marca_esportiva', 'esportista', 'mitja', 'empresa', 'altres'
  )),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'inactive')),
  health TEXT NOT NULL DEFAULT 'healthy' CHECK (health IN ('healthy', 'attention', 'risk')),
  logo_url TEXT,
  website TEXT,
  description TEXT,
  responsible_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- PROJECTS
-- =============================================
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'custom' CHECK (type IN (
    'social_media', 'content', 'event', 'matchday', 'campaign', 'reporting', 'custom'
  )),
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN (
    'planning', 'active', 'at_risk', 'blocked', 'completed', 'archived'
  )),
  responsible_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Project members (team assigned)
CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- =============================================
-- TASKS
-- =============================================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  responsible_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN (
    'inbox', 'todo', 'in_progress', 'review', 'blocked', 'done'
  )),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  deadline TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Task comments
CREATE TABLE task_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Task checklists
CREATE TABLE task_checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_done BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- MEETINGS
-- =============================================
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  meet_url TEXT,
  google_event_id TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- BRIEFINGS
-- =============================================
CREATE TABLE briefings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  -- Client
  client_name TEXT,
  sector TEXT,
  sport TEXT,
  website TEXT,
  contact TEXT,
  -- Business
  objectives TEXT,
  business_model TEXT,
  products TEXT,
  target_audience TEXT,
  -- Sport
  sport_type TEXT,
  competitions TEXT,
  season TEXT,
  categories TEXT,
  sport_calendar TEXT,
  -- Communication
  positioning TEXT,
  values TEXT,
  tone TEXT,
  key_messages TEXT,
  competitors TEXT,
  -- Digital
  instagram TEXT,
  tiktok TEXT,
  linkedin TEXT,
  youtube TEXT,
  facebook TEXT,
  x_twitter TEXT,
  web TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(client_id)
);

-- =============================================
-- STRATEGIES
-- =============================================
CREATE TABLE strategies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  objectives JSONB DEFAULT '[]',
  audiences JSONB DEFAULT '[]',
  positioning TEXT,
  content_pillars JSONB DEFAULT '[]',
  channels JSONB DEFAULT '[]',
  kpis JSONB DEFAULT '[]',
  campaigns JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(client_id)
);

-- =============================================
-- PROCESSES
-- =============================================
CREATE TABLE processes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  responsible_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE process_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- METRICS
-- =============================================
CREATE TABLE metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  value NUMERIC,
  previous_value NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- DOCUMENTS (links to Google Drive)
-- =============================================
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  drive_file_id TEXT,
  drive_url TEXT,
  mime_type TEXT,
  last_modified TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- NOTIFICATIONS
-- =============================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- ACTIVITY LOGS
-- =============================================
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  entity_name TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- INTEGRATIONS
-- =============================================
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, type)
);

-- =============================================
-- EVENTS (Esportius)
-- =============================================
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  sport TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  location TEXT,
  description TEXT,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- UPDATED_AT TRIGGER
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_briefings_updated_at BEFORE UPDATE ON briefings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_strategies_updated_at BEFORE UPDATE ON strategies FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- PROFILES POLICIES
CREATE POLICY "Users can see all active profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Superadmins can see all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (get_user_role() = 'superadmin');

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Superadmins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'superadmin');

CREATE POLICY "Superadmins can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() = 'superadmin');

-- CLIENTS POLICIES
CREATE POLICY "Authenticated users can view clients"
  ON clients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers and admins can manage clients"
  ON clients FOR ALL
  TO authenticated
  USING (get_user_role() IN ('superadmin', 'manager'))
  WITH CHECK (get_user_role() IN ('superadmin', 'manager'));

-- PROJECTS POLICIES
CREATE POLICY "Authenticated users can view projects"
  ON projects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers and admins can manage projects"
  ON projects FOR ALL
  TO authenticated
  USING (get_user_role() IN ('superadmin', 'manager'))
  WITH CHECK (get_user_role() IN ('superadmin', 'manager'));

-- TASKS POLICIES
CREATE POLICY "Authenticated users can view tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Responsible users and managers can update tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    responsible_id = auth.uid() OR
    get_user_role() IN ('superadmin', 'manager')
  );

CREATE POLICY "Managers and admins can delete tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (get_user_role() IN ('superadmin', 'manager'));

-- TASK COMMENTS
CREATE POLICY "Users can view task comments"
  ON task_comments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create task comments"
  ON task_comments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own task comments"
  ON task_comments FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- MEETINGS
CREATE POLICY "Users can view meetings"
  ON meetings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create meetings"
  ON meetings FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Managers can manage meetings"
  ON meetings FOR ALL TO authenticated
  USING (get_user_role() IN ('superadmin', 'manager'));

-- BRIEFINGS
CREATE POLICY "Users can view briefings"
  ON briefings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Managers can manage briefings"
  ON briefings FOR ALL TO authenticated
  USING (get_user_role() IN ('superadmin', 'manager'))
  WITH CHECK (get_user_role() IN ('superadmin', 'manager'));

-- STRATEGIES
CREATE POLICY "Users can view strategies"
  ON strategies FOR SELECT TO authenticated USING (true);

CREATE POLICY "Managers can manage strategies"
  ON strategies FOR ALL TO authenticated
  USING (get_user_role() IN ('superadmin', 'manager'))
  WITH CHECK (get_user_role() IN ('superadmin', 'manager'));

-- NOTIFICATIONS
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- ACTIVITY LOGS
CREATE POLICY "Users can view activity logs"
  ON activity_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create logs"
  ON activity_logs FOR INSERT TO authenticated WITH CHECK (true);

-- INTEGRATIONS
CREATE POLICY "Users can manage own integrations"
  ON integrations FOR ALL TO authenticated USING (user_id = auth.uid());

-- PROCESSES
CREATE POLICY "Users can view processes"
  ON processes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Managers can manage processes"
  ON processes FOR ALL TO authenticated
  USING (get_user_role() IN ('superadmin', 'manager'))
  WITH CHECK (get_user_role() IN ('superadmin', 'manager'));

-- PROCESS STEPS
CREATE POLICY "Users can view process steps"
  ON process_steps FOR SELECT TO authenticated USING (true);

-- METRICS
CREATE POLICY "Users can view metrics"
  ON metrics FOR SELECT TO authenticated USING (true);

CREATE POLICY "Managers can manage metrics"
  ON metrics FOR ALL TO authenticated
  USING (get_user_role() IN ('superadmin', 'manager'))
  WITH CHECK (get_user_role() IN ('superadmin', 'manager'));

-- DOCUMENTS
CREATE POLICY "Users can view documents"
  ON documents FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create documents"
  ON documents FOR INSERT TO authenticated WITH CHECK (true);

-- EVENTS
CREATE POLICY "Users can view events"
  ON events FOR SELECT TO authenticated USING (true);

CREATE POLICY "Managers can manage events"
  ON events FOR ALL TO authenticated
  USING (get_user_role() IN ('superadmin', 'manager'))
  WITH CHECK (get_user_role() IN ('superadmin', 'manager'));

-- =============================================
-- FUNCTION: handle new auth user -> create profile
-- =============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'team_member'),
    true
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- =============================================
-- SEED DATA (Demo)
-- =============================================

-- Note: Run this AFTER creating the superadmin user via Supabase Auth
-- Replace 'SUPERADMIN_USER_ID' with the actual UUID from auth.users

-- Demo clients
INSERT INTO clients (name, slug, type, status, health, website, description) VALUES
  ('Girona FC', 'girona-fc', 'club_esportiu', 'active', 'healthy', 'https://www.gironafc.cat', 'Club de futbol professional de la Primera Divisió espanyola.'),
  ('Best Cup', 'best-cup', 'torneig', 'active', 'healthy', null, 'Torneig internacional de bàsquet juvenil.'),
  ('Sports World Congress', 'sports-world-congress', 'esdeveniment', 'active', 'attention', null, 'Congrés internacional d''indústria esportiva.'),
  ('Handbol100x100', 'handbol100x100', 'esdeveniment', 'active', 'healthy', null, 'Festival d''handbol català.'),
  ('Federació Catalana de Handbol', 'federacio-catalana-handbol', 'federacio', 'active', 'healthy', 'https://www.handbol.cat', 'Federació oficial d''handbol a Catalunya.');
