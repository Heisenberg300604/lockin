import type { MetadataRoute } from "next";
import { PRODUCT, SITE_NAME, TAGLINE } from "@/lib/seo/site";

// display "browser" describes the site without making it installable: turning
// LockIn into an installable PWA ("standalone") is a product decision, not SEO.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — ${TAGLINE}`,
    short_name: SITE_NAME,
    description: PRODUCT.summary,
    start_url: "/",
    display: "browser",
    background_color: "#f5f0e8",
    theme_color: "#f5f0e8",
    lang: "en",
    categories: ["lifestyle", "productivity", "health"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
