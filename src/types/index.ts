export interface MathProblem {
  id: string;
  topic: string;
  problem: string;
  solution: string;
  isCorrect: boolean | null;
  timestamp: number;
}

export interface ProblemHistory {
  problems: MathProblem[];
} 