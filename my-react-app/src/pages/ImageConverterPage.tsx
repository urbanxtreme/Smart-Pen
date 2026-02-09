import { useState, useRef } from 'react';
import '../styles/imageConverter.css';

interface ImageConverterPageProps {
    onBack: () => void;
}

export default function ImageConverterPage({ onBack }: ImageConverterPageProps) {
    const [image, setImage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [output, setOutput] = useState<string>('');
    const [isDragOver, setIsDragOver] = useState(false);
    const [hasConverted, setHasConverted] = useState(false);
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

    const handleConvert = () => {
        if (!image) return;

        setIsProcessing(true);
        setHasConverted(false); // Reset to show loading

        // Simulate AI processing delay
        setTimeout(() => {
            const randomTexts = [
                "The quick brown fox jumps over the lazy dog. Programming is the art of telling another human what one wants the computer to do.",
                "To be, or not to be, that is the question: Whether 'tis nobler in the mind to suffer the slings and arrows of outrageous fortune, or to take arms against a sea of troubles.",
                "Machine learning is a field of inquiry devoted to understanding and building methods that 'learn', that is, methods that leverage data to improve performance on some set of tasks.",
                "React is a library. It lets you put components together, but it doesn't prescribe how to do routing and data fetching. To build a whole app with React, we recommend a full-stack React framework like Next.js or Remix."
            ];

            const randomText = randomTexts[Math.floor(Math.random() * randomTexts.length)];
            setOutput(randomText);
            setIsProcessing(false);
            setHasConverted(true);
        }, 2000);
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
