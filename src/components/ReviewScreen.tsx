import React, { useRef, useState } from 'react';
import {
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Upload,
  Camera,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
} from 'lucide-react';
import { useBooth } from '../context/useBooth';
import { LAYOUTS } from '../data/layouts';
import { ConfirmModal } from './ConfirmModal';
import type { CapturedPhoto } from '../types/photobooth';

export const ReviewScreen: React.FC = () => {
  const {
    selectedLayoutId,
    totalRequiredShots,
    photos,
    setPhotos,
    setRetakeIndex,
    setStep,
    reorderPhotos,
  } = useBooth();

  const layout = LAYOUTS[selectedLayoutId];
  const totalSlotsCount = Math.max(1, totalRequiredShots || layout?.shotsCount || photos.length || 1);
  const slotIndices = Array.from({ length: totalSlotsCount }, (_, i) => i);
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
  const [showRetakeAllConfirm, setShowRetakeAllConfirm] = useState<boolean>(false);
  const [compareSlot, setCompareSlot] = useState<number | null>(null);

  const handleRetakeFrame = (index: number) => {
    setRetakeIndex(index);
    setStep('capture');
  };

  const handleConfirmRetakeAll = () => {
    setShowRetakeAllConfirm(false);
    setPhotos([]);
    setRetakeIndex(null);
    setStep('capture');
  };

  const handleReplaceFile = (slotIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const dataUrl = event.target.result as string;
          setPhotos(prev => {
            const exists = prev.some(p => p.slotIndex === slotIndex);
            if (exists) {
              return prev.map(p =>
                p.slotIndex === slotIndex ? { ...p, dataUrl } : p
              );
            }
            const newPhoto: CapturedPhoto = {
              id: `photo-upload-${Date.now()}-${slotIndex}`,
              slotIndex,
              dataUrl,
              filter: 'normal',
              x: 0,
              y: 0,
              scale: 1,
              rotation: 0,
              originalWidth: 800,
              originalHeight: 600,
            };
            return [...prev, newPhoto].sort((a, b) => a.slotIndex - b.slotIndex);
          });
        }
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  const isComplete = photos.length >= totalSlotsCount;

  return (
    <>
      <div className="py-8 px-4 max-w-4xl mx-auto pb-28 sm:pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <button
              onClick={() => setStep('capture')}
              className="hidden sm:inline-flex items-center gap-1 text-xs text-black dark:text-stone-300 hover:text-theme-primary mb-1 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Camera</span>
            </button>
            <h2 className="text-2xl sm:text-3xl font-fredoka font-semibold text-theme-primary">
              Review your shots
            </h2>
            <p className="text-xs text-black dark:text-stone-300 mt-0.5 font-sans">
              Check your poses. You can reorder, retake, or inspect any frame before styling in studio.
            </p>
          </div>

          {photos.length > 0 && (
            <button
              onClick={() => setCompareSlot(0)}
              className="self-start sm:self-center soft-btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Maximize2 className="w-3.5 h-3.5 text-theme-primary" />
              <span>Inspect & Compare</span>
            </button>
          )}
        </div>

        {/* Grid of Shots */}
        <div
          className={`grid gap-3 sm:gap-4 ${
            totalSlotsCount === 1
              ? 'max-w-xs mx-auto grid-cols-1'
              : totalSlotsCount === 2
              ? 'grid-cols-2 max-w-md mx-auto'
              : totalSlotsCount === 3
              ? 'grid-cols-1 sm:grid-cols-3 max-w-2xl mx-auto'
              : 'grid-cols-2 sm:grid-cols-4'
          }`}
        >
          {slotIndices.map((slotId) => {
            const photo = photos.find(p => p.slotIndex === slotId);

            return (
              <div
                key={slotId}
                className="bg-white dark:bg-stone-900 rounded-2xl p-2.5 border border-stone-200 dark:border-stone-800 flex flex-col justify-between"
              >
                {/* Photo Display Card with click-to-enlarge */}
                <div
                  onClick={() => photo && setCompareSlot(slotId)}
                  className={`relative aspect-[4/3] rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 mb-2 ${
                    photo ? 'cursor-pointer group' : ''
                  }`}
                >
                  {photo ? (
                    <>
                      <img
                        src={photo.dataUrl}
                        alt={`Shot #${slotId + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white p-1.5 rounded-lg">
                          <Maximize2 className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-stone-400">
                      <Camera className="w-6 h-6 mb-1" />
                      <span className="text-[10px]">No photo</span>
                    </div>
                  )}

                  <div className="absolute top-2 left-2 bg-theme-primary text-white shadow-xs px-2.5 py-0.5 rounded-md text-xs font-fredoka font-bold flex items-center justify-center select-none">
                    #{slotId + 1}
                  </div>
                </div>

                {/* Reorder controls for multi-shot layouts */}
                {totalSlotsCount > 1 && (
                  <div className="flex items-center justify-between text-xs text-stone-400 py-1 border-b border-stone-100 dark:border-stone-800 mb-1.5 px-0.5">
                    <span className="text-[10px] font-sans text-stone-400">Slot order</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => reorderPhotos(slotId, slotId - 1)}
                        disabled={slotId === 0}
                        title="Move shot earlier"
                        aria-label="Move shot earlier"
                        className={`p-1 rounded text-stone-600 dark:text-stone-300 ${
                          slotId === 0 ? 'opacity-20 cursor-not-allowed' : 'hover:bg-stone-100 dark:hover:bg-stone-700 cursor-pointer'
                        }`}
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </button>
                      <span className="text-[10px] font-fredoka font-semibold text-stone-500">
                        {slotId + 1}/{totalSlotsCount}
                      </span>
                      <button
                        onClick={() => reorderPhotos(slotId, slotId + 1)}
                        disabled={slotId === totalSlotsCount - 1}
                        title="Move shot later"
                        aria-label="Move shot later"
                        className={`p-1 rounded text-stone-600 dark:text-stone-300 ${
                          slotId === totalSlotsCount - 1 ? 'opacity-20 cursor-not-allowed' : 'hover:bg-stone-100 dark:hover:bg-stone-700 cursor-pointer'
                        }`}
                      >
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Retake & Replace actions */}
                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    onClick={() => handleRetakeFrame(slotId)}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-medium border border-stone-200 dark:border-stone-700 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3 text-stone-500" />
                    <span>Retake</span>
                  </button>

                  <button
                    onClick={() => fileInputRefs.current[slotId]?.click()}
                    className="p-1.5 rounded-lg bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 transition-colors cursor-pointer"
                    title="Upload replacement photo"
                  >
                    <Upload className="w-3 h-3" />
                    <input
                      ref={(el) => {
                        fileInputRefs.current[slotId] = el;
                      }}
                      type="file"
                      accept="image/*"
                      onChange={e => handleReplaceFile(slotId, e)}
                      className="hidden"
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Prominent Bottom CTA Bar */}
        <div className="mt-8 pt-4 border-t border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          {totalSlotsCount > 1 ? (
            <button
              onClick={() => setShowRetakeAllConfirm(true)}
              className="w-full sm:w-auto soft-btn-secondary text-sm px-5 py-3 flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-stone-500" />
              <span>Retake All Shots</span>
            </button>
          ) : (
            <div className="hidden sm:block text-xs text-stone-500 dark:text-stone-400">
              Photo review complete. Continue to Studio.
            </div>
          )}

          {/* Desktop Proceed to Studio Button (Strictly hidden on mobile, displayed only on desktop sm:flex) */}
          <div className="hidden sm:flex items-center">
            <button
              onClick={() => setStep('editor')}
              disabled={!isComplete}
              className={`soft-btn-coral text-sm px-8 py-3.5 flex items-center justify-center gap-2 cursor-pointer ${
                !isComplete ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Proceed to Studio</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal before clearing all photos */}
      <ConfirmModal
        isOpen={showRetakeAllConfirm}
        title="Retake all shots?"
        message="Wait! Your pictures will not be saved. Download them first or they will be gone forever."
        confirmLabel="Yes, Retake All"
        cancelLabel="Keep Photos"
        onConfirm={handleConfirmRetakeAll}
        onCancel={() => setShowRetakeAllConfirm(false)}
      />

      {/* Comparison & Inspection Lightbox Modal */}
      {compareSlot !== null && (() => {
        const activeComparePhoto = photos.find(p => p.slotIndex === compareSlot);
        return (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-4 sm:p-6 shadow-2xl flex flex-col items-center">
              {/* Header */}
              <div className="w-full flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="bg-theme-primary text-white text-xs font-fredoka font-bold px-2.5 py-0.5 rounded-md">
                    Shot #{compareSlot + 1}
                  </span>
                  {activeComparePhoto && (
                    <span className="text-[11px] text-stone-500 font-sans">
                      {activeComparePhoto.originalWidth} × {activeComparePhoto.originalHeight}px
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setCompareSlot(null)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
                  title="Close inspection"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* High-res Image preview */}
              <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-stone-950 flex items-center justify-center">
                {activeComparePhoto ? (
                  <img
                    src={activeComparePhoto.dataUrl}
                    alt={`Shot #${compareSlot + 1}`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-stone-500 text-xs">No photo in this slot</div>
                )}
              </div>

              {/* Navigation & actions */}
              <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-3 border-t border-stone-100 dark:border-stone-800">
                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                  <button
                    onClick={() => setCompareSlot((compareSlot - 1 + totalSlotsCount) % totalSlotsCount)}
                    className="soft-btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Prev</span>
                  </button>

                  <div className="flex gap-1">
                    {slotIndices.map(idx => (
                      <button
                        key={idx}
                        onClick={() => setCompareSlot(idx)}
                        className={`w-7 h-7 rounded-lg text-xs font-fredoka font-bold transition-all cursor-pointer ${
                          compareSlot === idx
                            ? 'soft-btn-coral !p-0 !text-white'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
                        }`}
                      >
                        #{idx + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCompareSlot((compareSlot + 1) % totalSlotsCount)}
                    className="soft-btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => {
                    const target = compareSlot;
                    setCompareSlot(null);
                    handleRetakeFrame(target);
                  }}
                  className="w-full sm:w-auto text-xs py-1.5 px-3 rounded-lg border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Retake this shot</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
};
