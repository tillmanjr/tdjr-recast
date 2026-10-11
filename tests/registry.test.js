import { describe, it, expect } from 'vitest';
import { validate, buildRegistry, utilities, quickUtilities, DESCRIPTION_MAX } from '../src/registry.js';

const good = () => ({
  name: 'upper', description: 'Uppercase', category: 'text',
  fn: (s) => s.toUpperCase(), inputType: 'string', resultType: 'string', quick: true,
});

describe('validate', () => {
  it('accepts a complete meta and returns it', () => {
    const m = good();
    expect(validate(m, 'upper.js')).toBe(m);
  });

  it.each([
    ['name', ''], ['description', ''], ['category', ' '],
  ])('rejects empty %s', (key, value) => {
    expect(() => validate({ ...good(), [key]: value }, 'f.js')).toThrow(`Utility f.js: meta.${key} must be a non-empty string`);
  });

  it('rejects a description longer than DESCRIPTION_MAX', () => {
    const description = 'x'.repeat(DESCRIPTION_MAX + 1);
    expect(() => validate({ ...good(), description }, 'f.js')).toThrow(/description is 26 chars, max 25/);
  });

  it('rejects a non-function fn', () => {
    expect(() => validate({ ...good(), fn: 'nope' }, 'f.js')).toThrow(/meta.fn must be a function/);
  });

  it('rejects unknown inputType and resultType', () => {
    expect(() => validate({ ...good(), inputType: 'array' }, 'f.js')).toThrow(/meta.inputType must be one of string, lines, both/);
    expect(() => validate({ ...good(), resultType: 'both' }, 'f.js')).toThrow(/meta.resultType must be one of string, lines/);
  });

  it('accepts an optional quickPlaceholder string and rejects other types', () => {
    const m = { ...good(), quickPlaceholder: 'year, month, day' };
    expect(validate(m, 'upper.js')).toBe(m);
    expect(() => validate({ ...good(), quickPlaceholder: 42 }, 'upper.js')).toThrow('Utility upper.js: meta.quickPlaceholder must be a string when set');
    expect(() => validate({ ...good(), quickPlaceholder: '' }, 'upper.js')).toThrow('Utility upper.js: meta.quickPlaceholder must be a string when set');
  });

  it('rejects a non-boolean quick', () => {
    expect(() => validate({ ...good(), quick: 'yes' }, 'f.js')).toThrow(/meta.quick must be a boolean/);
  });

  it('rejects quick utilities that are not string → string', () => {
    expect(() => validate({ ...good(), inputType: 'lines' }, 'f.js')).toThrow(/quick utilities must be string → string/);
    expect(() => validate({ ...good(), resultType: 'lines' }, 'f.js')).toThrow(/quick utilities must be string → string/);
  });

  it('rejects a module with no meta export', () => {
    expect(() => validate(undefined, 'f.js')).toThrow('Utility f.js: has no meta export');
    expect(() => validate('not an object', 'f.js')).toThrow('Utility f.js: has no meta export');
  });

  it('rejects a non-string name', () => {
    expect(() => validate({ ...good(), name: 42 }, 'f.js')).toThrow(/meta.name must be a non-empty string/);
  });

  it('accepts an optional numeric sortOrder and rejects other values', () => {
    const m = { ...good(), sortOrder: 2 };
    expect(validate(m, 'upper.js')).toBe(m);
    expect(validate({ ...good(), sortOrder: -1.5 }, 'upper.js').sortOrder).toBe(-1.5);
    for (const bad of ['1', NaN, Infinity, null, true]) {
      expect(() => validate({ ...good(), sortOrder: bad }, 'upper.js')).toThrow('Utility upper.js: meta.sortOrder must be a finite number when set');
    }
  });
});

describe('buildRegistry', () => {
  it('sorts by category then name', () => {
    const reg = buildRegistry({
      'c.js': { meta: { ...good(), name: 'zeta', category: 'hex' } },
      'a.js': { meta: { ...good(), name: 'beta', category: 'text' } },
      'b.js': { meta: { ...good(), name: 'alpha', category: 'text' } },
    });
    expect(reg.map((m) => m.name)).toEqual(['zeta', 'alpha', 'beta']);
  });

  it('puts utilities with a sortOrder first within their category, lowest number first', () => {
    const reg = buildRegistry({
      'a.js': { meta: { ...good(), name: 'alpha', category: 'text' } },
      'b.js': { meta: { ...good(), name: 'beta', category: 'text', sortOrder: 10 } },
      'c.js': { meta: { ...good(), name: 'gamma', category: 'text', sortOrder: 1 } },
      'd.js': { meta: { ...good(), name: 'delta', category: 'text' } },
      'e.js': { meta: { ...good(), name: 'omega', category: 'hex', sortOrder: 99 } },
    });
    expect(reg.map((m) => m.name)).toEqual(['omega', 'gamma', 'beta', 'alpha', 'delta']);
  });

  it('breaks a sortOrder tie by name', () => {
    const reg = buildRegistry({
      'a.js': { meta: { ...good(), name: 'beta', category: 'text', sortOrder: 1 } },
      'b.js': { meta: { ...good(), name: 'alpha', category: 'text', sortOrder: 1 } },
    });
    expect(reg.map((m) => m.name)).toEqual(['alpha', 'beta']);
  });

  it('rejects duplicate names, naming the second file', () => {
    expect(() => buildRegistry({
      'a.js': { meta: good() },
      'b.js': { meta: good() },
    })).toThrow('Utility b.js: duplicate name "upper"');
  });

  it('rejects a module value that is not an object', () => {
    expect(() => buildRegistry({ 'a.js': undefined })).toThrow('Utility a.js: has no meta export');
  });
});

describe('real registry', () => {
  it('lists every utility by category then name, and all but hexdump as quick', () => {
    const all = [
      'CSV → JSON',
      'JSON → CSV',
      'JSON → TSV',
      'Swap pair',
      'TSV → JSON',
      'date → week of the year',
      'hexdump → text',
      'Strip single periods',
      'timestamp → type', // sortOrder: 0 lifts it above the alphabetical rest
      'Chrome/WebKit → date',
      'CoreData → date',
      'SQLite Julian → date',
      'unix ms → date',
      'unix ns → date',
      'unix seconds → date',
      'unix µs → date',
      'Windows FILETIME → date',
      'Base64 decode',
      'Base64 encode',
      'URL decode',
      'URL encode',
    ];
    const notQuick = ['CSV → JSON', 'JSON → CSV', 'JSON → TSV', 'TSV → JSON', 'hexdump → text', 'Strip single periods', 'Base64 decode', 'Base64 encode'];
    expect(utilities.map((u) => u.name)).toEqual(all);
    expect(quickUtilities.map((u) => u.name)).toEqual(all.filter((n) => !notQuick.includes(n)));
  });
});
