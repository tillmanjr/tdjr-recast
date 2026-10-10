// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { createThemeToggle } from '../../src/ui/theme.js';

function memoryStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
    data,
  };
}

function setup({ stored, systemPrefersDark = false, storage = memoryStorage(stored ? { theme: stored } : {}) } = {}) {
  const root = document.createElement('div');
  const toggle = createThemeToggle({ root, storage, systemPrefersDark });
  return { root, storage, toggle, btn: toggle.el };
}

describe('createThemeToggle', () => {
  it('follows the system preference when nothing is stored', () => {
    expect(setup({ systemPrefersDark: false }).root.dataset.theme).toBe('light');
    expect(setup({ systemPrefersDark: true }).root.dataset.theme).toBe('dark');
  });

  it('prefers a stored choice over the system preference', () => {
    expect(setup({ stored: 'dark', systemPrefersDark: false }).root.dataset.theme).toBe('dark');
    expect(setup({ stored: 'light', systemPrefersDark: true }).root.dataset.theme).toBe('light');
  });

  it('ignores an unknown stored value', () => {
    expect(setup({ stored: 'blue', systemPrefersDark: true }).root.dataset.theme).toBe('dark');
  });

  it('renders a button that names the mode it switches to', () => {
    const { btn } = setup({ systemPrefersDark: false });
    expect(btn.className).toBe('btn-theme');
    expect(btn.textContent).toBe('☾');
    expect(btn.title).toBe('Switch to dark mode');
    const dark = setup({ systemPrefersDark: true }).btn;
    expect(dark.textContent).toBe('☀');
    expect(dark.title).toBe('Switch to light mode');
  });

  it('click toggles the theme, updates the button and remembers the choice', () => {
    const { root, storage, toggle, btn } = setup({ systemPrefersDark: false });
    btn.click();
    expect(root.dataset.theme).toBe('dark');
    expect(toggle.current()).toBe('dark');
    expect(btn.textContent).toBe('☀');
    expect(storage.data.theme).toBe('dark');
    btn.click();
    expect(root.dataset.theme).toBe('light');
    expect(storage.data.theme).toBe('light');
  });

  it('still works when storage is unavailable', () => {
    const storage = { getItem: vi.fn(() => { throw new Error('blocked'); }), setItem: vi.fn(() => { throw new Error('blocked'); }) };
    const { root, btn } = setup({ storage, systemPrefersDark: true });
    expect(root.dataset.theme).toBe('dark');
    btn.click();
    expect(root.dataset.theme).toBe('light');
  });

  it('defaults to the document root, localStorage and the prefers-color-scheme query', () => {
    localStorage.removeItem('theme');
    window.matchMedia = vi.fn((q) => ({ matches: q === '(prefers-color-scheme: dark)' }));
    const toggle = createThemeToggle();
    expect(document.documentElement.dataset.theme).toBe('dark');
    toggle.el.click();
    expect(localStorage.getItem('theme')).toBe('light');
    localStorage.removeItem('theme');
  });

  it('treats a missing matchMedia as a light preference', () => {
    delete window.matchMedia;
    createThemeToggle();
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});
