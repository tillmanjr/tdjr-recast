import { describe, it, expect } from 'vitest';
import { sqliteJulianToDate, meta } from '../../src/utilities/sqlite-julian-to-date.js';

describe('sqliteJulianToDate', () => {
  it('converts 2451545 to UTC', () => {
    expect(sqliteJulianToDate('2451545')).toBe('2000-01-01T12:00:00Z');
  });

  it('throws on non-digit input', () => {
    expect(() => sqliteJulianToDate('later')).toThrow('Expected a string of digits');
  });
});

describe('meta', () => {
  it('declares a quick timestamp utility with an example placeholder', () => {
    expect(meta).toMatchObject({ name: 'SQLite Julian → date', category: 'timestamp', inputType: 'string', resultType: 'string', quick: true });
    expect(meta.fn).toBe(sqliteJulianToDate);
    expect(meta.description.length).toBeLessThanOrEqual(25);
    expect(meta.quickPlaceholder).toMatch(/^\d+(\.\d+)?$/);
    expect(sqliteJulianToDate(meta.quickPlaceholder)).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
