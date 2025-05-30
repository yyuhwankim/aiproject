import type { NextApiRequest, NextApiResponse } from 'next';

const API_KEY = 'AIzaSyDZ7419rQQowomI7mqQrjxMxvBd0SnbNeo';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { problem, topic } = req.body;
    console.log('Received problem:', problem);
    console.log('Received topic:', topic);

    if (!problem || !topic) {
      return res.status(400).json({ message: 'Problem and topic are required' });
    }

    const prompt = `다음 수학 문제와 비슷한 난이도의 새로운 문제를 생성해주세요:
    
    원본 문제: ${problem}
    주제: ${topic}
    
    다음 형식으로 응답해주세요:
    문제: [새로운 문제 내용]
    해답: [해답과 풀이 과정]`;

    console.log('Sending prompt to Gemini:', prompt);
    console.log('API URL:', API_URL);
    
    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
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

    // 문제와 해답 분리
    const [problemPart, solutionPart] = text.split('해답:');
    const newProblem = problemPart.replace('문제:', '').trim();
    const solution = solutionPart.trim();

    console.log('Parsed new problem:', newProblem);
    console.log('Parsed solution:', solution);

    res.status(200).json({ problem: newProblem, solution });
  } catch (error) {
    console.error('Detailed error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });
    res.status(500).json({ 
      message: 'Error generating similar problem',
      error: error.message,
      details: error.response?.data
    });
  }
} 