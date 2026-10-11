/**
 * urlEncode — percent-encode text for use in a URL component.
 *
 * Accepts: any string
 * Returns: encodeURIComponent(input); multi-byte characters become UTF-8 escapes
 */

/**
 * @param {string} input
 * @param {object} [opts]   reserved for meta.args
 * @returns {string}
 */
export function urlEncode(input, {} = {}) {
  return encodeURIComponent(input);
}

export const meta = {
  name: 'URL encode',
  description: 'encodeURIComponent',
  category: 'web',
  fn: urlEncode,
  inputType: 'string',
  resultType: 'string',
  quick: true,
  quickPlaceholder: 'a b&c=d',
};

export default urlEncode;
