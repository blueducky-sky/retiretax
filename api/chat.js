// api/chat.js (Gemini API 버전)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { prompt, calcData } = req.body;
  const API_KEY = process.env.GEMINI_API_KEY;

  // Gemini 1.5 Flash 모델 사용 (빠르고 효율적)
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `당신은 대한민국 퇴직소득세 전문 AI 세무사입니다. 
            사용자의 계산 결과: ${JSON.stringify(calcData)}
            
            위 데이터를 참고하여 사용자의 질문에 답하세요. 
            1. 전문적이면서도 친절한 한국어로 답변할 것.
            2. 숫자는 콤마를 넣어 읽기 쉽게 표기할 것.
            3. IRP 활용 등 절세 전략을 반드시 포함할 것.
            
            사용자 질문: ${prompt}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800,
        }
      })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    // Gemini의 응답 구조에서 텍스트 추출
    const aiReply = data.candidates[0].content.parts[0].text;
    res.status(200).json({ reply: aiReply });

  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: "상담 서비스 연결 중 오류가 발생했습니다." });
  }
}
