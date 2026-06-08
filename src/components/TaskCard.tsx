import { BookOpen, BriefcaseBusiness, Check, Dumbbell, Library } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Category, Task } from "../types/task";
import { useCityStore } from "../store/cityStore";
import { useTaskStore } from "../store/taskStore";

const categoryIcons: Record<Category, LucideIcon> = {
  Study: BookOpen,
  Work: BriefcaseBusiness,
  Fitness: Dumbbell,
  Reading: Library,
};

export function TaskCard({ task, expanded = false }: { task: Task; expanded?: boolean }) {
  const markCompleted = useTaskStore((s) => s.markCompleted);
  const onTaskCompleted = useCityStore((s) => s.onTaskCompleted);
  const Icon = categoryIcons[task.category];

  const handleComplete = () => {
    markCompleted(task.id);
    onTaskCompleted(task);
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
      <button
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border ${
          task.completed
            ? "border-emerald-600 bg-emerald-600 text-white"
            : "border-slate-300 text-slate-400 dark:border-slate-600"
        }`}
        disabled={task.completed}
        onClick={handleComplete}
        title={task.completed ? "Completed" : "Complete task"}
        type="button"
      >
        {task.completed ? <Check className="h-4 w-4" /> : null}
      </button>
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm font-bold ${
            task.completed ? "text-slate-400 line-through dark:text-slate-600" : "text-slate-950 dark:text-white"
          }`}
        >
          {task.name}
        </p>
        {expanded ? (
          <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Icon className="h-3 w-3" />
              {task.category}
            </span>
            <span>{task.difficulty}</span>
            <span>{task.estimatedMinutes} mins</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
