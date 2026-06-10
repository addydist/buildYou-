import { create } from "zustand";
import { persist } from "zustand/middleware";
import { buildings, categoryRewards, categoryToStat, difficultyRewards, difficultyStatXP, initialResources } from "../gameData";
import type { BuildingId, CharacterStats, RareDrop, Resources, StatKey, Tile } from "../types/city";
import type { Task } from "../types/task";
import type { IntegrationEvent } from "../types/integration";
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

// Sum additive stat boosts from all built buildings
const getStatBoost = (tiles: Tile[], stat: StatKey): number => {
  let bonus = 0;
  for (const tile of tiles) {
    if (!tile.buildingId) continue;
    const b = buildings.find((bld) => bld.id === tile.buildingId);
    if (b?.statBoost?.[stat]) bonus += b.statBoost[stat];
  }
  return 1 + bonus; // e.g. 0.25 bonus → multiplier of 1.25
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
  Array.from({ length: 16 }, (_, i) => ({ id: i, buildingId: null }));

const zeroResources = (): Resources =>
  Object.fromEntries(Object.keys(initialResources).map((key) => [key, 0])) as Resources;

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
  activityLog: Record<string, number>;
  characterStats: CharacterStats;
  loadCity: () => Promise<void>;
  onTaskCompleted: (task: Task) => void;
  onIntegrationSync: (events: IntegrationEvent[]) => void;
  buildOnTile: (tileId: number, buildingId: BuildingId) => void;
  moveTile: (fromId: number, toId: number) => void;
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
  activityLog: {} as Record<string, number>,
  characterStats: { strength: 0, intelligence: 0, wealth: 0, wisdom: 0, willpower: 0 } as CharacterStats,
};

const pushToApi = (get: () => CityState) => {
  const { cityName, population, resources, tiles, streak, lastActiveDate, lastPassiveClaimDate, rareDrops, activityLog, characterStats } = get();
  cityService
    .save({ cityName, population, resources, tiles, streak, lastActiveDate, lastPassiveClaimDate, rareDrops, activityLog, characterStats })
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
          const isFirstTaskToday = state.lastActiveDate !== today;
          const nextStreak =
            state.lastActiveDate === today
              ? state.streak
              : state.lastActiveDate === yesterdayKey()
                ? state.streak + 1
                : 1;
          const mult = getMultiplier(nextStreak);

          // Resources (existing system)
          let resources = addResources(state.resources, difficultyRewards[task.difficulty], mult);
          resources = addResources(resources, categoryRewards[task.category], mult);
          const rareDrop = rollRareDrop();

          // Character stat XP
          const primaryStat = categoryToStat[task.category];
          const baseXP = difficultyStatXP[task.difficulty];
          const statMult = getStatBoost(state.tiles, primaryStat) * mult;
          const gainedStatXP = Math.round(baseXP * statMult);

          // Willpower: every completed task + bonus on first task of the day
          const willMult = getStatBoost(state.tiles, "willpower") * mult;
          const gainedWillpower = Math.round((3 + (isFirstTaskToday ? 15 : 0)) * willMult);

          return {
            resources,
            streak: nextStreak,
            lastActiveDate: today,
            rareDrops: rareDrop ? [rareDrop, ...state.rareDrops] : state.rareDrops,
            activityLog: {
              ...state.activityLog,
              [today]: (state.activityLog[today] ?? 0) + 1,
            },
            characterStats: {
              ...state.characterStats,
              [primaryStat]: state.characterStats[primaryStat] + gainedStatXP,
              willpower: state.characterStats.willpower + gainedWillpower,
            },
          };
        });
        pushToApi(get);
      },
      onIntegrationSync: (events) => {
        if (events.length === 0) return;
        set((state) => {
          const totalKnowledge = events.reduce((sum, e) => sum + e.points, 0);
          // Integration events also level up Intelligence (coding/learning activities)
          const intelMult = getStatBoost(state.tiles, "intelligence");
          const gainedIntel = Math.round(totalKnowledge * intelMult);
          return {
            resources: {
              ...state.resources,
              knowledge: state.resources.knowledge + totalKnowledge,
            },
            characterStats: {
              ...state.characterStats,
              intelligence: state.characterStats.intelligence + gainedIntel,
            },
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
      moveTile: (fromId, toId) => {
        set((state) => {
          const fromTile = state.tiles.find((t) => t.id === fromId);
          const toTile   = state.tiles.find((t) => t.id === toId);
          if (!fromTile || !toTile || !fromTile.buildingId) return state;
          return {
            selectedTileId: null,
            tiles: state.tiles.map((t) => {
              if (t.id === fromId) return { ...t, buildingId: toTile.buildingId };
              if (t.id === toId)   return { ...t, buildingId: fromTile.buildingId };
              return t;
            }),
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
        const newState = {
          ...initialCityState,
          population: 0,
          resources: zeroResources(),
          tiles: emptyTiles(),
          streak: 0,
          lastActiveDate: todayKey(),
          lastPassiveClaimDate: null as string | null,
          rareDrops: [] as RareDrop[],
          activityLog: {} as Record<string, number>,
          characterStats: { strength: 0, intelligence: 0, wealth: 0, wisdom: 0, willpower: 0 } as CharacterStats,
        };
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
            activityLog: newState.activityLog,
            characterStats: newState.characterStats,
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
        activityLog: s.activityLog,
        characterStats: s.characterStats,
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
