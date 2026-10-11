/**
 * unixMillisToDate — unix ms → date: a Millis since 1970 count, as digits, to ISO 8601 UTC.
 *
 * Accepts: a single string of digits, optionally with a fraction, e.g. "1700000000123"
 * Returns: "YYYY-MM-DDTHH:MM:SS[.fraction]Z"
 */
import { convert } from '../lib/timestamp.js';

/**
 * @param {string} input
 * @param {object} [opts]   reserved for meta.args
 * @returns {string}
 */
export function unixMillisToDate(input, {} = {}) {
  return convert('unix-ms', input);
}

export const meta = {
  name: 'unix ms → date',
  description: 'Millis since 1970 → UTC',
  category: 'timestamp',
  fn: unixMillisToDate,
  inputType: 'string',
  resultType: 'string',
  quick: true,
  quickPlaceholder: '1700000000123',
};

export default unixMillisToDate;
