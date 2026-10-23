(() => {
  const KEY = 'xbo:chats';
  const API = (window.XBO_API || '') + '/api/chat';
  const SUGGESTIONS = [
    'Tin công nghệ nổi bật hôm nay là gì?',
    'Tóm tắt giúp tao trang https://news.ycombinator.com',
    'Tính (1250 * 1.08) ^ 2 / 7',
  ];

  const $ = (id) => document.getElementById(id);
  const feed = $('feed'), list = $('list'), input = $('input'), go = $('go');
  const side = $('side'), scrim = $('scrim');

  let chats = load();
  let activeId = chats[0]?.id ?? null;
  let busy = false;
  let ctrl = null;

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(chats)); } catch { /* đầy bộ nhớ: bỏ qua */ }
  }
  const uid = () => Math.random().toString(36).slice(2, 10);
  const active = () => chats.find((c) => c.id === activeId) || null;

  /* ---------- Markdown nhỏ, an toàn (escape trước, rồi mới chèn thẻ) ---------- */
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  function md(src) {
    const blocks = [];
    let t = esc(src).replace(/```[\w-]*\n?([\s\S]*?)```/g, (_, code) => {
      blocks.push(`<pre><code>${code}</code></pre>`);
      return `\u0000${blocks.length - 1}\u0000`;
    });
    const A = ' target="_blank" rel="noreferrer noopener"';
    t = t
      .replace(/`([^`\n]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g, `<a href="$2"${A}>$1</a>`)
      .replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, `$1<a href="$2"${A}>$2</a>`);

    const out = [];
    let para = [], items = [];
    const flushPara = () => { if (para.length) out.push(`<p>${para.join('<br>')}</p>`); para = []; };
    const flushList = () => { if (items.length) out.push(`<ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>`); items = []; };

    for (const line of t.split('\n')) {
      let m;
      if ((m = /^\u0000(\d+)\u0000$/.exec(line.trim()))) { flushPara(); flushList(); out.push(blocks[+m[1]]); }
      else if ((m = /^\s*(?:[-*]|\d+\.)\s+(.*)$/.exec(line))) { flushPara(); items.push(m[1]); }
      else if ((m = /^#{1,3}\s+(.*)$/.exec(line))) { flushPara(); flushList(); out.push(`<h3>${m[1]}</h3>`); }
      else if (!line.trim()) { flushPara(); flushList(); }
      else { flushList(); para.push(line); }
    }
    flushPara(); flushList();
    return out.join('').replace(/\u0000(\d+)\u0000/g, (_, n) => blocks[+n]);
  }

  /* ---------- Vẽ giao diện ---------- */
  function renderList() {
    list.innerHTML = '';
    for (const c of chats) {
      const row = document.createElement('div');
      row.className = c.id === activeId ? 'item on' : 'item';
      row.innerHTML = '<button class="pick"></button><button class="del">Xóa</button>';
      const pick = row.querySelector('.pick');
      pick.textContent = c.title;
      pick.onclick = () => { activeId = c.id; closeMenu(); render(); };
      const del = row.querySelector('.del');
      del.setAttribute('aria-label', 'Xóa ' + c.title);
      del.onclick = () => {
        chats = chats.filter((x) => x.id !== c.id);
        if (activeId === c.id) activeId = null;
        save(); render();
      };
      list.appendChild(row);
    }
  }

  function botHtml(m, isLast) {
    let h = '';
    if (m.steps?.length) {
      h += '<ol class="trace" aria-label="Các bước X-BO đã làm">' + m.steps.map((s) =>
        `<li class="${s.status}"><span class="lbl">${esc(s.label)}</span><span class="sum">${s.status === 'running' ? 'đang chạy...' : esc(s.summary || '')}</span></li>`
      ).join('') + '</ol>';
    }
    if (m.content) h += md(m.content);
    else if (!m.error && busy && isLast && !m.steps?.length) h += '<p class="think">Đang nghĩ...</p>';
    if (m.sources?.length) {
      h += '<div class="sources">' + m.sources.map((s) =>
        /^https?:\/\//.test(s.url)
          ? `<a href="${esc(s.url)}" target="_blank" rel="noreferrer noopener">${esc(s.title || s.url)}</a>`
          : '').join('') + '</div>';
    }
    if (m.error) h += `<p class="err">${esc(m.error)}</p>`;
    return h;
  }

  function renderFeed() {
    const nearBottom = feed.scrollHeight - feed.scrollTop - feed.clientHeight < 120;
    const chat = active();
    $('title').textContent = chat ? chat.title : 'X-BO';
    feed.innerHTML = '';

    if (!chat) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.innerHTML = '<h1>X-BO</h1><p>Hỏi gì cũng được. X-BO tự tìm web, đọc link và tính toán khi cần.</p><div class="sugs"></div>';
      for (const s of SUGGESTIONS) {
        const b = document.createElement('button');
        b.textContent = s;
        b.onclick = () => send(s);
        empty.querySelector('.sugs').appendChild(b);
      }
      feed.appendChild(empty);
      return;
    }
    chat.messages.forEach((m, i) => {
      const el = document.createElement('div');
      if (m.role === 'user') {
        el.className = 'msg user';
        const p = document.createElement('p');
        p.textContent = m.content;
        el.appendChild(p);
      } else {
        el.className = 'msg bot';
        el.innerHTML = botHtml(m, i === chat.messages.length - 1);
      }
      feed.appendChild(el);
    });
    if (nearBottom) feed.scrollTop = feed.scrollHeight;
  }

  function renderComposer() {
    go.textContent = busy ? 'Dừng' : 'Gửi';
    go.classList.toggle('stop', busy);
    go.disabled = !busy && !input.value.trim();
  }

  function render() { renderList(); renderFeed(); renderComposer(); }

  /* ---------- Gửi tin và đọc stream ---------- */
  function applyEvent(ev, bot) {
    if (ev.type === 'text') bot.content += ev.text;
    else if (ev.type === 'tool') (bot.steps ||= []).push({ id: ev.id, label: ev.label, status: 'running' });
    else if (ev.type === 'tool_done') {
      const s = (bot.steps || []).find((x) => x.id === ev.id);
      if (s) { s.status = 'done'; s.summary = ev.summary; }
    } else if (ev.type === 'source') {
      bot.sources ||= [];
      if (!bot.sources.some((s) => s.url === ev.url)) bot.sources.push({ title: ev.title, url: ev.url });
    } else if (ev.type === 'error') bot.error = ev.message;
  }

  async function send(textArg) {
    const text = (textArg ?? input.value).trim();
    if (!text || busy) return;
    input.value = '';
    autosize();

    let chat = active();
    if (!chat) {
      chat = { id: uid(), title: text.slice(0, 40), messages: [] };
      chats.unshift(chat);
      activeId = chat.id;
    }
    chat.messages.push({ role: 'user', content: text });
    const bot = { role: 'assistant', content: '', steps: [], sources: [] };
    chat.messages.push(bot);
    const history = chat.messages.slice(0, -1)
      .filter((m) => m.content.trim())
      .map(({ role, content }) => ({ role, content }));

    busy = true;
    ctrl = new AbortController();
    save(); render();
    feed.scrollTop = feed.scrollHeight;

    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) throw new Error((await res.text()) || 'Lỗi ' + res.status);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split('\n\n');
        buf = parts.pop() ?? '';
        for (const p of parts) {
          if (!p.startsWith('data: ')) continue;
          try { applyEvent(JSON.parse(p.slice(6)), bot); } catch { /* bỏ qua gói lỗi */ }
        }
        renderFeed();
      }
    } catch (e) {
      if (e.name !== 'AbortError') bot.error = e.message;
    } finally {
      busy = false;
      ctrl = null;
      save(); render();
    }
  }

  /* ---------- Sự kiện ---------- */
  function autosize() {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 160) + 'px';
  }
  function openMenu() { side.classList.add('open'); scrim.classList.add('show'); }
  function closeMenu() { side.classList.remove('open'); scrim.classList.remove('show'); }

  input.addEventListener('input', () => { autosize(); renderComposer(); });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(); }
  });
  go.onclick = () => (busy ? ctrl?.abort() : send());
  $('newChat').onclick = () => { activeId = null; closeMenu(); render(); input.focus(); };
  $('burger').onclick = openMenu;
  scrim.onclick = closeMenu;

  render();
})();
