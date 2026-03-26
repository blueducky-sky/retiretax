export default async function handler(req, res) {
  // POST 요청만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { prompt, calcData } = req.body;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o", // 혹은 gpt-4o-mini (비용 절감용)
        messages: [
          { 
            role: "system", 
            content: `너는 대한민국 퇴직소득세 전문 AI 에이전트야. 
            사용자의 계산 결과 데이터: ${JSON.stringify(calcData)}
            이 데이터를 바탕으로 사용자의 질문에 친절하고 전문적으로 답해줘. 
            세법 용어는 쉽게 풀어서 설명하고, 절세 팁(IRP 등)을 적극적으로 제안해.` 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }

    res.status(200).json({ reply: data.choices[0].message.content });
  } catch (error) {
    console.error("AI API Error:", error);
    res.status(500).json({ error: "AI 상담 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." });
  }
}
