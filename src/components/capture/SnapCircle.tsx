import React, { useState } from 'react';

interface SnapCircleProps {
  onSnap: () => void;
  disabled: boolean;
}

/**
 * Photobooth Shutter Button
 * - High-contrast outer circular ring
 * - Rich pink primary capture core
 * - Subtle lighter inner disc
 * - Smooth hover/pressed scale and ripple feedback
 */
export const SnapCircle: React.FC<SnapCircleProps> = ({ onSnap, disabled }) => {
  const [isRippling, setIsRippling] = useState(false);

  const handleClick = () => {
    if (disabled) return;
    setIsRippling(true);
    setTimeout(() => setIsRippling(false), 400);
    onSnap();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label="Take photo"
      title="Take photo (Spacebar)"
      className={[
        'relative rounded-full flex items-center justify-center select-none cursor-pointer',
        'w-[74px] h-[74px] sm:w-[80px] sm:h-[80px]',
        'p-1.5 rounded-full border-2 transition-all duration-200 ease-out',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-theme-primary/50',
        disabled
          ? 'border-white/10 bg-white/5 opacity-40 cursor-not-allowed scale-100'
          : 'border-white/40 bg-white/10 hover:border-white/70 hover:scale-[1.03] active:scale-[0.96] shadow-xl',
      ].join(' ')}
    >
      {/* Pink primary capture disc */}
      <span
        className={[
          'w-full h-full rounded-full flex items-center justify-center transition-all duration-200',
          disabled
            ? 'bg-stone-600'
            : 'bg-theme-primary shadow-[0_2px_12px_rgba(255,107,129,0.4)] hover:brightness-105',
          isRippling ? 'scale-90 brightness-110' : '',
        ].join(' ')}
      >
        {/* Slightly lighter inner accent circle */}
        <span
          className={[
            'w-[46px] h-[46px] sm:w-[50px] sm:h-[50px] rounded-full transition-all duration-200',
            disabled ? 'bg-stone-500/30' : 'bg-white/20 border border-white/25',
          ].join(' ')}
        />
      </span>

      {/* Ripple ring on capture */}
      {isRippling && (
        <span className="absolute inset-0 rounded-full border-2 border-theme-primary animate-ping pointer-events-none" />
      )}
    </button>
  );
};
