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
  
  // Cap at 4 thumbnails to prevent overflow
  const thumbs = [...savedSession.photos]
    .sort((a, b) => a.slotIndex - b.slotIndex)
    .slice(0, 4);

  return (
    <aside
      aria-label="Previous session recovery banner"
      className="w-full max-w-xl mx-auto mt-6 mb-4 px-3 animate-in fade-in slide-in-from-top-4 duration-300 ease-out"
    >
      <div className="bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-[20px] shadow-sm overflow-hidden">
        <div className="p-4">
          {/* Row 1: identity left, photo proof right */}
          <div className="flex items-center gap-3.5">
            {/* Soft pink/coral squircle icon */}
            <div className="w-11 h-11 rounded-2xl bg-rose-400 dark:bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <History className="w-5 h-5 stroke-[2.5]" />
            </div>
            
            <div className="flex-1 min-w-0 text-left">
              <h4 className="text-[14px] font-bold text-stone-900 dark:text-white leading-tight tracking-tight">
                Resume previous session?
              </h4>
              <p className="text-[13px] text-stone-500 dark:text-stone-400 font-medium mt-0.5">
                {photoCount} photo{photoCount === 1 ? '' : 's'} · {stepLabel} step · {timeAgo}
              </p>
            </div>

            {/* Overlapping Thumbnails using Tailwind -space-x */}
            {thumbs.length > 0 && (
              <div className="flex items-center -space-x-2.5 shrink-0" aria-hidden>
                {thumbs.map((p, i) => (
                  <img
                    key={p.id}
                    src={p.dataUrl}
                    alt=""
                    loading="lazy"
                    // zIndex applied inline to ensure first image stays on top visually
                    style={{ zIndex: thumbs.length - i }}
                    className="relative w-10 h-10 rounded-lg object-cover border-[2.5px] border-white dark:border-stone-900 shadow-sm bg-stone-100 dark:bg-stone-800"
                  />
                ))}
                {photoCount > thumbs.length && (
                  <span className="relative z-0 ml-3 text-[11px] font-bold text-stone-400 dark:text-stone-500">
                    +{photoCount - thumbs.length}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Row 2: actions, full-width touch targets */}
          <div className="flex items-center gap-2.5 mt-4">
            <button
              onClick={discardSavedSession}
              className="flex-1 min-h-[42px] px-4 rounded-xl text-[13.5px] font-semibold text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:text-stone-900 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-stone-800 transition-all cursor-pointer active:scale-[0.98]"
            >
              Discard
            </button>
            <button
              onClick={restoreSession}
              className="flex-[2] min-h-[42px] bg-rose-400 hover:bg-rose-500 dark:bg-rose-500 dark:hover:bg-rose-600 text-white rounded-xl text-[13.5px] font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-[0.98]"
            >
              <span>Resume session</span>
              <ArrowRight className="w-4 h-4" />
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
  return `${diffHours} hr ago`;
}