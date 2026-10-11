/**
 * swapPair — reverse the two sides of a separated pair.
 *
 * Accepts: one string of the form <LHS><separator><RHS>, e.g. "12\t34",
 *          "12 34", "12,34", "12, 34" or "6 66   , 999". The separator is a
 *          run of tab, space and comma characters. Which run: the strongest
 *          separator present decides, comma over tab over space, and the
 *          first run containing it is the split; everything after that run
 *          is the right-hand side. So "6 66   , 999" splits at the comma run,
 *          not at the space inside "6 66".
 * Returns: <RHS><separator><LHS>. A single space or tab is kept as is; a
 *          longer separator is trimmed at both ends (", " and " , " both
 *          become ","), and a run that is only whitespace collapses to one
 *          of its character.
 */

const PRECEDENCE = [',', '\t', ' '];
const SEPARATOR_RUNS = /[\t ,]+/g;

/**
 * @param {string} input
 * @param {object} [opts]   reserved for meta.args
 * @returns {string}
 */
export function swapPair(input, {} = {}) {
  const text = input.trim();
  const strongest = PRECEDENCE.find((c) => text.includes(c));
  const m = strongest === undefined ? null : [...text.matchAll(SEPARATOR_RUNS)].find((run) => run[0].includes(strongest));
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
