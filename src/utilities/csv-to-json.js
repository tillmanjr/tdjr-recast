/**
 * csvToJson — comma-separated rows under a header, as a JSON array of objects.
 *
 * Accepts: RFC 4180 CSV; first row is the header
 * Returns: pretty-printed JSON; every value stays a string
 */
import { fromDelimited } from '../lib/delimited.js';

/**
 * @param {string} input
 * @param {object} [opts]   reserved for meta.args
 * @returns {string}
 */
export function csvToJson(input, {} = {}) {
  return fromDelimited(input, ',');
}

export const meta = {
  name: 'CSV → JSON',
  description: 'Header row → objects',
  category: 'data',
  fn: csvToJson,
  inputType: 'string',
  resultType: 'string',
  quick: false,
};

export default csvToJson;
