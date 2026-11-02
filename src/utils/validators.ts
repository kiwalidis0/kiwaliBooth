import type {
  BoothStep,
  CapturedPhoto,
  FilterType,
  LayoutId,
  LayoutPhotoAssignments,
  SavedBoothSession,
  StickerItem,
  TemplateConfig,
} from '../types/photobooth';
import { DEFAULT_CUSTOM_THEME } from '../data/templates';

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

const VALID_STEPS = new Set<BoothStep>([
  'landing',
  'layout',
  'capture',
  'review',
  'editor',
  'download',
]);

const VALID_LAYOUT_IDS = new Set<LayoutId>([
  'single',
  'double',
  'triple',
  'classic4',
]);

const VALID_FILTERS = new Set<FilterType>([
  'normal',
  'warm',
  'vintage',
  'pastel',
  'bw',
  'cyber',
]);

/**
 * Validates whether a given string is a strictly valid 6-digit hex color (e.g. #FF00AA).
 */
export function isValidHexColor(color: unknown): color is string {
  return typeof color === 'string' && HEX_COLOR_REGEX.test(color);
}

/**
 * Escapes characters with special meaning in XML/SVG to prevent attribute or element injection.
 */
export function escapeXml(str: unknown): string {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Sanitizes and validates a custom theme object.
 * Returns DEFAULT_CUSTOM_THEME if validation fails.
 */
export function sanitizeTheme(theme: unknown): TemplateConfig {
  if (!theme || typeof theme !== 'object') {
    return DEFAULT_CUSTOM_THEME;
  }

  const candidate = theme as Partial<TemplateConfig>;

  if (
    !isValidHexColor(candidate.backgroundColor) ||
    !isValidHexColor(candidate.borderColor) ||
    !isValidHexColor(candidate.textColor) ||
    !isValidHexColor(candidate.accentColor)
  ) {
    return DEFAULT_CUSTOM_THEME;
  }

  return {
    id: 'custom',
    name: typeof candidate.name === 'string' && candidate.name.trim() ? candidate.name.slice(0, 50) : DEFAULT_CUSTOM_THEME.name,
    description: typeof candidate.description === 'string' ? candidate.description.slice(0, 150) : DEFAULT_CUSTOM_THEME.description,
    theme: 'custom',
    backgroundColor: candidate.backgroundColor,
    borderColor: candidate.borderColor,
    textColor: candidate.textColor,
    accentColor: candidate.accentColor,
  };
}

function isValidCapturedPhoto(photo: unknown): photo is CapturedPhoto {
  if (!photo || typeof photo !== 'object') return false;
  const p = photo as Partial<CapturedPhoto>;

  if (typeof p.id !== 'string' || !p.id) return false;
  if (typeof p.slotIndex !== 'number' || !Number.isInteger(p.slotIndex) || p.slotIndex < 0) return false;
  if (typeof p.dataUrl !== 'string' || (!p.dataUrl.startsWith('data:image/') && !p.dataUrl.startsWith('blob:'))) return false;
  if (typeof p.filter !== 'string' || !VALID_FILTERS.has(p.filter as FilterType)) return false;
  if (typeof p.x !== 'number' || !Number.isFinite(p.x)) return false;
  if (typeof p.y !== 'number' || !Number.isFinite(p.y)) return false;
  if (typeof p.scale !== 'number' || !Number.isFinite(p.scale) || p.scale <= 0) return false;
  if (typeof p.rotation !== 'number' || !Number.isFinite(p.rotation)) return false;
  if (typeof p.originalWidth !== 'number' || p.originalWidth <= 0) return false;
  if (typeof p.originalHeight !== 'number' || p.originalHeight <= 0) return false;

  if (p.adjustments) {
    const adj = p.adjustments;
    if (
      typeof adj.brightness !== 'number' ||
      typeof adj.contrast !== 'number' ||
      typeof adj.saturation !== 'number' ||
      typeof adj.warmth !== 'number'
    ) {
      return false;
    }
  }

  return true;
}

function isValidStickerItem(sticker: unknown): sticker is StickerItem {
  if (!sticker || typeof sticker !== 'object') return false;
  const s = sticker as Partial<StickerItem>;

  if (typeof s.id !== 'string' || !s.id) return false;
  if (typeof s.emoji !== 'string') return false;
  if (s.imageUrl !== undefined && typeof s.imageUrl !== 'string') return false;
  if (s.svgContent !== undefined && typeof s.svgContent !== 'string') return false;
  if (typeof s.x !== 'number' || !Number.isFinite(s.x)) return false;
  if (typeof s.y !== 'number' || !Number.isFinite(s.y)) return false;
  if (typeof s.scale !== 'number' || !Number.isFinite(s.scale) || s.scale <= 0) return false;
  if (typeof s.rotation !== 'number' || !Number.isFinite(s.rotation)) return false;

  return true;
}

function isValidLayoutPhotoAssignments(assignments: unknown): assignments is LayoutPhotoAssignments {
  if (!assignments || typeof assignments !== 'object') return false;
  for (const [key, val] of Object.entries(assignments as Record<string, unknown>)) {
    if (!VALID_LAYOUT_IDS.has(key as LayoutId)) return false;
    if (!Array.isArray(val) || !val.every(n => typeof n === 'number' && Number.isInteger(n) && n >= 0)) {
      return false;
    }
  }
  return true;
}

/**
 * Validates whether an unknown object loaded from storage conforms to SavedBoothSession.
 */
export function isSavedBoothSession(data: unknown): data is SavedBoothSession {
  if (!data || typeof data !== 'object') return false;
  const s = data as Partial<SavedBoothSession>;

  if (typeof s.timestamp !== 'number' || !Number.isFinite(s.timestamp) || s.timestamp <= 0) return false;
  if (typeof s.step !== 'string' || !VALID_STEPS.has(s.step as BoothStep)) return false;
  if (typeof s.selectedTemplateId !== 'string' || !s.selectedTemplateId) return false;

  if (typeof s.activeStudioLayoutId !== 'string' || !VALID_LAYOUT_IDS.has(s.activeStudioLayoutId as LayoutId)) {
    return false;
  }

  if (!Array.isArray(s.selectedLayoutIds) || !s.selectedLayoutIds.every(id => VALID_LAYOUT_IDS.has(id))) {
    return false;
  }

  if (!Array.isArray(s.photos) || !s.photos.every(isValidCapturedPhoto)) {
    return false;
  }

  if (!Array.isArray(s.stickers) || !s.stickers.every(isValidStickerItem)) {
    return false;
  }

  if (!s.dateStamp || typeof s.dateStamp !== 'object' || typeof s.dateStamp.enabled !== 'boolean') {
    return false;
  }

  if (s.layoutPhotoAssignments !== undefined && !isValidLayoutPhotoAssignments(s.layoutPhotoAssignments)) {
    return false;
  }

  if (s.captureOrientation !== undefined && s.captureOrientation !== 'portrait' && s.captureOrientation !== 'landscape') {
    return false;
  }

  return true;
}
