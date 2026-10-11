/**
 * windowsFiletimeToDate — Windows FILETIME → date: a 100ns since 1601 count, as digits, to ISO 8601 UTC.
 *
 * Accepts: a single string of digits, optionally with a fraction, e.g. "132000000000000000"
 * Returns: "YYYY-MM-DDTHH:MM:SS[.fraction]Z"
 */
import { convert } from '../lib/timestamp.js';

/**
 * @param {string} input
 * @param {object} [opts]   reserved for meta.args
 * @returns {string}
 */
export function windowsFiletimeToDate(input, {} = {}) {
  return convert('filetime', input);
}

export const meta = {
  name: 'Windows FILETIME → date',
  description: '100ns since 1601 → UTC',
  category: 'timestamp',
  fn: windowsFiletimeToDate,
  inputType: 'string',
  resultType: 'string',
  quick: true,
  quickPlaceholder: '132000000000000000',
};

export default windowsFiletimeToDate;
