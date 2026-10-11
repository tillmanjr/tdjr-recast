import { describe, it, expect } from 'vitest';
import { tsvToJson, meta } from '../../src/utilities/tsv-to-json.js';

describe('tsvToJson', () => {
  it('parses tab-separated rows under a header into pretty JSON', () => {
    expect(JSON.parse(tsvToJson('a\tb\n1,5\tx\n'))).toEqual([{ a: '1,5', b: 'x' }]);
  });

  it('reports a row that is wider than the header', () => {
    expect(() => tsvToJson('a\n1\t2')).toThrow('Row 2 has 2 fields, header has 1');
  });
});

describe('meta', () => {
  it('declares a string → string utility in the data category', () => {
    expect(meta).toMatchObject({ name: 'TSV → JSON', category: 'data', inputType: 'string', resultType: 'string', quick: false });
    expect(meta.fn).toBe(tsvToJson);
    expect(meta.description.length).toBeLessThanOrEqual(25);
    expect(meta.quickPlaceholder).toBeUndefined();
  });
});
