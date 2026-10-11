import { describe, it, expect, vi } from 'vitest';
import { createQuickLog, formatLocalIso, escapeField } from '../../src/ui/quick-log.js';

const upper = { name: 'upper', category: 'text' };
const fixed = new Date(2026, 9, 11, 14, 5, 9, 123);
const atOffset = (minutesWestOfUtc) => {
  const d = new Date(fixed);
  d.getTimezoneOffset = () => minutesWestOfUtc;
  return d;
};

describe('formatLocalIso', () => {
  it('writes local wall-clock time with the zone offset', () => {
    expect(formatLocalIso(atOffset(300))).toBe('2026-10-11T14:05:09.123-05:00');
    expect(formatLocalIso(atOffset(-330))).toBe('2026-10-11T14:05:09.123+05:30');
    expect(formatLocalIso(atOffset(0))).toBe('2026-10-11T14:05:09.123+00:00');
  });
});

describe('escapeField', () => {
  it('keeps a value on one line and tab-free', () => {
    expect(escapeField('a\tb\nc\rd\\e')).toBe('a\\tb\\nc\\rd\\\\e');
    expect(escapeField('plain')).toBe('plain');
  });
});

describe('createQuickLog', () => {
  it('records one tab-separated line per run: timestamp, category:name, input, output', () => {
    const log = createQuickLog({ now: () => atOffset(300) });
    const line = log.record({ meta: upper, input: 'abc', output: 'ABC', ok: true });
    expect(line).toBe('2026-10-11T14:05:09.123-05:00\ttext:upper\tabc\tABC');
    expect(log.lines()).toEqual([line]);
  });

  it('marks failed runs and escapes multi-line values', () => {
    const log = createQuickLog({ now: () => atOffset(0) });
    log.record({ meta: upper, input: 'l1\nl2', output: 'kaboom', ok: false });
    expect(log.lines()[0]).toBe('2026-10-11T14:05:09.123+00:00\ttext:upper\tl1\\nl2\tERROR: kaboom');
  });

  it('joins lines with newlines in text(), empty when nothing is logged', () => {
    const log = createQuickLog({ now: () => atOffset(0) });
    expect(log.text()).toBe('');
    log.record({ meta: upper, input: '1', output: '2', ok: true });
    log.record({ meta: upper, input: '3', output: '4', ok: true });
    expect(log.text().split('\n')).toHaveLength(2);
  });

  it('clear() empties the log; listeners hear every change', () => {
    const log = createQuickLog({ now: () => atOffset(0) });
    const seen = vi.fn();
    log.onChange(seen);
    log.record({ meta: upper, input: '1', output: '2', ok: true });
    expect(seen).toHaveBeenCalledTimes(1);
    log.clear();
    expect(seen).toHaveBeenCalledTimes(2);
    expect(log.lines()).toEqual([]);
    expect(log.text()).toBe('');
  });

  it('lines() returns a copy', () => {
    const log = createQuickLog({ now: () => atOffset(0) });
    log.record({ meta: upper, input: '1', output: '2', ok: true });
    log.lines().push('tampered');
    expect(log.lines()).toHaveLength(1);
  });

  it('timestamps with the real clock by default', () => {
    const log = createQuickLog();
    const line = log.record({ meta: upper, input: '1', output: '2', ok: true });
    expect(line).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}[+-]\d{2}:\d{2}\ttext:upper\t1\t2$/);
  });
});
