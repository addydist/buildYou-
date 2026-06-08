-- Recreate tasks with user_id scoping
DROP TABLE IF EXISTS tasks;
CREATE TABLE tasks (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          TEXT        NOT NULL,
  name             TEXT        NOT NULL,
  difficulty       TEXT        NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  category         TEXT        NOT NULL CHECK (category IN ('Study', 'Work', 'Fitness', 'Reading')),
  estimated_minutes INTEGER    NOT NULL DEFAULT 60,
  completed        BOOLEAN     NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);

-- Recreate city_state keyed by user_id
DROP TABLE IF EXISTS city_state;
CREATE TABLE city_state (
  user_id               TEXT        PRIMARY KEY,
  city_name             TEXT        NOT NULL DEFAULT 'My City',
  population            INTEGER     NOT NULL DEFAULT 0,
  resources             JSONB       NOT NULL DEFAULT '{}',
  tiles                 JSONB       NOT NULL DEFAULT '[]',
  streak                INTEGER     NOT NULL DEFAULT 0,
  last_active_date      DATE,
  last_passive_claim_date DATE,
  rare_drops            JSONB       NOT NULL DEFAULT '[]',
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
