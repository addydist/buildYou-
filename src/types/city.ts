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
