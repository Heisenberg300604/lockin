import type { Metadata } from "next";

// The one place the public origin is defined. Moving to a custom domain is a
// change to NEXT_PUBLIC_SITE_URL (or this fallback); canonicals, the sitemap,
// robots.txt, Open Graph URLs, JSON-LD and llms.txt all derive from it.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://lockin-web-app.vercel.app").replace(/\/$/, "");

export const SITE_NAME = "LockIn";
export const TAGLINE = "Keep promises to yourself";
export const LOCALE = "en_US";

// Facts used by metadata, JSON-LD and llms.txt. Every claim here must match the
// shipped product (frontend builder + API validation); nothing aspirational.
export const PRODUCT = {
  summary:
    "LockIn is a habit tracker for time-boxed commitments: build a habit or quit one, check in honestly each day, and unlock a reward you chose at the finish line.",
  audience:
    "LockIn is for people who want a finish line rather than an endless streak: anyone running a 7, 30, 45 or 90-day challenge to build a routine (like daily yoga or working out three times a week) or to quit a pattern (like fast food or late-night scrolling).",
  features: [
    "Two commitment types: build a habit or quit a habit",
    "Guided six-step setup: path, target, timeline, cadence, reward, review",
    "Timelines of 7, 30, 45 or 90 days, or any custom length up to 365 days",
    "Cadence for build habits: every day, or a weekly target such as three times a week",
    "Quit habits are tracked every day; one slip is recorded and ends the commitment",
    "Daily kept/broken check-ins with a calendar, and backfill for the previous two days",
    "A reward you choose up front, waiting for you at the finish line",
    "Pause and resume a commitment; the end date moves back by the paused days",
    "Private account: sign-in is handled by Clerk and LockIn never receives your password",
  ],
} as const;

// lastModified is maintained by hand so the sitemap only changes when the page
// content does — a build timestamp would claim every page changed on every deploy.
export const PUBLIC_PAGES = [
  { path: "/", lastModified: "2026-10-26" },
  { path: "/about", lastModified: "2026-10-26" },
] as const;

export const absoluteUrl = (path = "/") => new URL(path, `${SITE_URL}/`).toString();

// Pages assign `openGraph` wholesale (Next shallow-merges metadata per key), so
// every indexable page goes through this helper to keep the tags complete.
export function pageMetadata({ title, description, path }: { title: string; description: string; path: string }): Metadata {
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", siteName: SITE_NAME, locale: LOCALE, url: path, title, description },
    twitter: { card: "summary_large_image", title, description },
  };
}
