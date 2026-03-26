// api/chat.js 수정본
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { prompt, calcData } = req.body;
    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
      return res.status(500).json({ reply: "서버 설정 오류: Vercel 환경 변수에 GEMINI_API_KEY가 없습니다." });
    }

    // [수정 포인트] v1 -> v1beta 로 변경
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `당신은 대한민국 퇴직소득세 전문 AI 세무사입니다. 
            사용자 데이터: ${JSON.stringify(calcData)}
            사용자 질문: ${prompt}
            
            지침: 전문적이고 친절한 한국어로 답하세요. 계산 근거를 쉽게 설명하고 절세 팁을 포함하세요.`
          }]
        }]
      })
    });

    const data = await response.json();

    if (data.error) {
      // 상세 에러 확인용
      return res.status(500).json({ reply: `Gemini API 오류(${data.error.code}): ${data.error.message}` });
    }

    if (data.candidates && data.candidates[0].content) {
      const aiReply = data.candidates[0].content.parts[0].text;
      return res.status(200).json({ reply: aiReply });
    } else {
      return res.status(500).json({ reply: "AI가 응답을 생성할 수 없는 상태입니다(Safety Filter 등)." });
    }

  } catch (error) {
    return res.status(500).json({ reply: `서버 내부 오류: ${error.message}` });
  }
}
