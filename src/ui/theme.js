/**
 * Light/dark theme toggle. Sets data-theme="light"|"dark" on the root element;
 * the stylesheet switches its colour variables on that attribute.
 * The choice is remembered in storage; with nothing stored, the system preference wins.
 */
const KEY = 'theme';
const THEMES = ['light', 'dark'];

export function createThemeToggle({
  root = document.documentElement,
  storage = globalThis.localStorage,
  systemPrefersDark = globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false,
} = {}) {
  const el = document.createElement('button');
  el.className = 'btn-theme';

  let theme = readStored(storage) ?? (systemPrefersDark ? 'dark' : 'light');

  function apply() {
    root.dataset.theme = theme;
    const next = theme === 'dark' ? 'light' : 'dark';
    el.textContent = theme === 'dark' ? '☀' : '☾';
    el.title = `Switch to ${next} mode`;
  }

  el.addEventListener('click', () => {
    theme = theme === 'dark' ? 'light' : 'dark';
    try { storage.setItem(KEY, theme); } catch { /* storage unavailable: still switch for this session */ }
    apply();
  });

  apply();
  return { el, current: () => theme };
}

function readStored(storage) {
  try {
    const v = storage.getItem(KEY);
    return THEMES.includes(v) ? v : null;
  } catch {
    return null;
  }
}
