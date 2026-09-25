import type { FilterConfig, FilterType, PhotoAdjustments } from '../types/photobooth';

export const FILTERS: Record<FilterType, FilterConfig> = {
  normal: {
    id: 'normal',
    name: 'Normal',
    cssFilter: 'none',
    colorGrade: '#94a3b8',
  },
  warm: {
    id: 'warm',
    name: 'Warm Glow',
    cssFilter: 'sepia(0.2) saturate(1.2) contrast(1.05) brightness(1.06)',
    colorGrade: '#f59e0b',
  },
  vintage: {
    id: 'vintage',
    name: 'Film 90s',
    cssFilter: 'sepia(0.4) contrast(1.15) brightness(0.95) saturate(0.85)',
    colorGrade: '#b45309',
  },
  pastel: {
    id: 'pastel',
    name: 'Rosy Pastel',
    cssFilter: 'hue-rotate(-15deg) saturate(1.15) brightness(1.08) contrast(1.02)',
    colorGrade: '#ec4899',
  },
  bw: {
    id: 'bw',
    name: 'Studio B&W',
    cssFilter: 'grayscale(1) contrast(1.3) brightness(1.02)',
    colorGrade: '#334155',
  },
  cyber: {
    id: 'cyber',
    name: 'Cyber Cool',
    cssFilter: 'hue-rotate(185deg) saturate(1.25) contrast(1.1)',
    colorGrade: '#06b6d4',
  },
};

export const FILTER_LIST = Object.values(FILTERS);

/**
 * Combine preset filter with user adjustments (brightness, contrast, saturation, warmth)
 * into a single CSS filter string for canvas/Konva.
 */
export function buildCompositeCssFilter(
  filterType: FilterType,
  adjustments?: PhotoAdjustments
): string {
  const parts: string[] = [];
  const base = FILTERS[filterType];
  if (base && base.cssFilter && base.cssFilter !== 'none') {
    parts.push(base.cssFilter);
  }

  if (adjustments) {
    if (adjustments.brightness !== 0) {
      const b = 1 + adjustments.brightness / 100;
      parts.push(`brightness(${Math.max(0, b).toFixed(2)})`);
    }
    if (adjustments.contrast !== 0) {
      const c = 1 + adjustments.contrast / 100;
      parts.push(`contrast(${Math.max(0, c).toFixed(2)})`);
    }
    if (adjustments.saturation !== 0) {
      const s = 1 + adjustments.saturation / 100;
      parts.push(`saturate(${Math.max(0, s).toFixed(2)})`);
    }
    if (adjustments.warmth !== 0) {
      if (adjustments.warmth > 0) {
        const sep = (adjustments.warmth / 100) * 0.45;
        parts.push(`sepia(${sep.toFixed(2)})`);
      } else {
        const cool = adjustments.warmth * 0.25;
        parts.push(`hue-rotate(${cool.toFixed(1)}deg)`);
      }
    }
  }

  return parts.length > 0 ? parts.join(' ') : 'none';
}

/**
 * Apply canvas filter rendering directly to an HTMLCanvasElement
 */
export function applyFilterToCanvas(
  sourceCanvas: HTMLCanvasElement | HTMLImageElement,
  filterType: FilterType,
  adjustments?: PhotoAdjustments
): HTMLCanvasElement {
  const width = (sourceCanvas as HTMLImageElement).naturalWidth || sourceCanvas.width || 800;
  const height = (sourceCanvas as HTMLImageElement).naturalHeight || sourceCanvas.height || 600;

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(width, 1);
  canvas.height = Math.max(height, 1);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const composite = buildCompositeCssFilter(filterType, adjustments);
  if (composite !== 'none') {
    ctx.filter = composite;
  }
  ctx.drawImage(sourceCanvas, 0, 0, canvas.width, canvas.height);
  ctx.filter = 'none';

  return canvas;
}
