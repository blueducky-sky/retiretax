export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ reply: "Method Not Allowed" });

  try {
    const { prompt, calcData } = req.body;
    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
      return res.status(500).json({ reply: "서버 설정 오류: GEMINI_API_KEY가 없습니다." });
    }

    // [핵심 해결 포인트] v1beta 대신 v1 안정화 버전을 사용하고 모델명을 정확히 지정합니다.
    const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-flash-lite-latest:generateContent?key=${API_KEY}`;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `당신은 대한민국 퇴직소득세 전문 AI 세무사입니다. 다음 데이터를 바탕으로 상담하세요.
            데이터: ${JSON.stringify(calcData)}
            질문: ${prompt}
            
            지침: 전문적이고 친절한 한국어로 답하고, 1원 단위까지 데이터를 근거로 설명하세요.`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800
        }
      })
    });

    const data = await response.json();

    // 에러 발생 시 상세 정보 반환
    if (data.error) {
      return res.status(data.error.code || 500).json({ 
        reply: `[서버 응답 에러] ${data.error.message} (코드: ${data.error.status})` 
      });
    }

    if (data.candidates && data.candidates[0].content) {
      const aiReply = data.candidates[0].content.parts[0].text;
      return res.status(200).json({ reply: aiReply });
    } else {
      return res.status(500).json({ reply: "AI가 답변을 생성할 수 없는 상태입니다." });
    }

  } catch (error) {
    return res.status(500).json({ reply: `시스템 오류: ${error.message}` });
  }
}

