import { describe, it, expect } from 'vitest';
import { urlEncode, meta } from '../../src/utilities/url-encode.js';

describe('urlEncode', () => {
  it('percent-encodes everything encodeURIComponent does, including UTF-8 and line breaks', () => {
    expect(urlEncode('a b&c=d/é?')).toBe('a%20b%26c%3Dd%2F%C3%A9%3F');
    expect(urlEncode('l1\nl2')).toBe('l1%0Al2');
  });

  it('leaves unreserved characters alone', () => {
    expect(urlEncode("AZaz09-_.!~*'()")).toBe("AZaz09-_.!~*'()");
  });
});

describe('meta', () => {
  it('declares a quick string → string utility in the web category', () => {
    expect(meta).toMatchObject({ name: 'URL encode', category: 'web', inputType: 'string', resultType: 'string', quick: true });
    expect(meta.fn).toBe(urlEncode);
    expect(meta.description.length).toBeLessThanOrEqual(25);
    expect(meta.quickPlaceholder).toBe('a b&c=d');
  });
});
