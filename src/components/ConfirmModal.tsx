import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Discard Pictures',
  cancelLabel = 'Stay in Booth',
  onConfirm,
  onCancel,
}) => {
  // Close with Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onCancel]);

  // Prevent background scrolling while modal is open
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="
        fixed inset-0 z-[100]
        flex items-center justify-center
        p-4 sm:p-6
        bg-black/45 dark:bg-black/60
        backdrop-blur-md
        animate-in fade-in duration-200
      "
      onClick={onCancel}
      aria-hidden="true"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-description"
        className="
          relative
          w-full max-w-sm
          rounded-2xl
          bg-white dark:bg-stone-900
          border border-stone-200 dark:border-stone-800
          shadow-2xl shadow-black/10 dark:shadow-black/40
          overflow-hidden
          animate-in zoom-in-95 duration-200
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close confirmation dialog"
          className="
            absolute top-4 right-4
            w-8 h-8
            rounded-lg
            flex items-center justify-center
            text-stone-400 dark:text-stone-500
            hover:text-stone-700 dark:hover:text-stone-200
            hover:bg-stone-100 dark:hover:bg-stone-800
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

        {/* Content */}
        <div className="px-5 pt-6 pb-5 sm:px-6">
          <div className="flex items-start gap-3.5 pr-7">
            {/* Warning Icon */}
            <div
              className="
                w-10 h-10
                rounded-xl
                shrink-0
                flex items-center justify-center
                bg-red-50 dark:bg-red-950/40
                border border-red-200 dark:border-red-800
                text-red-600 dark:text-red-400
              "
            >
              <AlertTriangle className="w-5 h-5" />
            </div>

            {/* Text */}
            <div className="min-w-0 pt-0.5">
              <h3
                id="confirm-modal-title"
                className="
                  font-fredoka font-semibold
                  text-lg
                  text-stone-900 dark:text-stone-100
                  leading-snug
                "
              >
                {title}
              </h3>

              <p
                id="confirm-modal-description"
                className="
                  mt-1.5
                  text-sm
                  text-stone-600 dark:text-stone-300
                  leading-relaxed
                  font-sans
                "
              >
                {message}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div
          className="
            px-5 py-4 sm:px-6
            border-t border-stone-100 dark:border-stone-800
            bg-stone-50/60 dark:bg-stone-950/20
          "
        >
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
            {/* Safe / Cancel Action */}
            <button
              type="button"
              onClick={onCancel}
              autoFocus
              className="
                w-full sm:w-auto
                px-4 py-2.5
                rounded-xl
                text-sm font-medium
                bg-black dark:bg-white
                text-white dark:text-black
                hover:bg-stone-800 dark:hover:bg-stone-200
                focus:outline-none
                focus-visible:ring-2
                focus-visible:ring-theme-primary
                focus-visible:ring-offset-2
                dark:focus-visible:ring-offset-stone-900
                cursor-pointer
                select-none
                transition-all duration-200
                active:scale-[0.98]
              "
            >
              {cancelLabel}
            </button>

            {/* Destructive Action */}
            <button
              type="button"
              onClick={onConfirm}
              className="
                w-full sm:w-auto
                px-4 py-2.5
                rounded-xl
                text-sm font-medium
                text-red-600 dark:text-red-400
                bg-transparent
                border border-transparent
                hover:bg-red-50 dark:hover:bg-red-950/40
                hover:border-red-200 dark:hover:border-red-800
                focus:outline-none
                focus-visible:ring-2
                focus-visible:ring-red-500
                focus-visible:ring-offset-2
                dark:focus-visible:ring-offset-stone-900
                cursor-pointer
                select-none
                transition-all duration-200
                active:scale-[0.98]
              "
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};