import {
  Activity,
  BookOpen,
  BriefcaseBusiness,
  Dumbbell,
  Hammer,
  Home,
  Landmark,
  Leaf,
  Library,
  Sprout,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Building, BuildingId, ResourceKey, Resources } from "../types/city";
import { resourceMeta } from "./ResourceBar";

const buildingIcons: Record<BuildingId, LucideIcon> = {
  home: Home,
  gym: Dumbbell,
  library: Library,
  office: BriefcaseBusiness,
  temple: Landmark,
  farm: Sprout,
  school: BookOpen,
  park: Leaf,
  hospital: Activity,
};

export function CostLine({ cost }: { cost: Partial<Resources> }) {
  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(cost).map(([key, amount]) => {
        const meta = resourceMeta[key as ResourceKey];
        return (
          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200" key={key}>
            {amount} {meta.label}
          </span>
        );
      })}
    </div>
  );
}

export function PassiveLine({ building }: { building: Building }) {
  return (
    <div className="flex flex-wrap gap-2">
      {building.population ? (
        <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
          +{building.population} Population
        </span>
      ) : null}
      {Object.entries(building.passive).map(([key, amount]) => {
        const meta = resourceMeta[key as ResourceKey];
        return (
          <span className="rounded-full bg-teal-50 px-2 py-1 text-xs font-bold text-teal-800 dark:bg-teal-900/40 dark:text-teal-300" key={key}>
            +{amount} {meta.label} daily
          </span>
        );
      })}
    </div>
  );
}

export function BuildingCard({
  building,
  affordable,
  canBuild,
  onBuild,
}: {
  building: Building;
  affordable: boolean;
  canBuild: boolean;
  onBuild: () => void;
}) {
  const Icon = buildingIcons[building.id];
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-3 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-teal-50 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold dark:text-white">{building.name}</h3>
          <p className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">{building.lifeArea}</p>
        </div>
      </div>
      <p className="mb-3 min-h-12 text-sm text-slate-600 dark:text-slate-400">{building.description}</p>
      <CostLine cost={building.cost} />
      <div className="mt-3">
        <PassiveLine building={building} />
      </div>
      <button
        className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-md bg-slate-900 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 dark:bg-teal-600 dark:hover:bg-teal-500 dark:disabled:bg-slate-700 dark:disabled:text-slate-500"
        disabled={!affordable || !canBuild}
        onClick={onBuild}
        type="button"
      >
        <Hammer className="h-4 w-4" />
        Build
      </button>
    </article>
  );
}
