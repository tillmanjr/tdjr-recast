/**
 * <Utility name> — <one line: what it does>.
 *
 * Accepts: <input forms, e.g. "a single string" or "one item per line">
 * Returns: <what comes back>
 *
 * Copy this file to src/utilities/<kebab-name>.js, rename the function to
 * the camelCase form of the file name, fill in meta, then add one import
 * line to src/registry.js and a test under tests/utilities/.
 */

/**
 * @param {string} input
 * @param {object} [opts]   reserved for meta.args
 * @returns {string}
 */
export function myUtility(input, {} = {}) {
  return input;
}

export const meta = {
  name: 'my utility',          // shown in dropdown, tab title, Quick row
  description: 'What it does', // max 25 characters
  category: 'text',            // free string; dropdown groups by it
  fn: myUtility,
  inputType: 'string',         // 'string' | 'lines' | 'both'
  resultType: 'string',        // 'string' | 'lines'
  quick: false,                // true puts it on the Quick tab (string → string only)
  // quickPlaceholder: 'e.g. year, month, day',  // optional hint shown in the empty Quick input
  // sortOrder: 0,                // optional; ranks this ahead of the alphabetical ones in its category
};

export default myUtility;
