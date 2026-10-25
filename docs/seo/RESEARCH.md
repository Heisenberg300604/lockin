# SEO / GEO research notes (checked 2026-10-26)

Primary sources were fetched on the date above. "Secondary" marks claims known only from trade press. Uncertain items are flagged.

## 1. Google Search fundamentals

- **Core Web Vitals:** good means LCP ≤ 2.5 s, INP ≤ 200 ms and CLS ≤ 0.1, measured at the 75th percentile of page loads, mobile and desktop separately. INP replaced FID in March 2024. — https://web.dev/articles/vitals
- **JavaScript SEO:** Google crawls, then renders with headless Chromium, then indexes. Pages that don't return 200 may skip rendering. Soft-404 fixes for SPAs: redirect to a URL that returns a real 404, or add `noindex` on error views. Once Google sees `noindex` it may skip rendering, so never ship `noindex` in the initial HTML of a page you want indexed. — https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics (updated 2026-03-04), …/fix-search-javascript
- **noindex vs robots.txt:** `noindex` only works if the URL is **not** blocked in robots.txt, and a blocked URL can still be indexed without content. Pick one; for keeping pages out of the index, use `noindex`. — …/crawling-indexing/block-indexing, …/robots-meta-tag
- **Canonicals:** use absolute URLs and a self-referencing canonical in `<head>`, put it in the server HTML, and don't combine it with `noindex`. — …/consolidate-duplicate-urls
- **Sitemaps:** absolute URLs. `<lastmod>` is used only if it is "consistently and verifiably accurate". **Google ignores `priority` and `changefreq`.** — …/sitemaps/build-sitemap
- **Titles and descriptions:** Google sets no length limit; it truncates to device width. They should be unique and descriptive, without keyword lists. — …/appearance/title-link (2025-12-10), …/appearance/snippet (2026-04-20)
- **Meta keywords:** "not used by Google Search". **hreflang:** only for multi-language or multi-region sites (an inference; not needed here). — …/special-tags, …/localized-versions
- **Spam and helpful content:** no hidden text, doorway pages or scaled content; write people-first, and trust is central to E-E-A-T. — …/essentials/spam-policies (2026-08-28), …/fundamentals/creating-helpful-content (2026-10-05)

## 2. Structured data

- **SoftwareApplication rich result** requires `name`, `offers.price` and `aggregateRating` **or** `review`. LockIn has no real ratings, so it is **not eligible**; the markup is still valid and helps entity understanding. Valid `applicationCategory` values include `LifestyleApplication` and `HealthApplication`. — …/structured-data/software-app (2026-09-08)
- **Site name:** `WebSite` with `name`, `url` and optional `alternateName` on the home page. Google also reads `og:site_name`, `<title>` and headings. Validate with the Schema Markup Validator; the Rich Results Test doesn't cover site names. — …/appearance/site-names (2025-12-10)
- **Organization:** no required properties; logo at least 112×112 px. — …/structured-data/organization
- **FAQ rich results are gone:** restricted to government and health sites in 2023, **deprecated 2026-05-07, docs removed 2026-06-15**. HowTo rich results were removed in 2023. — https://developers.google.com/search/updates. **Decision:** keep the visible FAQ and skip `FAQPage` markup.

## 3. Search demand and competitors

These are live Google autocomplete suggestions, not volumes.
- "quit habit tracker" → app / online / free / break habit tracker.
- "habit tracker reward" → reward system / reward ideas / reward app.
- "30 day challenge tracker" → app / printable / pdf.
- "how to reward yourself for" → good habits / meeting goals / not drinking.
- "habitica alternative" → reddit / free.
- "lockin app" → another product's referral and promo codes. **Branded collision is severe.**

Sources: suggestqueries.google.com plus roundup and app-store pages. Main ones:
- https://zapier.com/blog/best-habit-tracker-app
- https://clickup.com/blog/best-habit-tracker-app/
- https://reclaim.ai/blog/habit-tracker-apps
- https://peerpush.com/alternatives/stickk
- https://alternativeto.net/software/forfeit
- https://blog.beeminder.com/competitors
- https://feedback.habitify.me/changelog/new-tiered-pricing
- Name collisions: https://www.cbc.ca/news/canada/hamilton/lockin-app-scrolling-1.7407813, https://chromewebstore.google.com/detail/nnpdjnifaeopkgdangajpaiemoofmbgl, https://www.producthunt.com/@lockinapp

**Ranking for "best habit tracker":** Zapier, ClickUp, Reclaim, TimeCamp, Jotform. **Realistic places to get listed:** AlternativeTo (under stickK, Habitica, Quitzilla), Product Hunt, PeerPush. Reddit communities (r/getdisciplined, r/productivity, r/sugarfree) are an inferred citation source for AI answers.

## 4. AI crawlers (robots.txt tokens)

| Vendor | Search / answer | User-triggered fetch | Training |
| --- | --- | --- | --- |
| OpenAI | `OAI-SearchBot` | `ChatGPT-User` (robots "may not apply") | `GPTBot` |
| Anthropic | `Claude-SearchBot` | `Claude-User` | `ClaudeBot` |
| Perplexity | `PerplexityBot` | `Perplexity-User` ("generally ignores") | — |
| Google | `Googlebot` (includes AI Overviews and AI Mode) | — | `Google-Extended` (Gemini training/grounding; **no effect on Search**) |
| Apple | `Applebot` | — | `Applebot-Extended` |
| Meta | `meta-webindexer` | `meta-externalfetcher` | `meta-externalagent` |
| DuckDuckGo | `DuckAssistBot` | — | — |
| Amazon | `Amzn-SearchBot` | `Amzn-User` | `Amazonbot` |
| Mistral | `MistralAI-Index` | `MistralAI-User` | `MistralAI-Training` |
| Common Crawl | — | — | `CCBot` |
| Microsoft | `bingbot` (Copilot answers use the Bing index) | — | — |

Sources:
- https://developers.openai.com/api/docs/bots
- https://support.claude.com/en/articles/8896518 (2026-04-07)
- https://docs.perplexity.ai/guides/bots
- https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers (2026-10-15)
- https://support.apple.com/en-us/119829
- https://developers.facebook.com/docs/sharing/webmasters/web-crawlers/
- https://duckduckgo.com/duckduckgo-help-pages/results/duckassistbot
- https://developer.amazon.com/amazonbot
- https://docs.mistral.ai/robots/
- https://commoncrawl.org/ccbot
- https://blogs.bing.com/webmaster/september-2023/Announcing-new-options-for-webmasters-to-control-usage-of-their-content-in-Bing-Chat

Uncertain:
- Bing's current Webmaster Guidelines page renders client-side and could not be read directly; Copilot details are secondary (SEJ).
- Anthropic's robots.txt behaviour for `Claude-User` is covered only by a general "honors robots.txt" statement.

## 5. What gets content cited in AI answers

- **Google AI Overviews and AI Mode** have "no additional requirements" beyond being indexed and snippet-eligible. Original, non-commodity content matters most. Structured data is optional but must match visible text. `nosnippet` and `max-snippet` limit AI use. — https://developers.google.com/search/docs/appearance/ai-features
- **Search Console** has a "Search generative AI" setting (on by default) and a generative-AI performance report. — https://support.google.com/webmasters/answer/16908024
- **llms.txt:** the spec at https://llmstxt.org requires an H1, then an optional blockquote and link lists; `llms-full.txt` is a community convention. **Google: Search "doesn't use them"** and lists them among "AEO/GEO hacks" — https://developers.google.com/search/docs/fundamentals/ai-optimization-guide (2026-07-10). No OpenAI, Anthropic or Perplexity statement says their crawlers read it. **Unproven; kept because it costs nothing.**
- **ChatGPT:** referrals carry `utm_source=chatgpt.com`, and `OAI-SearchBot` must be allowed for snippets (secondary; help.openai.com returned 403).

## 6. Bing and IndexNow

- **IndexNow** works like this:
  - Host a key file at `/{key}.txt`.
  - Ping `https://<engine>/indexnow?url=…&key=…`, or POST up to 10,000 URLs.
  - Participating engines share submissions: Bing, Yandex, Seznam, Naver, Yep, Internet Archive and Amazon. **Google does not participate.**

  Sources: https://www.indexnow.org/documentation, https://www.indexnow.org/searchengines.json
- **Bing guidance** (secondary): XML sitemap of canonical URLs, crawlable links, avoid hiding critical content behind client-side rendering, 301 for moves.

## 7. Vercel and Next.js 16

- **Indexing:** Vercel adds `X-Robots-Tag: noindex` to preview deployments and preview `.vercel.app` URLs, and to old production deployments once a newer one is promoted. The current production deployment's hash URL isn't explicitly covered. — https://vercel.com/kb/guide/are-vercel-preview-deployment-indexed-by-search-engines (2026-10-02)
- **Environment variables:** `VERCEL_ENV` is `production`, `preview` or `development`. `VERCEL_PROJECT_PRODUCTION_URL` is always set. — https://vercel.com/docs/environment-variables/system-environment-variables
- **Trailing slashes:** Next.js 308-redirects `/about/` → `/about` (verified locally).
- **Static assets:** `/_next/static/immutable/*` is served `public, max-age=31536000, immutable` and can't be overridden. — https://vercel.com/docs/caching/cdn-cache
- **Next 16 framework conventions** (local docs in `node_modules/next/dist/docs`):
  - `robots.ts`, `sitemap.ts`, `manifest.ts`, `opengraph-image.tsx` and `apple-icon.tsx` are file conventions.
  - JSON-LD goes in a `<script>` with `<` escaped.
  - A static `metadata` object lands in the prerendered `<head>`; `generateMetadata` may stream.
  - **Proxy (middleware) must live inside `src/` when a `src` folder is used** (`03-file-conventions/src-folder.md`).

## 8. Search Console

- **Verification:** `*.vercel.app` can't be verified by DNS, so use a **URL-prefix** property verified by HTML tag or HTML file.
- **Change of Address** requires both properties verified, 301s from old to new, and domain-level properties.
  - Whether a `x.vercel.app` URL-prefix property qualifies is an inference (it behaves like a host).
  - Whether Vercel's 308 is accepted in place of a 301 is **unverified**.

  Source: https://support.google.com/webmasters/answer/9370220
