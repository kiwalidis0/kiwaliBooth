import React, { useRef, useState } from 'react';
import {
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Upload,
  Camera,
  Sliders
} from 'lucide-react';
import { useBooth } from '../context/useBooth';
import { LAYOUTS } from '../data/layouts';
import { ConfirmModal } from './ConfirmModal';
import type { CapturedPhoto } from '../types/photobooth';

export const ReviewScreen: React.FC = () => {
  const {
    selectedLayoutId,
    photos,
    setPhotos,
    setRetakeIndex,
    setStep,
  } = useBooth();

  const layout = LAYOUTS[selectedLayoutId];
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
  const [showRetakeAllConfirm, setShowRetakeAllConfirm] = useState<boolean>(false);

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

  const isComplete = photos.length >= layout.shotsCount;

  return (
    <>
      <div className="py-8 px-4 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <button
              onClick={() => setStep('capture')}
              className="inline-flex items-center gap-1 text-xs text-black dark:text-stone-300 hover:text-theme-primary mb-1 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Camera</span>
            </button>
            <h2 className="text-2xl sm:text-3xl font-fredoka font-semibold text-theme-primary">
              Review your shots
            </h2>
            <p className="text-xs text-black dark:text-stone-300 mt-0.5 font-sans">
              Check your poses. You can retake or replace any frame before styling in studio.
            </p>
          </div>
        </div>

        {/* Grid of Shots */}
        <div
          className={`grid gap-3 sm:gap-4 ${
            layout.shotsCount === 1
              ? 'max-w-xs mx-auto grid-cols-1'
              : layout.shotsCount === 2
              ? 'grid-cols-2 max-w-md mx-auto'
              : 'grid-cols-2 sm:grid-cols-4'
          }`}
        >
          {layout.slots.map((slot) => {
            const photo = photos.find(p => p.slotIndex === slot.id);

            return (
              <div
                key={slot.id}
                className="bg-white dark:bg-stone-900 rounded-2xl p-2.5 border border-stone-200 dark:border-stone-800 flex flex-col justify-between"
              >
                {/* Photo Display Card */}
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 mb-2">
                  {photo ? (
                    <img
                      src={photo.dataUrl}
                      alt={`Shot #${slot.id + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-stone-400">
                      <Camera className="w-6 h-6 mb-1" />
                      <span className="text-[10px]">No photo</span>
                    </div>
                  )}

                  <div className="absolute top-2 left-2 bg-theme-primary text-white shadow-xs px-2.5 py-0.5 rounded-md text-xs font-fredoka font-bold flex items-center justify-center select-none">
                    #{slot.id + 1}
                  </div>
                </div>

                {/* Retake & Replace actions */}
                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    onClick={() => handleRetakeFrame(slot.id)}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-medium border border-stone-200 dark:border-stone-700 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3 text-stone-500" />
                    <span>Retake</span>
                  </button>

                  <button
                    onClick={() => fileInputRefs.current[slot.id]?.click()}
                    className="p-1.5 rounded-lg bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 transition-colors cursor-pointer"
                    title="Upload replacement photo"
                  >
                    <Upload className="w-3 h-3" />
                    <input
                      ref={(el) => {
                        fileInputRefs.current[slot.id] = el;
                      }}
                      type="file"
                      accept="image/*"
                      onChange={e => handleReplaceFile(slot.id, e)}
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
          <button
            onClick={() => setShowRetakeAllConfirm(true)}
            className="w-full sm:w-auto soft-btn-secondary text-sm px-5 py-3 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-stone-500" />
            <span>Retake All Shots</span>
          </button>

          <button
            onClick={() => setStep('editor')}
            disabled={!isComplete}
            className={`w-full sm:w-auto soft-btn-coral text-sm px-8 py-3.5 flex items-center justify-center gap-2 cursor-pointer ${
              !isComplete ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Proceed to Studio</span>
            <ArrowRight className="w-4 h-4" />
          </button>
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
    </>
  );
};
