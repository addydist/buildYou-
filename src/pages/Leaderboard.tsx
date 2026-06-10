import { useEffect, useState } from "react";
import { Flame, Loader2, Medal, Trophy } from "lucide-react";
import { leaderboardService } from "../services/leaderboardService";
import type { LeaderboardEntry, LeaderboardPeriod } from "../types/leaderboard";
import { overallRank } from "../components/CharacterSheet";

const RANK_STYLES: Array<{ icon: typeof Trophy; color: string }> = [
  { icon: Trophy, color: "text-amber-500" },
  { icon: Medal, color: "text-slate-400" },
  { icon: Medal, color: "text-amber-700" },
];

export function Leaderboard() {
  const [period, setPeriod] = useState<LeaderboardPeriod>("weekly");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    leaderboardService
      .get(period)
      .then((data) => {
        if (!cancelled) setEntries(data.entries);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load leaderboard");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [period]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-950 dark:text-white">Leaderboard</h2>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
          See how you stack up against other builders.
        </p>
      </div>

      {/* Period toggle */}
      <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900">
        {(["weekly", "alltime"] as LeaderboardPeriod[]).map((p) => (
          <button
            className={`rounded-md px-4 py-1.5 text-sm font-semibold transition ${
              period === p
                ? "bg-slate-900 text-white dark:bg-teal-600"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
            key={p}
            onClick={() => setPeriod(p)}
            type="button"
          >
            {p === "weekly" ? "This Week" : "All-Time"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-900/20 dark:text-rose-400">
          {error}
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
          <Trophy className="mx-auto mb-3 h-8 w-8 text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No rankings yet</p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-600">
            Complete tasks to climb the {period === "weekly" ? "weekly" : "all-time"} leaderboard
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <ul className="divide-y divide-slate-50 dark:divide-slate-800">
            {entries.map((entry, i) => {
              const rank = i + 1;
              const rankStyle = RANK_STYLES[i];
              return (
                <li
                  className={`flex items-center gap-4 px-5 py-3.5 ${
                    entry.isMe ? "bg-teal-50 dark:bg-teal-900/20" : ""
                  }`}
                  key={entry.userId}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                    {rankStyle ? (
                      <rankStyle.icon className={`h-5 w-5 ${rankStyle.color}`} />
                    ) : (
                      <span className="text-sm font-bold text-slate-400 dark:text-slate-500">#{rank}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-sm font-bold ${
                        entry.isMe ? "text-teal-800 dark:text-teal-300" : "text-slate-900 dark:text-white"
                      }`}
                    >
                      {entry.displayName}
                      {entry.isMe && (
                        <span className="ml-2 text-xs font-semibold text-teal-600 dark:text-teal-400">You</span>
                      )}
                    </p>
                    <p className="truncate text-xs text-slate-400 dark:text-slate-500">{entry.cityName}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <span className="flex items-center gap-1 text-xs font-semibold text-orange-500">
                      <Flame className="h-3.5 w-3.5" />
                      {entry.streak}
                    </span>
                    <div className="text-right">
                      {period === "weekly" ? (
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {entry.score} task{entry.score === 1 ? "" : "s"}
                        </p>
                      ) : (
                        <>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">Lv {entry.score}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-600">{overallRank(entry.score)}</p>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
