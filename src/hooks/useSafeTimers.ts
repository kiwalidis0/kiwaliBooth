import { useCallback, useEffect, useRef } from 'react';

export interface SafeTimers {
  safeTimeout: (callback: () => void, delayMs: number) => number;
  safeInterval: (callback: () => void, intervalMs: number) => number;
  clearTimer: (id: number | null | undefined) => void;
  cancelAll: () => void;
}

/**
 * Hook to manage asynchronous timers and intervals safely.
 * All active timers are automatically cleared on unmount.
 * Timers can also be aborted en-masse via `cancelAll()`.
 */
export function useSafeTimers(): SafeTimers {
  const timeoutIdsRef = useRef<Set<number>>(new Set());
  const intervalIdsRef = useRef<Set<number>>(new Set());

  const clearTimer = useCallback((id: number | null | undefined) => {
    if (id === null || id === undefined) return;
    if (timeoutIdsRef.current.has(id)) {
      window.clearTimeout(id);
      timeoutIdsRef.current.delete(id);
    }
    if (intervalIdsRef.current.has(id)) {
      window.clearInterval(id);
      intervalIdsRef.current.delete(id);
    }
  }, []);

  const cancelAll = useCallback(() => {
    timeoutIdsRef.current.forEach(id => window.clearTimeout(id));
    timeoutIdsRef.current.clear();

    intervalIdsRef.current.forEach(id => window.clearInterval(id));
    intervalIdsRef.current.clear();
  }, []);

  const safeTimeout = useCallback((callback: () => void, delayMs: number): number => {
    const id = window.setTimeout(() => {
      timeoutIdsRef.current.delete(id);
      callback();
    }, delayMs);
    timeoutIdsRef.current.add(id);
    return id;
  }, []);

  const safeInterval = useCallback((callback: () => void, intervalMs: number): number => {
    const id = window.setInterval(() => {
      callback();
    }, intervalMs);
    intervalIdsRef.current.add(id);
    return id;
  }, []);

  useEffect(() => {
    return () => {
      cancelAll();
    };
  }, [cancelAll]);

  return {
    safeTimeout,
    safeInterval,
    clearTimer,
    cancelAll,
  };
}
