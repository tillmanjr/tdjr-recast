/**
 * base64Encode — base64 of the UTF-8 bytes of the text.
 *
 * Accepts: any string
 * Returns: standard base64 with padding, on one line
 */

const CHUNK = 0x8000; // String.fromCharCode(...bytes) overflows the stack on big inputs; feed it in chunks

/**
 * @param {string} input
 * @param {object} [opts]   reserved for meta.args
 * @returns {string}
 */
export function base64Encode(input, {} = {}) {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

export const meta = {
  name: 'Base64 encode',
  description: 'Text → base64 (UTF-8)',
  category: 'web',
  fn: base64Encode,
  inputType: 'string',
  resultType: 'string',
  quick: false,
};

export default base64Encode;
