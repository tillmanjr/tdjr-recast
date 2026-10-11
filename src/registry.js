/**
 * Every utility the app knows about. To add one: import its module below and
 * add it to `modules` keyed by file name. The key appears in error messages.
 */
import * as coredataTimestampToDate from './utilities/coredata-timestamp-to-date.js';
import * as hexdumpExtractText from './utilities/hexdump-extract-text.js';
import * as sqliteJulianToDate from './utilities/sqlite-julian-to-date.js';
import * as timestampType from './utilities/timestamp-type.js';
import * as unixMicrosToDate from './utilities/unix-micros-to-date.js';
import * as unixMillisToDate from './utilities/unix-millis-to-date.js';
import * as unixNanosToDate from './utilities/unix-nanos-to-date.js';
import * as unixSecondsToDate from './utilities/unix-seconds-to-date.js';
import * as webkitTimestampToDate from './utilities/webkit-timestamp-to-date.js';
import * as weekOfTheYear from './utilities/week-of-the-year.js';
import * as windowsFiletimeToDate from './utilities/windows-filetime-to-date.js';

const modules = {
  'coredata-timestamp-to-date.js': coredataTimestampToDate,
  'hexdump-extract-text.js': hexdumpExtractText,
  'sqlite-julian-to-date.js': sqliteJulianToDate,
  'timestamp-type.js': timestampType,
  'unix-micros-to-date.js': unixMicrosToDate,
  'unix-millis-to-date.js': unixMillisToDate,
  'unix-nanos-to-date.js': unixNanosToDate,
  'unix-seconds-to-date.js': unixSecondsToDate,
  'webkit-timestamp-to-date.js': webkitTimestampToDate,
  'week-of-the-year.js': weekOfTheYear,
  'windows-filetime-to-date.js': windowsFiletimeToDate,
};

export const INPUT_TYPES = ['string', 'lines', 'both'];
export const RESULT_TYPES = ['string', 'lines'];
export const DESCRIPTION_MAX = 25;

/** Throws a descriptive Error if `meta` breaks the registry contract. Returns `meta`. */
export function validate(meta, file) {
  const fail = (msg) => { throw new Error(`Utility ${file}: ${msg}`); };
  if (!meta || typeof meta !== 'object') fail('has no meta export');
  for (const key of ['name', 'description', 'category']) {
    if (typeof meta[key] !== 'string' || meta[key].trim() === '') fail(`meta.${key} must be a non-empty string`);
  }
  if (meta.description.length > DESCRIPTION_MAX) {
    fail(`meta.description is ${meta.description.length} chars, max ${DESCRIPTION_MAX}`);
  }
  if (typeof meta.fn !== 'function') fail('meta.fn must be a function');
  if (!INPUT_TYPES.includes(meta.inputType)) fail(`meta.inputType must be one of ${INPUT_TYPES.join(', ')}`);
  if (!RESULT_TYPES.includes(meta.resultType)) fail(`meta.resultType must be one of ${RESULT_TYPES.join(', ')}`);
  if (typeof meta.quick !== 'boolean') fail('meta.quick must be a boolean');
  if (meta.quick && (meta.inputType !== 'string' || meta.resultType !== 'string')) {
    fail('quick utilities must be string → string');
  }
  if (meta.quickPlaceholder !== undefined && (typeof meta.quickPlaceholder !== 'string' || meta.quickPlaceholder === '')) {
    fail('meta.quickPlaceholder must be a string when set');
  }
  return meta;
}

/** Validates every module's meta and returns them sorted by category, then name. */
export function buildRegistry(mods) {
  const list = [];
  const seen = new Set();
  for (const [file, mod] of Object.entries(mods)) {
    const meta = validate(mod?.meta, file);
    if (seen.has(meta.name)) throw new Error(`Utility ${file}: duplicate name "${meta.name}"`);
    seen.add(meta.name);
    list.push(meta);
  }
  return list.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
}

export const utilities = buildRegistry(modules);
export const quickUtilities = utilities.filter((u) => u.quick);
