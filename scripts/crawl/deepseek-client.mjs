const DEFAULT_BASE = 'https://api.deepseek.com';

export async function deepseekChat({ apiKey, model, messages, jsonMode = true }) {
  const base = process.env.DEEPSEEK_API_BASE || DEFAULT_BASE;
  const url = `${base.replace(/\/$/, '')}/chat/completions`;

  const body = {
    model,
    messages,
    temperature: 0.4,
    ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`DeepSeek HTTP ${res.status}: ${errText.slice(0, 400)}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('DeepSeek 返回空内容');
  return content;
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
