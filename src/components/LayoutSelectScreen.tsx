import React, { useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Camera,
  Layers,
  Palette,
  Lock,
  Sliders,
} from 'lucide-react';
import { useBooth } from '../context/useBooth';
import { LAYOUT_LIST, LAYOUTS } from '../data/layouts';
import { TEMPLATES } from '../data/templates';
import { CustomThemeModal } from './CustomThemeModal';
import type { LayoutId } from '../types/photobooth';

export const LayoutSelectScreen: React.FC = () => {
  const {
    selectedLayoutIds,
    toggleLayoutId,
    selectedTemplateId,
    setSelectedTemplateId,
    customTheme,
    totalRequiredShots,
    setStep,
    isLaunchReady,
  } = useBooth();

  const [showCustomThemeModal, setShowCustomThemeModal] = useState<boolean>(false);

  const isThemeLocked = selectedLayoutIds.length === 0;

  // Formatted names of selected layouts for user-facing feedback
  const selectedLayoutNames = selectedLayoutIds
    .map(id => LAYOUTS[id]?.name)
    .filter(Boolean)
    .join(' + ');

  return (
    <div className="py-8 px-4 max-w-4xl mx-auto w-full space-y-8 pb-28 sm:pb-8">
      {/* Header */}
      <div>
        <button
          onClick={() => setStep('landing')}
          className="hidden sm:inline-flex items-center gap-1 text-xs text-black dark:text-stone-300 hover:text-theme-primary mb-2 cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </button>
        <h2 className="text-2xl sm:text-3xl font-fredoka font-semibold text-theme-primary">
          Choose layout &amp; theme
        </h2>
        <p className="text-xs text-black dark:text-stone-300 mt-1 font-sans">
          Select one or multiple layouts and pick your styling before opening the camera.
        </p>
      </div>

      {/* Section 1: Multi-Layout Selection */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
          <div className="flex items-center gap-1.5 text-xs font-fredoka font-semibold text-theme-primary uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5 text-theme-primary" />
            <span>1. Photobooth Layouts</span>
          </div>
          <span className="text-[11px] text-stone-500 dark:text-stone-400 font-sans">
            Tap to select one or multiple frame strips
          </span>
        </div>

        {/* Layout Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {LAYOUT_LIST.map((layout) => {
            const isSelected = selectedLayoutIds.includes(layout.id as LayoutId);
            return (
              <div
                key={layout.id}
                onClick={() => toggleLayoutId(layout.id as LayoutId)}
                className={`p-3.5 rounded-2xl bg-white dark:bg-stone-900 border-2 transition-all flex flex-col justify-between text-left cursor-pointer relative ${
                  isSelected
                    ? 'border-theme-primary bg-theme-soft/20 dark:bg-stone-800/40 ring-2 ring-theme-primary/30 shadow-sm'
                    : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                }`}
              >
                {/* Multi-select check badge */}
                <div className="absolute top-2.5 right-2.5 z-10">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-theme-primary text-white shadow-xs ring-2 ring-white dark:ring-stone-900'
                        : 'border-2 border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                </div>

                {/* Mini Strip Representation with Clear Checkmarks on Selected Frames */}
                <div
                  className={`h-28 mb-3 rounded-xl flex items-center justify-center p-2 border transition-all ${
                    isSelected
                      ? 'bg-theme-soft/25 border-theme-primary/30 shadow-xs'
                      : 'bg-stone-50 dark:bg-stone-800 border-stone-100 dark:border-stone-700'
                  }`}
                >
                  <div
                    className={`bg-white dark:bg-stone-900 rounded p-1 flex flex-col gap-1 items-center justify-center shadow-xs transition-all ${
                      layout.id === 'single' ? 'w-16 h-20' : 'w-12 h-24'
                    } ${
                      isSelected
                        ? 'border-2 border-theme-primary shadow-sm'
                        : 'border border-stone-200 dark:border-stone-700'
                    }`}
                  >
                    {layout.slots.map((_, i) => (
                      <div
                        key={i}
                        className={`w-full rounded-[2px] flex-1 flex items-center justify-center gap-1 text-[8px] font-fredoka font-semibold transition-all ${
                          isSelected
                            ? 'bg-theme-soft/60 text-theme-primary border border-theme-primary/30 dark:bg-stone-800 dark:text-theme-primary'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-2.5 h-2.5 text-theme-primary flex-shrink-0" />
                            <span>{i + 1}</span>
                          </>
                        ) : (
                          <span>{i + 1}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <span className={`font-fredoka font-semibold text-sm block ${isSelected ? 'text-theme-primary' : 'text-black dark:text-white'}`}>
                    {layout.name}
                  </span>
                  <p className="text-[11px] text-black dark:text-stone-300 mt-0.5">
                    {layout.shotsCount} {layout.shotsCount === 1 ? 'Cut' : 'Cuts'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Built-in & Custom Themes (Locked until at least one layout is selected) */}
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-xs font-fredoka font-semibold text-theme-primary uppercase tracking-wider">
            <Palette className="w-3.5 h-3.5 text-theme-primary" />
            <span>2. Photostrip Theme</span>
          </div>
          {isThemeLocked && (
            <div className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              <Lock className="w-3 h-3" />
              <span>Select a layout first</span>
            </div>
          )}
        </div>

        {/* Enhanced Visual Photostrips Grid (4 Built-in + 1 Custom Theme) */}
        <div
          className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 transition-opacity duration-200 ${
            isThemeLocked ? 'opacity-40 pointer-events-none select-none' : 'opacity-100'
          }`}
        >
          {/* 4 Built-in Themes */}
          {TEMPLATES.filter(t => t.theme !== 'custom').map((tmpl) => {
            const isSelected = selectedTemplateId === tmpl.id;
            return (
              <div
                key={tmpl.id}
                onClick={() => !isThemeLocked && setSelectedTemplateId(tmpl.id)}
                className={`p-3 rounded-2xl bg-white dark:bg-stone-900 border-2 transition-all flex flex-col justify-between text-left cursor-pointer relative ${
                  isSelected
                    ? 'border-theme-primary bg-theme-soft/20 dark:bg-stone-800/40 ring-2 ring-theme-primary/30 shadow-sm'
                    : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                }`}
              >
                {/* Visual Authentic Vertical Photostrip Preview */}
                <div className="h-36 sm:h-40 rounded-xl p-2 mb-2 flex items-center justify-center bg-stone-50/70 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800 overflow-hidden relative">
                  <div
                    className={`w-16 sm:w-20 h-full rounded-md border p-1.5 flex flex-col justify-between items-center shadow-md transition-transform duration-200 relative ${
                      tmpl.theme === 'noir' ? 'ring-1 ring-stone-700' : ''
                    }`}
                    style={{
                      backgroundColor: tmpl.backgroundColor,
                      borderColor: tmpl.borderColor,
                    }}
                  >
                    {/* Simulated vertical cuts */}
                    <div className="w-full flex flex-col gap-1 items-center">
                      <div
                        className="w-full h-8 sm:h-9 rounded-[2px] border flex items-center justify-center text-[7px] font-fredoka font-semibold shadow-xs"
                        style={{
                          borderColor: tmpl.borderColor,
                          backgroundColor: tmpl.theme === 'noir' ? '#1F1F24' : tmpl.backgroundColor === '#FFFFFF' ? '#F1F5F9' : '#FFFFFF',
                          color: tmpl.textColor,
                        }}
                      >
                        <span>1</span>
                      </div>
                      <div
                        className="w-full h-8 sm:h-9 rounded-[2px] border flex items-center justify-center text-[7px] font-fredoka font-semibold shadow-xs"
                        style={{
                          borderColor: tmpl.borderColor,
                          backgroundColor: tmpl.theme === 'noir' ? '#1F1F24' : tmpl.backgroundColor === '#FFFFFF' ? '#F1F5F9' : '#FFFFFF',
                          color: tmpl.textColor,
                        }}
                      >
                        <span>2</span>
                      </div>
                    </div>

                    {/* Authentic mini stamp */}
                    <div className="w-full text-center pt-0.5">
                      <div className="text-[6px] font-fredoka font-bold leading-none" style={{ color: tmpl.textColor }}>
                        2026.09.25
                      </div>
                      <div
                        className="text-[7px] font-fredoka font-semibold tracking-wider leading-tight"
                        style={{ color: tmpl.theme === 'noir' ? '#FFD166' : tmpl.accentColor }}
                      >
                        kiwalibooth
                      </div>
                    </div>
                  </div>
                </div>

                {/* Details Footer */}
                <div className="flex items-center justify-between">
                  <div className="truncate">
                    <div className={`font-semibold text-xs truncate ${isSelected ? 'text-theme-primary' : 'text-black dark:text-white'}`}>
                      {tmpl.name}
                    </div>
                    <div className="text-[10px] text-stone-500 dark:text-stone-400 capitalize mt-0.5">
                      {tmpl.theme}
                    </div>
                  </div>

                  <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center ml-1">
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-theme-primary text-white flex items-center justify-center shadow-xs">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* 5th Theme: Custom Theme Card */}
          {(() => {
            const isSelected = selectedTemplateId === 'custom';
            return (
              <div
                onClick={() => {
                  if (isThemeLocked) return;
                  setSelectedTemplateId('custom');
                }}
                className={`p-3 rounded-2xl bg-white dark:bg-stone-900 border-2 transition-all flex flex-col justify-between text-left cursor-pointer relative ${
                  isSelected
                    ? 'border-theme-primary bg-theme-soft/20 dark:bg-stone-800/40 ring-2 ring-theme-primary/30 shadow-sm'
                    : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                }`}
              >
                {/* Visual Custom Photostrip Preview */}
                <div className="h-36 sm:h-40 rounded-xl p-2 mb-2 flex items-center justify-center bg-stone-50/70 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800 overflow-hidden relative">
                  <div
                    className="w-16 sm:w-20 h-full rounded-md border p-1.5 flex flex-col justify-between items-center shadow-md transition-transform duration-200 relative"
                    style={{
                      backgroundColor: customTheme.backgroundColor,
                      borderColor: customTheme.borderColor,
                    }}
                  >
                    {/* Simulated vertical cuts with custom colors */}
                    <div className="w-full flex flex-col gap-1 items-center">
                      <div
                        className="w-full h-8 sm:h-9 rounded-[2px] border flex items-center justify-center text-[7px] font-fredoka font-semibold shadow-xs"
                        style={{
                          borderColor: customTheme.borderColor,
                          backgroundColor: customTheme.backgroundColor === '#18181B' ? '#27272A' : '#FFFFFF',
                          color: customTheme.textColor,
                        }}
                      >
                        <span>1</span>
                      </div>
                      <div
                        className="w-full h-8 sm:h-9 rounded-[2px] border flex items-center justify-center text-[7px] font-fredoka font-semibold shadow-xs"
                        style={{
                          borderColor: customTheme.borderColor,
                          backgroundColor: customTheme.backgroundColor === '#18181B' ? '#27272A' : '#FFFFFF',
                          color: customTheme.textColor,
                        }}
                      >
                        <span>2</span>
                      </div>
                    </div>

                    {/* Stamp */}
                    <div className="w-full text-center pt-0.5">
                      <div className="text-[6px] font-fredoka font-bold leading-none" style={{ color: customTheme.textColor }}>
                        2026.09.25
                      </div>
                      <div
                        className="text-[7px] font-fredoka font-semibold tracking-wider leading-tight"
                        style={{ color: customTheme.accentColor }}
                      >
                        kiwalibooth
                      </div>
                    </div>
                  </div>
                </div>

                {/* Details Footer with Customize Action Button */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <div className="truncate">
                      <div className={`font-semibold text-xs truncate ${isSelected ? 'text-theme-primary' : 'text-black dark:text-white'}`}>
                        Custom Theme
                      </div>
                      <div className="text-[10px] text-stone-500 dark:text-stone-400 capitalize">
                        Personal colors
                      </div>
                    </div>

                    <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center ml-1">
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-theme-primary text-white flex items-center justify-center shadow-xs">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Customize colors pill button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isThemeLocked) return;
                      setSelectedTemplateId('custom');
                      setShowCustomThemeModal(true);
                    }}
                    className="w-full py-1 px-2 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-[10px] font-fredoka font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer border border-stone-200/80 dark:border-stone-700"
                  >
                    <Sliders className="w-2.5 h-2.5 text-theme-primary" />
                    <span>Edit Colors</span>
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Section 3: Canva Frame Overlay (Coming Soon) */}
      <div className="bg-stone-50/70 dark:bg-stone-900/50 rounded-2xl border border-dashed border-stone-300 dark:border-stone-800 p-3.5 sm:p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-stone-200/80 dark:bg-stone-800 flex items-center justify-center text-stone-500 flex-shrink-0">
            <Lock className="w-4 h-4 text-stone-500" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-fredoka font-semibold text-sm text-stone-800 dark:text-stone-200 whitespace-nowrap">
                Canva Frame Overlay
              </span>
              <span className="text-[10px] font-sans font-medium px-2.5 py-0.5 rounded-full bg-stone-200/80 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-300/80 dark:border-stone-700 whitespace-nowrap flex-shrink-0">
                Coming Soon
              </span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 font-sans">
              Upload your custom transparent Canva frames in an upcoming update.
            </p>
          </div>
        </div>
      </div>

      {/* Prominent Bottom Status & Desktop CTA Bar */}
      <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-stone-600 dark:text-stone-400 text-center sm:text-left">
          {selectedLayoutIds.length === 0 ? (
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              Please select at least one photobooth layout to continue.
            </span>
          ) : (
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1">
              <span className="text-stone-500 dark:text-stone-400 font-normal">Selected:</span>
              <strong className="font-fredoka font-bold text-sm text-theme-primary">{selectedLayoutNames}</strong>
              <span className="text-stone-500 dark:text-stone-400 font-normal">({totalRequiredShots} camera {totalRequiredShots === 1 ? 'shot' : 'shots'} total)</span>
            </div>
          )}
        </div>

        {/* Desktop CTA Button (Strictly hidden on mobile, displayed only on desktop sm:flex) */}
        <div className="hidden sm:flex items-center">
          <button
            onClick={() => setStep('capture')}
            disabled={!isLaunchReady}
            className={`soft-btn-coral text-sm px-8 py-3.5 flex items-center justify-center gap-2 transition-all ${
              isLaunchReady ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed shadow-none'
            }`}
          >
            {isLaunchReady ? (
              <>
                <Camera className="w-4 h-4" />
                <span>Launch Camera</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Select Layout &amp; Theme to Launch</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Custom Theme Customizer Modal Dialog */}
      <CustomThemeModal
        isOpen={showCustomThemeModal}
        onClose={() => setShowCustomThemeModal(false)}
      />
    </div>
  );
};
