import { describe, it, expect } from 'vitest';
import { trimEndingComma, meta } from '../../src/utilities/trim-ending-comma.js';

describe('trimEndingComma', () => {
  it('removes one comma from the end of each line that has one', () => {
    expect(trimEndingComma(['a,', 'b', 'c,,', ','])).toEqual(['a', 'b', 'c,', '']);
  });

  it('still removes the comma when trailing blanks follow it, keeping the blanks', () => {
    expect(trimEndingComma(['a, ', 'b,\t'])).toEqual(['a ', 'b\t']);
  });

  it('leaves commas elsewhere in the line alone', () => {
    expect(trimEndingComma(['a, b', 'x,y,z'])).toEqual(['a, b', 'x,y,z']);
  });
});

describe('meta', () => {
  it('declares a lines → lines utility in the text category', () => {
    expect(meta).toMatchObject({ name: 'Trim ending comma', category: 'text', inputType: 'lines', resultType: 'lines', quick: false });
    expect(meta.fn).toBe(trimEndingComma);
    expect(meta.description.length).toBeLessThanOrEqual(25);
  });
});
