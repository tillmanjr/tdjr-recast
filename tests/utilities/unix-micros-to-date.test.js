import { describe, it, expect } from 'vitest';
import { unixMicrosToDate, meta } from '../../src/utilities/unix-micros-to-date.js';

describe('unixMicrosToDate', () => {
  it('converts 1700000000123456 to UTC', () => {
    expect(unixMicrosToDate('1700000000123456')).toBe('2023-11-14T22:13:20.123456Z');
  });

  it('throws on non-digit input', () => {
    expect(() => unixMicrosToDate('later')).toThrow('Expected a string of digits');
  });
});

describe('meta', () => {
  it('declares a quick timestamp utility with an example placeholder', () => {
    expect(meta).toMatchObject({ name: 'unix µs → date', category: 'timestamp', inputType: 'string', resultType: 'string', quick: true });
    expect(meta.fn).toBe(unixMicrosToDate);
    expect(meta.description.length).toBeLessThanOrEqual(25);
    expect(meta.quickPlaceholder).toMatch(/^\d+(\.\d+)?$/);
    expect(unixMicrosToDate(meta.quickPlaceholder)).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
