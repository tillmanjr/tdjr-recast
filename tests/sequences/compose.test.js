import { describe, it, expect } from 'vitest';
import { composeSequence } from '../../src/sequences/compose.js';

const upper = { name: 'upper', category: 'text', fn: (s) => s.toUpperCase(), inputType: 'string', resultType: 'string', quick: true };
const trim = { name: 'trim lines', category: 'text', fn: (lines) => lines.map((l) => l.trim()), inputType: 'lines', resultType: 'lines', quick: false };
const count = { name: 'count', category: 'text', fn: (x) => (Array.isArray(x) ? `${x.length} lines` : `${x.length} chars`), inputType: 'both', resultType: 'string', quick: false };
const boom = { name: 'boom', category: 'text', fn: () => { throw new Error('kaboom'); }, inputType: 'string', resultType: 'string', quick: false };
const byFile = new Map([['upper.js', upper], ['trim.js', trim], ['count.js', count], ['boom.js', boom]]);

describe('composeSequence', () => {
  it('builds a string → string meta in the sequence category', () => {
    const meta = composeSequence({ name: 'Shout', quick: true, steps: [{ utility: 'upper.js' }] }, byFile);
    expect(meta).toMatchObject({ name: 'Shout', description: '1 step', category: 'sequence', inputType: 'string', resultType: 'string', quick: true });
    expect(typeof meta.fn).toBe('function');
    expect(meta.sequence).toEqual({ name: 'Shout', quick: true, steps: [{ utility: 'upper.js' }] });
  });

  it('feeds each step the previous step\'s output, crossing string and lines types through text', () => {
    const meta = composeSequence({ name: 'Tidy', quick: false, steps: [{ utility: 'trim.js' }, { utility: 'upper.js' }] }, byFile);
    expect(meta.description).toBe('2 steps');
    expect(meta.fn(' a \n b ')).toBe('A\nB');
  });

  it('honours a step\'s splitLines flag for utilities that accept both', () => {
    const split = composeSequence({ name: 's', quick: false, steps: [{ utility: 'count.js', splitLines: true }] }, byFile);
    const whole = composeSequence({ name: 'w', quick: false, steps: [{ utility: 'count.js' }] }, byFile);
    expect(split.fn('a\nb\nc')).toBe('3 lines');
    expect(whole.fn('a\nb\nc')).toBe('5 chars');
  });

  it('stops at a failing step and names it', () => {
    const meta = composeSequence({ name: 'x', quick: false, steps: [{ utility: 'upper.js' }, { utility: 'boom.js' }, { utility: 'upper.js' }] }, byFile);
    expect(() => meta.fn('hi')).toThrow('Step 2 (boom): kaboom');
  });

  it('reports a step whose utility is no longer registered', () => {
    const meta = composeSequence({ name: 'x', quick: false, steps: [{ utility: 'gone.js' }] }, byFile);
    expect(() => meta.fn('hi')).toThrow('Step 1: unknown utility "gone.js"');
  });

  it('does not share the stored sequence object', () => {
    const seq = { name: 'x', quick: false, steps: [{ utility: 'upper.js' }] };
    const meta = composeSequence(seq, byFile);
    seq.steps.push({ utility: 'boom.js' });
    expect(meta.sequence.steps).toHaveLength(1);
  });
});
