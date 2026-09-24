import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
}) => {
  const iconDimensions = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  }[size];

  const textDimensions = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  }[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Official Kiwalibooth SVG Mark - Dynamically recolors with selected theme */}
      <svg
        viewBox="0 0 750 750"
        className={`${iconDimensions} flex-shrink-0 transition-transform group-hover:scale-105`}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <clipPath id="kb-outer-card">
            <path d="M 150 65.171875 L 600 65.171875 C 619.890625 65.171875 638.96875 73.074219 653.03125 87.140625 C 667.097656 101.207031 675 120.28125 675 140.171875 L 675 609.828125 C 675 629.71875 667.097656 648.792969 653.03125 662.859375 C 638.96875 676.925781 619.890625 684.828125 600 684.828125 L 150 684.828125 C 130.109375 684.828125 111.03125 676.925781 96.96875 662.859375 C 82.902344 648.792969 75 629.71875 75 609.828125 L 75 140.171875 C 75 120.28125 82.902344 101.207031 96.96875 87.140625 C 111.03125 73.074219 130.109375 65.171875 150 65.171875 Z" />
          </clipPath>
          <clipPath id="kb-inner-window">
            <path d="M 170.1875 108.933594 L 579.8125 108.933594 C 593.738281 108.933594 607.089844 114.464844 616.9375 124.3125 C 626.78125 134.15625 632.3125 147.511719 632.3125 161.433594 L 632.3125 512.703125 C 632.3125 526.625 626.78125 539.980469 616.9375 549.824219 C 607.089844 559.671875 593.738281 565.203125 579.8125 565.203125 L 170.1875 565.203125 C 156.261719 565.203125 142.910156 559.671875 133.0625 549.824219 C 123.21875 539.980469 117.6875 526.625 117.6875 512.703125 L 117.6875 161.433594 C 117.6875 147.511719 123.21875 134.15625 133.0625 124.3125 C 142.910156 114.464844 156.261719 108.933594 170.1875 108.933594 Z" />
          </clipPath>
        </defs>

        {/* Outer Photobooth Frame - Dynamically takes active theme color */}
        <g clipPath="url(#kb-outer-card)">
          <rect x="0" y="0" width="750" height="750" fill="var(--theme-primary, #FF6B81)" />
        </g>

        {/* Inner Photo Window (Crisp White) */}
        <g clipPath="url(#kb-inner-window)">
          <rect x="0" y="0" width="750" height="750" fill="#FFFFFF" />
        </g>

        {/* Figure 1 (Left): Head & Torso - Dynamically themed */}
        <path
          d="M 285.238281 224.578125 C 236.753906 224.578125 197.488281 263.847656 197.488281 312.328125 C 197.488281 360.808594 236.753906 400.078125 285.238281 400.078125 C 333.71875 400.078125 372.988281 360.808594 372.988281 312.328125 C 372.988281 263.847656 333.71875 224.578125 285.238281 224.578125 Z"
          fill="var(--theme-primary, #FF6B81)"
        />
        <path
          d="M 285.125 355.257812 L 414.429688 581.542969 L 155.816406 581.542969 Z"
          fill="var(--theme-primary, #FF6B81)"
        />

        {/* Figure 2 (Right): Head & Torso - Dynamically themed */}
        <path
          d="M 476.4375 292.125 C 432.511719 292.125 396.9375 327.703125 396.9375 371.625 C 396.9375 415.546875 432.511719 451.125 476.4375 451.125 C 520.359375 451.125 555.9375 415.546875 555.9375 371.625 C 555.9375 327.703125 520.359375 292.125 476.4375 292.125 Z"
          fill="var(--theme-primary, #FF6B81)"
        />
        <path
          d="M 476.617188 410.9375 L 594.183594 616.675781 L 359.050781 616.675781 Z"
          fill="var(--theme-primary, #FF6B81)"
        />
      </svg>

      {showText && (
        <span className={`font-fredoka font-semibold tracking-tight text-theme-primary ${textDimensions}`}>
          kiwalibooth
        </span>
      )}
    </div>
  );
};
