export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ reply: "Method Not Allowed" });

  try {
    const { prompt, calcData } = req.body;
    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
      return res.status(500).json({ reply: "서버 설정 오류: GEMINI_API_KEY가 없습니다." });
    }

    // [핵심 수정] 가장 호환성이 높은 모델명 'gemini-pro'로 변경 시도
    // 주소 체계에서 models/ 를 명시적으로 포함
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `당신은 대한민국 퇴직소득세 전문 AI 세무사입니다. 아래 데이터를 바탕으로 상담하세요.
            데이터: ${JSON.stringify(calcData)}
            질문: ${prompt}`
          }]
        }]
      })
    });

    const data = await response.json();

    if (data.error) {
      // 만약 gemini-pro도 안된다면 모델명을 다시 시도해볼 수 있도록 에러 메시지 출력
      return res.status(data.error.code || 500).json({ 
        reply: `AI 모델 인식 오류(${data.error.status}): ${data.error.message}` 
      });
    }

    if (data.candidates && data.candidates[0].content) {
      const aiReply = data.candidates[0].content.parts[0].text;
      return res.status(200).json({ reply: aiReply });
    } else {
      return res.status(500).json({ reply: "AI 응답을 생성할 수 없습니다. 다시 시도해주세요." });
    }

  } catch (error) {
    return res.status(500).json({ reply: `서버 오류: ${error.message}` });
  }
}
