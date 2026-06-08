CREATE TABLE IF NOT EXISTS tasks (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL,
  difficulty    TEXT        NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  category      TEXT        NOT NULL CHECK (category IN ('Study', 'Work', 'Fitness', 'Reading')),
  estimated_minutes INTEGER NOT NULL DEFAULT 60,
  completed     BOOLEAN     NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
