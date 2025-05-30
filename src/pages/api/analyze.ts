import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { MathProblem } from '../../types';

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || 'AIzaSyDZ7419rQQowomI7mqQrjxMxvBd0SnbNeo';
const genAI = new GoogleGenerativeAI(API_KEY);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { problems } = req.body as { problems: MathProblem[] };

    if (!problems || !Array.isArray(problems)) {
      return res.status(400).json({ error: 'Invalid problems data' });
    }

    // 문제 데이터를 분석하기 위한 프롬프트 생성
    const prompt = `
다음은 사용자의 수학 문제 풀이 기록입니다. 각 문제는 주제, 정답 여부, 시간 정보를 포함합니다.
이 데이터를 바탕으로 사용자의 학습 분석을 해주세요.

문제 기록:
${JSON.stringify(problems, null, 2)}

다음 형식으로 분석 결과를 JSON 형태로 제공해주세요. 반드시 유효한 JSON 형식을 지켜주세요:
{
  "strengths": [
    {
      "topic": "주제명",
      "correctRate": 정답률(0-100),
      "totalProblems": 총 문제 수
    }
  ],
  "weaknesses": [
    {
      "topic": "주제명",
      "correctRate": 정답률(0-100),
      "totalProblems": 총 문제 수
    }
  ],
  "recommendations": [
    "개선을 위한 구체적인 추천사항"
  ],
  "overallStats": {
    "totalProblems": 전체 문제 수,
    "averageCorrectRate": 전체 평균 정답률,
    "mostFrequentTopics": ["가장 자주 푼 주제들"]
  }
}

분석 시 다음 사항을 고려해주세요:
1. 정답률이 70% 이상인 주제는 강점으로 분류
2. 정답률이 50% 미만인 주제는 약점으로 분류
3. 추천사항은 구체적이고 실천 가능한 내용으로 작성
4. 전체 통계는 모든 문제를 종합적으로 분석
5. 반드시 유효한 JSON 형식을 지켜주세요
`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // JSON 문자열에서 실제 JSON 부분만 추출
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from AI');
    }

    const jsonStr = jsonMatch[0];
    let analysis;
    try {
      analysis = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse AI response:', text);
      throw new Error('Failed to parse AI response');
    }

    // 응답 데이터 유효성 검사
    if (!analysis.strengths || !analysis.weaknesses || !analysis.recommendations || !analysis.overallStats) {
      throw new Error('Invalid analysis data structure');
    }

    // 숫자 데이터 정규화
    analysis.strengths = analysis.strengths.map((s: any) => ({
      ...s,
      correctRate: Number(s.correctRate),
      totalProblems: Number(s.totalProblems)
    }));

    analysis.weaknesses = analysis.weaknesses.map((w: any) => ({
      ...w,
      correctRate: Number(w.correctRate),
      totalProblems: Number(w.totalProblems)
    }));

    analysis.overallStats = {
      ...analysis.overallStats,
      totalProblems: Number(analysis.overallStats.totalProblems),
      averageCorrectRate: Number(analysis.overallStats.averageCorrectRate)
    };

    res.status(200).json(analysis);
  } catch (error) {
    console.error('Error analyzing learning data:', error);
    res.status(500).json({ 
      error: 'Failed to analyze learning data',
      details: error.message 
    });
  }
} 