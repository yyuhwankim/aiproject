export type ProblemDifficulty = 'easy' | 'similar' | 'hard';

export interface MathProblem {
  id: string;
  topic: string;
  problem: string;
  solution: string;
  isCorrect: boolean;
  timestamp: string;
}

export interface ProblemHistory {
  problems: MathProblem[];
}

export interface UserStats {
  totalProblems: number;
  correctAnswers: number;
  topicStats: {
    [topic: string]: {
      total: number;
      correct: number;
    };
  };
} 