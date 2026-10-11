import { composeSequence } from '../sequences/compose.js';

/**
 * The Composer tab. Left: the saved sequences with Edit and Delete. Right:
 * an editor (name, Quick, ordered steps, a Try it area, Save, New).
 * Steps choose from the static utilities only, never from sequences.
 */
export function createComposerPanel({ utilities, utilitiesByFile, store }) {
  const el = document.createElement('div');
  el.className = 'panel composer';
  el.innerHTML = `
    <div class="composer-saved">
      <div class="composer-saved-title">Saved sequences</div>
      <ul class="seq-list"></ul>
    </div>
    <div class="composer-editor">
      <div class="composer-row">
        <label>Name <input class="seq-name-input" spellcheck="false"></label>
        <label><input type="checkbox" class="chk-seq-quick"> Quick</label>
      </div>
      <ol class="steps"></ol>
      <div class="composer-row"><button class="btn-step-add">+ Add step</button></div>
      <div class="composer-try">
        <div class="area">
          <div class="area-head"><span>Try it</span><button class="btn-try" title="Run the steps above on this input (Ctrl+Enter)">Run</button></div>
          <textarea class="try-input" wrap="off" spellcheck="false"></textarea>
        </div>
        <div class="area">
          <div class="area-head"><span>Result</span></div>
          <textarea class="try-output" wrap="off" spellcheck="false" readonly></textarea>
        </div>
      </div>
      <div class="composer-row composer-actions">
        <button class="btn-seq-save">Save</button>
        <button class="btn-seq-new">New</button>
        <span class="composer-status"></span>
      </div>
    </div>`;

  const $ = (sel) => el.querySelector(sel);
  const listEl = $('.seq-list');
  const nameInput = $('.seq-name-input');
  const quickChk = $('.chk-seq-quick');
  const stepsEl = $('.steps');
  const tryInput = $('.try-input');
  const tryOutput = $('.try-output');
  const status = $('.composer-status');
  const fileOf = new Map([...utilitiesByFile].map(([file, meta]) => [meta, file]));

  let editing = null; // name of the saved sequence the editor holds, or null for a new one

  function setStatus(text, isError) {
    status.textContent = text;
    status.classList.toggle('error', isError);
  }

  // ---- steps -------------------------------------------------------------

  function createStep({ utility = '', splitLines = false } = {}) {
    const li = document.createElement('li');
    li.className = 'step';
    li.innerHTML = `
      <select class="step-select"><option value="">— select utility —</option></select>
      <label class="step-split" hidden><input type="checkbox" class="chk-step-split"> Split lines</label>
      <button class="btn-step-up" title="Move up">↑</button>
      <button class="btn-step-down" title="Move down">↓</button>
      <button class="btn-step-remove" title="Remove step">✕</button>`;
    const select = li.querySelector('.step-select');
    const groups = new Map();
    for (const u of utilities) {
      if (!groups.has(u.category)) {
        const g = document.createElement('optgroup');
        g.label = u.category;
        groups.set(u.category, g);
        select.append(g);
      }
      const o = document.createElement('option');
      o.value = fileOf.get(u);
      o.textContent = u.name;
      groups.get(u.category).append(o);
    }
    const split = li.querySelector('.step-split');
    const chk = li.querySelector('.chk-step-split');
    const sync = () => {
      split.hidden = utilitiesByFile.get(select.value)?.inputType !== 'both';
      if (split.hidden) chk.checked = false;
    };
    select.value = utility;
    chk.checked = splitLines;
    sync();
    select.addEventListener('change', sync);
    li.querySelector('.btn-step-up').addEventListener('click', () => {
      if (li.previousElementSibling) stepsEl.insertBefore(li, li.previousElementSibling);
    });
    li.querySelector('.btn-step-down').addEventListener('click', () => {
      if (li.nextElementSibling) stepsEl.insertBefore(li.nextElementSibling, li);
    });
    li.querySelector('.btn-step-remove').addEventListener('click', () => li.remove());
    return li;
  }

  function renderSteps(steps) {
    stepsEl.replaceChildren(...steps.map(createStep));
  }

  function readSteps() {
    return [...stepsEl.querySelectorAll('.step')].map((li) => ({
      utility: li.querySelector('.step-select').value,
      splitLines: li.querySelector('.chk-step-split').checked,
    }));
  }

  /** The message for the first step with nothing chosen, or null. */
  function blankStep(steps) {
    const i = steps.findIndex((s) => s.utility === '');
    return i >= 0 ? `Step ${i + 1}: choose a utility` : null;
  }

  // ---- try it ------------------------------------------------------------

  function showTry(text, ok) {
    tryOutput.value = text;
    tryOutput.classList.toggle('error', !ok);
  }

  function tryRun() {
    const steps = readSteps();
    const blank = blankStep(steps);
    if (blank) { showTry(blank, false); return; }
    const meta = composeSequence({ name: 'try', quick: false, steps }, utilitiesByFile);
    try {
      showTry(meta.fn(tryInput.value), true);
    } catch (e) {
      showTry(e.message, false);
    }
  }

  // ---- save / new / load -------------------------------------------------

  function save() {
    if (nameInput.value.trim() === '') { setStatus('Name is required', true); return; }
    const steps = readSteps();
    const blank = blankStep(steps);
    if (blank) { setStatus(blank, true); return; }
    try {
      const saved = store.save({ name: nameInput.value, quick: quickChk.checked, steps }, { replace: editing });
      editing = saved.name;
      nameInput.value = saved.name;
      setStatus(`Saved "${saved.name}"`, false);
    } catch (e) {
      setStatus(e.message, true);
    }
  }

  function reset() {
    editing = null;
    nameInput.value = '';
    quickChk.checked = false;
    renderSteps([{}]);
    setStatus('', false);
  }

  function load(name) {
    const seq = store.get(name);
    editing = seq.name;
    nameInput.value = seq.name;
    quickChk.checked = seq.quick;
    renderSteps(seq.steps);
    setStatus(`Editing "${seq.name}"`, false);
  }

  // ---- saved list --------------------------------------------------------

  function renderList() {
    listEl.replaceChildren();
    const sequences = store.list();
    if (sequences.length === 0) {
      const li = document.createElement('li');
      li.className = 'seq-empty';
      li.textContent = 'No sequences yet.';
      listEl.append(li);
      return;
    }
    for (const seq of sequences) {
      const li = document.createElement('li');
      li.className = 'seq-item';
      const n = seq.steps.length;
      li.innerHTML = `
        <span class="seq-name"></span>
        <span class="seq-info">${n} step${n === 1 ? '' : 's'}${seq.quick ? ' · Quick' : ''}</span>
        <button class="btn-seq-edit">Edit</button>
        <button class="btn-seq-delete" title="Delete this sequence (asks once)">Delete</button>`;
      li.querySelector('.seq-name').textContent = seq.name;
      li.querySelector('.btn-seq-edit').addEventListener('click', () => load(seq.name));
      const del = li.querySelector('.btn-seq-delete');
      let armed = false;
      del.addEventListener('click', () => {
        if (!armed) {
          armed = true;
          del.textContent = 'Confirm?';
          del.classList.add('confirm');
          return;
        }
        if (editing === seq.name) editing = null;
        store.remove(seq.name);
      });
      listEl.append(li);
    }
  }

  // ---- wiring ------------------------------------------------------------

  $('.btn-step-add').addEventListener('click', () => stepsEl.append(createStep()));
  $('.btn-try').addEventListener('click', tryRun);
  tryInput.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); tryRun(); }
  });
  $('.btn-seq-save').addEventListener('click', save);
  $('.btn-seq-new').addEventListener('click', reset);
  store.onChange(renderList);

  renderList();
  reset();
  return { el, load };
}
