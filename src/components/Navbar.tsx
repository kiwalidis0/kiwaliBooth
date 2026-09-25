import React, { useState } from 'react';
import {
  Check,
  Layers,
  Camera,
  CheckSquare,
  Sliders,
  Download,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { NavbarToolsMenu } from './NavbarToolsMenu';
import { ConfirmModal } from './ConfirmModal';
import { useBooth } from '../context/useBooth';
import type { BoothStep } from '../types/photobooth';

export const Navbar: React.FC = () => {
  const {
    step,
    setStep,
    photos,
    resetBooth,
    isLaunchReady,
    isReviewComplete,
    triggerSavePhotostrip,
    triggerDownloadPhotostrip,
  } = useBooth();
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [pendingDestination, setPendingDestination] = useState<BoothStep | null>(null);

  const steps: { id: BoothStep; label: string; number: number; icon: React.FC<{ className?: string }> }[] = [
    { id: 'layout', label: 'Layout', number: 1, icon: Layers },
    { id: 'capture', label: 'Capture', number: 2, icon: Camera },
    { id: 'review', label: 'Review', number: 3, icon: CheckSquare },
    { id: 'editor', label: 'Studio', number: 4, icon: Sliders },
    { id: 'download', label: 'Save', number: 5, icon: Download },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === step);
  const progressPercent = step === 'landing' ? 0 : ((currentStepIndex + 1) / steps.length) * 100;

  const handleLogoClick = () => {
    if (step !== 'landing' && photos.length > 0) {
      setPendingDestination('landing');
      setShowResetConfirm(true);
    } else {
      resetBooth();
      setStep('landing');
    }
  };

  const handleStepClick = (targetStep: BoothStep) => {
    if (targetStep === 'layout' && photos.length > 0) {
      setPendingDestination('layout');
      setShowResetConfirm(true);
      return;
    }
    setStep(targetStep);
  };

  const handleConfirmReset = () => {
    setShowResetConfirm(false);
    resetBooth();
    setStep(pendingDestination || 'landing');
    setPendingDestination(null);
  };

  const handleCancelReset = () => {
    setShowResetConfirm(false);
    setPendingDestination(null);
  };

  const handleMobileBack = () => {
    if (step === 'layout') {
      handleLogoClick();
    } else if (step === 'review') {
      handleStepClick('layout');
    } else if (step === 'editor') {
      setStep('review');
    } else if (step === 'download') {
      setStep('editor');
    }
  };

  const currentStepConfig = steps.find(s => s.id === step);

  const getMobileAction = () => {
    if (step === 'layout') {
      return {
        label: 'Launch',
        icon: Camera,
        showArrow: true,
        disabled: !isLaunchReady,
        onClick: () => setStep('capture'),
      };
    }
    if (step === 'review') {
      return {
        label: 'Studio',
        icon: Sliders,
        showArrow: true,
        disabled: !isReviewComplete,
        onClick: () => setStep('editor'),
      };
    }
    if (step === 'editor') {
      return {
        label: 'Save',
        icon: Download,
        showArrow: true,
        disabled: false,
        onClick: () => triggerSavePhotostrip(),
      };
    }
    if (step === 'download') {
      return {
        label: 'Save',
        icon: Download,
        showArrow: false,
        disabled: false,
        onClick: () => triggerDownloadPhotostrip(),
      };
    }
    return null;
  };

  const mobileAction = getMobileAction();

  return (
    <>
      {/* Safe-area-aware sticky header */}
      <header
        className="sticky top-0 z-50 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-colors"
        style={{ paddingTop: 'max(0.75rem, calc(0.5rem + var(--safe-top)))' }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 px-4 sm:px-8 pb-3">
          {/* Brand Logo */}
          <button
            onClick={handleLogoClick}
            className="group text-left cursor-pointer focus:outline-none flex-shrink-0"
          >
            <BrandLogo size="md" />
          </button>

          {/* Desktop Stepper Bar (Preserved per reference media_1790266179418.png) */}
          {step !== 'landing' && (
            <nav className="hidden sm:flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-full border border-stone-200 dark:border-stone-700">
              {steps.map((s, idx) => {
                const isActive = s.id === step;
                const isPast = currentStepIndex > idx;
                return (
                  <button
                    key={s.id}
                    disabled={!isPast && !isActive}
                    onClick={() => handleStepClick(s.id)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-white dark:bg-stone-900 text-theme-primary border border-theme-primary shadow-sm font-semibold'
                        : isPast
                        ? 'text-black dark:text-stone-300 hover:text-theme-primary cursor-pointer'
                        : 'text-stone-400 dark:text-stone-600 cursor-not-allowed'
                    }`}
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 ${
                        isActive
                          ? 'soft-btn-coral !p-0 !text-white font-bold'
                          : isPast
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                          : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-400'
                      }`}
                    >
                      {isPast ? <Check className="w-2 h-2" /> : s.number}
                    </span>
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </nav>
          )}

          {/* Navbar Tools Menu (Palette, Font Size, Sound, Dark Mode) */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <NavbarToolsMenu />
          </div>
        </div>

        {/* Gradient progress bar — always visible in session */}
        {step !== 'landing' && (
          <div className="h-[2px] bg-stone-100 dark:bg-stone-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-theme-primary to-pink-400 transition-all duration-700 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </header>

      {/* Modern Floating Mobile Navbar & Action Pill — Visible on Steps 1, 3, 4, 5 (Auto-hides on Step 2 Capture) */}
      {step !== 'landing' && step !== 'capture' && (
        <aside
          aria-label="Mobile Navigation & Actions"
          className="sm:hidden fixed bottom-3 left-1/2 -translate-x-1/2 z-50 w-[calc(100vw-1.5rem)] max-w-md bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl border border-stone-200/90 dark:border-stone-800 shadow-2xl rounded-full p-1.5 px-2 flex items-center justify-between gap-1.5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 overflow-hidden"
          style={{ marginBottom: 'var(--safe-bottom, 0px)' }}
        >
          {/* Left: Previous / Back Button */}
          <div className="flex-1 flex justify-start">
            <button
              onClick={handleMobileBack}
              className="h-8 px-2.5 rounded-full text-xs font-fredoka font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-1 cursor-pointer transition-colors flex-shrink-0"
              title="Previous Step"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-stone-500" />
              <span>{step === 'layout' ? 'Exit' : 'Back'}</span>
            </button>
          </div>

          {/* Center: Current Step Indicator (Resilient middle flex item, never clipped or overlapped) */}
          <div className="flex-shrink-0 text-center px-1 pointer-events-none">
            <div className="font-fredoka text-xs text-stone-700 dark:text-stone-300 whitespace-nowrap">
              <span className="text-theme-primary font-bold">
                Step {currentStepConfig?.number || 1}
              </span>
              <span className="text-stone-400 dark:text-stone-500 mx-1">·</span>
              <span className="font-semibold">{currentStepConfig?.label || ''}</span>
            </div>
          </div>

          {/* Right: Primary Action Button for this step (Sized proportionally with rounded-full nested radius) */}
          <div className="flex-1 flex justify-end">
            {mobileAction && (
              <button
                onClick={mobileAction.onClick}
                disabled={mobileAction.disabled}
                className={`h-8 px-3 rounded-full text-xs font-fredoka font-semibold flex items-center gap-1 transition-all flex-shrink-0 cursor-pointer ${
                  mobileAction.disabled
                    ? 'bg-stone-200 dark:bg-stone-800 text-stone-400 cursor-not-allowed shadow-none'
                    : 'bg-theme-primary hover:bg-theme-primary-hover text-white shadow-xs active:scale-95'
                }`}
              >
                <mobileAction.icon className="w-3.5 h-3.5" />
                <span>{mobileAction.label}</span>
                {mobileAction.showArrow && <ArrowRight className="w-3 h-3" />}
              </button>
            )}
          </div>
        </aside>
      )}

      {/* Confirmation Modal when resetting active session */}
      <ConfirmModal
        isOpen={showResetConfirm}
        title="Leave photobooth?"
        message="Wait! Your pictures will not be saved. Download them first or they will be gone forever."
        confirmLabel="Leave & Start Fresh"
        cancelLabel="Stay in Booth"
        onConfirm={handleConfirmReset}
        onCancel={handleCancelReset}
      />
    </>
  );
};
