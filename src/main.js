import { utilities } from './registry.js';
import { createTabBar } from './ui/tabs.js';
import { createTabPanel } from './ui/tab-panel.js';

const root = document.getElementById('app');
const bar = createTabBar(root);

function placeholder(text) {
  const el = document.createElement('div');
  el.className = 'panel';
  el.textContent = text;
  return el;
}

function newTab(initialInput = '') {
  let id;
  const panel = createTabPanel({
    utilities,
    onTitleChange: (title) => bar.setTitle(id, title),
    onSendToNewTab: (text) => newTab(text),
  });
  panel.setInput(initialInput);
  id = bar.add({ title: 'Untitled', closable: true, panelEl: panel.el });
  return id;
}

bar.add({ title: 'Quick', closable: false, panelEl: placeholder('Quick tab (coming in Task 7)') });
bar.onAdd(() => newTab());
newTab();
