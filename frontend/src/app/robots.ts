import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo/site";

// Search and AI-answer crawlers named explicitly so allowing them is a recorded
// decision, not an accident of the wildcard. Tokens verified against each
// vendor's crawler docs on 2026-10-26 (sources in docs/seo/RESEARCH.md).
const AI_SEARCH_AND_ANSWER_BOTS = [
  "OAI-SearchBot", "ChatGPT-User",
  "Claude-SearchBot", "Claude-User",
  "PerplexityBot", "Perplexity-User",
  "DuckAssistBot", "meta-webindexer", "Amzn-SearchBot", "MistralAI-Index", "MistralAI-User",
];
// Model-training tokens. Allowed by default; disallowing them does not affect
// search or AI-answer visibility (Google-Extended does not affect Google Search).
const AI_TRAINING_BOTS = ["GPTBot", "ClaudeBot", "Google-Extended", "Applebot-Extended", "CCBot", "meta-externalagent", "Amazonbot", "MistralAI-Training"];

export default function robots(): MetadataRoute.Robots {
  // Vercel already sends X-Robots-Tag: noindex on preview URLs; this keeps
  // preview builds from advertising a crawlable site even if that changes.
  if (process.env.VERCEL_ENV === "preview") return { rules: { userAgent: "*", disallow: "/" } };

  // App screens are deliberately not disallowed: they carry a noindex meta tag,
  // which crawlers can only see if they are allowed to fetch the page.
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: AI_SEARCH_AND_ANSWER_BOTS, allow: "/" },
      { userAgent: AI_TRAINING_BOTS, allow: "/" },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
