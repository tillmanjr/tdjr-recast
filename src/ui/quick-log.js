/**
 * In-memory log of Quick runs. Nothing is persisted: the log starts empty
 * every launch. One tab-separated line per run:
 *
 *   <local ISO timestamp> TAB <category>:<name> TAB <input> TAB <output>
 *
 * Tabs, line breaks and backslashes inside the input and output are escaped
 * (\t, \n, \r, \\) so each entry stays on one line. A failed run's output
 * field is "ERROR: " followed by the message.
 */

export function createQuickLog({ now = () => new Date() } = {}) {
  const lines = [];
  const listeners = new Set();
  const notify = () => { for (const fn of listeners) fn(); };

  return {
    record({ meta, input, output, ok }) {
      const result = ok ? output : `ERROR: ${output}`;
      const line = [formatLocalIso(now()), `${meta.category}:${meta.name}`, escapeField(input), escapeField(result)].join('\t');
      lines.push(line);
      notify();
      return line;
    },
    lines: () => [...lines],
    text: () => lines.join('\n'),
    clear() {
      lines.length = 0;
      notify();
    },
    onChange(fn) { listeners.add(fn); },
  };
}

/** 2026-10-11T14:05:09.123-05:00 — wall-clock time in the machine's zone, with its offset. */
export function formatLocalIso(d) {
  const pad = (n, width = 2) => String(n).padStart(width, '0');
  const offset = -d.getTimezoneOffset();
  const sign = offset < 0 ? '-' : '+';
  const abs = Math.abs(offset);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    + `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`
    + `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

export function escapeField(s) {
  return s.replace(/\\/g, '\\\\').replace(/\t/g, '\\t').replace(/\n/g, '\\n').replace(/\r/g, '\\r');
}
