import { type FormEvent, useMemo, useState } from "react";
import { BookOpen, BriefcaseBusiness, Dumbbell, Library, Plus } from "lucide-react";
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
  const addTask = useTaskStore((s) => s.addTask);
  const tasks = useTaskStore((s) => s.tasks);
  const [name, setName] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
  const [category, setCategory] = useState<Category>("Study");
  const [estimatedMinutes, setEstimatedMinutes] = useState(60);
  const [submitting, setSubmitting] = useState(false);

  const preview = useMemo(
    () => ({ ...difficultyRewards[difficulty], ...categoryRewards[category] }),
    [category, difficulty],
  );

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    await addTask({ name: name.trim(), difficulty, category, estimatedMinutes });
    setName("");
    setSubmitting(false);
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
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
          <RewardPreview rewards={preview} />
          <PrimaryButton icon={Plus} label={submitting ? "Creating…" : "Create task"} submit disabled={submitting} />
        </form>
      </Panel>

      <Panel title="Task List">
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} expanded />
          ))}
        </div>
      </Panel>
    </div>
  );
}
