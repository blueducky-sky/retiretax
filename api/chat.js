export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ reply: "Method Not Allowed" });

  try {
    const { prompt, calcData } = req.body;
    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
      return res.status(500).json({ reply: "서버 설정 오류: GEMINI_API_KEY 환경변수가 비어있습니다." });
    }

    // [해결 포인트] 모델 이름을 명확히 지정하고 API 주소 체계를 정석대로 맞춤
    // 만약 flash가 안된다면 pro 모델을 대안으로 사용하도록 설정 가능
    const MODEL_ID = "gemini-1.5-flash"; 
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent?key=${API_KEY}`;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `당신은 대한민국 퇴직소득세 전문 AI 세무사입니다. 아래 데이터를 바탕으로 상담하세요.
            사용자 데이터: ${JSON.stringify(calcData)}
            사용자 질문: ${prompt}
            
            지침: 전문적이고 친절한 한국어로 답하고, 반드시 IRP 절세 팁을 포함하세요.`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024
        }
      })
    });

    const data = await response.json();

    // 상세 에러 핸들링 (404 에러 시 원인 파악용)
    if (data.error) {
      console.error("Gemini API Error Detail:", data.error);
      return res.status(data.error.code || 500).json({ 
        reply: `AI 서비스 연결 실패(${data.error.status}): ${data.error.message} (모델명: ${MODEL_ID})` 
      });
    }

    if (data.candidates && data.candidates[0].content) {
      const aiReply = data.candidates[0].content.parts[0].text;
      return res.status(200).json({ reply: aiReply });
    } else {
      return res.status(500).json({ reply: "AI가 응답을 생성하지 못했습니다. (세이프티 필터 작동 가능성)" });
    }

  } catch (error) {
    return res.status(500).json({ reply: `서버 내부 오류: ${error.message}` });
  }
}
