/**
 * coredataTimestampToDate — CoreData → date: a Secs since 2001 count, as digits, to ISO 8601 UTC.
 *
 * Accepts: a single string of digits, optionally with a fraction, e.g. "700000000"
 * Returns: "YYYY-MM-DDTHH:MM:SS[.fraction]Z"
 */
import { convert } from '../lib/timestamp.js';

/**
 * @param {string} input
 * @param {object} [opts]   reserved for meta.args
 * @returns {string}
 */
export function coredataTimestampToDate(input, {} = {}) {
  return convert('coredata', input);
}

export const meta = {
  name: 'CoreData → date',
  description: 'Secs since 2001 → UTC',
  category: 'timestamp',
  fn: coredataTimestampToDate,
  inputType: 'string',
  resultType: 'string',
  quick: true,
  quickPlaceholder: '700000000',
};

export default coredataTimestampToDate;
