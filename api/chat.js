export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ reply: "Method Not Allowed" });

  try {
    const { prompt, calcData } = req.body;
    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
      return res.status(500).json({ reply: "서버 설정 오류: GEMINI_API_KEY 환경변수가 비어있습니다." });
    }

    // [최종 해결 포인트] 
    // 모델 경로를 v1beta/models/gemini-1.5-flash 로 정확히 타겟팅합니다.
    // 'gemini-flash-lite-latest' 같은 명칭은 특정 환경에서만 작동하므로 사용하지 않습니다.
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

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
          maxOutputTokens: 1000
        }
      })
    });

    const data = await response.json();

    // 구글 API에서 에러를 반환한 경우
    if (data.error) {
      return res.status(data.error.code || 500).json({ 
        reply: `[구글 API 에러] ${data.error.message} (상태: ${data.error.status})` 
      });
    }

    // 정상 응답 처리
    if (data.candidates && data.candidates[0].content) {
      const aiReply = data.candidates[0].content.parts[0].text;
      return res.status(200).json({ reply: aiReply });
    } else {
      return res.status(500).json({ reply: "AI가 답변을 생성할 수 없는 상태입니다. (Safety Filter 등)" });
    }

  } catch (error) {
    return res.status(500).json({ reply: `시스템 오류: ${error.message}` });
  }
}
