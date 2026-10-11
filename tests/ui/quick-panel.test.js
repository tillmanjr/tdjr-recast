// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createQuickPanel } from '../../src/ui/quick-panel.js';

const upper = { name: 'upper', description: 'Uppercase', category: 'text', fn: (s) => s.toUpperCase(), inputType: 'string', resultType: 'string', quick: true };
const boom = { name: 'boom', description: 'Always throws', category: 'text', fn: () => { throw new Error('kaboom'); }, inputType: 'string', resultType: 'string', quick: true };

function setup(utilities = [upper, boom]) {
  const panel = createQuickPanel({ utilities });
  document.body.innerHTML = '';
  document.body.append(panel.el);
  const rows = [...panel.el.querySelectorAll('.quick-row')];
  const of = (row) => ({
    name: row.querySelector('.quick-name'),
    input: row.querySelector('.input'),
    output: row.querySelector('.output'),
    run: row.querySelector('.btn-run'),
    copy: row.querySelector('.btn-copy'),
    clear: row.querySelector('.btn-clear'),
    status: row.querySelector('.status'),
  });
  return { panel, rows: rows.map(of) };
}

beforeEach(() => {
  Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn(() => Promise.resolve()) }, configurable: true });
});

describe('createQuickPanel', () => {
  it('explains itself when no utility is quick', () => {
    const { panel } = setup([]);
    expect(panel.el.textContent).toBe('No utilities are marked quick: true.');
    expect(panel.el.querySelector('.quick-row')).toBeNull();
  });

  it('renders one row per utility with its name and description tooltip', () => {
    const { rows } = setup();
    expect(rows.map((r) => r.name.textContent)).toEqual(['upper', 'boom']);
    expect(rows[0].name.title).toBe('Uppercase');
    expect(rows[0].output.readOnly).toBe(true);
    expect(rows[0].input.getAttribute('wrap')).toBe('off');
  });

  it('▶ runs the row utility on its own input', () => {
    const { rows } = setup();
    rows[0].input.value = 'abc';
    rows[0].run.click();
    expect(rows[0].output.value).toBe('ABC');
    expect(rows[0].output.classList.contains('error')).toBe(false);
    expect(rows[1].output.value).toBe('');
  });

  it('shows an error in red', () => {
    const { rows } = setup();
    rows[1].run.click();
    expect(rows[1].output.value).toBe('kaboom');
    expect(rows[1].output.classList.contains('error')).toBe(true);
  });

  it('Ctrl+Enter runs the row; plain Enter does not', () => {
    const { rows } = setup();
    rows[0].input.value = 'x';
    rows[0].input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(rows[0].output.value).toBe('');
    rows[0].input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, bubbles: true }));
    expect(rows[0].output.value).toBe('X');
  });

  it('grows the input from one row up to four as lines are typed', () => {
    const { rows } = setup();
    const { input } = rows[0];
    expect(input.rows).toBe(1);
    input.value = 'a\nb\nc';
    input.dispatchEvent(new Event('input'));
    expect(input.rows).toBe(3);
    input.value = 'a\nb\nc\nd\ne\nf\ng\nh';
    input.dispatchEvent(new Event('input'));
    expect(input.rows).toBe(4);
    input.value = '';
    input.dispatchEvent(new Event('input'));
    expect(input.rows).toBe(1);
  });

  it('sizes the output to its result the same way', () => {
    const multi = { ...upper, name: 'lines', fn: () => 'a\nb\nc\nd\ne' };
    const { rows } = setup([multi]);
    rows[0].run.click();
    expect(rows[0].output.rows).toBe(4);
  });

  it('Copy writes the row output to the clipboard', async () => {
    const { rows } = setup();
    rows[0].input.value = 'abc';
    rows[0].run.click();
    rows[0].copy.click();
    await Promise.resolve();
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('ABC');
  });

  it('Clear erases the row input and output, resets sizes and the error state', () => {
    const { rows } = setup();
    rows[1].run.click();
    expect(rows[1].output.classList.contains('error')).toBe(true);
    const { input, output, clear } = rows[1];
    input.value = 'a\nb\nc';
    input.dispatchEvent(new Event('input'));
    output.value = 'x\ny';
    clear.click();
    expect(input.value).toBe('');
    expect(output.value).toBe('');
    expect(input.rows).toBe(1);
    expect(output.rows).toBe(1);
    expect(output.classList.contains('error')).toBe(false);
    expect(rows[0].input.value).toBe('');
  });

  it('shows meta.quickPlaceholder in the input when set, and nothing otherwise', () => {
    const dated = { ...upper, name: 'dated', quickPlaceholder: 'year, month, day' };
    const { rows } = setup([dated, upper]);
    expect(rows[0].input.placeholder).toBe('year, month, day');
    expect(rows[1].input.placeholder).toBe('');
  });
});
