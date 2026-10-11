import { describe, it, expect } from 'vitest';
import { swapPair, meta } from '../../src/utilities/swap-pair.js';

describe('swapPair', () => {
  it('swaps around a single tab, space or comma, keeping that separator', () => {
    expect(swapPair('a\tb')).toBe('b\ta');
    expect(swapPair('12 34')).toBe('34 12');
    expect(swapPair('12,34')).toBe('34,12');
  });

  it('trims whitespace off the ends of a longer separator', () => {
    expect(swapPair('1, 2')).toBe('2,1');
    expect(swapPair('1 ,2')).toBe('2,1');
    expect(swapPair('1 , 2')).toBe('2,1');
    expect(swapPair('a ,\t, b')).toBe('b,\t,a');
  });

  it('collapses a whitespace-only run to a single one of its character', () => {
    expect(swapPair('12   34')).toBe('34 12');
    expect(swapPair('x\t\ty')).toBe('y\tx');
  });

  it('uses the first run of separator characters; the rest belongs to the right-hand side', () => {
    expect(swapPair('1 2 3')).toBe('2 3 1');
    expect(swapPair('a,b,c')).toBe('b,c,a');
    expect(swapPair('a b\tc,d')).toBe('b\tc,d a');
  });

  it('ignores whitespace around the whole input', () => {
    expect(swapPair('  12,34 \n')).toBe('34,12');
  });

  it('works for non-numeric pieces', () => {
    expect(swapPair('last, first')).toBe('first,last');
  });

  it('throws unless there is something on both sides of a separator', () => {
    const msg = 'Expected two pieces separated by tabs, spaces or commas';
    expect(() => swapPair('nope')).toThrow(msg);
    expect(() => swapPair('')).toThrow(msg);
    expect(() => swapPair(', 2')).toThrow(msg);
    expect(() => swapPair('1,')).toThrow(msg);
  });
});

describe('meta', () => {
  it('declares a quick string → string utility in the data category', () => {
    expect(meta).toMatchObject({ name: 'Swap pair', category: 'data', inputType: 'string', resultType: 'string', quick: true });
    expect(meta.fn).toBe(swapPair);
    expect(meta.description.length).toBeLessThanOrEqual(25);
    expect(swapPair(meta.quickPlaceholder)).toBe('34,12');
  });
});
