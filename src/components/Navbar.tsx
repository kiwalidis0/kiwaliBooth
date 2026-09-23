import React, { useState } from 'react';
import { BrandLogo } from './BrandLogo';
import { NavbarToolsMenu } from './NavbarToolsMenu';
import { ConfirmModal } from './ConfirmModal';
import { useBooth } from '../context/useBooth';
import type { BoothStep } from '../types/photobooth';

export const Navbar: React.FC = () => {
  const { step, setStep, photos, resetBooth } = useBooth();
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  const steps: { id: BoothStep; label: string; number: number }[] = [
    { id: 'layout', label: 'Layout', number: 1 },
    { id: 'capture', label: 'Capture', number: 2 },
    { id: 'review', label: 'Review', number: 3 },
    { id: 'editor', label: 'Studio', number: 4 },
    { id: 'download', label: 'Save', number: 5 },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === step);

  const handleLogoClick = () => {
    if (step !== 'landing' && photos.length > 0) {
      setShowResetConfirm(true);
    } else {
      resetBooth();
      setStep('landing');
    }
  };

  const handleConfirmReset = () => {
    setShowResetConfirm(false);
    resetBooth();
    setStep('landing');
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 px-4 sm:px-8 py-3 transition-colors">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Brand Logo with kiwalibooth.svg */}
          <button
            onClick={handleLogoClick}
            className="group text-left cursor-pointer focus:outline-none"
          >
            <BrandLogo size="md" />
          </button>

          {/* Step Progress Indicators (Visible when in session) */}
          {step !== 'landing' && (
            <nav className="flex items-center gap-1 sm:gap-2 bg-stone-100 dark:bg-stone-800 p-1 rounded-full border border-stone-200 dark:border-stone-700">
              {steps.map((s, idx) => {
                const isActive = s.id === step;
                const isPast = currentStepIndex > idx;
                return (
                  <button
                    key={s.id}
                    disabled={!isPast && !isActive}
                    onClick={() => setStep(s.id)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white border border-stone-200 dark:border-stone-700 shadow-sm'
                        : isPast
                        ? 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white cursor-pointer'
                        : 'text-stone-400 dark:text-stone-600 cursor-not-allowed hidden sm:flex'
                    }`}
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${
                        isActive
                          ? 'soft-btn-coral !p-0 !text-white font-bold'
                          : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-400'
                      }`}
                    >
                      {s.number}
                    </span>
                    <span className={`${isActive ? 'block' : 'hidden sm:block'}`}>{s.label}</span>
                  </button>
                );
              })}
            </nav>
          )}

          {/* Navbar Tools Menu (Palette, Font Size, Sound, Dark Mode) */}
          <div className="flex items-center gap-2">
            <NavbarToolsMenu />
          </div>
        </div>
      </header>

      {/* Confirmation Modal when resetting active session */}
      <ConfirmModal
        isOpen={showResetConfirm}
        title="Leave photobooth?"
        message="Wait! Your pictures will not be saved. Download them first or they will be gone forever."
        confirmLabel="Leave & Start Fresh"
        cancelLabel="Stay in Booth"
        onConfirm={handleConfirmReset}
        onCancel={() => setShowResetConfirm(false)}
      />
    </>
  );
};
