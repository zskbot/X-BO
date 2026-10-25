import { describe, expect, it } from 'vitest';
import { parseCodeProposals } from './xbo-code-proposal.js';

describe('parseCodeProposals', () => {
  it('keeps plain assistant text as a text segment', () => {
    expect(parseCodeProposals('No code in this answer.')).toEqual([
      { type: 'text', content: 'No code in this answer.' },
    ]);
  });

  it('extracts fenced code language and filename without executing it', () => {
    expect(parseCodeProposals('Create this file:\n```tsx src/App.tsx\nexport default function App() {}\n```')).toEqual([
      { type: 'text', content: 'Create this file:\n' },
      { type: 'code', language: 'tsx', filename: 'src/App.tsx', content: 'export default function App() {}' },
    ]);
  });

  it('supports filename metadata and multiple code blocks', () => {
    const segments = parseCodeProposals('```js filename="src/main.js"\nconsole.log("safe preview");\n```\nAnd another file:\n```css styles.css\nbody { margin: 0; }\n```');
    expect(segments).toHaveLength(3);
    expect(segments[0]).toMatchObject({ type: 'code', language: 'js', filename: 'src/main.js' });
    expect(segments[1]).toMatchObject({ type: 'text' });
    expect(segments[2]).toMatchObject({ type: 'code', language: 'css', filename: 'styles.css' });
  });

  it('returns an empty array for an empty response', () => {
    expect(parseCodeProposals('')).toEqual([]);
  });
});
