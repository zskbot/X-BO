import { runAgent } from '../agent/run.js';
import { router as runChat } from '../src/router/index.js';

const MAX_MESSAGES = 20;
const MAX_CHARS = 4000;
const RATE_LIMIT = 20; // yêu cầu / phút / IP (best-effort)
const hits = new Map();

function limited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE_LIMIT;
}

async function readJson(req) {
  if (req.body !== undefined) return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > 200000) throw new Error('Body quá lớn');
    chunks.push(c);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function toContents(raw) {
  if (!Array.isArray(raw)) return null;
  const out = [];
  for (const m of raw.slice(-MAX_MESSAGES)) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant') || typeof m.content !== 'string') return null;
    const text = m.content.trim().slice(0, MAX_CHARS);
    if (!text) continue;
    const role = m.role === 'user' ? 'user' : 'model';
    const last = out[out.length - 1];
    if (last && last.role === role) last.parts.push({ text: '\n' + text });
    else out.push({ role, parts: [{ text }] });
  }
  while (out.length && out[0].role !== 'user') out.shift();
  return out.length && out[out.length - 1].role === 'user' ? out : null;
}

function cors(req, res) {
  const allowed = process.env.ALLOWED_ORIGIN;
  if (allowed && req.headers.origin === allowed) {
    res.setHeader('Access-Control-Allow-Origin', allowed);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
}

async function handler(req, res) {
  cors(req, res);
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }
  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end('Method not allowed');
  }
  const ip = String(req.headers['x-forwarded-for'] ?? req.socket?.remoteAddress ?? 'unknown').split(',')[0].trim();
  if (limited(ip)) {
    res.statusCode = 429;
    return res.end('Gửi quá nhanh, đợi một chút rồi thử lại.');
  }

  let payload;
  try {
    payload = await readJson(req);
  } catch {
    res.statusCode = 400;
    return res.end('Dữ liệu JSON không hợp lệ.');
  }

  // The browser chat client sends { message, model } and expects JSON.
  // Keep the existing messages-based SSE agent contract for streaming clients.
  if (typeof payload?.message === 'string' || typeof payload?.prompt === 'string') {
    const message = String(payload.message ?? payload.prompt ?? '').trim();
    const model = typeof payload.model === 'string' && payload.model.trim()
      ? payload.model.trim()
      : process.env.DEFAULT_MODEL;
    if (!message) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.end(JSON.stringify({ error: { code: 'INVALID_PROMPT', message: 'Nhập yêu cầu trước khi gửi.' } }));
    }
    if (message.length > 8000) {
      res.statusCode = 413;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.end(JSON.stringify({ error: { code: 'PROMPT_TOO_LARGE', message: 'Prompt tối đa 8000 ký tự.' } }));
    }
    if (model && !/^[a-z0-9._:-]{1,64}$/i.test(model)) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.end(JSON.stringify({ error: { code: 'INVALID_PROVIDER', message: 'AI provider không hợp lệ.' } }));
    }
    try {
      const response = await runChat(message, model);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.end(JSON.stringify({ success: true, response, model: model || 'default' }));
    } catch (error) {
      console.error('Chat request failed', { errorName: error?.name || 'Error' });
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.end(JSON.stringify({ error: { code: 'AI_PROVIDER_FAILED', message: 'Không thể kết nối AI provider. Kiểm tra cấu hình backend rồi thử lại.' } }));
    }
  }

  const history = toContents(payload?.messages);
  if (!history) {
    res.statusCode = 400;
    return res.end('Dữ liệu không hợp lệ.');
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  });
  const signal = { aborted: false };
  res.on('close', () => { signal.aborted = true; });
  const send = (ev) => { if (!signal.aborted) res.write(`data: ${JSON.stringify(ev)}\n\n`); };

  try {
    for await (const ev of runAgent(history, signal)) send(ev);
  } catch (e) {
    send({ type: 'error', message: e.message });
  }
  send({ type: 'done' });
  res.end();
}

export default handler;
export { toContents };
