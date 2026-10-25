import React, { useMemo, useState } from 'react';
import { Check, Copy, Code2 } from 'lucide-react';
import { parseCodeProposals } from '../lib/xbo-code-proposal.js';

interface CodeProposalViewProps {
  content: string;
}

export const CodeProposalView: React.FC<CodeProposalViewProps> = ({ content }) => {
  const segments = useMemo(() => parseCodeProposals(content), [content]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copyFailedIndex, setCopyFailedIndex] = useState<number | null>(null);

  if (!segments.length) return null;

  const copyCode = async (index: number, code: string) => {
    setCopyFailedIndex(null);
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(code);
      setCopiedIndex(index);
    } catch {
      setCopiedIndex(null);
      setCopyFailedIndex(index);
    }
  };

  return (
    <div className="space-y-3">
      {segments.map((segment, index) => segment.type === 'text' ? (
        <div key={`text-${index}`} className="whitespace-pre-wrap break-words text-sm leading-6 text-neutral-200">
          {segment.content}
        </div>
      ) : (
        <section key={`code-${index}`} aria-label="Code proposal preview" className="overflow-hidden border border-indigo-400/20 bg-[#06080e]">
          <header className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-white/[0.025] px-3 py-2">
            <div className="flex min-w-0 items-center gap-2 text-xs text-neutral-300">
              <Code2 size={14} className="shrink-0 text-indigo-300" />
              <span className="truncate">{segment.filename || 'Code proposal'}</span>
              <span className="border border-white/10 px-1.5 py-0.5 text-[10px] uppercase text-neutral-500">{segment.language}</span>
            </div>
            <button type="button" onClick={() => void copyCode(index, segment.content)}
              className="flex shrink-0 items-center gap-1.5 border border-white/10 px-2 py-1.5 text-[11px] text-neutral-300 hover:border-indigo-400/40 hover:text-white">
              {copiedIndex === index ? <Check size={12} /> : <Copy size={12} />}
              {copiedIndex === index ? 'Đã sao chép' : 'Sao chép mã'}
            </button>
          </header>
          <pre className="max-h-[480px] overflow-auto p-3 text-xs leading-5 text-sky-100"><code>{segment.content}</code></pre>
          {copyFailedIndex === index && <p role="status" className="border-t border-rose-500/20 px-3 py-2 text-[11px] text-rose-200">Không thể sao chép tự động trên trình duyệt này. Hãy chọn và sao chép mã thủ công.</p>}
          <footer className="border-t border-white/[0.06] px-3 py-2 text-[10px] text-neutral-600">Bản đề xuất chỉ để xem và sao chép — chưa ghi vào repository hoặc thực thi.</footer>
        </section>
      ))}
    </div>
  );
};
