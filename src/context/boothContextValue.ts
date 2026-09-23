import { createContext } from 'react';
import type {
  BoothStep,
  LayoutId,
  CapturedPhoto,
  DateStampConfig,
  StickerItem,
  FilterType,
} from '../types/photobooth';

export interface BoothContextType {
  step: BoothStep;
  setStep: (step: BoothStep) => void;
  selectedLayoutId: LayoutId;
  setSelectedLayoutId: (id: LayoutId) => void;
  selectedTemplateId: string;
  setSelectedTemplateId: (id: string) => void;
  customOverlayUrl: string | null;
  setCustomOverlayUrl: (url: string | null) => void;
  photos: CapturedPhoto[];
  setPhotos: React.Dispatch<React.SetStateAction<CapturedPhoto[]>>;
  updatePhoto: (slotIndex: number, updates: Partial<CapturedPhoto>) => void;
  setGlobalFilter: (filter: FilterType) => void;
  retakeIndex: number | null;
  setRetakeIndex: (index: number | null) => void;
  dateStamp: DateStampConfig;
  setDateStamp: React.Dispatch<React.SetStateAction<DateStampConfig>>;
  stickers: StickerItem[];
  addSticker: (emoji: string, x?: number, y?: number) => void;
  updateSticker: (id: string, updates: Partial<StickerItem>) => void;
  removeSticker: (id: string) => void;
  finalImage: string | null;
  setFinalImage: (url: string | null) => void;
  isMuted: boolean;
  toggleMute: () => void;
  resetBooth: () => void;
}

export const BoothContext = createContext<BoothContextType | null>(null);
