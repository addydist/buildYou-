import { create } from "zustand";
import { persist } from "zustand/middleware";
import { buildings, categoryRewards, difficultyRewards, initialResources } from "../gameData";
import type { BuildingId, RareDrop, Resources, Tile } from "../types/city";
import type { Task } from "../types/task";
import { cityService } from "../services/cityService";

const todayKey = () => new Date().toISOString().slice(0, 10);

const yesterdayKey = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
};

const addResources = (base: Resources, delta: Partial<Resources>, mult = 1): Resources => {
  const next = { ...base };
  for (const key of Object.keys(delta) as Array<keyof Resources>) {
    next[key] += Math.round((delta[key] ?? 0) * mult);
  }
  return next;
};

const canAfford = (resources: Resources, cost: Partial<Resources>) =>
  Object.entries(cost).every(([key, amount]) => resources[key as keyof Resources] >= (amount ?? 0));

const subtractCost = (resources: Resources, cost: Partial<Resources>): Resources => {
  const next = { ...resources };
  for (const key of Object.keys(cost) as Array<keyof Resources>) {
    next[key] -= cost[key] ?? 0;
  }
  return next;
};

const getMultiplier = (streak: number) => {
  if (streak >= 30) return 2;
  if (streak >= 7) return 1.5;
  return 1;
};

const rollRareDrop = (): RareDrop | null => {
  const roll = Math.random();
  const now = new Date().toISOString();
  if (roll <= 0.001) return { id: crypto.randomUUID(), name: "Dragon Monument", chance: 0.1, collectedAt: now };
  if (roll <= 0.006) return { id: crypto.randomUUID(), name: "Wonder of the World", chance: 0.5, collectedAt: now };
  if (roll <= 0.016) return { id: crypto.randomUUID(), name: "Golden Statue", chance: 1, collectedAt: now };
  return null;
};

export const emptyTiles = (): Tile[] =>
  Array.from({ length: 12 }, (_, i) => ({
    id: i,
    buildingId: i === 0 ? "home" : i === 1 ? "farm" : i === 5 ? "school" : null,
  }));

type CityState = {
  cityName: string;
  population: number;
  resources: Resources;
  tiles: Tile[];
  streak: number;
  lastActiveDate: string | null;
  lastPassiveClaimDate: string | null;
  rareDrops: RareDrop[];
  selectedTileId: number | null;
  loadCity: () => Promise<void>;
  onTaskCompleted: (task: Task) => void;
  buildOnTile: (tileId: number, buildingId: BuildingId) => void;
  selectTile: (tileId: number | null) => void;
  collectPassiveRewards: () => void;
  resetCity: () => void;
};

const initialCityState = {
  cityName: "Addy City",
  population: 1250,
  resources: initialResources,
  tiles: emptyTiles(),
  streak: 1,
  lastActiveDate: todayKey(),
  lastPassiveClaimDate: null as string | null,
  rareDrops: [] as RareDrop[],
  selectedTileId: null as number | null,
};

const pushToApi = (get: () => CityState) => {
  const { cityName, population, resources, tiles, streak, lastActiveDate, lastPassiveClaimDate, rareDrops } = get();
  cityService
    .save({ cityName, population, resources, tiles, streak, lastActiveDate, lastPassiveClaimDate, rareDrops })
    .catch(console.error);
};

export const useCityStore = create<CityState>()(
  persist(
    (set, get) => ({
      ...initialCityState,
      loadCity: async () => {
        try {
          const data = await cityService.load();
          if (data) set(data);
        } catch (e) {
          console.error("Failed to load city from API", e);
        }
      },
      onTaskCompleted: (task) => {
        set((state) => {
          const today = todayKey();
          const nextStreak =
            state.lastActiveDate === today
              ? state.streak
              : state.lastActiveDate === yesterdayKey()
                ? state.streak + 1
                : 1;
          const mult = getMultiplier(nextStreak);
          let resources = addResources(state.resources, difficultyRewards[task.difficulty], mult);
          resources = addResources(resources, categoryRewards[task.category], mult);
          const rareDrop = rollRareDrop();
          return {
            resources,
            streak: nextStreak,
            lastActiveDate: today,
            rareDrops: rareDrop ? [rareDrop, ...state.rareDrops] : state.rareDrops,
          };
        });
        pushToApi(get);
      },
      buildOnTile: (tileId, buildingId) => {
        set((state) => {
          const tile = state.tiles.find((t) => t.id === tileId);
          const building = buildings.find((b) => b.id === buildingId);
          if (!tile || tile.buildingId || !building || !canAfford(state.resources, building.cost)) return state;
          return {
            resources: subtractCost(state.resources, building.cost),
            population: state.population + building.population,
            selectedTileId: null,
            tiles: state.tiles.map((t) => (t.id === tileId ? { ...t, buildingId } : t)),
          };
        });
        pushToApi(get);
      },
      selectTile: (tileId) => set({ selectedTileId: tileId }),
      collectPassiveRewards: () => {
        set((state) => {
          const today = todayKey();
          if (state.lastPassiveClaimDate === today || state.lastActiveDate !== today) return state;
          const passive = state.tiles.reduce<Partial<Resources>>((total, tile) => {
            const building = buildings.find((b) => b.id === tile.buildingId);
            if (!building) return total;
            for (const key of Object.keys(building.passive) as Array<keyof Resources>) {
              total[key] = (total[key] ?? 0) + (building.passive[key] ?? 0);
            }
            return total;
          }, {});
          return {
            resources: addResources(state.resources, passive),
            lastPassiveClaimDate: today,
          };
        });
        pushToApi(get);
      },
      resetCity: () => {
        const newState = { ...initialCityState, tiles: emptyTiles(), rareDrops: [] as RareDrop[] };
        set(newState);
        cityService
          .save({
            cityName: newState.cityName,
            population: newState.population,
            resources: newState.resources,
            tiles: newState.tiles,
            streak: newState.streak,
            lastActiveDate: newState.lastActiveDate,
            lastPassiveClaimDate: newState.lastPassiveClaimDate,
            rareDrops: newState.rareDrops,
          })
          .catch(console.error);
      },
    }),
    {
      name: "addy-city-state",
      partialize: (s) => ({
        cityName: s.cityName,
        population: s.population,
        resources: s.resources,
        tiles: s.tiles,
        streak: s.streak,
        lastActiveDate: s.lastActiveDate,
        lastPassiveClaimDate: s.lastPassiveClaimDate,
        rareDrops: s.rareDrops,
        selectedTileId: s.selectedTileId,
      }),
    }
  )
);

export const selectStage = (population: number) => {
  if (population >= 5000) return "Metropolis";
  if (population >= 500) return "City";
  if (population >= 100) return "Town";
  return "Village";
};

export const selectStreakMultiplier = (streak: number) => getMultiplier(streak);
export const selectCityPaused = (lastActiveDate: string | null) => lastActiveDate !== todayKey();
