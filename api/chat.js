export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { prompt, calcData } = req.body;
    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
      return res.status(500).json({ reply: "서버 설정 오류: 환경 변수(GEMINI_API_KEY)를 확인해주세요." });
    }

    // [수정 포인트] 모델 경로와 버전을 가장 범용적인 구조로 변경
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [{
            text: `당신은 대한민국 퇴직소득세 전문 AI 세무사입니다. 
            [사용자 데이터]
            - 근속연수: ${calcData.years}년
            - 퇴직금 총액: ${calcData.totalPay.toLocaleString()}원
            - 예상 세금: ${calcData.totalTax.toLocaleString()}원
            - 실수령액: ${calcData.netPay.toLocaleString()}원
            - IRP 수령 여부: ${calcData.isIrp ? "예" : "아니오"}

            질문: ${prompt}
            
            지침: 위 데이터를 바탕으로 1:1 상담을 진행하세요. 전문적이되 친절한 말투로, 절세 팁을 포함하여 상세히 답변하세요.`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    const data = await response.json();

    // 404나 400 에러 발생 시 상세 로그 확인
    if (data.error) {
      console.error("Gemini API Error:", data.error);
      return res.status(data.error.code || 500).json({ 
        reply: `AI 서비스 연결 오류(${data.error.status}): ${data.error.message}` 
      });
    }

    if (data.candidates && data.candidates[0].content) {
      const aiReply = data.candidates[0].content.parts[0].text;
      return res.status(200).json({ reply: aiReply });
    } else {
      return res.status(500).json({ reply: "응답을 생성할 수 없습니다. (안전 필터에 의해 차단되었을 수 있습니다.)" });
    }

  } catch (error) {
    return res.status(500).json({ reply: `서버 내부 오류: ${error.message}` });
  }
}
