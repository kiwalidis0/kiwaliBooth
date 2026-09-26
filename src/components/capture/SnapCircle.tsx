import React, { useState } from 'react';

interface SnapCircleProps {
  onSnap: () => void;
  disabled: boolean;
  countdown?: number | null;
}

/**
 * Photobooth Shutter Button
 * - High-contrast outer circular ring
 * - Rich pink primary capture core
 * - Integrated in-button countdown display (3 -> 2 -> 1)
 * - Smooth hover/pressed scale and ripple feedback
 */
export const SnapCircle: React.FC<SnapCircleProps> = ({ onSnap, disabled, countdown = null }) => {
  const [isRippling, setIsRippling] = useState(false);

  const handleClick = () => {
    if (disabled) return;
    setIsRippling(true);
    setTimeout(() => setIsRippling(false), 400);
    onSnap();
  };

  const isCountingDown = countdown !== null && countdown !== undefined;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label={isCountingDown ? `Countdown ${countdown}` : 'Take photo'}
      title="Take photo (Spacebar)"
      className={[
        'relative rounded-full flex items-center justify-center select-none cursor-pointer',
        'w-[76px] h-[76px] sm:w-[84px] sm:h-[84px]',
        'p-1.5 rounded-full border-2 transition-all duration-200 ease-out',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-theme-primary/50',
        disabled
          ? 'border-white/10 bg-white/5 opacity-40 cursor-not-allowed scale-100'
          : isCountingDown
          ? 'border-white/80 bg-theme-primary/20 scale-105 shadow-[0_0_20px_rgba(255,107,129,0.6)]'
          : 'border-white/40 bg-white/10 hover:border-white/70 hover:scale-[1.03] active:scale-[0.96] shadow-xl',
      ].join(' ')}
    >
      {/* Pink primary capture disc */}
      <span
        className={[
          'w-full h-full rounded-full flex items-center justify-center transition-all duration-200',
          disabled
            ? 'bg-stone-600'
            : isCountingDown
            ? 'bg-theme-primary shadow-[0_0_15px_rgba(255,107,129,0.8)]'
            : 'bg-theme-primary shadow-[0_2px_12px_rgba(255,107,129,0.4)] hover:brightness-105',
          isRippling ? 'scale-90 brightness-110' : '',
        ].join(' ')}
      >
        {isCountingDown ? (
          <span className="font-fredoka font-bold text-3xl sm:text-4xl text-white drop-shadow-md animate-pulse">
            {countdown > 0 ? countdown : ''}
          </span>
        ) : (
          /* Slightly lighter inner accent circle */
          <span
            className={[
              'w-[46px] h-[46px] sm:w-[50px] sm:h-[50px] rounded-full transition-all duration-200',
              disabled ? 'bg-stone-500/30' : 'bg-white/20 border border-white/25',
            ].join(' ')}
          />
        )}
      </span>

      {/* Ripple ring on capture */}
      {isRippling && (
        <span className="absolute inset-0 rounded-full border-2 border-theme-primary animate-ping pointer-events-none" />
      )}
      {isCountingDown && (
        <span className="absolute -inset-1 rounded-full border-2 border-white/60 animate-pulse pointer-events-none" />
      )}
    </button>
  );
};

