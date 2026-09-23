import React, { useState, useRef, useEffect } from 'react';
import {
  SlidersHorizontal,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Check,
  Type,
  X
} from 'lucide-react';
import { useBooth } from '../context/useBooth';
import type { ColorTheme, AppFontSize } from '../types/photobooth';

export const NavbarToolsMenu: React.FC = () => {
  const {
    isMuted,
    setIsMuted,
    colorTheme,
    setColorTheme,
    isDarkMode,
    setIsDarkMode,
    fontSize,
    setFontSize,
  } = useBooth();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const palettes: { id: ColorTheme; name: string; color: string }[] = [
    { id: 'pink', name: 'Sweet Pink', color: '#FF6B81' },
    { id: 'blue', name: 'Sky Blue', color: '#3B82F6' },
    { id: 'pastel-red', name: 'Pastel Red', color: '#F87171' },
    { id: 'green', name: 'Mint Green', color: '#10B981' },
    { id: 'purple', name: 'Lavender', color: '#A855F7' },
    { id: 'amber', name: 'Sunny Amber', color: '#F59E0B' },
  ];

  const fontOptions: { id: AppFontSize; label: string }[] = [
    { id: 'compact', label: 'Compact' },
    { id: 'normal', label: 'Normal' },
    { id: 'large', label: 'Large' },
  ];

  return (
    <div className="relative" ref={menuRef}>
      {/* Tools Trigger Button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        title="Customization Tools & Preferences"
        className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
          isOpen
            ? 'border-kiwali-coral bg-kiwali-soft-pink/40 text-stone-900 dark:bg-stone-800 dark:border-stone-600 dark:text-white'
            : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800'
        }`}
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Preferences</span>
      </button>

      {/* Floating Tools Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-lg p-4 z-50 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
            <span className="text-xs font-semibold text-stone-900 dark:text-white">
              Booth Preferences
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Section 1: Palette Switcher */}
          <div>
            <span className="block text-[11px] font-medium text-stone-500 dark:text-stone-400 mb-2">
              Accent Palette
            </span>
            <div className="grid grid-cols-6 gap-2">
              {palettes.map((p) => {
                const isSelected = colorTheme === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setColorTheme(p.id)}
                    title={p.name}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform cursor-pointer relative ${
                      isSelected ? 'scale-110 ring-2 ring-stone-900 dark:ring-white ring-offset-2 dark:ring-offset-stone-900' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: p.color }}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Font Size */}
          <div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-stone-500 dark:text-stone-400 mb-2">
              <Type className="w-3.5 h-3.5" />
              <span>Text / Font Scale</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl">
              {fontOptions.map((f) => {
                const isSelected = fontSize === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setFontSize(f.id)}
                    className={`py-1 text-xs rounded-lg font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-sm'
                        : 'text-stone-500 dark:text-stone-400 hover:text-stone-800'
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Appearance (Light / Dark) */}
          <div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-stone-500 dark:text-stone-400 mb-2">
              <Sun className="w-3.5 h-3.5" />
              <span>Theme Mode</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl">
              <button
                onClick={() => setIsDarkMode(false)}
                className={`py-1.5 text-xs rounded-lg font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  !isDarkMode
                    ? 'bg-white text-stone-900 shadow-sm border border-stone-200/80 font-semibold'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Light</span>
              </button>

              <button
                onClick={() => setIsDarkMode(true)}
                className={`py-1.5 text-xs rounded-lg font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isDarkMode
                    ? 'bg-stone-900 text-white shadow-sm border border-stone-700 font-semibold'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-purple-400" />
                <span>Dark</span>
              </button>
            </div>
          </div>

          {/* Section 4: Sound FX (Sound On / Muted) */}
          <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-1 text-[11px] font-medium text-stone-500 dark:text-stone-400 mb-2">
              <Volume2 className="w-3.5 h-3.5" />
              <span>Camera &amp; Shutter Audio</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl">
              <button
                onClick={() => setIsMuted(false)}
                className={`py-1.5 text-xs rounded-lg font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  !isMuted
                    ? 'bg-white dark:bg-stone-900 text-emerald-700 dark:text-emerald-400 shadow-sm border border-stone-200/80 dark:border-stone-700 font-semibold'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Sound On</span>
              </button>

              <button
                onClick={() => setIsMuted(true)}
                className={`py-1.5 text-xs rounded-lg font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isMuted
                    ? 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 shadow-sm border border-stone-200/80 dark:border-stone-700 font-semibold'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                <VolumeX className="w-3.5 h-3.5 text-stone-400" />
                <span>Muted</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
