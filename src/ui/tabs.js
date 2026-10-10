/**
 * Tab bar: a strip of tab buttons plus a "+" button, and a panel container
 * that shows exactly one panel at a time.
 */
let nextId = 1;

export function createTabBar(root) {
  const bar = document.createElement('div');
  bar.className = 'tab-bar';
  const strip = document.createElement('div');
  strip.className = 'tab-strip';
  const addBtn = document.createElement('button');
  addBtn.className = 'tab-add';
  addBtn.textContent = '+';
  addBtn.title = 'New tab';
  const tools = document.createElement('div');
  tools.className = 'tab-tools';
  bar.append(strip, addBtn, tools);

  const panels = document.createElement('div');
  panels.className = 'tab-panels';
  root.append(bar, panels);

  const tabs = [];
  let activeId = null;
  let addHandler = () => {};

  function render() {
    for (const t of tabs) {
      t.tabEl.classList.toggle('active', t.id === activeId);
      t.panelEl.hidden = t.id !== activeId;
    }
  }

  function add({ title, closable = true, panelEl }) {
    const id = nextId++;
    const tabEl = document.createElement('div');
    tabEl.className = 'tab';
    const label = document.createElement('span');
    label.className = 'tab-title';
    label.textContent = title;
    tabEl.append(label);
    if (closable) {
      const x = document.createElement('button');
      x.className = 'tab-close';
      x.textContent = '×';
      x.title = 'Close tab';
      x.addEventListener('click', (e) => { e.stopPropagation(); close(id); });
      tabEl.append(x);
    }
    tabEl.addEventListener('click', () => activate(id));
    strip.append(tabEl);
    panels.append(panelEl);
    tabs.push({ id, tabEl, label, panelEl });
    activate(id);
    return id;
  }

  function activate(id) {
    activeId = id;
    render();
  }

  function setTitle(id, title) {
    const t = tabs.find((t) => t.id === id);
    if (t) t.label.textContent = title;
  }

  function close(id) {
    const i = tabs.findIndex((t) => t.id === id);
    if (i < 0) return;
    const [t] = tabs.splice(i, 1);
    t.tabEl.remove();
    t.panelEl.remove();
    if (activeId === id) activeId = tabs[Math.max(0, i - 1)]?.id ?? null;
    render();
  }

  addBtn.addEventListener('click', () => addHandler());

  return {
    add, activate, setTitle, close,
    onAdd(fn) { addHandler = fn; },
    addTool(el) { tools.append(el); },
  };
}
