/**
 * Visual press feedback for buttons. The stylesheet renders `.pressed` like
 * `:active`, so a button triggered from the keyboard (Ctrl+Enter) looks the
 * same as one that was clicked.
 */
export const PRESSED_MS = 150;

const timers = new WeakMap();

/** Flash `el` as pressed for PRESSED_MS; re-pulsing restarts the timer. */
export function pulse(el) {
  el.classList.add('pressed');
  clearTimeout(timers.get(el));
  timers.set(el, setTimeout(() => el.classList.remove('pressed'), PRESSED_MS));
}

/** Pulse every button clicked anywhere inside `root`. */
export function pressFeedback(root) {
  root.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (btn) pulse(btn);
  });
}
