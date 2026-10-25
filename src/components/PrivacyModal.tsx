import React, { useEffect } from 'react';
import { X, Lock, EyeOff, Trash2, Users } from 'lucide-react';

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
                Privacy Policy
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
                In plain words: what happens to your photos and your data
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
                Your photos stay on your device
              </h4>

              <p>
                Taking photos, adding filters and stickers, and saving your strip all happen inside your own browser. Kiwalibooth has no server that receives your pictures, so we never see them. Your camera is only used while you are taking photos, and the video is never recorded or sent anywhere.
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
                No accounts, no tracking
              </h4>

              <p>
                You do not need to sign up, and we do not use advertising or analytics trackers. Your photos are never uploaded. The only things the app loads from the internet are its text fonts (from Google Fonts, which means Google can see that your device requested them), and the optional live user count described below, which is off unless you turn it on.
              </p>
            </div>
          </div>

          {/* Privacy Item: Database-Free Live Online Count */}
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
              <Users className="w-4 h-4 text-theme-primary" />
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
                Live user count (optional, off by default)
              </h4>

              <p>
                The home page can show how many people are using Kiwalibooth right now. This only works if you choose to turn it on, and it is off until you do. If you turn it on, your device connects to public servers and to other visitors who also turned it on. Because that is how the internet works, those servers and other visitors may be able to see your internet address (IP address), like any website you visit. Your photos, name and other details are never shared, and we do not keep any record of who connected. You can turn it off at any time from the home page, and it disconnects right away. The app works the same whether it is on or off.
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
                Saved on your device, and easy to delete
              </h4>

              <p>
                So you do not lose your work if the page refreshes, your photos and edits are saved in your browser's storage on this device for up to 24 hours. Choosing "Shoot Another" or "Discard" deletes them immediately, and you can also clear this site's data in your browser settings. Your settings (such as theme and dark mode) are remembered the same way. We do not use cookies. If you share this device with someone else, choose "Discard" when you are done.
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
              Want to check for yourself?
            </strong>{' '}
            Kiwalibooth is open source under the MIT license, so anyone can read exactly what the code does. If you are technical, your browser's developer tools show what is stored on your device and confirm that no photos are sent over the network.
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
              soft-btn-coral
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