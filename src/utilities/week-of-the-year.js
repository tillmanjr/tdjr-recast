/**
 * weekOfTheYear — the week number of a calendar date.
 *
 * Accepts: a single string "year, month, day", e.g. "2026, 01, 31" (4-digit year)
 * Returns: the week number as a string, "1" to "53"
 *
 * Rule: week 1 is the week that contains Jan 1, and weeks start on Monday,
 * so the number increments every Monday. (This is not ISO 8601, where the
 * first days of January can belong to week 52/53 of the previous year.)
 */

const WEEK_START = 1; // 0: Sunday, 1: Monday
const ONE_DAY = 24 * 60 * 60 * 1000;
const FORMAT = /^(\d{4})\s*,\s*(\d{1,2})\s*,\s*(\d{1,2})$/;

/**
 * @param {string} input   "year, month, day"
 * @param {object} [opts]  reserved for meta.args
 * @returns {string}
 */
export function weekOfTheYear(input, {} = {}) {
  const text = input.trim();
  const m = FORMAT.exec(text);
  if (!m) throw new Error('Expected "year, month, day", e.g. "2026, 01, 31"');
  const [year, month, day] = m.slice(1).map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth) throw new Error(`Not a valid date: ${text}`);
  return String(weekNumber(year, month, day));
}

function weekNumber(year, month, day) {
  const jan1 = new Date(year, 0, 1);
  const daysBeforeJan1 = (jan1.getDay() - WEEK_START + 7) % 7; // how far week 1 reaches back into December
  const week1Start = new Date(year, 0, 1 - daysBeforeJan1);
  const date = new Date(year, month - 1, day);
  const days = Math.round((date - week1Start) / ONE_DAY); // round absorbs the DST hour
  return Math.floor(days / 7) + 1;
}

export const meta = {
  name: 'date → week of the year',
  description: 'Week number of y, m, d',
  category: 'date',
  fn: weekOfTheYear,
  inputType: 'string',
  resultType: 'string',
  quick: true,
  quickPlaceholder: 'year, month, day',
};

export default weekOfTheYear;
