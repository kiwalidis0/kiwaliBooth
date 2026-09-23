import React from 'react';

interface FooterProps {
  onOpenPrivacy?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenPrivacy }) => {
  return (
    <footer className="mt-auto border-t border-stone-200 dark:border-stone-800 py-6 px-4 bg-white dark:bg-stone-900 transition-colors">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500 dark:text-stone-400 font-sans">
        <span className="font-fredoka font-semibold text-stone-800 dark:text-white text-sm">
          kiwalibooth
        </span>

        <div className="flex items-center gap-4 text-xs">
          <button
            onClick={onOpenPrivacy}
            className="hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer underline underline-offset-2"
          >
            Privacy Policy
          </button>
          <span>•</span>
          <a
            href="https://www.andreas-luy.me/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-stone-900 dark:hover:text-white transition-colors underline underline-offset-2"
          >
            andreas-luy.me
          </a>
        </div>
      </div>
    </footer>
  );
};
