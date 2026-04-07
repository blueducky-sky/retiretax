export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ reply: "Method Not Allowed" });

  try {
    const { prompt, calcData } = req.body;
    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
      return res.status(500).json({ reply: "서버 설정 오류: GEMINI_API_KEY 환경변수가 비어있습니다." });
    }

    // [최종 해결 포인트] 모델 경로를 v1beta/models/gemini-1.5-flash 로 정확히 타겟팅
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `당신은 대한민국 퇴직소득세 전문 AI 세무사입니다. 아래 데이터를 바탕으로 사용자의 질문에 답변하세요.
            
            [데이터]
            - 근속연수: ${calcData.years}년
            - 퇴직금 총액: ${calcData.totalPay.toLocaleString()}원
            - 예상 세금: ${calcData.totalTax.toLocaleString()}원
            - IRP 수령 여부: ${calcData.isIrp ? "예" : "아니오"}
            
            [질문]
            ${prompt}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000
        }
      })
    });

    const data = await response.json();

    // 상세 에러 핸들링
    if (data.error) {
      console.error("Gemini Error:", data.error);
      return res.status(data.error.code || 500).json({ 
        reply: `AI 서비스 연결 실패(${data.error.status}): ${data.error.message}` 
      });
    }

    if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
      const aiReply = data.candidates[0].content.parts[0].text;
      return res.status(200).json({ reply: aiReply });
    } else {
      return res.status(500).json({ reply: "AI가 응답을 생성하지 못했습니다. (필터링 또는 모델 미지원)" });
    }

  } catch (error) {
    return res.status(500).json({ reply: `서버 오류: ${error.message}` });
  }
}
