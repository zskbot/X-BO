const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_ERROR_LENGTH = 500;

export async function requestChat({
  message,
  model,
  apiBase = '',
  fetchImpl = fetch,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}) {
  const trimmedMessage = typeof message === 'string' ? message.trim() : '';
  if (!trimmedMessage) throw new Error('Nhập yêu cầu trước khi gửi.');
  if (typeof model !== 'string' || !model.trim()) {
    throw new Error('Hãy chọn một AI provider hợp lệ.');
  }
  if (typeof fetchImpl !== 'function') throw new Error('Fetch API không khả dụng.');

  const base = typeof apiBase === 'string' ? apiBase.trim().replace(/\/$/, '') : '';
  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetchImpl(`${base}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: trimmedMessage, model }),
      signal: controller.signal,
    });

    if (!response.ok) {
      let detail = '';
      try {
        detail = (await response.text()).trim().slice(0, MAX_ERROR_LENGTH);
      } catch {
        // Keep the HTTP status as the useful fallback.
      }
      throw new Error(detail || `API trả về HTTP ${response.status}. Kiểm tra backend và provider.`);
    }

    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error('API trả về dữ liệu không phải JSON hợp lệ.');
    }

    const content = typeof data?.response === 'string' && data.response.trim()
      ? data.response
      : typeof data?.result === 'string' && data.result.trim()
        ? data.result
        : '';
    if (!content) throw new Error('API đã phản hồi nhưng không có nội dung hợp lệ.');
    return content;
  } catch (error) {
    if (timedOut || error?.name === 'AbortError') {
      throw new Error(timedOut
        ? 'Yêu cầu hết thời gian chờ. Kiểm tra backend/provider rồi thử lại.'
        : 'Yêu cầu đã bị hủy.');
    }
    if (error instanceof TypeError) {
      throw new Error('Không kết nối được API. Kiểm tra URL backend, CORS và kết nối mạng.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
