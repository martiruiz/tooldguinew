-- Add mention notification preference columns
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS inapp_mention boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_mention boolean DEFAULT true;
