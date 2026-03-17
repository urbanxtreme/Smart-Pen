import { useState, useRef } from 'react';
import '../styles/imageConverter.css';

interface ImageConverterPageProps {
    onBack: () => void;
    initialImage?: string | null;
    initialText?: string | null;
}

export default function ImageConverterPage({ onBack, initialImage, initialText }: ImageConverterPageProps) {
    const [image, setImage] = useState<string | null>(initialImage ?? null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [output, setOutput] = useState<string>(initialText ?? '');
    const [isDragOver, setIsDragOver] = useState(false);
    const [hasConverted, setHasConverted] = useState(!!initialText);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (file: File) => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setImage(e.target?.result as string);
                setHasConverted(false);
                setOutput('');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleConvert = async () => {
        if (!image) return;

        setIsProcessing(true);
        setHasConverted(false);

        try {
            const response = await fetch('/api/ocr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to process image');
            }

            setOutput(data.text);
            setHasConverted(true);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Something went wrong';
            setOutput(`Error: ${message}`);
            setHasConverted(true);
        } finally {
            setIsProcessing(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(output);
        // Could add toast notification here
    };

    const downloadText = () => {
        const element = document.createElement("a");
        const file = new Blob([output], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = "smart-pen-output.txt";
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    return (
        <div className="converter-container">
            <header className="converter-header">
                <button className="back-button" onClick={onBack} aria-label="Go back">
                    ←
                </button>
                <h1>Image to Text Converter</h1>
            </header>

            <div className="converter-content">
                {/* Upload Panel */}
                <div className="upload-panel">
                    <div className="panel-title">
                        <span>📤</span> Upload Image
                    </div>

                    {!image ? (
                        <div
                            className={`upload-zone ${isDragOver ? 'drag-over' : ''}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                accept="image/*"
                            />
                            <span className="upload-icon">📁</span>
                            <h3>Drag & Drop or Click to Upload</h3>
                            <p>Supports JPG, PNG, WEBP (Max 10MB)</p>
                            <button className="browse-btn">Browse Files</button>
                        </div>
                    ) : (
                        <div className="image-preview">
                            <button className="remove-image" onClick={() => setImage(null)}>×</button>
                            <img src={image} alt="Uploaded handwritten note" />
                        </div>
                    )}

                    <button
                        className={`convert-btn ${isProcessing ? 'processing' : ''}`}
                        onClick={handleConvert}
                        disabled={!image || isProcessing}
                    >
                        {isProcessing ? (
                            <>
                                <div className="processing-spinner"></div>
                                Processing...
                            </>
                        ) : (
                            <>⚡ Convert to Text</>
                        )}
                    </button>
                </div>

                {/* Output Panel */}
                <div className="output-panel">
                    <div className="panel-title">
                        <span>📝</span> Extracted Text
                    </div>

                    <div className="output-area">
                        {!hasConverted && !isProcessing ? (
                            <div className="output-placeholder">
                                <span>📄</span>
                                <p>Upload an image and click convert to see the results here.</p>
                            </div>
                        ) : isProcessing ? (
                            <div className="skeleton-container">
                                <div className="skeleton skeleton-line" style={{ width: '90%' }}></div>
                                <div className="skeleton skeleton-line" style={{ width: '95%' }}></div>
                                <div className="skeleton skeleton-line" style={{ width: '85%' }}></div>
                                <div className="skeleton skeleton-line" style={{ width: '90%' }}></div>
                                <div className="skeleton skeleton-line" style={{ width: '60%' }}></div>
                            </div>
                        ) : (
                            <>
                                <textarea
                                    className="output-text"
                                    value={output}
                                    onChange={(e) => setOutput(e.target.value)}
                                    placeholder="Extracted text will appear here..."
                                />
                                <div className="output-actions">
                                    <button className="action-btn" onClick={copyToClipboard}>
                                        📋 Copy Text
                                    </button>
                                    <button className="action-btn" onClick={downloadText}>
                                        💾 Save as .txt
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
