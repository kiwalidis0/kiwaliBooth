import { useState, useEffect } from 'react';

export interface ScreenOrientationState {
  /** True when the physical device screen is held in portrait */
  isPortrait: boolean;
  /** True when the physical device screen is held in landscape */
  isPhysicalLandscape: boolean;
  /** True when device is held in landscape AND screen height is constrained (phones in landscape: <= 540px) */
  isMobileLandscape: boolean;
  /** True on mobile / touch devices or compact mobile viewports */
  isMobile: boolean;
  /** Screen orientation angle: 0, 90, 180, 270 */
  angle: number;
}

function getOrientationState(): ScreenOrientationState {
  if (typeof window === 'undefined') {
    return {
      isPortrait: true,
      isPhysicalLandscape: false,
      isMobileLandscape: false,
      isMobile: false,
      angle: 0,
    };
  }

  // 1. Check Screen Orientation API
  const screenType = window.screen?.orientation?.type;
  const angle = window.screen?.orientation?.angle ?? 0;

  const isPortrait = screenType
    ? screenType.startsWith('portrait')
    : window.innerHeight >= window.innerWidth;

  const isPhysicalLandscape = !isPortrait;
  // Mobile landscape: viewport height is short (e.g. phones in landscape are 360px-430px)
  const isMobileLandscape = isPhysicalLandscape && window.innerHeight <= 540;

  const isTouchDevice = 'ontouchstart' in window || (navigator.maxTouchPoints ?? 0) > 0;
  const isSmallViewport = window.innerWidth <= 768 || window.innerHeight <= 540;
  const isMobile = isMobileLandscape || (isTouchDevice && isSmallViewport);

  return {
    isPortrait,
    isPhysicalLandscape,
    isMobileLandscape,
    isMobile,
    angle,
  };
}

/**
 * Hook to detect physical device orientation with mobile landscape awareness.
 */
export function useScreenOrientation(): ScreenOrientationState {
  const [orientation, setOrientation] = useState<ScreenOrientationState>(getOrientationState);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateOrientation = () => {
      setOrientation(getOrientationState());
    };

    // 1. Screen Orientation API listener
    if (window.screen?.orientation) {
      window.screen.orientation.addEventListener('change', updateOrientation);
    }

    // 2. matchMedia listener for orientation changes
    const mql = window.matchMedia('(orientation: landscape)');
    mql.addEventListener('change', updateOrientation);

    // 3. Window resize listener as final fallback
    window.addEventListener('resize', updateOrientation);

    return () => {
      if (window.screen?.orientation) {
        window.screen.orientation.removeEventListener('change', updateOrientation);
      }
      mql.removeEventListener('change', updateOrientation);
      window.removeEventListener('resize', updateOrientation);
    };
  }, []);

  return orientation;
}
