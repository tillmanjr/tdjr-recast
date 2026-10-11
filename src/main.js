import { utilities, quickUtilities } from './registry.js';
import { createTabBar } from './ui/tabs.js';
import { createTabPanel } from './ui/tab-panel.js';
import { createQuickPanel } from './ui/quick-panel.js';
import { createThemeToggle } from './ui/theme.js';
import { pressFeedback } from './ui/feedback.js';

const root = document.getElementById('app');
pressFeedback(root);
const bar = createTabBar(root);
bar.addTool(createThemeToggle().el);

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

bar.add({ title: 'Quick', closable: false, panelEl: createQuickPanel({ utilities: quickUtilities }).el });
bar.onAdd(() => newTab());
newTab();
