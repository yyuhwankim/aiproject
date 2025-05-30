import { MathProblem, ProblemHistory, UserStats } from '../types';

const PROBLEM_HISTORY_KEY = 'math_problem_history';
const USER_STATS_KEY = 'user_stats';

const isBrowser = typeof window !== 'undefined';

export const saveProblem = (problem: Omit<MathProblem, 'id' | 'timestamp'>) => {
  if (!isBrowser) return null;

  const savedProblem: MathProblem = {
    ...problem,
    id: Date.now().toString(),
    timestamp: Date.now(),
  };

  const history = getProblemHistory();
  history.problems.unshift(savedProblem);
  localStorage.setItem(PROBLEM_HISTORY_KEY, JSON.stringify(history));

  // Update user stats
  updateUserStats(savedProblem);

  return savedProblem;
};

export const getProblemHistory = () => {
  if (!isBrowser) return { problems: [] };

  const history = localStorage.getItem(PROBLEM_HISTORY_KEY);
  return history ? JSON.parse(history) : { problems: [] };
};

export const getUserStats = (): UserStats => {
  if (!isBrowser) return {
    totalProblems: 0,
    correctAnswers: 0,
    topicStats: {},
  };

  const stats = localStorage.getItem(USER_STATS_KEY);
  return stats ? JSON.parse(stats) : {
    totalProblems: 0,
    correctAnswers: 0,
    topicStats: {},
  };
};

const updateUserStats = (problem: MathProblem) => {
  if (!isBrowser) return;

  const stats = getUserStats();
  
  // Update total problems
  stats.totalProblems += 1;
  
  // Update correct answers
  if (problem.isCorrect) {
    stats.correctAnswers += 1;
  }
  
  // Update topic stats
  if (!stats.topicStats[problem.topic]) {
    stats.topicStats[problem.topic] = {
      total: 0,
      correct: 0,
    };
  }
  
  stats.topicStats[problem.topic].total += 1;
  if (problem.isCorrect) {
    stats.topicStats[problem.topic].correct += 1;
  }
  
  localStorage.setItem(USER_STATS_KEY, JSON.stringify(stats));
};

export const clearProblemHistory = () => {
  if (!isBrowser) return;
  localStorage.removeItem(PROBLEM_HISTORY_KEY);
}; 