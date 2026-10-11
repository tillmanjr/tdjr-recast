import { describe, it, expect } from 'vitest';
import { swapPair, meta } from '../../src/utilities/swap-pair.js';

describe('swapPair', () => {
  it('swaps around a tab, a space or a comma, keeping that separator', () => {
    expect(swapPair('a\tb')).toBe('b\ta');
    expect(swapPair('12 34')).toBe('34 12');
    expect(swapPair('12,34')).toBe('34,12');
  });

  it('detects in the order tab, space, comma', () => {
    expect(swapPair('a b\tc,d')).toBe('c,d\ta b');
    expect(swapPair('1, 2')).toBe('2 1,');
  });

  it('trims each piece and the whole input', () => {
    expect(swapPair(' 12,34 ')).toBe('34,12');
    expect(swapPair('12   34')).toBe('34 12');
    expect(swapPair('x\t\ty\n')).toBe('y\tx');
  });

  it('splits at the first occurrence of the separator', () => {
    expect(swapPair('1 2 3')).toBe('2 3 1');
    expect(swapPair('a,b,c')).toBe('b,c,a');
  });

  it('works for non-numeric pieces', () => {
    expect(swapPair('last,first')).toBe('first,last');
  });

  it('throws when none of the separators is present', () => {
    expect(() => swapPair('nope')).toThrow('No tab, space or comma to split on');
    expect(() => swapPair('')).toThrow('No tab, space or comma to split on');
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
