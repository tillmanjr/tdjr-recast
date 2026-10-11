import { describe, it, expect } from 'vitest';
import { windowsFiletimeToDate, meta } from '../../src/utilities/windows-filetime-to-date.js';

describe('windowsFiletimeToDate', () => {
  it('converts 132000000000000000 to UTC', () => {
    expect(windowsFiletimeToDate('132000000000000000')).toBe('2019-04-17T18:40:00.0000000Z');
  });

  it('throws on non-digit input', () => {
    expect(() => windowsFiletimeToDate('later')).toThrow('Expected a string of digits');
  });
});

describe('meta', () => {
  it('declares a quick timestamp utility with an example placeholder', () => {
    expect(meta).toMatchObject({ name: 'Windows FILETIME → date', category: 'timestamp', inputType: 'string', resultType: 'string', quick: true });
    expect(meta.fn).toBe(windowsFiletimeToDate);
    expect(meta.description.length).toBeLessThanOrEqual(25);
    expect(meta.quickPlaceholder).toMatch(/^\d+(\.\d+)?$/);
    expect(windowsFiletimeToDate(meta.quickPlaceholder)).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
