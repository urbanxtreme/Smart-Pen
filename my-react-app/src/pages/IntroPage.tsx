import { useEffect, useState } from 'react';
import '../styles/intro.css';

interface IntroPageProps {
    onComplete: () => void;
}

export default function IntroPage({ onComplete }: IntroPageProps) {
    const [isFadingOut, setIsFadingOut] = useState(false);

    useEffect(() => {
        // Start fade out after animation sequence (approx 3.5s)
        const fadeTimer = setTimeout(() => {
            setIsFadingOut(true);
        }, 3500);

        // Complete transition after fade out (approx 4.3s total)
        const completeTimer = setTimeout(() => {
            onComplete();
        }, 4300);

        return () => {
            clearTimeout(fadeTimer);
            clearTimeout(completeTimer);
        };
    }, [onComplete]);

    return (
        <div className={`intro-container ${isFadingOut ? 'fade-out' : ''}`}>
            <div className="intro-bg"></div>

            {/* Floating Particles */}
            <div className="particles">
                {[...Array(10)].map((_, i) => (
                    <div key={i} className="particle"></div>
                ))}
            </div>

            <div className="content-wrapper" style={{ zIndex: 2, textAlign: 'center' }}>
                <div className="pen-icon-container">
                    <div className="pen-icon">🖊️</div>
                </div>

                <h1 className="intro-title">
                    <span className="word">Smart</span> <span className="word">Pen</span>
                </h1>

                <p className="intro-subtitle">AI-Powered handwriting recognition</p>

                <div className="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        </div>
    );
}
