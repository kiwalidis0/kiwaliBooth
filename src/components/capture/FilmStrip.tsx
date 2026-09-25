import React from 'react';
import { X } from 'lucide-react';
import type { CapturedPhoto } from '../../types/photobooth';

interface FilmStripProps {
  photos: CapturedPhoto[];
  shotsCount: number;
  currentSlotTarget: number;
  onSelectSlot: (idx: number) => void;
  onDeleteSlot: (idx: number) => void;
}

/**
 * Horizontal scrollable thumbnail strip showing all photo slots.
 * Filled slots show the captured image; empty slots show a numbered placeholder.
 * Tapping a slot targets it for the next capture or retake.
 * The × button on a filled slot deletes it in-place.
 */
export const FilmStrip: React.FC<FilmStripProps> = ({
  photos,
  shotsCount,
  currentSlotTarget,
  onSelectSlot,
  onDeleteSlot,
}) => {
  if (photos.length === 0) return null;

  return (
    <div
      role="list"
      aria-label="Captured photos"
      className="w-full flex items-center gap-2 overflow-x-auto py-1.5 px-0.5 scroll-smooth"
      style={{ scrollbarWidth: 'none' }}
    >
      {Array.from({ length: shotsCount }).map((_, idx) => {
        const photo = photos.find(p => p.slotIndex === idx);
        const isCurrent = currentSlotTarget === idx;

        return (
          <div
            key={idx}
            role="listitem"
            className="relative flex-shrink-0"
          >
            <button
              onClick={() => onSelectSlot(idx)}
              aria-label={photo ? `Shot ${idx + 1} — tap to target` : `Shot ${idx + 1} — empty`}
              aria-current={isCurrent ? 'true' : undefined}
              className={[
                'relative w-14 h-14 rounded-lg overflow-hidden border-2 cursor-pointer transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-1',
                isCurrent
                  ? 'border-theme-primary ring-2 ring-theme-primary/30 scale-105'
                  : 'border-stone-200 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500',
              ].join(' ')}
            >
              {photo ? (
                <img
                  src={photo.dataUrl}
                  alt={`Shot ${idx + 1}`}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              ) : (
                <div className="w-full h-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                  <span className="text-[11px] font-fredoka font-semibold text-stone-400 dark:text-stone-500">
                    {idx + 1}
                  </span>
                </div>
              )}
            </button>

            {/* Delete button — only on filled slots */}
            {photo && (
              <button
                onClick={() => onDeleteSlot(idx)}
                aria-label={`Remove shot ${idx + 1}`}
                className={[
                  'absolute -top-1 -right-1 w-4 h-4 rounded-full',
                  'bg-stone-800/80 text-white flex items-center justify-center',
                  'hover:bg-red-600 transition-colors cursor-pointer',
                  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-400',
                ].join(' ')}
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};
