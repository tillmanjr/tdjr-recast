// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { createSequenceStore, STORAGE_KEY } from '../../src/sequences/store.js';

const utilitiesByFile = new Map([
  ['upper.js', { name: 'upper', inputType: 'string' }],
  ['count.js', { name: 'count', inputType: 'both' }],
]);

function memoryStorage(initial = {}) {
  const data = { ...initial };
  return { getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = String(v); }, data };
}

const setup = (initial) => {
  const storage = memoryStorage(initial);
  return { storage, store: createSequenceStore({ storage, utilitiesByFile }) };
};

describe('createSequenceStore', () => {
  it('starts empty and persists a saved sequence under the storage key', () => {
    const { storage, store } = setup();
    expect(store.list()).toEqual([]);
    const saved = store.save({ name: ' Tidy ', quick: true, steps: [{ utility: 'upper.js' }, { utility: 'count.js', splitLines: true }] });
    expect(saved).toEqual({ name: 'Tidy', quick: true, steps: [{ utility: 'upper.js' }, { utility: 'count.js', splitLines: true }] });
    expect(JSON.parse(storage.data[STORAGE_KEY])).toEqual([saved]);
    expect(store.list()).toEqual([saved]);
  });

  it('loads what was stored, dropping entries that no longer validate', () => {
    const stored = [
      { name: 'Good', quick: false, steps: [{ utility: 'upper.js' }] },
      { name: 'Gone', quick: false, steps: [{ utility: 'deleted.js' }] },
      { name: '', steps: [{ utility: 'upper.js' }] },
      'junk',
    ];
    const { store } = setup({ [STORAGE_KEY]: JSON.stringify(stored) });
    expect(store.list().map((s) => s.name)).toEqual(['Good']);
  });

  it('treats unreadable or malformed storage as empty', () => {
    expect(setup({ [STORAGE_KEY]: '{not json' }).store.list()).toEqual([]);
    expect(setup({ [STORAGE_KEY]: '{"a":1}' }).store.list()).toEqual([]);
    const throwing = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
    const store = createSequenceStore({ storage: throwing, utilitiesByFile });
    expect(store.list()).toEqual([]);
    expect(() => store.save({ name: 'x', steps: [{ utility: 'upper.js' }] })).not.toThrow();
    expect(store.list()).toHaveLength(1);
  });

  it('normalises quick to a boolean and drops splitLines unless true', () => {
    const { store } = setup();
    const saved = store.save({ name: 'n', steps: [{ utility: 'upper.js', splitLines: false }, { utility: 'count.js', splitLines: 1 }] });
    expect(saved.quick).toBe(false);
    expect(saved.steps).toEqual([{ utility: 'upper.js' }, { utility: 'count.js', splitLines: true }]);
  });

  it('rejects a missing name, a duplicate name, no steps and unknown utilities', () => {
    const { store } = setup();
    store.save({ name: 'Taken', steps: [{ utility: 'upper.js' }] });
    expect(() => store.save({ name: '  ', steps: [{ utility: 'upper.js' }] })).toThrow('Name is required');
    expect(() => store.save({ name: 'Taken', steps: [{ utility: 'upper.js' }] })).toThrow('A sequence named "Taken" already exists');
    expect(() => store.save({ name: 'Empty', steps: [] })).toThrow('Add at least one step');
    expect(() => store.save({ name: 'NoSteps' })).toThrow('Add at least one step');
    expect(() => store.save({ name: 'Null', steps: [null] })).toThrow('Step 1: unknown utility "undefined"');
    expect(() => store.save({ name: 'Bad', steps: [{ utility: 'upper.js' }, { utility: 'nope.js' }] })).toThrow('Step 2: unknown utility "nope.js"');
    expect(store.list()).toHaveLength(1);
  });

  it('save with replace overwrites that sequence in place, even under a new name', () => {
    const { store } = setup();
    store.save({ name: 'A', steps: [{ utility: 'upper.js' }] });
    store.save({ name: 'B', steps: [{ utility: 'upper.js' }] });
    store.save({ name: 'A2', quick: true, steps: [{ utility: 'count.js' }] }, { replace: 'A' });
    expect(store.list().map((s) => s.name)).toEqual(['A2', 'B']);
    expect(store.get('A2').quick).toBe(true);
    expect(store.get('A')).toBeUndefined();
    store.save({ name: 'B', steps: [{ utility: 'count.js' }] }, { replace: 'B' });
    expect(store.get('B').steps).toEqual([{ utility: 'count.js' }]);
    expect(() => store.save({ name: 'B', steps: [{ utility: 'upper.js' }] }, { replace: 'A2' })).toThrow('A sequence named "B" already exists');
  });

  it('remove deletes by name and ignores unknown names', () => {
    const { storage, store } = setup();
    store.save({ name: 'A', steps: [{ utility: 'upper.js' }] });
    store.remove('A');
    store.remove('never');
    expect(store.list()).toEqual([]);
    expect(JSON.parse(storage.data[STORAGE_KEY])).toEqual([]);
  });

  it('notifies listeners on save and remove, and hands out copies', () => {
    const { store } = setup();
    const seen = vi.fn();
    store.onChange(seen);
    store.save({ name: 'A', steps: [{ utility: 'upper.js' }] });
    store.remove('A');
    expect(seen).toHaveBeenCalledTimes(2);
    store.save({ name: 'C', steps: [{ utility: 'upper.js' }] });
    store.list()[0].name = 'tampered';
    store.get('C').steps.push('x');
    expect(store.get('C')).toEqual({ name: 'C', quick: false, steps: [{ utility: 'upper.js' }] });
  });

  it('defaults to localStorage', () => {
    localStorage.removeItem(STORAGE_KEY);
    const store = createSequenceStore({ utilitiesByFile });
    store.save({ name: 'L', steps: [{ utility: 'upper.js' }] });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toHaveLength(1);
    localStorage.removeItem(STORAGE_KEY);
  });
});
