import React, { useState, useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  ArrowLeft,
  AlertCircle,
  Upload,
  Play,
  Sparkles,
  Check,
  RotateCw,
  MoonStar,
  Flashlight,
  Camera,
  Timer,
  ImagePlus,
} from 'lucide-react';
import { useBooth } from '../context/useBooth';
import { LAYOUTS } from '../data/layouts';
import { playCountdownBeep, playShutterSound } from '../utils/audio';
import { MOCK_SELFIE_LIST } from '../utils/mockPhotos';
import { ConfirmModal } from './ConfirmModal';
import { SnapCircle } from './capture/SnapCircle';
import { ViewfinderSettings } from './capture/ViewfinderSettings';
import { FilmStrip } from './capture/FilmStrip';
import { useLowLightDetector } from '../hooks/useLowLightDetector';
import { useWakeLock } from '../hooks/useWakeLock';
import { useScreenOrientation } from '../hooks/useScreenOrientation';
import { processUploadedFile } from '../utils/uploadPipeline';
import type { CapturedPhoto } from '../types/photobooth';

gsap.registerPlugin(useGSAP);

interface TooltipProps {
  text: string;
  position?: 'right' | 'left' | 'top' | 'bottom';
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({
  text,
  position = 'right',
  children,
}) => {
  const posClasses = {
    right: 'left-full ml-2.5 top-1/2 -translate-y-1/2',
    left: 'right-full mr-2.5 top-1/2 -translate-y-1/2',
    top: 'bottom-full mb-2.5 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2.5 left-1/2 -translate-x-1/2',
  }[position];

  return (
    <div className="relative group inline-flex items-center justify-center">
      {children}
      <span
        role="tooltip"
        className={`hidden sm:block pointer-events-none absolute ${posClasses} z-50 px-2.5 py-1 rounded-lg bg-stone-900/95 border border-white/15 text-white text-[11px] font-medium tracking-wide shadow-xl backdrop-blur-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150`}
      >
        {text}
      </span>
    </div>
  );
};

export const CaptureScreen: React.FC = () => {
  const {
    selectedLayoutId,
    totalRequiredShots,
    cameraFacingMode,
    setCameraFacingMode,
    captureOrientation,
    setCaptureOrientation,
    photos,
    setPhotos,
    retakeIndex,
    setRetakeIndex,
    setStep,
  } = useBooth();

  const layout = LAYOUTS[selectedLayoutId];
  const shotsCount = Math.max(1, totalRequiredShots || layout?.shotsCount || 4);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const countdownNumberRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [hasCameraAccess, setHasCameraAccess] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMirrored, setIsMirrored] = useState<boolean>(cameraFacingMode === 'user');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  // Capture loop state
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [currentSlotTarget, setCurrentSlotTarget] = useState<number>(retakeIndex !== null ? retakeIndex : 0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showFlash, setShowFlash] = useState<boolean>(false);
  const [captureBadge, setCaptureBadge] = useState<string | null>(null);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);
  const [showBackConfirm, setShowBackConfirm] = useState<boolean>(false);

  const [retryTrigger, setRetryTrigger] = useState<number>(0);

  // --- P0 additions ---
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [countdownDuration, setCountdownDuration] = useState<3 | 5 | 10 | 0>(3);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [timerPickerOpen, setTimerPickerOpen] = useState<boolean>(false);
  const timerPickerRef = useRef<HTMLDivElement>(null);
  const { acquire: acquireWakeLock, release: releaseWakeLock } = useWakeLock();

  // --- P1 additions ---
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [uploadWarnings, setUploadWarnings] = useState<string[]>([]);
  const torchTrackRef = useRef<MediaStreamTrack | null>(null);
  const { isPortrait: isPortraitDevice, isPhysicalLandscape, isMobileLandscape, isMobile } = useScreenOrientation();
  const isLandscape = captureOrientation === 'landscape';

  // Only auto-switch when the physical device orientation actually flips between portrait and landscape
  const prevPhysicalLandscapeRef = useRef<boolean>(isPhysicalLandscape);
  useEffect(() => {
    if (prevPhysicalLandscapeRef.current !== isPhysicalLandscape) {
      prevPhysicalLandscapeRef.current = isPhysicalLandscape;
      setCaptureOrientation(isPhysicalLandscape ? 'landscape' : 'portrait');
    }
  }, [isPhysicalLandscape, setCaptureOrientation]);

  // Keep video track attached to the video element if mobile landscape view mounts
  useEffect(() => {
    if (videoRef.current && streamRef.current && videoRef.current.srcObject !== streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isMobileLandscape]);

  // --- Low-light detection + capture brightening ---
  // Dismissal is session-only — banner may reappear on next visit if still dark.
  const [lowLightDismissed, setLowLightDismissed] = useState<boolean>(false);
  const [boostEnabled, setBoostEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('kb_lowLightBoost') === 'true';
    } catch {
      return false;
    }
  });
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const { isLowLight, checkNow: checkLowLightNow } = useLowLightDetector(videoRef, {
    enabled: hasCameraAccess === true && !lowLightDismissed,
  });

  // Auto-enable software brightening on first low-light detection (user can toggle off)
  const autoBoostArmedRef = useRef<boolean>(false);
  useEffect(() => {
    if (isLowLight && !autoBoostArmedRef.current && !lowLightDismissed) {
      autoBoostArmedRef.current = true;
      setBoostEnabled(true);
      try {
        localStorage.setItem('kb_lowLightBoost', 'true');
      } catch {
        // ignore storage errors
      }
    }
  }, [isLowLight, lowLightDismissed]);

  const handleToggleBoost = () => {
    setBoostEnabled(prev => {
      const next = !prev;
      try {
        localStorage.setItem('kb_lowLightBoost', String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  useEffect(() => {
    let isCancelled = false;

    async function initCamera() {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCameraAccess(false);
        setErrorMessage('Camera access is not supported in this browser. You can use sample photos or upload from device.');
        return;
      }

      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }

        const constraints: MediaStreamConstraints = {
          video: selectedDeviceId
            ? { deviceId: { exact: selectedDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
            : { facingMode: cameraFacingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (isCancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasCameraAccess(true);
        setErrorMessage(null);

        // Torch capability detection (back camera only on supported devices)
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          torchTrackRef.current = videoTrack;
          const caps = videoTrack.getCapabilities?.() as MediaTrackCapabilities & { torch?: boolean };
          setHasTorch(caps?.torch === true);
        } else {
          torchTrackRef.current = null;
          setHasTorch(false);
        }

        if (navigator.mediaDevices.enumerateDevices) {
          const allDevices = await navigator.mediaDevices.enumerateDevices();
          if (isCancelled) return;
          const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
          setDevices(videoDevices);
          if (videoDevices.length > 0 && !selectedDeviceId) {
            const savedId = localStorage.getItem('kb_lastDeviceId');
            const match = savedId ? videoDevices.find(d => d.deviceId === savedId) : null;
            setSelectedDeviceId(match ? savedId! : videoDevices[0].deviceId);
          }
        }
      } catch (err: unknown) {
        if (isCancelled) return;
        console.warn('Camera access error:', err);
        setHasCameraAccess(false);
        const error = err as Error;
        setErrorMessage(
          error.name === 'NotAllowedError'
            ? 'Camera access was denied. You can upload photos from your device or use sample photos.'
            : 'No camera was found. You can upload photos from your device or use sample photos.'
        );
      }
    }

    initCamera();

    return () => {
      isCancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      releaseWakeLock();
    };
  }, [selectedDeviceId, cameraFacingMode, retryTrigger]);

  useGSAP(
    () => {
      if (countdown !== null && countdownNumberRef.current) {
        gsap.fromTo(
          countdownNumberRef.current,
          { scale: 1.4, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' }
        );
      }
    },
    { dependencies: [countdown], scope: containerRef }
  );

  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return null;

    // Slot aspect framing: 500:370 (~1.35) for multi-cut landscape, 3:4 (0.75) for portrait
    const targetAspect = isLandscape ? 500 / 370 : 3 / 4;
    const videoAspect = video.videoWidth / video.videoHeight;

    let sX = 0;
    let sY = 0;
    let sW = video.videoWidth;
    let sH = video.videoHeight;

    if (videoAspect > targetAspect) {
      // Sensor is wider than target frame — crop left/right symmetrically
      sW = Math.round(video.videoHeight * targetAspect);
      sX = Math.round((video.videoWidth - sW) / 2);
    } else {
      // Sensor is taller than target frame — crop top/bottom symmetrically
      sH = Math.round(video.videoWidth / targetAspect);
      sY = Math.round((video.videoHeight - sH) / 2);
    }

    const canvas = document.createElement('canvas');
    canvas.width = sW;
    canvas.height = sH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    if (isMirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    // Software brightening — actually lands in the saved file.
    // (The old CSS video filter only changed the preview, not drawImage output.)
    if (boostEnabled) {
      ctx.filter = 'brightness(1.22) contrast(1.05)';
    }
    ctx.drawImage(video, sX, sY, sW, sH, 0, 0, sW, sH);
    ctx.filter = 'none';

    return canvas.toDataURL('image/jpeg', 0.95);
  }, [isMirrored, boostEnabled, isLandscape]);

  const recordSlotPhoto = useCallback((dataUrl: string, slotIdx: number) => {
    playShutterSound();
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 200);

    setCaptureBadge(`Shot ${slotIdx + 1} captured`);
    setTimeout(() => setCaptureBadge(null), 1200);

    const newPhoto: CapturedPhoto = {
      id: `photo-${Date.now()}-${slotIdx}`,
      slotIndex: slotIdx,
      dataUrl,
      filter: 'normal',
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
      originalWidth: 800,
      originalHeight: 600,
    };

    setPhotos(prev => {
      const existing = prev.filter(p => p.slotIndex !== slotIdx);
      return [...existing, newPhoto].sort((a, b) => a.slotIndex - b.slotIndex);
    });
  }, [setPhotos]);

  const handleManualSnap = useCallback(() => {
    let dataUrl: string | null = null;
    if (hasCameraAccess) {
      dataUrl = captureFrame();
    }
    if (!dataUrl) {
      dataUrl = MOCK_SELFIE_LIST[currentSlotTarget % MOCK_SELFIE_LIST.length];
    }

    recordSlotPhoto(dataUrl, currentSlotTarget);

    if (retakeIndex !== null) {
      setRetakeIndex(null);
      setStep('review');
    } else {
      const nextSlot = currentSlotTarget + 1;
      if (nextSlot >= shotsCount) {
        setTimeout(() => setStep('review'), 600);
      } else {
        setCurrentSlotTarget(nextSlot);
      }
    }
  }, [hasCameraAccess, captureFrame, currentSlotTarget, recordSlotPhoto, retakeIndex, setRetakeIndex, setStep, shotsCount]);

  const handleShutterClick = useCallback(() => {
    if (isCapturing) return;

    if (countdownDuration === 0) {
      handleManualSnap();
      return;
    }

    setIsCapturing(true);
    let count = countdownDuration;
    setCountdown(count);
    playCountdownBeep(false);

    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
        playCountdownBeep(false);
      } else if (count === 0) {
        setCountdown(0);
        playCountdownBeep(true);
      } else {
        clearInterval(interval);
        setCountdown(null);
        setIsCapturing(false);
        handleManualSnap();
      }
    }, 1000);
  }, [isCapturing, countdownDuration, handleManualSnap]);

  /**
   * Hardware torch toggle — only surfaced via the low-light banner when
   * getCapabilities().torch === true (Chrome Android, back camera).
   * No-ops silently when torch is not supported.
   */
  const applyTorch = useCallback(async (on: boolean): Promise<void> => {
    const track = torchTrackRef.current;
    if (!track || !hasTorch) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: on } as MediaTrackConstraintSet] });
    } catch {
      // torch may be revoked mid-session — silently ignore
    }
  }, [hasTorch]);

  const handleDismissLowLight = () => {
    setLowLightDismissed(true);
    if (torchOn) {
      setTorchOn(false);
      applyTorch(false);
    }
  };

  const handleToggleTorch = async () => {
    const next = !torchOn;
    setTorchOn(next);
    await applyTorch(next);
  };

  // Reset torch UI when the camera source changes (old track is stopped) —
  // done inline in the flip / device-select handlers below, no effect needed.

  const startCountdownSequence = useCallback(async () => {
    if (isCapturing) return;
    setIsCapturing(true);
    await acquireWakeLock();

    let currentTarget = retakeIndex !== null ? retakeIndex : 0;
    setCurrentSlotTarget(currentTarget);

    const captureAndAdvance = async () => {
      // Per-shot low-light recheck so the indicator/boost stays honest across a sequence
      if (hasCameraAccess) {
        checkLowLightNow();
      }

      let dataUrl: string | null = hasCameraAccess ? captureFrame() : null;
      if (!dataUrl) dataUrl = MOCK_SELFIE_LIST[currentTarget % MOCK_SELFIE_LIST.length];

      recordSlotPhoto(dataUrl, currentTarget);

      if (retakeIndex !== null) {
        setIsCapturing(false);
        releaseWakeLock();
        setRetakeIndex(null);
        setTimeout(() => setStep('review'), 600);
        return;
      }

      currentTarget += 1;
      if (currentTarget < shotsCount) {
        setCurrentSlotTarget(currentTarget);
        setTimeout(() => runSingleShotCountdown(), 1200);
      } else {
        setIsCapturing(false);
        releaseWakeLock();
        setTimeout(() => setStep('review'), 700);
      }
    };

    const runSingleShotCountdown = async () => {
      // Off mode (countdownDuration === 0) — instant capture, no animation
      if (countdownDuration === 0) {
        await captureAndAdvance();
        return;
      }

      let count = countdownDuration;
      setCountdown(count);
      playCountdownBeep(false);

      const interval = setInterval(async () => {
        count -= 1;
        if (count > 0) {
          setCountdown(count);
          playCountdownBeep(false);
        } else if (count === 0) {
          setCountdown(0);
          playCountdownBeep(true);
        } else {
          clearInterval(interval);
          setCountdown(null);
          await captureAndAdvance();
        }
      }, 1000);
    };

    runSingleShotCountdown();
  }, [isCapturing, retakeIndex, shotsCount, countdownDuration, hasCameraAccess, captureFrame, recordSlotPhoto, checkLowLightNow, acquireWakeLock, releaseWakeLock, setRetakeIndex, setStep]);

  // Close timer picker when clicking outside
  useEffect(() => {
    if (!timerPickerOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (timerPickerRef.current && !timerPickerRef.current.contains(e.target as Node)) {
        setTimerPickerOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [timerPickerOpen]);

  // Keyboard shortcuts: Space = snap now, Enter = start countdown sequence, Escape = close settings/timer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as Element)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      if (showBackConfirm) return;
      if (e.code === 'Space') { e.preventDefault(); handleShutterClick(); }
      else if (e.code === 'Enter') { e.preventDefault(); startCountdownSequence(); }
      else if (e.key === 'Escape') {
        if (settingsOpen) setSettingsOpen(false);
        if (timerPickerOpen) setTimerPickerOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleShutterClick, startCountdownSequence, showBackConfirm, settingsOpen, timerPickerOpen]);

  const handleUseMockPhotos = () => {
    const mockPhotos: CapturedPhoto[] = Array.from({ length: shotsCount }).map((_, i) => ({
      id: `photo-mock-${Date.now()}-${i}`,
      slotIndex: i,
      dataUrl: MOCK_SELFIE_LIST[i % MOCK_SELFIE_LIST.length],
      filter: 'normal',
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
      originalWidth: 800,
      originalHeight: 600,
    }));
    setPhotos(mockPhotos);
    setStep('review');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    setUploadWarnings([]);

    try {
      const results = await Promise.all(fileList.map(processUploadedFile));

      // Collect and surface all non-fatal warnings
      const allWarnings = results.flatMap(r => r.warnings);
      if (allWarnings.length > 0) {
        setUploadWarnings(allWarnings);
        setTimeout(() => setUploadWarnings([]), 6000);
      }

      if (retakeIndex !== null) {
        recordSlotPhoto(results[0].dataUrl, retakeIndex);
        setRetakeIndex(null);
        setTimeout(() => setStep('review'), 400);
        return;
      }

      const updatedPhotos = [...photos];

      results.forEach((result, idx) => {
        const slotIdx = (currentSlotTarget + idx) % shotsCount;
        const newPhoto: CapturedPhoto = {
          id: `photo-upload-${Date.now()}-${slotIdx}`,
          slotIndex: slotIdx,
          dataUrl: result.dataUrl,
          filter: 'normal',
          x: 0,
          y: 0,
          scale: 1,
          rotation: 0,
          originalWidth: result.width,
          originalHeight: result.height,
        };

        const existingIdx = updatedPhotos.findIndex(p => p.slotIndex === slotIdx);
        if (existingIdx >= 0) {
          updatedPhotos[existingIdx] = newPhoto;
        } else {
          updatedPhotos.push(newPhoto);
        }
      });

      updatedPhotos.sort((a, b) => a.slotIndex - b.slotIndex);
      setPhotos(updatedPhotos);

      if (updatedPhotos.length >= shotsCount) {
        setUploadFeedback('All slots filled! Proceeding to review...');
        setTimeout(() => setStep('review'), 500);
      } else {
        const nextUnfilled = Array.from({ length: shotsCount }).findIndex(
          (_, i) => !updatedPhotos.some(p => p.slotIndex === i)
        );
        const target = nextUnfilled >= 0 ? nextUnfilled : 0;
        setCurrentSlotTarget(target);
        setUploadFeedback(`Uploaded! Now select photo for shot #${target + 1}`);
        setTimeout(() => setUploadFeedback(null), 3000);
      }
    } catch (err) {
      console.error('File upload error:', err);
      setUploadFeedback('Failed to process image. Please try another file.');
      setTimeout(() => setUploadFeedback(null), 4000);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleToggleFlipCamera = () => {
    const nextMode = cameraFacingMode === 'user' ? 'environment' : 'user';
    setCameraFacingMode(nextMode);
    setSelectedDeviceId('');
    setIsMirrored(nextMode === 'user');
    setTorchOn(false);
    setRetryTrigger(prev => prev + 1);
  };

  const handleToggleOrientation = () => {
    setCaptureOrientation(captureOrientation === 'portrait' ? 'landscape' : 'portrait');
  };

  const handleBack = () => {
    if (retakeIndex !== null) {
      setRetakeIndex(null);
      setStep('review');
    } else if (photos.length > 0) {
      setShowBackConfirm(true);
    } else {
      setStep('layout');
    }
  };

  const handleConfirmBack = () => {
    setShowBackConfirm(false);
    setPhotos([]);
    setStep('layout');
  };

  // --- ZERO-SCROLL SPLIT CONSOLE (Landscape & Mobile Landscape) ---
  const isSplitConsole = isMobileLandscape || isLandscape;
  if (isSplitConsole) {
    return (
      <>
        {/* Screen Flash Overlay */}
        {showFlash && (
          <div className="fixed inset-0 z-50 bg-white pointer-events-none transition-opacity duration-200" />
        )}

        {/* Floating feedback / warning toasts */}
        {uploadFeedback && (
          <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 bg-emerald-600/90 text-white text-xs font-medium rounded-full shadow-lg backdrop-blur-md pointer-events-none animate-in fade-in duration-200">
            {uploadFeedback}
          </div>
        )}
        {uploadWarnings.length > 0 && (
          <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 bg-amber-600/90 text-white text-xs font-medium rounded-full shadow-lg backdrop-blur-md pointer-events-none animate-in fade-in duration-200">
            ⚠️ {uploadWarnings[0]}
          </div>
        )}

        <div
          ref={containerRef}
          className="fixed inset-0 h-[100svh] w-full overflow-hidden flex flex-row items-center justify-between p-2 sm:p-3 pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] bg-[#0B0B0E] text-white select-none z-30"
        >
          {/* LEFT WING: Navigation, Shot Progress & Secondary Tools */}
          <div className="w-16 sm:w-20 h-full flex flex-col items-center justify-between py-2 sm:py-3 shrink-0 z-20">
            {/* Top: Back Button */}
            <Tooltip text={retakeIndex !== null ? 'Cancel retake' : 'Back to layout'} position="right">
              <button
                onClick={handleBack}
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/15 active:scale-95 flex items-center justify-center text-white/90 hover:text-white transition-all cursor-pointer"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Tooltip>

            {/* Center: Simplified Shot Progress Indicator */}
            <div className="flex flex-col items-center gap-1.5 select-none">
              <span className="text-[10px] font-fredoka font-semibold uppercase tracking-[0.12em] text-white/50">
                Shot
              </span>
              <span className="text-sm font-fredoka font-bold text-white tracking-wide">
                {retakeIndex !== null ? `#${retakeIndex + 1}` : `${currentSlotTarget + 1} / ${shotsCount}`}
              </span>
              {shotsCount > 1 && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  {Array.from({ length: shotsCount }).map((_, idx) => {
                    const isFilled = photos.some(p => p.slotIndex === idx);
                    const isCurrent = currentSlotTarget === idx;
                    return (
                      <Tooltip key={idx} text={`Shot ${idx + 1}${isFilled ? ' (done)' : ''}`} position="right">
                        <button
                          onClick={() => setCurrentSlotTarget(idx)}
                          aria-label={`Target shot ${idx + 1}`}
                          className={`transition-all duration-200 cursor-pointer flex items-center justify-center ${
                            isCurrent
                              ? 'w-3.5 h-3.5 rounded-full bg-theme-primary ring-2 ring-theme-primary/40 shadow-[0_0_8px_rgba(255,46,147,0.6)] animate-pulse'
                              : isFilled
                              ? 'w-3 h-3 rounded-full bg-emerald-500 text-white flex items-center justify-center'
                              : 'w-2.5 h-2.5 rounded-full border border-white/30 bg-transparent hover:border-white/60'
                          }`}
                        >
                          {isFilled && !isCurrent && <Check className="w-2 h-2 text-white stroke-[3]" />}
                        </button>
                      </Tooltip>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom: Secondary Tools */}
            <div className="flex flex-col items-center gap-2">
              <Tooltip text="Upload photo" position="right">
                <label
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/15 active:scale-95 flex items-center justify-center text-white/90 hover:text-white transition-all cursor-pointer"
                  aria-label="Upload photo"
                >
                  <Upload className="w-4 h-4" />
                  <input
                    type="file"
                    name="photos-left"
                    aria-label="Upload photos"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </Tooltip>

              {isLowLight && (
                <Tooltip text={`Low light boost: ${boostEnabled ? 'On' : 'Off'}`} position="right">
                  <button
                    onClick={handleToggleBoost}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 border ${
                      boostEnabled
                        ? 'bg-amber-400 text-black border-amber-300 shadow-md'
                        : 'bg-white/5 border-white/10 text-amber-300 hover:bg-white/15'
                    }`}
                    aria-label={`Low light boost: ${boostEnabled ? 'On' : 'Off'}`}
                  >
                    <MoonStar className="w-4 h-4" />
                  </button>
                </Tooltip>
              )}

              {hasTorch && (
                <Tooltip text={`Flashlight: ${torchOn ? 'On' : 'Off'}`} position="right">
                  <button
                    onClick={handleToggleTorch}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 border ${
                      torchOn
                        ? 'bg-amber-400 text-black border-amber-300 shadow-md'
                        : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/15'
                    }`}
                    aria-label={`Flashlight: ${torchOn ? 'On' : 'Off'}`}
                  >
                    <Flashlight className="w-4 h-4" />
                  </button>
                </Tooltip>
              )}

              <Tooltip text="Camera settings" position="right">
                <ViewfinderSettings
                  placement="bottom-left"
                  hideOrientationToggle={isMobile}
                  isMirrored={isMirrored}
                  onToggleMirror={() => setIsMirrored(p => !p)}
                  cameraFacingMode={cameraFacingMode}
                  onFlipCamera={handleToggleFlipCamera}
                  isLandscape={isLandscape}
                  onToggleOrientation={handleToggleOrientation}
                  showGrid={showGrid}
                  onToggleGrid={() => setShowGrid(p => !p)}
                  open={settingsOpen}
                  onOpenChange={setSettingsOpen}
                />
              </Tooltip>
            </div>
          </div>

          {/* CENTER WING: Max-Height Viewfinder + Docked Compact Filmstrip */}
          <div className="flex-1 h-full max-h-full flex flex-col items-center justify-center gap-1 min-w-0 p-1 relative z-10">
            {/* Viewfinder frame */}
            <div
              className={`relative flex-1 max-h-full max-w-full w-auto rounded-2xl overflow-hidden bg-stone-950 border border-white/15 flex items-center justify-center shadow-2xl transition-all duration-300 ${
                isLandscape ? 'aspect-[500/370]' : 'aspect-[3/4]'
              }`}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transition-transform duration-200 ${
                  isMirrored ? 'scale-x-[-1]' : ''
                } ${hasCameraAccess === false ? 'hidden' : 'block'}`}
              />

              {/* Subtle Cinematic Vignette */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_35px_rgba(0,0,0,0.55)] z-10"
              />

              {/* Subtle Corner Brackets Framing */}
              <div aria-hidden className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 p-3 sm:p-5">
                <div
                  className="relative w-full h-full max-h-full max-w-full"
                  style={{ aspectRatio: isLandscape ? '500/370' : '3/4', maxHeight: '92%' }}
                >
                  <div className="absolute top-0 left-0 w-5 h-5 sm:w-6 sm:h-6 border-t-2 border-l-2 border-white/70 rounded-tl-sm shadow-[0_0_2px_rgba(0,0,0,0.8)]" />
                  <div className="absolute top-0 right-0 w-5 h-5 sm:w-6 sm:h-6 border-t-2 border-r-2 border-white/70 rounded-tr-sm shadow-[0_0_2px_rgba(0,0,0,0.8)]" />
                  <div className="absolute bottom-0 left-0 w-5 h-5 sm:w-6 sm:h-6 border-b-2 border-l-2 border-white/70 rounded-bl-sm shadow-[0_0_2px_rgba(0,0,0,0.8)]" />
                  <div className="absolute bottom-0 right-0 w-5 h-5 sm:w-6 sm:h-6 border-b-2 border-r-2 border-white/70 rounded-br-sm shadow-[0_0_2px_rgba(0,0,0,0.8)]" />
                </div>
              </div>

              {/* Floating Capture Confirmation Badge */}
              {captureBadge && (
                <div className="absolute top-3 sm:top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none transition-all duration-200">
                  <div className="px-3.5 py-1.5 rounded-full bg-stone-900/90 border border-white/20 text-white text-xs font-medium shadow-2xl flex items-center gap-1.5 backdrop-blur-md">
                    <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                    <span>{captureBadge}</span>
                  </div>
                </div>
              )}

              {/* Camera Error / Fallback Banner */}
              {hasCameraAccess === false && (
                <div className="p-4 text-center max-w-xs bg-stone-900 text-white rounded-xl border border-white/15 mx-2 z-20">
                  <AlertCircle className="w-6 h-6 text-theme-primary mx-auto mb-1.5" />
                  <p className="text-xs text-stone-300 mb-3 font-sans line-clamp-2">{errorMessage}</p>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={handleUseMockPhotos}
                      className="soft-btn-coral text-xs py-1.5 px-3 cursor-pointer flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Samples</span>
                    </button>
                    <label className="soft-btn-secondary text-xs py-1.5 px-3 cursor-pointer flex items-center gap-1">
                      <Upload className="w-3 h-3" />
                      <span>Upload</span>
                      <input
                        type="file"
                        name="photos-fallback"
                        aria-label="Upload photos"
                        multiple
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Grid overlay */}
              {showGrid && (
                <div
                  aria-hidden
                  className="absolute inset-0 pointer-events-none z-10"
                  style={{
                    backgroundImage: [
                      'linear-gradient(to right, rgba(255,255,255,0.2) 1px, transparent 1px)',
                      'linear-gradient(to bottom, rgba(255,255,255,0.2) 1px, transparent 1px)',
                    ].join(', '),
                    backgroundSize: '33.333% 33.333%',
                  }}
                />
              )}

              {/* Countdown Pulse Overlay */}
              {countdown !== null && (
                <div
                  ref={countdownNumberRef}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 z-30 pointer-events-none"
                >
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-stone-900/90 border border-white/20 flex items-center justify-center shadow-2xl backdrop-blur-md">
                    {countdown > 0 ? (
                      <span className="font-fredoka font-bold text-4xl sm:text-5xl text-theme-primary">
                        {countdown}
                      </span>
                    ) : (
                      <div className="text-center font-fredoka font-semibold text-base sm:text-lg text-theme-primary leading-tight">
                        Smile!
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Docked Compact Filmstrip (when photos exist) */}
            {photos.length > 0 && (
              <div className="shrink-0 h-10 w-full max-w-sm flex items-center justify-center">
                <FilmStrip
                  compact
                  photos={photos}
                  shotsCount={shotsCount}
                  currentSlotTarget={currentSlotTarget}
                  onSelectSlot={setCurrentSlotTarget}
                  onDeleteSlot={(idx) => {
                    setPhotos(prev => prev.filter(p => p.slotIndex !== idx));
                    setCurrentSlotTarget(idx);
                  }}
                />
              </div>
            )}
          </div>

          {/* RIGHT WING: Timer, Shutter & Switch Camera */}
          <div className="w-20 sm:w-24 h-full flex flex-col items-center justify-between py-2 sm:py-3 shrink-0 z-20">
            {/* Top: Compact Timer Delay Button + Popover */}
            <div className="relative flex flex-col items-center">
              <Tooltip text="Countdown timer" position="left">
                <button
                  onClick={() => setTimerPickerOpen(prev => !prev)}
                  className={`h-9 px-3 rounded-full text-xs font-fredoka font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                    timerPickerOpen
                      ? 'bg-theme-primary/20 border-theme-primary text-white shadow-sm'
                      : countdownDuration > 0
                      ? 'bg-white/10 border-white/20 text-white hover:bg-white/15'
                      : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                  aria-label="Select countdown delay"
                  aria-expanded={timerPickerOpen}
                >
                  <Timer className={`w-3.5 h-3.5 ${countdownDuration > 0 ? 'text-theme-primary' : 'text-white/60'}`} />
                  <span>{countdownDuration === 0 ? 'Off' : `${countdownDuration}s`}</span>
                </button>
              </Tooltip>

              {/* Floating Delay Selector Popover */}
              {timerPickerOpen && (
                <div
                  ref={timerPickerRef}
                  className="absolute right-full mr-2.5 top-0 bg-stone-900/95 border border-white/15 rounded-2xl p-2.5 shadow-2xl backdrop-blur-xl z-50 flex flex-col gap-2 w-52 animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="flex items-center justify-between text-xs text-white font-fredoka font-semibold px-1">
                    <span className="flex items-center gap-1.5">
                      <Timer className="w-4 h-4 text-theme-primary" />
                      Timer Delay
                    </span>
                    <button
                      onClick={() => setTimerPickerOpen(false)}
                      className="text-white/50 hover:text-white text-xs p-0.5 cursor-pointer leading-none"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Direct Segmented Selector to choose duration */}
                  <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl">
                    {([3, 5, 10, 0] as const).map(n => (
                      <button
                        key={n}
                        onClick={() => {
                          setCountdownDuration(n);
                          setTimerPickerOpen(false);
                        }}
                        className={`flex-1 py-1.5 px-1 rounded-lg text-xs font-fredoka font-bold text-center transition-all cursor-pointer ${
                          countdownDuration === n
                            ? 'bg-theme-primary text-white shadow-sm'
                            : 'text-white/70 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {n === 0 ? 'Off' : `${n}s`}
                      </button>
                    ))}
                  </div>

                  {/* Start Button inside Popover */}
                  <button
                    onClick={() => {
                      setTimerPickerOpen(false);
                      startCountdownSequence();
                    }}
                    disabled={isCapturing}
                    className="w-full py-1.5 px-3 soft-btn-coral text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md cursor-pointer font-fredoka font-semibold active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Auto-shoot all ({countdownDuration === 0 ? 'instant' : `${countdownDuration}s`})</span>
                  </button>
                </div>
              )}
            </div>

            {/* Shutter Button — right thumb sweet spot */}
            <div className="my-auto scale-90 sm:scale-100 flex items-center justify-center">
              <SnapCircle onSnap={handleShutterClick} disabled={isCapturing} />
            </div>

            {/* Bottom: Quick Switch Camera */}
            <Tooltip text="Switch camera" position="left">
              <button
                onClick={handleToggleFlipCamera}
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/15 active:scale-95 flex items-center justify-center text-white/90 hover:text-white transition-all cursor-pointer"
                aria-label="Switch camera"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Confirmation Modal when navigating back with captured photos */}
        <ConfirmModal
          isOpen={showBackConfirm}
          title="Leave and clear photos?"
          message="Wait! Your pictures will not be saved. Download them first or they will be gone forever."
          confirmLabel="Leave & Clear"
          cancelLabel="Stay Here"
          onConfirm={handleConfirmBack}
          onCancel={() => setShowBackConfirm(false)}
        />
      </>
    );
  }

  // --- STANDARD PORTRAIT & DESKTOP LAYOUT ---
  return (
    <>
      <div
        ref={containerRef}
        className={`py-4 sm:py-6 px-3 sm:px-4 mx-auto flex flex-col items-center transition-all duration-300 ${
          isLandscape ? 'max-w-4xl' : 'max-w-3xl'
        }`}
      >
        {/* Screen Flash Overlay */}
        {showFlash && (
          <div className="fixed inset-0 z-50 bg-white pointer-events-none camera-flash" />
        )}

        {/* Top Header bar with clean back button */}
        <div className="w-full flex items-center justify-between gap-3 mb-2.5">
          <Tooltip text={retakeIndex !== null ? 'Cancel retake' : 'Back to layout'} position="right">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-300 hover:text-theme-primary cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{retakeIndex !== null ? 'Cancel Retake' : 'Back to Layout'}</span>
            </button>
          </Tooltip>

          {/* Simplified Shot Progress Indicator */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-fredoka font-semibold uppercase tracking-[0.12em] text-stone-400 dark:text-stone-500 leading-none">
                Shot
              </span>
              <span className="text-sm font-fredoka font-bold text-stone-900 dark:text-white tracking-wide leading-tight">
                {retakeIndex !== null ? `#${retakeIndex + 1}` : `${currentSlotTarget + 1} / ${shotsCount}`}
              </span>
            </div>
            {shotsCount > 1 && (
              <div className="flex items-center gap-1.5">
                {Array.from({ length: shotsCount }).map((_, idx) => {
                  const isFilled = photos.some(p => p.slotIndex === idx);
                  const isCurrent = currentSlotTarget === idx;
                  return (
                    <Tooltip key={idx} text={`Shot ${idx + 1}${isFilled ? ' (done)' : ''}`} position="bottom">
                      <button
                        onClick={() => setCurrentSlotTarget(idx)}
                        aria-label={`Target shot ${idx + 1}`}
                        className={`transition-all duration-200 cursor-pointer flex items-center justify-center ${
                          isCurrent
                            ? 'w-3.5 h-3.5 rounded-full bg-theme-primary ring-2 ring-theme-primary/40 shadow-[0_0_8px_rgba(255,46,147,0.6)] animate-pulse'
                            : isFilled
                            ? 'w-3 h-3 rounded-full bg-emerald-500 text-white flex items-center justify-center'
                            : 'w-2.5 h-2.5 rounded-full border border-stone-300 dark:border-white/30 bg-transparent hover:border-theme-primary'
                        }`}
                      >
                        {isFilled && !isCurrent && <Check className="w-2 h-2 text-white stroke-[3]" />}
                      </button>
                    </Tooltip>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {uploadFeedback && (
          <div className="w-full mb-2.5 p-2 text-center text-xs bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl">
            {uploadFeedback}
          </div>
        )}

        {/* Upload pipeline warnings (HEIC, low-res, large file) */}
        {uploadWarnings.length > 0 && (
          <div className="w-full mb-2.5 space-y-1">
            {uploadWarnings.map((w, i) => (
              <div
                key={i}
                className="p-2 text-xs bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 rounded-xl"
              >
                ⚠️ {w}
              </div>
            ))}
          </div>
        )}

        {/* Low-light advisory — flat solid colors, sits above the viewfinder */}
        {isLowLight && !lowLightDismissed && hasCameraAccess && !isCapturing && (
          <div
            role="status"
            className="w-full mb-2.5 rounded-xl border border-amber-300 dark:border-stone-700 bg-amber-50 dark:bg-stone-900 shadow-sm overflow-hidden"
          >
            <div className="flex items-center gap-2.5 p-2.5">
              <span className="shrink-0 w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950 border border-amber-300 dark:border-amber-800 flex items-center justify-center">
                <MoonStar className="w-4 h-4 text-amber-700 dark:text-amber-400" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-fredoka font-semibold text-xs leading-tight text-stone-900 dark:text-white">
                  Low light detected
                </p>
                <p className="text-[11px] leading-snug text-stone-600 dark:text-stone-400 font-sans">
                  Move to brighter light or max screen brightness — it doubles as fill light.
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-1.5">
                {hasTorch && (
                  <button
                    onClick={handleToggleTorch}
                    aria-pressed={torchOn}
                    className={[
                      'inline-flex items-center gap-1 px-2 py-1 rounded-full border text-[10px] font-semibold transition-all cursor-pointer',
                      torchOn
                        ? 'bg-theme-primary text-white border-theme-primary shadow-sm'
                        : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-300 dark:border-stone-600 hover:border-theme-primary',
                    ].join(' ')}
                  >
                    <Flashlight className="w-3 h-3" />
                    {torchOn ? 'Torch on' : 'Torch'}
                  </button>
                )}
                <button
                  onClick={handleDismissLowLight}
                  className="px-2 py-1 rounded-full text-[10px] font-semibold text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
                <button
                  onClick={handleToggleBoost}
                  role="switch"
                  aria-checked={boostEnabled}
                  className={[
                    'inline-flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full border text-[10px] font-semibold transition-all cursor-pointer select-none',
                    boostEnabled
                      ? 'bg-theme-primary text-white border-theme-primary shadow-sm'
                      : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-300 dark:border-stone-600 hover:border-theme-primary',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'relative w-6 h-3.5 rounded-full transition-colors',
                      boostEnabled ? 'bg-white/40' : 'bg-stone-300 dark:bg-stone-600',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white shadow transition-all',
                        boostEnabled ? 'left-3' : 'left-0.5',
                      ].join(' ')}
                    />
                  </span>
                  Boost {boostEnabled ? 'on' : 'off'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Camera Viewfinder Container */}
        <div
          className={`relative w-full bg-stone-950 rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 flex items-center justify-center transition-all duration-300 ${
            isLandscape
              ? 'aspect-[16/9] max-h-[500px] [@media(orientation:landscape)_and_(max-height:500px)]:aspect-auto [@media(orientation:landscape)_and_(max-height:500px)]:h-[54svh] [@media(orientation:landscape)_and_(max-height:500px)]:max-h-none [@media(orientation:landscape)_and_(max-height:500px)]:rounded-xl'
              : 'aspect-[3/4] max-h-[560px] [max-height:min(560px,68svh)]'
          }`}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover transition-transform duration-200 ${
              isMirrored ? 'scale-x-[-1]' : ''
            } ${hasCameraAccess === false ? 'hidden' : 'block'}`}
          />

          {/* Camera Error / Fallback Banner */}
          {hasCameraAccess === false && (
            <div className="p-6 text-center max-w-sm bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 mx-4 z-20">
              <AlertCircle className="w-8 h-8 text-theme-primary mx-auto mb-2" />
              <h3 className="font-fredoka font-semibold text-base text-black dark:text-white mb-1">
                Camera Not Available
              </h3>
              <p className="text-xs text-black dark:text-stone-300 mb-4 font-sans">{errorMessage}</p>

              <div className="flex flex-col gap-2">
                <label className="soft-btn-coral text-xs py-2.5 px-4 cursor-pointer flex items-center justify-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Photos from Device</span>
                  <input
                    type="file"
                    name="photos-portrait-fallback"
                    aria-label="Upload photos"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={handleUseMockPhotos}
                  className="soft-btn-secondary text-xs py-2 px-4 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-theme-primary" />
                  <span>Use Sample Photos</span>
                </button>

                <button
                  onClick={() => setRetryTrigger(prev => prev + 1)}
                  className="text-[11px] text-stone-400 hover:text-black dark:hover:text-stone-200 underline mt-1 cursor-pointer"
                >
                  Retry Camera
                </button>
              </div>
            </div>
          )}

          {/* In-Container Viewfinder Overlays */}
          <div className="absolute inset-0 pointer-events-none p-3 flex flex-col justify-between z-10">
            {/* Top Row: Shot Counter badge + Settings gear */}
            <div className="flex items-start justify-between gap-2 pointer-events-auto">
              {/* Dedicated Shot Counter Badge */}
              <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15 text-white shadow-lg">
                <div className="w-2 h-2 rounded-full bg-theme-primary animate-pulse" />
                <span className="font-fredoka font-semibold text-xs tracking-wide text-white">
                  {retakeIndex !== null
                    ? `Retaking Shot #${retakeIndex + 1}`
                    : `Shot ${currentSlotTarget + 1} of ${shotsCount}`}
                </span>
              </div>

              {/* Collapsed settings — Mirror / Camera / Frame / Grid */}
              <ViewfinderSettings
                hideOrientationToggle={isMobile}
                isMirrored={isMirrored}
                onToggleMirror={() => setIsMirrored(p => !p)}
                cameraFacingMode={cameraFacingMode}
                onFlipCamera={handleToggleFlipCamera}
                isLandscape={isLandscape}
                onToggleOrientation={handleToggleOrientation}
                showGrid={showGrid}
                onToggleGrid={() => setShowGrid(p => !p)}
                open={settingsOpen}
                onOpenChange={setSettingsOpen}
              />
            </div>

            {/* Bottom Row inside Viewfinder: frame mode label */}
            <div className="flex items-center justify-start text-white/80 text-[10px] font-sans px-1">
              <span className="bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded text-white/70">
                {isLandscape ? 'Landscape Mode • Wide View' : 'Portrait Mode'}
              </span>
            </div>
          </div>

          {/* Rule-of-thirds grid overlay */}
          {showGrid && (
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none z-10"
              style={{
                backgroundImage: [
                  'linear-gradient(to right, rgba(255,255,255,0.2) 1px, transparent 1px)',
                  'linear-gradient(to bottom, rgba(255,255,255,0.2) 1px, transparent 1px)',
                ].join(', '),
                backgroundSize: '33.333% 33.333%',
              }}
            />
          )}

          {/* Subtle Cinematic Vignette */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_35px_rgba(0,0,0,0.55)] z-10"
          />

          {/* Subtle Corner Brackets Framing */}
          <div aria-hidden className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 p-3 sm:p-5">
            <div
              className="relative w-full h-full max-h-full"
              style={{ aspectRatio: isLandscape ? '500/370' : '3/4', maxHeight: '92%' }}
            >
              <div className="absolute top-0 left-0 w-5 h-5 sm:w-6 sm:h-6 border-t-2 border-l-2 border-white/70 rounded-tl-sm shadow-[0_0_2px_rgba(0,0,0,0.8)]" />
              <div className="absolute top-0 right-0 w-5 h-5 sm:w-6 sm:h-6 border-t-2 border-r-2 border-white/70 rounded-tr-sm shadow-[0_0_2px_rgba(0,0,0,0.8)]" />
              <div className="absolute bottom-0 left-0 w-5 h-5 sm:w-6 sm:h-6 border-b-2 border-l-2 border-white/70 rounded-bl-sm shadow-[0_0_2px_rgba(0,0,0,0.8)]" />
              <div className="absolute bottom-0 right-0 w-5 h-5 sm:w-6 sm:h-6 border-b-2 border-r-2 border-white/70 rounded-br-sm shadow-[0_0_2px_rgba(0,0,0,0.8)]" />
            </div>
          </div>

          {/* Floating Capture Confirmation Badge */}
          {captureBadge && (
            <div className="absolute top-3 sm:top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none transition-all duration-200">
              <div className="px-3.5 py-1.5 rounded-full bg-stone-900/90 border border-white/20 text-white text-xs font-medium shadow-2xl flex items-center gap-1.5 backdrop-blur-md">
                <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                <span>{captureBadge}</span>
              </div>
            </div>
          )}

          {/* Rotate-device prompt — shown when landscape mode selected but device is portrait */}
          {isLandscape && isPortraitDevice && hasCameraAccess !== false && (
            <div className="absolute inset-0 bg-black/65 z-40 flex flex-col items-center justify-center gap-3 pointer-events-none">
              <RotateCw className="w-10 h-10 text-white opacity-90" style={{ animation: 'spin 2s linear infinite' }} />
              <p className="text-white font-fredoka text-base text-center px-6 leading-snug">
                Rotate your phone sideways<br />for a wide group shot
              </p>
            </div>
          )}

          {/* In-viewfinder Snap Circle — bottom-center, above status row.
              Shrinks on short landscape phones so the container fits the viewport. */}
          <div className="absolute bottom-10 [@media(orientation:landscape)_and_(max-height:500px)]:bottom-6 left-0 right-0 flex justify-center pointer-events-auto z-20 [@media(orientation:landscape)_and_(max-height:500px)]:scale-90 origin-bottom">
            <SnapCircle onSnap={handleShutterClick} disabled={isCapturing} />
          </div>

          {/* Center Countdown Pulse */}
          {countdown !== null && (
            <div
              ref={countdownNumberRef}
              className="absolute inset-0 flex items-center justify-center bg-black/40 z-30 pointer-events-none"
            >
              <div className="w-24 h-24 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center justify-center shadow-2xl">
                {countdown > 0 ? (
                  <span className="font-fredoka font-bold text-5xl text-theme-primary">
                    {countdown}
                  </span>
                ) : (
                  <div className="text-center font-fredoka font-semibold text-lg text-theme-primary leading-tight">
                    Smile!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Live Filmstrip — visible once at least one photo is captured */}
        <FilmStrip
          photos={photos}
          shotsCount={shotsCount}
          currentSlotTarget={currentSlotTarget}
          onSelectSlot={setCurrentSlotTarget}
          onDeleteSlot={(idx) => {
            setPhotos(prev => prev.filter(p => p.slotIndex !== idx));
            setCurrentSlotTarget(idx);
          }}
        />

        {/* Unified Bottom Control Area */}
        <div className="w-full mt-3 bg-white dark:bg-stone-900 p-3 sm:p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-3">
          {/* ROW 1: Capture — full-width Auto Countdown */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-stone-400 dark:text-stone-500 font-sans">
              Capture
            </p>
            <button
              onClick={startCountdownSequence}
              disabled={isCapturing}
              className={`w-full h-12 soft-btn-coral text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                isCapturing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Play className="w-4 h-4 fill-white" />
              <span className="font-medium truncate">
                {isCapturing
                  ? 'Capturing sequence...'
                  : `Auto Countdown (${countdownDuration === 0 ? 'instant' : `${countdownDuration}s`})`}
              </span>
            </button>

            {/* Timer delay segmented control */}
            <div className="flex items-center gap-2 rounded-xl bg-stone-100/80 dark:bg-stone-800/60 px-2.5 py-1.5">
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-stone-500 dark:text-stone-400 font-sans shrink-0">
                <Timer className="w-3.5 h-3.5" />
                Delay
              </span>
              <div className="flex flex-1 items-center gap-1" role="group" aria-label="Countdown delay">
                {([3, 5, 10, 0] as const).map(n => (
                  <button
                    key={n}
                    onClick={() => setCountdownDuration(n)}
                    aria-pressed={countdownDuration === n}
                    className={[
                      'flex-1 min-h-9 px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary',
                      countdownDuration === n
                        ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-sm border border-stone-200 dark:border-stone-700'
                        : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-white/60 dark:hover:bg-white/5 border border-transparent',
                    ].join(' ')}
                  >
                    {n === 0 ? 'Off' : `${n}s`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ROW 2: Source — camera select + alternatives */}
          <div className="space-y-2 pt-3 border-t border-stone-100 dark:border-stone-800">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-stone-400 dark:text-stone-500 font-sans">
              Source
            </p>
            {/* Camera source row */}
            <div className="flex items-center gap-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/60 dark:bg-stone-800/40 px-2.5 py-1.5 focus-within:border-theme-primary focus-within:ring-2 focus-within:ring-theme-primary/20 transition-all">
              <Camera className="w-4 h-4 shrink-0 text-stone-400 dark:text-stone-500" />
              <select
                value={selectedDeviceId}
                aria-label="Camera source"
                onChange={e => {
                  setSelectedDeviceId(e.target.value);
                  setTorchOn(false);
                  localStorage.setItem('kb_lastDeviceId', e.target.value);
                }}
                className="flex-1 min-w-0 bg-transparent text-xs font-medium text-stone-700 dark:text-stone-200 cursor-pointer focus:outline-none py-1"
              >
                {devices.length === 0 ? (
                  <option value="">Waiting for permission…</option>
                ) : (
                  devices.map((d, i) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label
                        ? d.label
                        : cameraFacingMode === 'user'
                        ? 'Front Camera'
                        : `Camera ${i + 1}`}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Upload + Samples row */}
            <div className="grid grid-cols-2 gap-2">
              <label className="relative soft-btn-secondary min-h-10 text-xs cursor-pointer flex items-center justify-center gap-1.5">
                <ImagePlus className="w-4 h-4 text-theme-primary" />
                <span className="font-semibold">Upload</span>
                {photos.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-theme-primary text-white
                    text-[10px] flex items-center justify-center font-bold leading-none">
                    {photos.length}
                  </span>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  name="photos-upload-main"
                  aria-label="Upload photos"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                onClick={handleUseMockPhotos}
                className="min-h-10 text-xs font-semibold px-3 rounded-xl border border-dashed border-stone-300 dark:border-stone-700
                  text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 hover:border-theme-primary
                  transition-colors cursor-pointer flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary"
              >
                <Sparkles className="w-3.5 h-3.5 text-theme-primary" />
                Samples
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Confirmation Modal when navigating back with captured photos */}
      <ConfirmModal
        isOpen={showBackConfirm}
        title="Leave and clear photos?"
        message="Wait! Your pictures will not be saved. Download them first or they will be gone forever."
        confirmLabel="Leave & Clear"
        cancelLabel="Stay Here"
        onConfirm={handleConfirmBack}
        onCancel={() => setShowBackConfirm(false)}
      />
    </>
  );
};

