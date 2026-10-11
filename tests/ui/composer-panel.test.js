// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { createComposerPanel } from '../../src/ui/composer-panel.js';
import { createSequenceStore } from '../../src/sequences/store.js';

const upper = { name: 'upper', description: 'Uppercase', category: 'text', fn: (s) => s.toUpperCase(), inputType: 'string', resultType: 'string', quick: true };
const trim = { name: 'trim lines', description: 'Trim', category: 'text', fn: (lines) => lines.map((l) => l.trim()), inputType: 'lines', resultType: 'lines', quick: false };
const count = { name: 'count', description: 'Count', category: 'lines', fn: (x) => (Array.isArray(x) ? `${x.length} lines` : `${x.length} chars`), inputType: 'both', resultType: 'string', quick: false };
const boom = { name: 'boom', description: 'Throws', category: 'text', fn: () => { throw new Error('kaboom'); }, inputType: 'string', resultType: 'string', quick: false };
const utilities = [count, boom, trim, upper];
const utilitiesByFile = new Map([['count.js', count], ['boom.js', boom], ['trim.js', trim], ['upper.js', upper]]);

function memoryStorage() {
  const data = {};
  return { getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = String(v); } };
}

function setup(initial = []) {
  const store = createSequenceStore({ storage: memoryStorage(), utilitiesByFile });
  for (const s of initial) store.save(s);
  const panel = createComposerPanel({ utilities, utilitiesByFile, store });
  document.body.innerHTML = '';
  document.body.append(panel.el);
  const $ = (sel) => panel.el.querySelector(sel);
  const $$ = (sel) => [...panel.el.querySelectorAll(sel)];
  const steps = () => $$('.step');
  const choose = (li, file) => { li.querySelector('.step-select').value = file; li.querySelector('.step-select').dispatchEvent(new Event('change')); };
  const stepFiles = () => steps().map((li) => li.querySelector('.step-select').value);
  const savedNames = () => $$('.seq-item .seq-name').map((e) => e.textContent);
  return { store, panel, $, $$, steps, choose, stepFiles, savedNames };
}

describe('createComposerPanel: editor', () => {
  it('starts with an empty name, Quick off, one blank step and no saved sequences', () => {
    const { $, steps, stepFiles } = setup();
    expect($('.seq-name-input').value).toBe('');
    expect($('.chk-seq-quick').checked).toBe(false);
    expect(steps()).toHaveLength(1);
    expect(stepFiles()).toEqual(['']);
    expect($('.seq-empty').textContent).toBe('No sequences yet.');
  });

  it('offers the static utilities per step, grouped by category, keyed by file', () => {
    const { steps } = setup();
    const select = steps()[0].querySelector('.step-select');
    expect(select.options[0].value).toBe('');
    const groups = [...select.querySelectorAll('optgroup')].map((g) => [g.label, [...g.querySelectorAll('option')].map((o) => [o.value, o.textContent])]);
    expect(groups).toEqual([['lines', [['count.js', 'count']]], ['text', [['boom.js', 'boom'], ['trim.js', 'trim lines'], ['upper.js', 'upper']]]]);
  });

  it('shows a Split lines box only for utilities that accept both, and unticks it when hidden', () => {
    const { steps, choose } = setup();
    const li = steps()[0];
    const split = li.querySelector('.step-split');
    expect(split.hidden).toBe(true);
    choose(li, 'count.js');
    expect(split.hidden).toBe(false);
    li.querySelector('.chk-step-split').checked = true;
    choose(li, 'upper.js');
    expect(split.hidden).toBe(true);
    expect(li.querySelector('.chk-step-split').checked).toBe(false);
  });

  it('adds, reorders and removes steps', () => {
    const { $, steps, choose, stepFiles } = setup();
    $('.btn-step-add').click();
    $('.btn-step-add').click();
    expect(steps()).toHaveLength(3);
    choose(steps()[0], 'trim.js');
    choose(steps()[1], 'upper.js');
    choose(steps()[2], 'count.js');
    steps()[2].querySelector('.btn-step-up').click();
    expect(stepFiles()).toEqual(['trim.js', 'count.js', 'upper.js']);
    steps()[0].querySelector('.btn-step-down').click();
    expect(stepFiles()).toEqual(['count.js', 'trim.js', 'upper.js']);
    steps()[0].querySelector('.btn-step-up').click();
    steps()[2].querySelector('.btn-step-down').click();
    expect(stepFiles()).toEqual(['count.js', 'trim.js', 'upper.js']);
    steps()[1].querySelector('.btn-step-remove').click();
    expect(stepFiles()).toEqual(['count.js', 'upper.js']);
  });

  it('Try it runs the current steps without saving, on click or Ctrl+Enter', () => {
    const { $, store, steps, choose } = setup();
    choose(steps()[0], 'trim.js');
    $('.btn-step-add').click();
    choose(steps()[1], 'upper.js');
    $('.try-input').value = ' a \n b ';
    $('.btn-try').click();
    expect($('.try-output').value).toBe('A\nB');
    expect($('.try-output').classList.contains('error')).toBe(false);
    expect(store.list()).toEqual([]);
    $('.try-input').value = ' c ';
    $('.try-input').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect($('.try-output').value).toBe('A\nB');
    $('.try-input').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, bubbles: true }));
    expect($('.try-output').value).toBe('C');
  });

  it('Try it shows a failing step in red, and complains about a blank step', () => {
    const { $, steps, choose } = setup();
    choose(steps()[0], 'boom.js');
    $('.btn-try').click();
    expect($('.try-output').value).toBe('Step 1 (boom): kaboom');
    expect($('.try-output').classList.contains('error')).toBe(true);
    $('.btn-step-add').click();
    $('.btn-try').click();
    expect($('.try-output').value).toBe('Step 2: choose a utility');
  });
});

describe('createComposerPanel: saving and the list', () => {
  it('Save stores the sequence, reports it, and lists it with its step count and Quick marker', () => {
    const { $, $$, store, steps, choose, savedNames } = setup();
    $('.seq-name-input').value = ' Tidy ';
    $('.chk-seq-quick').checked = true;
    choose(steps()[0], 'count.js');
    steps()[0].querySelector('.chk-step-split').checked = true;
    $('.btn-step-add').click();
    choose(steps()[1], 'upper.js');
    $('.btn-seq-save').click();
    expect(store.list()).toEqual([{ name: 'Tidy', quick: true, steps: [{ utility: 'count.js', splitLines: true }, { utility: 'upper.js' }] }]);
    expect($('.composer-status').textContent).toBe('Saved "Tidy"');
    expect($('.composer-status').classList.contains('error')).toBe(false);
    expect(savedNames()).toEqual(['Tidy']);
    expect($$('.seq-item .seq-info')[0].textContent).toBe('2 steps · Quick');
    expect($('.seq-empty')).toBeNull();
  });

  it('Save reports validation problems and leaves the store alone', () => {
    const { $, store, steps, choose } = setup();
    $('.btn-seq-save').click();
    expect($('.composer-status').textContent).toBe('Name is required');
    expect($('.composer-status').classList.contains('error')).toBe(true);
    $('.seq-name-input').value = 'x';
    $('.btn-seq-save').click();
    expect($('.composer-status').textContent).toBe('Step 1: choose a utility');
    choose(steps()[0], 'upper.js');
    steps()[0].querySelector('.btn-step-remove').click();
    $('.btn-seq-save').click();
    expect($('.composer-status').textContent).toBe('Add at least one step');
    expect(store.list()).toEqual([]);
  });

  it('a saved sequence keeps being edited: saving again updates it rather than duplicating', () => {
    const { $, store, steps, choose } = setup();
    $('.seq-name-input').value = 'A';
    choose(steps()[0], 'upper.js');
    $('.btn-seq-save').click();
    $('.seq-name-input').value = 'A renamed';
    $('.btn-seq-save').click();
    expect(store.list().map((s) => s.name)).toEqual(['A renamed']);
  });

  it('Edit loads a saved sequence into the editor, Split lines flags included', () => {
    const { $, $$, stepFiles, steps } = setup([
      { name: 'One', quick: false, steps: [{ utility: 'upper.js' }] },
      { name: 'Two', quick: true, steps: [{ utility: 'count.js', splitLines: true }, { utility: 'trim.js' }] },
    ]);
    $$('.btn-seq-edit')[1].click();
    expect($('.seq-name-input').value).toBe('Two');
    expect($('.chk-seq-quick').checked).toBe(true);
    expect(stepFiles()).toEqual(['count.js', 'trim.js']);
    expect(steps()[0].querySelector('.chk-step-split').checked).toBe(true);
    expect(steps()[0].querySelector('.step-split').hidden).toBe(false);
    expect(steps()[1].querySelector('.step-split').hidden).toBe(true);
    expect($('.composer-status').textContent).toBe('Editing "Two"');
  });

  it('New clears the editor so the next Save creates a sequence instead of replacing', () => {
    const { $, store, steps, choose, stepFiles } = setup([{ name: 'One', quick: false, steps: [{ utility: 'upper.js' }] }]);
    $('.btn-seq-edit').click();
    $('.btn-seq-new').click();
    expect($('.seq-name-input').value).toBe('');
    expect($('.chk-seq-quick').checked).toBe(false);
    expect(stepFiles()).toEqual(['']);
    expect($('.composer-status').textContent).toBe('');
    $('.seq-name-input').value = 'Two';
    choose(steps()[0], 'trim.js');
    $('.btn-seq-save').click();
    expect(store.list().map((s) => s.name)).toEqual(['One', 'Two']);
  });

  it('Delete asks for a second click, then removes the sequence', () => {
    const { $, store, savedNames } = setup([{ name: 'One', quick: false, steps: [{ utility: 'upper.js' }] }]);
    const del = $('.btn-seq-delete');
    del.click();
    expect(del.textContent).toBe('Confirm?');
    expect(store.list()).toHaveLength(1);
    del.click();
    expect(store.list()).toEqual([]);
    expect(savedNames()).toEqual([]);
    expect($('.seq-empty')).not.toBeNull();
  });

  it('deleting the sequence being edited turns the editor into a new one', () => {
    const { $, store } = setup([{ name: 'One', quick: false, steps: [{ utility: 'upper.js' }] }]);
    $('.btn-seq-edit').click();
    $('.btn-seq-delete').click();
    $('.btn-seq-delete').click();
    $('.btn-seq-save').click();
    expect(store.list().map((s) => s.name)).toEqual(['One']);
  });

  it('re-renders the list when the store changes from elsewhere', () => {
    const { store, savedNames } = setup();
    store.save({ name: 'Ext', steps: [{ utility: 'upper.js' }] });
    expect(savedNames()).toEqual(['Ext']);
  });
});
