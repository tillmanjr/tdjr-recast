import { describe, it, expect } from 'vitest';
import { weekOfTheYear, meta } from '../../src/utilities/week-of-the-year.js';

// Rule under test: week 1 is the week that contains Jan 1; weeks start on Monday.
describe('weekOfTheYear', () => {
  it('converts Jan 01 to 1', () => {
    expect(weekOfTheYear('2026, 01, 01')).toBe('1');
  });

  it('keeps the first partial week as week 1 through its Sunday (2026 starts on a Thursday)', () => {
    expect(weekOfTheYear('2026, 01, 04')).toBe('1');
    expect(weekOfTheYear('2026, 01, 05')).toBe('2');
  });

  it('counts a full first week when the year starts on a Monday (2024)', () => {
    expect(weekOfTheYear('2024, 01, 01')).toBe('1');
    expect(weekOfTheYear('2024, 01, 07')).toBe('1');
    expect(weekOfTheYear('2024, 01, 08')).toBe('2');
    expect(weekOfTheYear('2024, 02, 29')).toBe('9');
  });

  it('treats a Sunday Jan 1 as the tail of week 1 (2023)', () => {
    expect(weekOfTheYear('2023, 01, 01')).toBe('1');
    expect(weekOfTheYear('2023, 01, 02')).toBe('2');
  });

  it('reaches week 53 at the end of the year', () => {
    expect(weekOfTheYear('2026, 12, 31')).toBe('53');
    expect(weekOfTheYear('2024, 12, 31')).toBe('53');
  });

  it('is not thrown off by the daylight-saving switch', () => {
    expect(weekOfTheYear('2026, 03, 08')).toBe('10');
    expect(weekOfTheYear('2026, 03, 09')).toBe('11');
  });

  it('accepts unpadded numbers and loose spacing', () => {
    expect(weekOfTheYear('2026,1,5')).toBe('2');
    expect(weekOfTheYear('  2026 , 01 , 05  ')).toBe('2');
  });

  it('rejects input that is not "year, month, day"', () => {
    const msg = 'Expected "year, month, day", e.g. "2026, 01, 31"';
    expect(() => weekOfTheYear('hello')).toThrow(msg);
    expect(() => weekOfTheYear('2026-01-05')).toThrow(msg);
    expect(() => weekOfTheYear('26, 1, 1')).toThrow(msg);
    expect(() => weekOfTheYear('')).toThrow(msg);
  });

  it('rejects dates that do not exist', () => {
    expect(() => weekOfTheYear('2026, 13, 01')).toThrow('Not a valid date: 2026, 13, 01');
    expect(() => weekOfTheYear('2026, 0, 1')).toThrow('Not a valid date: 2026, 0, 1');
    expect(() => weekOfTheYear('2026, 1, 0')).toThrow('Not a valid date: 2026, 1, 0');
    expect(() => weekOfTheYear('2026, 02, 29')).toThrow('Not a valid date: 2026, 02, 29');
  });
});

describe('meta', () => {
  it('declares a quick string → string utility in the date category', () => {
    expect(meta).toMatchObject({
      name: 'date → week of the year',
      category: 'date',
      inputType: 'string',
      resultType: 'string',
      quick: true,
    });
    expect(meta.fn).toBe(weekOfTheYear);
    expect(meta.description.length).toBeLessThanOrEqual(25);
  });
});
