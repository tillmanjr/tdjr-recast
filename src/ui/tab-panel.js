import { execute } from './run.js';
import { copyText } from './clipboard.js';
import { pulse } from './feedback.js';

/**
 * One regular tab: toolbar (utility selector, Execute, Clear, Send output to
 * new tab, layout toggle, Split lines, status) over an input textarea and a
 * read-only output textarea. Each area has a Wrap toggle in its head; the
 * output head also carries the Copy button.
 */
export function createTabPanel({ utilities, onTitleChange, onSendToNewTab }) {
  const el = document.createElement('div');
  el.className = 'panel stacked';
  el.innerHTML = `
    <div class="toolbar">
      <select class="util-select"><option value="">— select utility —</option></select>
      <button class="btn-execute" title="Ctrl+Enter">Execute</button>
      <button class="btn-clear">Clear</button>
      <button class="btn-send">Send output to new tab</button>
      <button class="btn-layout">Side by side</button>
      <label class="split-lines" hidden><input type="checkbox" class="chk-split"> Split lines</label>
      <span class="status"></span>
    </div>
    <div class="areas">
      <div class="area">
        <div class="area-head"><span>Input</span><span class="controls"><label><input type="checkbox" class="chk-wrap"> Wrap</label></span></div>
        <textarea class="input" wrap="off" spellcheck="false"></textarea>
      </div>
      <div class="area">
        <div class="area-head"><span>Output</span><span class="controls"><span class="copy-status"></span><button class="btn-copy" title="Copy output to clipboard">Copy</button><label><input type="checkbox" class="chk-wrap"> Wrap</label></span></div>
        <textarea class="output" wrap="off" spellcheck="false" readonly></textarea>
      </div>
    </div>`;

  const $ = (sel) => el.querySelector(sel);
  const select = $('.util-select');
  const input = $('.input');
  const output = $('.output');
  const status = $('.status');
  const splitLabel = $('.split-lines');
  const splitChk = $('.chk-split');

  let byName = new Map();
  const current = () => byName.get(select.value) ?? null;

  /** Rebuild the option groups for `list`, keeping the current choice if it is still there. */
  function fillSelect(list) {
    const keep = select.value;
    for (const g of select.querySelectorAll('optgroup')) g.remove();
    const groups = new Map();
    for (const u of list) {
      if (!groups.has(u.category)) {
        const g = document.createElement('optgroup');
        g.label = u.category;
        groups.set(u.category, g);
        select.append(g);
      }
      const o = document.createElement('option');
      o.value = u.name;
      o.textContent = u.name;
      groups.get(u.category).append(o);
    }
    byName = new Map(list.map((u) => [u.name, u]));
    select.value = byName.has(keep) ? keep : '';
  }

  function onSelect() {
    const meta = current();
    splitLabel.hidden = meta?.inputType !== 'both';
    status.textContent = meta ? `${meta.description} · ${meta.inputType} → ${meta.resultType}` : '';
    onTitleChange(meta ? meta.name : 'Untitled');
  }

  function showResult(res) {
    output.value = res.ok ? res.output : res.error;
    output.classList.toggle('error', !res.ok);
  }

  function run() {
    const meta = current();
    if (!meta) { showResult({ ok: false, error: 'Select a utility' }); return; }
    showResult(execute(meta, input.value, { splitLines: splitChk.checked }));
  }

  select.addEventListener('change', onSelect);
  fillSelect(utilities);
  const executeBtn = $('.btn-execute');
  executeBtn.addEventListener('click', run);
  input.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); pulse(executeBtn); run(); }
  });
  $('.btn-clear').addEventListener('click', () => {
    input.value = '';
    output.value = '';
    output.classList.remove('error');
  });
  $('.btn-copy').addEventListener('click', () => copyText(output.value, $('.copy-status')));
  $('.btn-send').addEventListener('click', () => onSendToNewTab(output.value));
  $('.btn-layout').addEventListener('click', (e) => {
    const side = el.classList.toggle('side-by-side');
    el.classList.toggle('stacked', !side);
    e.currentTarget.textContent = side ? 'Stacked' : 'Side by side';
  });
  for (const chk of el.querySelectorAll('.chk-wrap')) {
    chk.addEventListener('change', () => {
      chk.closest('.area').querySelector('textarea').setAttribute('wrap', chk.checked ? 'soft' : 'off');
    });
  }

  return {
    el,
    setInput(text) { input.value = text; },
    refreshUtilities(list) { fillSelect(list); onSelect(); },
  };
}
