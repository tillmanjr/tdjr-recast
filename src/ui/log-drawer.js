import { copyText } from './clipboard.js';

/**
 * A drawer showing the Quick log in a read-only text area (so any part of it
 * can be selected), with Copy, Clear and Close. Hidden until its toggle
 * button, meant for the tab bar, is pressed.
 */
export function createLogDrawer({ log }) {
  const el = document.createElement('div');
  el.className = 'log-drawer';
  el.hidden = true;
  el.innerHTML = `
    <div class="log-head">
      <span class="log-title">Quick log</span>
      <span class="log-count"></span>
      <span class="log-status"></span>
      <button class="btn-log-copy" title="Copy the whole log">Copy</button>
      <button class="btn-log-clear" title="Empty the log">Clear</button>
      <button class="btn-log-close" title="Hide the log">×</button>
    </div>
    <textarea class="log-text" readonly wrap="off" spellcheck="false"></textarea>`;

  const text = el.querySelector('.log-text');
  const count = el.querySelector('.log-count');
  const status = el.querySelector('.log-status');

  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'btn-log';
  toggleBtn.textContent = 'Log';
  toggleBtn.title = 'Show or hide the Quick log';

  function render() {
    const n = log.lines().length;
    text.value = log.text();
    count.textContent = `${n} ${n === 1 ? 'entry' : 'entries'}`;
    text.scrollTop = text.scrollHeight;
  }

  function show() { el.hidden = false; render(); }
  function hide() { el.hidden = true; }
  function toggle() { el.hidden ? show() : hide(); }

  log.onChange(render);
  toggleBtn.addEventListener('click', toggle);
  el.querySelector('.btn-log-copy').addEventListener('click', () => copyText(log.text(), status));
  el.querySelector('.btn-log-clear').addEventListener('click', () => log.clear());
  el.querySelector('.btn-log-close').addEventListener('click', hide);
  render();

  return { el, toggleBtn, show, hide, toggle };
}
