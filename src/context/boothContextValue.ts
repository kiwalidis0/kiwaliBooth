import { createContext } from 'react';
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
  SavedBoothSession,
  PhotoAdjustments,
} from '../types/photobooth';

export interface BoothContextType {
  step: BoothStep;
  setStep: (step: BoothStep) => void;
  selectedLayoutId: LayoutId;
  setSelectedLayoutId: (id: LayoutId) => void;
  selectedLayoutIds: LayoutId[];
  setSelectedLayoutIds: (ids: LayoutId[]) => void;
  toggleLayoutId: (id: LayoutId) => void;
  activeStudioLayoutId: LayoutId;
  setActiveStudioLayoutId: (id: LayoutId) => void;
  totalRequiredShots: number;
  layoutPhotoAssignments: LayoutPhotoAssignments;
  setLayoutPhotoAssignments: React.Dispatch<React.SetStateAction<LayoutPhotoAssignments>>;
  assignPhotoToSlot: (layoutId: LayoutId, slotIndex: number, photoIndex: number) => void;
  cameraFacingMode: CameraFacingMode;
  setCameraFacingMode: (mode: CameraFacingMode) => void;
  captureOrientation: CaptureOrientation;
  setCaptureOrientation: (orientation: CaptureOrientation) => void;
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
  setStickers: React.Dispatch<React.SetStateAction<StickerItem[]>>;
  addSticker: (emoji: string, x?: number, y?: number, imageUrl?: string) => void;
  updateSticker: (id: string, updates: Partial<StickerItem>) => void;
  removeSticker: (id: string) => void;
  finalImage: string | null;
  setFinalImage: (url: string | null) => void;
  finalImages: FinalImagesMap;
  setFinalImages: React.Dispatch<React.SetStateAction<FinalImagesMap>>;
  setFinalImageForLayout: (layoutId: LayoutId, url: string) => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  toggleMute: () => void;
  colorTheme: ColorTheme;
  setColorTheme: (theme: ColorTheme) => void;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  toggleDarkMode: () => void;
  fontSize: AppFontSize;
  setFontSize: (size: AppFontSize) => void;
  resetBooth: () => void;
  customTheme: TemplateConfig;
  setCustomTheme: (theme: TemplateConfig) => void;
  activeTemplate: TemplateConfig;
  registerSaveHandler: (handler: (() => Promise<void>) | null) => void;
  triggerSavePhotostrip: () => Promise<void>;
  registerDownloadHandler: (handler: (() => void) | null) => void;
  triggerDownloadPhotostrip: () => void;
  isLaunchReady: boolean;
  isReviewComplete: boolean;
  savedSession: SavedBoothSession | null;
  restoreSession: () => void;
  discardSavedSession: () => void;
  updatePhotoAdjustment: (slotIndex: number, adjustments: Partial<PhotoAdjustments>) => void;
  reorderPhotos: (fromIndex: number, toIndex: number) => void;
}

export const BoothContext = createContext<BoothContextType | null>(null);
