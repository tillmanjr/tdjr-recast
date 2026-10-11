import { describe, it, expect } from 'vitest';
import { csvToJson, meta } from '../../src/utilities/csv-to-json.js';

describe('csvToJson', () => {
  it('parses comma-separated rows under a header into pretty JSON', () => {
    expect(JSON.parse(csvToJson('a,b\n1,"x,y"\n'))).toEqual([{ a: '1', b: 'x,y' }]);
    expect(csvToJson('a\n1')).toBe('[\n  {\n    "a": "1"\n  }\n]');
  });

  it('reports a row that is wider than the header', () => {
    expect(() => csvToJson('a\n1,2')).toThrow('Row 2 has 2 fields, header has 1');
  });
});

describe('meta', () => {
  it('declares a string → string utility in the data category', () => {
    expect(meta).toMatchObject({ name: 'CSV → JSON', category: 'data', inputType: 'string', resultType: 'string', quick: false });
    expect(meta.fn).toBe(csvToJson);
    expect(meta.description.length).toBeLessThanOrEqual(25);
    expect(meta.quickPlaceholder).toBeUndefined();
  });
});
