import { describe, expect, it } from 'vitest';
import { parsePlanTasks } from './xbo-plan-parser.js';

describe('parsePlanTasks', () => {
  it('extracts ordered tasks from a task section', () => {
    expect(parsePlanTasks('## Mục tiêu\nLàm app\n## Tác vụ\n1. Khảo sát code hiện tại\n2. Viết kiểm thử tự động\n3. Chạy build')).toEqual([
      'Khảo sát code hiện tại', 'Viết kiểm thử tự động', 'Chạy build',
    ]);
  });

  it('supports bullets, numbered tasks, and nested markdown checkboxes', () => {
    expect(parsePlanTasks('### Tasks\n- Add validation layer\n- Add tests\n- [ ] Verify build\n[x] Verify release')).toEqual([
      'Add validation layer', 'Add tests', 'Verify build', 'Verify release',
    ]);
  });

  it('ignores lists outside a task section', () => {
    expect(parsePlanTasks('Example:\n- This is an example, not a task\n## Risks\n- Handle user input carefully')).toEqual([]);
  });

  it('returns an empty list for empty or unstructured text', () => {
    expect(parsePlanTasks('')).toEqual([]);
    expect(parsePlanTasks('A general paragraph without task list.')).toEqual([]);
  });

  it('deduplicates tasks and caps output at twenty items', () => {
    const lines = Array.from({ length: 25 }, (_, index) => String(index + 1) + '. Task number ' + String(index + 1));
    expect(parsePlanTasks('## Tasks\n' + lines.join('\n') + '\n- Task number 1')).toHaveLength(20);
  });
});
