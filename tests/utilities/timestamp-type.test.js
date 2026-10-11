import { describe, it, expect } from 'vitest';
import { timestampType, meta } from '../../src/utilities/timestamp-type.js';

describe('timestampType', () => {
  it.each([
    ['2460000', 'SQLite (Julian Day)'],
    ['700000000', 'CoreData (seconds since 2001)'],
    ['1700000000', 'Unix (seconds)'],
    ['1700000000123', 'Unix (milliseconds)'],
    ['1700000000123456', 'Unix (microseconds)'],
    ['13300000000000000', 'Google Chrome / WebKit (µs since 1601)'],
    ['132000000000000000', 'Windows FILETIME (100ns since 1601)'],
    ['1700000000123456789', 'Unix (nanoseconds)'],
  ])('%s → %s', (input, type) => {
    expect(timestampType(input)).toBe(type);
  });

  it('throws when no type has that many digits', () => {
    expect(() => timestampType('17000000001')).toThrow('No known timestamp type has 11 digits');
  });

  it('throws on non-digit input', () => {
    expect(() => timestampType('now')).toThrow('Expected a string of digits');
  });
});

describe('meta', () => {
  it('declares a quick timestamp utility with an example placeholder', () => {
    expect(meta).toMatchObject({ name: 'timestamp → type', category: 'timestamp', inputType: 'string', resultType: 'string', quick: true });
    expect(meta.fn).toBe(timestampType);
    expect(meta.description.length).toBeLessThanOrEqual(25);
    expect(timestampType(meta.quickPlaceholder)).toBe('Unix (seconds)');
  });
});
