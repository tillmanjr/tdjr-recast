/**
 * jsonToCsv — a JSON array of objects (or arrays) as comma-separated rows.
 *
 * Accepts: JSON text, pasted whole (the tab's Split lines must be off)
 * Returns: a header row from the union of keys, then one row per object;
 *          cells with commas, quotes or line breaks are quoted
 */
import { toDelimited } from '../lib/delimited.js';

/**
 * @param {string} input
 * @param {object} [opts]   reserved for meta.args
 * @returns {string}
 */
export function jsonToCsv(input, {} = {}) {
  return toDelimited(input, ',');
}

export const meta = {
  name: 'JSON → CSV',
  description: 'Array of objects → CSV',
  category: 'data',
  fn: jsonToCsv,
  inputType: 'string',
  resultType: 'string',
  quick: false,
};

export default jsonToCsv;
