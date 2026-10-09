import { createTabBar } from './ui/tabs.js';

const root = document.getElementById('app');
const bar = createTabBar(root);

function placeholder(text) {
  const el = document.createElement('div');
  el.className = 'panel';
  el.textContent = text;
  return el;
}

bar.add({ title: 'Quick', closable: false, panelEl: placeholder('Quick tab (coming in Task 7)') });
bar.onAdd(() => bar.add({ title: 'Untitled', panelEl: placeholder('Regular tab (coming in Task 6)') }));
bar.add({ title: 'Untitled', panelEl: placeholder('Regular tab (coming in Task 6)') });
