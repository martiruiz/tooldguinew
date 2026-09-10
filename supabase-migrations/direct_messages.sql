-- Direct messages table for 1:1 chat between team members
CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT,
  attachment JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS dm_pair_idx ON direct_messages (from_user_id, to_user_id, created_at);
CREATE INDEX IF NOT EXISTS dm_to_idx ON direct_messages (to_user_id, created_at);

ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can view their direct messages"
  ON direct_messages FOR SELECT
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "users can send direct messages"
  ON direct_messages FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

-- Enable realtime for DMs
ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;
