import React, { useState, useEffect } from 'react';
import { Palette, X, RotateCcw, Check, Sparkles } from 'lucide-react';
import { useBooth } from '../context/useBooth';
import { DEFAULT_CUSTOM_THEME } from '../data/templates';
import type { TemplateConfig } from '../types/photobooth';

interface CustomThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PresetPalette {
  name: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  accentColor: string;
}

const PRESET_PALETTES: PresetPalette[] = [
  {
    name: 'Sunset Coral',
    backgroundColor: '#FFF5F0',
    borderColor: '#FED7AA',
    textColor: '#9A3412',
    accentColor: '#FF6F61',
  },
  {
    name: 'Matcha Latte',
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    textColor: '#166534',
    accentColor: '#22C55E',
  },
  {
    name: 'Pastel Lilac',
    backgroundColor: '#FAF5FF',
    borderColor: '#E9D5FF',
    textColor: '#6B21A8',
    accentColor: '#A855F7',
  },
  {
    name: 'Ocean Breeze',
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    textColor: '#075985',
    accentColor: '#0EA5E9',
  },
  {
    name: 'Vintage Sepia',
    backgroundColor: '#FEF3C7',
    borderColor: '#E5D5B8',
    textColor: '#78350F',
    accentColor: '#D97706',
  },
  {
    name: 'Obsidian Gold',
    backgroundColor: '#18181B',
    borderColor: '#3F3F46',
    textColor: '#FAFAFA',
    accentColor: '#F59E0B',
  },
];

const CustomThemeModalDialog: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { customTheme, setCustomTheme, setSelectedTemplateId } = useBooth();
  const [draft, setDraft] = useState<TemplateConfig>(customTheme);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleApplyPreset = (p: PresetPalette) => {
    setDraft(prev => ({
      ...prev,
      backgroundColor: p.backgroundColor,
      borderColor: p.borderColor,
      textColor: p.textColor,
      accentColor: p.accentColor,
    }));
  };

  const handleReset = () => {
    setDraft(DEFAULT_CUSTOM_THEME);
  };

  const handleSaveAndApply = () => {
    setCustomTheme(draft);
    setSelectedTemplateId('custom');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden flex flex-col max-h-[94vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-theme-soft/50 flex items-center justify-center text-theme-primary flex-shrink-0">
              <Palette className="w-4 h-4 text-theme-primary" />
            </div>
            <div>
              <h3 className="font-fredoka font-semibold text-base sm:text-lg text-black dark:text-white leading-tight">
                Customize Photostrip Theme
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 font-sans">
                Fine-tune colors for cutouts, borders, and stamps.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body: Compact layout with fully contained preview */}
        <div className="p-3.5 sm:p-5 overflow-y-auto space-y-3.5">
          {/* Top: Fully Contained Compact Live Preview */}
          <div className="flex flex-col items-center pt-1">
            <span className="text-[10px] font-fredoka font-semibold text-stone-500 dark:text-stone-400 mb-1.5 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-theme-primary" /> Live Preview
            </span>
            <div
              className="w-32 rounded-xl p-2 flex flex-col items-center justify-between shadow-md border transition-all duration-200"
              style={{
                backgroundColor: draft.backgroundColor,
                borderColor: draft.borderColor,
              }}
            >
              {/* Simulated mini photo cutouts */}
              <div className="w-full flex flex-col gap-1.5">
                <div
                  className="w-full h-11 rounded border flex items-center justify-center text-[9px] font-fredoka font-semibold shadow-xs"
                  style={{
                    borderColor: draft.borderColor,
                    backgroundColor: draft.backgroundColor === '#18181B' ? '#27272A' : '#FFFFFF',
                    color: draft.textColor,
                  }}
                >
                  <span>Cut #1</span>
                </div>
                <div
                  className="w-full h-11 rounded border flex items-center justify-center text-[9px] font-fredoka font-semibold shadow-xs"
                  style={{
                    borderColor: draft.borderColor,
                    backgroundColor: draft.backgroundColor === '#18181B' ? '#27272A' : '#FFFFFF',
                    color: draft.textColor,
                  }}
                >
                  <span>Cut #2</span>
                </div>
              </div>

              {/* Bottom stamp */}
              <div className="w-full text-center mt-2 pt-1 border-t" style={{ borderColor: draft.borderColor }}>
                <div className="text-[8px] font-fredoka font-bold leading-tight" style={{ color: draft.textColor }}>
                  2026.09.25
                </div>
                <div
                  className="text-[9px] font-fredoka font-semibold tracking-wider"
                  style={{ color: draft.accentColor }}
                >
                  kiwalibooth
                </div>
              </div>
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="block text-[11px] font-fredoka font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Quick Preset Palettes
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {PRESET_PALETTES.map((preset) => {
                const isCurrent =
                  draft.backgroundColor === preset.backgroundColor &&
                  draft.textColor === preset.textColor &&
                  draft.borderColor === preset.borderColor &&
                  draft.accentColor === preset.accentColor;

                return (
                  <button
                    key={preset.name}
                    onClick={() => handleApplyPreset(preset)}
                    className={`px-2 py-1 rounded-xl border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                      isCurrent
                        ? 'border-theme-primary bg-theme-soft/30 font-semibold'
                        : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 bg-white dark:bg-stone-900'
                    }`}
                  >
                    <span className="truncate text-[11px]">{preset.name}</span>
                    <div className="flex -space-x-1 flex-shrink-0 ml-1">
                      <span
                        className="w-3 h-3 rounded-full border border-white dark:border-stone-900"
                        style={{ backgroundColor: preset.backgroundColor }}
                      />
                      <span
                        className="w-3 h-3 rounded-full border border-white dark:border-stone-900"
                        style={{ backgroundColor: preset.accentColor }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4 Compact Color Selector Rows */}
          <div className="space-y-1.5 pt-0.5">
            {/* 1. Background Color */}
            <div className="flex items-center justify-between gap-2 py-1.5 px-3 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700">
              <div>
                <span className="block text-xs font-fredoka font-semibold text-stone-900 dark:text-stone-100">
                  Background Color
                </span>
                <span className="text-[10px] text-stone-500 dark:text-stone-400">
                  Photostrip base paper
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <input
                  type="color"
                  value={draft.backgroundColor}
                  onChange={e => setDraft(prev => ({ ...prev, backgroundColor: e.target.value }))}
                  className="w-7 h-7 rounded-lg border border-stone-300 dark:border-stone-600 cursor-pointer p-0 bg-transparent"
                />
                <input
                  type="text"
                  value={draft.backgroundColor}
                  onChange={e => setDraft(prev => ({ ...prev, backgroundColor: e.target.value }))}
                  className="w-18 px-1.5 py-0.5 text-xs font-mono rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-black dark:text-white uppercase text-center"
                />
              </div>
            </div>

            {/* 2. Text / Font Color */}
            <div className="flex items-center justify-between gap-2 py-1.5 px-3 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700">
              <div>
                <span className="block text-xs font-fredoka font-semibold text-stone-900 dark:text-stone-100">
                  Text / Font Color
                </span>
                <span className="text-[10px] text-stone-500 dark:text-stone-400">
                  Date stamp &amp; caption
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <input
                  type="color"
                  value={draft.textColor}
                  onChange={e => setDraft(prev => ({ ...prev, textColor: e.target.value }))}
                  className="w-7 h-7 rounded-lg border border-stone-300 dark:border-stone-600 cursor-pointer p-0 bg-transparent"
                />
                <input
                  type="text"
                  value={draft.textColor}
                  onChange={e => setDraft(prev => ({ ...prev, textColor: e.target.value }))}
                  className="w-18 px-1.5 py-0.5 text-xs font-mono rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-black dark:text-white uppercase text-center"
                />
              </div>
            </div>

            {/* 3. Border Color */}
            <div className="flex items-center justify-between gap-2 py-1.5 px-3 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700">
              <div>
                <span className="block text-xs font-fredoka font-semibold text-stone-900 dark:text-stone-100">
                  Border Color
                </span>
                <span className="text-[10px] text-stone-500 dark:text-stone-400">
                  Cutout frame lines
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <input
                  type="color"
                  value={draft.borderColor}
                  onChange={e => setDraft(prev => ({ ...prev, borderColor: e.target.value }))}
                  className="w-7 h-7 rounded-lg border border-stone-300 dark:border-stone-600 cursor-pointer p-0 bg-transparent"
                />
                <input
                  type="text"
                  value={draft.borderColor}
                  onChange={e => setDraft(prev => ({ ...prev, borderColor: e.target.value }))}
                  className="w-18 px-1.5 py-0.5 text-xs font-mono rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-black dark:text-white uppercase text-center"
                />
              </div>
            </div>

            {/* 4. Accent Color */}
            <div className="flex items-center justify-between gap-2 py-1.5 px-3 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700">
              <div>
                <span className="block text-xs font-fredoka font-semibold text-stone-900 dark:text-stone-100">
                  Accent Color
                </span>
                <span className="text-[10px] text-stone-500 dark:text-stone-400">
                  Brand signature &amp; stamps
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <input
                  type="color"
                  value={draft.accentColor}
                  onChange={e => setDraft(prev => ({ ...prev, accentColor: e.target.value }))}
                  className="w-7 h-7 rounded-lg border border-stone-300 dark:border-stone-600 cursor-pointer p-0 bg-transparent"
                />
                <input
                  type="text"
                  value={draft.accentColor}
                  onChange={e => setDraft(prev => ({ ...prev, accentColor: e.target.value }))}
                  className="w-18 px-1.5 py-0.5 text-xs font-mono rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-black dark:text-white uppercase text-center"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer: Clean single-line buttons with high contrast */}
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2 bg-stone-50/70 dark:bg-stone-900/70 flex-shrink-0">
          <button
            onClick={handleReset}
            className="text-xs text-stone-800 dark:text-stone-200 hover:text-black dark:hover:text-white font-semibold flex items-center gap-1.5 cursor-pointer py-1.5 px-2 rounded-lg hover:bg-stone-200/70 dark:hover:bg-stone-800 transition-colors whitespace-nowrap"
            title="Reset to default custom theme colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-700 dark:text-stone-300" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={onClose}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-medium hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAndApply}
              className="soft-btn-coral text-xs px-3.5 sm:px-5 py-1.5 sm:py-2 flex items-center gap-1.5 font-semibold shadow-md cursor-pointer whitespace-nowrap"
            >
              <Check className="w-4 h-4" />
              <span>Apply Theme</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CustomThemeModal: React.FC<CustomThemeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return <CustomThemeModalDialog onClose={onClose} />;
};
