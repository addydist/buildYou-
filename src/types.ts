export type Difficulty = "Easy" | "Medium" | "Hard";

export type Category = "Study" | "Work" | "Fitness" | "Reading";

export type ResourceKey =
  | "gold"
  | "wood"
  | "stone"
  | "knowledge"
  | "energy"
  | "wisdom"
  | "food"
  | "productivity";

export type Resources = Record<ResourceKey, number>;

export type Task = {
  id: string;
  name: string;
  difficulty: Difficulty;
  category: Category;
  estimatedMinutes: number;
  completed: boolean;
  createdAt: string;
};

export type BuildingId =
  | "home"
  | "gym"
  | "library"
  | "office"
  | "temple"
  | "farm"
  | "school"
  | "park"
  | "hospital";

export type Building = {
  id: BuildingId;
  name: string;
  lifeArea: string;
  description: string;
  cost: Partial<Resources>;
  passive: Partial<Resources>;
  population: number;
};

export type Tile = {
  id: number;
  buildingId: BuildingId | null;
};

export type RareDrop = {
  id: string;
  name: string;
  chance: number;
  collectedAt: string;
};
