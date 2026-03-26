export default async function handler(req, res) {
  // 1. POST 외 요청 차단
  if (req.method !== 'POST') return res.status(405).json({ reply: "Method Not Allowed" });

  try {
    const { prompt, calcData } = req.body;
    
    // 2. 환경변수 로드 확인
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      return res.status(500).json({ reply: "서버 설정 오류: GEMINI_API_KEY 환경변수가 비어있습니다. Vercel 설정을 확인하세요." });
    }

    // 3. Google Gemini API 호출 (가장 안정적인 v1beta 경로)
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `당신은 대한민국 퇴직소득세 전문 AI 세무사입니다. 다음 데이터를 바탕으로 상담하세요. 
            데이터: ${JSON.stringify(calcData)} 
            질문: ${prompt}`
          }]
        }]
      })
    });

    // 4. 응답 상태 코드 확인
    if (!response.ok) {
      const errorDetail = await response.text();
      return res.status(response.status).json({ reply: `Gemini API 호출 실패(${response.status}): ${errorDetail}` });
    }

    const data = await response.json();

    // 5. 응답 본문 구조 확인
    if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts) {
      const aiReply = data.candidates[0].content.parts[0].text;
      return res.status(200).json({ reply: aiReply });
    } else {
      return res.status(500).json({ reply: "AI 응답 구조가 예상과 다릅니다. API 로그를 확인해야 합니다." });
    }

  } catch (error) {
    // 6. 예외 발생 시 상세 메시지 반환
    return res.status(500).json({ reply: `서버 내부 실행 오류: ${error.message}` });
  }
}
