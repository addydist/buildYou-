import type { CharacterStats, RareDrop, Resources, Tile } from "../types/city";
import { authFetch } from "./apiClient";

const BASE = (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL ?? "http://localhost:3001";

export type CityStatePayload = {
  cityName: string;
  population: number;
  resources: Resources;
  tiles: Tile[];
  streak: number;
  lastActiveDate: string | null;
  lastPassiveClaimDate: string | null;
  rareDrops: RareDrop[];
  activityLog?: Record<string, number>;
  characterStats?: CharacterStats;
};

export const cityService = {
  load: async (): Promise<CityStatePayload | null> => {
    const res = await authFetch(`${BASE}/city`);
    if (!res.ok) throw new Error("Failed to load city state");
    return res.json() as Promise<CityStatePayload | null>;
  },

  save: async (state: CityStatePayload): Promise<void> => {
    const res = await authFetch(`${BASE}/city`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    });
    if (!res.ok) throw new Error("Failed to save city state");
  },
};
