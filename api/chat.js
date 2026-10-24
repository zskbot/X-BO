import { runAgent } from '../agent/run.js';

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

  let history;
  try {
    history = toContents((await readJson(req))?.messages);
  } catch {
    history = null;
  }
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
