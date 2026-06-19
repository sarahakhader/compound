import Link from "next/link"

export default function NotFound() {
  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "#000",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontFamily: "'Courier New', monospace",
      color: "rgba(237,228,216,0.6)",
      gap: 32,
    }}>
      <svg viewBox="0 0 200 200" width="80" height="80" style={{ opacity: 0.55 }}>
        <circle cx="100" cy="100" r="92"  fill="#3A1A08"/>
        <circle cx="100" cy="100" r="79"  fill="#8B3A1E"/>
        <circle cx="100" cy="100" r="64"  fill="#CC4A12"/>
        <circle cx="100" cy="100" r="50"  fill="#5C2510"/>
        <circle cx="100" cy="100" r="37"  fill="#3D2645"/>
        <circle cx="100" cy="100" r="23"  fill="#6ECECE"/>
        <circle cx="100" cy="100" r="9.5" fill="#050403"/>
      </svg>

      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 9, letterSpacing: "0.4em", color: "rgba(237,228,216,0.25)", marginBottom: 16 }}>
          404
        </div>
        <div style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: "clamp(2rem, 6vw, 4rem)",
          fontWeight: 300, letterSpacing: "0.14em",
          color: "rgba(237,228,216,0.85)", marginBottom: 12,
        }}>
          Page not found.
        </div>
        <div style={{ fontSize: 9, letterSpacing: "0.28em", color: "rgba(237,228,216,0.22)", marginBottom: 40 }}>
          THIS DISTRICT DOES NOT EXIST
        </div>
        <Link href="/" style={{
          display: "inline-block",
          fontFamily: "'Courier New', monospace",
          fontSize: 9, letterSpacing: "0.32em",
          color: "#B5CC45", textDecoration: "none",
          border: "1px solid rgba(181,204,69,0.28)",
          padding: "10px 28px",
          transition: "border-color 0.2s, color 0.2s",
        }}>
          RETURN HOME ↗
        </Link>
      </div>
    </div>
  )
}
