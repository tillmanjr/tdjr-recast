/**
 * unixNanosToDate — unix ns → date: a Nanos since 1970 count, as digits, to ISO 8601 UTC.
 *
 * Accepts: a single string of digits, optionally with a fraction, e.g. "1700000000123456789"
 * Returns: "YYYY-MM-DDTHH:MM:SS[.fraction]Z"
 */
import { convert } from '../lib/timestamp.js';

/**
 * @param {string} input
 * @param {object} [opts]   reserved for meta.args
 * @returns {string}
 */
export function unixNanosToDate(input, {} = {}) {
  return convert('unix-ns', input);
}

export const meta = {
  name: 'unix ns → date',
  description: 'Nanos since 1970 → UTC',
  category: 'timestamp',
  fn: unixNanosToDate,
  inputType: 'string',
  resultType: 'string',
  quick: true,
  quickPlaceholder: '1700000000123456789',
};

export default unixNanosToDate;
