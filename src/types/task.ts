export type Difficulty = "Easy" | "Medium" | "Hard";
export type Category = "Study" | "Work" | "Fitness" | "Reading";

export type Task = {
  id: string;
  name: string;
  difficulty: Difficulty;
  category: Category;
  estimatedMinutes: number;
  completed: boolean;
  createdAt: string;
};

export type TaskInput = {
  name: string;
  difficulty: Difficulty;
  category: Category;
  estimatedMinutes: number;
};
