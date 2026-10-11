/**
 * Shared timestamp arithmetic for the timestamp utilities.
 *
 * Every type is a count of some unit since some epoch. Values are handled as
 * BigInt nanoseconds since the Unix epoch so 19-digit inputs stay exact, and
 * are formatted as ISO 8601 UTC with as many fraction digits as the unit has.
 *
 * Type detection goes by the number of digits in the integer part. The digit
 * bands reflect modern dates (roughly 1970–2100 for 1970-based types, 2001–2032
 * for CoreData) and do overlap in theory: a 10-digit value is read as Unix
 * seconds rather than CoreData 2032+, and a 7-digit value as a Julian Day
 * rather than CoreData's first months of 2001.
 */

const NS_PER_SECOND = 1_000_000_000n;
const NS_PER_DAY = 86_400n * NS_PER_SECOND;
const SECONDS_1601_TO_1970 = 11_644_473_600n;
const SECONDS_1970_TO_2001 = 978_307_200n;
const JULIAN_DAY_1970 = 2_440_588n; // noon on 1970-01-01 is JD 2440588.0; midnight is 2440587.5

/** Count of 10^k units since an epoch given in seconds before/after 1970. k = fraction digits per second. */
const unit = (k, epochOffsetSeconds = 0n) => ({
  precision: k,
  toNanos: ({ int, frac }) => {
    const nsPerUnit = 10n ** BigInt(9 - k);
    const subUnit = BigInt((frac + '0'.repeat(9 - k)).slice(0, 9 - k) || '0');
    return int * nsPerUnit + subUnit - epochOffsetSeconds * NS_PER_SECOND;
  },
  fractionDigits: (frac) => Math.min(9, k + frac.length),
});

export const TYPES = [
  {
    key: 'julian', name: 'SQLite (Julian Day)', digits: [7], example: '2460000.5',
    precision: 0,
    toNanos: ({ int, frac }) => {
      const dayFraction = Number('0.' + (frac || '0')) * 86_400e9;
      return (int - JULIAN_DAY_1970) * NS_PER_DAY + 43_200n * NS_PER_SECOND + BigInt(Math.round(dayFraction));
    },
    fractionDigits: () => 0,
  },
  { key: 'coredata', name: 'CoreData (seconds since 2001)', digits: [1, 2, 3, 4, 5, 6, 8, 9], example: '700000000', ...unit(0, -SECONDS_1970_TO_2001) },
  { key: 'unix-s', name: 'Unix (seconds)', digits: [10], example: '1700000000', ...unit(0) },
  { key: 'unix-ms', name: 'Unix (milliseconds)', digits: [12, 13], example: '1700000000123', ...unit(3) },
  { key: 'unix-us', name: 'Unix (microseconds)', digits: [15, 16], example: '1700000000123456', ...unit(6) },
  { key: 'webkit', name: 'Google Chrome / WebKit (µs since 1601)', digits: [17], example: '13300000000000000', ...unit(6, SECONDS_1601_TO_1970) },
  { key: 'filetime', name: 'Windows FILETIME (100ns since 1601)', digits: [18], example: '132000000000000000', ...unit(7, SECONDS_1601_TO_1970) },
  { key: 'unix-ns', name: 'Unix (nanoseconds)', digits: [19], example: '1700000000123456789', ...unit(9) },
];

const FORMAT = /^(\d+)(?:\.(\d+))?$/;

/** "1700000000.25" → { int: 1700000000n, frac: '25' }. Throws on anything else. */
export function parseTimestamp(input) {
  const m = FORMAT.exec(input.trim());
  if (!m) throw new Error('Expected a string of digits, e.g. "1700000000"');
  return { int: BigInt(m[1]), frac: m[2] ?? '' };
}

/** The TYPES entry whose digit band contains the integer part of `input`. */
export function detectType(input) {
  const { int } = parseTimestamp(input);
  const digits = int.toString().length;
  const type = TYPES.find((t) => t.digits.includes(digits));
  if (!type) throw new Error(`No known timestamp type has ${digits} digits`);
  return type;
}

/** Convert `input`, read as the type with `key`, to an ISO 8601 UTC string. */
export function convert(key, input) {
  const type = TYPES.find((t) => t.key === key);
  if (!type) throw new Error(`Unknown timestamp type "${key}"`);
  const parsed = parseTimestamp(input);
  const nanos = type.toNanos(parsed);
  const digits = type.fractionDigits(parsed.frac);
  return formatUtc(nanos, digits, () => `${type.name}: ${input.trim()} is out of range`);
}

function formatUtc(nanos, fractionDigits, outOfRange) {
  let seconds = nanos / NS_PER_SECOND;
  let rest = nanos - seconds * NS_PER_SECOND;
  if (rest < 0n) { seconds -= 1n; rest += NS_PER_SECOND; }
  let iso;
  try {
    iso = new Date(Number(seconds) * 1000).toISOString();
  } catch {
    throw new Error(outOfRange());
  }
  const base = iso.slice(0, -5); // drop ".000Z"
  if (fractionDigits === 0) return `${base}Z`;
  return `${base}.${rest.toString().padStart(9, '0').slice(0, fractionDigits)}Z`;
}
