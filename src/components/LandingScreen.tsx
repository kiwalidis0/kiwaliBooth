import React, { useState, useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  Camera,
  ArrowRight,
  ShieldCheck,
  Layers,
  Sliders,
  Info,
  RotateCw,
  Download
} from 'lucide-react';
import { useBooth } from '../context/useBooth';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { MOCK_SELFIE_LIST } from '../utils/mockPhotos';
import type { LayoutId } from '../types/photobooth';

gsap.registerPlugin(useGSAP);

interface LandingScreenProps {
  onOpenPrivacy?: () => void;
}

interface StripPreviewData {
  id: LayoutId;
  name: string;
  subtitle: string;
  mockIndices: number[];
  aspectRatio: string;
}

const STRIP_CARDS: StripPreviewData[] = [
  {
    id: 'classic4',
    name: 'Classic Strip',
    subtitle: '4 Iconic Cuts',
    mockIndices: [0, 1, 2, 3],
    aspectRatio: '4 / 7',
  },
  {
    id: 'triple',
    name: 'Triple Story',
    subtitle: '3 Vertical Cuts',
    mockIndices: [0, 2, 3],
    aspectRatio: '4 / 6',
  },
  {
    id: 'double',
    name: 'Double Take',
    subtitle: '2 Vertical Cuts',
    mockIndices: [1, 2],
    aspectRatio: '4 / 5',
  },
  {
    id: 'single',
    name: 'Polaroid Vibe',
    subtitle: '1 Single Cut',
    mockIndices: [0],
    aspectRatio: '4 / 4.8',
  },
];

export const LandingScreen: React.FC<LandingScreenProps> = ({ onOpenPrivacy }) => {
  const { setStep, setSelectedLayoutId } = useBooth();
  const { canInstall, promptInstall } = usePWAInstall();
  const containerRef = useRef<HTMLDivElement>(null);
  const deckRef = useRef<HTMLDivElement>(null);

  const [topIndex, setTopIndex] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  const handleNextCard = () => {
    if (isAnimating) return;
    setIsAnimating(true);

    const activeEl = deckRef.current?.querySelector(
      `[data-card-index="${topIndex}"]`
    );

    if (activeEl) {
      // Enhanced 3D tactile fling animation
      gsap.to(activeEl, {
        x: 180,           // Throw it slightly further horizontally
        y: -50,           // Lift it up
        rotation: 25,     // More dynamic 2D spin
        rotationY: -45,   // 3D flip effect showing the "back" of the card
        scale: 1.05,      // Slight pop-up effect as it's lifted
        opacity: 0,
        duration: 0.45,
        ease: 'back.in(1.2)', // Pulls back slightly before throwing
        onComplete: () => {
          setTopIndex(prev => (prev + 1) % STRIP_CARDS.length);
          // Reset all properties so it slides cleanly to the back of the stack
          gsap.set(activeEl, { x: 0, y: 0, rotation: 0, rotationY: 0, scale: 1, opacity: 1 });
          setIsAnimating(false);
        },
      });
    } else {
      setTopIndex(prev => (prev + 1) % STRIP_CARDS.length);
      setIsAnimating(false);
    }
  };

  const currentStrip = STRIP_CARDS[topIndex];

  const handleStartWithLayout = (layoutId: LayoutId) => {
    setSelectedLayoutId(layoutId);
    setStep('layout');
  };

  return (
    <div
      ref={containerRef}
      className="py-10 sm:py-16 px-4 max-w-6xl mx-auto flex flex-col items-center"
    >
      {/* Hero Headline */}
      <div className="text-center max-w-2xl mb-8">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-fredoka font-semibold text-stone-900 dark:text-white tracking-tight leading-[1.15] mb-4">
          Capture memories. <br />
          <span className="text-kiwali-coral">Print your cutouts.</span>
        </h1>

        <p className="text-base sm:text-lg text-black dark:text-stone-200 font-sans max-w-xl mx-auto leading-relaxed">
          No apps, no cloud, no accounts. <br />
          Capture and save your own photobooth strips directly in your browser.
          Webcam countdowns, multi-shot strips, and instant downloads.
        </p>

        {/* Start Button */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => setStep('layout')}
            className="soft-btn-coral text-base px-8 py-3.5 group flex items-center gap-2.5 cursor-pointer"
          >
            <Camera className="w-5 h-5 group-hover:scale-105 transition-transform" />
            <span>Enter Photobooth</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* PWA Install Banner — only shown when browser supports it and app is not installed */}
      {canInstall && (
        <button
          onClick={promptInstall}
          className="mt-2 mb-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-medium text-stone-600 dark:text-stone-300 hover:border-theme-primary hover:text-theme-primary transition-colors cursor-pointer shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Add to Home Screen</span>
        </button>
      )}

      {/* Interactive Stacked Photo Strips Showcase */}
      <div className="w-full max-w-md my-6 flex flex-col items-center select-none">
        {/* Interaction Hint Badge */}
        <button
          onClick={handleNextCard}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-kiwali-soft-pink/50 text-stone-800 dark:text-stone-200 dark:bg-stone-800 text-xs font-medium mb-4 border border-stone-200 dark:border-stone-700 hover:scale-105 transition-transform cursor-pointer shadow-sm"
        >
          <RotateCw className="w-3 h-3 text-kiwali-coral animate-spin-slow" />
          <span>Click deck to flip strip</span>
        </button>

        {/* Stack Deck Container with 3D perspective added */}
        <div
          ref={deckRef}
          onClick={handleNextCard}
          className="relative w-44 sm:w-52 h-[min(460px,55svh)] sm:h-[490px] flex items-center justify-center cursor-pointer group mb-2"
          style={{ perspective: '1000px' }} // Added for 3D flip realism
          title="Click to see next strip"
        >
          {STRIP_CARDS.map((strip, idx) => {
            // Distance from top of stack
            const order =
              (idx - topIndex + STRIP_CARDS.length) % STRIP_CARDS.length;
            const isTop = order === 0;

            // Slightly more organic stack transform presets
            const rotations = [0, 5, -3, 6];
            const yOffsets = [0, 10, 20, 28];
            const xOffsets = [0, 4, -4, 2]; // Added subtle X offset for a messier desk look
            const scales = [1, 0.95, 0.90, 0.85];
            const opacities = [1, 0.85, 0.65, 0.4];

            const rot = rotations[order] || 0;
            const yOff = yOffsets[order] || 0;
            const xOff = xOffsets[order] || 0;
            const sc = scales[order] || 0.85;
            const op = opacities[order] || 0.3;
            const zIdx = 10 - order;

            return (
              <div
                key={strip.id}
                data-card-index={idx}
                className="absolute inset-0 flex items-center justify-center transition-shadow duration-300"
                style={{
                  transform: `translate3d(${xOff}px, ${yOff}px, 0) rotate(${rot}deg) scale(${sc})`,
                  opacity: op,
                  zIndex: zIdx,
                  pointerEvents: isTop ? 'auto' : 'none',
                  // Enhance shadow on the top card on hover
                  filter: isTop ? 'drop-shadow(0 15px 25px rgba(0,0,0,0.12))' : 'drop-shadow(0 4px 6px rgba(0,0,0,0.05))'
                }}
              >
                {/* Actual Strip */}
                <div
                  className="relative w-full max-h-full bg-white dark:bg-stone-900 rounded-2xl p-2.5 sm:p-3 border border-stone-200 dark:border-stone-700 transition-all duration-300 flex flex-col justify-between overflow-hidden"
                  style={{
                    aspectRatio: strip.aspectRatio,
                    // Subtle hover lift on the actual card content
                    transform: isTop && !isAnimating ? 'translateY(-2px)' : 'none',
                  }}
                >
                  {/* Strip Cutout Photos */}
                  <div className="flex-1 flex flex-col gap-1.5 min-h-0 justify-center">
                    {strip.mockIndices.map((mockIdx, i) => (
                      <div
                        key={i}
                        className="flex-1 min-h-0 w-full rounded-lg overflow-hidden bg-stone-100 dark:bg-stone-800 border border-stone-100 dark:border-stone-800"
                      >
                        <img
                          src={MOCK_SELFIE_LIST[mockIdx]}
                          alt={`${strip.name} pose ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Strip Footer */}
                  <div className="mt-2 pt-2 border-t border-stone-100 dark:border-stone-800 text-center flex-shrink-0">
                    <div className="font-fredoka font-semibold text-xs text-stone-900 dark:text-white">
                      {strip.name}
                    </div>

                    <div className="font-sans font-medium text-[9px] text-stone-400">
                      {strip.subtitle}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Deck Indicator Dots (without next/prev buttons) */}
        <div className="flex items-center gap-1.5 my-3">
          {STRIP_CARDS.map((s, idx) => (
            <button
              key={s.id}
              onClick={(e) => {
                e.stopPropagation();
                setTopIndex(idx);
              }}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                topIndex === idx
                  ? 'w-6 bg-kiwali-coral'
                  : 'w-2 bg-stone-200 dark:bg-stone-700 hover:bg-stone-400'
              }`}
              title={`View ${s.name}`}
            />
          ))}
        </div>

        <button
          onClick={() => handleStartWithLayout(currentStrip.id)}
          className="text-xs text-kiwali-coral font-medium hover:underline cursor-pointer flex items-center gap-1"
        >
          <span>Use {currentStrip.name}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Emphasized Reassurance Section: 3 Pillars */}
      <div className="mt-16 sm:mt-24 w-full max-w-4xl">
        <div className="text-center mb-6">
          <h2 className="text-xl sm:text-2xl font-fredoka font-semibold text-theme-primary">
            Engineered for Privacy &amp; Creativity
          </h2>

          <p className="text-xs text-black dark:text-stone-300 mt-1">
            Built client-side — photos stay on your device, never uploaded
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pillar 1: 100% In-Browser Memory */}
          <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-xl bg-theme-soft/50 dark:bg-stone-800 border border-theme-primary/30 flex items-center justify-center text-theme-primary mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>

              <h3 className="font-fredoka font-semibold text-base text-black dark:text-white mb-1">
                Private by Design, Saved Locally
              </h3>

              <p className="text-xs text-black dark:text-stone-300 leading-relaxed font-sans">
                Zero cloud uploads. Captures auto-save to your browser's local IndexedDB for 24h resume, preferences to localStorage.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800">
              <button
                onClick={onOpenPrivacy}
                className="text-[11px] text-theme-primary font-medium hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <Info className="w-3 h-3" />
                <span>Read Privacy Architecture</span>
              </button>
            </div>
          </div>

          {/* Pillar 2: 1-4 Cuts & Overlays */}
          <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-xl bg-theme-soft/50 dark:bg-stone-800 border border-theme-primary/30 flex items-center justify-center text-theme-primary mb-3">
                <Layers className="w-5 h-5" />
              </div>

              <h3 className="font-fredoka font-semibold text-base text-black dark:text-white mb-1">
                1–4 Cuts &amp; Canva Overlays
              </h3>

              <p className="text-xs text-black dark:text-stone-300 leading-relaxed font-sans">
                Choose single polaroids, double cutouts, triple stories, or 4-cut classic photostrips. Or upload your custom Canva transparent PNG frame.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 text-[11px] text-stone-600 dark:text-stone-400">
              High-resolution export with exact cropped dimensions | Canva feature currently in beta, coming soon
            </div>
          </div>

          {/* Pillar 3: Filters, Stickers & Stamps */}
          <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-xl bg-theme-soft/50 dark:bg-stone-800 border border-theme-primary/30 flex items-center justify-center text-theme-primary mb-3">
                <Sliders className="w-5 h-5" />
              </div>

              <h3 className="font-fredoka font-semibold text-base text-black dark:text-white mb-1">
                Filters, Stickers &amp; Stamps
              </h3>

              <p className="text-xs text-black dark:text-stone-300 leading-relaxed font-sans">
                Apply studio color grading, auto-snapping photo crops, custom transparent PNG stickers with resizers, and vintage photobooth date stamps.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 text-[11px] text-stone-600 dark:text-stone-400">
              Interactive drag &amp; drop canvas editor
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};