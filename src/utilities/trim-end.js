/**
 * trimEnd — remove trailing spaces and tabs from every line.
 *
 * Accepts: one item per line
 * Returns: the same lines with their trailing blanks removed; leading blanks stay
 */

/**
 * @param {string[]} lines
 * @param {object} [opts]   reserved for meta.args
 * @returns {string[]}
 */
export function trimEnd(lines, {} = {}) {
  return lines.map((line) => line.replace(/[ \t]+$/, ''));
}

export const meta = {
  name: 'Trim end',
  description: 'Strip trailing blanks',
  category: 'text',
  fn: trimEnd,
  inputType: 'lines',
  resultType: 'lines',
  quick: false,
};

export default trimEnd;
