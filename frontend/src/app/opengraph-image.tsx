import { ImageResponse } from "next/og";
import { SITE_NAME, TAGLINE } from "@/lib/seo/site";

export const alt = `${SITE_NAME} — ${TAGLINE}. A habit tracker for building and quitting habits with a reward at the finish line.`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Drawn from the brand tokens in globals.css (paper, ink, mint, hard shadow) and
// the padlock from app/icon.svg, so the share card needs no binary asset.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f0e8", color: "#28221e" }}>
        <div style={{ width: 1040, height: 470, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "56px 64px", background: "#fcfaf6", border: "2px solid #28221e", borderRadius: 40, boxShadow: "14px 14px 0 #28221e" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
            <svg width="54" height="70" viewBox="0 0 64 78" fill="none">
              <path d="M21 36V23a11 11 0 0 1 22 0v13" stroke="#28221e" strokeWidth="5" strokeLinecap="round" />
              <rect x="10" y="34" width="44" height="34" rx="4" fill="#28221e" />
              <circle cx="32" cy="47" r="4" fill="#63eabd" />
              <path d="M32 50.5v6" stroke="#63eabd" strokeWidth="3.4" strokeLinecap="round" />
            </svg>
            <div style={{ fontSize: 64, fontWeight: 800, letterSpacing: -3 }}>{SITE_NAME}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ fontSize: 76, fontWeight: 800, letterSpacing: -4, lineHeight: 1 }}>{`${TAGLINE}.`}</div>
            <div style={{ fontSize: 32, color: "#5d544c", lineHeight: 1.3 }}>Build a habit or quit one. Check in daily. Unlock your reward at the finish line.</div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
