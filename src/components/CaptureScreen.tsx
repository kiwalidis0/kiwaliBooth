import React, { useState, useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  Camera,
  FlipHorizontal,
  RefreshCw,
  ArrowLeft,
  AlertCircle,
  Upload,
  Play,
  Sparkles,
  Check,
  RectangleHorizontal,
  Smartphone,
} from 'lucide-react';
import { useBooth } from '../context/useBooth';
import { LAYOUTS } from '../data/layouts';
import { playCountdownBeep, playShutterSound } from '../utils/audio';
import { MOCK_SELFIE_LIST } from '../utils/mockPhotos';
import { ConfirmModal } from './ConfirmModal';
import type { CapturedPhoto } from '../types/photobooth';

gsap.registerPlugin(useGSAP);

export const CaptureScreen: React.FC = () => {
  const {
    selectedLayoutId,
    selectedLayoutIds,
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
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);
  const [showBackConfirm, setShowBackConfirm] = useState<boolean>(false);

  const [retryTrigger, setRetryTrigger] = useState<number>(0);

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

        if (navigator.mediaDevices.enumerateDevices) {
          const allDevices = await navigator.mediaDevices.enumerateDevices();
          if (isCancelled) return;
          const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
          setDevices(videoDevices);
          if (videoDevices.length > 0 && !selectedDeviceId) {
            setSelectedDeviceId(videoDevices[0].deviceId);
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
    if (!video || video.videoWidth === 0) return null;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    if (isMirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/jpeg', 0.95);
  }, [isMirrored]);

  const recordSlotPhoto = useCallback((dataUrl: string, slotIdx: number) => {
    playShutterSound();
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 400);

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

  const handleManualSnap = () => {
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
        setTimeout(() => setStep('review'), 500);
      } else {
        setCurrentSlotTarget(nextSlot);
      }
    }
  };

  const startCountdownSequence = () => {
    if (isCapturing) return;
    setIsCapturing(true);

    let currentTarget = retakeIndex !== null ? retakeIndex : 0;
    setCurrentSlotTarget(currentTarget);

    const runSingleShotCountdown = () => {
      let count = 3;
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

          let dataUrl: string | null = null;
          if (hasCameraAccess) {
            dataUrl = captureFrame();
          }
          if (!dataUrl) {
            dataUrl = MOCK_SELFIE_LIST[currentTarget % MOCK_SELFIE_LIST.length];
          }

          recordSlotPhoto(dataUrl, currentTarget);

          if (retakeIndex !== null) {
            setIsCapturing(false);
            setRetakeIndex(null);
            setTimeout(() => setStep('review'), 600);
            return;
          }

          currentTarget += 1;
          if (currentTarget < shotsCount) {
            setCurrentSlotTarget(currentTarget);
            setTimeout(() => {
              runSingleShotCountdown();
            }, 1200);
          } else {
            setIsCapturing(false);
            setTimeout(() => setStep('review'), 700);
          }
        }
      }, 1000);
    };

    runSingleShotCountdown();
  };

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

    const readAsDataUrl = (f: File): Promise<string> =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (evt) => resolve(evt.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(f);
      });

    try {
      const dataUrls = await Promise.all(fileList.map(readAsDataUrl));

      if (retakeIndex !== null) {
        recordSlotPhoto(dataUrls[0], retakeIndex);
        setRetakeIndex(null);
        setTimeout(() => setStep('review'), 400);
        return;
      }

      const updatedPhotos = [...photos];

      dataUrls.forEach((dataUrl, idx) => {
        const slotIdx = (currentSlotTarget + idx) % shotsCount;
        const newPhoto: CapturedPhoto = {
          id: `photo-upload-${Date.now()}-${slotIdx}`,
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

  const isLandscape = captureOrientation === 'landscape';

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
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 text-xs text-black dark:text-stone-300 hover:text-theme-primary cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{retakeIndex !== null ? 'Cancel Retake' : 'Back to Layout'}</span>
          </button>

          {/* Quick slot indicators */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-fredoka font-semibold text-stone-700 dark:text-stone-300">
              Shot {currentSlotTarget + 1} of {shotsCount}
            </span>
            {shotsCount > 1 && (
              <div className="flex items-center gap-1">
                {Array.from({ length: shotsCount }).map((_, idx) => {
                  const isFilled = photos.some(p => p.slotIndex === idx);
                  const isCurrent = currentSlotTarget === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlotTarget(idx)}
                      title={`Target shot #${idx + 1}`}
                      className={`w-5 h-5 rounded-md text-[10px] font-fredoka font-semibold flex items-center justify-center transition-all cursor-pointer ${
                        isCurrent
                          ? 'soft-btn-coral !p-0 !text-white font-bold ring-2 ring-theme-primary/30'
                          : isFilled
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      {isFilled && !isCurrent ? <Check className="w-2.5 h-2.5" /> : idx + 1}
                    </button>
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

        {/* Camera Viewfinder Container */}
        <div
          className={`relative w-full bg-stone-950 rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 flex items-center justify-center transition-all duration-300 ${
            isLandscape
              ? 'aspect-[16/9] max-h-[500px]'
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

          {/* In-Container Viewfinder Overlays & Tool Cluster */}
          <div className="absolute inset-0 pointer-events-none p-3 flex flex-col justify-between z-10">
            {/* Top Row: Dedicated Shot Counter on Left, In-Camera Tools on Right */}
            <div className="flex items-center justify-between pointer-events-auto">
              {/* Dedicated Shot Counter Badge (Moved away from navbar breadcrumb) */}
              <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15 text-white shadow-lg">
                <div className="w-2 h-2 rounded-full bg-theme-primary animate-pulse" />
                <span className="font-fredoka font-semibold text-xs tracking-wide text-white">
                  {retakeIndex !== null
                    ? `Retaking Shot #${retakeIndex + 1}`
                    : `Shot ${currentSlotTarget + 1} of ${shotsCount}`}
                </span>
              </div>

              {/* In-Camera Control Cluster (Mirror, Camera Flip, Landscape Mode) */}
              <div className="flex items-center gap-1.5">
                {/* Mirror Toggle */}
                <button
                  onClick={() => setIsMirrored(prev => !prev)}
                  title={isMirrored ? 'Disable Mirror' : 'Enable Mirror'}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer backdrop-blur-md shadow-md border ${
                    isMirrored
                      ? 'bg-theme-primary text-white border-theme-primary'
                      : 'bg-black/50 text-white/80 border-white/20 hover:bg-black/70'
                  }`}
                >
                  <FlipHorizontal className="w-4 h-4" />
                </button>

                {/* Flip Camera (Front / Back) */}
                <button
                  onClick={handleToggleFlipCamera}
                  title={`Switch to ${cameraFacingMode === 'user' ? 'Back' : 'Front'} Camera`}
                  className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white/90 border border-white/20 backdrop-blur-md flex items-center justify-center transition-all cursor-pointer shadow-md"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>

                {/* Horizontal / Landscape Mode Toggle */}
                <button
                  onClick={handleToggleOrientation}
                  title={isLandscape ? 'Switch to Portrait Mode' : 'Switch to Landscape Mode (Wide Group Shots)'}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer backdrop-blur-md shadow-md border ${
                    isLandscape
                      ? 'bg-amber-500 text-white border-amber-400'
                      : 'bg-black/50 text-white/80 border-white/20 hover:bg-black/70'
                  }`}
                >
                  {isLandscape ? (
                    <Smartphone className="w-4 h-4" />
                  ) : (
                    <RectangleHorizontal className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Bottom Row inside Viewfinder */}
            <div className="flex items-center justify-between text-white/80 text-[10px] font-sans px-1">
              <span className="bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded text-white/70">
                {isLandscape ? 'Landscape Mode • Wide View' : 'Portrait Mode'}
              </span>
              {selectedLayoutIds.length > 1 && (
                <span className="bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded text-white/70">
                  Shared across {selectedLayoutIds.length} layouts
                </span>
              )}
            </div>
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

        {/* Unified Bottom Control Area (Ergonomic mobile-first layout) */}
        <div className="w-full mt-3 bg-white dark:bg-stone-900 p-3 sm:p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-2.5">
          {/* ROW 1: UNIFIED PRIMARY ACTIONS (Auto Countdown & Snap Now) */}
          <div className="flex items-center gap-2.5 w-full">
            <button
              onClick={startCountdownSequence}
              disabled={isCapturing}
              className={`flex-1 h-12 soft-btn-coral text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                isCapturing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Play className="w-4 h-4 fill-white" />
              <span className="font-medium truncate">
                {isCapturing ? 'Capturing sequence...' : 'Auto Countdown (3s)'}
              </span>
            </button>

            <button
              onClick={handleManualSnap}
              disabled={isCapturing}
              className="h-12 px-4 sm:px-6 soft-btn-secondary text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer flex-shrink-0"
              title="Snap immediately"
            >
              <Camera className="w-4 h-4" />
              <span className="font-medium">Snap Now</span>
            </button>
          </div>

          {/* ROW 2: SECONDARY ACTIONS & FALLBACKS */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-100 dark:border-stone-800 text-xs">
            {/* Device Camera Selector if multiple cameras available */}
            {devices.length > 1 ? (
              <select
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="max-w-[140px] truncate px-2 py-1 rounded-lg border border-stone-200 dark:border-stone-700 text-[11px] bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 cursor-pointer"
              >
                {devices.map((d, i) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Camera ${i + 1}`}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-[11px] text-stone-400 font-sans">
                Camera ready
              </span>
            )}

            {/* Quick Upload & Sample Photos */}
            <div className="flex items-center gap-2">
              <label className="px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-[11px] font-medium flex items-center gap-1.5 cursor-pointer transition-colors">
                <Upload className="w-3 h-3 text-stone-500" />
                <span>Upload Photos</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                onClick={handleUseMockPhotos}
                className="text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 px-2 py-1 text-[11px] transition-colors cursor-pointer"
              >
                Use Samples
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

