// @vitest-environment jsdom
import { describe, it, expect, beforeAll } from 'vitest';

beforeAll(async () => {
  document.body.innerHTML = '<div id="app"></div>';
  await import('../src/main.js');
});

const titles = () => [...document.querySelectorAll('.tab-title')].map((e) => e.textContent);
const activeTitle = () => document.querySelector('.tab.active .tab-title').textContent;

describe('app boot', () => {
  it('starts with a non-closable Quick tab and one active Untitled tab', () => {
    expect(titles()).toEqual(['Quick', 'Untitled']);
    expect(activeTitle()).toBe('Untitled');
    expect(document.querySelectorAll('.tab')[0].querySelector('.tab-close')).toBeNull();
  });

  it('lists the hexdump utility as a Quick row and runs it end to end', () => {
    const row = document.querySelector('.quick-row');
    expect(row.querySelector('.quick-name').textContent).toBe('hexdump → text');
    row.querySelector('.input').value = '68656c6c6f';
    row.querySelector('.btn-run').click();
    expect(row.querySelector('.output').value).toBe('hello');
  });

  it('runs a regular tab end to end and retitles it after the utility', () => {
    const panel = [...document.querySelectorAll('.panel')].find((p) => p.querySelector('.util-select'));
    const select = panel.querySelector('.util-select');
    select.value = 'hexdump → text';
    select.dispatchEvent(new Event('change'));
    expect(titles()).toEqual(['Quick', 'hexdump → text']);
    panel.querySelector('.input').value = '7b0022006d0073006700730022003a00';
    panel.querySelector('.btn-execute').click();
    expect(panel.querySelector('.output').value).toBe('{"msgs":');
  });

  it('+ opens a new Untitled tab and Send output seeds another', () => {
    document.querySelector('.tab-add').click();
    expect(titles()).toEqual(['Quick', 'hexdump → text', 'Untitled']);
    const first = [...document.querySelectorAll('.panel')].find((p) => p.querySelector('.util-select'));
    first.querySelector('.btn-send').click();
    expect(titles()).toEqual(['Quick', 'hexdump → text', 'Untitled', 'Untitled']);
    const panels = [...document.querySelectorAll('.panel')].filter((p) => p.querySelector('.util-select'));
    expect(panels.at(-1).querySelector('.input').value).toBe('{"msgs":');
    expect(activeTitle()).toBe('Untitled');
  });

  it('offers a theme toggle in the tab bar that flips the document theme', () => {
    const btn = document.querySelector('.tab-bar .tab-tools .btn-theme');
    const before = document.documentElement.dataset.theme;
    btn.click();
    expect(document.documentElement.dataset.theme).not.toBe(before);
    btn.click();
    expect(document.documentElement.dataset.theme).toBe(before);
  });
});
