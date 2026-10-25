export function parseCodeProposals(content) {
  if (typeof content !== 'string' || !content) return [];

  const segments = [];
  const fence = /```([^\n`]*)\n([\s\S]*?)```/g;
  let cursor = 0;
  let match;

  while ((match = fence.exec(content)) !== null) {
    if (match.index > cursor) {
      segments.push({ type: 'text', content: content.slice(cursor, match.index) });
    }

    const info = match[1].trim();
    const tokens = info.split(/\s+/).filter(Boolean);
    const language = tokens[0] || 'text';
    const filenameMatch = info.match(/(?:^|\s)filename=["']?([^"']+?)["']?(?:\s|$)/i);
    const filename = filenameMatch
      ? filenameMatch[1]
      : tokens.slice(1).find(token => token.includes('/') || /\.[a-z0-9]{1,8}$/i.test(token)) || '';

    segments.push({
      type: 'code',
      language,
      filename,
      content: match[2].replace(/\n$/, ''),
    });
    cursor = fence.lastIndex;
  }

  if (cursor < content.length) {
    segments.push({ type: 'text', content: content.slice(cursor) });
  }

  return segments.length ? segments : [{ type: 'text', content }];
}
