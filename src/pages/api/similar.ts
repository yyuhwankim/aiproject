import type { NextApiRequest, NextApiResponse } from 'next';
import { ProblemDifficulty } from '../../types';

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  if (!API_KEY) {
    return res.status(500).json({ message: 'API key is not configured' });
  }

  try {
    const { problem, topic, difficulty = 'similar' } = req.body;

    if (!problem || !topic) {
      return res.status(400).json({ message: 'Problem and topic are required' });
    }

    const difficultyPrompt = getDifficultyPrompt(difficulty as ProblemDifficulty);
    
    const prompt = `다음 수학 문제와 비슷한 문제를 생성해주세요:
    
    원본 문제: ${problem}
    주제: ${topic}
    ${difficultyPrompt}
    
    다음 형식으로 응답해주세요:
    문제: [문제 내용]
    해답: [해답과 풀이 과정]
    
    주의사항:
    1. 하나의 문제만 생성해주세요.
    2. 문제와 해답은 반드시 위의 형식을 정확히 지켜주세요.
    3. 추가 설명이나 다른 문제는 포함하지 마세요.
    4. 수학 기호와 수식은 LaTeX 형식으로 작성해주세요:
       - 인라인 수식은 $...$ 안에 작성 (예: $x^2 + 2x + 1$)
       - 블록 수식은 $$...$$ 안에 작성 (예: $$\\int_{0}^{1} x^2 dx$$)
    5. 분수는 \\frac{분자}{분모} 형식으로 작성해주세요.
    6. 적분은 \\int_{하한}^{상한} 형식으로 작성해주세요.
    7. 제곱근은 \\sqrt{내용} 형식으로 작성해주세요.`;

    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to generate content');
    }

    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response format from API');
    }

    const text = data.candidates[0].content.parts[0].text;
    const problemMatch = text.match(/문제:\s*([\s\S]*?)(?=해답:|$)/);
    const solutionMatch = text.match(/해답:\s*([\s\S]*?)(?=문제:|$)/);

    if (!problemMatch || !solutionMatch) {
      throw new Error('Invalid response format: Could not parse problem and solution');
    }

    res.status(200).json({
      problem: problemMatch[1].trim(),
      solution: solutionMatch[1].trim()
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      message: 'Error generating similar problem',
      error: error.message
    });
  }
}

function getDifficultyPrompt(difficulty: ProblemDifficulty): string {
  switch (difficulty) {
    case 'easy':
      return '난이도: 원본 문제보다 더 쉬운 문제를 생성해주세요. 기본 개념을 이해하기 쉽게 설명해주세요.';
    case 'hard':
      return '난이도: 원본 문제보다 더 어려운 문제를 생성해주세요. 더 복잡한 개념이나 추가적인 단계를 포함해주세요.';
    case 'similar':
    default:
      return '난이도: 원본 문제와 비슷한 난이도의 문제를 생성해주세요.';
  }
} 