import { useState, useEffect } from 'react';

/**
 * Returns true when the physical device screen is in portrait orientation.
 * Uses the Screen Orientation API with a matchMedia fallback.
 *
 * Useful for showing a "rotate your device" prompt when the user has selected
 * landscape mode but is holding the phone in portrait.
 */
export function useScreenOrientation(): boolean {
  const isPortrait = (): boolean => {
    if (typeof window === 'undefined') return true;
    // Prefer Screen Orientation API (accurate, no resize needed)
    if (window.screen?.orientation?.type) {
      return window.screen.orientation.type.startsWith('portrait');
    }
    // Fallback: window dimensions
    return window.innerHeight >= window.innerWidth;
  };

  const [isPortraitDevice, setIsPortraitDevice] = useState<boolean>(isPortrait);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handler = () => setIsPortraitDevice(isPortrait());

    // Screen Orientation API (Chrome, Safari 16.4+, Firefox)
    if (window.screen?.orientation) {
      window.screen.orientation.addEventListener('change', handler);
      return () => window.screen.orientation.removeEventListener('change', handler);
    }

    // Fallback: listen to window resize
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return isPortraitDevice;
}
