import { describe, it, expect } from 'vitest';
import { jsonToCsv, meta } from '../../src/utilities/json-to-csv.js';

describe('jsonToCsv', () => {
  it('tabulates an array of objects with a comma', () => {
    expect(jsonToCsv('[{"a":1,"b":"x,y"},{"a":2}]')).toBe('a,b\n1,"x,y"\n2,');
  });

  it('reports invalid JSON', () => {
    expect(() => jsonToCsv('[')).toThrow(/^Invalid JSON: /);
  });
});

describe('meta', () => {
  it('declares a string → string utility in the data category', () => {
    expect(meta).toMatchObject({ name: 'JSON → CSV', category: 'data', inputType: 'string', resultType: 'string', quick: false });
    expect(meta.fn).toBe(jsonToCsv);
    expect(meta.description.length).toBeLessThanOrEqual(25);
    expect(meta.quickPlaceholder).toBeUndefined();
  });
});
