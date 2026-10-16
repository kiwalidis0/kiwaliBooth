import React from 'react';
import { Users, WifiOff } from 'lucide-react';
import { useOnlinePresence } from '../hooks/useOnlinePresence';

interface OnlineUsersBadgeProps {
  className?: string;
  onOpenPrivacy?: () => void;
}

export const OnlineUsersBadge: React.FC<OnlineUsersBadgeProps> = ({
  className = '',
  onOpenPrivacy,
}) => {
  const { onlineCount, isOnline } = useOnlinePresence();

  const label = isOnline
    ? `${onlineCount} active ${onlineCount === 1 ? 'user' : 'users'}`
    : 'Offline mode';

  return (
    <button
      type="button"
      onClick={onOpenPrivacy}
      title={
        isOnline
          ? `${onlineCount} active ${onlineCount === 1 ? 'user' : 'users'} connected right now via decentralized peer presence (zero database). Click to view privacy policy.`
          : 'You are offline. Kiwalibooth functions 100% locally on your device without internet. Click to view privacy architecture.'
      }
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold cursor-pointer transition-colors select-none ${
        isOnline
          ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:border-emerald-300 dark:hover:border-emerald-800 hover:bg-emerald-100/50'
          : 'border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:border-stone-300'
      } ${className}`}
    >
      {isOnline ? (
        <>
          <span className="relative flex h-2 w-2 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="font-sans font-semibold tracking-tight">
            {label}
          </span>
        </>
      ) : (
        <>
          <span className="inline-flex rounded-full h-2 w-2 bg-stone-400 dark:bg-stone-500 flex-shrink-0" />
          <WifiOff className="w-3.5 h-3.5 text-stone-500" />
          <span className="font-sans font-semibold">{label}</span>
        </>
      )}
    </button>
  );
};
