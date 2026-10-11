import { describe, it, expect } from 'vitest';
import { unixMillisToDate, meta } from '../../src/utilities/unix-millis-to-date.js';

describe('unixMillisToDate', () => {
  it('converts 1700000000123 to UTC', () => {
    expect(unixMillisToDate('1700000000123')).toBe('2023-11-14T22:13:20.123Z');
  });

  it('throws on non-digit input', () => {
    expect(() => unixMillisToDate('later')).toThrow('Expected a string of digits');
  });
});

describe('meta', () => {
  it('declares a quick timestamp utility with an example placeholder', () => {
    expect(meta).toMatchObject({ name: 'unix ms → date', category: 'timestamp', inputType: 'string', resultType: 'string', quick: true });
    expect(meta.fn).toBe(unixMillisToDate);
    expect(meta.description.length).toBeLessThanOrEqual(25);
    expect(meta.quickPlaceholder).toMatch(/^\d+(\.\d+)?$/);
    expect(unixMillisToDate(meta.quickPlaceholder)).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
