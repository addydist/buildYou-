CREATE TABLE IF NOT EXISTS city_state (
  id                      INTEGER     PRIMARY KEY DEFAULT 1,
  city_name               TEXT        NOT NULL DEFAULT 'Addy City',
  population              INTEGER     NOT NULL DEFAULT 0,
  resources               JSONB       NOT NULL DEFAULT '{}',
  tiles                   JSONB       NOT NULL DEFAULT '[]',
  streak                  INTEGER     NOT NULL DEFAULT 0,
  last_active_date        DATE,
  last_passive_claim_date DATE,
  rare_drops              JSONB       NOT NULL DEFAULT '[]',
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);
