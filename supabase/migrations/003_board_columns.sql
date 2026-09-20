-- Board column customizations (shared across all users)
CREATE TABLE IF NOT EXISTS board_columns (
  status    text PRIMARY KEY,
  label     text NOT NULL,
  color     text NOT NULL,
  icon      text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Seed default values
INSERT INTO board_columns (status, label, color, icon) VALUES
  ('inbox',       'Idees/Tasques', '#9A9A9A', 'Inbox'),
  ('todo',        'Per fer',       '#DC2626', 'CheckSquare'),
  ('in_progress', 'En curs',       '#00ACC1', 'RefreshCw'),
  ('review',      'Revisió',       '#D97706', 'HelpCircle'),
  ('blocked',     'Bloquejat',     '#254067', 'AlertTriangle'),
  ('done',        'Fet',           '#16A34A', 'Star')
ON CONFLICT (status) DO NOTHING;

ALTER TABLE board_columns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users read columns" ON board_columns FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users update columns" ON board_columns FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
