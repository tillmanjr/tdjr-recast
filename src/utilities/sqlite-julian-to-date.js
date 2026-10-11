/**
 * sqliteJulianToDate — SQLite Julian → date: a Julian day count, as digits, to ISO 8601 UTC.
 *
 * Accepts: a single string of digits, optionally with a fraction, e.g. "2460000.5"
 * Returns: "YYYY-MM-DDTHH:MM:SS[.fraction]Z"
 */
import { convert } from '../lib/timestamp.js';

/**
 * @param {string} input
 * @param {object} [opts]   reserved for meta.args
 * @returns {string}
 */
export function sqliteJulianToDate(input, {} = {}) {
  return convert('julian', input);
}

export const meta = {
  name: 'SQLite Julian → date',
  description: 'Julian day → UTC',
  category: 'timestamp',
  fn: sqliteJulianToDate,
  inputType: 'string',
  resultType: 'string',
  quick: true,
  quickPlaceholder: '2460000.5',
};

export default sqliteJulianToDate;
