import dns from 'node:dns/promises';
import net from 'node:net';

export const toolDeclarations = [
  { name: 'web_search', description: 'Tìm thông tin mới trên web. Trả về danh sách kết quả kèm trích đoạn.', parameters: { type: 'OBJECT', properties: { query: { type: 'STRING', description: 'Từ khóa tìm kiếm, ngắn gọn' } }, required: ['query'] } },
  { name: 'read_url', description: 'Đọc nội dung chữ của một trang web công khai.', parameters: { type: 'OBJECT', properties: { url: { type: 'STRING', description: 'URL đầy đủ, bắt đầu bằng http(s)://' } }, required: ['url'] } },
  { name: 'calculator', description: 'Tính biểu thức toán: + - * / % ^ và ngoặc.', parameters: { type: 'OBJECT', properties: { expression: { type: 'STRING', description: 'Ví dụ: (12.5 + 3) * 4 ^ 2' } }, required: ['expression'] } },
];

export function toolLabel(name, args = {}) {
  if (name === 'web_search') return `Tìm: ${String(args.query ?? '')}`;
  if (name === 'read_url') return `Đọc: ${String(args.url ?? '')}`;
  if (name === 'calculator') return `Tính: ${String(args.expression ?? '')}`;
  return name;
}

export async function runTool(name, args = {}) {
  try {
    if (name === 'web_search') return await webSearch(String(args.query ?? ''));
    if (name === 'read_url') return await readUrl(String(args.url ?? ''));
    if (name === 'calculator') return calculator(String(args.expression ?? ''));
    return { output: `Tool không tồn tại: ${name}`, summary: 'Tool không tồn tại' };
  } catch (error) {
    return { output: 'Không thể hoàn tất công cụ được yêu cầu.', summary: 'Công cụ thất bại' };
  }
}

async function webSearch(query) {
  const key = process.env.SEARCH_API_KEY;
  if (!key) return { output: 'Chưa cấu hình SEARCH_API_KEY nên không tìm web được.', summary: 'Thiếu SEARCH_API_KEY' };
  if (!query.trim() || query.length > 500) throw new Error('Từ khóa không hợp lệ');
  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ query, max_results: 5 }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error('Search provider error');
  const data = await response.json();
  const results = (data.results ?? []).map((item) => ({ title: String(item.title ?? ''), url: String(item.url ?? ''), content: String(item.content ?? '').slice(0, 600) }));
  return { output: results, summary: `${results.length} kết quả`, sources: results.map(({ title, url }) => ({ title, url })) };
}

function isPrivate(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
  }
  const value = ip.toLowerCase();
  return value === '::' || value === '::1' || value.startsWith('fc') || value.startsWith('fd') || value.startsWith('fe80') || value.startsWith('::ffff:');
}

async function readUrl(input) {
  let url = new URL(input);
  for (let hop = 0; hop <= 3; hop += 1) {
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('URL không hợp lệ');
    const addresses = await dns.lookup(url.hostname, { all: true });
    if (!addresses.length || addresses.some(({ address }) => isPrivate(address))) throw new Error('Địa chỉ nội bộ bị chặn');
    const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(10000), headers: { 'User-Agent': 'X-BO/1.0 (+chatbot)' } });
    const location = response.headers.get('location');
    if (response.status >= 300 && response.status < 400 && location) {
      if (hop === 3) throw new Error('Quá nhiều chuyển hướng');
      url = new URL(location, url);
      continue;
    }
    if (!response.ok) throw new Error('Trang web trả lỗi');
    const html = (await response.text()).slice(0, 500000);
    const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]?.trim() ?? url.toString();
    const text = html.replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim().slice(0, 8000);
    return { output: { title, text }, summary: `${text.length} ký tự`, sources: [{ title, url: url.toString() }] };
  }
  throw new Error('Không thể đọc URL');
}

function calculator(expression) {
  if (typeof expression !== 'string' || !expression.trim() || expression.length > 200 || !/^[0-9+\-*\/%().\s^]+$/.test(expression)) throw new Error('Biểu thức không hợp lệ');
  const tokens = expression.match(/\d+(?:\.\d+)?|[()+*\/%^\-]/g)?.filter((token) => token !== " ") ?? [];
  if (tokens.join('') !== expression.replace(/\s+/g, '')) throw new Error('Biểu thức không hợp lệ');
  let position = 0;
  const peek = () => tokens[position];
  const take = () => tokens[position++];
  function primary() {
    if (peek() === '+') { take(); return primary(); }
    if (peek() === '-') { take(); return -primary(); }
    if (peek() === '(') {
      take();
      const value = addSub();
      if (take() !== ')') throw new Error('Thiếu dấu ngoặc đóng');
      return value;
    }
    const token = take();
    if (!token || !/^\d+(?:\.\d+)?$/.test(token)) throw new Error('Thiếu số');
    return Number(token);
  }
  function power() { const left = primary(); return peek() === '^' ? (take(), left ** power()) : left; }
  function mulDiv() {
    let value = power();
    while (['*', '/', '%'].includes(peek())) {
      const op = take(), right = power();
      if ((op === '/' || op === '%') && right === 0) throw new Error('Không thể chia cho 0');
      value = op === '*' ? value * right : op === '/' ? value / right : value % right;
    }
    return value;
  }
  function addSub() {
    let value = mulDiv();
    while (peek() === '+' || peek() === '-') {
      const op = take(), right = mulDiv();
      value = op === '+' ? value + right : value - right;
    }
    return value;
  }
  const result = addSub();
  if (position !== tokens.length || !Number.isFinite(result)) throw new Error('Kết quả không hợp lệ');
  return { output: result, summary: `= ${result}` };
}

export { calculator };
