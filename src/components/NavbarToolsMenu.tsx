import React, { useState, useRef, useEffect } from 'react';
import {
  Palette,
  ChevronDown,
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
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
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

  const activePalette = palettes.find(p => p.id === colorTheme) || palettes[0];

  return (
    <div className="relative" ref={menuRef}>
      {/* Theme & Settings Button (Icon-only on mobile to prevent clutter, full pill on sm+) */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        title="Customize Theme, Fonts & Sound"
        className={`w-8 h-8 sm:w-auto sm:px-3 sm:py-1.5 rounded-full border text-xs font-semibold flex items-center justify-center sm:gap-2 transition-all cursor-pointer shadow-xs flex-shrink-0 ${
          isOpen
            ? 'border-theme-primary bg-theme-soft/50 dark:bg-stone-800 ring-2 ring-theme-primary/30 text-black dark:text-white'
            : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-black dark:text-white hover:border-theme-primary hover:bg-theme-soft/20 dark:hover:bg-stone-800'
        }`}
      >
        <span
          className="hidden sm:inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-xs ring-2 ring-white dark:ring-stone-900"
          style={{ backgroundColor: activePalette.color }}
        />
        <Palette className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-theme-primary" />
        <span className="hidden sm:inline font-sans font-semibold">Theme</span>
        <ChevronDown
          className={`hidden sm:inline-block w-3 h-3 text-stone-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Floating Tools Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xl p-4 z-50 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-theme-primary" />
              <span className="font-fredoka font-semibold text-sm text-theme-primary">
                Booth Theme &amp; Settings
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-stone-400 hover:text-black dark:hover:text-white p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Section 1: Palette Switcher */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-fredoka font-semibold text-xs text-black dark:text-white">
                Accent Palette
              </span>
              <span className="text-[11px] font-medium text-theme-primary">
                {activePalette.name}
              </span>
            </div>
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
            <div className="flex items-center gap-1 text-xs font-fredoka font-semibold text-black dark:text-white mb-2">
              <Type className="w-3.5 h-3.5 text-theme-primary" />
              <span>Text Scale</span>
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
                        ? 'border border-theme-primary bg-theme-soft/50 text-theme-primary font-semibold shadow-xs'
                        : 'text-stone-600 dark:text-stone-400 hover:text-black dark:hover:text-white'
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
            <div className="flex items-center gap-1 text-xs font-fredoka font-semibold text-black dark:text-white mb-2">
              <Sun className="w-3.5 h-3.5 text-theme-primary" />
              <span>Display Mode</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl">
              <button
                onClick={() => setIsDarkMode(false)}
                className={`py-1.5 text-xs rounded-lg font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  !isDarkMode
                    ? 'bg-white text-black shadow-sm border border-stone-200/80 font-semibold'
                    : 'text-stone-600 dark:text-stone-400 hover:text-black dark:hover:text-white'
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
                    : 'text-stone-600 dark:text-stone-400 hover:text-black dark:hover:text-white'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-purple-400" />
                <span>Dark</span>
              </button>
            </div>
          </div>

          {/* Section 4: Sound FX (Sound On / Muted) */}
          <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-1 text-xs font-fredoka font-semibold text-black dark:text-white mb-2">
              <Volume2 className="w-3.5 h-3.5 text-theme-primary" />
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
