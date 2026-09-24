import React, { useState, useEffect } from 'react';
import type {
  BoothStep,
  LayoutId,
  CapturedPhoto,
  DateStampConfig,
  StickerItem,
  FilterType,
  ColorTheme,
  AppFontSize,
} from '../types/photobooth';
import { LAYOUTS } from '../data/layouts';
import { TEMPLATES } from '../data/templates';
import { setSoundMuted } from '../utils/audio';
import { BoothContext } from './boothContextValue';

const THEME_PALETTES: Record<
  ColorTheme,
  { primary: string; hover: string; soft: string; border: string; rgb: string; softRgb: string }
> = {
  pink: {
    primary: '#FF6B81',
    hover: '#FF526C',
    soft: '#FFE4E8',
    border: 'rgba(255, 107, 129, 0.4)',
    rgb: '255 107 129',
    softRgb: '255 228 232',
  },
  blue: {
    primary: '#3B82F6',
    hover: '#2563EB',
    soft: '#DBEAFE',
    border: 'rgba(59, 130, 246, 0.4)',
    rgb: '59 130 246',
    softRgb: '219 234 254',
  },
  'pastel-red': {
    primary: '#F87171',
    hover: '#EF4444',
    soft: '#FEE2E2',
    border: 'rgba(248, 113, 113, 0.4)',
    rgb: '248 113 113',
    softRgb: '254 226 226',
  },
  green: {
    primary: '#10B981',
    hover: '#059669',
    soft: '#D1FAE5',
    border: 'rgba(16, 185, 129, 0.4)',
    rgb: '16 185 129',
    softRgb: '209 250 229',
  },
  purple: {
    primary: '#A855F7',
    hover: '#9333EA',
    soft: '#F3E8FF',
    border: 'rgba(168, 85, 247, 0.4)',
    rgb: '168 85 247',
    softRgb: '243 232 255',
  },
  amber: {
    primary: '#F59E0B',
    hover: '#D97706',
    soft: '#FEF3C7',
    border: 'rgba(245, 158, 11, 0.4)',
    rgb: '245 158 11',
    softRgb: '254 243 199',
  },
};

function getFormattedDate(format: 'YYYY.MM.DD' | 'DD.MM.YYYY' = 'YYYY.MM.DD'): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return format === 'YYYY.MM.DD' ? `${year}.${month}.${day}` : `${day}.${month}.${year}`;
}

export const BoothProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [step, setStep] = useState<BoothStep>('landing');
  const [selectedLayoutId, setSelectedLayoutId] = useState<LayoutId>('classic4');
  const [selectedTemplateId, setSelectedTemplateIdState] = useState<string>('classic-white');
  const [customOverlayUrl, setCustomOverlayUrl] = useState<string | null>(null);
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [retakeIndex, setRetakeIndex] = useState<number | null>(null);
  const [finalImage, setFinalImage] = useState<string | null>(null);

  // Global Preferences with safe localStorage hydration
  const [colorTheme, setColorTheme] = useState<ColorTheme>(() => {
    try {
      const saved = localStorage.getItem('kb_theme');
      if (saved && saved in THEME_PALETTES) return saved as ColorTheme;
    } catch {
      // ignore storage errors
    }
    return 'pink';
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('kb_dark');
      if (saved !== null) return saved === 'true';
    } catch {
      // ignore storage errors
    }
    return false; // Default: Light mode
  });

  const [fontSize, setFontSize] = useState<AppFontSize>(() => {
    try {
      const saved = localStorage.getItem('kb_fontsize');
      if (saved === 'compact' || saved === 'normal' || saved === 'large') return saved;
    } catch {
      // ignore storage errors
    }
    return 'normal';
  });

  const [isMuted, setIsMuted] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('kb_muted');
      if (saved !== null) return saved === 'true';
    } catch {
      // ignore storage errors
    }
    return false; // Default: Sound on
  });

  const [dateStamp, setDateStamp] = useState<DateStampConfig>({
    enabled: true,
    font: 'Fredoka',
    color: '#111116',
    format: 'YYYY.MM.DD',
    customText: getFormattedDate('YYYY.MM.DD'),
    fontSize: 20,
  });

  const [stickers, setStickers] = useState<StickerItem[]>([]);

  // Keep audio module in sync & persist
  useEffect(() => {
    setSoundMuted(isMuted);
    try {
      localStorage.setItem('kb_muted', String(isMuted));
    } catch {
      // ignore storage errors
    }
  }, [isMuted]);

  // Sync colorTheme with CSS variables & persist
  useEffect(() => {
    const root = document.documentElement;
    const palette = THEME_PALETTES[colorTheme] || THEME_PALETTES.pink;
    root.style.setProperty('--theme-primary', palette.primary);
    root.style.setProperty('--theme-primary-hover', palette.hover);
    root.style.setProperty('--theme-primary-soft', palette.soft);
    root.style.setProperty('--theme-primary-border', palette.border);
    root.style.setProperty('--theme-primary-rgb', palette.rgb);
    root.style.setProperty('--theme-soft-rgb', palette.softRgb);
    try {
      localStorage.setItem('kb_theme', colorTheme);
    } catch {
      // ignore storage errors
    }
  }, [colorTheme]);

  // Sync Dark Mode class, colorScheme & persist
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      document.body.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
    try {
      localStorage.setItem('kb_dark', String(isDarkMode));
    } catch {
      // ignore storage errors
    }
  }, [isDarkMode]);

  // Sync Font Size & persist
  useEffect(() => {
    const root = document.documentElement;
    if (fontSize === 'compact') {
      root.style.fontSize = '15px';
    } else if (fontSize === 'large') {
      root.style.fontSize = '17px';
    } else {
      root.style.fontSize = '16px';
    }
    try {
      localStorage.setItem('kb_fontsize', fontSize);
    } catch {
      // ignore storage errors
    }
  }, [fontSize]);

  const setSelectedTemplateId = (id: string) => {
    setSelectedTemplateIdState(id);
    const template = TEMPLATES.find(t => t.id === id);
    if (template) {
      setDateStamp(prev => ({
        ...prev,
        color: template.theme === 'noir' ? '#F8FAFC' : template.textColor,
      }));
    }
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const updatePhoto = (slotIndex: number, updates: Partial<CapturedPhoto>) => {
    setPhotos(prev =>
      prev.map(p => (p.slotIndex === slotIndex ? { ...p, ...updates } : p))
    );
  };

  const setGlobalFilter = (filter: FilterType) => {
    setPhotos(prev => prev.map(p => ({ ...p, filter })));
  };

  const addSticker = (emoji: string, x?: number, y?: number) => {
    const layout = LAYOUTS[selectedLayoutId];
    const newSticker: StickerItem = {
      id: `sticker-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      emoji,
      x: x !== undefined ? x : layout.width / 2 + (Math.random() * 80 - 40),
      y: y !== undefined ? y : layout.height / 2 + (Math.random() * 80 - 40),
      scale: 1,
      rotation: 0,
    };
    setStickers(prev => [...prev, newSticker]);
  };

  const updateSticker = (id: string, updates: Partial<StickerItem>) => {
    setStickers(prev =>
      prev.map(s => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const removeSticker = (id: string) => {
    setStickers(prev => prev.filter(s => s.id !== id));
  };

  const resetBooth = () => {
    setPhotos([]);
    setStickers([]);
    setRetakeIndex(null);
    setFinalImage(null);
  };

  return (
    <BoothContext.Provider
      value={{
        step,
        setStep,
        selectedLayoutId,
        setSelectedLayoutId,
        selectedTemplateId,
        setSelectedTemplateId,
        customOverlayUrl,
        setCustomOverlayUrl,
        photos,
        setPhotos,
        updatePhoto,
        setGlobalFilter,
        retakeIndex,
        setRetakeIndex,
        dateStamp,
        setDateStamp,
        stickers,
        addSticker,
        updateSticker,
        removeSticker,
        finalImage,
        setFinalImage,
        isMuted,
        setIsMuted,
        toggleMute,
        colorTheme,
        setColorTheme,
        isDarkMode,
        setIsDarkMode,
        toggleDarkMode,
        fontSize,
        setFontSize,
        resetBooth,
      }}
    >
      {children}
    </BoothContext.Provider>
  );
};
