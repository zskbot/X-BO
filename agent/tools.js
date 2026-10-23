const dns = require('node:dns/promises');
const net = require('node:net');

const toolDeclarations = [
  {
    name: 'web_search',
    description: 'Tìm thông tin mới trên web. Trả về danh sách kết quả kèm trích đoạn.',
    parameters: {
      type: 'OBJECT',
      properties: { query: { type: 'STRING', description: 'Từ khóa tìm kiếm, ngắn gọn' } },
      required: ['query'],
    },
  },
  {
    name: 'read_url',
    description: 'Đọc nội dung chữ của một trang web công khai.',
    parameters: {
      type: 'OBJECT',
      properties: { url: { type: 'STRING', description: 'URL đầy đủ, bắt đầu bằng http(s)://' } },
      required: ['url'],
    },
  },
  {
    name: 'calculator',
    description: 'Tính biểu thức toán: + - * / % ^ và ngoặc.',
    parameters: {
      type: 'OBJECT',
      properties: { expression: { type: 'STRING', description: 'Ví dụ: (12.5 + 3) * 4 ^ 2' } },
      required: ['expression'],
    },
  },
];

function toolLabel(name, args) {
  if (name === 'web_search') return `Tìm: ${String(args.query ?? '')}`;
  if (name === 'read_url') return `Đọc: ${String(args.url ?? '')}`;
  if (name === 'calculator') return `Tính: ${String(args.expression ?? '')}`;
  return name;
}

async function runTool(name, args) {
  try {
    if (name === 'web_search') return await webSearch(String(args.query ?? ''));
    if (name === 'read_url') return await readUrl(String(args.url ?? ''));
    if (name === 'calculator') return calculator(String(args.expression ?? ''));
    return { output: `Tool không tồn tại: ${name}`, summary: 'Tool không tồn tại' };
  } catch (e) {
    return { output: `Lỗi: ${e.message}`, summary: `Lỗi: ${e.message}` };
  }
}

async function webSearch(query) {
  const key = process.env.SEARCH_API_KEY;
  if (!key) return { output: 'Chưa cấu hình SEARCH_API_KEY nên không tìm web được.', summary: 'Thiếu SEARCH_API_KEY' };
  if (!query.trim()) throw new Error('Từ khóa trống');

  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ query, max_results: 5 }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Search trả lỗi ${res.status}`);
  const data = await res.json();
  const results = (data.results ?? []).map((r) => ({
    title: String(r.title ?? ''),
    url: String(r.url ?? ''),
    content: String(r.content ?? '').slice(0, 600),
  }));
  return {
    output: results,
    summary: `${results.length} kết quả`,
    sources: results.map((r) => ({ title: r.title, url: r.url })),
  };
}

function isPrivate(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return (
      a === 0 || a === 10 || a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127)
    );
  }
  const v = ip.toLowerCase();
  return v === '::1' || v === '::' || v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe80') || v.startsWith('::ffff:');
}

/** Fetch an toàn: chặn IP nội bộ (SSRF), kiểm tra lại ở mỗi lần chuyển hướng. */
async function safeFetch(url, hops = 0) {
  const u = new URL(url);
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('Chỉ hỗ trợ http/https');
  const addrs = await dns.lookup(u.hostname, { all: true });
  if (addrs.some((a) => isPrivate(a.address))) throw new Error('Địa chỉ nội bộ bị chặn');
  const res = await fetch(u, {
    redirect: 'manual',
    signal: AbortSignal.timeout(10000),
    headers: { 'User-Agent': 'X-BO/1.0 (+chatbot)' },
  });
  const loc = res.headers.get('location');
  if (res.status >= 300 && res.status < 400 && loc) {
    if (hops >= 3) throw new Error('Quá nhiều chuyển hướng');
    return safeFetch(new URL(loc, u).toString(), hops + 1);
  }
  return res;
}

async function readUrl(url) {
  const res = await safeFetch(url);
  if (!res.ok) throw new Error(`Trang trả lỗi ${res.status}`);
  const html = (await res.text()).slice(0, 500000);
  const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]?.trim() ?? url;
  const text = html
    .replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 8000);
  return { output: { title, text }, summary: `${text.length} ký tự`, sources: [{ title, url }] };
}

function calculator(expr) {
  if (!/^[0-9+\-*/%().\s^]+$/.test(expr)) throw new Error('Biểu thức chứa ký tự không hợp lệ');
  const result = Function(`"use strict"; return (${expr.replace(/\^/g, '**')});`)();
  if (typeof result !== 'number' || !Number.isFinite(result)) throw new Error('Kết quả không hợp lệ');
  return { output: result, summary: `= ${result}` };
}

module.exports = { toolDeclarations, toolLabel, runTool };
