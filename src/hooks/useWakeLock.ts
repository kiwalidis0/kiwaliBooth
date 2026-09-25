import { useRef, useCallback } from 'react';

/**
 * Acquires and releases a Screen Wake Lock to prevent the display from sleeping
 * during multi-shot capture sequences.
 *
 * Fails silently on unsupported browsers (Firefox desktop, older Safari).
 * NotAllowedError is swallowed — low battery or hidden tab prevents lock acquisition.
 */
export function useWakeLock() {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);

  const acquire = useCallback(async () => {
    if (!('wakeLock' in navigator)) return;
    try {
      sentinelRef.current = await navigator.wakeLock.request('screen');
    } catch {
      // NotAllowedError: low battery, document not visible — silently ignore
    }
  }, []);

  const release = useCallback(() => {
    sentinelRef.current?.release().catch(() => {});
    sentinelRef.current = null;
  }, []);

  return { acquire, release };
}
