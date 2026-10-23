/** Gọi Gemini (streaming SSE), trả từng part ngay khi nhận được. */
async function* streamGemini(contents, system, tools) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('Thiếu GEMINI_API_KEY trong biến môi trường.');
  const model = process.env.DEFAULT_MODEL || 'gemini-2.5-flash';

  const body = { systemInstruction: { parts: [{ text: system }] }, contents };
  if (tools.length) body.tools = [{ functionDeclarations: tools }];

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok || !res.body) {
    throw new Error(`Model trả lỗi ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';
    for (const raw of lines) {
      const line = raw.trim();
      if (!line.startsWith('data:')) continue;
      const json = line.slice(5).trim();
      if (!json) continue;
      let chunk;
      try { chunk = JSON.parse(json); } catch { continue; }
      for (const part of chunk?.candidates?.[0]?.content?.parts ?? []) yield part;
    }
  }
}

module.exports = { streamGemini };
