import { useState, useEffect, useRef } from 'react';
import '../styles/penConverter.css';

interface PenConverterPageProps {
    onBack: () => void;
}

type ConnectionState = 'scanning' | 'connecting' | 'connected';

export default function PenConverterPage({ onBack }: PenConverterPageProps) {
    const [connState, setConnState] = useState<ConnectionState>('scanning');
    const [isProcessing, setIsProcessing] = useState(false);
    const [output, setOutput] = useState<string>('');
    const [hasExtracted, setHasExtracted] = useState(false);

    // Canvas refs and state
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    // Simulate Bluetooth connection flow
    useEffect(() => {
        const scanTimer = setTimeout(() => setConnState('connecting'), 2500);
        const connectTimer = setTimeout(() => setConnState('connected'), 4500);

        return () => {
            clearTimeout(scanTimer);
            clearTimeout(connectTimer);
        };
    }, []);

    // Set up canvas when connected
    useEffect(() => {
        if (connState === 'connected' && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                // Set actual internal canvas resolution
                canvas.width = canvas.offsetWidth;
                canvas.height = canvas.offsetHeight;
                
                // Set default styles
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.lineWidth = 3;
                ctx.strokeStyle = '#ffffff'; // White ink on dark canvas
            }
        }
    }, [connState]);

    // Drawing Handlers
    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        draw(e);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            ctx?.beginPath(); // Start a new path so next click doesn't connect to old point
        }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Get correct coordinates handles both mouse and touch
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;

        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        const x = clientX - rect.left;
        const y = clientY - rect.top;

        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const clearCanvas = () => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        setOutput('');
        setHasExtracted(false);
    };

    // Extract Text Handler
    const handleExtractText = async () => {
        if (!canvasRef.current) return;

        // Create a temporary canvas with a white background because our drawings are white,
        // and standard OpenCV/Tesseract prefers black text on white backgrounds.
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvasRef.current.width;
        tempCanvas.height = canvasRef.current.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        if (tempCtx) {
            // Fill white background
            tempCtx.fillStyle = '#ffffff';
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            
            // Draw original canvas (white strokes)
            // But we need to invert them to black strokes for OCR
            const origCtx = canvasRef.current.getContext('2d');
            if (origCtx) {
                const imgData = origCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
                const data = imgData.data;
                
                // Draw black strokes on the white background wherever the original canvas is not transparent
                for (let i = 0; i < data.length; i += 4) {
                    if (data[i + 3] > 0) { // If pixel is not fully transparent
                        tempCtx.fillStyle = '#000000';
                        const x = (i / 4) % tempCanvas.width;
                        const y = Math.floor((i / 4) / tempCanvas.width);
                        tempCtx.fillRect(x, y, 1, 1);
                    }
                }
            }
        }

        // Get base64 image data
        const imageDataUrl = tempCanvas.toDataURL('image/png');

        setIsProcessing(true);
        setHasExtracted(false);

        try {
            const response = await fetch('/api/ocr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: imageDataUrl }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to process handwriting');
            }

            setOutput(data.text);
            setHasExtracted(true);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Something went wrong';
            setOutput(`Error: ${message}`);
            setHasExtracted(true);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="pen-container">
            <header className="pen-header">
                <button className="back-button" onClick={onBack} aria-label="Go back">
                    ←
                </button>
                <h1>Live Smart Pen</h1>
            </header>

            {/* Connection Overlay */}
            {connState !== 'connected' && (
                <div className="connection-overlay">
                    <div className="connection-card glass">
                        <div className="connection-icon">
                            {connState === 'scanning' ? '📡' : '🔗'}
                        </div>
                        <h2>{connState === 'scanning' ? 'Scanning for devices...' : 'Connecting...'}</h2>
                        <p>
                            {connState === 'scanning' 
                                ? 'Make sure your Smart Pen is turned on and nearby.' 
                                : 'Pairing with Smart-Pen v2...'}
                        </p>
                        <div className="loading-bar">
                            <div className="loading-progress" style={{ width: connState === 'scanning' ? '40%' : '85%' }}></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Application Area (Only visible when connected) */}
            {connState === 'connected' && (
                <div className="pen-content fade-in">
                    
                    {/* Hardware Dashboard */}
                    <div className="dashboard-panel glass">
                        <div className="dashboard-header">
                            <div className="device-status">
                                <span className="status-dot online"></span>
                                Smart-Pen v2 Connected
                            </div>
                            <div className="manufacturer">SmartPen Inc.</div>
                        </div>
                        
                        <div className="stats-grid">
                            <div className="stat-card">
                                <span className="stat-icon">🔋</span>
                                <div>
                                    <div className="stat-label">Battery</div>
                                    <div className="stat-value">85%</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <span className="stat-icon">💾</span>
                                <div>
                                    <div className="stat-label">Storage</div>
                                    <div className="stat-value">40% Full</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <span className="stat-icon">📶</span>
                                <div>
                                    <div className="stat-label">Signal</div>
                                    <div className="stat-value">Excellent</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="workspace-grid">
                        {/* Drawing Canvas */}
                        <div className="canvas-panel glass">
                            <div className="panel-title">
                                <span>✍️</span> Live Input
                            </div>
                            
                            <div className="canvas-wrapper">
                                <canvas
                                    ref={canvasRef}
                                    onMouseDown={startDrawing}
                                    onMouseUp={stopDrawing}
                                    onMouseOut={stopDrawing}
                                    onMouseMove={draw}
                                    onTouchStart={startDrawing}
                                    onTouchEnd={stopDrawing}
                                    onTouchMove={draw}
                                    className="drawing-canvas"
                                />
                                <div className="canvas-hint">Draw or write here using your mouse/touch to simulate the pen</div>
                            </div>

                            <div className="canvas-actions">
                                <button className="clear-btn" onClick={clearCanvas}>
                                    🗑️ Clear Canvas
                                </button>
                                <button 
                                    className={`extract-btn ${isProcessing ? 'processing' : ''}`}
                                    onClick={handleExtractText}
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? 'Processing...' : '⚡ Extract Text'}
                                </button>
                            </div>
                        </div>

                        {/* Extracted Text Panel */}
                        <div className="output-panel glass">
                            <div className="panel-title">
                                <span>📝</span> Extracted Text
                            </div>

                            <div className="output-area">
                                {!hasExtracted && !isProcessing ? (
                                    <div className="output-placeholder">
                                        <span>📄</span>
                                        <p>Write on the canvas and click extract to see the results.</p>
                                    </div>
                                ) : isProcessing ? (
                                    <div className="skeleton-container">
                                        <div className="skeleton skeleton-line" style={{ width: '90%' }}></div>
                                        <div className="skeleton skeleton-line" style={{ width: '95%' }}></div>
                                        <div className="skeleton skeleton-line" style={{ width: '60%' }}></div>
                                    </div>
                                ) : (
                                    <textarea
                                        className="output-text"
                                        value={output}
                                        onChange={(e) => setOutput(e.target.value)}
                                        placeholder="Extracted text will appear here..."
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
