-- Add crm_source to opportunities to support multiple CRMs
ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS crm_source text NOT NULL DEFAULT 'guinew';

-- Existing rows already default to 'guinew'
-- SCP opportunities will have crm_source = 'scp'

CREATE INDEX IF NOT EXISTS opportunities_crm_source_idx ON opportunities(crm_source);
