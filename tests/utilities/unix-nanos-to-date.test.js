import { describe, it, expect } from 'vitest';
import { unixNanosToDate, meta } from '../../src/utilities/unix-nanos-to-date.js';

describe('unixNanosToDate', () => {
  it('converts 1700000000123456789 to UTC', () => {
    expect(unixNanosToDate('1700000000123456789')).toBe('2023-11-14T22:13:20.123456789Z');
  });

  it('throws on non-digit input', () => {
    expect(() => unixNanosToDate('later')).toThrow('Expected a string of digits');
  });
});

describe('meta', () => {
  it('declares a quick timestamp utility with an example placeholder', () => {
    expect(meta).toMatchObject({ name: 'unix ns → date', category: 'timestamp', inputType: 'string', resultType: 'string', quick: true });
    expect(meta.fn).toBe(unixNanosToDate);
    expect(meta.description.length).toBeLessThanOrEqual(25);
    expect(meta.quickPlaceholder).toMatch(/^\d+(\.\d+)?$/);
    expect(unixNanosToDate(meta.quickPlaceholder)).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
