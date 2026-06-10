export type LeaderboardPeriod = "weekly" | "alltime";

export type LeaderboardEntry = {
  userId: string;
  displayName: string;
  cityName: string;
  streak: number;
  score: number;
  totalXp?: number;
  isMe: boolean;
};

export type LeaderboardResponse = {
  period: LeaderboardPeriod;
  entries: LeaderboardEntry[];
};
