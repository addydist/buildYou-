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

export type StatKey = "strength" | "intelligence" | "wealth" | "wisdom" | "willpower";
export type CharacterStats = Record<StatKey, number>; // raw XP values

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
  statBoost?: Partial<Record<StatKey, number>>; // additive multiplier, e.g. 0.25 = +25% XP
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
