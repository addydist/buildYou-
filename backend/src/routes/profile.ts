import { Router } from "express";
import { db } from "../db/client.js";
import { requireAuth, getUserId } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

type ProfileRow = {
  user_id: string;
  display_name: string | null;
  bio: string | null;
  location: string | null;
  height_cm: number | null;
  weight_kg: string | null;
  body_fat_percent: string | null;
  muscle_mass_kg: string | null;
  goal_weight_kg: string | null;
  goal_body_fat: string | null;
  goal_workout_days: number | null;
  goal_daily_calories: number | null;
  social_links: Record<string, string>;
  updated_at: Date;
};

const fromRow = (row: ProfileRow) => ({
  displayName: row.display_name,
  bio: row.bio,
  location: row.location,
  heightCm: row.height_cm,
  weightKg: row.weight_kg !== null ? parseFloat(row.weight_kg) : null,
  bodyFatPercent: row.body_fat_percent !== null ? parseFloat(row.body_fat_percent) : null,
  muscleMassKg: row.muscle_mass_kg !== null ? parseFloat(row.muscle_mass_kg) : null,
  goalWeightKg: row.goal_weight_kg !== null ? parseFloat(row.goal_weight_kg) : null,
  goalBodyFat: row.goal_body_fat !== null ? parseFloat(row.goal_body_fat) : null,
  goalWorkoutDays: row.goal_workout_days,
  goalDailyCalories: row.goal_daily_calories,
  socialLinks: row.social_links ?? {},
});

router.get("/", async (req, res) => {
  const userId = getUserId(req);
  try {
    const { rows } = await db.query<ProfileRow>("SELECT * FROM profiles WHERE user_id = $1", [userId]);
    res.json(rows[0] ? fromRow(rows[0]) : null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load profile" });
  }
});

router.put("/", async (req, res) => {
  const userId = getUserId(req);
  const {
    displayName,
    bio,
    location,
    heightCm,
    weightKg,
    bodyFatPercent,
    muscleMassKg,
    goalWeightKg,
    goalBodyFat,
    goalWorkoutDays,
    goalDailyCalories,
    socialLinks,
  } = req.body as {
    displayName?: string;
    bio?: string;
    location?: string;
    heightCm?: number;
    weightKg?: number;
    bodyFatPercent?: number;
    muscleMassKg?: number;
    goalWeightKg?: number;
    goalBodyFat?: number;
    goalWorkoutDays?: number;
    goalDailyCalories?: number;
    socialLinks?: Record<string, string>;
  };

  try {
    const { rows } = await db.query<ProfileRow>(
      `INSERT INTO profiles
         (user_id, display_name, bio, location, height_cm, weight_kg, body_fat_percent,
          muscle_mass_kg, goal_weight_kg, goal_body_fat, goal_workout_days, goal_daily_calories, social_links)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       ON CONFLICT (user_id) DO UPDATE SET
         display_name        = EXCLUDED.display_name,
         bio                 = EXCLUDED.bio,
         location            = EXCLUDED.location,
         height_cm           = EXCLUDED.height_cm,
         weight_kg           = EXCLUDED.weight_kg,
         body_fat_percent    = EXCLUDED.body_fat_percent,
         muscle_mass_kg      = EXCLUDED.muscle_mass_kg,
         goal_weight_kg      = EXCLUDED.goal_weight_kg,
         goal_body_fat       = EXCLUDED.goal_body_fat,
         goal_workout_days   = EXCLUDED.goal_workout_days,
         goal_daily_calories = EXCLUDED.goal_daily_calories,
         social_links        = EXCLUDED.social_links,
         updated_at          = NOW()
       RETURNING *`,
      [
        userId,
        displayName ?? null,
        bio ?? null,
        location ?? null,
        heightCm ?? null,
        weightKg ?? null,
        bodyFatPercent ?? null,
        muscleMassKg ?? null,
        goalWeightKg ?? null,
        goalBodyFat ?? null,
        goalWorkoutDays ?? 5,
        goalDailyCalories ?? 2200,
        JSON.stringify(socialLinks ?? {}),
      ],
    );
    res.json(fromRow(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save profile" });
  }
});

export default router;
