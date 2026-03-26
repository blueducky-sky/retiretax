// api/chat.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { prompt, calcData } = req.body;
    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
      return res.status(500).json({ reply: "서버 설정 오류: API 키가 없습니다." });
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `당신은 대한민국 퇴직소득세 전문 AI 세무사입니다. 
            사용자 데이터: ${JSON.stringify(calcData)}
            질문: ${prompt}`
          }]
        }]
      })
    });

    const data = await response.json();

    if (data.candidates && data.candidates[0].content) {
      return res.status(200).json({ reply: data.candidates[0].content.parts[0].text });
    } else {
      console.error("Gemini Error Detail:", data);
      return res.status(500).json({ reply: "AI 응답 생성에 실패했습니다." });
    }
  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ reply: "서버 내부 오류가 발생했습니다." });
  }
}
