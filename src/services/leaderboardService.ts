import type { LeaderboardPeriod, LeaderboardResponse } from "../types/leaderboard";
import { authFetch } from "./apiClient";

const BASE = (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL ?? "http://localhost:3001";

export const leaderboardService = {
  get: async (period: LeaderboardPeriod): Promise<LeaderboardResponse> => {
    const res = await authFetch(`${BASE}/leaderboard?period=${period}`);
    if (!res.ok) throw new Error("Failed to load leaderboard");
    return res.json() as Promise<LeaderboardResponse>;
  },
};
