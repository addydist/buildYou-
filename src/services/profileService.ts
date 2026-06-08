import { authFetch } from "./apiClient";

const BASE = (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL ?? "http://localhost:3001";

export type ProfilePayload = {
  displayName: string | null;
  bio: string | null;
  location: string | null;
  heightCm: number | null;
  weightKg: number | null;
  bodyFatPercent: number | null;
  muscleMassKg: number | null;
  goalWeightKg: number | null;
  goalBodyFat: number | null;
  goalWorkoutDays: number | null;
  goalDailyCalories: number | null;
  socialLinks: Record<string, string>;
};

export const emptyProfile = (): ProfilePayload => ({
  displayName: null,
  bio: null,
  location: null,
  heightCm: null,
  weightKg: null,
  bodyFatPercent: null,
  muscleMassKg: null,
  goalWeightKg: null,
  goalBodyFat: null,
  goalWorkoutDays: 5,
  goalDailyCalories: 2200,
  socialLinks: {},
});

export const profileService = {
  load: async (): Promise<ProfilePayload | null> => {
    const res = await authFetch(`${BASE}/profile`);
    if (!res.ok) throw new Error("Failed to load profile");
    return res.json() as Promise<ProfilePayload | null>;
  },

  save: async (data: ProfilePayload): Promise<ProfilePayload> => {
    const res = await authFetch(`${BASE}/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to save profile");
    return res.json() as Promise<ProfilePayload>;
  },
};
