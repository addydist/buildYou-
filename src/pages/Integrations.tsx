import { useCallback, useEffect, useRef, useState } from "react";
import { Code2, Github, Loader2, RefreshCw, Trash2, Unplug, Zap } from "lucide-react";
import { integrationService } from "../services/integrationService";
import { useCityStore } from "../store/cityStore";
import type { IntegrationAccount, IntegrationEvent, IntegrationSource } from "../types/integration";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

const SOURCE_META: Record<IntegrationSource, { label: string; color: string; Icon: typeof Github }> = {
  github:   { label: "GitHub",   color: "bg-slate-900 dark:bg-slate-600",   Icon: Github },
  leetcode: { label: "LeetCode", color: "bg-amber-500 dark:bg-amber-600",   Icon: Code2  },
};

// ─── Source card ─────────────────────────────────────────────────────────────

type CardState = "idle" | "saving" | "syncing" | "disconnecting";

function SourceCard({
  source,
  account,
  onConnect,
  onSync,
  onDisconnect,
}: {
  source: IntegrationSource;
  account: IntegrationAccount | undefined;
  onConnect: (s: IntegrationSource, u: string) => Promise<void>;
  onSync: (s: IntegrationSource) => Promise<{ points: number }>;
  onDisconnect: (s: IntegrationSource) => Promise<void>;
}) {
  const { label, color, Icon } = SOURCE_META[source];
  const [input, setInput] = useState(account?.username ?? "");
  const [status, setStatus] = useState<CardState>("idle");
  const [lastPoints, setLastPoints] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connected = Boolean(account);

  const handleConnect = async () => {
    if (!input.trim()) return;
    setStatus("saving");
    setError(null);
    try {
      await onConnect(source, input.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setStatus("idle");
    }
  };

  const handleSync = async () => {
    setStatus("syncing");
    setError(null);
    setLastPoints(null);
    try {
      const { points } = await onSync(source);
      setLastPoints(points);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setStatus("idle");
    }
  };

  const handleDisconnect = async () => {
    setStatus("disconnecting");
    setError(null);
    try {
      await onDisconnect(source);
      setInput("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setStatus("idle");
    }
  };

  const busy = status !== "idle";

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg text-white ${color}`}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-900 dark:text-white">{label}</p>
          {connected && account?.lastSyncedAt && (
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Last synced {timeAgo(account.lastSyncedAt)}
            </p>
          )}
          {connected && !account?.lastSyncedAt && (
            <p className="text-xs text-slate-400 dark:text-slate-500">Never synced</p>
          )}
        </div>
        {connected && (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            Connected
          </span>
        )}
      </div>

      {/* Username input */}
      <div className="mb-3 flex gap-2">
        <input
          className="flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
          disabled={busy || connected}
          placeholder={`${label} username`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !connected && handleConnect()}
        />
        {!connected ? (
          <button
            className="flex items-center gap-1.5 rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={busy || !input.trim()}
            onClick={handleConnect}
            type="button"
          >
            {status === "saving" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
            Connect
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              className="flex items-center gap-1.5 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-teal-600 dark:hover:bg-teal-500"
              disabled={busy}
              onClick={handleSync}
              type="button"
            >
              {status === "syncing" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Sync
            </button>
            <button
              className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 dark:border-slate-700 dark:text-slate-400 dark:hover:border-rose-800 dark:hover:bg-rose-900/20 dark:hover:text-rose-400"
              disabled={busy}
              onClick={handleDisconnect}
              title="Disconnect"
              type="button"
            >
              {status === "disconnecting" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Feedback row */}
      {error && <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">{error}</p>}
      {lastPoints !== null && (
        <p className="text-xs font-semibold text-teal-700 dark:text-teal-400">
          {lastPoints > 0 ? `+${lastPoints} knowledge earned from new activity!` : "Already up to date — no new activity found."}
        </p>
      )}

      {/* Point guide */}
      {!connected && (
        <p className="mt-2 text-xs text-slate-400 dark:text-slate-600">
          {source === "github" && "Earn +3 per commit (max 15/push) · +20 per merged PR"}
          {source === "leetcode" && "Earn +8 (Easy) · +15 (Medium) · +25 (Hard) per solve"}
        </p>
      )}
    </div>
  );
}

// ─── Event feed ──────────────────────────────────────────────────────────────

function EventFeed({ events }: { events: IntegrationEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
        <Unplug className="mx-auto mb-3 h-8 w-8 text-slate-300 dark:text-slate-600" />
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No activity yet</p>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-600">Connect an account above and click Sync</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="border-b border-slate-100 px-5 py-3 dark:border-slate-800">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Activity Feed</h3>
      </div>
      <ul className="divide-y divide-slate-50 dark:divide-slate-800">
        {events.map((ev) => {
          const { label, color, Icon } = SOURCE_META[ev.source as IntegrationSource];
          return (
            <li key={`${ev.source}-${ev.id}`} className="flex items-center gap-3 px-5 py-3">
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white ${color}`}>
                <Icon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-slate-800 dark:text-slate-200">{ev.title}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {label} · {timeAgo(ev.occurredAt)}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-teal-50 px-2 py-0.5 text-xs font-bold text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
                +{ev.points} 📚
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function Integrations() {
  const onIntegrationSync = useCityStore((s) => s.onIntegrationSync);

  const [accounts, setAccounts] = useState<IntegrationAccount[]>([]);
  const [events, setEvents] = useState<IntegrationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    integrationService
      .getAll()
      .then((data) => {
        if (!mounted.current) return;
        setAccounts(data.accounts);
        setEvents(data.events);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
    return () => { mounted.current = false; };
  }, []);

  const handleConnect = useCallback(async (source: IntegrationSource, username: string) => {
    await integrationService.connect(source, username);
    setAccounts((prev) => {
      const next = prev.filter((a) => a.source !== source);
      return [...next, { source, username, lastSyncedAt: null }];
    });
  }, []);

  const handleSync = useCallback(async (source: IntegrationSource) => {
    const result = await integrationService.sync(source);
    if (result.newEvents.length > 0) {
      onIntegrationSync(result.newEvents);
      setEvents((prev) => {
        const existing = new Set(prev.map((e) => `${e.source}-${e.id}`));
        const fresh = result.newEvents.filter((e) => !existing.has(`${e.source}-${e.id}`));
        return [...fresh, ...prev];
      });
    }
    setAccounts((prev) =>
      prev.map((a) => (a.source === source ? { ...a, lastSyncedAt: new Date().toISOString() } : a)),
    );
    return { points: result.totalPoints };
  }, [onIntegrationSync]);

  const handleDisconnect = useCallback(async (source: IntegrationSource) => {
    await integrationService.disconnect(source);
    setAccounts((prev) => prev.filter((a) => a.source !== source));
    setEvents((prev) => prev.filter((e) => e.source !== source));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  const sources: IntegrationSource[] = ["github", "leetcode"];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-950 dark:text-white">Integrations</h2>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
          Connect external services to earn bonus knowledge resources for your city.
        </p>
      </div>

      {/* Source cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {sources.map((src) => (
          <SourceCard
            key={src}
            source={src}
            account={accounts.find((a) => a.source === src)}
            onConnect={handleConnect}
            onSync={handleSync}
            onDisconnect={handleDisconnect}
          />
        ))}
      </div>

      {/* Event feed */}
      <EventFeed events={events} />
    </div>
  );
}
