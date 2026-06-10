import { Router } from "express";
import { db } from "../db/client.js";
import { requireAuth, getUserId } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

const LEVEL_EXPR = (stat: string) =>
  `FLOOR(SQRT(GREATEST(COALESCE((cs.character_stats->>'${stat}')::numeric, 0), 0) / 50))`;

const XP_EXPR = (stat: string) => `COALESCE((cs.character_stats->>'${stat}')::numeric, 0)`;

const STATS = ["strength", "intelligence", "wealth", "wisdom", "willpower"];

router.get("/", async (req, res) => {
  const userId = getUserId(req);
  const period = req.query.period === "alltime" ? "alltime" : "weekly";

  try {
    if (period === "weekly") {
      const { rows } = await db.query<{
        user_id: string;
        city_name: string;
        streak: number;
        weekly_points: string;
        display_name: string | null;
      }>(
        `SELECT
           cs.user_id,
           cs.city_name,
           cs.streak,
           COALESCE((
             SELECT SUM(value::numeric)
             FROM jsonb_each_text(cs.activity_log) AS kv(date, value)
             WHERE kv.date::date >= CURRENT_DATE - INTERVAL '6 days'
           ), 0) AS weekly_points,
           p.display_name
         FROM city_state cs
         LEFT JOIN profiles p ON p.user_id = cs.user_id
         ORDER BY weekly_points DESC, cs.streak DESC
         LIMIT 50`,
      );

      res.json({
        period,
        entries: rows.map((r) => ({
          userId: r.user_id,
          displayName: r.display_name?.trim() || r.city_name,
          cityName: r.city_name,
          streak: r.streak,
          score: Number(r.weekly_points),
          isMe: r.user_id === userId,
        })),
      });
      return;
    }

    const { rows } = await db.query<{
      user_id: string;
      city_name: string;
      streak: number;
      avg_level: string;
      total_xp: string;
      display_name: string | null;
    }>(
      `SELECT
         cs.user_id,
         cs.city_name,
         cs.streak,
         FLOOR((${STATS.map(LEVEL_EXPR).join(" + ")}) / ${STATS.length}) AS avg_level,
         (${STATS.map(XP_EXPR).join(" + ")}) AS total_xp,
         p.display_name
       FROM city_state cs
       LEFT JOIN profiles p ON p.user_id = cs.user_id
       ORDER BY avg_level DESC, total_xp DESC
       LIMIT 50`,
    );

    res.json({
      period,
      entries: rows.map((r) => ({
        userId: r.user_id,
        displayName: r.display_name?.trim() || r.city_name,
        cityName: r.city_name,
        streak: r.streak,
        score: Number(r.avg_level),
        totalXp: Number(r.total_xp),
        isMe: r.user_id === userId,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load leaderboard" });
  }
});

export default router;
