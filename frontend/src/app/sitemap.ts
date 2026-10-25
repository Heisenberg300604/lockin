import type { MetadataRoute } from "next";
import { PUBLIC_PAGES, absoluteUrl } from "@/lib/seo/site";

// Only canonical, indexable pages. Google ignores priority and changefreq, so
// they are omitted; lastModified comes from the hand-maintained PUBLIC_PAGES.
export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PAGES.map((page) => ({ url: absoluteUrl(page.path), lastModified: page.lastModified }));
}
