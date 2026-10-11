/**
 * swapPair — reverse the two sides of a separated pair.
 *
 * Accepts: one string of the form <LHS><separator><RHS>, e.g. "12\t34",
 *          "12 34", "12,34", "12, 34" or "12 , 34". The separator is the
 *          first run of tab, space and comma characters; everything after it
 *          is the right-hand side.
 * Returns: <RHS><separator><LHS>. A single space or tab is kept as is; a
 *          longer separator is trimmed at both ends (", " and " , " both
 *          become ","), and a run that is only whitespace collapses to one
 *          of its character.
 */

const SEPARATOR_RUN = /[\t ,]+/;

/**
 * @param {string} input
 * @param {object} [opts]   reserved for meta.args
 * @returns {string}
 */
export function swapPair(input, {} = {}) {
  const text = input.trim();
  const m = SEPARATOR_RUN.exec(text);
  const lhs = m ? text.slice(0, m.index) : '';
  const rhs = m ? text.slice(m.index + m[0].length) : '';
  if (lhs === '' || rhs === '') throw new Error('Expected two pieces separated by tabs, spaces or commas');
  return `${rhs}${outputSeparator(m[0])}${lhs}`;
}

function outputSeparator(run) {
  if (run.length === 1) return run;
  const trimmed = run.trim();
  return trimmed === '' ? run[0] : trimmed;
}

export const meta = {
  name: 'Swap pair',
  description: 'Swap a separated pair',
  category: 'data',
  fn: swapPair,
  inputType: 'string',
  resultType: 'string',
  quick: true,
  quickPlaceholder: '12, 34',
};

export default swapPair;
