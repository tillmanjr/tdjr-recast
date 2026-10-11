import { utilities, utilitiesByFile } from './registry.js';
import { createTabBar } from './ui/tabs.js';
import { createTabPanel } from './ui/tab-panel.js';
import { createQuickPanel } from './ui/quick-panel.js';
import { createComposerPanel } from './ui/composer-panel.js';
import { createThemeToggle } from './ui/theme.js';
import { pressFeedback } from './ui/feedback.js';
import { createQuickLog } from './ui/quick-log.js';
import { createLogDrawer } from './ui/log-drawer.js';
import { createSequenceStore } from './sequences/store.js';
import { createCatalogue } from './sequences/catalogue.js';

const root = document.getElementById('app');
pressFeedback(root);
const bar = createTabBar(root);
const log = createQuickLog();
const drawer = createLogDrawer({ log });
bar.addTool(drawer.toggleBtn);
bar.addTool(createThemeToggle().el);

// Static utilities plus saved sequences; everything below lists from the catalogue.
const store = createSequenceStore({ utilitiesByFile });
const catalogue = createCatalogue({ utilities, utilitiesByFile, store });
const openPanels = new Set();

function newTab(initialInput = '') {
  let id;
  const panel = createTabPanel({
    utilities: catalogue.all(),
    onTitleChange: (title) => bar.setTitle(id, title),
    onSendToNewTab: (text) => newTab(text),
  });
  panel.setInput(initialInput);
  openPanels.add(panel);
  id = bar.add({ title: 'Untitled', closable: true, panelEl: panel.el });
  return id;
}

const quick = createQuickPanel({ utilities: catalogue.quick(), onRun: (run) => log.record(run) });
bar.add({ title: 'Quick', closable: false, panelEl: quick.el });
bar.add({ title: 'Composer', closable: false, panelEl: createComposerPanel({ utilities, utilitiesByFile, store }).el });
bar.onAdd(() => newTab());
newTab();
root.append(drawer.el);

catalogue.onChange(() => {
  quick.setUtilities(catalogue.quick());
  for (const panel of openPanels) {
    if (panel.el.isConnected) panel.refreshUtilities(catalogue.all());
    else openPanels.delete(panel); // its tab was closed
  }
});
