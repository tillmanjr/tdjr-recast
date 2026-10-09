// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { createTabBar } from '../../src/ui/tabs.js';

function setup() {
  document.body.innerHTML = '<div id="app"></div>';
  const root = document.getElementById('app');
  const bar = createTabBar(root);
  const panel = (text) => { const el = document.createElement('div'); el.textContent = text; return el; };
  return { root, bar, panel };
}
const titles = (root) => [...root.querySelectorAll('.tab-title')].map((e) => e.textContent);
const activeTitle = (root) => root.querySelector('.tab.active .tab-title').textContent;
const visiblePanels = (root) => [...root.querySelectorAll('.tab-panels > *')].filter((p) => !p.hidden).map((p) => p.textContent);

describe('createTabBar', () => {
  it('renders a strip, a + button and an empty panel container', () => {
    const { root } = setup();
    expect(root.querySelector('.tab-bar .tab-strip')).not.toBeNull();
    expect(root.querySelector('.tab-bar .tab-add').textContent).toBe('+');
    expect(root.querySelector('.tab-panels').children.length).toBe(0);
  });

  it('add() appends a tab, activates it and shows only its panel', () => {
    const { root, bar, panel } = setup();
    bar.add({ title: 'A', panelEl: panel('pa') });
    bar.add({ title: 'B', panelEl: panel('pb') });
    expect(titles(root)).toEqual(['A', 'B']);
    expect(activeTitle(root)).toBe('B');
    expect(visiblePanels(root)).toEqual(['pb']);
  });

  it('closable tabs get a × button; non-closable ones do not', () => {
    const { root, bar, panel } = setup();
    bar.add({ title: 'Quick', closable: false, panelEl: panel('q') });
    bar.add({ title: 'A', panelEl: panel('a') });
    const tabs = root.querySelectorAll('.tab');
    expect(tabs[0].querySelector('.tab-close')).toBeNull();
    expect(tabs[1].querySelector('.tab-close')).not.toBeNull();
  });

  it('clicking a tab activates it', () => {
    const { root, bar, panel } = setup();
    bar.add({ title: 'A', panelEl: panel('a') });
    bar.add({ title: 'B', panelEl: panel('b') });
    root.querySelectorAll('.tab')[0].click();
    expect(activeTitle(root)).toBe('A');
    expect(visiblePanels(root)).toEqual(['a']);
  });

  it('setTitle relabels a tab and ignores unknown ids', () => {
    const { root, bar, panel } = setup();
    const id = bar.add({ title: 'Untitled', panelEl: panel('a') });
    bar.setTitle(id, 'hexdump → text');
    bar.setTitle(999, 'nope');
    expect(titles(root)).toEqual(['hexdump → text']);
  });

  it('closing the active tab activates its left neighbour and removes the panel', () => {
    const { root, bar, panel } = setup();
    bar.add({ title: 'Quick', closable: false, panelEl: panel('q') });
    bar.add({ title: 'A', panelEl: panel('a') });
    const b = bar.add({ title: 'B', panelEl: panel('b') });
    bar.close(b);
    expect(titles(root)).toEqual(['Quick', 'A']);
    expect(activeTitle(root)).toBe('A');
    expect(visiblePanels(root)).toEqual(['a']);
  });

  it('closing a non-active tab leaves the active one alone', () => {
    const { root, bar, panel } = setup();
    bar.add({ title: 'A', panelEl: panel('a') });
    const b = bar.add({ title: 'B', panelEl: panel('b') });
    bar.add({ title: 'C', panelEl: panel('c') });
    bar.close(b);
    expect(titles(root)).toEqual(['A', 'C']);
    expect(activeTitle(root)).toBe('C');
  });

  it('closing the last remaining tab leaves nothing active', () => {
    const { root, bar, panel } = setup();
    const a = bar.add({ title: 'A', panelEl: panel('a') });
    bar.close(a);
    expect(titles(root)).toEqual([]);
    expect(root.querySelector('.tab.active')).toBeNull();
  });

  it('close() with an unknown id is a no-op', () => {
    const { root, bar, panel } = setup();
    bar.add({ title: 'A', panelEl: panel('a') });
    bar.close(999);
    expect(titles(root)).toEqual(['A']);
  });

  it('the × button closes without activating the tab first', () => {
    const { root, bar, panel } = setup();
    bar.add({ title: 'A', panelEl: panel('a') });
    bar.add({ title: 'B', panelEl: panel('b') });
    bar.add({ title: 'C', panelEl: panel('c') });
    root.querySelectorAll('.tab')[0].click();
    root.querySelectorAll('.tab')[2].querySelector('.tab-close').click();
    expect(titles(root)).toEqual(['A', 'B']);
    expect(activeTitle(root)).toBe('A');
  });

  it('clicking + calls the onAdd handler; without one it is a no-op', () => {
    const { root, bar } = setup();
    root.querySelector('.tab-add').click();
    const onAdd = vi.fn();
    bar.onAdd(onAdd);
    root.querySelector('.tab-add').click();
    expect(onAdd).toHaveBeenCalledTimes(1);
  });
});
