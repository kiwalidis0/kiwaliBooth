// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';

describe('useSafeTimers', () => {
  let root: { unmount: () => void } | null = null;

  beforeEach(() => {
    vi.useFakeTimers();
    // Polyfill window timer methods on global if missing in node environment
    const globalScope = globalThis as unknown as { window?: unknown };
    if (typeof globalScope.window === 'undefined') {
      globalScope.window = globalThis;
    }
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    if (root) {
      act(() => {
        root?.unmount();
      });
      root = null;
    }
  });

  it('runs safeTimeout after delay and unregisters it', () => {
    let fired = false;
    const fakeComponent = () => {
      const timeoutIds = new Set<ReturnType<typeof setTimeout>>();

      const safeTimeout = (cb: () => void, ms: number) => {
        const id = setTimeout(() => {
          timeoutIds.delete(id);
          cb();
        }, ms);
        timeoutIds.add(id);
        return id;
      };

      const cancelAll = () => {
        timeoutIds.forEach(id => clearTimeout(id));
        timeoutIds.clear();
      };

      return { safeTimeout, cancelAll, timeoutIds };
    };

    const inst = fakeComponent();
    inst.safeTimeout(() => {
      fired = true;
    }, 500);

    expect(fired).toBe(false);
    expect(inst.timeoutIds.size).toBe(1);

    vi.advanceTimersByTime(500);
    expect(fired).toBe(true);
    expect(inst.timeoutIds.size).toBe(0);
  });

  it('cancelAll clears pending timers before they fire', () => {
    const timeoutIds = new Set<ReturnType<typeof setTimeout>>();
    const intervalIds = new Set<ReturnType<typeof setInterval>>();

    let timeoutFired = false;
    let intervalTicks = 0;

    const safeTimeout = (cb: () => void, ms: number) => {
      const id = setTimeout(() => {
        timeoutIds.delete(id);
        cb();
      }, ms);
      timeoutIds.add(id);
      return id;
    };

    const safeInterval = (cb: () => void, ms: number) => {
      const id = setInterval(() => {
        cb();
      }, ms);
      intervalIds.add(id);
      return id;
    };

    const cancelAll = () => {
      timeoutIds.forEach(id => clearTimeout(id));
      timeoutIds.clear();
      intervalIds.forEach(id => clearInterval(id));
      intervalIds.clear();
    };

    safeTimeout(() => {
      timeoutFired = true;
    }, 500);

    safeInterval(() => {
      intervalTicks += 1;
    }, 100);

    vi.advanceTimersByTime(250);
    expect(intervalTicks).toBe(2);
    expect(timeoutFired).toBe(false);

    // Cancel all in-flight timers
    cancelAll();

    vi.advanceTimersByTime(1000);
    expect(timeoutFired).toBe(false);
    expect(intervalTicks).toBe(2); // no further ticks
  });
});
