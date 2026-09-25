import React, { useEffect } from 'react';
import { X, Lock, EyeOff, Trash2 } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  // Handle Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="
        fixed inset-0 z-[100]
        flex items-center justify-center
        p-4 sm:p-6
        bg-black/40 dark:bg-black/60
        backdrop-blur-md
        animate-in fade-in duration-200
      "
      onClick={onClose}
      aria-hidden="true"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
        className="
          relative w-full max-w-lg
          max-h-[calc(100vh-2rem)]
          flex flex-col
          overflow-hidden
          rounded-2xl
          bg-white dark:bg-stone-900
          border border-stone-200/80 dark:border-stone-800
          shadow-2xl shadow-black/10 dark:shadow-black/40
          animate-in zoom-in-95 duration-200
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header
          className="
            flex items-start justify-between gap-4
            px-5 py-4 sm:px-6 sm:py-5
            border-b border-stone-100 dark:border-stone-800
            bg-white dark:bg-stone-900
          "
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <h3
                id="modal-title"
                className="
                  font-fredoka font-semibold
                  text-base sm:text-lg
                  text-theme-primary
                  leading-tight
                "
              >
                Privacy Policy &amp; Architecture
              </h3>

              <p
                id="modal-description"
                className="
                  mt-0.5
                  text-[10px] sm:text-[11px]
                  text-black dark:text-stone-300
                  leading-relaxed
                "
              >
                How Kiwalibooth protects your photos &amp; webcam
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close privacy modal"
            className="
              w-8 h-8
              rounded-lg
              shrink-0
              border border-stone-200 dark:border-stone-700
              bg-white dark:bg-stone-900
              flex items-center justify-center
              text-stone-500 dark:text-stone-400
              hover:bg-stone-50 dark:hover:bg-stone-800
              hover:text-black dark:hover:text-white
              hover:border-stone-300 dark:hover:border-stone-600
              focus:outline-none
              focus-visible:ring-2
              focus-visible:ring-theme-primary
              focus-visible:ring-offset-2
              dark:focus-visible:ring-offset-stone-900
              cursor-pointer
              transition-all duration-200
              active:scale-95
            "
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        {/* Content */}
        <main
          className="
            flex-1
            py-4 px-5 sm:px-6
            space-y-3
            text-xs
            text-black dark:text-stone-200
            leading-relaxed
            max-h-[60vh]
            overflow-y-auto
            font-sans
            custom-scrollbar
          "
        >
          {/* Privacy Item */}
          <div
            className="
              group
              flex items-start gap-3
              p-3
              rounded-xl
              border border-transparent
              hover:border-stone-100 dark:hover:border-stone-800
              hover:bg-stone-50/70 dark:hover:bg-stone-800/40
              transition-colors duration-200
            "
          >
            <div className="mt-0.5 shrink-0">
              <Lock className="w-4 h-4 text-theme-primary" />
            </div>

            <div className="min-w-0">
              <h4
                className="
                  font-fredoka font-semibold
                  text-black dark:text-white
                  text-sm
                  mb-1
                  leading-snug
                "
              >
                100% In-Browser Memory Processing
              </h4>

              <p>
                Every photo capture, webcam stream, canvas filter, sticker, and strip export operates exclusively in your device's local browser RAM via the HTML5 Canvas API.
              </p>
            </div>
          </div>

          {/* Privacy Item */}
          <div
            className="
              group
              flex items-start gap-3
              p-3
              rounded-xl
              border border-transparent
              hover:border-stone-100 dark:hover:border-stone-800
              hover:bg-stone-50/70 dark:hover:bg-stone-800/40
              transition-colors duration-200
            "
          >
            <div className="mt-0.5 shrink-0">
              <EyeOff className="w-4 h-4 text-theme-primary" />
            </div>

            <div className="min-w-0">
              <h4
                className="
                  font-fredoka font-semibold
                  text-black dark:text-white
                  text-sm
                  mb-1
                  leading-snug
                "
              >
                Zero Cloud Uploads &amp; Zero External Servers
              </h4>

              <p>
                Kiwalibooth has no backend server or cloud database. Not a single byte of your webcam capture or generated photostrip ever leaves your computer or phone.
              </p>
            </div>
          </div>

          {/* Privacy Item */}
          <div
            className="
              group
              flex items-start gap-3
              p-3
              rounded-xl
              border border-transparent
              hover:border-stone-100 dark:hover:border-stone-800
              hover:bg-stone-50/70 dark:hover:bg-stone-800/40
              transition-colors duration-200
            "
          >
            <div className="mt-0.5 shrink-0">
              <Trash2 className="w-4 h-4 text-theme-primary" />
            </div>

            <div className="min-w-0">
              <h4
                className="
                  font-fredoka font-semibold
                  text-black dark:text-white
                  text-sm
                  mb-1
                  leading-snug
                "
              >
                Instant Automatic Memory Clearance
              </h4>

              <p>
                Closing the tab or clicking "Shoot Another" immediately purges all recorded frames and canvas buffers from memory. Nothing is retained in local storage or cookies.
              </p>
            </div>
          </div>

          {/* Technical Note */}
          <div
            className="
              mt-1
              p-3 sm:p-3.5
              rounded-xl
              bg-stone-50 dark:bg-stone-800/70
              border border-stone-200 dark:border-stone-700
              text-[11px]
              text-black dark:text-stone-300
              leading-relaxed
            "
          >
            <strong className="font-semibold text-black dark:text-stone-200">
              Technical Note:
            </strong>{' '}
            Built on open-source web primitives (WebRTC, HTML5 Canvas, Konva). You can inspect browser network traffic in DevTools to confirm zero external image transmissions.
          </div>
        </main>

        {/* Footer */}
        <footer
          className="
            px-5 py-3 sm:px-6 sm:py-4
            border-t border-stone-100 dark:border-stone-800
            bg-white dark:bg-stone-900
            flex justify-end
          "
        >
          <button
            onClick={onClose}
            className="
              soft-btn-primary
              text-xs
              py-2 px-5
              rounded-lg
              cursor-pointer
              transition-all duration-200
              hover:-translate-y-0.5
              active:translate-y-0
              active:scale-95
              focus:outline-none
              focus-visible:ring-2
              focus-visible:ring-theme-primary
              focus-visible:ring-offset-2
              dark:focus-visible:ring-offset-stone-900
            "
          >
            Understood
          </button>
        </footer>
      </div>
    </div>
  );
};