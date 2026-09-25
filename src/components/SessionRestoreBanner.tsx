import React from 'react';
import { History, ArrowRight } from 'lucide-react';
import { useBooth } from '../context/useBooth';
import type { BoothStep } from '../types/photobooth';

const STEP_LABELS: Record<BoothStep, string> = {
  landing: 'start',
  layout: 'layouts',
  capture: 'capture',
  review: 'review',
  editor: 'studio',
  download: 'save',
};

export const SessionRestoreBanner: React.FC = () => {
  const { savedSession, restoreSession, discardSavedSession, step } = useBooth();

  // Only display on landing or layout step if an unexpired session exists
  if (!savedSession || (step !== 'landing' && step !== 'layout')) {
    return null;
  }

  const photoCount = savedSession.photos.length;
  const timeAgo = formatTimeAgo(savedSession.timestamp);
  const stepLabel = STEP_LABELS[savedSession.step] ?? savedSession.step;
  const thumbs = [...savedSession.photos]
    .sort((a, b) => a.slotIndex - b.slotIndex)
    .slice(0, 4);

  return (
    <aside
      aria-label="Previous session recovery banner"
      className="w-full max-w-xl mx-auto mb-4 px-3"
    >
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-3 sm:p-3.5">
          {/* Row 1: identity left, photo proof right */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-theme-primary text-white flex items-center justify-center shrink-0 shadow-sm">
              <History className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <h4 className="text-xs sm:text-sm font-fredoka font-semibold text-black dark:text-white leading-tight">
                Resume previous session?
              </h4>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 font-sans mt-0.5">
                {photoCount} photo{photoCount === 1 ? '' : 's'} · {stepLabel} step · {timeAgo}
              </p>
            </div>
            {thumbs.length > 0 && (
              <div className="flex items-center shrink-0" aria-hidden>
                {thumbs.map((p, i) => (
                  <img
                    key={p.id}
                    src={p.dataUrl}
                    alt=""
                    loading="lazy"
                    className="w-9 h-9 rounded-xl object-cover border-2 border-white dark:border-stone-900 shadow-sm bg-stone-100 dark:bg-stone-800"
                    style={{ marginLeft: i === 0 ? 0 : -10, zIndex: thumbs.length - i }}
                  />
                ))}
                {photoCount > thumbs.length && (
                  <span className="ml-1 text-[10px] font-semibold text-stone-400 dark:text-stone-500">
                    +{photoCount - thumbs.length}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Row 2: actions, full-width touch targets */}
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={discardSavedSession}
              className="flex-1 min-h-10 px-3 rounded-xl text-xs font-semibold text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              Discard
            </button>
            <button
              onClick={restoreSession}
              className="flex-[2] min-h-10 soft-btn-coral text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span>Resume session</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

function formatTimeAgo(timestamp: number): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHours = Math.floor(diffMin / 60);
  // Sessions expire after 24h, so hours is the max unit
  return `${diffHours} hr ago`;
}
