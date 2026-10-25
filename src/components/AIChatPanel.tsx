import React, { useState } from 'react';
import { ArrowUp, Bot, Check, ChevronDown, Code2, Github, LayoutDashboard, MessageSquare, PanelLeft, Plus, Sparkles, WandSparkles } from 'lucide-react';

const MODEL_OPTIONS = [
  { value: 'zsk', label: 'ZsK Free Agent' },
  { value: 'ohmaba', label: 'Ohmaba Agent' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'gemini', label: 'Google Gemini' },
  { value: 'qwen', label: 'Qwen' },
  { value: 'claude', label: 'Claude' }
];

const STARTER_PROMPTS = [
  {
    title: 'SaaS Landing Page',
    description: 'Trang giới thiệu sản phẩm có pricing',
    icon: LayoutDashboard,
    prompt: 'Tạo SaaS landing page responsive theo phong cách OCODE.js, gồm hero, tính năng, pricing và CTA.'
  },
  {
    title: 'Analytics Dashboard',
    description: 'KPI, biểu đồ và bộ lọc',
    icon: Code2,
    prompt: 'Thiết kế dashboard phân tích doanh thu dark mode với KPI cards, biểu đồ và bộ lọc; dùng dữ liệu mẫu được ghi rõ.'
  },
  {
    title: 'Contact Form',
    description: 'Form có validation và trạng thái lỗi',
    icon: MessageSquare,
    prompt: 'Tạo contact form responsive, có label accessible, validation, trạng thái gửi thành công và lỗi.'
  }
];

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface AIChatPanelProps {
  selectedModel: string;
  onSelectModel: (model: string) => void;
}

export const AIChatPanel: React.FC<AIChatPanelProps> = ({ selectedModel, onSelectModel }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'system',
      content: 'x-bo sẵn sàng nhận yêu cầu. Chọn provider đã được cấu hình để bắt đầu.'
    }
  ]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<{ type: 'info' | 'error'; text: string } | null>({
    type: 'info',
    text: 'Kết quả phụ thuộc API server và provider credentials đã cấu hình.'
  });
  const [isSending, setIsSending] = useState(false);
  const [showProviderMenu, setShowProviderMenu] = useState(false);
  const isWelcome = messages.length <= 1;

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    setMessages(prev => [...prev, { role: 'user', content: trimmed }]);
    setInput('');
    setIsSending(true);
    setStatus(null);

    try {
      const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
      const response = await fetch(`${apiBase}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, model: selectedModel })
      });

      if (!response.ok) {
        const detail = (await response.text()).trim().slice(0, 500);
        throw new Error(detail || `API trả về HTTP ${response.status}. Kiểm tra backend và provider.`);
      }

      const data = await response.json();
      const content = data.response || data.result || 'API đã phản hồi nhưng không có nội dung.';
      setMessages(prev => [...prev, { role: 'assistant', content }]);
      setStatus({ type: 'info', text: 'Đã nhận phản hồi từ agent.' });
    } catch (err) {
      setStatus({ type: 'error', text: err instanceof Error ? err.message : 'Lỗi khi gọi agent.' });
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Không thể nhận phản hồi từ agent. Kiểm tra API server, endpoint và cấu hình provider.'
      }]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  const useTemplate = (prompt: string) => {
    setInput(prompt);
    setStatus({ type: 'info', text: 'Đã thêm prompt mẫu. Xem lại rồi gửi để bắt đầu.' });
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#070910] text-white">
      <header className="flex items-center justify-between gap-3 border-b border-white/10 bg-[#090b13]/95 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-indigo-400/30 bg-indigo-500/10 text-indigo-200">
            <WandSparkles size={18} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold tracking-tight">
              <span>x-bo</span><span className="text-neutral-500">by</span><span className="text-indigo-300">OCODE.js</span>
              <span className="border border-white/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-neutral-400">Preview</span>
            </div>
            <p className="mt-0.5 truncate text-[11px] text-neutral-500">AI full-stack builder · Prompt → Code → Preview</p>
          </div>
        </div>
        <div className="relative flex shrink-0 items-center gap-2">
          <span className="hidden text-[10px] uppercase tracking-wider text-neutral-500 sm:inline">Model</span>
          <button type="button" onClick={() => setShowProviderMenu(v => !v)} aria-expanded={showProviderMenu}
            className="flex items-center gap-2 border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-neutral-200 hover:border-indigo-400/50">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
            {MODEL_OPTIONS.find(option => option.value === selectedModel)?.label || selectedModel}
            <ChevronDown size={13} className="text-neutral-500" />
          </button>
          {showProviderMenu && (
            <div className="absolute right-0 top-full z-20 mt-2 w-52 border border-white/10 bg-[#11131d] p-1 shadow-2xl">
              {MODEL_OPTIONS.map(option => (
                <button key={option.value} type="button" onClick={() => { onSelectModel(option.value); setShowProviderMenu(false); }}
                  className="flex w-full items-center justify-between px-3 py-2.5 text-left text-xs text-neutral-300 hover:bg-white/[0.06]">
                  {option.label}{selectedModel === option.value && <Check size={14} className="text-indigo-300" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {isWelcome ? (
          <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 py-8 sm:px-8 sm:py-12">
            <div className="mb-7 flex items-center gap-2 text-xs font-medium text-indigo-300">
              <Sparkles size={15} /> YOUR AI BUILDING WORKSPACE
            </div>
            <h1 className="max-w-3xl text-3xl font-semibold leading-tight tracking-[-0.04em] text-white sm:text-5xl">
              Biến ý tưởng thành <span className="bg-gradient-to-r from-indigo-300 to-sky-300 bg-clip-text text-transparent">ứng dụng thực tế.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-neutral-400 sm:text-base">
              Mô tả sản phẩm bạn muốn xây dựng. x-bo giúp bạn bắt đầu từ yêu cầu, làm rõ cấu trúc và tiếp tục hoàn thiện cùng hệ sinh thái OCODE.js.
            </p>

            <div className="mt-8 border border-white/10 bg-[#0c0f18] p-3 shadow-[0_18px_70px_rgba(31,41,90,0.12)] sm:p-4">
              <label htmlFor="xbo-prompt" className="sr-only">Mô tả ứng dụng muốn xây dựng</label>
              <textarea id="xbo-prompt" value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                placeholder="Ask x-bo to build... Ví dụ: Tạo dashboard quản lý doanh thu dạng Dark Mode sử dụng OCODE.js."
                className="min-h-[104px] w-full resize-y bg-transparent px-2 py-2 text-sm leading-6 text-white outline-none placeholder:text-neutral-600 sm:min-h-[116px]" />
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-3">
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-500">
                  <span className="flex items-center gap-1.5"><PanelLeft size={13} /> Prompt-first</span>
                  <span className="text-neutral-700">/</span>
                  <span>OCODE.js workflow</span>
                </div>
                <button type="button" onClick={() => void handleSend()} disabled={!input.trim() || isSending}
                  className="flex items-center gap-2 bg-indigo-400 px-4 py-2.5 text-xs font-semibold text-[#080a10] transition hover:bg-indigo-300 disabled:cursor-not-allowed disabled:opacity-40">
                  {isSending ? 'Đang gửi...' : 'Bắt đầu'} <ArrowUp size={15} />
                </button>
              </div>
            </div>

            <div className="mt-8">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xs font-semibold text-neutral-300">Start with a template</h2>
                <span className="text-[10px] text-neutral-600">Chọn mẫu để điền prompt</span>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {STARTER_PROMPTS.map(template => {
                  const Icon = template.icon;
                  return (
                    <button key={template.title} type="button" onClick={() => useTemplate(template.prompt)}
                      className="group border border-white/[0.09] bg-white/[0.02] p-4 text-left transition hover:border-indigo-400/40 hover:bg-indigo-400/[0.04]">
                      <div className="mb-4 flex h-9 w-9 items-center justify-center border border-white/10 bg-white/[0.03] text-neutral-300 group-hover:border-indigo-400/30 group-hover:text-indigo-200">
                        <Icon size={17} />
                      </div>
                      <div className="text-sm font-medium text-neutral-100">{template.title}</div>
                      <div className="mt-1.5 text-xs leading-5 text-neutral-500">{template.description}</div>
                      <div className="mt-4 text-[10px] font-medium uppercase tracking-wider text-indigo-300/80">Use template ↗</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/[0.07] pt-4 text-[11px] text-neutral-600">
              <span className="flex items-center gap-1.5"><Code2 size={13} /> Code workflow</span>
              <span className="flex items-center gap-1.5"><Github size={13} /> GitHub integration planned</span>
              <span className="flex items-center gap-1.5"><Bot size={13} /> Provider-ready architecture</span>
            </div>
          </main>
        ) : (
          <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-4 py-6 sm:px-8">
            <div className="mb-1 flex items-center gap-2 text-xs text-neutral-500"><Sparkles size={14} className="text-indigo-300" /> x-bo conversation</div>
            {messages.filter(message => message.role !== 'system').map((message, index) => (
              <article key={`${message.role}-${index}`} className={`max-w-[92%] border p-4 sm:max-w-[85%] ${message.role === 'user' ? 'ml-auto border-indigo-400/20 bg-indigo-400/[0.08]' : 'border-white/10 bg-white/[0.025]'}`}>
                <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                  {message.role === 'user' ? 'You' : <><Bot size={13} className="text-indigo-300" /> x-bo agent</>}
                </div>
                <div className="whitespace-pre-wrap break-words text-sm leading-6 text-neutral-200">{message.content}</div>
              </article>
            ))}
            {isSending && <div className="flex items-center gap-2 text-xs text-indigo-200"><span className="h-2 w-2 animate-pulse rounded-full bg-indigo-300" /> Đang chờ phản hồi từ agent…</div>}
          </section>
        )}
      </div>

      {!isWelcome && (
        <div className="border-t border-white/10 bg-[#090b13] px-4 py-4 sm:px-8">
          {status && <div role="status" className={`mx-auto mb-3 max-w-4xl border px-3 py-2 text-xs ${status.type === 'error' ? 'border-rose-500/30 bg-rose-950/30 text-rose-200' : 'border-white/10 bg-white/[0.03] text-neutral-400'}`}>{status.text}</div>}
          <div className="mx-auto flex max-w-4xl items-end gap-2 border border-white/10 bg-[#0c0f18] p-2 focus-within:border-indigo-400/40">
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
              placeholder="Tiếp tục yêu cầu hoặc tinh chỉnh ứng dụng..." aria-label="Tin nhắn cho x-bo"
              className="max-h-40 min-h-12 flex-1 resize-y bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-neutral-600" />
            <button type="button" onClick={() => void handleSend()} disabled={!input.trim() || isSending} aria-label="Gửi yêu cầu"
              className="flex h-10 shrink-0 items-center gap-2 bg-indigo-400 px-3 text-xs font-semibold text-[#080a10] hover:bg-indigo-300 disabled:opacity-40">
              <ArrowUp size={16} /><span className="hidden sm:inline">{isSending ? 'Đang gửi' : 'Gửi'}</span>
            </button>
          </div>
          <p className="mx-auto mt-2 max-w-4xl text-[10px] text-neutral-600">Enter để gửi · Shift + Enter để xuống dòng</p>
        </div>
      )}

      {isWelcome && status && (
        <div role="status" className={`border-t px-4 py-2 text-center text-[11px] ${status.type === 'error' ? 'border-rose-500/20 bg-rose-950/20 text-rose-200' : 'border-white/[0.06] bg-[#090b13] text-neutral-600'}`}>
          {status.text}
        </div>
      )}
    </div>
  );
};
