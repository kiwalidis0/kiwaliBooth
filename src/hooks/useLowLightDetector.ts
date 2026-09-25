import { useState, useEffect, useRef, useCallback, type RefObject } from 'react';

interface UseLowLightOptions {
  /** Master switch — only sample when camera is live and screen is active */
  enabled: boolean;
  /** Sampling cadence in ms. 800ms is plenty; avoids battery drain. */
  intervalMs?: number;
  /** Avg luma (0-255) below which a frame counts as dark */
  threshold?: number;
  /** Consecutive dark / bright samples required to flip state (hysteresis) */
  consecutiveRequired?: number;
  /** Downscale target — 32x32 = ~1k pixels, negligible cost */
  sampleSize?: number;
}

interface UseLowLightResult {
  isLowLight: boolean;
  /** Last measured avg luma 0-255, null before first sample */
  luminance: number | null;
  /** Synchronous single-sample probe for per-shot recheck. Returns true when dark. */
  checkNow: () => boolean;
}

/**
 * Passive low-light detector for PWA capture.
 * Samples the live <video> to a tiny offscreen canvas and computes avg luma.
 * All client-side, no extra permissions. getUserMedia video is same-origin
 * so the canvas is never tainted.
 */
export function useLowLightDetector(
  videoRef: RefObject<HTMLVideoElement | null>,
  { enabled, intervalMs = 800, threshold = 45, consecutiveRequired = 3, sampleSize = 32 }: UseLowLightOptions
): UseLowLightResult {
  const [isLowLight, setIsLowLight] = useState<boolean>(false);
  const [luminance, setLuminance] = useState<number | null>(null);

  const darkHitsRef = useRef<number>(0);
  const brightHitsRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const sampleOnce = useCallback((): number | null => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0 || video.readyState < 2) {
      return null;
    }
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
      canvasRef.current.width = sampleSize;
      canvasRef.current.height = sampleSize;
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    try {
      ctx.drawImage(video, 0, 0, sampleSize, sampleSize);
      const data = ctx.getImageData(0, 0, sampleSize, sampleSize).data;
      let total = 0;
      const pixels = data.length / 4;
      for (let i = 0; i < data.length; i += 4) {
        total += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
      }
      return total / pixels;
    } catch {
      return null;
    }
  }, [videoRef, sampleSize]);

  const checkNow = useCallback((): boolean => {
    const luma = sampleOnce();
    if (luma === null) return isLowLight;
    setLuminance(Math.round(luma));
    const dark = luma < threshold;
    if (dark) {
      darkHitsRef.current += 1;
      brightHitsRef.current = 0;
      if (darkHitsRef.current >= consecutiveRequired) {
        setIsLowLight(true);
      }
    } else {
      brightHitsRef.current += 1;
      darkHitsRef.current = 0;
      if (brightHitsRef.current >= consecutiveRequired) {
        setIsLowLight(false);
      }
    }
    return dark;
  }, [sampleOnce, threshold, consecutiveRequired, isLowLight]);

  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => {
      checkNow();
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [enabled, intervalMs, checkNow]);

  return { isLowLight, luminance, checkNow };
}
