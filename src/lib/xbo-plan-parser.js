const MAX_TASKS = 20;

export function parsePlanTasks(content) {
  if (typeof content !== 'string' || !content.trim()) return [];
  const lines = content.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const tasks = [];
  let inTaskSection = false;
  for (const line of lines) {
    if (/^(#{1,4}\s*)?(t[aá]c v[uụ]c|tasks?|implementation steps|c[aá]c b[uư][ớo]c|steps?)\b/i.test(line.replace(/[*_]/g, ''))) {
      inTaskSection = true;
      continue;
    }
    if (/^#{1,4}\s+/.test(line) && inTaskSection) break;
    const match = line.match(/^(?:[-*+]\s+|\d+[.)]\s+|\[[ xX]\]\s+)(.{3,240})$/);
    if (!match) continue;
    const task = match[1].replace(/\*\*/g, '').trim();
    if (!task || tasks.some(item => item.toLowerCase() === task.toLowerCase())) continue;
    tasks.push(task);
    if (tasks.length >= MAX_TASKS) break;
  }
  return tasks;
}
