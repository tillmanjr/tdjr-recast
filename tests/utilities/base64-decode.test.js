import { describe, it, expect } from 'vitest';
import { base64Decode, meta } from '../../src/utilities/base64-decode.js';

describe('base64Decode', () => {
  it('decodes to UTF-8 text', () => {
    expect(base64Decode('aGVsbG8=')).toBe('hello');
    expect(base64Decode('aMOpbGxv')).toBe('héllo');
    expect(base64Decode('')).toBe('');
  });

  it('tolerates missing padding, whitespace and line wrapping', () => {
    expect(base64Decode('aGVsbG8')).toBe('hello');
    expect(base64Decode('  aGVs\nbG8=  ')).toBe('hello');
  });

  it('accepts the URL-safe alphabet', () => {
    expect(base64Decode('Pz8_')).toBe('???');
    expect(base64Decode('Pz8/')).toBe('???');
  });

  it('throws on characters outside the alphabet or an impossible length', () => {
    expect(() => base64Decode('!!!!')).toThrow('Not valid base64');
    expect(() => base64Decode('a')).toThrow('Not valid base64');
  });

  it('throws when the bytes are not UTF-8 text', () => {
    expect(() => base64Decode('+/8=')).toThrow('Decoded bytes are not valid UTF-8 text');
  });
});

describe('meta', () => {
  it('declares a string → string utility in the web category', () => {
    expect(meta).toMatchObject({ name: 'Base64 decode', category: 'web', inputType: 'string', resultType: 'string', quick: false });
    expect(meta.fn).toBe(base64Decode);
    expect(meta.description.length).toBeLessThanOrEqual(25);
    expect(meta.quickPlaceholder).toBeUndefined();
  });
});
