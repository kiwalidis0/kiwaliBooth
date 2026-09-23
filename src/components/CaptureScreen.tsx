import React, { useState, useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  Camera,
  FlipHorizontal,
  ArrowLeft,
  AlertCircle,
  Upload,
  Play,
  Sparkles,
  Check
} from 'lucide-react';
import { useBooth } from '../context/useBooth';
import { LAYOUTS } from '../data/layouts';
import { playCountdownBeep, playShutterSound } from '../utils/audio';
import { MOCK_SELFIE_LIST } from '../utils/mockPhotos';
import type { CapturedPhoto } from '../types/photobooth';

gsap.registerPlugin(useGSAP);

export const CaptureScreen: React.FC = () => {
  const {
    selectedLayoutId,
    photos,
    setPhotos,
    retakeIndex,
    setRetakeIndex,
    setStep,
  } = useBooth();

  const layout = LAYOUTS[selectedLayoutId];

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const countdownNumberRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [hasCameraAccess, setHasCameraAccess] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMirrored, setIsMirrored] = useState<boolean>(true);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  // Capture loop state
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [currentSlotTarget, setCurrentSlotTarget] = useState<number>(retakeIndex !== null ? retakeIndex : 0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showFlash, setShowFlash] = useState<boolean>(false);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);

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
            : { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
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
  }, [selectedDeviceId, retryTrigger]);

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
      if (nextSlot >= layout.shotsCount) {
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
          if (currentTarget < layout.shotsCount) {
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
    const mockPhotos: CapturedPhoto[] = layout.slots.map((_, i) => ({
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
        // Single slot retake
        recordSlotPhoto(dataUrls[0], retakeIndex);
        setRetakeIndex(null);
        setTimeout(() => setStep('review'), 400);
        return;
      }

      // If user provided multiple files or just one file:
      const updatedPhotos = [...photos];

      dataUrls.forEach((dataUrl, idx) => {
        const slotIdx = (currentSlotTarget + idx) % layout.shotsCount;
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

      // Check if all slots are filled
      if (updatedPhotos.length >= layout.shotsCount) {
        setUploadFeedback('All slots filled! Proceeding to review...');
        setTimeout(() => setStep('review'), 500);
      } else {
        const nextUnfilled = layout.slots.find(
          s => !updatedPhotos.some(p => p.slotIndex === s.id)
        )?.id ?? 0;
        setCurrentSlotTarget(nextUnfilled);
        setUploadFeedback(`Uploaded! Now select photo for slot #${nextUnfilled + 1}`);
        setTimeout(() => setUploadFeedback(null), 3000);
      }
    } catch (err) {
      console.error('File upload error:', err);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div ref={containerRef} className="py-6 px-4 max-w-3xl mx-auto flex flex-col items-center">
      {/* Screen Flash Overlay */}
      {showFlash && (
        <div className="fixed inset-0 z-50 bg-white pointer-events-none camera-flash" />
      )}

      {/* Header bar */}
      <div className="w-full flex items-center justify-between gap-4 mb-3">
        <button
          onClick={() => {
            if (retakeIndex !== null) {
              setRetakeIndex(null);
              setStep('review');
            } else {
              setStep('layout');
            }
          }}
          className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-900 cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{retakeIndex !== null ? 'Cancel Retake' : 'Back'}</span>
        </button>

        {/* Slot Progress Indicator */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-medium text-stone-700">
          <span>
            {retakeIndex !== null
              ? `Retaking Shot #${retakeIndex + 1}`
              : `Targeting Shot #${currentSlotTarget + 1} of ${layout.shotsCount}`}
          </span>
          <div className="flex gap-1 ml-1">
            {layout.slots.map((s) => {
              const isFilled = photos.some(p => p.slotIndex === s.id);
              const isCurrent = currentSlotTarget === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setCurrentSlotTarget(s.id)}
                  title={`Select slot #${s.id + 1}`}
                  className={`w-5 h-5 rounded-md text-[10px] font-mono flex items-center justify-center transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-kiwali-coral text-white font-bold ring-2 ring-kiwali-coral/30'
                      : isFilled
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-stone-100 text-stone-500 border border-stone-200 hover:bg-stone-200'
                  }`}
                >
                  {isFilled && !isCurrent ? <Check className="w-2.5 h-2.5" /> : s.id + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {uploadFeedback && (
        <div className="w-full mb-3 p-2 text-center text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl">
          {uploadFeedback}
        </div>
      )}

      {/* Camera Viewfinder */}
      <div className="relative w-full aspect-[4/3] max-h-[480px] bg-stone-900 rounded-2xl overflow-hidden border border-stone-200 flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transition-transform ${
            isMirrored ? 'scale-x-[-1]' : ''
          } ${hasCameraAccess === false ? 'hidden' : 'block'}`}
        />

        {/* Camera Error / Fallback Banner */}
        {hasCameraAccess === false && (
          <div className="p-6 text-center max-w-sm bg-white rounded-2xl border border-stone-200 mx-4">
            <AlertCircle className="w-8 h-8 text-kiwali-coral mx-auto mb-2" />
            <h3 className="font-fredoka font-semibold text-base text-stone-900 mb-1">
              Camera Not Available
            </h3>
            <p className="text-xs text-stone-500 mb-4">{errorMessage}</p>

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
                <Sparkles className="w-3.5 h-3.5" />
                <span>Use Sample Photos</span>
              </button>

              <button
                onClick={() => setRetryTrigger(prev => prev + 1)}
                className="text-[11px] text-stone-400 hover:text-stone-700 underline mt-1 cursor-pointer"
              >
                Retry Camera
              </button>
            </div>
          </div>
        )}

        {/* Viewfinder overlay */}
        <div className="absolute inset-4 pointer-events-none border border-white/20 rounded-xl flex flex-col justify-between p-3">
          <div className="flex justify-between items-center text-white/80 text-[11px]">
            <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-0.5 rounded-md">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              <span>LIVE</span>
            </div>
            <span className="text-[10px] text-white/70 font-mono">
              {layout.name}
            </span>
          </div>
          <div />
        </div>

        {/* Center Countdown Pulse */}
        {countdown !== null && (
          <div
            ref={countdownNumberRef}
            className="absolute inset-0 flex items-center justify-center bg-black/30 z-30 pointer-events-none"
          >
            <div className="w-24 h-24 rounded-2xl bg-white border border-stone-200 flex items-center justify-center">
              {countdown > 0 ? (
                <span className="font-fredoka font-bold text-5xl text-stone-900">
                  {countdown}
                </span>
              ) : (
                <div className="text-center font-fredoka font-semibold text-lg text-kiwali-coral leading-tight">
                  Smile!
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Control Area: Row 1 (Primary) & Row 2 (Secondary) */}
      <div className="w-full mt-4 bg-white p-4 rounded-2xl border border-stone-200 space-y-3">
        {/* ROW 1: PRIMARY ACTION BUTTONS */}
        <div className="flex items-center justify-center gap-3 w-full">
          <button
            onClick={startCountdownSequence}
            disabled={isCapturing}
            className={`flex-1 max-w-xs soft-btn-coral text-sm py-3 flex items-center justify-center gap-2 ${
              isCapturing ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{isCapturing ? 'Capturing sequence...' : 'Auto Countdown (3s)'}</span>
          </button>

          <button
            onClick={handleManualSnap}
            disabled={isCapturing}
            className="soft-btn-secondary text-sm py-3 px-6 flex items-center gap-2"
            title="Snap immediately"
          >
            <Camera className="w-4 h-4" />
            <span>Snap Now</span>
          </button>
        </div>

        {/* ROW 2: SECONDARY CONTROLS & FALLBACKS */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100 text-xs">
          {/* Left: Camera Options */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMirrored(prev => !prev)}
              title="Toggle Mirror View"
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                isMirrored
                  ? 'border-kiwali-coral bg-kiwali-soft-pink/40 text-kiwali-coral'
                  : 'border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
              <span>Mirror</span>
            </button>

            {devices.length > 1 && (
              <select
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs bg-white text-stone-700 cursor-pointer"
              >
                {devices.map((d, i) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Camera ${i + 1}`}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Right: Upload & Samples */}
          <div className="flex items-center gap-2">
            <label className="px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5 text-stone-500" />
              <span>Upload Photo(s)</span>
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
              className="text-stone-500 hover:text-stone-800 px-2.5 py-1.5 text-xs transition-colors cursor-pointer"
            >
              Use Samples
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
