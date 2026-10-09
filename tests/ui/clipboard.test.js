// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { copyText } from '../../src/ui/clipboard.js';

function mockClipboard(impl) {
  Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn(impl) }, configurable: true });
  return navigator.clipboard.writeText;
}

describe('copyText', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('writes the text and flashes "Copied", then restores the previous status', async () => {
    const writeText = mockClipboard(() => Promise.resolve());
    const status = document.createElement('span');
    status.textContent = 'idle';
    await copyText('hello', status);
    expect(writeText).toHaveBeenCalledWith('hello');
    expect(status.textContent).toBe('Copied');
    vi.advanceTimersByTime(1500);
    expect(status.textContent).toBe('idle');
  });

  it('reports a failure message', async () => {
    mockClipboard(() => Promise.reject(new Error('denied')));
    const status = document.createElement('span');
    await copyText('x', status);
    expect(status.textContent).toBe('Copy failed: denied');
  });

  it('does not overwrite a status that changed during the flash', async () => {
    mockClipboard(() => Promise.resolve());
    const status = document.createElement('span');
    await copyText('x', status);
    status.textContent = 'something newer';
    vi.advanceTimersByTime(1500);
    expect(status.textContent).toBe('something newer');
  });
});
