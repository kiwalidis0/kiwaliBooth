import React from 'react';

interface SnapCircleProps {
  onSnap: () => void;
  disabled: boolean;
}

/**
 * In-viewfinder shutter button — 72px circle with white ring and theme-colored core.
 * Replaces the old "Snap Now" secondary button for native camera ergonomics.
 * Keyboard: Spacebar triggers onSnap (bound in CaptureScreen).
 */
export const SnapCircle: React.FC<SnapCircleProps> = ({ onSnap, disabled }) => (
  <button
    onClick={onSnap}
    disabled={disabled}
    aria-label="Take photo now"
    className={[
      'w-[72px] h-[72px] rounded-full flex items-center justify-center',
      'ring-4 shadow-2xl transition-all duration-150 cursor-pointer select-none',
      'focus-visible:outline-none focus-visible:ring-[6px] focus-visible:ring-white',
      disabled
        ? 'bg-stone-400 ring-stone-400/60 cursor-not-allowed'
        : 'bg-theme-primary ring-white/80 hover:bg-theme-primary-hover active:scale-95',
    ].join(' ')}
  >
    {/* Inner frosted disc */}
    <span
      className={[
        'w-[52px] h-[52px] rounded-full block transition-all duration-150',
        disabled ? 'bg-stone-300/50' : 'bg-white/25',
      ].join(' ')}
    />
  </button>
);
