-- Add activity_log to city_state
ALTER TABLE city_state
  ADD COLUMN IF NOT EXISTS activity_log JSONB NOT NULL DEFAULT '{}';

-- Integration account connections (one row per user per source)
CREATE TABLE IF NOT EXISTS integrations (
  user_id        TEXT NOT NULL,
  source         TEXT NOT NULL CHECK (source IN ('github', 'leetcode')),
  username       TEXT NOT NULL,
  last_synced_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, source)
);

-- Deduplicated log of every synced event (prevents double-awarding)
CREATE TABLE IF NOT EXISTS integration_events (
  external_id TEXT        NOT NULL,
  user_id     TEXT        NOT NULL,
  source      TEXT        NOT NULL,
  event_type  TEXT        NOT NULL,
  title       TEXT        NOT NULL,
  points      INTEGER     NOT NULL DEFAULT 0,
  occurred_at TIMESTAMPTZ NOT NULL,
  synced_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (external_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_integration_events_user
  ON integration_events (user_id, occurred_at DESC);
