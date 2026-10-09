import { execute } from './run.js';
import { copyText } from './clipboard.js';

const MAX_ROWS = 4;

/** The Quick tab: one row per quick utility (name, input, ▶, output, Copy). */
export function createQuickPanel({ utilities }) {
  const el = document.createElement('div');
  el.className = 'panel quick';
  if (utilities.length === 0) {
    el.textContent = 'No utilities are marked quick: true.';
    return { el };
  }
  for (const meta of utilities) el.append(createRow(meta));
  return { el };
}

function createRow(meta) {
  const row = document.createElement('div');
  row.className = 'quick-row';
  row.innerHTML = `
    <span class="quick-name"></span>
    <textarea class="input" rows="1" wrap="off" spellcheck="false"></textarea>
    <button class="btn-run" title="Execute (Ctrl+Enter)">▶</button>
    <textarea class="output" rows="1" wrap="off" spellcheck="false" readonly></textarea>
    <button class="btn-copy">Copy</button>
    <span class="status"></span>`;

  const name = row.querySelector('.quick-name');
  name.textContent = meta.name;
  name.title = meta.description;
  const input = row.querySelector('.input');
  const output = row.querySelector('.output');
  const status = row.querySelector('.status');

  function run() {
    const res = execute(meta, input.value);
    output.value = res.ok ? res.output : res.error;
    output.classList.toggle('error', !res.ok);
    autosize(output);
  }

  row.querySelector('.btn-run').addEventListener('click', run);
  input.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); run(); }
  });
  input.addEventListener('input', () => autosize(input));
  row.querySelector('.btn-copy').addEventListener('click', () => copyText(output.value, status));
  return row;
}

/** Grow a textarea from one row up to MAX_ROWS to fit its content; beyond that it scrolls. */
function autosize(ta) {
  const lines = ta.value.split('\n').length;
  ta.rows = Math.min(MAX_ROWS, Math.max(1, lines));
}
