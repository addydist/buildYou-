import { useMemo } from "react";
import { useCityStore } from "../store/cityStore";
import type { StatKey } from "../types/city";

// ─── Level math ──────────────────────────────────────────────────────────────
// Level N requires N² × 50 total XP  →  Level = floor(sqrt(xp / 50))
export const xpToLevel = (xp: number): number => Math.floor(Math.sqrt(xp / 50));

export const xpProgress = (xp: number) => {
  const level = xpToLevel(xp);
  const thisLevelXP = level * level * 50;
  const nextLevelXP = (level + 1) * (level + 1) * 50;
  const required = nextLevelXP - thisLevelXP;   // XP needed for this level span
  const current  = xp - thisLevelXP;             // XP earned within current level
  return { level, current, required, pct: Math.min(Math.round((current / required) * 100), 100) };
};

const RANK_TITLES = [
  "Wanderer", "Apprentice", "Practitioner", "Achiever",
  "Expert", "Veteran", "Master", "Grand Master",
];
export const overallRank = (totalLevel: number): string =>
  RANK_TITLES[Math.min(Math.floor(totalLevel / 3), RANK_TITLES.length - 1)];

// ─── Stat meta ───────────────────────────────────────────────────────────────

type StatMeta = {
  key: StatKey;
  label: string;
  icon: string;
  barColor: string;
  bgLight: string;
  bgDark: string;
  textColor: string;
  description: string;
};

const STATS: StatMeta[] = [
  {
    key: "strength",
    label: "Strength",
    icon: "💪",
    barColor: "bg-orange-500",
    bgLight: "bg-orange-50",
    bgDark: "dark:bg-orange-950/30",
    textColor: "text-orange-700 dark:text-orange-400",
    description: "Grows from Fitness tasks",
  },
  {
    key: "intelligence",
    label: "Intelligence",
    icon: "🧠",
    barColor: "bg-blue-500",
    bgLight: "bg-blue-50",
    bgDark: "dark:bg-blue-950/30",
    textColor: "text-blue-700 dark:text-blue-400",
    description: "Grows from Study, GitHub & LeetCode",
  },
  {
    key: "wealth",
    label: "Wealth",
    icon: "💰",
    barColor: "bg-amber-500",
    bgLight: "bg-amber-50",
    bgDark: "dark:bg-amber-950/30",
    textColor: "text-amber-700 dark:text-amber-400",
    description: "Grows from Work tasks",
  },
  {
    key: "wisdom",
    label: "Wisdom",
    icon: "📚",
    barColor: "bg-purple-500",
    bgLight: "bg-purple-50",
    bgDark: "dark:bg-purple-950/30",
    textColor: "text-purple-700 dark:text-purple-400",
    description: "Grows from Reading tasks",
  },
  {
    key: "willpower",
    label: "Willpower",
    icon: "🔥",
    barColor: "bg-emerald-500",
    bgLight: "bg-emerald-50",
    bgDark: "dark:bg-emerald-950/30",
    textColor: "text-emerald-700 dark:text-emerald-400",
    description: "Grows with every task & streak",
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export function CharacterSheet() {
  const characterStats = useCityStore((s) => s.characterStats ?? { strength: 0, intelligence: 0, wealth: 0, wisdom: 0, willpower: 0 });
  const cityName       = useCityStore((s) => s.cityName);

  const totalLevel = useMemo(
    () => STATS.reduce((sum, s) => sum + xpToLevel(characterStats[s.key] ?? 0), 0),
    [characterStats],
  );
  const avgLevel = Math.floor(totalLevel / STATS.length);
  const rank = overallRank(avgLevel);

  return (
    <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Character</p>
          <h2 className="text-lg font-bold text-slate-950 dark:text-white">{cityName}</h2>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400 dark:text-slate-500">{rank}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">Lv {avgLevel}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="divide-y divide-slate-50 dark:divide-slate-800/60">
        {STATS.map((stat) => {
          const xp = characterStats[stat.key] ?? 0;
          const { level, current, required, pct } = xpProgress(xp);
          return (
            <div key={stat.key} className={`flex items-center gap-4 px-5 py-3.5 ${stat.bgLight} ${stat.bgDark}`}>
              {/* Icon + label */}
              <div className="w-28 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg leading-none">{stat.icon}</span>
                  <span className={`text-sm font-bold ${stat.textColor}`}>{stat.label}</span>
                </div>
                <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-600">{stat.description}</p>
              </div>

              {/* Bar + XP */}
              <div className="flex-1 min-w-0">
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <span className={`text-xs font-bold ${stat.textColor}`}>Lv {level}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    {current} / {required} XP
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${stat.barColor}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      <div className="border-t border-slate-100 px-5 py-2.5 dark:border-slate-800">
        <p className="text-[10px] text-slate-400 dark:text-slate-600">
          Total XP earned: {STATS.reduce((s, st) => s + (characterStats[st.key] ?? 0), 0).toLocaleString()} · Buildings boost XP gains
        </p>
      </div>
    </div>
  );
}
