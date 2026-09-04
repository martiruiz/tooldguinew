-- Afegir columna content JSONB a la taula briefings per guardar tots els camps del briefing Guinew
ALTER TABLE briefings ADD COLUMN IF NOT EXISTS content JSONB DEFAULT '{}';
