/**
 * stripSinglePeriods — drop lone periods and halve runs of them.
 *
 * Accepts: any text
 * Returns: the text with every run of periods replaced by half as many,
 *          rounded down: "." → "", ".." → ".", "..." → ".", "...." → ".."
 */

/**
 * @param {string} input
 * @param {object} [opts]   reserved for meta.args
 * @returns {string}
 */
export function stripSinglePeriods(input, {} = {}) {
  return input.replace(/\.+/g, (run) => '.'.repeat(Math.floor(run.length / 2)));
}

export const meta = {
  name: 'Strip single periods',
  description: 'Lone . gone, runs halved',
  category: 'text',
  fn: stripSinglePeriods,
  inputType: 'string',
  resultType: 'string',
  quick: false,
};

export default stripSinglePeriods;
