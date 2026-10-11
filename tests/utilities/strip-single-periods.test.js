import { describe, it, expect } from 'vitest';
import { stripSinglePeriods, meta } from '../../src/utilities/strip-single-periods.js';

describe('stripSinglePeriods', () => {
  it('removes a lone period', () => {
    expect(stripSinglePeriods('a.b')).toBe('ab');
    expect(stripSinglePeriods('end.')).toBe('end');
    expect(stripSinglePeriods('.start')).toBe('start');
  });

  it('halves a run of periods, rounding down', () => {
    expect(stripSinglePeriods('a..b')).toBe('a.b');
    expect(stripSinglePeriods('a...b')).toBe('a.b');
    expect(stripSinglePeriods('a....b')).toBe('a..b');
    expect(stripSinglePeriods('a.....b')).toBe('a..b');
    expect(stripSinglePeriods('a......b')).toBe('a...b');
  });

  it('treats each run independently across the whole text, line breaks included', () => {
    expect(stripSinglePeriods('x.y..z...w')).toBe('xy.z.w');
    expect(stripSinglePeriods('l1.\nl2..\n')).toBe('l1\nl2.\n');
  });

  it('leaves text without periods alone', () => {
    expect(stripSinglePeriods('no dots here')).toBe('no dots here');
    expect(stripSinglePeriods('')).toBe('');
  });
});

describe('meta', () => {
  it('declares a string → string utility in the text category', () => {
    expect(meta).toMatchObject({ name: 'Strip single periods', category: 'text', inputType: 'string', resultType: 'string', quick: false });
    expect(meta.fn).toBe(stripSinglePeriods);
    expect(meta.description.length).toBeLessThanOrEqual(25);
  });
});
