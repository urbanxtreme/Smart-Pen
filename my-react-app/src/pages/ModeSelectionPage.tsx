import '../styles/modeSelection.css';

interface ModeSelectionPageProps {
    onSelectMode: (mode: 'pen' | 'image' | 'history') => void;
}

export default function ModeSelectionPage({ onSelectMode }: ModeSelectionPageProps) {
    return (
        <div className="mode-selection-container">
            <header className="mode-header">
                <h1>Select Input Method</h1>
                <p>Choose how you want to digitize your handwriting</p>
            </header>

            <div className="mode-cards">
                {/* Pen Mode - Coming Soon */}
                <div className="mode-card disabled">
                    <div className="coming-soon-badge">Coming Soon</div>
                    <span className="mode-card-icon">🖊️</span>
                    <h2>Convert from Pen</h2>
                    <p>Connect your Smart Pen device to digitize notes in real-time as you write.</p>
                </div>

                {/* Image Mode - Active */}
                <div
                    className="mode-card active"
                    onClick={() => onSelectMode('image')}
                >
                    <span className="mode-card-icon">📷</span>
                    <h2>Convert from Image</h2>
                    <p>Upload a photo of your handwritten notes for instant AI transcription.</p>

                    <div className="card-arrow">
                        Start Converting <span>→</span>
                    </div>
                </div>

                {/* History Mode */}
                <div
                    className="mode-card active"
                    onClick={() => onSelectMode('history')}
                >
                    <span className="mode-card-icon">📜</span>
                    <h2>Conversion History</h2>
                    <p>View, edit, and manage your past handwriting conversions.</p>

                    <div className="card-arrow">
                        View History <span>→</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

