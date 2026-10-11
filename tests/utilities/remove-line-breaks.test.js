import { describe, it, expect } from 'vitest';
import { removeLineBreaks, meta } from '../../src/utilities/remove-line-breaks.js';

describe('removeLineBreaks', () => {
  it('joins the lines with nothing between them, whatever the line ending', () => {
    expect(removeLineBreaks('a\r\nb\nc\rd')).toBe('abcd');
  });

  it('drops a trailing line break too', () => {
    expect(removeLineBreaks('a,\nb,\nc\n')).toBe('a,b,c');
  });

  it('leaves spaces and other text untouched', () => {
    expect(removeLineBreaks('a b\n c')).toBe('a b c');
    expect(removeLineBreaks('no breaks')).toBe('no breaks');
  });
});

describe('meta', () => {
  it('declares a string → string utility in the text category', () => {
    expect(meta).toMatchObject({ name: 'Remove line breaks', category: 'text', inputType: 'string', resultType: 'string', quick: false });
    expect(meta.fn).toBe(removeLineBreaks);
    expect(meta.description.length).toBeLessThanOrEqual(25);
  });
});
