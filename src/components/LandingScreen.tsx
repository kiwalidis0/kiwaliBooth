import React, { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  Camera,
  ArrowRight,
  ShieldCheck,
  Layers,
  Sliders,
  Info
} from 'lucide-react';
import { useBooth } from '../context/useBooth';
import { MOCK_SELFIE_LIST } from '../utils/mockPhotos';

gsap.registerPlugin(useGSAP);

interface LandingScreenProps {
  onOpenPrivacy?: () => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ onOpenPrivacy }) => {
  const { setStep } = useBooth();
  const containerRef = useRef<HTMLDivElement>(null);

  const strip1Ref = useRef<HTMLDivElement>(null);
  const strip2Ref = useRef<HTMLDivElement>(null);
  const strip3Ref = useRef<HTMLDivElement>(null);
  const strip4Ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Gentle subtle floating motion across the 4 strips
      gsap.to(strip1Ref.current, {
        y: -10,
        rotation: -2,
        duration: 3.2,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      });

      gsap.to(strip2Ref.current, {
        y: 12,
        rotation: 3,
        duration: 3.6,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        delay: 0.2,
      });

      gsap.to(strip3Ref.current, {
        y: -12,
        rotation: -1,
        duration: 3.4,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        delay: 0.4,
      });

      gsap.to(strip4Ref.current, {
        y: 10,
        rotation: 2,
        duration: 3.8,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        delay: 0.6,
      });
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className="py-12 sm:py-16 px-4 max-w-6xl mx-auto flex flex-col items-center">
      {/* Hero Headline */}
      <div className="text-center max-w-2xl mb-8">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-fredoka font-semibold text-stone-900 tracking-tight leading-[1.15] mb-4">
          Capture memories. <br />
          <span className="text-kiwali-coral">Print your cutouts.</span>
        </h1>
        <p className="text-base sm:text-lg text-stone-600 font-sans max-w-xl mx-auto leading-relaxed">
          Authentic photostrips right in your browser. Webcam countdowns, multi-shot strips, studio color grading, and instant client-side downloads.
        </p>

        {/* Start Button */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => setStep('layout')}
            className="soft-btn-coral text-base px-8 py-3.5 group flex items-center gap-2.5"
          >
            <Camera className="w-5 h-5 group-hover:scale-105 transition-transform" />
            <span>Enter Photobooth</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Floating Sample Strips: Showcasing All 4 Layouts */}
      <div className="relative w-full max-w-5xl py-8 my-4 flex items-center justify-center overflow-x-auto sm:overflow-visible">
        <div className="flex items-center justify-center gap-4 sm:gap-6 min-w-max px-4">
          {/* Strip 1: 1-Cut Polaroid */}
          <div
            ref={strip1Ref}
            className="w-36 sm:w-44 bg-white rounded-xl p-2.5 border border-stone-200 transition-all -rotate-3"
          >
            <div className="w-full aspect-[4/5] rounded-lg overflow-hidden bg-stone-100 mb-2 border border-stone-100">
              <img src={MOCK_SELFIE_LIST[0]} alt="1-cut polaroid" className="w-full h-full object-cover" />
            </div>
            <div className="text-center">
              <div className="font-fredoka font-semibold text-xs text-stone-800">Polaroid Vibe</div>
              <div className="font-mono text-[9px] text-stone-400">1 Single Cut</div>
            </div>
          </div>

          {/* Strip 2: 2-Cut Double */}
          <div
            ref={strip2Ref}
            className="w-36 sm:w-44 bg-white rounded-xl p-2.5 border border-stone-200 transition-all rotate-2"
          >
            <div className="space-y-1.5 mb-2">
              <div className="w-full aspect-[4/3] rounded-md overflow-hidden bg-stone-100 border border-stone-100">
                <img src={MOCK_SELFIE_LIST[1]} alt="2-cut double #1" className="w-full h-full object-cover" />
              </div>
              <div className="w-full aspect-[4/3] rounded-md overflow-hidden bg-stone-100 border border-stone-100">
                <img src={MOCK_SELFIE_LIST[2]} alt="2-cut double #2" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="text-center">
              <div className="font-fredoka font-semibold text-xs text-stone-800">Double Take</div>
              <div className="font-mono text-[9px] text-stone-400">2 Vertical Cuts</div>
            </div>
          </div>

          {/* Strip 3: 3-Cut Triple */}
          <div
            ref={strip3Ref}
            className="w-36 sm:w-44 bg-white rounded-xl p-2.5 border border-stone-200 transition-all -rotate-2"
          >
            <div className="space-y-1.5 mb-2">
              <div className="w-full aspect-[4/3] rounded-md overflow-hidden bg-stone-100 border border-stone-100">
                <img src={MOCK_SELFIE_LIST[0]} alt="3-cut triple #1" className="w-full h-full object-cover" />
              </div>
              <div className="w-full aspect-[4/3] rounded-md overflow-hidden bg-stone-100 border border-stone-100">
                <img src={MOCK_SELFIE_LIST[2]} alt="3-cut triple #2" className="w-full h-full object-cover" />
              </div>
              <div className="w-full aspect-[4/3] rounded-md overflow-hidden bg-stone-100 border border-stone-100">
                <img src={MOCK_SELFIE_LIST[3]} alt="3-cut triple #3" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="text-center">
              <div className="font-fredoka font-semibold text-xs text-stone-800">Triple Story</div>
              <div className="font-mono text-[9px] text-stone-400">3 Vertical Cuts</div>
            </div>
          </div>

          {/* Strip 4: 4-Cut Classic Strip */}
          <div
            ref={strip4Ref}
            className="w-36 sm:w-44 bg-white rounded-xl p-2.5 border border-stone-200 transition-all rotate-3"
          >
            <div className="space-y-1.5 mb-2">
              {MOCK_SELFIE_LIST.map((url, idx) => (
                <div key={idx} className="w-full aspect-[4/3] rounded-md overflow-hidden bg-stone-100 border border-stone-100">
                  <img src={url} alt={`4-cut classic #${idx + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <div className="text-center">
              <div className="font-fredoka font-semibold text-xs text-stone-800">Classic Strip</div>
              <div className="font-mono text-[9px] text-stone-400">4 Iconic Cuts</div>
            </div>
          </div>
        </div>
      </div>

      {/* Emphasized Reassurance Section: 3 Pillars */}
      <div className="mt-12 w-full max-w-4xl">
        <div className="text-center mb-6">
          <h2 className="text-xl sm:text-2xl font-fredoka font-semibold text-stone-900">
            Engineered for Privacy &amp; Creativity
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Built completely client-side in your browser memory
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pillar 1: 100% In-Browser Memory */}
          <div className="p-5 rounded-2xl bg-white border border-stone-200 flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-fredoka font-semibold text-base text-stone-900 mb-1">
                100% In-Browser Memory
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Zero cloud uploads, zero external databases. All webcam frames and canvas exports live only in temporary device memory.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100">
              <button
                onClick={onOpenPrivacy}
                className="text-[11px] text-emerald-700 font-medium hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <Info className="w-3 h-3" />
                <span>Read Privacy Architecture</span>
              </button>
            </div>
          </div>

          {/* Pillar 2: 1-4 Cuts & Overlays */}
          <div className="p-5 rounded-2xl bg-white border border-stone-200 flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-xl bg-kiwali-soft-pink border border-kiwali-coral/30 flex items-center justify-center text-kiwali-coral mb-3">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-fredoka font-semibold text-base text-stone-900 mb-1">
                1–4 Cuts &amp; Canva Overlays
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Choose single polaroids, double cutouts, triple stories, or 4-cut classic photostrips. Or upload your custom Canva transparent PNG frame.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] text-stone-400">
              High-resolution export with exact cropped dimensions
            </div>
          </div>

          {/* Pillar 3: Filters, Stickers & Stamps */}
          <div className="p-5 rounded-2xl bg-white border border-stone-200 flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 mb-3">
                <Sliders className="w-5 h-5" />
              </div>
              <h3 className="font-fredoka font-semibold text-base text-stone-900 mb-1">
                Filters, Stickers &amp; Stamps
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Apply studio color grading, auto-snapping photo crops, custom transparent PNG stickers with resizers, and vintage photobooth date stamps.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] text-stone-400">
              Interactive drag &amp; drop canvas editor
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
