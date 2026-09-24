import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { NavbarToolsMenu } from './NavbarToolsMenu';
import { ConfirmModal } from './ConfirmModal';
import { useBooth } from '../context/useBooth';
import type { BoothStep } from '../types/photobooth';

export const Navbar: React.FC = () => {
  const { step, setStep, photos, resetBooth } = useBooth();
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [pendingDestination, setPendingDestination] = useState<BoothStep | null>(null);

  const steps: { id: BoothStep; label: string; number: number }[] = [
    { id: 'layout', label: 'Layout', number: 1 },
    { id: 'capture', label: 'Capture', number: 2 },
    { id: 'review', label: 'Review', number: 3 },
    { id: 'editor', label: 'Studio', number: 4 },
    { id: 'download', label: 'Save', number: 5 },
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
    // If user has captured shots/active progress and clicks Layout, require confirmation
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

          {/* Step Progress — Option C: text on mobile, pills on sm+ */}
          {step !== 'landing' && (
            <>
              {/* Mobile: compact "Step X of 5 · Label" */}
              <div className="sm:hidden flex-1 text-center text-xs font-medium text-stone-500 dark:text-stone-400 truncate">
                <span className="text-theme-primary font-semibold">
                  Step {currentStepIndex + 1}
                </span>
                {' '}of {steps.length}
                {' · '}
                <span className="text-black dark:text-white font-semibold">
                  {steps[currentStepIndex]?.label}
                </span>
              </div>

              {/* sm+: full pill stepper */}
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
            </>
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
