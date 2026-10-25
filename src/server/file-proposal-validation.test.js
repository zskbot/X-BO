import { describe, expect, it } from 'vitest';
import { validateFileProposals } from './file-proposal-validation.js';

describe('validateFileProposals', () => {
  it('accepts small, relative text-file proposals without writing them', () => {
    expect(validateFileProposals([
      { path: 'src/components/Example.tsx', content: 'export const Example = () => null;\n' },
      { path: 'docs/example.md', content: '# Example\n' },
    ])).toMatchObject({
      proposals: [
        { path: 'src/components/Example.tsx', content: 'export const Example = () => null;\n' },
        { path: 'docs/example.md', content: '# Example\n' },
      ],
    });
  });

  it('rejects a non-array, empty batches, and batches over the file limit', () => {
    expect(validateFileProposals(null).error.code).toBe('INVALID_PROPOSALS');
    expect(validateFileProposals([]).error.code).toBe('INVALID_FILE_COUNT');
    expect(validateFileProposals(Array.from({ length: 11 }, (_, i) => ({
      path: `src/file${i}.js`, content: '',
    }))).error.code).toBe('INVALID_FILE_COUNT');
  });

  it.each([
    '../outside.js',
    'src/../../outside.js',
    '/etc/passwd.js',
    'C:/outside.js',
    'src\\\\outside.js',
    '.env',
    '.env.production',
    'src/secrets.json',
    'src/private-key.pem',
    '.git/config.json',
    'node_modules/pkg/index.js',
    'dist/bundle.js',
    'src/app.exe',
  ])('rejects unsafe path %s', (path) => {
    expect(validateFileProposals([{ path, content: 'x' }]).error.code).toBe('INVALID_PATH');
  });

  it('rejects duplicate paths in a batch', () => {
    expect(validateFileProposals([
      { path: 'src/a.js', content: 'one' },
      { path: 'src/a.js', content: 'two' },
    ]).error.code).toBe('DUPLICATE_PATH');
  });

  it('rejects invalid content and NUL bytes', () => {
    expect(validateFileProposals([{ path: 'src/a.js', content: 42 }]).error.code).toBe('INVALID_CONTENT');
    expect(validateFileProposals([{ path: 'src/a.js', content: 'a\0b' }]).error.code).toBe('INVALID_CONTENT');
  });

  it('enforces per-file and total UTF-8 byte limits', () => {
    expect(validateFileProposals([{ path: 'src/a.js', content: 'x'.repeat(100 * 1024 + 1) }]).error.code)
      .toBe('FILE_TOO_LARGE');
    expect(validateFileProposals([
      { path: 'src/a.js', content: 'a'.repeat(100 * 1024) },
      { path: 'src/b.js', content: 'b'.repeat(100 * 1024) },
      { path: 'src/c.js', content: 'c'.repeat(100 * 1024) },
      { path: 'src/d.js', content: 'd' },
    ]).error.code).toBe('BATCH_TOO_LARGE');
    expect(validateFileProposals([{ path: 'src/a.js', content: 'é'.repeat(10) }]).totalBytes).toBe(20);
  });
});
