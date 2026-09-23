import React, { useState, useEffect } from 'react';
import type {
  BoothStep,
  LayoutId,
  CapturedPhoto,
  DateStampConfig,
  StickerItem,
  FilterType,
} from '../types/photobooth';
import { LAYOUTS } from '../data/layouts';
import { TEMPLATES } from '../data/templates';
import { setSoundMuted } from '../utils/audio';
import { BoothContext } from './boothContextValue';

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
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const [dateStamp, setDateStamp] = useState<DateStampConfig>({
    enabled: true,
    font: 'Space Mono',
    color: '#111116',
    format: 'YYYY.MM.DD',
    customText: getFormattedDate('YYYY.MM.DD'),
  });

  const [stickers, setStickers] = useState<StickerItem[]>([]);

  // Keep audio module in sync
  useEffect(() => {
    setSoundMuted(isMuted);
  }, [isMuted]);

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
      rotation: Math.floor(Math.random() * 30 - 15),
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
    setStep('landing');
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
        toggleMute,
        resetBooth,
      }}
    >
      {children}
    </BoothContext.Provider>
  );
};
