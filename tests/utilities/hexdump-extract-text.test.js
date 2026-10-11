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

describe('hexdumpExtractText encodings', () => {
  it('detects UTF-16BE when zero bytes sit on even offsets', () => {
    expect(hexdumpExtractText('007b0022')).toBe('{"');
  });

  it('skips a UTF-16BE byte order mark', () => {
    expect(hexdumpExtractText('feff0041')).toBe('A');
  });

  it('skips a UTF-16LE byte order mark', () => {
    expect(hexdumpExtractText('fffe4100')).toBe('A');
  });

  it('honours an explicit encoding and widens the bracket for code points above 0xFF', () => {
    expect(hexdumpExtractText('0b20', { encoding: 'utf16le' })).toBe('<0x200B>');
  });

  it('reports a trailing odd byte in UTF-16 input', () => {
    expect(hexdumpExtractText('41', { encoding: 'utf16le' })).toBe('<trailing 0x41>');
  });

  it('combines a surrogate pair into one code point', () => {
    expect(hexdumpExtractText('3dd800de', { encoding: 'utf16le' })).toBe('😀');
  });

  it('brackets a high surrogate with nothing after it', () => {
    expect(hexdumpExtractText('3dd8', { encoding: 'utf16le' })).toBe('<0xD83D>');
  });

  it('brackets a high surrogate followed by a non-low-surrogate unit', () => {
    expect(hexdumpExtractText('3dd84100', { encoding: 'utf16le' })).toBe('<0xD83D>A');
    expect(hexdumpExtractText('3dd800e0', { encoding: 'utf16le' })).toBe('<0xD83D><0xE000>');
  });

  it('brackets a lone low surrogate', () => {
    expect(hexdumpExtractText('00dc', { encoding: 'utf16le' })).toBe('<0xDC00>');
  });
});

describe('hexdumpExtractText dotted input', () => {
  it('keeps the odd lane when the dots are on the even positions', () => {
    expect(hexdumpExtractText('.a.b.c')).toBe('abc');
  });

  it('rejects text that is not dot-interleaved', () => {
    expect(() => hexdumpExtractText('hello')).toThrow('Input is not a uniformly dot-interleaved string');
  });
});

describe('hexdumpExtractText dump layouts', () => {
  it('reads hexdump -C rows with a |gutter|', () => {
    expect(hexdumpExtractText('00000000  68 65 6c 6c 6f  |hello|')).toBe('hello');
  });

  it('reads xxd rows with 4-char word groups', () => {
    expect(hexdumpExtractText('00000000: 6865 6c6c 6f                             hello')).toBe('hello');
  });

  it('reads rows with 8-char word groups and no gutter', () => {
    expect(hexdumpExtractText('00000000: 68656c6c 6f')).toBe('hello');
  });

  it('reads rows with no gutter at all', () => {
    expect(hexdumpExtractText('0000: 41 42 43')).toBe('ABC');
  });

  it('treats a gutter-less dump with plain offsets as bare hex, offset included (known limitation)', () => {
    expect(hexdumpExtractText('0000  41 42 43')).toBe('<0x00><0x00>ABC');
  });

  it('falls back to every hex token when the gutter does not verify any prefix', () => {
    expect(hexdumpExtractText('0000  41 42  zz')).toBe('AB');
  });

  it('skips blank lines and a trailing bare offset line', () => {
    expect(hexdumpExtractText('0000: 41 42\n\n0010: 43 44')).toBe('ABCD');
    expect(hexdumpExtractText('0000: 41 42\n0002:')).toBe('AB');
  });

  it("rejects a '*' repeat marker", () => {
    expect(() => hexdumpExtractText('0000: 41 42\n*\n0010: 43 44')).toThrow("Dump contains a '*' repeat marker; regenerate it with hexdump -v");
  });
});

describe('meta', () => {
  it('declares a string → string utility that is not on the Quick tab', () => {
    expect(meta).toMatchObject({
      name: 'hexdump → text',
      category: 'hex',
      inputType: 'string',
      resultType: 'string',
      quick: false,
    });
    expect(meta.fn).toBe(hexdumpExtractText);
    expect(meta.description.length).toBeLessThanOrEqual(25);
  });
});
