import { describe, it, expect } from 'vitest';
import { toDelimited, fromDelimited } from '../../src/lib/delimited.js';

describe('toDelimited', () => {
  it('writes a header from the union of keys, in first-seen order, and blanks missing values', () => {
    expect(toDelimited('[{"a":1,"b":"x"},{"a":null,"c":true}]', ',')).toBe('a,b,c\n1,x,\n,,true');
  });

  it('quotes cells containing the delimiter, quotes or line breaks, doubling inner quotes', () => {
    expect(toDelimited('[{"a":"x,y","b":"say \\"hi\\"","c":"l1\\nl2","d":"r\\rn"}]', ','))
      .toBe('a,b,c,d\n"x,y","say ""hi""","l1\nl2","r\rn"');
  });

  it('uses the given delimiter and only quotes for that delimiter', () => {
    expect(toDelimited('[{"a":"x,y","b":"p\\tq"}]', '\t')).toBe('a\tb\nx,y\t"p\tq"');
  });

  it('serialises nested objects and arrays as JSON inside the cell', () => {
    expect(toDelimited('[{"a":{"b":1},"c":[1,2]}]', ',')).toBe('a,c\n"{""b"":1}","[1,2]"');
  });

  it('treats a single object as one row', () => {
    expect(toDelimited('{"a":1,"b":2}', ',')).toBe('a,b\n1,2');
  });

  it('writes an array of arrays as plain rows with no header', () => {
    expect(toDelimited('[[1,"q,r"],[true,null]]', ',')).toBe('1,"q,r"\ntrue,');
  });

  it('returns an empty string for an empty array', () => {
    expect(toDelimited('[]', ',')).toBe('');
  });

  it('rejects invalid JSON with the parser message', () => {
    expect(() => toDelimited('{nope', ',')).toThrow(/^Invalid JSON: /);
  });

  it('rejects shapes it cannot tabulate', () => {
    const msg = 'Expected a JSON array of objects or arrays';
    expect(() => toDelimited('42', ',')).toThrow(msg);
    expect(() => toDelimited('"text"', ',')).toThrow(msg);
    expect(() => toDelimited('null', ',')).toThrow(msg);
    expect(() => toDelimited('[1,2]', ',')).toThrow(msg);
    expect(() => toDelimited('[{"a":1},[1]]', ',')).toThrow(msg);
    expect(() => toDelimited('[[1],{"a":1}]', ',')).toThrow(msg);
  });
});

describe('fromDelimited', () => {
  const parse = (text, d = ',') => JSON.parse(fromDelimited(text, d));

  it('turns the header row into keys and every later row into an object of strings', () => {
    expect(parse('a,b\n1,2\n3,4')).toEqual([{ a: '1', b: '2' }, { a: '3', b: '4' }]);
  });

  it('pretty-prints with two-space indentation', () => {
    expect(fromDelimited('a\n1', ',')).toBe('[\n  {\n    "a": "1"\n  }\n]');
  });

  it('accepts CRLF, LF and lone CR line ends and ignores a trailing line break', () => {
    expect(parse('a,b\r\n1,2\r\n')).toEqual([{ a: '1', b: '2' }]);
    expect(parse('a,b\n1,2\n')).toEqual([{ a: '1', b: '2' }]);
    expect(parse('a,b\r1,2')).toEqual([{ a: '1', b: '2' }]);
    expect(parse('a\r\n"x"\r\n')).toEqual([{ a: 'x' }]);
  });

  it('skips blank lines between rows', () => {
    expect(parse('a,b\n\n1,2\n\n')).toEqual([{ a: '1', b: '2' }]);
  });

  it('handles quoted fields with delimiters, doubled quotes and line breaks inside', () => {
    expect(parse('a,b\n"x,y","say ""hi"""\n"l1\nl2",z')).toEqual([{ a: 'x,y', b: 'say "hi"' }, { a: 'l1\nl2', b: 'z' }]);
  });

  it('uses the given delimiter', () => {
    expect(parse('a\tb\n1,5\tx', '\t')).toEqual([{ a: '1,5', b: 'x' }]);
  });

  it('fills missing trailing fields with empty strings', () => {
    expect(parse('a,b,c\n1')).toEqual([{ a: '1', b: '', c: '' }]);
  });

  it('keeps empty fields, including a trailing one', () => {
    expect(parse('a,b,c\n,,')).toEqual([{ a: '', b: '', c: '' }]);
  });

  it('returns an empty array for a header with no rows', () => {
    expect(parse('a,b')).toEqual([]);
  });

  it('rejects a row with more fields than the header', () => {
    expect(() => fromDelimited('a,b\n1,2,3', ',')).toThrow('Row 2 has 3 fields, header has 2');
  });

  it('rejects an unterminated quoted field', () => {
    expect(() => fromDelimited('a\n"open', ',')).toThrow('Unterminated quoted field starting on line 2');
  });

  it('rejects text following a closing quote', () => {
    expect(() => fromDelimited('a\n"x"y', ',')).toThrow('Unexpected text after closing quote on line 2');
  });

  it('rejects empty input', () => {
    expect(() => fromDelimited('', ',')).toThrow('No header row');
    expect(() => fromDelimited('\n', ',')).toThrow('No header row');
  });
});
