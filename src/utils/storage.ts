import { MathProblem } from '../types';

const PROBLEM_HISTORY_KEY = 'math_problem_history';

interface ProblemHistory {
  problems: MathProblem[];
}

const isBrowser = typeof window !== 'undefined';

export const saveProblem = (problem: Omit<MathProblem, 'id' | 'timestamp'>): MathProblem => {
  if (!isBrowser) return null;
  
  const history = getProblemHistory();
  const newProblem: MathProblem = {
    ...problem,
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
  };
  
  history.problems.unshift(newProblem);
  localStorage.setItem(PROBLEM_HISTORY_KEY, JSON.stringify(history));
  
  return newProblem;
};

export const getProblemHistory = (): ProblemHistory => {
  if (!isBrowser) return { problems: [] };
  
  const history = localStorage.getItem(PROBLEM_HISTORY_KEY);
  return history ? JSON.parse(history) : { problems: [] };
};

export const clearProblemHistory = (): void => {
  if (!isBrowser) return;
  
  localStorage.removeItem(PROBLEM_HISTORY_KEY);
}; 