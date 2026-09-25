import React from 'react';
import { History, ArrowRight, X } from 'lucide-react';
import { useBooth } from '../context/useBooth';

export const SessionRestoreBanner: React.FC = () => {
  const { savedSession, restoreSession, discardSavedSession, step } = useBooth();

  // Only display on landing or layout step if an unexpired session exists
  if (!savedSession || (step !== 'landing' && step !== 'layout')) {
    return null;
  }

  const photoCount = savedSession.photos.length;
  const timeAgo = formatTimeAgo(savedSession.timestamp);

  return (
    <aside
      aria-label="Previous session recovery banner"
      className="w-full max-w-xl mx-auto mb-4 px-3"
    >
      <div className="bg-gradient-to-r from-theme-primary/15 via-theme-primary/10 to-stone-100 dark:to-stone-800 border border-theme-primary/30 rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-left">
          <div className="w-10 h-10 rounded-xl bg-theme-primary/20 text-theme-primary flex items-center justify-center shrink-0">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-fredoka font-semibold text-black dark:text-white">
              Resume Previous Session?
            </h4>
            <p className="text-[11px] text-stone-600 dark:text-stone-300">
              Found {photoCount} photo{photoCount === 1 ? '' : 's'} saved {timeAgo}.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
          <button
            onClick={discardSavedSession}
            aria-label="Discard previous session"
            title="Discard previous session"
            className="px-2.5 py-1.5 text-xs text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <button
            onClick={restoreSession}
            className="soft-btn-coral text-xs py-1.5 px-3.5 flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <span>Resume</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};

function formatTimeAgo(timestamp: number): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return 'yesterday';
}
