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
      {/* Official Kiwalibooth SVG Mark */}
      <img
        src="/kiwalibooth.svg"
        alt="Kiwalibooth Logo"
        className={`${iconDimensions} object-contain flex-shrink-0 transition-transform group-hover:scale-105`}
      />

      {showText && (
        <span className={`font-fredoka font-semibold tracking-tight text-stone-900 dark:text-white ${textDimensions}`}>
          kiwalibooth
        </span>
      )}
    </div>
  );
};
