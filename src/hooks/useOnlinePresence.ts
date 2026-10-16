import { useState, useEffect, useRef } from 'react';
import { joinRoom } from 'trystero';

export interface OnlinePresenceState {
  onlineCount: number;
  isOnline: boolean;
  isSupported: boolean;
}

const PRESENCE_APP_ID = 'kiwalibooth-live-presence-v1';
const PRESENCE_ROOM_ID = 'photobooth-lobby';

export function useOnlinePresence(): OnlinePresenceState {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
      return navigator.onLine;
    }
    return true;
  });

  const [onlineCount, setOnlineCount] = useState<number>(() => (isOnline ? 1 : 0));
  const [isSupported] = useState<boolean>(() => {
    return typeof window !== 'undefined' && typeof RTCPeerConnection !== 'undefined';
  });

  const roomRef = useRef<ReturnType<typeof joinRoom> | null>(null);

  // Monitor network connectivity changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      setOnlineCount(prev => Math.max(1, prev));
    };

    const handleOffline = () => {
      setIsOnline(false);
      setOnlineCount(0);
      if (roomRef.current) {
        try {
          roomRef.current.leave();
        } catch {
          // ignore
        }
        roomRef.current = null;
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Manage ephemeral peer-to-peer room
  useEffect(() => {
    if (!isOnline || !isSupported) {
      return;
    }

    let isSubscribed = true;

    try {
      const room = joinRoom({ appId: PRESENCE_APP_ID }, PRESENCE_ROOM_ID);
      roomRef.current = room;

      const updateCount = () => {
        if (!isSubscribed) return;
        try {
          const peers = room.getPeers();
          const peerCount = Object.keys(peers).length;
          // Count = 1 (current device) + number of connected peers
          setOnlineCount(peerCount + 1);
        } catch {
          // keep current count
        }
      };

      room.onPeerJoin = () => {
        updateCount();
      };

      room.onPeerLeave = () => {
        updateCount();
      };

      // Periodic check in case of quiet peer drops
      const interval = setInterval(updateCount, 10000);

      // Clean departure handler
      const handleBeforeUnload = () => {
        try {
          room.leave();
        } catch {
          // ignore
        }
      };
      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        isSubscribed = false;
        clearInterval(interval);
        window.removeEventListener('beforeunload', handleBeforeUnload);
        try {
          room.leave();
        } catch {
          // ignore
        }
        roomRef.current = null;
      };
    } catch (err) {
      console.warn('[kiwalibooth] Ephemeral presence signaling unavailable:', err);
    }
  }, [isOnline, isSupported]);

  return {
    onlineCount,
    isOnline,
    isSupported,
  };
}
