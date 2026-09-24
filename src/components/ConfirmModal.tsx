import React from 'react';
import { AlertTriangle, AlertCircle, X } from 'lucide-react';

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
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="bg-white dark:bg-stone-900 rounded-2xl border-2 border-red-500/30 dark:border-red-600/40 w-full max-w-sm p-5 relative shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-stone-400 hover:text-black dark:hover:text-white p-1 cursor-pointer transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3 mb-3.5 pt-1">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/70 border border-red-200 dark:border-red-800 flex items-center justify-center text-red-600 dark:text-red-400 flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-fredoka font-semibold text-lg text-red-600 dark:text-red-400 leading-snug">
              {title}
            </h3>
            <p className="text-xs text-black dark:text-stone-200 mt-1 leading-relaxed font-sans">
              {message}
            </p>
          </div>
        </div>

        {/* Cannot Be Undone Warning Badge */}
        <div className="mb-4 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-[11px] text-red-700 dark:text-red-300 font-medium flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <span>This action cannot be undone. Progress will be lost.</span>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100 dark:border-stone-800">
          {/* Secondary Action: Destructive / Reset */}
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-stone-200 dark:border-stone-700 hover:border-red-200 dark:hover:border-red-800 transition-all cursor-pointer select-none"
          >
            {confirmLabel}
          </button>

          {/* Primary Action: Safer Default */}
          <button
            onClick={onCancel}
            className="soft-btn-primary text-xs py-2 px-4 cursor-pointer select-none"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
