import { create } from "zustand";
import { persist } from "zustand/middleware";
import { buildings, categoryRewards, difficultyRewards, initialResources } from "../gameData";
import type { BuildingId, Category, Difficulty, RareDrop, Resources, Task, Tile } from "../types";

type TaskInput = {
  name: string;
  difficulty: Difficulty;
  category: Category;
  estimatedMinutes: number;
};

type GameState = {
  cityName: string;
  population: number;
  resources: Resources;
  tasks: Task[];
  tiles: Tile[];
  streak: number;
  lastActiveDate: string | null;
  lastPassiveClaimDate: string | null;
  rareDrops: RareDrop[];
  selectedTileId: number | null;
  addTask: (input: TaskInput) => void;
  completeTask: (taskId: string) => void;
  buildOnTile: (tileId: number, buildingId: BuildingId) => void;
  selectTile: (tileId: number | null) => void;
  collectPassiveRewards: () => void;
  resetDemo: () => void;
};

const todayKey = () => new Date().toISOString().slice(0, 10);

const yesterdayKey = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
};

const emptyTiles = (): Tile[] =>
  Array.from({ length: 12 }, (_, index) => ({
    id: index,
    buildingId: index === 0 ? "home" : index === 1 ? "farm" : index === 5 ? "school" : null,
  }));

const addResources = (base: Resources, delta: Partial<Resources>, multiplier = 1): Resources => {
  const next = { ...base };
  for (const key of Object.keys(delta) as Array<keyof Resources>) {
    next[key] += Math.round((delta[key] ?? 0) * multiplier);
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

  if (roll <= 0.001) {
    return { id: crypto.randomUUID(), name: "Dragon Monument", chance: 0.1, collectedAt: now };
  }

  if (roll <= 0.006) {
    return { id: crypto.randomUUID(), name: "Wonder of the World", chance: 0.5, collectedAt: now };
  }

  if (roll <= 0.016) {
    return { id: crypto.randomUUID(), name: "Golden Statue", chance: 1, collectedAt: now };
  }

  return null;
};

const seedTasks = (): Task[] => [
  {
    id: crypto.randomUUID(),
    name: "Workout",
    difficulty: "Medium",
    category: "Fitness",
    estimatedMinutes: 45,
    completed: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: "Coding",
    difficulty: "Hard",
    category: "Work",
    estimatedMinutes: 90,
    completed: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: "Read Book",
    difficulty: "Easy",
    category: "Reading",
    estimatedMinutes: 30,
    completed: false,
    createdAt: new Date().toISOString(),
  },
];

const initialState = {
  cityName: "Addy City",
  population: 1250,
  resources: initialResources,
  tasks: seedTasks(),
  tiles: emptyTiles(),
  streak: 1,
  lastActiveDate: todayKey(),
  lastPassiveClaimDate: null,
  rareDrops: [],
  selectedTileId: null,
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...initialState,
      addTask: (input) =>
        set((state) => ({
          tasks: [
            {
              id: crypto.randomUUID(),
              completed: false,
              createdAt: new Date().toISOString(),
              ...input,
            },
            ...state.tasks,
          ],
        })),
      completeTask: (taskId) =>
        set((state) => {
          const today = todayKey();
          const alreadyCompleted = state.tasks.find((task) => task.id === taskId)?.completed;
          if (alreadyCompleted) return state;

          const nextStreak =
            state.lastActiveDate === today
              ? state.streak
              : state.lastActiveDate === yesterdayKey()
                ? state.streak + 1
                : 1;
          const multiplier = getMultiplier(nextStreak);
          const task = state.tasks.find((item) => item.id === taskId);
          if (!task) return state;

          const rareDrop = rollRareDrop();
          let resources = addResources(state.resources, difficultyRewards[task.difficulty], multiplier);
          resources = addResources(resources, categoryRewards[task.category], multiplier);

          return {
            tasks: state.tasks.map((item) => (item.id === taskId ? { ...item, completed: true } : item)),
            resources,
            streak: nextStreak,
            lastActiveDate: today,
            rareDrops: rareDrop ? [rareDrop, ...state.rareDrops] : state.rareDrops,
          };
        }),
      buildOnTile: (tileId, buildingId) =>
        set((state) => {
          const tile = state.tiles.find((item) => item.id === tileId);
          const building = buildings.find((item) => item.id === buildingId);
          if (!tile || tile.buildingId || !building || !canAfford(state.resources, building.cost)) return state;

          return {
            resources: subtractCost(state.resources, building.cost),
            population: state.population + building.population,
            selectedTileId: null,
            tiles: state.tiles.map((item) => (item.id === tileId ? { ...item, buildingId } : item)),
          };
        }),
      selectTile: (tileId) => set({ selectedTileId: tileId }),
      collectPassiveRewards: () =>
        set((state) => {
          const today = todayKey();
          if (state.lastPassiveClaimDate === today || state.lastActiveDate !== today) return state;

          const passive = state.tiles.reduce<Partial<Resources>>((total, tile) => {
            const building = buildings.find((item) => item.id === tile.buildingId);
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
        }),
      resetDemo: () => set({ ...initialState, tasks: seedTasks(), tiles: emptyTiles() }),
    }),
    {
      name: "addy-city-save",
      partialize: (state) => ({
        cityName: state.cityName,
        population: state.population,
        resources: state.resources,
        tasks: state.tasks,
        tiles: state.tiles,
        streak: state.streak,
        lastActiveDate: state.lastActiveDate,
        lastPassiveClaimDate: state.lastPassiveClaimDate,
        rareDrops: state.rareDrops,
        selectedTileId: state.selectedTileId,
      }),
    },
  ),
);

export const selectStage = (population: number) => {
  if (population >= 5000) return "Metropolis";
  if (population >= 500) return "City";
  if (population >= 100) return "Town";
  return "Village";
};

export const selectStreakMultiplier = (streak: number) => getMultiplier(streak);

export const selectCityPaused = (lastActiveDate: string | null) => lastActiveDate !== todayKey();
