/**
 * unixMicrosToDate — unix µs → date: a Micros since 1970 count, as digits, to ISO 8601 UTC.
 *
 * Accepts: a single string of digits, optionally with a fraction, e.g. "1700000000123456"
 * Returns: "YYYY-MM-DDTHH:MM:SS[.fraction]Z"
 */
import { convert } from '../lib/timestamp.js';

/**
 * @param {string} input
 * @param {object} [opts]   reserved for meta.args
 * @returns {string}
 */
export function unixMicrosToDate(input, {} = {}) {
  return convert('unix-us', input);
}

export const meta = {
  name: 'unix µs → date',
  description: 'Micros since 1970 → UTC',
  category: 'timestamp',
  fn: unixMicrosToDate,
  inputType: 'string',
  resultType: 'string',
  quick: true,
  quickPlaceholder: '1700000000123456',
};

export default unixMicrosToDate;
