import React, { useState } from 'react';
import { requestChat } from '../lib/xbo-chat-client.js';
import { PlanChecklist } from './PlanChecklist.tsx';
import { CodeProposalView } from './CodeProposalView.tsx';
import { ArrowUp, Bot, Check, CheckCircle2, ChevronDown, Code2, Copy, Github, LayoutDashboard, ListChecks, MessageSquare, PanelLeft, Sparkles } from 'lucide-react';
import { createBuildPlan } from '../utils/buildPlanner.js';

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
  workspaceMode?: 'chat' | 'plan';
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
  const [workspaceMode, setWorkspaceMode] = useState<'chat' | 'plan'>('chat');
  const [status, setStatus] = useState<{ type: 'info' | 'error'; text: string } | null>({
    type: 'info',
    text: 'Kết quả phụ thuộc API server và provider credentials đã cấu hình.'
  });
  const [isSending, setIsSending] = useState(false);
  const [showProviderMenu, setShowProviderMenu] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState<number | null>(null);
  const isWelcome = messages.length <= 1;
  const localBuildPlan = createBuildPlan(input);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    setMessages(prev => [...prev, { role: 'user', content: trimmed }]);
    setInput('');
    setIsSending(true);
    setStatus(null);

    try {
      const requestMessage = workspaceMode === 'plan'
        ? `Yêu cầu sản phẩm: ${trimmed}\n\nHãy lập kế hoạch gồm mục tiêu, giả định, file dự kiến, tác vụ theo thứ tự, kiểm thử, rủi ro/bảo mật và tiêu chí nghiệm thu. Không tuyên bố đã tạo/sửa file và không triển khai production.`
        : trimmed;
      const content = await requestChat({
        message: requestMessage,
        model: selectedModel,
        apiBase: import.meta.env.VITE_API_BASE_URL || ''
      });
      setMessages(prev => [...prev, { role: 'assistant', content, workspaceMode }]);
      setStatus({ type: 'info', text: workspaceMode === 'plan' ? 'Đã nhận kế hoạch đề xuất; chưa sửa file hay triển khai.' : 'Đã nhận phản hồi từ agent.' });
    } catch (err) {
      // Keep the prompt available for retry without leaving a duplicate failed message in history.
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        return lastMessage?.role === 'user' && lastMessage.content === trimmed
          ? prev.slice(0, -1)
          : prev;
      });
      setInput(trimmed);
      setStatus({ type: 'error', text: err instanceof Error ? err.message : 'Lỗi khi gọi agent.' });
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyMessage = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessage(index);
      setStatus({ type: 'info', text: 'Đã sao chép nội dung phản hồi.' });
    } catch {
      setStatus({ type: 'error', text: 'Không thể truy cập clipboard. Hãy chọn và sao chép nội dung thủ công.' });
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
      {workspaceMode === 'plan' && input.trim() && (
        <section aria-label="Kế hoạch xây dựng sơ bộ" className="mx-4 mt-3 border border-indigo-400/20 bg-indigo-400/[0.035] p-4 sm:mx-6 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-neutral-100"><ListChecks size={16} className="text-indigo-300" /> Kế hoạch đề xuất</div>
              <p className="mt-1 text-xs leading-5 text-neutral-500">Tạo tại trình duyệt từ prompt hiện tại. Chỉ là kế hoạch sơ bộ, chưa tạo hoặc sửa mã nguồn.</p>
            </div>
            <span className="shrink-0 border border-white/10 px-2 py-1 text-[10px] text-neutral-400">{localBuildPlan.length} bước</span>
          </div>
          <ol className="mt-4 space-y-3">
            {localBuildPlan.map((task, index) => (
              <li key={task.id} className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border border-indigo-400/25 text-[10px] text-indigo-200">{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <div className="text-xs font-medium text-neutral-200">{task.title}</div>
                  <p className="mt-1 text-xs leading-5 text-neutral-500">{task.detail}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-4 flex items-center gap-2 border-t border-white/[0.07] pt-3 text-[11px] text-neutral-500"><CheckCircle2 size={13} className="text-indigo-300" /> Xem lại prompt rồi gửi cho agent khi sẵn sàng.</div>
        </section>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {isWelcome ? (
          <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 py-8 sm:px-8 sm:py-12">
            <section className="xbo-hero relative mb-7 overflow-hidden rounded-2xl border p-5 sm:p-7"><div className="xbo-hero-glow" /><div className="relative z-10"><div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/[0.07] px-3 py-1.5 text-[11px] text-cyan-100"><span className="xbo-mini-logo">X</span> x-bo by <span className="text-sky-300">OCODE.js</span></div><div className="xbo-hero-robot" aria-hidden="true"><span /><span /></div><div className="mb-3 flex items-center gap-2 text-xs font-medium text-indigo-300">
              <Sparkles size={15} /> YOUR AI BUILDING WORKSPACE
            </div>
            <h1 className="max-w-3xl text-3xl font-semibold leading-tight tracking-[-0.04em] text-white sm:text-5xl">
              Biến ý tưởng thành <span className="bg-gradient-to-r from-indigo-300 to-sky-300 bg-clip-text text-transparent">ứng dụng thực tế.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-neutral-400 sm:text-base">
              Mô tả sản phẩm bạn muốn xây dựng. x-bo giúp bạn bắt đầu từ yêu cầu, làm rõ cấu trúc và tiếp tục hoàn thiện cùng hệ sinh thái OCODE.js.
            </p></div></section>

            <div className="xbo-composer mt-8 border p-3 shadow-[0_18px_70px_rgba(31,41,90,0.12)] sm:p-4">
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
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {STARTER_PROMPTS.map(template => {
                  const Icon = template.icon;
                  return (
                    <button key={template.title} type="button" onClick={() => useTemplate(template.prompt)}
                      className="xbo-starter-card group border p-4 text-left transition">
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
          <section aria-live="polite" aria-relevant="additions text" className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-4 py-6 sm:px-8">
            <div className="mb-1 flex items-center gap-2 text-xs text-neutral-500"><Sparkles size={14} className="text-indigo-300" /> x-bo conversation</div>
            {messages.filter(message => message.role !== 'system').map((message, index) => (
              <article key={`${message.role}-${index}`} className={`max-w-[92%] border p-4 sm:max-w-[85%] ${message.role === 'user' ? 'ml-auto border-indigo-400/20 bg-indigo-400/[0.08]' : 'border-white/10 bg-white/[0.025]'}`}>
                <div className="mb-2 flex items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                  <span className="flex items-center gap-2">{message.role === 'user' ? 'Bạn' : <><Bot size={13} className="text-indigo-300" /> x-bo agent</>}</span>
                  {message.role === 'assistant' && <button type="button" onClick={() => void handleCopyMessage(message.content, index)} aria-label="Sao chép phản hồi" className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2 py-1 text-[10px] normal-case tracking-normal text-neutral-400 transition hover:border-cyan-300/40 hover:text-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300">{copiedMessage === index ? <Check size={12} /> : <Copy size={12} />} {copiedMessage === index ? "Đã sao chép" : "Sao chép"}</button>}
                </div>
                <div className="text-sm leading-6 text-neutral-200">{message.role === 'assistant' && message.workspaceMode === 'plan' ? <PlanChecklist content={message.content} /> : message.role === 'assistant' ? <CodeProposalView content={message.content} /> : <div className="whitespace-pre-wrap break-words">{message.content}</div>}</div>
              </article>
            ))}
            {isSending && <div className="flex items-center gap-2 text-xs text-indigo-200"><span className="h-2 w-2 animate-pulse rounded-full bg-indigo-300" /> Đang chờ phản hồi từ agent…</div>}
          </section>
        )}
      </div>

      {!isWelcome && (
        <div className="border-t border-white/10 bg-[#090b13] px-4 py-4 sm:px-8">
          {status && <div role={status.type === 'error' ? 'alert' : 'status'} className={`mx-auto mb-3 max-w-4xl border px-3 py-2 text-xs ${status.type === 'error' ? 'border-rose-500/30 bg-rose-950/30 text-rose-200' : 'border-white/10 bg-white/[0.03] text-neutral-400'}`}>{status.text}</div>}
          <div className="mx-auto flex max-w-4xl items-end gap-2 border border-white/10 bg-[#0c0f18] p-2 focus-within:border-indigo-400/40">
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
              placeholder="Tiếp tục yêu cầu hoặc tinh chỉnh ứng dụng..." aria-label="Tin nhắn cho x-bo" maxLength={8000}
              className="max-h-40 min-h-12 flex-1 resize-y bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-neutral-600" />
            <button type="button" onClick={() => void handleSend()} disabled={!input.trim() || isSending} aria-label="Gửi yêu cầu"
              className="flex h-10 shrink-0 items-center gap-2 bg-indigo-400 px-3 text-xs font-semibold text-[#080a10] hover:bg-indigo-300 disabled:opacity-40">
              <ArrowUp size={16} /><span className="hidden sm:inline">{isSending ? 'Đang gửi' : 'Gửi'}</span>
            </button>
          </div>
          <p className="mx-auto mt-2 max-w-4xl text-[10px] text-neutral-600">Enter để gửi · Shift + Enter để xuống dòng</p>
        </div>
      )}

      <nav className="xbo-bottom-nav mx-auto grid w-full max-w-4xl grid-cols-5 sm:hidden" aria-label="Điều hướng nhanh"><span className="selected"><MessageSquare size={17}/><small>Chat</small></span><span><LayoutDashboard size={17}/><small>Templates</small></span><span><Code2 size={17}/><small>Workspace</small></span><span><Sparkles size={17}/><small>Deploy</small></span><a href="https://github.com/zskbot/X-BO" target="_blank" rel="noreferrer"><Github size={17}/><small>GitHub</small></a></nav>
      {isWelcome && status && (
        <div role="status" className={`border-t px-4 py-2 text-center text-[11px] ${status.type === 'error' ? 'border-rose-500/20 bg-rose-950/20 text-rose-200' : 'border-white/[0.06] bg-[#090b13] text-neutral-600'}`}>
          {status.text}
        </div>
      )}
    </div>
  );
};
