export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ reply: "Method Not Allowed" });

  try {
    const { prompt, calcData } = req.body;
    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
      return res.status(500).json({ reply: "서버 설정 오류: Vercel 환경 변수에 GEMINI_API_KEY가 없습니다." });
    }

    // [최후의 수정] 경로를 v1beta 대신 v1으로 시도하거나, 모델명을 명확히 규정
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `당신은 대한민국 퇴직소득세 전문 AI입니다. 데이터: ${JSON.stringify(calcData)}. 질문: ${prompt}`
          }]
        }]
      })
    });

    const data = await response.json();

    // 에러 발생 시 구글이 보내는 실제 메시지 분석
    if (data.error) {
      return res.status(data.error.code || 500).json({ 
        reply: `[구글 API 에러] ${data.error.message}\n(상태: ${data.error.status})` 
      });
    }

    if (data.candidates && data.candidates[0].content) {
      return res.status(200).json({ reply: data.candidates[0].content.parts[0].text });
    } else {
      return res.status(500).json({ reply: "AI 응답 구조를 읽을 수 없습니다." });
    }

  } catch (error) {
    return res.status(500).json({ reply: `시스템 오류: ${error.message}` });
  }
}

