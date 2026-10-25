import { describe, expect, it } from 'vitest';
import { parsePlanTasks } from './xbo-plan-parser.js';

describe('parsePlanTasks', () => {
  it('extracts ordered tasks from a task section', () => {
    expect(parsePlanTasks('## Mục tiêu\nLàm app\n## Tác vụ\n1. Khảo sát code hiện tại\n2. Viết kiểm thử tự động\n3. Chạy build')).toEqual([
      'Khảo sát code hiện tại', 'Viết kiểm thử tự động', 'Chạy build',
    ]);
  });
  it('supports bullets and checkbox syntax', () => {
    expect(parsePlanTasks('### Tasks\n- Add validation layer\n- Add tests\n[x] Verify build')).toEqual([
      'Add validation layer', 'Add tests', 'Verify build',
    ]);
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
