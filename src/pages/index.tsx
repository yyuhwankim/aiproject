import { useState, useEffect } from 'react';
import Head from 'next/head';
import { MathProblem, ProblemDifficulty, LearningAnalysis } from '../types';
import { saveProblem, getProblemHistory } from '../utils/storage';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

export default function Home() {
  const [topic, setTopic] = useState('');
  const [problem, setProblem] = useState('');
  const [solution, setSolution] = useState('');
  const [showSolution, setShowSolution] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<MathProblem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<ProblemDifficulty>('similar');
  const [isClient, setIsClient] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysis, setAnalysis] = useState<LearningAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const savedHistory = getProblemHistory();
    setHistory(savedHistory.problems);
  }, []);

  const scrollToElement = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      const offset = element.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: offset,
        behavior: 'smooth'
      });
    }
  };

  const generateProblem = async () => {
    if (!topic.trim()) {
      setError('수학 주제를 입력해주세요.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      console.log('Sending request to generate problem for topic:', topic);
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic }),
      });
      
      const data = await response.json();
      console.log('Received response:', data);

      if (!response.ok) {
        throw new Error(data.error || data.message || '문제 생성 중 오류가 발생했습니다.');
      }

      if (!data.problem || !data.solution) {
        throw new Error('API 응답 형식이 올바르지 않습니다.');
      }

      setProblem(data.problem);
      setSolution(data.solution);
      setShowSolution(false);
      setIsCorrect(null);
      setTimeout(() => scrollToElement('problem-generator-section'), 100);
    } catch (error) {
      console.error('Error generating problem:', error);
      setError(error.message || '문제 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateSimilarProblem = async (originalProblem: string) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('Sending request to generate similar problem:', { problem: originalProblem, topic, difficulty: selectedDifficulty });
      const response = await fetch('/api/similar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          problem: originalProblem, 
          topic,
          difficulty: selectedDifficulty 
        }),
      });
      
      const data = await response.json();
      console.log('Received response:', data);

      if (!response.ok) {
        throw new Error(data.error || data.message || '비슷한 문제 생성 중 오류가 발생했습니다.');
      }

      if (!data.problem || !data.solution) {
        throw new Error('API 응답 형식이 올바르지 않습니다.');
      }

      setProblem(data.problem);
      setSolution(data.solution);
      setShowSolution(false);
      setIsCorrect(null);
    } catch (error) {
      console.error('Error generating similar problem:', error);
      setError(error.message || '비슷한 문제 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowSolution = () => {
    setShowSolution(true);
    setTimeout(() => scrollToElement('solution-section'), 100);
  };

  const handleCorrectness = (correct: boolean) => {
    setIsCorrect(correct);
    if (problem && solution) {
      const savedProblem = saveProblem({
        topic,
        problem,
        solution,
        isCorrect: correct,
      });
      setHistory(prev => [savedProblem, ...prev]);
    }
    setTimeout(() => scrollToElement('difficulty-section'), 100);
  };

  const handleDifficultySelect = (difficulty: ProblemDifficulty) => {
    setSelectedDifficulty(difficulty);
    setTimeout(() => scrollToElement('retry-section'), 100);
  };

  const analyzeLearning = async () => {
    if (history.length === 0) {
      setError('분석할 문제 기록이 없습니다.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ problems: history }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || '분석 중 오류가 발생했습니다.');
      }

      // 데이터 유효성 검사
      if (!data.strengths || !data.weaknesses || !data.recommendations || !data.overallStats) {
        throw new Error('분석 결과가 올바르지 않습니다.');
      }

      setAnalysis(data);
      setShowAnalysis(true);
    } catch (error) {
      console.error('Error analyzing learning data:', error);
      setError(error.message || '분석 중 오류가 발생했습니다.');
      setShowAnalysis(false);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderMath = (text: string) => {
    // LaTeX 수식이 $...$ 또는 $$...$$ 형식으로 되어있는지 확인
    const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/);
    return parts.map((part, index) => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        // 블록 수식
        const math = part.slice(2, -2);
        return <BlockMath key={index} math={math} />;
      } else if (part.startsWith('$') && part.endsWith('$')) {
        // 인라인 수식
        const math = part.slice(1, -1);
        return <InlineMath key={index} math={math} />;
      }
      return <span key={index}>{part}</span>;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      generateProblem();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Head>
        <title>MathMind AI - 수학 문제 생성 및 학습</title>
        <meta name="description" content="Gemini 기반 수학 문제 생성 및 학습 지원 웹 서비스" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="flex flex-col items-center mb-8 sm:mb-12 lg:mb-16">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 mb-4 text-center">
            MathMind AI
          </h1>
          <p className="text-gray-600 text-base sm:text-lg lg:text-xl text-center max-w-2xl leading-relaxed">
            AI 기반 수학 문제 생성 및 학습 지원 서비스로 수학 실력을 향상시켜보세요
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8 sm:mb-12">
          <button
            onClick={() => {
              setShowHistory(!showHistory);
              setShowAnalysis(false);
            }}
            className="px-6 py-3 rounded-full bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 text-gray-700 hover:text-blue-600 flex items-center justify-center gap-2 transform hover:scale-105"
          >
            <span className="text-base sm:text-lg">{showHistory ? '문제 생성하기' : '기록 보기'}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              {showHistory ? (
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              ) : (
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              )}
            </svg>
          </button>
          <button
            onClick={() => {
              setShowHistory(false);
              setShowAnalysis(!showAnalysis);
              if (!showAnalysis && !analysis) {
                analyzeLearning();
              }
            }}
            className="px-6 py-3 rounded-full bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 text-gray-700 hover:text-blue-600 flex items-center justify-center gap-2 transform hover:scale-105"
          >
            <span className="text-base sm:text-lg">{showAnalysis ? '문제 생성하기' : '학습 분석'}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        {showAnalysis ? (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">학습 분석</h2>
                <button
                  onClick={analyzeLearning}
                  disabled={isAnalyzing}
                  className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isAnalyzing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      분석 중...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      분석 새로고침
                    </>
                  )}
                </button>
              </div>
              {isAnalyzing ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">학습 데이터를 분석하고 있습니다...</p>
                </div>
              ) : analysis ? (
                <div className="space-y-8">
                  <div className="bg-white rounded-2xl shadow-xl p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">전체 통계</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 rounded-xl p-4">
                        <p className="text-sm text-blue-600 mb-1">총 문제 수</p>
                        <p className="text-2xl font-bold text-blue-700">{analysis.overallStats.totalProblems}</p>
                      </div>
                      <div className="bg-green-50 rounded-xl p-4">
                        <p className="text-sm text-green-600 mb-1">평균 정답률</p>
                        <p className="text-2xl font-bold text-green-700">{analysis.overallStats.averageCorrectRate.toFixed(1)}%</p>
                      </div>
                      <div className="bg-purple-50 rounded-xl p-4">
                        <p className="text-sm text-purple-600 mb-1">자주 푼 주제</p>
                        <p className="text-lg font-medium text-purple-700">
                          {analysis.overallStats.mostFrequentTopics.join(', ')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl shadow-xl p-6">
                      <h3 className="text-xl font-semibold text-gray-800 mb-4">강점</h3>
                      <div className="space-y-4">
                        {analysis.strengths.map((strength, index) => (
                          <div key={index} className="bg-green-50 rounded-xl p-4">
                            <div className="flex justify-between items-center mb-2">
                              <p className="font-medium text-green-800">{strength.topic}</p>
                              <p className="text-sm text-green-600">{strength.totalProblems}문제</p>
                            </div>
                            <div className="w-full bg-green-200 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${strength.correctRate}%` }}
                              ></div>
                            </div>
                            <p className="text-sm text-green-700 mt-1">정답률: {strength.correctRate.toFixed(1)}%</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl p-6">
                      <h3 className="text-xl font-semibold text-gray-800 mb-4">개선 필요</h3>
                      <div className="space-y-4">
                        {analysis.weaknesses.map((weakness, index) => (
                          <div key={index} className="bg-red-50 rounded-xl p-4">
                            <div className="flex justify-between items-center mb-2">
                              <p className="font-medium text-red-800">{weakness.topic}</p>
                              <p className="text-sm text-red-600">{weakness.totalProblems}문제</p>
                            </div>
                            <div className="w-full bg-red-200 rounded-full h-2">
                              <div
                                className="bg-red-500 h-2 rounded-full"
                                style={{ width: `${weakness.correctRate}%` }}
                              ></div>
                            </div>
                            <p className="text-sm text-red-700 mt-1">정답률: {weakness.correctRate.toFixed(1)}%</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-xl p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">학습 추천</h3>
                    <ul className="space-y-3">
                      {analysis.recommendations.map((recommendation, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <svg className="h-6 w-6 text-blue-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <p className="text-gray-700">{recommendation}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">분석할 문제 기록이 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        ) : !showHistory ? (
          <div className="max-w-3xl mx-auto">
            <div id="problem-generator-section" className="mb-8">
              <label htmlFor="topic" className="block text-lg sm:text-xl font-medium text-gray-700 mb-3">
                수학 주제 입력
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="topic"
                  value={topic}
                  onChange={(e) => {
                    setTopic(e.target.value);
                    setError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isLoading) {
                      generateProblem();
                    }
                  }}
                  placeholder="예: 이차방정식, 미분, 적분 등"
                  className={`w-full px-6 py-4 text-base sm:text-lg border-2 ${
                    error ? 'border-red-500' : 'border-gray-200'
                  } rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm`}
                />
                <button
                  onClick={generateProblem}
                  disabled={isLoading}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 ${
                    isLoading ? 'opacity-50 cursor-not-allowed hover:scale-100' : ''
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>생성 중...</span>
                    </div>
                  ) : '문제 생성하기'}
                </button>
              </div>
            </div>

            {problem && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 sm:p-8 transform transition-all duration-300 hover:shadow-2xl">
                <div id="problem-section" className="mb-8">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">문제</h2>
                  <div className="bg-gray-50/80 backdrop-blur-sm rounded-xl p-6">
                    <div className="text-lg sm:text-xl text-gray-700 whitespace-pre-wrap">
                      {renderMath(problem)}
                    </div>
                  </div>
                </div>

                <div className="flex justify-center mb-8">
                  <button
                    onClick={handleShowSolution}
                    className="px-8 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-200 transform hover:scale-105"
                  >
                    해답 보기
                  </button>
                </div>

                {showSolution && (
                  <div id="solution-section" className="mb-8">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">해답</h2>
                    <div className="bg-gray-50/80 backdrop-blur-sm rounded-xl p-6 mb-8">
                      <div className="text-lg sm:text-xl text-gray-700 whitespace-pre-wrap">
                        {renderMath(solution)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button
                        onClick={() => handleCorrectness(true)}
                        className="px-6 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 transform hover:scale-105"
                      >
                        맞았어요
                      </button>
                      <button
                        onClick={() => handleCorrectness(false)}
                        className="px-6 py-4 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 text-white font-medium hover:from-red-600 hover:to-rose-600 transition-all duration-200 transform hover:scale-105"
                      >
                        틀렸어요
                      </button>
                    </div>
                  </div>
                )}

                {isCorrect !== null && (
                  <div className="text-center mt-12">
                    <p className={`text-xl sm:text-2xl font-semibold mb-4 ${
                      isCorrect ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {isCorrect ? '정답입니다! 🎉' : '다시 한번 도전해보세요! 💪'}
                    </p>
                    <div id="difficulty-section" className="mb-6">
                      <p className="text-gray-700 mb-3 text-lg">문제 난이도를 선택해주세요:</p>
                      <div className="flex flex-wrap justify-center gap-3">
                        <button
                          onClick={() => handleDifficultySelect('easy')}
                          className={`px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 ${
                            selectedDifficulty === 'easy'
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          쉬운 문제
                        </button>
                        <button
                          onClick={() => handleDifficultySelect('similar')}
                          className={`px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 ${
                            selectedDifficulty === 'similar'
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          비슷한 문제
                        </button>
                        <button
                          onClick={() => handleDifficultySelect('hard')}
                          className={`px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 ${
                            selectedDifficulty === 'hard'
                              ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          어려운 문제
                        </button>
                      </div>
                    </div>
                    <div id="retry-section">
                      <button
                        onClick={() => {
                          generateSimilarProblem(problem);
                          setTimeout(() => scrollToElement('problem-generator-section'), 100);
                        }}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200 transform hover:scale-105"
                      >
                        <span>문제 다시 풀기</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">문제 기록</h2>
            <div className="grid gap-6">
              {history.map((item) => (
                <div key={item.id} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <span className="text-sm text-gray-500">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                      item.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {item.isCorrect ? '정답' : '오답'}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">{item.topic}</h3>
                  <div className="text-gray-700 mb-4">
                    {renderMath(item.problem)}
                  </div>
                  <button
                    onClick={() => {
                      setShowHistory(false);
                      generateSimilarProblem(item.problem);
                      setTimeout(() => scrollToElement('problem-generator-section'), 100);
                    }}
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
                  >
                    <span>비슷한 문제 다시 풀기</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
              {history.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">아직 풀어본 문제가 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 animate-fade-in">
          <div className="flex items-center">
            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p>{error}</p>
          </div>
        </div>
      )}
    </div>
  );
} 