/**
 * tsvToJson — tab-separated rows under a header, as a JSON array of objects.
 *
 * Accepts: tab-separated text; first row is the header; quoting as in CSV
 * Returns: pretty-printed JSON; every value stays a string
 */
import { fromDelimited } from '../lib/delimited.js';

/**
 * @param {string} input
 * @param {object} [opts]   reserved for meta.args
 * @returns {string}
 */
export function tsvToJson(input, {} = {}) {
  return fromDelimited(input, '\t');
}

export const meta = {
  name: 'TSV → JSON',
  description: 'Header row → objects',
  category: 'data',
  fn: tsvToJson,
  inputType: 'string',
  resultType: 'string',
  quick: false,
};

export default tsvToJson;
