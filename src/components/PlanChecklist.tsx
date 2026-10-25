import React, { useMemo, useState } from 'react';
import { CheckCircle2, Circle, ListChecks } from 'lucide-react';
import { parsePlanTasks } from '../lib/xbo-plan-parser.js';
import { CodeProposalView } from './CodeProposalView.tsx';

interface PlanChecklistProps {
  content: string;
}

export const PlanChecklist: React.FC<PlanChecklistProps> = ({ content }) => {
  const tasks = useMemo(() => parsePlanTasks(content), [content]);
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({});
  if (!tasks.length) {
    return <CodeProposalView content={content} />;
  }
  const completed = tasks.filter(task => checkedTasks[task]).length;
  return (
    <div className="space-y-4">
      <CodeProposalView content={content} />
      <section aria-label="Checklist kế hoạch" className="border border-indigo-400/20 bg-indigo-400/[0.04] p-3">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-200"><ListChecks size={15} /> Checklist kế hoạch</div>
          <span className="text-[10px] text-neutral-400" aria-live="polite">{completed}/{tasks.length} hoàn thành · chỉ lưu trong phiên hiện tại</span>
        </div>
        <ul className="space-y-2">
          {tasks.map((task, index) => {
            const checked = Boolean(checkedTasks[task]);
            return (
              <li key={task}>
                <label className="flex cursor-pointer items-start gap-2.5 border border-white/[0.06] bg-black/10 p-2.5 text-xs leading-5 text-neutral-300 hover:border-indigo-400/20">
                  <input type="checkbox" checked={checked}
                    onChange={event => setCheckedTasks(previous => ({ ...previous, [task]: event.target.checked }))}
                    className="mt-1 accent-indigo-400" />
                  {checked ? <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-300" /> : <Circle size={15} className="mt-0.5 shrink-0 text-neutral-500" />}
                  <span className={checked ? 'text-neutral-500 line-through' : ''}><span className="mr-2 text-neutral-600">{String(index + 1).padStart(2, '0')}</span>{task}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
};
