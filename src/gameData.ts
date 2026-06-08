import type { Building, Resources } from "./types/city";
import type { Category, Difficulty } from "./types/task";

export const difficultyRewards: Record<Difficulty, Partial<Resources>> = {
  Easy: { gold: 10, wood: 5, stone: 2 },
  Medium: { gold: 25, wood: 10, stone: 5 },
  Hard: { gold: 50, wood: 20, stone: 10 },
};

export const categoryRewards: Record<Category, Partial<Resources>> = {
  Study: { knowledge: 12 },
  Work: { gold: 30 },
  Fitness: { energy: 12 },
  Reading: { wisdom: 12 },
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
  },
  {
    id: "gym",
    name: "Gym",
    lifeArea: "Health",
    description: "Turns fitness consistency into visible capacity.",
    cost: { gold: 120, wood: 25 },
    passive: { energy: 8 },
    population: 0,
  },
  {
    id: "library",
    name: "Library",
    lifeArea: "Knowledge",
    description: "Makes study and reading feel like expanding territory.",
    cost: { gold: 180, wood: 40 },
    passive: { knowledge: 10, wisdom: 4 },
    population: 0,
  },
  {
    id: "office",
    name: "Office",
    lifeArea: "Career",
    description: "Represents focused work, shipping, and skill leverage.",
    cost: { gold: 220, stone: 35 },
    passive: { gold: 18, productivity: 2 },
    population: 0,
  },
  {
    id: "temple",
    name: "Temple",
    lifeArea: "Mindfulness",
    description: "Keeps growth connected to calm and reflection.",
    cost: { gold: 150, stone: 30 },
    passive: { wisdom: 8 },
    population: 0,
  },
  {
    id: "farm",
    name: "Farm",
    lifeArea: "Sustainability",
    description: "Daily fuel for the city and a reminder to keep systems simple.",
    cost: { gold: 50 },
    passive: { food: 10 },
    population: 0,
  },
  {
    id: "school",
    name: "School",
    lifeArea: "Learning",
    description: "Adds a productivity bonus to future work.",
    cost: { gold: 200, wood: 40, stone: 20 },
    passive: { productivity: 2 },
    population: 0,
  },
  {
    id: "park",
    name: "Park",
    lifeArea: "Joy",
    description: "Creates a softer city that people want to come back to.",
    cost: { gold: 150, wood: 30 },
    passive: { energy: 3, wisdom: 3 },
    population: 2,
  },
  {
    id: "hospital",
    name: "Hospital",
    lifeArea: "Resilience",
    description: "Protects momentum by making recovery part of the plan.",
    cost: { gold: 300, stone: 60 },
    passive: { energy: 6 },
    population: 8,
  },
];

export const initialResources: Resources = {
  gold: 1500,
  wood: 800,
  stone: 500,
  knowledge: 0,
  energy: 0,
  wisdom: 0,
  food: 0,
  productivity: 0,
};
