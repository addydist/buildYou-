import type { Task, TaskInput } from "../types/task";
import { authFetch } from "./apiClient";

const BASE = (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL ?? "http://localhost:3001";

export const taskService = {
  getAll: async (): Promise<Task[]> => {
    const res = await authFetch(`${BASE}/tasks`);
    if (!res.ok) throw new Error("Failed to fetch tasks");
    return res.json() as Promise<Task[]>;
  },

  create: async (input: TaskInput): Promise<Task> => {
    const res = await authFetch(`${BASE}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("Failed to create task");
    return res.json() as Promise<Task>;
  },

  complete: async (id: string): Promise<Task> => {
    const res = await authFetch(`${BASE}/tasks/${id}/complete`, { method: "PATCH" });
    if (!res.ok) throw new Error("Failed to complete task");
    return res.json() as Promise<Task>;
  },
};
