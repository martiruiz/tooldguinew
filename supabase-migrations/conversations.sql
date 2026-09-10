-- Conversations: supports global (team_chat), direct (1:1), and group (custom)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('direct', 'group')),
  name TEXT,             -- display name for groups
  avatar_color TEXT,     -- hex color for group avatar
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversation_members (
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS conversation_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT,
  attachment JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS conv_msg_conv_idx ON conversation_messages (conversation_id, created_at);
CREATE INDEX IF NOT EXISTS conv_members_user_idx ON conversation_members (user_id);
CREATE INDEX IF NOT EXISTS conv_updated_idx ON conversations (updated_at DESC);

-- Auto-update updated_at on new message
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations SET updated_at = NOW() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_conversation_ts
  AFTER INSERT ON conversation_messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_timestamp();

-- RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;

-- Conversations: visible if you are a member
CREATE POLICY "members can see conversations"
  ON conversations FOR SELECT
  USING (
    id IN (
      SELECT conversation_id FROM conversation_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "members can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Conversation members: visible if you are in the same conversation
CREATE POLICY "members can view members"
  ON conversation_members FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "creator can add members"
  ON conversation_members FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations WHERE created_by = auth.uid()
    )
    OR user_id = auth.uid()
  );

-- Messages: visible if you are a member of the conversation
CREATE POLICY "members can view messages"
  ON conversation_messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "members can send messages"
  ON conversation_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND conversation_id IN (
      SELECT conversation_id FROM conversation_members WHERE user_id = auth.uid()
    )
  );

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_members;
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_messages;
