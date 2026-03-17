import { useState, useEffect } from 'react';
import '../styles/history.css';

interface HistoryEntry {
    id: string;
    timestamp: string;
    thumbnail: string;
    text: string;
    raw_text: string;
}

interface HistoryPageProps {
    onBack: () => void;
    onLoadEntry: (image: string, text: string) => void;
}

export default function HistoryPage({ onBack, onLoadEntry }: HistoryPageProps) {
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const response = await fetch('/api/history');
            const data = await response.json();
            setHistory(data);
        } catch (err) {
            console.error('Failed to load history:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await fetch(`/api/history/${id}`, { method: 'DELETE' });
            setHistory(history.filter(entry => entry.id !== id));
        } catch (err) {
            console.error('Failed to delete:', err);
        }
    };

    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const truncateText = (text: string, maxLen = 80) => {
        if (text.length <= maxLen) return text;
        return text.substring(0, maxLen) + '...';
    };

    return (
        <div className="history-container">
            <header className="history-header">
                <button className="back-button" onClick={onBack} aria-label="Go back">
                    ←
                </button>
                <h1>Conversion History</h1>
                <span className="history-count">{history.length} items</span>
            </header>

            <div className="history-content">
                {isLoading ? (
                    <div className="history-loading">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="history-skeleton">
                                <div className="skeleton skeleton-thumb"></div>
                                <div className="skeleton-details">
                                    <div className="skeleton skeleton-line" style={{ width: '60%' }}></div>
                                    <div className="skeleton skeleton-line" style={{ width: '90%' }}></div>
                                    <div className="skeleton skeleton-line" style={{ width: '40%' }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : history.length === 0 ? (
                    <div className="history-empty">
                        <span className="empty-icon">📜</span>
                        <h2>No conversions yet</h2>
                        <p>Convert some handwritten images and they'll appear here automatically.</p>
                        <button className="back-to-converter" onClick={onBack}>
                            Start Converting
                        </button>
                    </div>
                ) : (
                    <div className="history-grid">
                        {history.map((entry, index) => (
                            <div
                                key={entry.id}
                                className="history-card"
                                onClick={() => onLoadEntry(entry.thumbnail, entry.text)}
                                style={{ animationDelay: `${index * 0.08}s` }}
                            >
                                <div className="card-thumbnail">
                                    <img src={entry.thumbnail} alt="Converted image" />
                                </div>
                                <div className="card-details">
                                    <span className="card-date">{formatDate(entry.timestamp)}</span>
                                    <p className="card-text-preview">{truncateText(entry.text)}</p>
                                </div>
                                <button
                                    className="card-delete"
                                    onClick={(e) => handleDelete(entry.id, e)}
                                    aria-label="Delete conversion"
                                >
                                    🗑️
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
