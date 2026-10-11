import { describe, it, expect, vi } from 'vitest';
import { createCatalogue } from '../../src/sequences/catalogue.js';

const upper = { name: 'upper', category: 'text', fn: (s) => s.toUpperCase(), inputType: 'string', resultType: 'string', quick: true };
const lower = { name: 'lower', category: 'text', fn: (s) => s.toLowerCase(), inputType: 'string', resultType: 'string', quick: false };
const utilities = [lower, upper];
const utilitiesByFile = new Map([['upper.js', upper], ['lower.js', lower]]);

function fakeStore(initial = []) {
  let sequences = initial;
  const listeners = new Set();
  return {
    list: () => sequences,
    onChange: (fn) => listeners.add(fn),
    set(next) { sequences = next; for (const fn of listeners) fn(); },
  };
}

describe('createCatalogue', () => {
  it('lists the static utilities plus composed sequences, sorted by the registry rule', () => {
    const store = fakeStore([{ name: 'Shout', quick: true, steps: [{ utility: 'upper.js' }] }]);
    const cat = createCatalogue({ utilities, utilitiesByFile, store });
    expect(cat.all().map((u) => `${u.category}:${u.name}`)).toEqual(['sequence:Shout', 'text:lower', 'text:upper']);
    expect(cat.all().find((u) => u.name === 'Shout').fn('hi')).toBe('HI');
  });

  it('quick() keeps only quick entries, sequences included', () => {
    const store = fakeStore([
      { name: 'Shout', quick: true, steps: [{ utility: 'upper.js' }] },
      { name: 'Hush', quick: false, steps: [{ utility: 'lower.js' }] },
    ]);
    const cat = createCatalogue({ utilities, utilitiesByFile, store });
    expect(cat.quick().map((u) => u.name)).toEqual(['Shout', 'upper']);
  });

  it('rebuilds when the store changes and tells listeners', () => {
    const store = fakeStore();
    const cat = createCatalogue({ utilities, utilitiesByFile, store });
    const seen = vi.fn();
    cat.onChange(seen);
    expect(cat.all()).toHaveLength(2);
    store.set([{ name: 'New', quick: false, steps: [{ utility: 'lower.js' }] }]);
    expect(seen).toHaveBeenCalledTimes(1);
    expect(cat.all().map((u) => u.name)).toEqual(['New', 'lower', 'upper']);
  });

  it('hands out a fresh array each time', () => {
    const cat = createCatalogue({ utilities, utilitiesByFile, store: fakeStore() });
    cat.all().push('x');
    expect(cat.all()).toHaveLength(2);
  });
});
