import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Task, TaskInput } from "../types/task";
import { taskService } from "../services/taskService";

type TaskState = {
  tasks: Task[];
  loadTasks: () => Promise<void>;
  addTask: (input: TaskInput) => Promise<void>;
  markCompleted: (taskId: string) => void;
  resetTasks: () => void;
};

export const useTaskStore = create<TaskState>()(
  persist(
    (set) => ({
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
      resetTasks: () => set({ tasks: [] }),
    }),
    { name: "addy-city-tasks" }
  )
);
