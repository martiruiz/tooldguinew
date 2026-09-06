-- Taula de plantilles de correu per al procés de venda
CREATE TABLE IF NOT EXISTS email_templates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_order integer NOT NULL,
  stage_label text    NOT NULL,
  subject     text    NOT NULL,
  body        text    NOT NULL,
  created_by  uuid    REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read templates"
  ON email_templates FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert templates"
  ON email_templates FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update templates"
  ON email_templates FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete templates"
  ON email_templates FOR DELETE TO authenticated USING (true);
