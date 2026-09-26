import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { X, Copy, Check, Share2, Smartphone } from 'lucide-react';

interface QRShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
}

export const QRShareModal: React.FC<QRShareModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    // Use current URL with hash or instruction payload for phone camera scan
    const shareTargetUrl = typeof window !== 'undefined' ? window.location.href : 'https://kiwalibooth.app';

    QRCode.toDataURL(shareTargetUrl, {
      width: 260,
      margin: 2,
      color: {
        dark: '#1c1917',
        light: '#ffffff',
      },
    })
      .then(url => setQrCodeUrl(url))
      .catch(err => console.warn('QR generation error:', err));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyImage = async () => {
    if (!imageUrl) return;
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: copy link
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (!imageUrl || !navigator.share) return;
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], `kiwalibooth-${Date.now()}.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'My KiwaliBooth Photo Strip',
        });
      } else {
        await navigator.share({
          title: 'KiwaliBooth Photo Strip',
          url: window.location.href,
        });
      }
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        console.warn('Native share failed:', err);
      }
    }
  };

  const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 sm:p-6 shadow-2xl flex flex-col items-center text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2 mb-1">
          <Smartphone className="w-5 h-5 text-theme-primary" />
          <h3 className="font-fredoka font-semibold text-lg text-black dark:text-white">
            Send to Phone
          </h3>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">
          Scan with your phone camera or use native share
        </p>

        {/* QR Code Container */}
        <div className="bg-white p-3 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-inner mb-4 flex items-center justify-center">
          {qrCodeUrl ? (
            <img src={qrCodeUrl} alt="Scan QR code" className="w-48 h-48 rounded-lg" />
          ) : (
            <div className="w-48 h-48 flex items-center justify-center text-stone-400 text-xs">
              Generating QR...
            </div>
          )}
        </div>

        {/* Privacy badge */}
        <div className="text-[11px] text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800/60 px-3 py-1 rounded-full mb-4 font-sans">
          🔒 Client-side & private — stored only on this device
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2">
          {hasNativeShare && (
            <button
              onClick={handleNativeShare}
              className="w-full soft-btn-coral py-2.5 px-4 text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Share2 className="w-4 h-4" />
              <span>Share / AirDrop</span>
            </button>
          )}

          <button
            onClick={handleCopyImage}
            className="w-full soft-btn-secondary py-2 px-4 text-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy to Clipboard</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
