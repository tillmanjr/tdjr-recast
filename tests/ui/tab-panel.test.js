// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTabPanel } from '../../src/ui/tab-panel.js';

const upper = { name: 'upper', description: 'Uppercase', category: 'text', fn: (s) => s.toUpperCase(), inputType: 'string', resultType: 'string', quick: true };
const count = { name: 'count', description: 'Count lines', category: 'lines', fn: (x) => (Array.isArray(x) ? `${x.length} lines` : 'one string'), inputType: 'both', resultType: 'string', quick: false };
const boom = { name: 'boom', description: 'Always throws', category: 'text', fn: () => { throw new Error('kaboom'); }, inputType: 'string', resultType: 'string', quick: false };

function setup() {
  const onTitleChange = vi.fn();
  const onSendToNewTab = vi.fn();
  const panel = createTabPanel({ utilities: [count, boom, upper], onTitleChange, onSendToNewTab });
  document.body.innerHTML = '';
  document.body.append(panel.el);
  const $ = (sel) => panel.el.querySelector(sel);
  const pick = (name) => { $('.util-select').value = name; $('.util-select').dispatchEvent(new Event('change')); };
  return { panel, $, pick, onTitleChange, onSendToNewTab };
}

beforeEach(() => {
  Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn(() => Promise.resolve()) }, configurable: true });
});

describe('createTabPanel toolbar', () => {
  it('lists utilities grouped by category after a blank option', () => {
    const { $ } = setup();
    const select = $('.util-select');
    expect(select.options[0].value).toBe('');
    const groups = [...select.querySelectorAll('optgroup')].map((g) => [g.label, [...g.querySelectorAll('option')].map((o) => o.value)]);
    expect(groups).toEqual([['lines', ['count']], ['text', ['boom', 'upper']]]);
  });

  it('selecting a utility retitles the tab and shows description and types', () => {
    const { $, pick, onTitleChange } = setup();
    pick('upper');
    expect(onTitleChange).toHaveBeenLastCalledWith('upper');
    expect($('.status').textContent).toBe('Uppercase · string → string');
    pick('');
    expect(onTitleChange).toHaveBeenLastCalledWith('Untitled');
    expect($('.status').textContent).toBe('');
  });

  it('shows the Split lines checkbox only for inputType both', () => {
    const { $, pick } = setup();
    expect($('.split-lines').hidden).toBe(true);
    pick('count');
    expect($('.split-lines').hidden).toBe(false);
    pick('upper');
    expect($('.split-lines').hidden).toBe(true);
  });

  it('starts stacked and toggles to side by side and back', () => {
    const { $, panel } = setup();
    expect(panel.el.classList.contains('stacked')).toBe(true);
    $('.btn-layout').click();
    expect(panel.el.classList.contains('side-by-side')).toBe(true);
    expect(panel.el.classList.contains('stacked')).toBe(false);
    expect($('.btn-layout').textContent).toBe('Stacked');
    $('.btn-layout').click();
    expect(panel.el.classList.contains('stacked')).toBe(true);
    expect($('.btn-layout').textContent).toBe('Side by side');
  });
});

describe('createTabPanel execution', () => {
  it('asks for a utility when none is selected', () => {
    const { $ } = setup();
    $('.input').value = 'abc';
    $('.btn-execute').click();
    expect($('.output').value).toBe('Select a utility');
    expect($('.output').classList.contains('error')).toBe(true);
  });

  it('runs the selected utility and clears a previous error state', () => {
    const { $, pick } = setup();
    $('.btn-execute').click();
    pick('upper');
    $('.input').value = 'abc';
    $('.btn-execute').click();
    expect($('.output').value).toBe('ABC');
    expect($('.output').classList.contains('error')).toBe(false);
  });

  it('shows a thrown error in red', () => {
    const { $, pick } = setup();
    pick('boom');
    $('.btn-execute').click();
    expect($('.output').value).toBe('kaboom');
    expect($('.output').classList.contains('error')).toBe(true);
  });

  it('passes the Split lines choice through for inputType both', () => {
    const { $, pick } = setup();
    pick('count');
    $('.input').value = 'a\nb\nc';
    $('.btn-execute').click();
    expect($('.output').value).toBe('one string');
    $('.chk-split').checked = true;
    $('.btn-execute').click();
    expect($('.output').value).toBe('3 lines');
  });

  it('Ctrl+Enter in the input runs; plain Enter does not', () => {
    const { $, pick } = setup();
    pick('upper');
    $('.input').value = 'x';
    $('.input').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect($('.output').value).toBe('');
    $('.input').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, bubbles: true }));
    expect($('.output').value).toBe('X');
  });
});

describe('createTabPanel buttons and toggles', () => {
  it('Clear empties both areas and removes the error state', () => {
    const { $ } = setup();
    $('.input').value = 'abc';
    $('.btn-execute').click();
    $('.btn-clear').click();
    expect($('.input').value).toBe('');
    expect($('.output').value).toBe('');
    expect($('.output').classList.contains('error')).toBe(false);
  });

  it('Copy output writes the output to the clipboard', async () => {
    const { $, pick } = setup();
    pick('upper');
    $('.input').value = 'abc';
    $('.btn-execute').click();
    $('.btn-copy').click();
    await Promise.resolve();
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('ABC');
  });

  it('Send output to new tab hands the output to the callback', () => {
    const { $, pick, onSendToNewTab } = setup();
    pick('upper');
    $('.input').value = 'abc';
    $('.btn-execute').click();
    $('.btn-send').click();
    expect(onSendToNewTab).toHaveBeenCalledWith('ABC');
  });

  it('Wrap checkboxes control each textarea independently, off by default', () => {
    const { $ } = setup();
    const [inWrap, outWrap] = $('.areas').querySelectorAll('.chk-wrap');
    expect($('.input').getAttribute('wrap')).toBe('off');
    expect($('.output').getAttribute('wrap')).toBe('off');
    inWrap.checked = true;
    inWrap.dispatchEvent(new Event('change'));
    expect($('.input').getAttribute('wrap')).toBe('soft');
    expect($('.output').getAttribute('wrap')).toBe('off');
    inWrap.checked = false;
    inWrap.dispatchEvent(new Event('change'));
    expect($('.input').getAttribute('wrap')).toBe('off');
    outWrap.checked = true;
    outWrap.dispatchEvent(new Event('change'));
    expect($('.output').getAttribute('wrap')).toBe('soft');
  });

  it('setInput fills the input area', () => {
    const { $, panel } = setup();
    panel.setInput('seed');
    expect($('.input').value).toBe('seed');
  });
});
