export type BoothStep = 'landing' | 'layout' | 'capture' | 'review' | 'editor' | 'download';

export type ColorTheme = 'pink' | 'blue' | 'pastel-red' | 'green' | 'purple' | 'amber';

export type AppFontSize = 'compact' | 'normal' | 'large';

export type LayoutId = 'single' | 'double' | 'triple' | 'classic4';

export interface PhotoSlot {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  borderRadius: number;
}

export interface LayoutConfig {
  id: LayoutId;
  name: string;
  subtitle: string;
  shotsCount: number;
  width: number;
  height: number;
  slots: PhotoSlot[];
}

export type FilterType = 'normal' | 'warm' | 'vintage' | 'pastel' | 'bw' | 'cyber';

export interface FilterConfig {
  id: FilterType;
  name: string;
  cssFilter: string;
  colorGrade: string; // Tailwind color or hex for swatch
}

export interface CapturedPhoto {
  id: string;
  slotIndex: number;
  dataUrl: string;
  filter: FilterType;
  x: number; // relative pan within slot
  y: number;
  scale: number; // 1.0 = fit/cover default
  rotation: number;
  originalWidth: number;
  originalHeight: number;
}

export type TemplateTheme = 'white' | 'colorblocks' | 'pastel' | 'noir' | 'custom';

export interface TemplateConfig {
  id: string;
  name: string;
  description: string;
  theme: TemplateTheme;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  accentColor: string;
  customOverlayUrl?: string; // transparent PNG uploaded from Canva
}

export type StampFont = 'Plus Jakarta Sans' | 'Fredoka' | 'Gaegu' | 'Space Mono';
export type StampFormat = 'YYYY.MM.DD' | 'DD.MM.YYYY' | 'custom';

export interface DateStampConfig {
  enabled: boolean;
  font: StampFont;
  color: string;
  format: StampFormat;
  customText: string;
  fontSize?: number;
}

export interface StickerItem {
  id: string;
  emoji: string;
  imageUrl?: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}
