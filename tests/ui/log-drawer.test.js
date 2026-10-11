// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createQuickLog } from '../../src/ui/quick-log.js';
import { createLogDrawer } from '../../src/ui/log-drawer.js';

const upper = { name: 'upper', category: 'text' };

function setup() {
  const log = createQuickLog({ now: () => { const d = new Date(2026, 0, 2, 3, 4, 5, 6); d.getTimezoneOffset = () => 0; return d; } });
  const drawer = createLogDrawer({ log });
  document.body.innerHTML = '';
  document.body.append(drawer.toggleBtn, drawer.el);
  const $ = (sel) => drawer.el.querySelector(sel);
  return { log, drawer, $ };
}

beforeEach(() => {
  Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn(() => Promise.resolve()) }, configurable: true });
});

describe('createLogDrawer', () => {
  it('starts hidden and toggles with its button', () => {
    const { drawer } = setup();
    expect(drawer.el.hidden).toBe(true);
    expect(drawer.toggleBtn.className).toBe('btn-log');
    expect(drawer.toggleBtn.textContent).toBe('Log');
    drawer.toggleBtn.click();
    expect(drawer.el.hidden).toBe(false);
    drawer.toggleBtn.click();
    expect(drawer.el.hidden).toBe(true);
  });

  it('shows the log text in a read-only, selectable text area and keeps it current', () => {
    const { log, $ } = setup();
    const text = $('textarea.log-text');
    expect(text.readOnly).toBe(true);
    expect(text.value).toBe('');
    log.record({ meta: upper, input: 'a', output: 'A', ok: true });
    expect(text.value).toBe('2026-01-02T03:04:05.006+00:00\ttext:upper\ta\tA');
    log.record({ meta: upper, input: 'b', output: 'B', ok: true });
    expect(text.value.split('\n')).toHaveLength(2);
    expect($('.log-count').textContent).toBe('2 entries');
  });

  it('counts a single entry in the singular', () => {
    const { log, $ } = setup();
    expect($('.log-count').textContent).toBe('0 entries');
    log.record({ meta: upper, input: 'a', output: 'A', ok: true });
    expect($('.log-count').textContent).toBe('1 entry');
  });

  it('Copy puts the whole log on the clipboard', async () => {
    const { log, $ } = setup();
    log.record({ meta: upper, input: 'a', output: 'A', ok: true });
    $('.btn-log-copy').click();
    await Promise.resolve();
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(log.text());
  });

  it('Clear empties the log and the view', () => {
    const { log, $ } = setup();
    log.record({ meta: upper, input: 'a', output: 'A', ok: true });
    $('.btn-log-clear').click();
    expect(log.lines()).toEqual([]);
    expect($('textarea.log-text').value).toBe('');
    expect($('.log-count').textContent).toBe('0 entries');
  });

  it('Close hides the drawer', () => {
    const { drawer, $ } = setup();
    drawer.toggleBtn.click();
    $('.btn-log-close').click();
    expect(drawer.el.hidden).toBe(true);
  });
});
