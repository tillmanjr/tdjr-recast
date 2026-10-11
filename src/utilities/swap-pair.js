/**
 * swapPair — reverse the two halves of a separated pair.
 *
 * Accepts: one string holding two pieces of data, e.g. "12\t34", "12 34" or "12,34".
 *          The separator is detected in the order tab, space, comma: the first
 *          of those present in the (trimmed) input wins, and the split happens
 *          at its first occurrence.
 * Returns: second piece, separator, first piece, each piece trimmed
 */

const SEPARATORS = ['\t', ' ', ','];

/**
 * @param {string} input
 * @param {object} [opts]   reserved for meta.args
 * @returns {string}
 */
export function swapPair(input, {} = {}) {
  const text = input.trim();
  const sep = SEPARATORS.find((s) => text.includes(s));
  if (sep === undefined) throw new Error('No tab, space or comma to split on');
  const at = text.indexOf(sep);
  const first = text.slice(0, at).trim();
  const second = text.slice(at + 1).trim();
  return `${second}${sep}${first}`;
}

export const meta = {
  name: 'Swap pair',
  description: 'Swap a separated pair',
  category: 'data',
  fn: swapPair,
  inputType: 'string',
  resultType: 'string',
  quick: true,
  quickPlaceholder: '12,34',
};

export default swapPair;
