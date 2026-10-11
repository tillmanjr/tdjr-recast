/**
 * trimEndingComma — remove one comma from the end of each line that has one.
 *
 * Accepts: one item per line
 * Returns: the same lines; a line-final comma is removed even when spaces or
 *          tabs follow it (those are kept). Other commas are untouched.
 */

/**
 * @param {string[]} lines
 * @param {object} [opts]   reserved for meta.args
 * @returns {string[]}
 */
export function trimEndingComma(lines, {} = {}) {
  return lines.map((line) => line.replace(/,(?=[ \t]*$)/, ''));
}

export const meta = {
  name: 'Trim ending comma',
  description: 'Drop a line-final comma',
  category: 'text',
  fn: trimEndingComma,
  inputType: 'lines',
  resultType: 'lines',
  quick: false,
};

export default trimEndingComma;
