/**
 * base64Decode — base64 back to text, reading the bytes as UTF-8.
 *
 * Accepts: standard or URL-safe base64; whitespace and line wrapping are
 *          ignored and missing "=" padding is tolerated
 * Returns: the decoded text. Throws if the input is not base64 or the bytes
 *          are not valid UTF-8.
 */

/**
 * @param {string} input
 * @param {object} [opts]   reserved for meta.args
 * @returns {string}
 */
export function base64Decode(input, {} = {}) {
  let s = input.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  if (s.length % 4) s += '='.repeat(4 - (s.length % 4));
  let binary;
  try {
    binary = atob(s);
  } catch {
    throw new Error('Not valid base64');
  }
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Error('Decoded bytes are not valid UTF-8 text');
  }
}

export const meta = {
  name: 'Base64 decode',
  description: 'Base64 → text (UTF-8)',
  category: 'web',
  fn: base64Decode,
  inputType: 'string',
  resultType: 'string',
  quick: false,
};

export default base64Decode;
