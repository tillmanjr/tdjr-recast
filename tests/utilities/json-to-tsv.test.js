import { describe, it, expect } from 'vitest';
import { jsonToTsv, meta } from '../../src/utilities/json-to-tsv.js';

describe('jsonToTsv', () => {
  it('tabulates an array of objects with tabs, leaving commas unquoted', () => {
    expect(jsonToTsv('[{"a":1,"b":"x,y"},{"a":2,"b":"p\\tq"}]')).toBe('a\tb\n1\tx,y\n2\t"p\tq"');
  });

  it('reports invalid JSON', () => {
    expect(() => jsonToTsv('[')).toThrow(/^Invalid JSON: /);
  });
});

describe('meta', () => {
  it('declares a string → string utility in the data category', () => {
    expect(meta).toMatchObject({ name: 'JSON → TSV', category: 'data', inputType: 'string', resultType: 'string', quick: false });
    expect(meta.fn).toBe(jsonToTsv);
    expect(meta.description.length).toBeLessThanOrEqual(25);
    expect(meta.quickPlaceholder).toBeUndefined();
  });
});
