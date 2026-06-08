import { Router } from "express";
import { db } from "../db/client.js";
import { requireAuth, getUserId } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

type TaskRow = {
  id: string;
  user_id: string;
  name: string;
  difficulty: string;
  category: string;
  estimated_minutes: number;
  completed: boolean;
  created_at: Date;
};

const toTask = (row: TaskRow) => ({
  id: row.id,
  name: row.name,
  difficulty: row.difficulty,
  category: row.category,
  estimatedMinutes: row.estimated_minutes,
  completed: row.completed,
  createdAt: row.created_at.toISOString(),
});

router.get("/", async (req, res) => {
  const userId = getUserId(req);
  try {
    const { rows } = await db.query<TaskRow>(
      "SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC",
      [userId],
    );
    res.json(rows.map(toTask));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

router.post("/", async (req, res) => {
  const userId = getUserId(req);
  const { name, difficulty, category, estimatedMinutes } = req.body as {
    name: string;
    difficulty: string;
    category: string;
    estimatedMinutes: number;
  };

  if (!name || !difficulty || !category) {
    res.status(400).json({ error: "name, difficulty, and category are required" });
    return;
  }

  try {
    const { rows } = await db.query<TaskRow>(
      `INSERT INTO tasks (user_id, name, difficulty, category, estimated_minutes, completed)
       VALUES ($1, $2, $3, $4, $5, false)
       RETURNING *`,
      [userId, name, difficulty, category, estimatedMinutes ?? 60],
    );
    res.status(201).json(toTask(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create task" });
  }
});

router.patch("/:id/complete", async (req, res) => {
  const userId = getUserId(req);
  try {
    const { rows } = await db.query<TaskRow>(
      "UPDATE tasks SET completed = true WHERE id = $1 AND user_id = $2 RETURNING *",
      [req.params.id, userId],
    );
    if (!rows[0]) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    res.json(toTask(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to complete task" });
  }
});

router.delete("/:id", async (req, res) => {
  const userId = getUserId(req);
  try {
    const result = await db.query("DELETE FROM tasks WHERE id = $1 AND user_id = $2", [
      req.params.id,
      userId,
    ]);
    if (result.rowCount === 0) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete task" });
  }
});

export default router;
