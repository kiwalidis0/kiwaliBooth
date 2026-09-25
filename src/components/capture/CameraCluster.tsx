import React from 'react';
import {
  FlipHorizontal,
  RefreshCw,
  Smartphone,
  RectangleHorizontal,
  Grid3X3,
  Zap,
  ZapOff,
} from 'lucide-react';
import type { CameraFacingMode } from '../../types/photobooth';

export type FlashMode = 'auto' | 'on' | 'off';

const FLASH_LABELS: Record<FlashMode, string> = {
  auto: 'Auto',
  on: 'Flash',
  off: 'No Fl.',
};

interface ClusterButton {
  id: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  action: () => void;
  /** Always visible even on narrow (≤360px) viewfinders */
  always: boolean;
}

interface CameraClusterProps {
  isMirrored: boolean;
  onToggleMirror: () => void;
  cameraFacingMode: CameraFacingMode;
  onFlipCamera: () => void;
  isLandscape: boolean;
  onToggleOrientation: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  flashMode: FlashMode;
  onCycleFlash: () => void;
  /** Collapse Grid + Flash buttons on very narrow viewfinders to avoid covering faces */
  isNarrow: boolean;
  /** True when back camera hardware torch was detected via getCapabilities() */
  hasTorch: boolean;
}

/**
 * Floating labeled control cluster rendered inside the viewfinder.
 * Replaces the three icon-only 32px buttons with a discoverable pill strip.
 *
 * Active state: bg-theme-primary text-white
 * Inactive state: text-white/80 with hover highlight
 * Haptic: navigator.vibrate(10) on each toggle (silently no-ops on iOS/Firefox)
 *
 * Flash is UI-only in P0 — cycles auto → on → off to establish state for P1 torch/flash.
 */
export const CameraCluster: React.FC<CameraClusterProps> = ({
  isMirrored,
  onToggleMirror,
  cameraFacingMode,
  onFlipCamera,
  isLandscape,
  onToggleOrientation,
  showGrid,
  onToggleGrid,
  flashMode,
  onCycleFlash,
  isNarrow,
  hasTorch,
}) => {
  const isFront = cameraFacingMode === 'user';
  // Flash label: front always shows flash mode; back shows "Torch" when hardware available
  const flashLabel = isFront
    ? FLASH_LABELS[flashMode]
    : hasTorch
    ? (flashMode === 'off' ? 'No Fl.' : 'Torch')
    : FLASH_LABELS[flashMode];

  const allControls: ClusterButton[] = [
    {
      id: 'mirror',
      icon: <FlipHorizontal className="w-4 h-4" />,
      label: 'Mirror',
      active: isMirrored,
      action: onToggleMirror,
      always: true,
    },
    {
      id: 'flip',
      icon: <RefreshCw className="w-4 h-4" />,
      label: cameraFacingMode === 'user' ? 'Back' : 'Front',
      active: false,
      action: onFlipCamera,
      always: true,
    },
    {
      id: 'orient',
      icon: isLandscape
        ? <Smartphone className="w-4 h-4" />
        : <RectangleHorizontal className="w-4 h-4" />,
      label: isLandscape ? 'Portrait' : 'Wide',
      active: isLandscape,
      action: onToggleOrientation,
      always: true,
    },
    {
      id: 'grid',
      icon: <Grid3X3 className="w-4 h-4" />,
      label: 'Grid',
      active: showGrid,
      action: onToggleGrid,
      always: false,
    },
    {
      id: 'flash',
      icon: flashMode === 'off'
        ? <ZapOff className="w-4 h-4" />
        : <Zap className="w-4 h-4" />,
      label: flashLabel,
      active: flashMode !== 'off',
      action: onCycleFlash,
      always: false,
    },
  ];

  const visible = isNarrow ? allControls.filter(c => c.always) : allControls;

  return (
    <div className="flex items-center gap-0.5 bg-black/50 backdrop-blur-md rounded-full px-1.5 py-1 border border-white/15 shadow-lg">
      {visible.map(btn => (
        <button
          key={btn.id}
          onClick={() => {
            btn.action();
            navigator.vibrate?.(10);
          }}
          aria-pressed={btn.active}
          aria-label={btn.label}
          title={btn.label}
          className={[
            'flex flex-col items-center justify-center w-10 h-9 rounded-full gap-0.5',
            'transition-all duration-150 cursor-pointer select-none',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
            'focus-visible:ring-offset-1 focus-visible:ring-offset-black/50',
            btn.active
              ? 'bg-theme-primary text-white'
              : 'text-white/80 hover:bg-white/15',
          ].join(' ')}
        >
          {btn.icon}
          <span className="text-[8px] leading-none font-sans tracking-wide">
            {btn.label}
          </span>
        </button>
      ))}
    </div>
  );
};
