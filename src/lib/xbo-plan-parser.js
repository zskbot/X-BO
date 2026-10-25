const MAX_TASKS = 20;
const MAX_TASK_LENGTH = 240;

export function parsePlanTasks(content) {
  if (typeof content !== 'string' || !content.trim()) return [];

  const lines = content.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const tasks = [];
  let inTaskSection = false;

  for (const line of lines) {
    const heading = line.replace(/^#{1,4}\s*/, '').replace(/[*_]/g, '').trim();
    if (/^(?:t[aá]c v[uụ](?=\s|$)|tasks?\b|implementation steps\b|c[aá]c b[uư][ớo]c\b|steps?\b)/i.test(heading)) {
      inTaskSection = true;
      continue;
    }

    if (/^#{1,4}\s+/.test(line)) {
      if (inTaskSection) break;
      continue;
    }

    // Ignore lists outside a clearly identified task section to avoid turning prose examples into work items.
    if (!inTaskSection) continue;

    const match = line.match(/^(?:[-*+]\s+)?(?:\[[ xX]\]\s+|\d+[.)]\s+|)(.{3,240})$/);
    if (!match) continue;

    const task = match[1].replace(/^\[[ xX]\]\s+/, '').replace(/\*\*/g, '').trim();
    if (!task || task.length > MAX_TASK_LENGTH) continue;
    if (tasks.some(item => item.toLowerCase() === task.toLowerCase())) continue;

    tasks.push(task);
    if (tasks.length >= MAX_TASKS) break;
  }

  return tasks;
}
