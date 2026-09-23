import type { LayoutConfig, LayoutId } from '../types/photobooth';

export const LAYOUTS: Record<LayoutId, LayoutConfig> = {
  single: {
    id: 'single',
    name: 'Polaroid Vibe',
    subtitle: '1 Single Statement Cut',
    shotsCount: 1,
    width: 800,
    height: 1000,
    slots: [
      { id: 0, x: 75, y: 75, width: 650, height: 720, borderRadius: 16 },
    ],
  },
  double: {
    id: 'double',
    name: 'Double Take',
    subtitle: '2 Vertical Cutouts',
    shotsCount: 2,
    width: 600,
    height: 1000,
    slots: [
      { id: 0, x: 50, y: 60, width: 500, height: 390, borderRadius: 12 },
      { id: 1, x: 50, y: 480, width: 500, height: 390, borderRadius: 12 },
    ],
  },
  triple: {
    id: 'triple',
    name: 'Triple Story',
    subtitle: '3 Vertical Cutouts',
    shotsCount: 3,
    width: 600,
    height: 1400,
    slots: [
      { id: 0, x: 50, y: 60, width: 500, height: 370, borderRadius: 12 },
      { id: 1, x: 50, y: 460, width: 500, height: 370, borderRadius: 12 },
      { id: 2, x: 50, y: 860, width: 500, height: 370, borderRadius: 12 },
    ],
  },
  classic4: {
    id: 'classic4',
    name: 'Classic Strip',
    subtitle: '4 Iconic Photobooth Cuts',
    shotsCount: 4,
    width: 600,
    height: 1800,
    slots: [
      { id: 0, x: 50, y: 60, width: 500, height: 370, borderRadius: 12 },
      { id: 1, x: 50, y: 460, width: 500, height: 370, borderRadius: 12 },
      { id: 2, x: 50, y: 860, width: 500, height: 370, borderRadius: 12 },
      { id: 3, x: 50, y: 1260, width: 500, height: 370, borderRadius: 12 },
    ],
  },
};

export const LAYOUT_LIST = Object.values(LAYOUTS);
