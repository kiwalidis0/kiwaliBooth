import React, { useRef, useState, useEffect, useCallback } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import confetti from 'canvas-confetti';
import {
  Download,
  Copy,
  RotateCcw,
  ArrowLeft,
  Check,
  ShieldCheck,
  Layers,
  Smartphone,
  Film,
  Sparkles,
  Repeat,
  X,
} from 'lucide-react';
import { useBooth } from '../context/useBooth';
import { LAYOUTS } from '../data/layouts';
import { playSuccessChime } from '../utils/audio';
import { ConfirmModal } from './ConfirmModal';
import { QRShareModal } from './QRShareModal';
import { createAnimatedGif } from '../utils/gifEncoder';
import type { LayoutId } from '../types/photobooth';

gsap.registerPlugin(useGSAP);

export const DownloadScreen: React.FC = () => {
  const {
    finalImage,
    finalImages,
    selectedLayoutIds,
    activeStudioLayoutId,
    photos,
    resetBooth,
    setStep,
    registerDownloadHandler,
  } = useBooth();

  const containerRef = useRef<HTMLDivElement>(null);
  const photoStripRef = useRef<HTMLDivElement>(null);

  const [copied, setCopied] = useState<boolean>(false);
  const [isSavingDone, setIsSavingDone] = useState<boolean>(false);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [showShootAnotherConfirm, setShowShootAnotherConfirm] = useState<boolean>(false);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [showGifModal, setShowGifModal] = useState<boolean>(false);
  const [isGeneratingGif, setIsGeneratingGif] = useState<boolean>(false);
  const [gifDataUrl, setGifDataUrl] = useState<string | null>(null);
  const [boomerang, setBoomerang] = useState<boolean>(false);
  const [downloadSuccessToast, setDownloadSuccessToast] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setDownloadSuccessToast(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setDownloadSuccessToast(null);
    }, 3500);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  // Active viewing layout if multiple layouts exist
  const [activeViewLayoutId, setActiveViewLayoutId] = useState<LayoutId>(
    activeStudioLayoutId || selectedLayoutIds[0] || 'classic4'
  );

  const activeImage = finalImages[activeViewLayoutId] || finalImage;

  // GSAP Eject Reveal Animation
  useGSAP(
    () => {
      if (!photoStripRef.current) return;

      const tl = gsap.timeline({
        onComplete: () => {
          setIsSavingDone(true);
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
    { dependencies: [activeViewLayoutId, activeImage], scope: containerRef }
  );

  const handleDownload = useCallback((imgUrl?: string | null, layoutName?: string) => {
    const url = imgUrl || activeImage;
    if (!url) return;
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
    const targetLayoutName = layoutName || LAYOUTS[activeViewLayoutId]?.name || activeViewLayoutId;
    const suffix = targetLayoutName ? `-${targetLayoutName.toLowerCase().replace(/\s+/g, '-')}` : '';
    const link = document.createElement('a');
    link.download = `kiwalibooth${suffix}-${dateStr}.png`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Download Successful! Photostrip saved to your device.');
  }, [activeImage, activeViewLayoutId, showToast]);

  useEffect(() => {
    registerDownloadHandler(() => handleDownload());
    return () => {
      registerDownloadHandler(null);
    };
  }, [handleDownload, registerDownloadHandler]);

  const handleDownloadAll = () => {
    selectedLayoutIds.forEach((lId, idx) => {
      const url = finalImages[lId] || (lId === activeViewLayoutId ? finalImage : null);
      if (!url) return;
      const targetLayoutName = LAYOUTS[lId]?.name || lId;
      setTimeout(() => {
        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
        const suffix = `-${targetLayoutName.toLowerCase().replace(/\s+/g, '-')}`;
        const link = document.createElement('a');
        link.download = `kiwalibooth${suffix}-${dateStr}.png`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, idx * 500);
    });
    showToast(`Download Started! Saving all ${selectedLayoutIds.length} cutouts...`);
  };

  const handleCopy = async () => {
    if (!activeImage) return;
    try {
      const response = await fetch(activeImage);
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

  const generateGif = useCallback(async (useBoomerang: boolean) => {
    if (photos.length === 0) return;
    setIsGeneratingGif(true);
    try {
      const frames = photos.map(p => p.dataUrl);
      const { dataUrl } = await createAnimatedGif(frames, { boomerang: useBoomerang, delay: 350 });
      setGifDataUrl(dataUrl);
    } catch (err) {
      console.error('GIF generation failed:', err);
    } finally {
      setIsGeneratingGif(false);
    }
  }, [photos]);

  const handleOpenGifModal = () => {
    setShowGifModal(true);
    if (!gifDataUrl && photos.length > 0) {
      generateGif(boomerang);
    }
  };

  const handleDownloadGif = () => {
    if (!gifDataUrl) return;
    const link = document.createElement('a');
    link.download = `kiwalibooth-animated-${Date.now()}.gif`;
    link.href = gifDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Download Successful! Animated GIF saved.');
  };

  const handleBackToEditor = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    setStep('editor');
  };

  const handleConfirmShootAnother = () => {
    setShowShootAnotherConfirm(false);
    resetBooth();
    setStep('layout');
  };

  return (
    <>
      {/* Temporary Download Successful Toast Alert */}
      {downloadSuccessToast && (
        <div className="fixed top-6 inset-x-0 z-50 flex justify-center pointer-events-none px-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-stone-900/95 dark:bg-stone-100/95 text-white dark:text-stone-900 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs sm:text-sm font-fredoka font-semibold border border-white/10 dark:border-black/10 backdrop-blur-md">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 dark:text-emerald-600 flex items-center justify-center flex-shrink-0">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
            <span>{downloadSuccessToast}</span>
          </div>
        </div>
      )}

      <div ref={containerRef} className="py-8 px-4 max-w-lg md:max-w-5xl lg:max-w-6xl mx-auto pb-28 sm:pb-8">
        {/* Mobile Header (Hidden on md+) */}
        <div className="md:hidden flex flex-col items-center mb-6 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-theme-soft/50 text-theme-primary dark:bg-stone-800 text-xs font-semibold mb-3 border border-theme-primary/30">
            <Check className="w-3.5 h-3.5" />
            <span>Photostrip Ready</span>
          </div>

          <h2 className="text-3xl font-fredoka font-semibold text-theme-primary text-center mb-1">
            {selectedLayoutIds.length > 1 ? 'Your cutouts are ready' : 'Your photostrip is ready'}
          </h2>
          <p className="text-xs text-black dark:text-stone-300 text-center mb-4 font-sans">
            Rendered client-side with 0 server uploads. Session kept locally for 24h resume.
          </p>

          {/* Multi-Layout Output Selector on Mobile */}
          {selectedLayoutIds.length > 1 && (
            <div className="mb-2 flex flex-col items-center gap-1.5">
              <span className="text-[11px] font-fredoka font-semibold text-stone-500 dark:text-stone-400">
                Select Output to View:
              </span>
              <div className="p-1 bg-stone-100 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 flex items-center gap-1 shadow-xs flex-wrap justify-center">
                {selectedLayoutIds.map(layoutId => {
                  const isActive = activeViewLayoutId === layoutId;
                  const cfg = LAYOUTS[layoutId];
                  return (
                    <button
                      key={layoutId}
                      onClick={() => setActiveViewLayoutId(layoutId)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-fredoka font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'soft-btn-coral !p-1.5 !px-3 !text-white shadow-xs font-bold'
                          : 'text-stone-600 dark:text-stone-300 hover:text-black dark:hover:text-white'
                      }`}
                    >
                      {cfg?.name || layoutId}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Responsive Layout: 2-Column Grid on Desktop, Single Column Stack on Mobile */}
        <div className="w-full flex flex-col items-center md:grid md:grid-cols-12 md:gap-8 lg:gap-12 md:items-start">
          {/* Left Column: Photostrip Dispenser & Canvas Preview */}
          <div className="w-full md:col-span-5 lg:col-span-5 flex flex-col items-center">
            {/* Themed Photobooth Dispenser / Printer Housing */}
            <div className="w-72 sm:w-80 md:w-full md:max-w-[340px] bg-white dark:bg-stone-900 border-2 border-b-0 border-theme-primary/30 rounded-t-2xl shadow-md relative z-20 px-4 pt-3 pb-2.5 flex flex-col items-center gap-2">
              {/* Top Bar: Kiwalibooth on LEFT, Printer Status on RIGHT */}
              <div className="w-full flex items-center justify-between">
                <div className="font-fredoka font-bold text-base sm:text-lg text-theme-primary tracking-wide text-left flex-shrink-0">
                  Kiwalibooth
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isSavingDone ? 'bg-theme-primary' : 'bg-amber-400 animate-pulse'}`} />
                  <span className="text-[10px] font-sans font-medium text-black dark:text-stone-300 tracking-wider">
                    {isSavingDone ? 'READY' : 'PRINTING...'}
                  </span>
                </div>
              </div>

              {/* Recessed Ejection Mouth / Slot where photostrip emerges */}
              <div className="w-60 sm:w-64 md:w-full md:max-w-[280px] h-2 bg-stone-950 dark:bg-black rounded-full shadow-inner border border-theme-primary/20" />
            </div>

            {/* Ejected Photo Strip - Exact cropped dimensions */}
            <div className="w-full overflow-hidden flex justify-center -mt-1 pt-1 relative z-10">
              <div
                ref={photoStripRef}
                className="w-60 sm:w-64 md:w-full md:max-w-[280px] bg-white dark:bg-stone-900 rounded-b-xl overflow-hidden border border-stone-200 dark:border-stone-800 shadow-md"
              >
                {activeImage ? (
                  <img
                    key={activeViewLayoutId}
                    src={activeImage}
                    alt="Saved Photostrip"
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

          {/* Right Column: Desktop Header & All Action Controls */}
          <div className="w-full md:col-span-7 lg:col-span-7 flex flex-col items-center md:items-start mt-6 md:mt-0 bg-transparent md:bg-white md:dark:bg-stone-900 md:border md:border-stone-200 md:dark:border-stone-800 md:rounded-2xl md:p-6 lg:p-8 md:shadow-xs">
            {/* Desktop Header (Hidden on mobile) */}
            <div className="hidden md:flex flex-col items-start mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-theme-soft/50 text-theme-primary dark:bg-stone-800 text-xs font-semibold mb-3 border border-theme-primary/30">
                <Check className="w-3.5 h-3.5" />
                <span>Photostrip Ready</span>
              </div>

              <h2 className="text-3xl font-fredoka font-semibold text-theme-primary mb-1">
                {selectedLayoutIds.length > 1 ? 'Your cutouts are ready' : 'Your photostrip is ready'}
              </h2>
              <p className="text-xs text-black dark:text-stone-300 font-sans">
                Rendered client-side with 0 server uploads. Session kept locally for 24h resume.
              </p>
            </div>

            {/* Multi-Layout Selector on Desktop */}
            {selectedLayoutIds.length > 1 && (
              <div className="hidden md:flex flex-col items-start gap-1.5 mb-5 w-full">
                <span className="text-[11px] font-fredoka font-semibold text-stone-500 dark:text-stone-400">
                  Select Output to View:
                </span>
                <div className="p-1 bg-stone-100 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 flex items-center gap-1 shadow-xs flex-wrap">
                  {selectedLayoutIds.map(layoutId => {
                    const isActive = activeViewLayoutId === layoutId;
                    const cfg = LAYOUTS[layoutId];
                    return (
                      <button
                        key={layoutId}
                        onClick={() => setActiveViewLayoutId(layoutId)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-fredoka font-semibold transition-all cursor-pointer ${
                          isActive
                            ? 'soft-btn-coral !p-1.5 !px-3 !text-white shadow-xs font-bold'
                            : 'text-stone-600 dark:text-stone-300 hover:text-black dark:hover:text-white'
                        }`}
                      >
                        {cfg?.name || layoutId}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action Controls Stack with optimized gap-3 / gap-4 */}
            <div className="w-full flex flex-col gap-3.5 max-w-sm md:max-w-none">
              {/* Primary Action Buttons: COPY & SAVE CURRENT (Standardized h-12, flex-1, whitespace-nowrap) */}
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                {/* Copy Button */}
                <button
                  type="button"
                  onClick={handleCopy}
                  className="w-full sm:flex-1 h-12 soft-btn-secondary text-xs sm:text-sm px-5 flex items-center justify-center gap-2 cursor-pointer shadow-xs whitespace-nowrap"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-stone-500" />
                      <span>Copy Current</span>
                    </>
                  )}
                </button>

                {/* Save Current Button */}
                <button
                  type="button"
                  onClick={() => handleDownload()}
                  className="w-full sm:flex-1 h-12 soft-btn-coral text-xs sm:text-sm px-5 flex items-center justify-center gap-2 cursor-pointer shadow-md whitespace-nowrap"
                >
                  <Download className="w-4 h-4" />
                  <span>Save Current</span>
                </button>
              </div>

              {/* If multiple layouts were selected, offer "Download All Cutouts" action */}
              {selectedLayoutIds.length > 1 && (
                <button
                  type="button"
                  onClick={handleDownloadAll}
                  className="w-full h-12 rounded-xl bg-theme-soft/40 dark:bg-stone-800 border border-theme-primary/30 text-theme-primary hover:bg-theme-soft/70 dark:hover:bg-stone-700 text-xs sm:text-sm font-fredoka font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs whitespace-nowrap"
                >
                  <Layers className="w-4 h-4" />
                  <span>Download All {selectedLayoutIds.length} Cutouts</span>
                </button>
              )}

              {/* Studio Sharing Row: Animated GIF + Send to Phone / QR */}
              <div className="grid grid-cols-2 gap-3 w-full">
                {photos.length > 1 && (
                  <button
                    type="button"
                    onClick={handleOpenGifModal}
                    className="h-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-xs sm:text-sm font-fredoka font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs whitespace-nowrap"
                  >
                    <Film className="w-4 h-4 text-purple-500" />
                    <span>Animated GIF</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className={`h-12 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 text-xs sm:text-sm font-fredoka font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs whitespace-nowrap ${
                    photos.length <= 1 ? 'col-span-2' : ''
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-theme-primary" />
                  <span>Send to Phone</span>
                </button>
              </div>

              {/* Secondary Navigation Row: Back to Editor & Shoot Another */}
              <div className="grid grid-cols-2 gap-3 w-full">
                <button
                  type="button"
                  onClick={handleBackToEditor}
                  disabled={isNavigating}
                  className="h-12 px-3 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <ArrowLeft className="w-4 h-4 text-stone-500" />
                  <span>Back to Editor</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowShootAnotherConfirm(true)}
                  className="h-12 px-3 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <RotateCcw className="w-4 h-4 text-stone-500" />
                  <span>Shoot Another</span>
                </button>
              </div>

              {/* Privacy Guarantee Reassurance */}
              <div className="pt-2 flex items-center justify-center md:justify-start gap-1.5 text-[11px] text-stone-500 dark:text-stone-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Private: processed client-side, stored only on this device</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal before starting fresh */}
      <ConfirmModal
        isOpen={showShootAnotherConfirm}
        title="Start fresh session?"
        message="Wait! Your pictures will not be saved. Download them first or they will be gone forever."
        confirmLabel="Leave & Start Fresh"
        cancelLabel="Stay in Booth"
        onConfirm={handleConfirmShootAnother}
        onCancel={() => setShowShootAnotherConfirm(false)}
      />

      {/* Animated GIF Preview & Download Modal */}
      {showGifModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 sm:p-6 shadow-2xl flex flex-col items-center text-center">
            <button
              onClick={() => setShowGifModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <Film className="w-5 h-5 text-purple-500" />
              <h3 className="font-fredoka font-semibold text-lg text-black dark:text-white">
                Animated Photostrip GIF
              </h3>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-4 font-sans">
              Looping animation of your {photos.length} captured frames
            </p>

            {/* GIF Preview Screen */}
            <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-stone-950 mb-4 flex items-center justify-center border border-stone-200 dark:border-stone-700">
              {isGeneratingGif ? (
                <div className="flex flex-col items-center gap-2 text-stone-400 text-xs">
                  <Sparkles className="w-6 h-6 animate-spin text-purple-400" />
                  <span>Encoding animated GIF...</span>
                </div>
              ) : gifDataUrl ? (
                <img src={gifDataUrl} alt="Animated photobooth GIF" className="w-full h-full object-contain" />
              ) : (
                <span className="text-stone-500 text-xs">No preview available</span>
              )}
            </div>

            {/* Boomerang ping-pong toggle */}
            <div className="w-full flex items-center justify-between bg-stone-50 dark:bg-stone-800/60 p-2.5 rounded-xl border border-stone-100 dark:border-stone-800 mb-4">
              <span className="text-xs text-stone-700 dark:text-stone-300 font-medium flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5 text-purple-500" />
                <span>Boomerang Loop</span>
              </span>
              <button
                onClick={() => {
                  const next = !boomerang;
                  setBoomerang(next);
                  generateGif(next);
                }}
                className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                  boomerang ? 'bg-purple-600' : 'bg-stone-300 dark:bg-stone-600'
                }`}
              >
                <span
                  className={`block w-3.5 h-3.5 bg-white rounded-full transition-transform transform ${
                    boomerang ? 'translate-x-4' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Download GIF Button */}
            <button
              onClick={handleDownloadGif}
              disabled={isGeneratingGif || !gifDataUrl}
              className={`w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-fredoka font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all ${
                isGeneratingGif || !gifDataUrl ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Save Animated GIF (.gif)</span>
            </button>
          </div>
        </div>
      )}

      {/* QR Code Share Modal */}
      <QRShareModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        imageUrl={activeImage}
      />
    </>
  );
};

