import { useState } from 'react';
import IntroPage from './pages/IntroPage';
import ModeSelectionPage from './pages/ModeSelectionPage';
import ImageConverterPage from './pages/ImageConverterPage';
import PenConverterPage from './pages/PenConverterPage';
import HistoryPage from './pages/HistoryPage';
import "./styles/global.css";

type AppState = 'intro' | 'modeSelection' | 'converter' | 'pen' | 'history';

interface HistoryData {
  image: string;
  text: string;
}

export default function App() {
  const [currentState, setCurrentState] = useState<AppState>('intro');
  const [historyData, setHistoryData] = useState<HistoryData | null>(null);

  const handleIntroComplete = () => {
    setCurrentState('modeSelection');
  };

  const handleModeSelect = (mode: 'pen' | 'image' | 'history') => {
    if (mode === 'image') {
      setHistoryData(null);
      setCurrentState('converter');
    } else if (mode === 'history') {
      setCurrentState('history');
    } else if (mode === 'pen') {
      setCurrentState('pen');
    }
  };

  const handleBackToModes = () => {
    setHistoryData(null);
    setCurrentState('modeSelection');
  };

  const handleLoadFromHistory = (image: string, text: string) => {
    setHistoryData({ image, text });
    setCurrentState('converter'); // Can be opened in the standard converter
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
        <ImageConverterPage
          onBack={handleBackToModes}
          initialImage={historyData?.image ?? null}
          initialText={historyData?.text ?? null}
        />
      )}

      {currentState === 'pen' && (
        <PenConverterPage onBack={handleBackToModes} />
      )}

      {currentState === 'history' && (
        <HistoryPage
          onBack={handleBackToModes}
          onLoadEntry={handleLoadFromHistory}
        />
      )}
    </>
  );
}
