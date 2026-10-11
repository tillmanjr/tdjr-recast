// @vitest-environment jsdom
import { describe, it, expect, beforeAll } from 'vitest';

beforeAll(async () => {
  localStorage.removeItem('sequences');
  document.body.innerHTML = '<div id="app"></div>';
  await import('../src/main.js');
});

const titles = () => [...document.querySelectorAll('.tab-title')].map((e) => e.textContent);
const activeTitle = () => document.querySelector('.tab.active .tab-title').textContent;

describe('app boot', () => {
  it('starts with non-closable Quick and Composer tabs and one active Untitled tab', () => {
    expect(titles()).toEqual(['Quick', 'Composer', 'Untitled']);
    expect(activeTitle()).toBe('Untitled');
    expect(document.querySelectorAll('.tab')[0].querySelector('.tab-close')).toBeNull();
    expect(document.querySelectorAll('.tab')[1].querySelector('.tab-close')).toBeNull();
    expect(document.querySelector('.panel.composer')).not.toBeNull();
  });

  it('lists only the quick utilities as Quick rows, hexdump excluded', () => {
    const names = [...document.querySelectorAll('.quick-row .quick-name')].map((e) => e.textContent);
    expect(names).toHaveLength(13);
    expect(names.slice(0, 2)).toEqual(['Swap pair', 'date → week of the year']);
    expect(names).not.toContain('hexdump → text');
  });

  it('groups the Quick rows by category with the type detector heading the timestamp group', () => {
    const groups = [...document.querySelectorAll('details.quick-group')];
    expect(groups.map((g) => g.querySelector('.quick-group-title').textContent)).toEqual(['data', 'date', 'timestamp', 'web']);
    expect(groups[2].querySelector('.quick-row .quick-name').textContent).toBe('timestamp → type');
  });

  it('runs a Quick row end to end and shows its placeholder', () => {
    const row = [...document.querySelectorAll('.quick-row')].find((r) => r.querySelector('.quick-name').textContent === 'date → week of the year');
    expect(row.querySelector('.input').placeholder).toBe('year, month, day');
    row.querySelector('.input').value = '2026, 01, 05';
    row.querySelector('.btn-run').click();
    expect(row.querySelector('.output').value).toBe('2');
  });

  it('runs a regular tab end to end and retitles it after the utility', () => {
    const panel = [...document.querySelectorAll('.panel')].find((p) => p.querySelector('.util-select'));
    const select = panel.querySelector('.util-select');
    select.value = 'hexdump → text';
    select.dispatchEvent(new Event('change'));
    expect(titles()).toEqual(['Quick', 'Composer', 'hexdump → text']);
    panel.querySelector('.input').value = '7b0022006d0073006700730022003a00';
    panel.querySelector('.btn-execute').click();
    expect(panel.querySelector('.output').value).toBe('{"msgs":');
  });

  it('+ opens a new Untitled tab and Send output seeds another', () => {
    document.querySelector('.tab-add').click();
    expect(titles()).toEqual(['Quick', 'Composer', 'hexdump → text', 'Untitled']);
    const first = [...document.querySelectorAll('.panel')].find((p) => p.querySelector('.util-select'));
    first.querySelector('.btn-send').click();
    expect(titles()).toEqual(['Quick', 'Composer', 'hexdump → text', 'Untitled', 'Untitled']);
    const panels = [...document.querySelectorAll('.panel')].filter((p) => p.querySelector('.util-select'));
    expect(panels.at(-1).querySelector('.input').value).toBe('{"msgs":');
    expect(activeTitle()).toBe('Untitled');
  });

  it('logs Quick runs and shows them in the drawer on request', () => {
    const drawer = document.querySelector('.log-drawer');
    expect(drawer.hidden).toBe(true);
    const row = [...document.querySelectorAll('.quick-row')].find((r) => r.querySelector('.quick-name').textContent === 'Swap pair');
    row.querySelector('.input').value = '1, 2';
    row.querySelector('.btn-run').click();
    document.querySelector('.tab-bar .tab-tools .btn-log').click();
    expect(drawer.hidden).toBe(false);
    const lines = drawer.querySelector('.log-text').value.split('\n');
    expect(lines.at(-1)).toMatch(/^\d{4}-\d{2}-\d{2}T[^\t]+\tdata:Swap pair\t1, 2\t2,1$/);
  });

  it('every button shows a pressed state when clicked', () => {
    const btn = document.querySelector('.btn-layout');
    btn.click();
    expect(btn.classList.contains('pressed')).toBe(true);
  });

  it('offers a theme toggle in the tab bar that flips the document theme', () => {
    const btn = document.querySelector('.tab-bar .tab-tools .btn-theme');
    const before = document.documentElement.dataset.theme;
    btn.click();
    expect(document.documentElement.dataset.theme).not.toBe(before);
    btn.click();
    expect(document.documentElement.dataset.theme).toBe(before);
  });

  it('a sequence saved in the Composer shows up on the Quick tab and in every tab dropdown, and runs', () => {
    const composer = document.querySelector('.panel.composer');
    const choose = (li, file) => { li.querySelector('.step-select').value = file; li.querySelector('.step-select').dispatchEvent(new Event('change')); };
    composer.querySelector('.seq-name-input').value = 'Flatten';
    composer.querySelector('.chk-seq-quick').checked = true;
    choose(composer.querySelector('.step'), 'trim-end.js');
    composer.querySelector('.btn-step-add').click();
    choose(composer.querySelectorAll('.step')[1], 'remove-line-breaks.js');
    composer.querySelector('.btn-seq-save').click();
    expect(composer.querySelector('.composer-status').textContent).toBe('Saved "Flatten"');

    const quickNames = [...document.querySelectorAll('.quick-row .quick-name')].map((e) => e.textContent);
    expect(quickNames).toContain('Flatten');
    const groupTitles = [...document.querySelectorAll('.quick-group-title')].map((e) => e.textContent);
    expect(groupTitles).toContain('sequence');

    const panels = [...document.querySelectorAll('.panel')].filter((p) => p.querySelector('.util-select'));
    for (const p of panels) {
      expect([...p.querySelectorAll('optgroup[label="sequence"] option')].map((o) => o.value)).toEqual(['Flatten']);
    }
    const panel = panels[0];
    expect(panel.querySelector('.util-select').value).toBe('hexdump → text'); // kept across the refresh
    panel.querySelector('.util-select').value = 'Flatten';
    panel.querySelector('.util-select').dispatchEvent(new Event('change'));
    panel.querySelector('.input').value = 'a  \nb \n';
    panel.querySelector('.btn-execute').click();
    expect(panel.querySelector('.output').value).toBe('ab');
    expect(titles()[2]).toBe('Flatten');

    const del = composer.querySelector('.btn-seq-delete');
    del.click();
    del.click();
    expect(panel.querySelector('optgroup[label="sequence"]')).toBeNull();
    expect(panel.querySelector('.util-select').value).toBe('');
    expect(titles()[2]).toBe('Untitled');
    expect([...document.querySelectorAll('.quick-row .quick-name')].map((e) => e.textContent)).not.toContain('Flatten');
  });
});
