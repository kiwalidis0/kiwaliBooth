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
    sm: 'w-6 h-6 text-[11px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm',
  }[size];

  const textDimensions = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  }[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Crisp "KB" Letter Mark */}
      <div
        className={`${iconDimensions} rounded-lg bg-stone-900 text-white font-mono font-bold flex items-center justify-center tracking-tight transition-transform`}
        aria-label="Kiwalibooth KB Logo"
      >
        <span>KB</span>
      </div>

      {showText && (
        <span className={`font-fredoka font-semibold tracking-tight text-stone-900 ${textDimensions}`}>
          kiwalibooth
        </span>
      )}
    </div>
  );
};
