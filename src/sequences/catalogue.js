/**
 * Everything runnable: the static registry plus every saved sequence,
 * composed and sorted by the registry's rule. Rebuilt whenever the store
 * changes, and listeners are told so views can refresh.
 */
import { compare } from '../registry.js';
import { composeSequence } from './compose.js';

export function createCatalogue({ utilities, utilitiesByFile, store }) {
  const listeners = new Set();
  const build = () => [...utilities, ...store.list().map((s) => composeSequence(s, utilitiesByFile))].sort(compare);
  let all = build();

  store.onChange(() => {
    all = build();
    for (const fn of listeners) fn();
  });

  return {
    all: () => [...all],
    quick: () => all.filter((u) => u.quick),
    onChange(fn) { listeners.add(fn); },
  };
}
