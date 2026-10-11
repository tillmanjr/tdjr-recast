import { describe, it, expect } from 'vitest';
import { trimEnd, meta } from '../../src/utilities/trim-end.js';

describe('trimEnd', () => {
  it('removes trailing spaces and tabs from every line, leaving the start alone', () => {
    expect(trimEnd(['a  ', 'b\t', '  c \t ', 'd'])).toEqual(['a', 'b', '  c', 'd']);
  });

  it('keeps blank lines as empty strings', () => {
    expect(trimEnd(['   ', '', 'x'])).toEqual(['', '', 'x']);
  });
});

describe('meta', () => {
  it('declares a lines → lines utility in the text category', () => {
    expect(meta).toMatchObject({ name: 'Trim end', category: 'text', inputType: 'lines', resultType: 'lines', quick: false });
    expect(meta.fn).toBe(trimEnd);
    expect(meta.description.length).toBeLessThanOrEqual(25);
  });
});
