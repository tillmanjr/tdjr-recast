/**
 * webkitTimestampToDate — Chrome/WebKit → date: a µs since 1601 count, as digits, to ISO 8601 UTC.
 *
 * Accepts: a single string of digits, optionally with a fraction, e.g. "13300000000000000"
 * Returns: "YYYY-MM-DDTHH:MM:SS[.fraction]Z"
 */
import { convert } from '../lib/timestamp.js';

/**
 * @param {string} input
 * @param {object} [opts]   reserved for meta.args
 * @returns {string}
 */
export function webkitTimestampToDate(input, {} = {}) {
  return convert('webkit', input);
}

export const meta = {
  name: 'Chrome/WebKit → date',
  description: 'µs since 1601 → UTC',
  category: 'timestamp',
  fn: webkitTimestampToDate,
  inputType: 'string',
  resultType: 'string',
  quick: true,
  quickPlaceholder: '13300000000000000',
};

export default webkitTimestampToDate;
