export default function Navbar() {
  return (
    <nav style={{
      padding: "16px 32px",
      borderBottom: "1px solid #1e293b",
      background: "#020617",
      display: "flex",
      justifyContent: "space-between"
    }}>
      <strong>🌌 Cosmic Explorer</strong>
      <div style={{ display: "flex", gap: 20 }}>
        <span>Home</span>
        <span>Explore</span>
        <span>About</span>
      </div>
    </nav>
  );
}
