import { Router } from "express";
import type { Pool } from "pg";
import { db } from "../db/client.js";
import { requireAuth, getUserId } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

// ─── Shared types ────────────────────────────────────────────────────────────

type Source = "github" | "leetcode" | "codeforces" | "codechef" | "huggingface" | "chesscom";
const VALID_SOURCES: Source[] = ["github", "leetcode", "codeforces", "codechef", "huggingface", "chesscom"];

type IntegrationEvent = {
  id: string;
  source: string;
  eventType: string;
  title: string;
  points: number;
  occurredAt: string;
};

type IntegrationRow = {
  user_id: string;
  source: string;
  username: string;
  last_synced_at: string | null;
};

type EventRow = {
  external_id: string;
  user_id: string;
  source: string;
  event_type: string;
  title: string;
  points: number;
  occurred_at: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function seenIds(userId: string, source: string, pool: Pool): Promise<Set<string>> {
  const { rows } = await pool.query<{ external_id: string }>(
    "SELECT external_id FROM integration_events WHERE user_id = $1 AND source = $2",
    [userId, source],
  );
  return new Set(rows.map((r) => r.external_id));
}

async function insertEvent(userId: string, ev: IntegrationEvent, pool: Pool): Promise<void> {
  await pool.query(
    `INSERT INTO integration_events (external_id, user_id, source, event_type, title, points, occurred_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING`,
    [ev.id, userId, ev.source, ev.eventType, ev.title, ev.points, new Date(ev.occurredAt)],
  );
}

// ─── GitHub sync ─────────────────────────────────────────────────────────────

type GHPayload = {
  commits?: { sha: string; message: string }[];
  size?: number;
  head?: string;
  before?: string;
  action?: string;
  pull_request?: { title: string; merged: boolean; number: number };
  ref_type?: string;
  ref?: string;
  forkee?: { full_name: string };
  issue?: { title: string; number: number };
  comment?: { body: string };
  review?: { state: string };
};

type GHEvent = {
  id: string;
  type: string;
  repo: { name: string };
  payload: GHPayload;
  created_at: string;
};

type SyncResult = {
  newEvents: IntegrationEvent[];
  debug?: Record<string, unknown>;
};

async function syncGitHub(userId: string, username: string, pool: Pool): Promise<SyncResult> {
  const resp = await fetch(
    `https://api.github.com/users/${encodeURIComponent(username)}/events?per_page=100`,
    { headers: { Accept: "application/vnd.github.v3+json", "User-Agent": "build-city-app" } },
  );
  if (resp.status === 404) throw new Error(`GitHub user "${username}" not found`);
  if (!resp.ok) throw new Error(`GitHub API returned ${resp.status}`);

  const events = (await resp.json()) as GHEvent[];
  if (!Array.isArray(events)) throw new Error("Unexpected GitHub API response");

  const typeCounts: Record<string, number> = {};
  for (const ev of events) typeCounts[ev.type] = (typeCounts[ev.type] ?? 0) + 1;
  console.log(`[github] ${username}: ${events.length} events —`, typeCounts);

  const seen = await seenIds(userId, "github", pool);
  const newEvents: IntegrationEvent[] = [];

  for (const ev of events) {
    if (seen.has(ev.id)) continue;

    let title = "";
    let points = 0;
    let eventType = "";

    if (ev.type === "PushEvent") {
      const count =
        ev.payload.size ??
        ev.payload.commits?.length ??
        (ev.payload.head && ev.payload.before && ev.payload.head !== ev.payload.before ? 1 : 0);
      if (count === 0) continue;
      points = Math.min(count * 3, 15);
      title = `Pushed ${count} commit${count !== 1 ? "s" : ""} to ${ev.repo.name}`;
      eventType = "push";
    } else if (ev.type === "PullRequestEvent" && ev.payload.action === "opened") {
      points = 5;
      title = `Opened PR #${ev.payload.pull_request?.number ?? "?"} in ${ev.repo.name}`;
      eventType = "pr_opened";
    } else if (ev.type === "PullRequestEvent" && ev.payload.action === "closed" && ev.payload.pull_request?.merged === true) {
      points = 20;
      title = `Merged PR: ${ev.payload.pull_request.title} in ${ev.repo.name}`;
      eventType = "pr_merged";
    } else if (ev.type === "CreateEvent" && ev.payload.ref_type === "repository") {
      points = 5;
      title = `Created repository ${ev.repo.name}`;
      eventType = "create_repo";
    } else if (ev.type === "ForkEvent") {
      points = 3;
      title = `Forked ${ev.repo.name}`;
      eventType = "fork";
    } else if (ev.type === "IssueCommentEvent" || ev.type === "CommitCommentEvent") {
      points = 1;
      title = `Commented in ${ev.repo.name}`;
      eventType = "comment";
    } else if (ev.type === "PullRequestReviewEvent") {
      points = 3;
      title = `Reviewed PR in ${ev.repo.name}`;
      eventType = "pr_review";
    } else if (ev.type === "IssuesEvent" && ev.payload.action === "opened") {
      points = 2;
      title = `Opened issue in ${ev.repo.name}`;
      eventType = "issue_opened";
    } else {
      continue;
    }

    const event: IntegrationEvent = { id: ev.id, source: "github", eventType, title, points, occurredAt: ev.created_at };
    await insertEvent(userId, event, pool);
    newEvents.push(event);
  }

  return { newEvents, debug: { total: events.length, typeCounts } };
}

// ─── LeetCode sync ───────────────────────────────────────────────────────────

type LCSubmission = { id: string; title: string; titleSlug: string; timestamp: string };
const LC_POINTS: Record<string, number> = { Easy: 8, Medium: 15, Hard: 25 };

async function fetchLCSubmissions(username: string): Promise<LCSubmission[]> {
  const resp = await fetch("https://leetcode.com/graphql/", {
    method: "POST",
    headers: { "Content-Type": "application/json", Referer: "https://leetcode.com", "User-Agent": "Mozilla/5.0" },
    body: JSON.stringify({
      query: `query recentAc($username: String!, $limit: Int!) { recentAcSubmissionList(username: $username, limit: $limit) { id title titleSlug timestamp } }`,
      variables: { username, limit: 20 },
    }),
  });
  if (!resp.ok) throw new Error(`LeetCode API returned ${resp.status}`);
  const json = (await resp.json()) as { data?: { recentAcSubmissionList?: LCSubmission[] }; errors?: unknown[] };
  if (json.errors) throw new Error("LeetCode API error — check username");
  return json.data?.recentAcSubmissionList ?? [];
}

async function fetchLCDifficulties(slugs: string[]): Promise<Record<string, string>> {
  if (slugs.length === 0) return {};
  const aliases = slugs.map((slug, i) => `q${i}: question(titleSlug: "${slug}") { difficulty }`).join("\n");
  const resp = await fetch("https://leetcode.com/graphql/", {
    method: "POST",
    headers: { "Content-Type": "application/json", Referer: "https://leetcode.com", "User-Agent": "Mozilla/5.0" },
    body: JSON.stringify({ query: `{ ${aliases} }` }),
  });
  if (!resp.ok) return {};
  const json = (await resp.json()) as { data?: Record<string, { difficulty: string } | null> };
  const result: Record<string, string> = {};
  slugs.forEach((slug, i) => { result[slug] = json.data?.[`q${i}`]?.difficulty ?? "Medium"; });
  return result;
}

async function syncLeetCode(userId: string, username: string, pool: Pool): Promise<SyncResult> {
  const submissions = await fetchLCSubmissions(username);
  const seen = await seenIds(userId, "leetcode", pool);
  const fresh = submissions.filter((s) => !seen.has(s.id));
  if (fresh.length === 0) return { newEvents: [] };

  const difficulties = await fetchLCDifficulties(fresh.map((s) => s.titleSlug));
  const newEvents: IntegrationEvent[] = [];

  for (const sub of fresh) {
    const difficulty = difficulties[sub.titleSlug] ?? "Medium";
    const points = LC_POINTS[difficulty] ?? 10;
    const event: IntegrationEvent = {
      id: sub.id,
      source: "leetcode",
      eventType: "solve",
      title: `Solved "${sub.title}" (${difficulty})`,
      points,
      occurredAt: new Date(parseInt(sub.timestamp, 10) * 1000).toISOString(),
    };
    await insertEvent(userId, event, pool);
    newEvents.push(event);
  }
  return { newEvents };
}

// ─── Codeforces sync ─────────────────────────────────────────────────────────

type CFProblem = { name: string; rating?: number };
type CFSubmission = { id: number; verdict: string; creationTimeSeconds: number; problem: CFProblem };

const cfPoints = (rating: number | undefined) => {
  if (!rating) return 10;
  if (rating < 1200) return 8;
  if (rating <= 1800) return 15;
  return 25;
};

async function syncCodeforces(userId: string, username: string, pool: Pool): Promise<SyncResult> {
  const resp = await fetch(
    `https://codeforces.com/api/user.status?handle=${encodeURIComponent(username)}&count=100`,
    { headers: { "User-Agent": "build-city-app" } },
  );
  if (!resp.ok) throw new Error(`Codeforces API returned ${resp.status}`);
  const json = (await resp.json()) as { status: string; comment?: string; result?: CFSubmission[] };
  if (json.status !== "OK") throw new Error(json.comment ?? "Codeforces error — check handle");

  const seen = await seenIds(userId, "codeforces", pool);
  const newEvents: IntegrationEvent[] = [];

  for (const sub of json.result ?? []) {
    if (sub.verdict !== "OK") continue;
    const id = String(sub.id);
    if (seen.has(id)) continue;
    const points = cfPoints(sub.problem.rating);
    const ratingLabel = sub.problem.rating ? ` (${sub.problem.rating})` : "";
    const event: IntegrationEvent = {
      id,
      source: "codeforces",
      eventType: "solve",
      title: `Solved "${sub.problem.name}"${ratingLabel}`,
      points,
      occurredAt: new Date(sub.creationTimeSeconds * 1000).toISOString(),
    };
    await insertEvent(userId, event, pool);
    newEvents.push(event);
  }
  return { newEvents };
}

// ─── CodeChef sync ────────────────────────────────────────────────────────────

type CCHeatEntry = { date: string; value: number };
type CCProfile = { heatMap?: CCHeatEntry[] | null };

async function syncCodeChef(userId: string, username: string, pool: Pool): Promise<SyncResult> {
  const resp = await fetch(
    `https://codechef-api.vercel.app/${encodeURIComponent(username)}`,
    { headers: { "User-Agent": "build-city-app" } },
  );
  if (resp.status === 404) throw new Error(`CodeChef user "${username}" not found`);
  if (!resp.ok) throw new Error(`CodeChef API returned ${resp.status}`);

  const json = (await resp.json()) as CCProfile;
  const heatMap = json.heatMap ?? [];
  const seen = await seenIds(userId, "codechef", pool);
  const newEvents: IntegrationEvent[] = [];

  for (const entry of heatMap) {
    if (!entry.value || entry.value <= 0) continue;
    const id = `${username}-${entry.date}`;
    if (seen.has(id)) continue;
    const event: IntegrationEvent = {
      id,
      source: "codechef",
      eventType: "solve",
      title: `Solved ${entry.value} problem${entry.value !== 1 ? "s" : ""} on CodeChef`,
      points: entry.value * 10,
      occurredAt: new Date(entry.date).toISOString(),
    };
    await insertEvent(userId, event, pool);
    newEvents.push(event);
  }
  return { newEvents };
}

// ─── HuggingFace sync ────────────────────────────────────────────────────────

type HFItem = { id: string; createdAt?: string; lastModified?: string };

async function syncHuggingFace(userId: string, username: string, pool: Pool): Promise<SyncResult> {
  const headers = { "User-Agent": "build-city-app" };
  const base = `https://huggingface.co/api`;

  const [modelsRes, datasetsRes, spacesRes] = await Promise.all([
    fetch(`${base}/models?author=${encodeURIComponent(username)}&limit=50`, { headers }),
    fetch(`${base}/datasets?author=${encodeURIComponent(username)}&limit=50`, { headers }),
    fetch(`${base}/spaces?author=${encodeURIComponent(username)}&limit=50`, { headers }),
  ]);

  const seen = await seenIds(userId, "huggingface", pool);
  const newEvents: IntegrationEvent[] = [];

  const process = async (res: Response, kind: string, points: number) => {
    if (!res.ok) return;
    const items = (await res.json()) as HFItem[];
    for (const item of items) {
      const id = `${kind}-${item.id}`;
      if (seen.has(id)) continue;
      const occurredAt = item.createdAt ?? item.lastModified ?? new Date().toISOString();
      const event: IntegrationEvent = {
        id,
        source: "huggingface",
        eventType: kind,
        title: `Published ${kind}: ${item.id}`,
        points,
        occurredAt,
      };
      await insertEvent(userId, event, pool);
      newEvents.push(event);
    }
  };

  await process(modelsRes, "model", 20);
  await process(datasetsRes, "dataset", 15);
  await process(spacesRes, "space", 10);

  return { newEvents };
}

// ─── Chess.com sync ───────────────────────────────────────────────────────────

type ChessPlayer = { username: string; result: string };
type ChessGame   = { url: string; end_time: number; white: ChessPlayer; black: ChessPlayer };

const CHESS_POINTS: Record<string, number> = {
  win: 5, agreed: 2, repetition: 2, stalemate: 2, insufficient: 2,
  timevsinsufficient: 2, "50move": 2, draw: 2,
  resigned: 1, checkmated: 1, timeout: 1, abandoned: 1, kingofthehill: 1,
};

const DRAW_RESULTS = new Set(["agreed", "repetition", "stalemate", "draw", "50move", "insufficient", "timevsinsufficient"]);

async function syncChesscom(userId: string, username: string, pool: Pool): Promise<SyncResult> {
  const headers = { "User-Agent": "build-city-app" };
  const lowerUser = username.toLowerCase();

  const archivesResp = await fetch(
    `https://api.chess.com/pub/player/${encodeURIComponent(lowerUser)}/games/archives`,
    { headers },
  );
  if (archivesResp.status === 404) throw new Error(`Chess.com player "${username}" not found`);
  if (!archivesResp.ok) throw new Error(`Chess.com API returned ${archivesResp.status}`);

  const { archives } = (await archivesResp.json()) as { archives: string[] };
  const recentArchives = archives.slice(-2); // last 2 months only

  const seen = await seenIds(userId, "chesscom", pool);
  const newEvents: IntegrationEvent[] = [];

  for (const archiveUrl of recentArchives) {
    const gamesResp = await fetch(archiveUrl, { headers });
    if (!gamesResp.ok) continue;
    const { games } = (await gamesResp.json()) as { games: ChessGame[] };

    for (const game of games) {
      const id = game.url.split("/").pop() ?? game.url;
      if (seen.has(id)) continue;

      const isWhite  = game.white.username.toLowerCase() === lowerUser;
      const myResult = isWhite ? game.white.result : game.black.result;
      const points   = CHESS_POINTS[myResult] ?? 1;
      const label    = myResult === "win" ? "Won" : DRAW_RESULTS.has(myResult) ? "Drew" : "Lost";

      const event: IntegrationEvent = {
        id,
        source: "chesscom",
        eventType: myResult,
        title: `${label} a game on Chess.com`,
        points,
        occurredAt: new Date(game.end_time * 1000).toISOString(),
      };
      await insertEvent(userId, event, pool);
      newEvents.push(event);
    }
  }
  return { newEvents };
}

// ─── Routes ──────────────────────────────────────────────────────────────────

router.get("/", async (req, res) => {
  const userId = getUserId(req);
  try {
    const [{ rows: accounts }, { rows: events }] = await Promise.all([
      db.query<IntegrationRow>("SELECT * FROM integrations WHERE user_id = $1 ORDER BY source", [userId]),
      db.query<EventRow>(
        "SELECT * FROM integration_events WHERE user_id = $1 ORDER BY occurred_at DESC LIMIT 100",
        [userId],
      ),
    ]);
    res.json({
      accounts: accounts.map((r) => ({ source: r.source, username: r.username, lastSyncedAt: r.last_synced_at })),
      events: events.map((r) => ({
        id: r.external_id,
        source: r.source,
        eventType: r.event_type,
        title: r.title,
        points: r.points,
        occurredAt: r.occurred_at,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load integrations" });
  }
});

router.put("/:source", async (req, res) => {
  const userId = getUserId(req);
  const source = req.params.source as Source;
  const { username } = req.body as { username: string };

  if (!VALID_SOURCES.includes(source)) {
    res.status(400).json({ error: "Invalid source" });
    return;
  }
  if (!username?.trim()) {
    res.status(400).json({ error: "username is required" });
    return;
  }

  try {
    await db.query(
      `INSERT INTO integrations (user_id, source, username)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, source) DO UPDATE SET username = EXCLUDED.username, last_synced_at = NULL`,
      [userId, source, username.trim()],
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save integration" });
  }
});

router.delete("/:source", async (req, res) => {
  const userId = getUserId(req);
  const { source } = req.params;
  try {
    await Promise.all([
      db.query("DELETE FROM integrations WHERE user_id = $1 AND source = $2", [userId, source]),
      db.query("DELETE FROM integration_events WHERE user_id = $1 AND source = $2", [userId, source]),
    ]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to disconnect" });
  }
});

router.post("/:source/sync", async (req, res) => {
  const userId = getUserId(req);
  const source = req.params.source as Source;

  const { rows } = await db.query<IntegrationRow>(
    "SELECT * FROM integrations WHERE user_id = $1 AND source = $2",
    [userId, source],
  );
  if (!rows[0]) {
    res.status(404).json({ error: "Account not connected" });
    return;
  }

  const { username } = rows[0];

  try {
    let result: SyncResult = { newEvents: [] };

    if (source === "github")      result = await syncGitHub(userId, username, db);
    else if (source === "leetcode")   result = await syncLeetCode(userId, username, db);
    else if (source === "codeforces") result = await syncCodeforces(userId, username, db);
    else if (source === "codechef")   result = await syncCodeChef(userId, username, db);
    else if (source === "huggingface") result = await syncHuggingFace(userId, username, db);
    else if (source === "chesscom")   result = await syncChesscom(userId, username, db);

    await db.query(
      "UPDATE integrations SET last_synced_at = NOW() WHERE user_id = $1 AND source = $2",
      [userId, source],
    );

    res.json({
      newEvents: result.newEvents,
      totalPoints: result.newEvents.reduce((s, e) => s + e.points, 0),
      debug: result.debug,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(`[integrations] sync ${source} failed:`, err);
    res.status(500).json({ error: msg });
  }
});

export default router;
