import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Task, TaskInput } from "../types/task";
import { taskService } from "../services/taskService";

type TaskState = {
  tasks: Task[];
  loadTasks: () => Promise<void>;
  addTask: (input: TaskInput) => Promise<void>;
  markCompleted: (taskId: string) => void;
  deleteTask: (taskId: string) => Promise<void>;
  resetTasks: () => void;
  checkDailyReset: () => Promise<void>;
};

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],

      loadTasks: async () => {
        try {
          const tasks = await taskService.getAll();
          set({ tasks });
        } catch (e) {
          console.error("Failed to load tasks from API", e);
        }
      },

      addTask: async (input) => {
        try {
          const task = await taskService.create(input);
          set((state) => ({ tasks: [task, ...state.tasks] }));
        } catch (e) {
          console.error("Failed to create task", e);
        }
      },

      markCompleted: (taskId) => {
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, completed: true } : t)),
        }));
        taskService.complete(taskId).catch(console.error);
      },

      deleteTask: async (taskId) => {
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== taskId) }));
        await taskService.delete(taskId).catch(console.error);
      },

      resetTasks: () => set({ tasks: [] }),

      checkDailyReset: async () => {
        const today = new Date().toISOString().slice(0, 10);
        const { tasks } = get();

        // Recurring tasks that already exist for today (no need to regenerate these)
        const todayGroupIds = new Set(
          tasks
            .filter((t) => t.isRecurring && t.recurringGroupId && t.createdAt.slice(0, 10) === today)
            .map((t) => t.recurringGroupId!),
        );

        // For each recurring group NOT yet regenerated today, find the most-recent template
        const templateMap = new Map<string, Task>();
        for (const task of tasks) {
          if (!task.isRecurring || !task.recurringGroupId) continue;
          if (todayGroupIds.has(task.recurringGroupId)) continue;
          const existing = templateMap.get(task.recurringGroupId);
          if (!existing || task.createdAt > existing.createdAt) {
            templateMap.set(task.recurringGroupId, task);
          }
        }

        // Prune state: keep today's recurring instances + non-completed / today-completed regular tasks
        set((state) => ({
          tasks: state.tasks.filter((t) => {
            const taskDate = t.createdAt.slice(0, 10);
            if (t.isRecurring) return taskDate === today;
            return !t.completed || taskDate === today;
          }),
        }));

        // Regenerate today's instances for each pending template
        const { addTask } = get();
        for (const [, template] of templateMap) {
          await addTask({
            name: template.name,
            difficulty: template.difficulty,
            category: template.category,
            estimatedMinutes: template.estimatedMinutes,
            isRecurring: true,
            recurringGroupId: template.recurringGroupId,
          });
        }
      },
    }),
    { name: "addy-city-tasks" },
  ),
);
