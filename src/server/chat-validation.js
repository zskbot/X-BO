const SUPPORTED_MODELS = new Set(['openai', 'claude', 'gemini', 'qwen', 'ohmaba', 'zsk', 'all']);
const MAX_PROMPT_CHARS = 8000;

export function validateLegacyChatRequest(body) {
  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  if (!message) {
    return { error: { status: 400, code: 'INVALID_PROMPT', message: 'A non-empty message is required.' } };
  }
  if (message.length > MAX_PROMPT_CHARS) {
    return { error: { status: 413, code: 'PROMPT_TOO_LARGE', message: `Message must be ${MAX_PROMPT_CHARS} characters or fewer.` } };
  }

  if (body?.model !== undefined && body?.model !== null && typeof body.model !== 'string') {
    return { error: { status: 400, code: 'INVALID_PROVIDER', message: 'The requested model identifier must be a string.' } };
  }
  const model = typeof body?.model === 'string' ? body.model.trim() : '';
  if (model && (!/^[a-z0-9._:-]+$/i.test(model) || !SUPPORTED_MODELS.has(model))) {
    return { error: { status: 400, code: 'INVALID_PROVIDER', message: 'The requested model identifier is not supported.' } };
  }

  return { message, model: model || undefined };
}
