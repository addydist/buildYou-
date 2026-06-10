export type IntegrationSource =
  | "github"
  | "leetcode"
  | "codeforces"
  | "codechef"
  | "huggingface"
  | "chesscom";

export type IntegrationAccount = {
  source: IntegrationSource;
  username: string;
  lastSyncedAt: string | null;
};

export type IntegrationEvent = {
  id: string;
  source: string; // string (not IntegrationSource) so unknown future sources don't crash
  eventType: string;
  title: string;
  points: number;
  occurredAt: string;
};
