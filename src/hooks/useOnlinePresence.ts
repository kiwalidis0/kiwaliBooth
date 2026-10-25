import { useState, useEffect, useRef, useCallback } from 'react';
import type { joinRoom } from 'trystero';

export interface OnlinePresenceState {
  onlineCount: number;
  isOnline: boolean;
  isSupported: boolean;
  /** True only after the user has explicitly turned the live count on. */
  enabled: boolean;
  setEnabled: (value: boolean) => void;
}

const PRESENCE_APP_ID = 'kiwalibooth-live-presence-v1';
const PRESENCE_ROOM_ID = 'photobooth-lobby';
const PRESENCE_OPT_IN_KEY = 'kb_presence_optin';

function readOptIn(): boolean {
  try {
    return localStorage.getItem(PRESENCE_OPT_IN_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Optional live visitor count.
 *
 * Privacy: this is OFF by default. No network connection to peers or signaling
 * relays is made, and the networking library is not even loaded, until the user
 * explicitly opts in. Turning it off disconnects immediately.
 */
export function useOnlinePresence(): OnlinePresenceState {
  const [enabled, setEnabledState] = useState<boolean>(readOptIn);

  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
      return navigator.onLine;
    }
    return true;
  });

  const [onlineCount, setOnlineCount] = useState<number>(0);
  const [isSupported] = useState<boolean>(() => {
    return typeof window !== 'undefined' && typeof RTCPeerConnection !== 'undefined';
  });

  const roomRef = useRef<ReturnType<typeof joinRoom> | null>(null);

  const setEnabled = useCallback((value: boolean) => {
    setEnabledState(value);
    try {
      localStorage.setItem(PRESENCE_OPT_IN_KEY, String(value));
    } catch {
      // ignore storage errors
    }
    if (!value) setOnlineCount(0);
  }, []);

  // Monitor network connectivity changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      setOnlineCount(0);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Manage ephemeral peer-to-peer room (only after explicit opt-in)
  useEffect(() => {
    if (!enabled || !isOnline || !isSupported) {
      return;
    }

    let isSubscribed = true;
    let interval: ReturnType<typeof setInterval> | undefined;
    let handleBeforeUnload: (() => void) | undefined;

    const leaveRoom = () => {
      try {
        roomRef.current?.leave();
      } catch {
        // ignore
      }
      roomRef.current = null;
    };

    // Load the networking library lazily so nothing connects before opt-in.
    import('trystero')
      .then(({ joinRoom: join }) => {
        if (!isSubscribed) return;

        const room = join({ appId: PRESENCE_APP_ID }, PRESENCE_ROOM_ID);
        roomRef.current = room;

        const updateCount = () => {
          if (!isSubscribed) return;
          try {
            // Count = 1 (current device) + number of connected peers
            setOnlineCount(Object.keys(room.getPeers()).length + 1);
          } catch {
            // keep current count
          }
        };

        room.onPeerJoin = updateCount;
        room.onPeerLeave = updateCount;
        updateCount();

        // Periodic check in case of quiet peer drops
        interval = setInterval(updateCount, 10000);

        handleBeforeUnload = leaveRoom;
        window.addEventListener('beforeunload', handleBeforeUnload);
      })
      .catch((err) => {
        console.warn('[kiwalibooth] Live user count unavailable:', err);
      });

    return () => {
      isSubscribed = false;
      if (interval) clearInterval(interval);
      if (handleBeforeUnload) window.removeEventListener('beforeunload', handleBeforeUnload);
      leaveRoom();
    };
  }, [enabled, isOnline, isSupported]);

  return {
    onlineCount,
    isOnline,
    isSupported,
    enabled,
    setEnabled,
  };
}
