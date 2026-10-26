import { describe, expect, it, vi } from 'vitest';
import { requestChat } from '../src/lib/xbo-chat-client.js';

describe('requestChat', () => {
  it('rejects an empty prompt before making a request', async () => {
    const fetchImpl = vi.fn();
    await expect(requestChat({ message: '   ', model: 'gemini', fetchImpl })).rejects.toThrow('Nhập yêu cầu trước khi gửi.');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('rejects a missing provider before making a request', async () => {
    const fetchImpl = vi.fn();
    await expect(requestChat({ message: 'Build a page', model: '', fetchImpl })).rejects.toThrow('Hãy chọn một AI provider hợp lệ.');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('returns the assistant response from a successful JSON response', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ response: 'Created a plan.' }),
    });
    await expect(requestChat({ message: '  Build a page  ', model: 'gemini', fetchImpl }))
      .resolves.toBe('Created a plan.');
    expect(fetchImpl).toHaveBeenCalledWith('/chat', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ message: 'Build a page', model: 'gemini' }),
    }));
  });

  it('surfaces useful HTTP errors from the backend', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => 'Provider is not configured',
    });
    await expect(requestChat({ message: 'Build a page', model: 'gemini', fetchImpl }))
      .rejects.toThrow('Provider is not configured');
  });

  it('rejects malformed JSON responses', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => { throw new SyntaxError('bad json'); },
    });
    await expect(requestChat({ message: 'Build a page', model: 'gemini', fetchImpl }))
      .rejects.toThrow('API trả về dữ liệu không phải JSON hợp lệ.');
  });

  it('rejects a successful response with no usable content', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    await expect(requestChat({ message: 'Build a page', model: 'gemini', fetchImpl }))
      .rejects.toThrow('API đã phản hồi nhưng không có nội dung hợp lệ.');
  });
});
