import { describe, it, expect } from 'vitest';
import { unixSecondsToDate, meta } from '../../src/utilities/unix-seconds-to-date.js';

describe('unixSecondsToDate', () => {
  it('converts 1700000000 to UTC', () => {
    expect(unixSecondsToDate('1700000000')).toBe('2023-11-14T22:13:20Z');
  });

  it('throws on non-digit input', () => {
    expect(() => unixSecondsToDate('later')).toThrow('Expected a string of digits');
  });
});

describe('meta', () => {
  it('declares a quick timestamp utility with an example placeholder', () => {
    expect(meta).toMatchObject({ name: 'unix seconds → date', category: 'timestamp', inputType: 'string', resultType: 'string', quick: true });
    expect(meta.fn).toBe(unixSecondsToDate);
    expect(meta.description.length).toBeLessThanOrEqual(25);
    expect(meta.quickPlaceholder).toMatch(/^\d+(\.\d+)?$/);
    expect(unixSecondsToDate(meta.quickPlaceholder)).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
