import { describe, it, expect } from 'vitest';
import { webkitTimestampToDate, meta } from '../../src/utilities/webkit-timestamp-to-date.js';

describe('webkitTimestampToDate', () => {
  it('converts 13300000000000000 to UTC', () => {
    expect(webkitTimestampToDate('13300000000000000')).toBe('2022-06-18T04:26:40.000000Z');
  });

  it('throws on non-digit input', () => {
    expect(() => webkitTimestampToDate('later')).toThrow('Expected a string of digits');
  });
});

describe('meta', () => {
  it('declares a quick timestamp utility with an example placeholder', () => {
    expect(meta).toMatchObject({ name: 'Chrome/WebKit → date', category: 'timestamp', inputType: 'string', resultType: 'string', quick: true });
    expect(meta.fn).toBe(webkitTimestampToDate);
    expect(meta.description.length).toBeLessThanOrEqual(25);
    expect(meta.quickPlaceholder).toMatch(/^\d+(\.\d+)?$/);
    expect(webkitTimestampToDate(meta.quickPlaceholder)).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
