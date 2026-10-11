/**
 * urlDecode — decode percent-escapes in a URL component.
 *
 * Accepts: a URL-encoded string
 * Returns: decodeURIComponent(input). "+" is left alone: it only means a space
 *          in form encoding, and turning it into one would corrupt real pluses.
 */

/**
 * @param {string} input
 * @param {object} [opts]   reserved for meta.args
 * @returns {string}
 */
export function urlDecode(input, {} = {}) {
  try {
    return decodeURIComponent(input);
  } catch {
    throw new Error('Not a valid URL-encoded string');
  }
}

export const meta = {
  name: 'URL decode',
  description: 'decodeURIComponent',
  category: 'web',
  fn: urlDecode,
  inputType: 'string',
  resultType: 'string',
  quick: true,
  quickPlaceholder: 'a%20b%26c%3Dd',
};

export default urlDecode;
