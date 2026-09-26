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
  confirmLabel = 'Leave & Start Fresh',
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
        backdrop-blur-sm
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
          w-full max-w-[360px]
          rounded-[24px]
          bg-white dark:bg-stone-900
          shadow-2xl shadow-black/10 dark:shadow-black/40
          overflow-hidden
          animate-in zoom-in-95 duration-200
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close confirmation dialog"
          className="
            absolute top-4 right-4
            w-8 h-8
            rounded-full
            flex items-center justify-center
            text-stone-400 dark:text-stone-500
            hover:bg-stone-100 dark:hover:bg-stone-800
            focus:outline-none
            transition-colors
          "
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="px-6 pt-6 pb-6">
          <div className="flex items-start gap-4 pr-6">
            {/* Warning Icon */}
            <div
              className="
                w-10 h-10
                rounded-2xl
                shrink-0
                flex items-center justify-center
                bg-red-50 dark:bg-red-950/40
                border border-red-100 dark:border-red-900/50
                text-red-500 dark:text-red-400
              "
            >
              <AlertTriangle className="w-5 h-5 stroke-[2]" />
            </div>

            {/* Text */}
            <div className="min-w-0 pt-0.5">
              <h3
                id="confirm-modal-title"
                className="
                  font-bold
                  text-[17px]
                  text-stone-900 dark:text-stone-100
                  leading-tight
                  tracking-tight
                "
              >
                {title}
              </h3>

              <p
                id="confirm-modal-description"
                className="
                  mt-1.5
                  text-[14px]
                  text-stone-500 dark:text-stone-400
                  leading-relaxed
                "
              >
                {message}
              </p>
            </div>
          </div>
        </div>

{/* Actions - Vertically Stacked */}
        <div className="px-5 pb-5 pt-3 border-t border-stone-100 dark:border-stone-800">
          <div className="flex flex-col gap-2">
            {/* Destructive Action (Text Button) */}
            <button
              type="button"
              onClick={onConfirm}
              className="
                w-full
                py-3
                text-[15px] font-medium
                text-red-500 dark:text-red-400
                bg-transparent
                hover:bg-red-50 dark:hover:bg-red-950/30
                rounded-xl
                transition-colors
                focus:outline-none
                active:scale-[0.98]
              "
            >
              {confirmLabel}
            </button>

            {/* Safe / Cancel Action (Primary Filled Button) */}
            <button
              type="button"
              onClick={onCancel}
              autoFocus
              className="
                w-full
                py-3.5
                rounded-2xl
                text-[15px] font-semibold
                bg-theme-primary 
                text-white
                hover:opacity-90
                shadow-sm
                focus:outline-none
                transition-all duration-200
                active:scale-[0.98]
              "
            >
              {cancelLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};