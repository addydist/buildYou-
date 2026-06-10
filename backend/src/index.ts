import "dotenv/config";
import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import tasksRouter from "./routes/tasks.js";
import cityRouter from "./routes/city.js";
import profileRouter from "./routes/profile.js";
import integrationsRouter from "./routes/integrations.js";
import leaderboardRouter from "./routes/leaderboard.js";

const app = express();
const PORT = Number(process.env.PORT ?? 3001);

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5174",
    ],
  }),
);
app.use(express.json());
app.use(clerkMiddleware());

app.use("/tasks", tasksRouter);
app.use("/city", cityRouter);
app.use("/profile", profileRouter);
app.use("/integrations", integrationsRouter);
app.use("/leaderboard", leaderboardRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
