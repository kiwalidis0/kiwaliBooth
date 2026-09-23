import React, { useState } from 'react';
import { BoothProvider } from './context/BoothContext';
import { useBooth } from './context/useBooth';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingScreen } from './components/LandingScreen';
import { LayoutSelectScreen } from './components/LayoutSelectScreen';
import { CaptureScreen } from './components/CaptureScreen';
import { ReviewScreen } from './components/ReviewScreen';
import { EditorScreen } from './components/EditorScreen';
import { DownloadScreen } from './components/DownloadScreen';
import { PrivacyModal } from './components/PrivacyModal';

interface MainContentProps {
  onOpenPrivacy: () => void;
}

const MainContent: React.FC<MainContentProps> = ({ onOpenPrivacy }) => {
  const { step } = useBooth();

  return (
    <main className="flex-1 flex flex-col justify-start">
      {step === 'landing' && <LandingScreen onOpenPrivacy={onOpenPrivacy} />}
      {step === 'layout' && <LayoutSelectScreen />}
      {step === 'capture' && <CaptureScreen />}
      {step === 'review' && <ReviewScreen />}
      {step === 'editor' && <EditorScreen />}
      {step === 'download' && <DownloadScreen />}
    </main>
  );
};

const AppLayout: React.FC = () => {
  const { step } = useBooth();
  const [isPrivacyOpen, setIsPrivacyOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen flex flex-col bg-white text-kiwali-ink font-sans antialiased selection:bg-kiwali-soft-pink selection:text-kiwali-coral">
      <Navbar />
      <MainContent onOpenPrivacy={() => setIsPrivacyOpen(true)} />

      {/* Hide footer completely when not on the landing page */}
      {step === 'landing' && (
        <Footer onOpenPrivacy={() => setIsPrivacyOpen(true)} />
      )}

      {/* Privacy Policy Modal */}
      <PrivacyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BoothProvider>
      <AppLayout />
    </BoothProvider>
  );
};

export default App;
