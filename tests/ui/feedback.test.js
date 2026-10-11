// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { pulse, pressFeedback, PRESSED_MS } from '../../src/ui/feedback.js';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('pulse', () => {
  it('marks the element pressed, then clears it after PRESSED_MS', () => {
    const btn = document.createElement('button');
    pulse(btn);
    expect(btn.classList.contains('pressed')).toBe(true);
    vi.advanceTimersByTime(PRESSED_MS - 1);
    expect(btn.classList.contains('pressed')).toBe(true);
    vi.advanceTimersByTime(1);
    expect(btn.classList.contains('pressed')).toBe(false);
  });

  it('restarts the timer when pulsed again while still pressed', () => {
    const btn = document.createElement('button');
    pulse(btn);
    vi.advanceTimersByTime(PRESSED_MS - 10);
    pulse(btn);
    vi.advanceTimersByTime(PRESSED_MS - 10);
    expect(btn.classList.contains('pressed')).toBe(true);
    vi.advanceTimersByTime(10);
    expect(btn.classList.contains('pressed')).toBe(false);
  });
});

describe('pressFeedback', () => {
  it('pulses any button clicked inside the root, even via a child element', () => {
    document.body.innerHTML = '<div id="root"><button class="a"><span class="inner">x</span></button><p class="not">text</p></div>';
    const root = document.getElementById('root');
    pressFeedback(root);
    root.querySelector('.inner').click();
    expect(root.querySelector('.a').classList.contains('pressed')).toBe(true);
    root.querySelector('.not').click();
    expect(root.querySelectorAll('.pressed')).toHaveLength(1);
    vi.advanceTimersByTime(PRESSED_MS);
    expect(root.querySelectorAll('.pressed')).toHaveLength(0);
  });
});
