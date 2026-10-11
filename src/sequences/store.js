/**
 * Saved sequences: validation plus persistence as JSON in localStorage.
 *
 * A sequence is { name, quick, steps: [{ utility: '<file key>', splitLines? }] }.
 * Steps refer to utilities by registry file name, the one id that does not
 * change when a display name is tweaked.
 */
export const STORAGE_KEY = 'sequences';

export function createSequenceStore({ storage = globalThis.localStorage, utilitiesByFile }) {
  const listeners = new Set();
  let sequences = load();

  function load() {
    try {
      const parsed = JSON.parse(storage.getItem(STORAGE_KEY) ?? '[]');
      if (!Array.isArray(parsed)) return [];
      return parsed.flatMap((entry) => {
        try { return [normalise(entry, [])]; } catch { return []; }
      });
    } catch {
      return [];
    }
  }

  function persist() {
    try { storage.setItem(STORAGE_KEY, JSON.stringify(sequences)); } catch { /* storage unavailable: keep in memory */ }
    for (const fn of listeners) fn();
  }

  /** Validates and returns a clean copy; `taken` lists names that may not be reused. */
  function normalise(seq, taken) {
    const name = typeof seq?.name === 'string' ? seq.name.trim() : '';
    if (name === '') throw new Error('Name is required');
    if (taken.includes(name)) throw new Error(`A sequence named "${name}" already exists`);
    const steps = Array.isArray(seq.steps) ? seq.steps : [];
    if (steps.length === 0) throw new Error('Add at least one step');
    const clean = steps.map((step, i) => {
      const utility = step?.utility;
      if (!utilitiesByFile.has(utility)) throw new Error(`Step ${i + 1}: unknown utility "${utility}"`);
      return step.splitLines ? { utility, splitLines: true } : { utility };
    });
    return { name, quick: seq.quick === true, steps: clean };
  }

  const copy = (seq) => structuredClone(seq);

  return {
    list: () => sequences.map(copy),
    get: (name) => { const s = sequences.find((x) => x.name === name); return s && copy(s); },
    save(seq, { replace } = {}) {
      const taken = sequences.filter((s) => s.name !== replace).map((s) => s.name);
      const clean = normalise(seq, taken);
      const at = sequences.findIndex((s) => s.name === replace);
      if (at >= 0) sequences[at] = clean;
      else sequences.push(clean);
      persist();
      return copy(clean);
    },
    remove(name) {
      const before = sequences.length;
      sequences = sequences.filter((s) => s.name !== name);
      if (sequences.length !== before) persist();
    },
    onChange(fn) { listeners.add(fn); },
  };
}
