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
      'date → week of the year',
      'hexdump → text',
      'Chrome/WebKit → date',
      'CoreData → date',
      'SQLite Julian → date',
      'timestamp → type',
      'unix ms → date',
      'unix ns → date',
      'unix seconds → date',
      'unix µs → date',
      'Windows FILETIME → date',
    ];
    expect(utilities.map((u) => u.name)).toEqual(all);
    expect(quickUtilities.map((u) => u.name)).toEqual(all.filter((n) => n !== 'hexdump → text'));
  });
});
