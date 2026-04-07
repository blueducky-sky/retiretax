export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ reply: "Method Not Allowed" });

  try {
    const { prompt, calcData } = req.body;
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      return res.status(500).json({ reply: "서버 설정 오류: GEMINI_API_KEY 환경변수가 비어있습니다." });
    }

    // ✅ 최신 모델 우선순위 목록 (2025년 기준)
    const MODELS = [
      "gemini-2.0-flash-lite",
      "gemini-2.5-flash-preview-04-17",
      "gemini-2.5-pro-preview-03-25",
      "gemini-1.5-pro-latest",
    ];

    const requestBody = JSON.stringify({
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
    });

    let data = null;
    let successModel = null;

    for (const model of MODELS) {
      const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody
      });

      data = await response.json();

      if (!data.error) {
        successModel = model;
        console.log(`✅ 사용 모델: ${model}`);
        break;
      }

      console.warn(`⚠️ 모델 실패 [${model}]: ${data.error.message}`);
    }

    // 모든 모델 실패 시
    if (!successModel) {
      return res.status(500).json({ 
        reply: `모든 AI 모델 연결 실패. API 키를 확인하거나 Google AI Studio에서 새 키를 발급받으세요.` 
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
