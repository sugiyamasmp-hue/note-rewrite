export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { article } = req.body;
  if (!article) {
    return res.status(400).json({ error: 'No article provided' });
  }

  const SYSTEM_PROMPT = `あなたはnote記事の編集アシスタントです。
【リライト方針】
- 元の文体・トーン・個性はそのまま残す
- 語順や段落構成を整理して読みやすくする
- noteらしい改行・テンポ感を意識する
- 著者の個性（ユーモア、体験談、関西ノリ）は削らない
【出力形式】JSONのみで返してください:
{"rewrite":"リライト済み記事本文","titles":["案1","案2","案3","案4","案5"],"imagePrompt":"Gemini向け日本語プロンプト","imagePromptEn":"English prompt for Gemini"}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 4000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: `以下の記事をリライトしてください：\n\n${article}` }],
      }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    const text = (data.content || []).map(i => i.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    res.status(200).json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

