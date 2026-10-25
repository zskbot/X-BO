const MAX_FILES = 10;
const MAX_FILE_BYTES = 100 * 1024;
const MAX_TOTAL_BYTES = 300 * 1024;
const ALLOWED_EXTENSIONS = new Set([
  '.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx',
  '.json', '.md', '.mdx', '.css', '.scss', '.html',
  '.yml', '.yaml', '.toml', '.txt', '.svg',
]);

const FORBIDDEN_SEGMENTS = new Set([
  '.git', '.github-private', 'node_modules', 'vendor', 'dist', 'build',
  'coverage', '.next', '.vercel', '.turbo',
]);

function getPathError(path) {
  if (typeof path !== 'string' || !path.trim()) return 'A relative file path is required.';
  if (path.length > 240) return 'File path must be 240 characters or fewer.';
  if (path.includes(String.fromCharCode(92)) || path.includes(String.fromCharCode(0))) return 'Backslashes and NUL bytes are not allowed in file paths.';
  if (path.startsWith('/') || /^[a-zA-Z]:/.test(path) || path.startsWith('//')) {
    return 'Absolute paths are not allowed.';
  }

  const segments = path.split('/');
  if (segments.some((segment) => !segment || segment === '.' || segment === '..')) {
    return 'Empty, dot, and parent-directory path segments are not allowed.';
  }
  if (segments.some((segment) => FORBIDDEN_SEGMENTS.has(segment.toLowerCase()))) {
    return 'The path targets a generated, dependency, or internal directory.';
  }
  const basename = segments.at(-1).toLowerCase();
  if (
    basename === '.env' ||
    basename.startsWith('.env.') ||
    basename.startsWith('.env-') ||
    /(^|[._-])(secret|secrets|credential|credentials|private[-_]?key)([._-]|$)/i.test(basename) ||
    /\.(pem|key|p12|pfx|keystore|jks)$/i.test(basename)
  ) {
    return 'Secret, environment, and private-key files are not eligible for proposals.';
  }
  const dot = basename.lastIndexOf('.');
  const extension = dot >= 0 ? basename.slice(dot) : '';
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return 'This file type is not allowed for a review-only proposal.';
  }
  return null;
}

export function validateFileProposals(input) {
  if (!Array.isArray(input)) {
    return { error: { code: 'INVALID_PROPOSALS', message: 'File proposals must be an array.' } };
  }
  if (input.length === 0 || input.length > MAX_FILES) {
    return { error: { code: 'INVALID_FILE_COUNT', message: `Provide between 1 and ${MAX_FILES} file proposals.` } };
  }

  const seen = new Set();
  const proposals = [];
  let totalBytes = 0;

  for (let index = 0; index < input.length; index += 1) {
    const item = input[index];
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return { error: { code: 'INVALID_PROPOSAL', index, message: 'Each proposal must be an object with path and content.' } };
    }

    const pathError = getPathError(item.path);
    if (pathError) {
      return { error: { code: 'INVALID_PATH', index, message: pathError } };
    }
    if (seen.has(item.path)) {
      return { error: { code: 'DUPLICATE_PATH', index, message: 'A path may appear only once in a proposal batch.' } };
    }
    seen.add(item.path);

    if (typeof item.content !== 'string') {
      return { error: { code: 'INVALID_CONTENT', index, message: 'File content must be a string.' } };
    }
    if (item.content.includes(String.fromCharCode(0))) {
      return { error: { code: 'INVALID_CONTENT', index, message: 'NUL bytes are not allowed in text proposals.' } };
    }

    const bytes = Buffer.byteLength(item.content, 'utf8');
    if (bytes > MAX_FILE_BYTES) {
      return { error: { code: 'FILE_TOO_LARGE', index, message: 'Each proposed file must be 100 KiB or smaller.' } };
    }
    totalBytes += bytes;
    if (totalBytes > MAX_TOTAL_BYTES) {
      return { error: { code: 'BATCH_TOO_LARGE', index, message: 'The complete proposal batch must be 300 KiB or smaller.' } };
    }

    proposals.push({ path: item.path, content: item.content });
  }

  return { proposals, totalBytes };
}

export const FILE_PROPOSAL_LIMITS = Object.freeze({
  maxFiles: MAX_FILES,
  maxFileBytes: MAX_FILE_BYTES,
  maxTotalBytes: MAX_TOTAL_BYTES,
});
