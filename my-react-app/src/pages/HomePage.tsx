import "../styles/home.css";

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">Cosmic Explorer</h1>
          <p className="hero-subtitle">
            Explore NASA’s high-resolution space imagery like Google Maps.
            Zoom, discover, and annotate the universe together.
          </p>

          <div className="hero-buttons">
            <button className="primary-btn">Start Exploring</button>
            <button className="secondary-btn">Learn More</button>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features">
        <div className="features-grid">
          <div className="feature-card">
            <h3>🔭 Deep Zoom</h3>
            <p>Navigate multi-gigapixel NASA images smoothly.</p>
          </div>

          <div className="feature-card">
            <h3>✏️ Annotations</h3>
            <p>Mark and label galaxies, stars, and anomalies.</p>
          </div>

          <div className="feature-card">
            <h3>🤝 Community</h3>
            <p>Verify discoveries together with consensus.</p>
          </div>

          <div className="feature-card">
            <h3>🏆 Gamification</h3>
            <p>Earn badges for meaningful contributions.</p>
          </div>
        </div>
      </section>
    </>
  );
}
