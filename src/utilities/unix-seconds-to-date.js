/**
 * unixSecondsToDate — unix seconds → date: a Seconds since 1970 count, as digits, to ISO 8601 UTC.
 *
 * Accepts: a single string of digits, optionally with a fraction, e.g. "1700000000"
 * Returns: "YYYY-MM-DDTHH:MM:SS[.fraction]Z"
 */
import { convert } from '../lib/timestamp.js';

/**
 * @param {string} input
 * @param {object} [opts]   reserved for meta.args
 * @returns {string}
 */
export function unixSecondsToDate(input, {} = {}) {
  return convert('unix-s', input);
}

export const meta = {
  name: 'unix seconds → date',
  description: 'Seconds since 1970 → UTC',
  category: 'timestamp',
  fn: unixSecondsToDate,
  inputType: 'string',
  resultType: 'string',
  quick: true,
  quickPlaceholder: '1700000000',
};

export default unixSecondsToDate;
