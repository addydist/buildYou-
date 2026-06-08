import { BookOpen, BriefcaseBusiness, Dumbbell, Flame, Landmark, Library, Plus, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Category } from "../types/task";
import { useCityStore, selectCityPaused, selectStage, selectStreakMultiplier } from "../store/cityStore";
import { useTaskStore } from "../store/taskStore";
import { TaskCard } from "../components/TaskCard";
import { ResourceBar } from "../components/ResourceBar";
import { Panel } from "../components/ui/Panel";
import { PrimaryButton, SecondaryButton } from "../components/ui/Buttons";

type Screen = "dashboard" | "tasks" | "city" | "shop";

const categoryIcons: Record<Category, LucideIcon> = {
  Study: BookOpen,
  Work: BriefcaseBusiness,
  Fitness: Dumbbell,
  Reading: Library,
};

export function Dashboard({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  const {
    cityName,
    population,
    resources,
    streak,
    lastActiveDate,
    collectPassiveRewards,
    lastPassiveClaimDate,
  } = useCityStore();
  const tasks = useTaskStore((s) => s.tasks);
  const stage = selectStage(population);
  const completedToday = tasks.filter((t) => t.completed);
  const multiplier = selectStreakMultiplier(streak);
  const cityPaused = selectCityPaused(lastActiveDate);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-panel">
        <div className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="min-w-0">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-teal-700">{stage}</p>
                <h2 className="text-2xl font-bold text-slate-950">{cityName}</h2>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800">
                Pop. {population.toLocaleString()}
              </span>
            </div>
            <ResourceBar resources={resources} compact={false} />
          </div>
          <div className="rounded-lg bg-slate-950 p-4 text-white">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-300">Streak</p>
                <p className="text-3xl font-bold">{streak} day</p>
              </div>
              <Flame className="h-9 w-9 text-orange-300" />
            </div>
            <p className="text-sm text-slate-300">Current multiplier</p>
            <p className="mb-4 text-xl font-bold">x{multiplier}</p>
            <button
              className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-white text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
              disabled={cityPaused || lastPassiveClaimDate === today}
              onClick={collectPassiveRewards}
              type="button"
            >
              <Sparkles className="h-4 w-4" />
              {lastPassiveClaimDate === today ? "Collected" : cityPaused ? "Paused" : "Collect daily"}
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <Panel title="Today's Progress">
          <div className="space-y-2">
            {tasks.slice(0, 5).map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <PrimaryButton icon={Plus} label="Add task" onClick={() => onNavigate("tasks")} />
            <SecondaryButton icon={Landmark} label="View city" onClick={() => onNavigate("city")} />
          </div>
        </Panel>

        <Panel title="Life Balance">
          <div className="space-y-3">
            {(["Fitness", "Study", "Work", "Reading"] as Category[]).map((category) => {
              const Icon = categoryIcons[category];
              const count = completedToday.filter((t) => t.category === category).length;
              return (
                <div key={category} className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <Icon className="h-4 w-4 shrink-0 text-teal-700" />
                    <span className="truncate text-sm font-semibold">{category}</span>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </Panel>
      </section>
    </div>
  );
}
