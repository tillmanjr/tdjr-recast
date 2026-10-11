import { describe, it, expect } from 'vitest';
import { base64Encode, meta } from '../../src/utilities/base64-encode.js';

describe('base64Encode', () => {
  it('encodes the UTF-8 bytes of the text', () => {
    expect(base64Encode('hello')).toBe('aGVsbG8=');
    expect(base64Encode('héllo')).toBe('aMOpbGxv');
    expect(base64Encode('')).toBe('');
  });

  it('copes with long input', () => {
    const long = 'x'.repeat(200000);
    expect(base64Encode(long)).toHaveLength(Math.ceil(200000 / 3) * 4);
  });
});

describe('meta', () => {
  it('declares a string → string utility in the web category', () => {
    expect(meta).toMatchObject({ name: 'Base64 encode', category: 'web', inputType: 'string', resultType: 'string', quick: false });
    expect(meta.fn).toBe(base64Encode);
    expect(meta.description.length).toBeLessThanOrEqual(25);
    expect(meta.quickPlaceholder).toBeUndefined();
  });
});
