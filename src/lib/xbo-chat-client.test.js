import { describe, expect, it, vi } from 'vitest';
import { requestChat } from './xbo-chat-client.js';

function jsonResponse(body, options = {}) {
  return {
    ok: options.ok ?? true,
    status: options.status ?? 200,
    json: vi.fn().mockResolvedValue(body),
    text: vi.fn().mockResolvedValue(options.text ?? ''),
  };
}

describe('requestChat', () => {
  it('posts a trimmed prompt and selected model to the chat endpoint', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ response: 'Plan created' }));
    await expect(requestChat({
      message: '  Build a landing page  ',
      model: 'gemini',
      apiBase: 'https://api.example.test/',
      fetchImpl,
    })).resolves.toBe('Plan created');

    expect(fetchImpl).toHaveBeenCalledWith('https://api.example.test/chat', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ message: 'Build a landing page', model: 'gemini' }),
    }));
  });

  it('accepts the legacy result response field', async () => {
    await expect(requestChat({
      message: 'hello', model: 'zsk',
      fetchImpl: vi.fn().mockResolvedValue(jsonResponse({ result: 'Hello' })),
    })).resolves.toBe('Hello');
  });

  it('rejects empty prompts before calling the network', async () => {
    const fetchImpl = vi.fn();
    await expect(requestChat({ message: '  ', model: 'zsk', fetchImpl }))
      .rejects.toThrow('Nhập yêu cầu trước khi gửi.');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('rejects an empty model before calling the network', async () => {
    const fetchImpl = vi.fn();
    await expect(requestChat({ message: 'hello', model: '  ', fetchImpl }))
      .rejects.toThrow('Hãy chọn một AI provider hợp lệ.');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('reports HTTP errors with bounded server details', async () => {
    await expect(requestChat({
      message: 'hello', model: 'zsk',
      fetchImpl: vi.fn().mockResolvedValue(jsonResponse({}, {
        ok: false, status: 503, text: 'Provider unavailable',
      })),
    })).rejects.toThrow('Provider unavailable');
  });

  it('rejects invalid JSON responses', async () => {
    await expect(requestChat({
      message: 'hello', model: 'zsk',
      fetchImpl: vi.fn().mockResolvedValue({
        ok: true, status: 200, json: vi.fn().mockRejectedValue(new SyntaxError('bad json')),
      }),
    })).rejects.toThrow('API trả về dữ liệu không phải JSON hợp lệ.');
  });

  it('rejects successful responses with no usable content', async () => {
    await expect(requestChat({
      message: 'hello', model: 'zsk',
      fetchImpl: vi.fn().mockResolvedValue(jsonResponse({ response: 42 })),
    })).rejects.toThrow('API đã phản hồi nhưng không có nội dung hợp lệ.');
  });

  it('turns network TypeErrors into an actionable message', async () => {
    await expect(requestChat({
      message: 'hello', model: 'zsk',
      fetchImpl: vi.fn().mockRejectedValue(new TypeError('failed')),
    })).rejects.toThrow('Không kết nối được API.');
  });

  it('aborts requests that exceed the timeout', async () => {
    const fetchImpl = vi.fn((url, options) => new Promise((resolve, reject) => {
      options.signal.addEventListener('abort', () => {
        const error = new Error('aborted');
        error.name = 'AbortError';
        reject(error);
      }, { once: true });
    }));
    await expect(requestChat({
      message: 'hello', model: 'zsk', fetchImpl, timeoutMs: 5,
    })).rejects.toThrow('Yêu cầu hết thời gian chờ.');
  });
});
