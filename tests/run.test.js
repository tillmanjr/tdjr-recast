import { describe, it, expect, vi } from 'vitest';
import { execute } from '../src/ui/run.js';

const meta = (over) => ({ name: 'u', fn: (x) => x, inputType: 'string', resultType: 'string', ...over });

describe('execute input mapping', () => {
  it('passes the whole text unchanged for inputType string', () => {
    const fn = vi.fn((x) => x);
    const text = '{\n  "a": 1\n}\n';
    execute(meta({ fn }), text);
    expect(fn).toHaveBeenCalledWith(text);
  });

  it('splits on \n and \r\n for inputType lines', () => {
    const fn = vi.fn((lines) => lines);
    execute(meta({ fn, inputType: 'lines', resultType: 'lines' }), 'a\nb\r\nc');
    expect(fn).toHaveBeenCalledWith(['a', 'b', 'c']);
  });

  it('for inputType both passes text unchanged unless splitLines is set', () => {
    const fn = vi.fn((x) => (Array.isArray(x) ? x.join('|') : x));
    expect(execute(meta({ fn, inputType: 'both' }), 'a\nb').output).toBe('a\nb');
    expect(execute(meta({ fn, inputType: 'both' }), 'a\nb', { splitLines: true }).output).toBe('a|b');
  });
});

describe('execute output mapping', () => {
  it('joins a lines result with \n', () => {
    const res = execute(meta({ fn: () => ['x', 'y'], resultType: 'lines' }), '');
    expect(res).toEqual({ ok: true, output: 'x\ny' });
  });

  it('returns a string result exactly, appending nothing', () => {
    const res = execute(meta({ fn: () => 'abc' }), '');
    expect(res).toEqual({ ok: true, output: 'abc' });
  });

  it('reports a thrown error by message', () => {
    const res = execute(meta({ fn: () => { throw new Error('Odd hex length (3)'); } }), 'abc');
    expect(res).toEqual({ ok: false, error: 'Odd hex length (3)' });
  });

  it('reports a non-string result when string was declared', () => {
    const res = execute(meta({ fn: () => 42 }), '');
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/declared string result but returned a number/);
  });

  it('reports a non-array result when lines was declared', () => {
    const res = execute(meta({ fn: () => 'nope', resultType: 'lines' }), '');
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/declared lines result but returned a string/);
  });

  it('reports an array with non-string items when lines was declared', () => {
    const res = execute(meta({ fn: () => ['a', 1], resultType: 'lines' }), '');
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/array with non-string items/);
  });

  it('describes an array of strings returned where a string was declared', () => {
    const res = execute(meta({ fn: () => ['a'] }), '');
    expect(res.error).toMatch(/returned an array of strings/);
  });

  it('describes a null result', () => {
    const res = execute(meta({ fn: () => null }), '');
    expect(res.error).toMatch(/returned null/);
  });

  it('stringifies a thrown non-Error value', () => {
    const res = execute(meta({ fn: () => { throw 'boom'; } }), '');
    expect(res).toEqual({ ok: false, error: 'boom' });
  });
});
