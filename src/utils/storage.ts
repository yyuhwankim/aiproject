import { MathProblem, ProblemHistory } from '../types';

const STORAGE_KEY = 'mathmind_history';

export const saveProblem = (problem: Omit<MathProblem, 'id' | 'timestamp'>) => {
  const history = getProblemHistory();
  const newProblem: MathProblem = {
    ...problem,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };
  
  history.problems.unshift(newProblem);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  return newProblem;
};

export const getProblemHistory = (): ProblemHistory => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return { problems: [] };
  }
  return JSON.parse(stored);
};

export const clearProblemHistory = () => {
  localStorage.removeItem(STORAGE_KEY);
}; 