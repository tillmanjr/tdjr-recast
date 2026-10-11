import { describe, it, expect } from 'vitest';
import { coredataTimestampToDate, meta } from '../../src/utilities/coredata-timestamp-to-date.js';

describe('coredataTimestampToDate', () => {
  it('converts 700000000 to UTC', () => {
    expect(coredataTimestampToDate('700000000')).toBe('2023-03-08T20:26:40Z');
  });

  it('throws on non-digit input', () => {
    expect(() => coredataTimestampToDate('later')).toThrow('Expected a string of digits');
  });
});

describe('meta', () => {
  it('declares a quick timestamp utility with an example placeholder', () => {
    expect(meta).toMatchObject({ name: 'CoreData → date', category: 'timestamp', inputType: 'string', resultType: 'string', quick: true });
    expect(meta.fn).toBe(coredataTimestampToDate);
    expect(meta.description.length).toBeLessThanOrEqual(25);
    expect(meta.quickPlaceholder).toMatch(/^\d+(\.\d+)?$/);
    expect(coredataTimestampToDate(meta.quickPlaceholder)).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
