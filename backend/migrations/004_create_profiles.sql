CREATE TABLE IF NOT EXISTS profiles (
  user_id              TEXT          PRIMARY KEY,
  display_name         TEXT,
  bio                  TEXT,
  location             TEXT,
  height_cm            INTEGER,
  weight_kg            DECIMAL(5,2),
  body_fat_percent     DECIMAL(4,1),
  muscle_mass_kg       DECIMAL(5,2),
  goal_weight_kg       DECIMAL(5,2),
  goal_body_fat        DECIMAL(4,1),
  goal_workout_days    INTEGER       DEFAULT 5,
  goal_daily_calories  INTEGER       DEFAULT 2200,
  social_links         JSONB         NOT NULL DEFAULT '{}',
  updated_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
