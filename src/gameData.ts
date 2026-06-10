import type { Building, Resources, StatKey } from "./types/city";
import type { Category, Difficulty } from "./types/task";

export const difficultyRewards: Record<Difficulty, Partial<Resources>> = {
  Easy:   { gold: 10, wood: 5,  stone: 2  },
  Medium: { gold: 25, wood: 10, stone: 5  },
  Hard:   { gold: 50, wood: 20, stone: 10 },
};

export const categoryRewards: Record<Category, Partial<Resources>> = {
  Study:   { knowledge: 12 },
  Work:    { gold: 30 },
  Fitness: { energy: 12 },
  Reading: { wisdom: 12 },
};

// XP awarded to the relevant character stat per task difficulty
export const difficultyStatXP: Record<Difficulty, number> = {
  Easy:   8,
  Medium: 15,
  Hard:   25,
};

// Which character stat a task category feeds
export const categoryToStat: Record<Category, StatKey> = {
  Fitness: "strength",
  Study:   "intelligence",
  Work:    "wealth",
  Reading: "wisdom",
};

export const buildings: Building[] = [
  {
    id: "home",
    name: "Home",
    lifeArea: "Stability",
    description: "A base for recovery, identity, and compounding routines.",
    cost: { gold: 100 },
    passive: {},
    population: 5,
    statBoost: { willpower: 0.10 },          // +10% Willpower XP
  },
  {
    id: "gym",
    name: "Gym",
    lifeArea: "Health",
    description: "Turns fitness consistency into visible capacity.",
    cost: { gold: 120, wood: 25 },
    passive: { energy: 8 },
    population: 0,
    statBoost: { strength: 0.25 },           // +25% Strength XP
  },
  {
    id: "library",
    name: "Library",
    lifeArea: "Knowledge",
    description: "Makes study and reading feel like expanding territory.",
    cost: { gold: 180, wood: 40 },
    passive: { knowledge: 10, wisdom: 4 },
    population: 0,
    statBoost: { intelligence: 0.20, wisdom: 0.10 }, // +20% Intelligence, +10% Wisdom
  },
  {
    id: "office",
    name: "Office",
    lifeArea: "Career",
    description: "Represents focused work, shipping, and skill leverage.",
    cost: { gold: 220, stone: 35 },
    passive: { gold: 18, productivity: 2 },
    population: 0,
    statBoost: { wealth: 0.25 },             // +25% Wealth XP
  },
  {
    id: "temple",
    name: "Temple",
    lifeArea: "Mindfulness",
    description: "Keeps growth connected to calm and reflection.",
    cost: { gold: 150, stone: 30 },
    passive: { wisdom: 8 },
    population: 0,
    statBoost: { wisdom: 0.25, willpower: 0.10 }, // +25% Wisdom, +10% Willpower
  },
  {
    id: "farm",
    name: "Farm",
    lifeArea: "Sustainability",
    description: "Daily fuel for the city and a reminder to keep systems simple.",
    cost: { gold: 50 },
    passive: { food: 10 },
    population: 0,
    // No stat boost — it's foundational infrastructure
  },
  {
    id: "school",
    name: "School",
    lifeArea: "Learning",
    description: "Adds a productivity bonus to future work.",
    cost: { gold: 200, wood: 40, stone: 20 },
    passive: { productivity: 2 },
    population: 0,
    statBoost: { intelligence: 0.15, wisdom: 0.05 }, // +15% Intelligence, +5% Wisdom
  },
  {
    id: "park",
    name: "Park",
    lifeArea: "Joy",
    description: "Creates a softer city that people want to come back to.",
    cost: { gold: 150, wood: 30 },
    passive: { energy: 3, wisdom: 3 },
    population: 2,
    statBoost: {                              // +5% to ALL stats
      strength: 0.05, intelligence: 0.05,
      wealth: 0.05, wisdom: 0.05, willpower: 0.05,
    },
  },
  {
    id: "hospital",
    name: "Hospital",
    lifeArea: "Resilience",
    description: "Protects momentum by making recovery part of the plan.",
    cost: { gold: 300, stone: 60 },
    passive: { energy: 6 },
    population: 8,
    statBoost: { strength: 0.10, willpower: 0.10 }, // +10% Strength, +10% Willpower
  },
];

export const initialResources: Resources = {
  gold:         1500,
  wood:         800,
  stone:        500,
  knowledge:    0,
  energy:       0,
  wisdom:       0,
  food:         0,
  productivity: 0,
};
