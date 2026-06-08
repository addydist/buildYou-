import { Router } from "express";
import { db } from "../db/client.js";
import { requireAuth, getUserId } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

type CityRow = {
  user_id: string;
  city_name: string;
  population: number;
  resources: Record<string, number>;
  tiles: Array<{ id: number; buildingId: string | null }>;
  streak: number;
  last_active_date: string | null;
  last_passive_claim_date: string | null;
  rare_drops: Array<{ id: string; name: string; chance: number; collectedAt: string }>;
  activity_log: Record<string, number>;
  updated_at: Date;
};

const fromRow = (row: CityRow) => ({
  cityName: row.city_name,
  population: row.population,
  resources: row.resources,
  tiles: row.tiles,
  streak: row.streak,
  lastActiveDate: row.last_active_date,
  lastPassiveClaimDate: row.last_passive_claim_date,
  rareDrops: row.rare_drops,
  activityLog: row.activity_log ?? {},
});

router.get("/", async (req, res) => {
  const userId = getUserId(req);
  try {
    const { rows } = await db.query<CityRow>("SELECT * FROM city_state WHERE user_id = $1", [userId]);
    if (!rows[0]) {
      res.json(null);
      return;
    }
    res.json(fromRow(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load city state" });
  }
});

router.put("/", async (req, res) => {
  const userId = getUserId(req);
  const {
    cityName,
    population,
    resources,
    tiles,
    streak,
    lastActiveDate,
    lastPassiveClaimDate,
    rareDrops,
    activityLog,
  } = req.body as {
    cityName: string;
    population: number;
    resources: Record<string, number>;
    tiles: unknown[];
    streak: number;
    lastActiveDate: string | null;
    lastPassiveClaimDate: string | null;
    rareDrops: unknown[];
    activityLog?: Record<string, number>;
  };

  try {
    await db.query(
      `INSERT INTO city_state
         (user_id, city_name, population, resources, tiles, streak,
          last_active_date, last_passive_claim_date, rare_drops, activity_log)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (user_id) DO UPDATE SET
         city_name               = EXCLUDED.city_name,
         population              = EXCLUDED.population,
         resources               = EXCLUDED.resources,
         tiles                   = EXCLUDED.tiles,
         streak                  = EXCLUDED.streak,
         last_active_date        = EXCLUDED.last_active_date,
         last_passive_claim_date = EXCLUDED.last_passive_claim_date,
         rare_drops              = EXCLUDED.rare_drops,
         activity_log            = EXCLUDED.activity_log,
         updated_at              = NOW()`,
      [
        userId,
        cityName,
        population,
        JSON.stringify(resources),
        JSON.stringify(tiles),
        streak,
        lastActiveDate,
        lastPassiveClaimDate,
        JSON.stringify(rareDrops),
        JSON.stringify(activityLog ?? {}),
      ],
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save city state" });
  }
});

export default router;
