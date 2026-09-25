import React, { useRef, useEffect } from 'react';
import {
  Settings2,
  FlipHorizontal,
  RefreshCw,
  Smartphone,
  RectangleHorizontal,
  Grid3X3,
  X,
} from 'lucide-react';
import type { CameraFacingMode } from '../../types/photobooth';

interface ViewfinderSettingsProps {
  isMirrored: boolean;
  onToggleMirror: () => void;
  cameraFacingMode: CameraFacingMode;
  onFlipCamera: () => void;
  isLandscape: boolean;
  onToggleOrientation: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  placement?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  hideOrientationToggle?: boolean;
}

/**
 * Collapsed viewfinder settings — single gear button that opens
 * a comfortable labeled menu (Mirror / Front-Back / Wide Frame / Grid).
 */
export const ViewfinderSettings: React.FC<ViewfinderSettingsProps> = ({
  isMirrored,
  onToggleMirror,
  cameraFacingMode,
  onFlipCamera,
  isLandscape,
  onToggleOrientation,
  showGrid,
  onToggleGrid,
  open,
  onOpenChange,
  placement = 'top-right',
  hideOrientationToggle = false,
}) => {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        onOpenChange(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onOpenChange]);

  const buzz = () => navigator.vibrate?.(10);

  const rows = [
    {
      id: 'mirror',
      icon: <FlipHorizontal className="w-4 h-4" />,
      label: 'Mirror',
      hint: isMirrored ? 'On' : 'Off',
      active: isMirrored,
      action: onToggleMirror,
    },
    {
      id: 'flip',
      icon: <RefreshCw className="w-4 h-4" />,
      label: cameraFacingMode === 'user' ? 'Back camera' : 'Front camera',
      hint: cameraFacingMode === 'user' ? 'Front' : 'Back',
      active: false,
      action: onFlipCamera,
    },
    ...(!hideOrientationToggle
      ? [
          {
            id: 'orient',
            icon: isLandscape
              ? <RectangleHorizontal className="w-4 h-4" />
              : <Smartphone className="w-4 h-4" />,
            label: 'Wide frame',
            hint: isLandscape ? 'On' : 'Off',
            active: isLandscape,
            action: onToggleOrientation,
          },
        ]
      : []),
    {
      id: 'grid',
      icon: <Grid3X3 className="w-4 h-4" />,
      label: 'Grid',
      hint: showGrid ? 'On' : 'Off',
      active: showGrid,
      action: onToggleGrid,
    },
  ];

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => {
          onOpenChange(!open);
          buzz();
        }}
        aria-expanded={open}
        aria-label="Viewfinder settings"
        title="Viewfinder settings"
        className={[
          'w-10 h-10 rounded-full flex items-center justify-center border transition-all cursor-pointer select-none active:scale-95',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
          open
            ? 'bg-theme-primary text-white border-theme-primary shadow-md'
            : 'bg-white/5 text-white/90 border-white/10 hover:bg-white/15 hover:text-white',
        ].join(' ')}
      >
        {open ? <X className="w-4 h-4" /> : <Settings2 className="w-4 h-4" />}
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute w-60 sm:w-64 rounded-2xl border border-white/20 bg-black/90 backdrop-blur-xl shadow-2xl p-1.5 space-y-1 max-h-[85svh] overflow-y-auto z-50 ${
            placement === 'bottom-left'
              ? 'left-0 bottom-11'
              : placement === 'bottom-right'
              ? 'right-0 bottom-11'
              : placement === 'top-left'
              ? 'left-0 top-11'
              : 'right-0 top-11'
          }`}
        >
          {rows.map(row => (
            <button
              key={row.id}
              role="menuitemcheckbox"
              aria-checked={row.active}
              onClick={() => {
                row.action();
                buzz();
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-white/90 hover:bg-white/10 active:bg-white/15 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <span
                className={[
                  'w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors',
                  row.active ? 'bg-theme-primary text-white shadow-sm' : 'bg-white/10 text-white/80',
                ].join(' ')}
              >
                {row.icon}
              </span>
              <span className="flex-1 min-w-0 block text-xs font-semibold leading-tight truncate">
                {row.label}{' '}
                <span className="font-normal text-white/50">· {row.hint}</span>
              </span>
              <span
                className={[
                  'relative w-7 h-4 rounded-full transition-colors shrink-0',
                  row.active ? 'bg-theme-primary' : 'bg-white/20',
                ].join(' ')}
              >
                <span
                  className={[
                    'absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-all',
                    row.active ? 'left-3.5' : 'left-0.5',
                  ].join(' ')}
                />
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
