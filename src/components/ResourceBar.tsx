import { Activity, BookOpen, Coins, Flame, Gem, Sparkles, Sprout, Trees } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ResourceKey, Resources } from "../types/city";

export const resourceMeta: Record<ResourceKey, { label: string; icon: LucideIcon; color: string }> = {
  gold:         { label: "Gold",         icon: Coins,    color: "text-amber-600 dark:text-amber-400"   },
  wood:         { label: "Wood",         icon: Trees,    color: "text-emerald-700 dark:text-emerald-400" },
  stone:        { label: "Stone",        icon: Gem,      color: "text-slate-600 dark:text-slate-400"    },
  knowledge:    { label: "Knowledge",    icon: BookOpen, color: "text-indigo-700 dark:text-indigo-400"  },
  energy:       { label: "Energy",       icon: Activity, color: "text-rose-700 dark:text-rose-400"      },
  wisdom:       { label: "Wisdom",       icon: Sparkles, color: "text-violet-700 dark:text-violet-400"  },
  food:         { label: "Food",         icon: Sprout,   color: "text-lime-700 dark:text-lime-400"      },
  productivity: { label: "Productivity", icon: Flame,    color: "text-orange-700 dark:text-orange-400"  },
};

export const resourceKeys: ResourceKey[] = [
  "gold", "wood", "stone", "knowledge", "energy", "wisdom", "food", "productivity",
];

export function ResourceBar({ resources, compact }: { resources: Resources; compact: boolean }) {
  const visibleKeys = compact ? resourceKeys : resourceKeys.slice(0, 6);
  return (
    <div className={`grid gap-2 ${compact ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3"}`}>
      {visibleKeys.map((key) => {
        const meta = resourceMeta[key];
        const Icon = meta.icon;
        return (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800" key={key}>
            <div className="mb-1 flex items-center gap-2">
              <Icon className={`h-4 w-4 ${meta.color}`} />
              <span className="truncate text-xs font-bold uppercase text-slate-500 dark:text-slate-400">{meta.label}</span>
            </div>
            <p className="text-lg font-bold text-slate-950 dark:text-white">{resources[key].toLocaleString()}</p>
          </div>
        );
      })}
    </div>
  );
}
