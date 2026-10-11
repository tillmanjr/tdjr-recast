/**
 * removeLineBreaks — join all lines into one, with nothing between them.
 *
 * Accepts: multi-line text with CRLF, LF or CR endings
 * Returns: the text with every line break removed
 */

/**
 * @param {string} input
 * @param {object} [opts]   reserved for meta.args
 * @returns {string}
 */
export function removeLineBreaks(input, {} = {}) {
  return input.replace(/\r\n|\r|\n/g, '');
}

export const meta = {
  name: 'Remove line breaks',
  description: 'Join lines, no breaks',
  category: 'text',
  fn: removeLineBreaks,
  inputType: 'string',
  resultType: 'string',
  quick: false,
};

export default removeLineBreaks;
