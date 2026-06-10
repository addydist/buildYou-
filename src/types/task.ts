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
  isRecurring?: boolean;
  recurringGroupId?: string;
};

export type TaskInput = {
  name: string;
  difficulty: Difficulty;
  category: Category;
  estimatedMinutes: number;
  isRecurring?: boolean;
  recurringGroupId?: string;
};
