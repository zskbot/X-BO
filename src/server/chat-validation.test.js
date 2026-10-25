import { describe, expect, it } from 'vitest';
import { validateLegacyChatRequest } from './chat-validation.js';

describe('validateLegacyChatRequest', () => {
  it('trims the prompt and passes through a supported provider', () => {
    expect(validateLegacyChatRequest({ message: '  hello  ', model: 'gemini' }))
      .toEqual({ message: 'hello', model: 'gemini' });
  });

  it('rejects missing or blank prompts', () => {
    expect(validateLegacyChatRequest({ message: '   ' }).error.status).toBe(400);
    expect(validateLegacyChatRequest(null).error.code).toBe('INVALID_PROMPT');
  });

  it('rejects prompts over the limit', () => {
    expect(validateLegacyChatRequest({ message: 'x'.repeat(8001) }).error.status).toBe(413);
  });

  it('rejects unknown and malformed providers', () => {
    expect(validateLegacyChatRequest({ message: 'hello', model: 'unknown' }).error.code).toBe('INVALID_PROVIDER');
    expect(validateLegacyChatRequest({ message: 'hello', model: 'gemini;process' }).error.status).toBe(400);
  });

  it('allows an omitted provider to use the configured default', () => {
    expect(validateLegacyChatRequest({ message: 'hello' })).toEqual({ message: 'hello', model: undefined });
  });
});
