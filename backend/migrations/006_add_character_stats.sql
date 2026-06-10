ALTER TABLE city_state
  ADD COLUMN IF NOT EXISTS character_stats JSONB NOT NULL DEFAULT '{"strength":0,"intelligence":0,"wealth":0,"wisdom":0,"willpower":0}';
