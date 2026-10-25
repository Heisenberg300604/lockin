import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS ignores SVG touch icons, so the padlock from app/icon.svg is rasterised
// at build time. iOS rounds the corners itself; the square stays full-bleed.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f0e8" }}>
        <svg width="120" height="120" viewBox="0 0 64 64" fill="none">
          <rect x="16" y="27" width="32" height="25" rx="5" fill="#FCFAF6" stroke="#28221E" strokeWidth="4" />
          <path d="M23 27V20C23 8 41 8 41 20V27" stroke="#28221E" strokeWidth="4" strokeLinecap="round" />
          <path d="M32 35C34.2091 35 36 36.7909 36 39C36 40.4653 35.2127 41.7468 34 42.4381V46H30V42.4381C28.7873 41.7468 28 40.4653 28 39C28 36.7909 29.7909 35 32 35Z" fill="#28221E" />
        </svg>
      </div>
    ),
    size,
  );
}
