import React, { useRef } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Upload,
  Check,
  Camera,
  Layers,
  Palette
} from 'lucide-react';
import { useBooth } from '../context/useBooth';
import { LAYOUT_LIST } from '../data/layouts';
import { TEMPLATES } from '../data/templates';
import type { LayoutId } from '../types/photobooth';

export const LayoutSelectScreen: React.FC = () => {
  const {
    selectedLayoutId,
    setSelectedLayoutId,
    selectedTemplateId,
    setSelectedTemplateId,
    customOverlayUrl,
    setCustomOverlayUrl,
    setStep,
  } = useBooth();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeLayout = LAYOUT_LIST.find(l => l.id === selectedLayoutId) || LAYOUT_LIST[3];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCustomOverlayUrl(event.target.result as string);
          setSelectedTemplateId('custom-canva');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeCustomOverlay = () => {
    setCustomOverlayUrl(null);
    setSelectedTemplateId('classic-white');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="py-8 px-4 max-w-4xl mx-auto w-full space-y-8">
      {/* Header */}
      <div>
        <button
          onClick={() => setStep('landing')}
          className="inline-flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white mb-2 cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </button>
        <h2 className="text-2xl sm:text-3xl font-fredoka font-semibold text-stone-900 dark:text-white">
          Choose layout &amp; theme
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
          Pick your strip cuts and styling before opening the camera.
        </p>
      </div>

      {/* Section 1: Layout Selection */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-3">
          <Layers className="w-3.5 h-3.5 text-kiwali-coral" />
          <span>1. Photobooth Layout</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {LAYOUT_LIST.map((layout) => {
            const isSelected = selectedLayoutId === layout.id;
            return (
              <div
                key={layout.id}
                onClick={() => setSelectedLayoutId(layout.id as LayoutId)}
                className={`bg-white dark:bg-stone-900 rounded-2xl p-3.5 cursor-pointer border-2 transition-all text-left relative flex flex-col justify-between ${
                  isSelected
                    ? 'border-kiwali-coral bg-kiwali-soft-pink/10 dark:bg-stone-800/40'
                    : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                }`}
              >
                {/* Mini Strip Representation */}
                <div className="h-28 mb-3 bg-stone-50 dark:bg-stone-800 rounded-xl flex items-center justify-center p-2 border border-stone-100 dark:border-stone-700">
                  <div
                    className={`bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded p-1 flex flex-col gap-1 items-center justify-center ${
                      layout.id === 'single' ? 'w-16 h-20' : 'w-11 h-24'
                    }`}
                  >
                    {layout.slots.map((_, i) => (
                      <div
                        key={i}
                        className="w-full bg-stone-100 dark:bg-stone-800 rounded-[2px] flex-1 flex items-center justify-center text-[7px] text-stone-400 font-mono"
                      >
                        {i + 1}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-fredoka font-semibold text-sm text-stone-900 dark:text-white">
                      {layout.name}
                    </span>
                    <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-kiwali-coral text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                    {layout.shotsCount} {layout.shotsCount === 1 ? 'Cut' : 'Cuts'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Template Selection - Fixed width & reserved space to avoid container resizing */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-3">
          <Palette className="w-3.5 h-3.5 text-kiwali-coral" />
          <span>2. Built-in Theme</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {TEMPLATES.filter(t => t.theme !== 'custom').map((tmpl) => {
            const isSelected = selectedTemplateId === tmpl.id;
            return (
              <div
                key={tmpl.id}
                onClick={() => setSelectedTemplateId(tmpl.id)}
                className={`p-3.5 rounded-2xl bg-white dark:bg-stone-900 border-2 cursor-pointer transition-all flex items-center gap-3 ${
                  isSelected
                    ? 'border-kiwali-coral bg-kiwali-soft-pink/10 dark:bg-stone-800/40'
                    : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                }`}
              >
                <div
                  className="w-7 h-7 rounded-lg border border-stone-200 dark:border-stone-700 flex-shrink-0 flex items-center justify-center"
                  style={{ backgroundColor: tmpl.backgroundColor }}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: tmpl.accentColor }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-medium text-xs text-stone-900 dark:text-white truncate">
                    {tmpl.name}
                  </div>
                  <div className="text-[10px] text-stone-400 capitalize">
                    {tmpl.theme}
                  </div>
                </div>

                {/* Reserved space to prevent card width resize */}
                <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-kiwali-coral" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 3: Optional Custom Canva Frame */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="font-medium text-xs text-stone-900 dark:text-white">
              Optional: Upload Custom Frame Overlay
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
              Transparent PNG sized for {activeLayout.width} × {activeLayout.height} px
            </p>
          </div>

          {customOverlayUrl ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 font-medium flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-600" />
                Custom Frame Active
              </span>
              <button
                onClick={removeCustomOverlay}
                className="text-xs text-stone-400 hover:text-red-500 underline cursor-pointer"
              >
                Remove
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="soft-btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5 text-stone-500" />
              <span>Upload PNG</span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/svg+xml,image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Prominent Bottom CTA Bar */}
      <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-stone-500 dark:text-stone-400 text-center sm:text-left">
          Selected: <span className="font-semibold text-stone-800 dark:text-stone-200">{activeLayout.name}</span> ({activeLayout.shotsCount} {activeLayout.shotsCount === 1 ? 'cut' : 'cuts'})
        </div>

        <button
          onClick={() => setStep('capture')}
          className="w-full sm:w-auto soft-btn-coral text-sm px-8 py-3.5 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Camera className="w-4 h-4" />
          <span>Launch Camera</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
