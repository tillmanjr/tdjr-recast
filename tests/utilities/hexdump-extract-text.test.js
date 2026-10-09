import { describe, it, expect } from 'vitest';
import { hexdumpExtractText, meta } from '../../src/utilities/hexdump-extract-text.js';

describe('hexdumpExtractText', () => {
  it('decodes a hex-viewer dump row from the hex column, not the gutter', () => {
    const dump = '0000  7b 00 22 00 6d 00 73 00 67 00 73 00 22 00 3a 00  {.".m.s.g.s.".:.';
    expect(hexdumpExtractText(dump)).toBe('{"msgs":');
  });

  it('decodes bare UTF-16LE hex', () => {
    expect(hexdumpExtractText('7b0022006d0073006700730022003a00')).toBe('{"msgs":');
  });

  it('decodes bare UTF-8 hex when there are no zero bytes', () => {
    expect(hexdumpExtractText('68656c6c6f')).toBe('hello');
  });

  it('inlines non-printable code points as <0xNN>', () => {
    expect(hexdumpExtractText('680a')).toBe('h<0x0A>');
  });

  it('decodes dot-interleaved gutter text', () => {
    expect(hexdumpExtractText('{.".m.s.g.s.".:.')).toBe('{"msgs":');
  });

  it('throws on odd hex length', () => {
    expect(() => hexdumpExtractText('abc')).toThrow('Odd hex length (3)');
  });
});

describe('meta', () => {
  it('declares a quick string → string utility', () => {
    expect(meta).toMatchObject({
      name: 'hexdump → text',
      category: 'hex',
      inputType: 'string',
      resultType: 'string',
      quick: true,
    });
    expect(meta.fn).toBe(hexdumpExtractText);
    expect(meta.description.length).toBeLessThanOrEqual(25);
  });
});
