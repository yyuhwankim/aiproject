import type { NextApiRequest, NextApiResponse } from 'next';

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
    console.error('API key is not configured');
    return res.status(500).json({ 
      message: 'API key is not configured',
      error: 'Please check your environment variables'
    });
  }

  try {
    const { topic } = req.body;
    console.log('Received topic:', topic);

    if (!topic) {
      return res.status(400).json({ message: 'Topic is required' });
    }

    const prompt = `다음 수학 주제에 대한 문제와 해답을 생성해주세요: ${topic}
    
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

    console.log('Sending prompt to Gemini:', prompt);
    console.log('API URL:', API_URL);
    
    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    };

    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    const responseData = await response.json();
    console.log('API Response status:', response.status);
    console.log('API Response headers:', response.headers);
    console.log('API Response data:', JSON.stringify(responseData, null, 2));

    if (!response.ok) {
      console.error('API Error:', responseData);
      throw new Error(responseData.error?.message || 'Failed to generate content');
    }

    if (!responseData.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error('Invalid response format:', responseData);
      throw new Error('Invalid response format from API');
    }

    const text = responseData.candidates[0].content.parts[0].text;
    console.log('Response text:', text);

    // 문제와 해답 분리 (더 정확한 파싱)
    const problemMatch = text.match(/문제:\s*([\s\S]*?)(?=해답:|$)/);
    const solutionMatch = text.match(/해답:\s*([\s\S]*?)(?=문제:|$)/);

    if (!problemMatch || !solutionMatch) {
      throw new Error('Invalid response format: Could not parse problem and solution');
    }

    const problem = problemMatch[1].trim();
    const solution = solutionMatch[1].trim();

    console.log('Parsed problem:', problem);
    console.log('Parsed solution:', solution);

    res.status(200).json({ problem, solution });
  } catch (error) {
    console.error('Detailed error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });
    res.status(500).json({ 
      message: 'Error generating problem',
      error: error.message,
      details: error.response?.data
    });
  }
} 