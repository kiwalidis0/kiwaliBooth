import React from 'react';
import { X, ShieldCheck, Lock, EyeOff, Trash2 } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 w-full max-w-lg p-6 relative shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-fredoka font-semibold text-lg text-stone-900 dark:text-white leading-tight">
                Privacy Policy &amp; Architecture
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                How Kiwalibooth protects your photos &amp; webcam
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center justify-center text-stone-500 hover:text-stone-900 dark:hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-4 text-xs text-stone-600 dark:text-stone-300 leading-relaxed max-h-[60vh] overflow-y-auto">
          <div className="flex items-start gap-3">
            <Lock className="w-4 h-4 text-stone-900 dark:text-white mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-stone-900 dark:text-white text-xs mb-0.5">
                100% In-Browser Memory Processing
              </h4>
              <p>
                Every photo capture, webcam stream, canvas filter, sticker, and strip export operates exclusively in your device's local browser RAM via the HTML5 Canvas API.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <EyeOff className="w-4 h-4 text-stone-900 dark:text-white mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-stone-900 dark:text-white text-xs mb-0.5">
                Zero Cloud Uploads &amp; Zero External Servers
              </h4>
              <p>
                Kiwalibooth has no backend server or cloud database. Not a single byte of your webcam capture or generated photostrip ever leaves your computer or phone.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Trash2 className="w-4 h-4 text-stone-900 dark:text-white mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-stone-900 dark:text-white text-xs mb-0.5">
                Instant Automatic Memory Clearance
              </h4>
              <p>
                Closing the tab or clicking "Shoot Another" immediately purges all recorded frames and canvas buffers from memory. Nothing is retained in local storage or cookies.
              </p>
            </div>
          </div>

          <div className="p-3 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 text-[11px] text-stone-500 dark:text-stone-400">
            <strong>Technical Note:</strong> Built on open-source web primitives (WebRTC, HTML5 Canvas, Konva). You can inspect browser network traffic in DevTools to confirm zero external image transmissions.
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="soft-btn-primary text-xs py-2 px-5 cursor-pointer"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
