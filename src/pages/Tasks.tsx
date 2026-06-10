import { type FormEvent, useMemo, useState } from "react";
import { BookOpen, BriefcaseBusiness, Dumbbell, Library, Plus, RefreshCw } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Category, Difficulty } from "../types/task";
import type { ResourceKey } from "../types/city";
import { categoryRewards, difficultyRewards } from "../gameData";
import { useTaskStore } from "../store/taskStore";
import { TaskCard } from "../components/TaskCard";
import { resourceMeta } from "../components/ResourceBar";
import { Panel } from "../components/ui/Panel";
import { Field } from "../components/ui/Field";
import { PrimaryButton } from "../components/ui/Buttons";

const categoryIcons: Record<Category, LucideIcon> = {
  Study: BookOpen,
  Work: BriefcaseBusiness,
  Fitness: Dumbbell,
  Reading: Library,
};

function RewardPreview({ rewards }: { rewards: Partial<Record<ResourceKey, number>> }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
      <p className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-300">Reward Preview</p>
      <div className="flex flex-wrap gap-2">
        {Object.entries(rewards).map(([key, amount]) => {
          const meta = resourceMeta[key as ResourceKey];
          const Icon = meta.icon;
          return (
            <span
              className="flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200"
              key={key}
            >
              <Icon className={`h-3 w-3 ${meta.color}`} />
              +{amount} {meta.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export function Tasks() {
  const addTask    = useTaskStore((s) => s.addTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const tasks      = useTaskStore((s) => s.tasks);

  const [name, setName]                         = useState("");
  const [difficulty, setDifficulty]             = useState<Difficulty>("Medium");
  const [category, setCategory]                 = useState<Category>("Study");
  const [estimatedMinutes, setEstimatedMinutes] = useState(60);
  const [isRecurring, setIsRecurring]           = useState(false);
  const [submitting, setSubmitting]             = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const preview = useMemo(
    () => ({ ...difficultyRewards[difficulty], ...categoryRewards[category] }),
    [category, difficulty],
  );

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    const recurringGroupId = isRecurring ? crypto.randomUUID() : undefined;
    await addTask({ name: name.trim(), difficulty, category, estimatedMinutes, isRecurring, recurringGroupId });
    setName("");
    setIsRecurring(false);
    setSubmitting(false);
  };

  // Separate tasks into sections
  const dailyHabits    = tasks.filter((t) => t.isRecurring && t.createdAt.slice(0, 10) === today);
  const todayTasks     = tasks.filter((t) => !t.isRecurring && t.createdAt.slice(0, 10) === today);
  const carryOverTasks = tasks.filter((t) => !t.isRecurring && !t.completed && t.createdAt.slice(0, 10) !== today);

  return (
    <div className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
      {/* ── Create form ── */}
      <Panel title="Create Task">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Field label="Task Name">
            <input
              className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
              onChange={(e) => setName(e.target.value)}
              placeholder="Learn React"
              value={name}
            />
          </Field>

          <Field label="Difficulty">
            <select
              className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              value={difficulty}
            >
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
          </Field>

          <Field label="Category">
            <div className="grid grid-cols-2 gap-2">
              {(["Study", "Work", "Fitness", "Reading"] as Category[]).map((item) => {
                const Icon = categoryIcons[item];
                const active = category === item;
                return (
                  <button
                    className={`flex h-10 items-center justify-center gap-2 rounded-md border px-2 text-sm font-semibold ${
                      active
                        ? "border-teal-700 bg-teal-50 text-teal-900 dark:border-teal-500 dark:bg-teal-900/40 dark:text-teal-300"
                        : "border-slate-200 bg-white text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                    key={item}
                    onClick={() => setCategory(item)}
                    type="button"
                  >
                    <Icon className="h-4 w-4" />
                    {item}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Estimated Time (minutes)">
            <input
              className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              min={5}
              onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
              step={5}
              type="number"
              value={estimatedMinutes}
            />
          </Field>

          {/* Repeat Daily toggle */}
          <button
            className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-sm font-semibold transition ${
              isRecurring
                ? "border-teal-600 bg-teal-50 text-teal-800 dark:border-teal-500 dark:bg-teal-900/30 dark:text-teal-300"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
            }`}
            onClick={() => setIsRecurring((v) => !v)}
            type="button"
          >
            <span className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Repeat Daily
            </span>
            <span className={`text-xs ${isRecurring ? "text-teal-600 dark:text-teal-400" : "text-slate-400"}`}>
              {isRecurring ? "ON — auto-adds each day" : "OFF"}
            </span>
          </button>

          <RewardPreview rewards={preview} />
          <PrimaryButton icon={Plus} label={submitting ? "Creating…" : "Create task"} submit disabled={submitting} />
        </form>
      </Panel>

      {/* ── Task list ── */}
      <div className="space-y-4">
        {/* Daily Habits */}
        {dailyHabits.length > 0 && (
          <Panel title={`Daily Habits · ${dailyHabits.filter((t) => t.completed).length} / ${dailyHabits.length} done`}>
            <div className="space-y-2">
              {dailyHabits.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  expanded
                  onDelete={deleteTask}
                />
              ))}
            </div>
            <p className="mt-3 text-[11px] text-slate-400 dark:text-slate-600">
              Daily habits reset each morning. Completing them builds your streak and XP.
            </p>
          </Panel>
        )}

        {/* Today's one-off tasks */}
        <Panel title={`Today's Tasks · ${todayTasks.filter((t) => t.completed).length} / ${todayTasks.length} done`}>
          {todayTasks.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No tasks yet today — add one to grow your city!
            </p>
          ) : (
            <div className="space-y-2">
              {todayTasks.map((task) => (
                <TaskCard key={task.id} task={task} expanded />
              ))}
            </div>
          )}
        </Panel>

        {/* Carry-over incomplete tasks */}
        {carryOverTasks.length > 0 && (
          <Panel title={`Carry Over · ${carryOverTasks.length} task${carryOverTasks.length !== 1 ? "s" : ""}`}>
            <div className="space-y-2">
              {carryOverTasks.map((task) => (
                <TaskCard key={task.id} task={task} expanded />
              ))}
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}
