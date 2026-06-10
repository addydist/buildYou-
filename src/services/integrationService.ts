import { authFetch } from "./apiClient";
import type { IntegrationAccount, IntegrationEvent, IntegrationSource } from "../types/integration";

const BASE = (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL ?? "http://localhost:3001";

export type IntegrationsData = {
  accounts: IntegrationAccount[];
  events: IntegrationEvent[];
};

export type SyncResult = {
  newEvents: IntegrationEvent[];
  totalPoints: number;
};

export const integrationService = {
  getAll: async (): Promise<IntegrationsData> => {
    const res = await authFetch(`${BASE}/integrations`);
    if (!res.ok) throw new Error("Failed to load integrations");
    return res.json() as Promise<IntegrationsData>;
  },

  connect: async (source: IntegrationSource, username: string): Promise<void> => {
    const res = await authFetch(`${BASE}/integrations/${source}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    if (!res.ok) throw new Error("Failed to connect account");
  },

  disconnect: async (source: IntegrationSource): Promise<void> => {
    const res = await authFetch(`${BASE}/integrations/${source}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to disconnect account");
  },

  sync: async (source: IntegrationSource): Promise<SyncResult> => {
    const res = await authFetch(`${BASE}/integrations/${source}/sync`, { method: "POST" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText })) as { error?: string };
      throw new Error(body.error ?? "Sync failed");
    }
    return res.json() as Promise<SyncResult>;
  },
};
