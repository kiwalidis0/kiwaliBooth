import React, { useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import confetti from 'canvas-confetti';
import {
  Download,
  Copy,
  RotateCcw,
  ArrowLeft,
  Check,
  ShieldCheck
} from 'lucide-react';
import { useBooth } from '../context/useBooth';
import { playSuccessChime } from '../utils/audio';

gsap.registerPlugin(useGSAP);

export const DownloadScreen: React.FC = () => {
  const { finalImage, resetBooth, setStep } = useBooth();

  const containerRef = useRef<HTMLDivElement>(null);
  const photoStripRef = useRef<HTMLDivElement>(null);

  const [copied, setCopied] = useState<boolean>(false);
  const [isPrintingDone, setIsPrintingDone] = useState<boolean>(false);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);

  // GSAP Eject Reveal Animation
  useGSAP(
    () => {
      if (!photoStripRef.current) return;

      const tl = gsap.timeline({
        onComplete: () => {
          setIsPrintingDone(true);
          playSuccessChime();

          try {
            confetti({
              particleCount: 50,
              spread: 50,
              origin: { y: 0.6 },
              colors: ['#FF6B81', '#1C1917', '#A855F7', '#F59E0B'],
            });
          } catch (err) {
            console.warn('Confetti error:', err);
          }
        },
      });

      tl.fromTo(
        photoStripRef.current,
        {
          y: -180,
          opacity: 0.9,
        },
        {
          y: 0,
          opacity: 1,
          duration: 2.2,
          ease: 'power2.out',
        }
      );
    },
    { dependencies: [finalImage], scope: containerRef }
  );

  const handleDownload = () => {
    if (!finalImage) return;
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
    const link = document.createElement('a');
    link.download = `kiwalibooth-${dateStr}.png`;
    link.href = finalImage;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = async () => {
    if (!finalImage) return;
    try {
      const response = await fetch(finalImage);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      handleDownload();
    }
  };

  const handleBackToEditor = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    setStep('editor');
  };

  const handleShootAnother = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    resetBooth();
    setStep('layout');
  };

  return (
    <div ref={containerRef} className="py-8 px-4 max-w-lg mx-auto flex flex-col items-center">
      {/* Top status indicator */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium mb-3 border border-emerald-200">
        <Check className="w-3.5 h-3.5" />
        <span>Photostrip Ready</span>
      </div>

      <h2 className="text-3xl font-fredoka font-semibold text-stone-900 text-center mb-1">
        Your photostrip is ready
      </h2>
      <p className="text-xs text-stone-500 text-center mb-6">
        Exported directly in-browser memory with 0 server uploads.
      </p>

      {/* Photostrip Dispenser & Canvas Preview */}
      <div className="w-full flex flex-col items-center">
        {/* Sleek dispenser slot */}
        <div className="w-72 h-8 bg-stone-900 rounded-t-xl relative z-20 flex items-center justify-between px-4">
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${isPrintingDone ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
            <span className="text-[10px] text-stone-400 font-mono tracking-wider">
              {isPrintingDone ? 'PRINTED' : 'PRINTING...'}
            </span>
          </div>
          <span className="text-[10px] text-stone-400 font-mono">kiwalibooth</span>
        </div>

        {/* Ejected Photo Strip - Exact cropped dimensions */}
        <div className="w-full overflow-hidden flex justify-center -mt-1 pt-1 relative z-10">
          <div
            ref={photoStripRef}
            className="w-60 sm:w-64 bg-white rounded-b-xl overflow-hidden border border-stone-200"
          >
            {finalImage ? (
              <img
                src={finalImage}
                alt="Printed Photostrip"
                className="w-full h-auto object-contain block"
              />
            ) : (
              <div className="p-8 text-center text-stone-400 text-xs">
                Rendering photostrip...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Primary Action Buttons: COPY ON LEFT, SAVE PHOTO ON RIGHT */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-sm">
        {/* Copy Button on the Left */}
        <button
          onClick={handleCopy}
          className="w-full sm:w-auto sm:flex-1 soft-btn-secondary text-xs py-3 px-5 flex items-center justify-center gap-2 cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-700 font-medium">Copied to Clipboard!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-stone-500" />
              <span>Copy</span>
            </>
          )}
        </button>

        {/* Save Photo Button on the Right */}
        <button
          onClick={handleDownload}
          className="w-full sm:w-auto sm:flex-1 soft-btn-coral text-sm py-3 px-5 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Save Photo</span>
        </button>
      </div>

      {/* Emphasized Secondary Action Buttons with Debounce Protection */}
      <div className="mt-4 flex items-center justify-center gap-2.5 w-full max-w-sm">
        <button
          onClick={handleBackToEditor}
          disabled={isNavigating}
          className="flex-1 py-2 px-3 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-stone-500" />
          <span>Back to Editor</span>
        </button>

        <button
          onClick={handleShootAnother}
          disabled={isNavigating}
          className="flex-1 py-2 px-3 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
          <span>Shoot Another</span>
        </button>
      </div>

      <div className="mt-6 flex items-center gap-1.5 text-[11px] text-stone-500">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>100% private in your browser memory</span>
      </div>
    </div>
  );
};
