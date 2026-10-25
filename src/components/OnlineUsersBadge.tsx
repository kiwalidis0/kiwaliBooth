import React, { useEffect, useRef, useState } from 'react';
import { Users, WifiOff, X } from 'lucide-react';
import { useOnlinePresence } from '../hooks/useOnlinePresence';

interface OnlineUsersBadgeProps {
  className?: string;
  onOpenPrivacy?: () => void;
}

export const OnlineUsersBadge: React.FC<OnlineUsersBadgeProps> = ({
  className = '',
  onOpenPrivacy,
}) => {
  const { onlineCount, isOnline, isSupported, enabled, setEnabled } = useOnlinePresence();
  const [panelOpen, setPanelOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close the panel on outside click or Escape
  useEffect(() => {
    if (!panelOpen) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPanelOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [panelOpen]);

  // Browsers without WebRTC cannot use this feature at all
  if (!isSupported) return null;

  const isLive = enabled && isOnline;
  const count = Math.max(onlineCount, 1);

  let label: string;
  if (!enabled) label = 'Live user count: off';
  else if (!isOnline) label = 'Offline mode';
  else label = `${count} active ${count === 1 ? 'user' : 'users'}`;

  const pillClasses = isLive
    ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:border-emerald-300 dark:hover:border-emerald-800 hover:bg-emerald-100/50'
    : 'border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:border-stone-300';

  return (
    <div ref={wrapperRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setPanelOpen((open) => !open)}
        aria-expanded={panelOpen}
        aria-haspopup="dialog"
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold cursor-pointer transition-colors select-none ${pillClasses}`}
      >
        {isLive ? (
          <>
            <span className="relative flex h-2 w-2 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </>
        ) : (
          <>
            <span className="inline-flex rounded-full h-2 w-2 bg-stone-400 dark:bg-stone-500 flex-shrink-0" />
            {enabled && !isOnline ? (
              <WifiOff className="w-3.5 h-3.5 text-stone-500" />
            ) : (
              <Users className="w-3.5 h-3.5 text-stone-500" />
            )}
          </>
        )}
        <span className="font-sans font-semibold tracking-tight">{label}</span>
      </button>

      {panelOpen && (
        <div
          role="dialog"
          aria-label="Live user count settings"
          className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 w-72 max-w-[calc(100vw-2rem)] p-4 text-left rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-xl text-xs leading-relaxed text-black dark:text-stone-200"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="font-fredoka font-semibold text-sm">Live user count (optional)</h4>
            <button
              type="button"
              onClick={() => setPanelOpen(false)}
              aria-label="Close"
              className="shrink-0 text-stone-500 hover:text-black dark:hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {enabled ? (
            <>
              <p className="mb-2">
                This is currently <strong>on</strong>. Your device is connected to public servers and to other visitors who
                also turned this on, so we can show how many people are here.
              </p>
              <p className="mb-3">
                Other visitors and those public servers can see your internet address (IP address). Your photos, name and
                other details are never shared.
              </p>
              <button
                type="button"
                onClick={() => {
                  setEnabled(false);
                  setPanelOpen(false);
                }}
                className="w-full py-2 rounded-lg border border-stone-300 dark:border-stone-600 font-semibold cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800"
              >
                Turn off and disconnect
              </button>
            </>
          ) : (
            <>
              <p className="mb-2">
                This is <strong>off</strong>, and nothing is connected. If you turn it on, your device will connect to
                public servers and to other visitors, just to count how many people are here.
              </p>
              <p className="mb-2">
                <strong>What this means for you:</strong> other visitors and those public servers may be able to see your
                internet address (IP address), similar to any website you visit. Your photos, name and other details are
                never shared.
              </p>
              <p className="mb-3">You can turn it off at any time, and it disconnects right away. The app works the same either way.</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPanelOpen(false)}
                  className="flex-1 py-2 rounded-lg border border-stone-300 dark:border-stone-600 font-semibold cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800"
                >
                  Not now
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEnabled(true);
                    setPanelOpen(false);
                  }}
                  className="flex-1 py-2 rounded-lg soft-btn-coral font-semibold cursor-pointer"
                >
                  Turn on
                </button>
              </div>
            </>
          )}

          {onOpenPrivacy && (
            <button
              type="button"
              onClick={() => {
                setPanelOpen(false);
                onOpenPrivacy();
              }}
              className="mt-3 underline text-theme-primary font-semibold cursor-pointer"
            >
              Read the full privacy policy
            </button>
          )}
        </div>
      )}
    </div>
  );
};
