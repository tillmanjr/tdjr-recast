/**
 * jsonToTsv — a JSON array of objects (or arrays) as tab-separated rows.
 *
 * Accepts: JSON text, pasted whole (the tab's Split lines must be off)
 * Returns: a header row from the union of keys, then one row per object;
 *          cells with tabs, quotes or line breaks are quoted
 */
import { toDelimited } from '../lib/delimited.js';

/**
 * @param {string} input
 * @param {object} [opts]   reserved for meta.args
 * @returns {string}
 */
export function jsonToTsv(input, {} = {}) {
  return toDelimited(input, '\t');
}

export const meta = {
  name: 'JSON → TSV',
  description: 'Array of objects → TSV',
  category: 'data',
  fn: jsonToTsv,
  inputType: 'string',
  resultType: 'string',
  quick: false,
};

export default jsonToTsv;
