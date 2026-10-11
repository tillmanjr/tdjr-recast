import { describe, it, expect } from 'vitest';
import { urlDecode, meta } from '../../src/utilities/url-decode.js';

describe('urlDecode', () => {
  it('decodes percent-escapes including multi-byte UTF-8', () => {
    expect(urlDecode('a%20b%26c%3Dd%2F%C3%A9%3F')).toBe('a b&c=d/é?');
  });

  it('leaves + alone, since it only means space in form encoding', () => {
    expect(urlDecode('a+b')).toBe('a+b');
  });

  it('throws on a malformed escape', () => {
    expect(() => urlDecode('%E0%A4%A')).toThrow('Not a valid URL-encoded string');
    expect(() => urlDecode('%ZZ')).toThrow('Not a valid URL-encoded string');
  });
});

describe('meta', () => {
  it('declares a quick string → string utility in the web category', () => {
    expect(meta).toMatchObject({ name: 'URL decode', category: 'web', inputType: 'string', resultType: 'string', quick: true });
    expect(meta.fn).toBe(urlDecode);
    expect(meta.description.length).toBeLessThanOrEqual(25);
    expect(meta.quickPlaceholder).toBe('a%20b%26c%3Dd');
  });
});
