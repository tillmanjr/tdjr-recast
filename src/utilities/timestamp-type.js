/**
 * timestampType — guess which timestamp format a string of digits is in.
 *
 * Accepts: a single string of digits, optionally with a fraction, e.g. "1700000000"
 * Returns: the type name, e.g. "Unix (seconds)" or "Windows FILETIME (100ns since 1601)"
 *
 * Detection is by digit count; see src/lib/timestamp.js for the bands.
 */
import { detectType } from '../lib/timestamp.js';

/**
 * @param {string} input
 * @param {object} [opts]   reserved for meta.args
 * @returns {string}
 */
export function timestampType(input, {} = {}) {
  return detectType(input).name;
}

export const meta = {
  name: 'timestamp → type',
  description: 'Guess timestamp type',
  category: 'timestamp',
  fn: timestampType,
  inputType: 'string',
  resultType: 'string',
  quick: true,
  quickPlaceholder: '1700000000',
};

export default timestampType;
