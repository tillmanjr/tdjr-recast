/** Copy text to the clipboard and show a short status message in `statusEl`. */
export async function copyText(text, statusEl) {
  try {
    await navigator.clipboard.writeText(text);
    flash(statusEl, 'Copied');
  } catch (err) {
    flash(statusEl, `Copy failed: ${err.message}`);
  }
}

function flash(el, msg) {
  const prev = el.textContent;
  el.textContent = msg;
  setTimeout(() => { if (el.textContent === msg) el.textContent = prev; }, 1500);
}
