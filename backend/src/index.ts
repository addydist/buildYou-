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

const DEFAULT_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
];

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim())
  : DEFAULT_ORIGINS;

app.use(
  cors({
    origin: allowedOrigins,
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
