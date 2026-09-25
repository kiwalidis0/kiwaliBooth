import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type {
  BoothStep,
  LayoutId,
  CapturedPhoto,
  DateStampConfig,
  StickerItem,
  FilterType,
  ColorTheme,
  AppFontSize,
  CameraFacingMode,
  CaptureOrientation,
  LayoutPhotoAssignments,
  FinalImagesMap,
  TemplateConfig,
  PhotoAdjustments,
  SavedBoothSession,
} from '../types/photobooth';
import { LAYOUTS } from '../data/layouts';
import { TEMPLATES, DEFAULT_CUSTOM_THEME } from '../data/templates';
import { setSoundMuted } from '../utils/audio';
import { saveSessionToDb, loadSessionFromDb, clearSessionFromDb } from '../utils/sessionStorageDb';
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
  const [selectedLayoutIds, setSelectedLayoutIds] = useState<LayoutId[]>([]);
  const [activeStudioLayoutId, setActiveStudioLayoutId] = useState<LayoutId>('classic4');
  const [cameraFacingMode, setCameraFacingMode] = useState<CameraFacingMode>('user');
  const [captureOrientation, setCaptureOrientation] = useState<CaptureOrientation>('portrait');
  const [selectedTemplateId, setSelectedTemplateIdState] = useState<string>('classic-white');
  const [customTheme, setCustomThemeState] = useState<TemplateConfig>(() => {
    try {
      const saved = localStorage.getItem('kb_custom_theme');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore storage errors
    }
    return DEFAULT_CUSTOM_THEME;
  });
  const [customOverlayUrl, setCustomOverlayUrl] = useState<string | null>(null);
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [retakeIndex, setRetakeIndex] = useState<number | null>(null);
  const [finalImage, setFinalImage] = useState<string | null>(null);
  const [finalImages, setFinalImages] = useState<FinalImagesMap>({});

  const [layoutPhotoAssignments, setLayoutPhotoAssignments] = useState<LayoutPhotoAssignments>({
    single: [0],
    double: [0, 1],
    triple: [0, 1, 2],
    classic4: [0, 1, 2, 3],
  });

  const selectedLayoutId = selectedLayoutIds[0] || activeStudioLayoutId || 'classic4';
  const setSelectedLayoutId = (id: LayoutId) => {
    setSelectedLayoutIds([id]);
    setActiveStudioLayoutId(id);
  };

  const toggleLayoutId = (id: LayoutId) => {
    setSelectedLayoutIds(prev => {
      const exists = prev.includes(id);
      let updated: LayoutId[];
      if (exists) {
        updated = prev.filter(item => item !== id);
      } else {
        updated = [...prev, id];
      }
      if (updated.length > 0 && !updated.includes(activeStudioLayoutId)) {
        setActiveStudioLayoutId(updated[0]);
      }
      return updated;
    });
  };

  const totalRequiredShots = useMemo(() => {
    if (selectedLayoutIds.length === 0) return 0;
    return Math.max(...selectedLayoutIds.map(id => LAYOUTS[id]?.shotsCount || 1));
  }, [selectedLayoutIds]);

  const assignPhotoToSlot = (layoutId: LayoutId, slotIndex: number, photoIndex: number) => {
    setLayoutPhotoAssignments(prev => {
      const current = prev[layoutId] ? [...prev[layoutId]] : [0];
      current[slotIndex] = photoIndex;
      return {
        ...prev,
        [layoutId]: current,
      };
    });
  };

  const setFinalImageForLayout = (layoutId: LayoutId, url: string) => {
    setFinalImages(prev => ({ ...prev, [layoutId]: url }));
    setFinalImage(url);
  };

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
  const [savedSession, setSavedSession] = useState<SavedBoothSession | null>(null);

  // Load saved session from IndexedDB on initial mount
  useEffect(() => {
    let isCancelled = false;
    loadSessionFromDb().then(loaded => {
      if (!isCancelled && loaded && loaded.photos.length > 0) {
        setSavedSession(loaded);
      }
    });
    return () => {
      isCancelled = true;
    };
  }, []);

  // Debounced auto-save session whenever active photos or customizations change
  useEffect(() => {
    if (photos.length === 0 || step === 'landing') return;

    const timeout = setTimeout(() => {
      const session: SavedBoothSession = {
        step,
        photos,
        selectedLayoutIds,
        activeStudioLayoutId,
        selectedTemplateId,
        customOverlayUrl,
        dateStamp,
        stickers,
        timestamp: Date.now(),
      };
      saveSessionToDb(session).catch(() => {});
    }, 600);

    return () => clearTimeout(timeout);
  }, [step, photos, selectedLayoutIds, activeStudioLayoutId, selectedTemplateId, customOverlayUrl, dateStamp, stickers]);

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

  const setCustomTheme = useCallback((theme: TemplateConfig) => {
    setCustomThemeState(theme);
    try {
      localStorage.setItem('kb_custom_theme', JSON.stringify(theme));
    } catch {
      // ignore storage errors
    }
    setDateStamp(prev => ({
      ...prev,
      color: theme.textColor,
    }));
  }, []);

  const activeTemplate = useMemo(() => {
    if (selectedTemplateId === 'custom') {
      return customTheme;
    }
    return TEMPLATES.find(t => t.id === selectedTemplateId) || TEMPLATES[0];
  }, [selectedTemplateId, customTheme]);

  const setSelectedTemplateId = (id: string) => {
    setSelectedTemplateIdState(id);
    const template = id === 'custom' ? customTheme : TEMPLATES.find(t => t.id === id);
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

  const restoreSession = useCallback(() => {
    if (!savedSession) return;
    setPhotos(savedSession.photos);
    setSelectedLayoutIds(savedSession.selectedLayoutIds);
    setActiveStudioLayoutId(savedSession.activeStudioLayoutId);
    setSelectedTemplateIdState(savedSession.selectedTemplateId);
    setCustomOverlayUrl(savedSession.customOverlayUrl);
    setDateStamp(savedSession.dateStamp);
    setStickers(savedSession.stickers);
    setStep(savedSession.step || 'review');
    setSavedSession(null);
  }, [savedSession]);

  const discardSavedSession = useCallback(() => {
    clearSessionFromDb().catch(() => {});
    setSavedSession(null);
  }, []);

  const updatePhotoAdjustment = useCallback((slotIndex: number, adjustments: Partial<PhotoAdjustments>) => {
    setPhotos(prev =>
      prev.map(p => {
        if (p.slotIndex !== slotIndex) return p;
        const current: PhotoAdjustments = p.adjustments || {
          brightness: 0,
          contrast: 0,
          saturation: 0,
          warmth: 0,
        };
        return {
          ...p,
          adjustments: { ...current, ...adjustments },
        };
      })
    );
  }, []);

  const reorderPhotos = useCallback((fromIndex: number, toIndex: number) => {
    setPhotos(prev => {
      const sourcePhoto = prev.find(p => p.slotIndex === fromIndex);
      const targetPhoto = prev.find(p => p.slotIndex === toIndex);

      if (!sourcePhoto || !targetPhoto) return prev;

      return prev.map(p => {
        if (p.slotIndex === fromIndex) {
          return { ...p, slotIndex: toIndex };
        }
        if (p.slotIndex === toIndex) {
          return { ...p, slotIndex: fromIndex };
        }
        return p;
      }).sort((a, b) => a.slotIndex - b.slotIndex);
    });
  }, []);

  const resetBooth = () => {
    setSelectedLayoutIds([]);
    setPhotos([]);
    setStickers([]);
    setRetakeIndex(null);
    setFinalImage(null);
    setFinalImages({});
    setLayoutPhotoAssignments({
      single: [0],
      double: [0, 1],
      triple: [0, 1, 2],
      classic4: [0, 1, 2, 3],
    });
    clearSessionFromDb().catch(() => {});
    setSavedSession(null);
    setStep('landing');
  };

  const saveHandlerRef = useRef<(() => Promise<void>) | null>(null);
  const registerSaveHandler = useCallback((handler: (() => Promise<void>) | null) => {
    saveHandlerRef.current = handler;
  }, []);

  const triggerSavePhotostrip = useCallback(async () => {
    if (saveHandlerRef.current) {
      await saveHandlerRef.current();
    } else {
      setStep('download');
    }
  }, []);

  const downloadHandlerRef = useRef<(() => void) | null>(null);
  const registerDownloadHandler = useCallback((handler: (() => void) | null) => {
    downloadHandlerRef.current = handler;
  }, []);

  const triggerDownloadPhotostrip = useCallback(() => {
    if (downloadHandlerRef.current) {
      downloadHandlerRef.current();
    } else if (finalImage) {
      const link = document.createElement('a');
      link.download = `kiwalibooth-${Date.now()}.png`;
      link.href = finalImage;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [finalImage]);

  const isLaunchReady = selectedLayoutIds.length > 0 && !!selectedTemplateId;
  const isReviewComplete = totalRequiredShots > 0 && photos.length >= totalRequiredShots;

  return (
    <BoothContext.Provider
      value={{
        step,
        setStep,
        selectedLayoutId,
        setSelectedLayoutId,
        selectedLayoutIds,
        setSelectedLayoutIds,
        toggleLayoutId,
        activeStudioLayoutId,
        setActiveStudioLayoutId,
        totalRequiredShots,
        layoutPhotoAssignments,
        setLayoutPhotoAssignments,
        assignPhotoToSlot,
        cameraFacingMode,
        setCameraFacingMode,
        captureOrientation,
        setCaptureOrientation,
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
        setStickers,
        addSticker,
        updateSticker,
        removeSticker,
        finalImage,
        setFinalImage,
        finalImages,
        setFinalImages,
        setFinalImageForLayout,
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
        customTheme,
        setCustomTheme,
        activeTemplate,
        registerSaveHandler,
        triggerSavePhotostrip,
        registerDownloadHandler,
        triggerDownloadPhotostrip,
        isLaunchReady,
        isReviewComplete,
        savedSession,
        restoreSession,
        discardSavedSession,
        updatePhotoAdjustment,
        reorderPhotos,
      }}
    >
      {children}
    </BoothContext.Provider>
  );
};
