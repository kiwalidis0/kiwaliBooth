import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { useBooth } from '../context/useBooth';
import type { BoothStep } from '../types/photobooth';

export const Navbar: React.FC = () => {
  const { step, setStep, isMuted, toggleMute, resetBooth } = useBooth();

  const steps: { id: BoothStep; label: string; number: number }[] = [
    { id: 'layout', label: 'Layout', number: 1 },
    { id: 'capture', label: 'Capture', number: 2 },
    { id: 'review', label: 'Review', number: 3 },
    { id: 'editor', label: 'Studio', number: 4 },
    { id: 'download', label: 'Print', number: 5 },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === step);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 px-4 sm:px-8 py-3 transition-all">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <button
          onClick={resetBooth}
          className="group text-left cursor-pointer focus:outline-none"
        >
          <BrandLogo size="md" />
        </button>

        {/* Step Progress Indicators (Visible when in session) */}
        {step !== 'landing' && (
          <nav className="flex items-center gap-1 sm:gap-2 bg-stone-100/80 p-1 rounded-full border border-stone-200/60">
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
                      ? 'bg-white text-stone-900 border border-stone-200'
                      : isPast
                      ? 'text-stone-600 hover:text-stone-900 cursor-pointer'
                      : 'text-stone-400 cursor-not-allowed hidden sm:flex'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${
                      isActive ? 'bg-kiwali-coral text-white font-bold' : 'bg-stone-200 text-stone-600'
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

        {/* Sound Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
            className="w-8 h-8 rounded-lg bg-white border border-stone-200 flex items-center justify-center hover:bg-stone-50 text-stone-600 hover:text-stone-900 transition-all cursor-pointer"
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-stone-400" />
            ) : (
              <Volume2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
