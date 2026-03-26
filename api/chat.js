export default async function handler(req, res) {
  // 1. POST 요청인지 확인
  if (req.method !== 'POST') {
    return res.status(405).json({ reply: "허용되지 않는 요청 방식입니다." });
  }

  try {
    const { prompt, calcData } = req.body;
    const API_KEY = process.env.GEMINI_API_KEY;

    // 2. 환경변수 체크 (Vercel 설정 확인용)
    if (!API_KEY) {
      return res.status(500).json({ reply: "서버 설정 오류: Vercel 환경 변수에 GEMINI_API_KEY가 없습니다." });
    }

    // 3. Gemini API 호출 (v1beta -> v1으로 안정화 버전 사용)
    const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `당신은 대한민국 퇴직소득세 전문 AI 세무사입니다. 
            사용자의 계산 데이터: ${JSON.stringify(calcData)}
            질문: ${prompt}
            
            지침: 1원 단위까지 정확한 계산 결과를 토대로 친절하게 설명하세요. IRP 절세 팁을 반드시 포함하세요.`
          }]
        }]
      })
    });

    const data = await response.json();

    // 4. Gemini 응답 구조 분석 및 에러 핸들링
    if (data.error) {
      return res.status(500).json({ reply: `Gemini API 오류: ${data.error.message}` });
    }

    if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts) {
      const aiReply = data.candidates[0].content.parts[0].text;
      return res.status(200).json({ reply: aiReply });
    } else {
      return res.status(500).json({ reply: "AI가 응답을 생성하지 못했습니다. 다시 시도해 주세요." });
    }

  } catch (error) {
    console.error("Internal Server Error:", error);
    return res.status(500).json({ reply: `서버 내부 오류: ${error.message}` });
  }
}
