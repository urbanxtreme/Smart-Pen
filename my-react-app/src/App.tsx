import { useState } from 'react';
import IntroPage from './pages/IntroPage';
import ModeSelectionPage from './pages/ModeSelectionPage';
import ImageConverterPage from './pages/ImageConverterPage';
import "./styles/global.css";

type AppState = 'intro' | 'modeSelection' | 'converter';

export default function App() {
  const [currentState, setCurrentState] = useState<AppState>('intro');

  const handleIntroComplete = () => {
    setCurrentState('modeSelection');
  };

  const handleModeSelect = (mode: 'pen' | 'image') => {
    if (mode === 'image') {
      setCurrentState('converter');
    }
    // 'pen' mode doesn't navigate anywhere yet
  };

  const handleBackToModes = () => {
    setCurrentState('modeSelection');
  };

  return (
    <>
      {currentState === 'intro' && (
        <IntroPage onComplete={handleIntroComplete} />
      )}

      {currentState === 'modeSelection' && (
        <ModeSelectionPage onSelectMode={handleModeSelect} />
      )}

      {currentState === 'converter' && (
        <ImageConverterPage onBack={handleBackToModes} />
      )}
    </>
  );
}
