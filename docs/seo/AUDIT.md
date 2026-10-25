# SEO audit — https://lockin-web-app.vercel.app (2026-10-26)

**Baseline:** `main` at `15ae0cc`. Live raw HTML was fetched with curl; local builds were compared with Lighthouse 12.8 (mobile).

**Stack:** Next.js 16.4.2 App Router with Cache Components and Partial Prerendering, React 19, Clerk (`@clerk/nextjs` 7), Tailwind 4 plus custom CSS, Vercel Analytics, Vercel hosting. There are two routes:
- `/` renders `<Suspense fallback={<LoadingScreen/>}><LockInApp/></Suspense>`.
- `[...slug]` renders the same thing for every other path.

`LockInApp` is one `"use client"` component that branches on Clerk state and `usePathname()`.

## What a crawler received before this branch

| URL | Status | Raw HTML content |
| --- | --- | --- |
| `/` | 200 | `<title>`, one-line description, then only "LockIn · Preparing your focus space…" |
| `/robots.txt`, `/sitemap.xml`, `/llms.txt` | 200 `text/html` | the same loading screen |
| `/dashboard`, `/history`, `/commitments/*`, `/sign-in`, `/anything` | 200 | the same loading screen, indexable, no canonical |

After JavaScript runs, a signed-out visitor sees the sign-in landing ("Ready to Lock In?" plus three feature points). Googlebot can render that; most AI crawlers can't.

## Findings

Impact: H/M/L. Risk = risk of breaking the app.

| # | Issue | Where | Impact | Effort | Risk | Fix (status) |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | **No product content in raw HTML**; all routes are a CSR loading screen. AI crawlers and non-JS bots see nothing. | `page.tsx`, `lockin-app.tsx` | H | M | — | Added a static, server-rendered `/about` (~800 words). The `/` landing itself still needs an architecture decision (see REPORT "Needs my decision" #1). **Partly fixed** |
| 2 | **Soft 404s:** every unknown URL returns 200 with the app shell | `[...slug]/page.tsx` | H | L | L | `noindex, follow` on all catch-all routes. A real 404 status needs a routing change, deferred as decision #2. **Mitigated** |
| 3 | **Private app screens indexable** (`/dashboard`, `/commitments/:id`, …) | `[...slug]` | H | L | L | Same `noindex`; deliberately **not** disallowed in robots.txt, so the noindex can be seen. **Fixed** |
| 4 | **No robots.txt**: the path returned HTML | — | H | L | L | `app/robots.ts`, with explicit AI crawler rules and preview disallow. **Fixed** |
| 5 | **No sitemap** | — | M | L | L | `app/sitemap.ts`, canonical URLs only, hand-maintained lastmod. **Fixed** |
| 6 | **No canonical** on any page | `layout.tsx` | M | L | L | `metadataBase` plus a self-canonical per indexable page; one `SITE_URL`. **Fixed** |
| 7 | **No Open Graph or Twitter tags, no share image** | `layout.tsx` | M | L | L | `pageMetadata()` helper plus a generated 1200×630 `opengraph-image`. **Fixed** |
| 8 | **No structured data** | — | M | L | L | `WebSite` + `WebApplication` graph with stable `@id`s; `AboutPage` + `BreadcrumbList` on /about. **Fixed** |
| 9 | **Title and description weak for search intent.** "Keep promises to yourself" has no search demand, and "LockIn" collides with ~10 other products. | `layout.tsx` | M | L | L | Titles lead with "Habit Tracker with Rewards… Build or Quit Habits"; the description says what it is. **Fixed** |
| 10 | **No H1 in server HTML on `/`**; the client H1 is "Ready to Lock In?", which carries no topic | `lockin-app.tsx` | M | M | M | Not changed, since it is visible UI. Decision #1. **Open** |
| 11 | **Internal linking:** all app navigation is `<button onClick={router.push}>`, so there are no crawlable links | `lockin-app.tsx` | L (app is private) | — | M | Left alone for private screens. Added a real `<a href="/about">` to the sign-in footer, and /about links back to `/`. **Fixed for public pages** |
| 12 | **No apple-touch-icon or manifest** | — | L | L | L | Generated `apple-icon` (180 px PNG) and `manifest.webmanifest` (`display: browser`). **Fixed** |
| 13 | **No E-E-A-T and trust pages:** no privacy policy, terms, contact or maker identity | — | M | L | L | Needs facts from you; a factual privacy draft is in `docs/seo/drafts/`. Decision #4. **Open** |
| 14 | **`proxy.ts` is ignored**: it sits in `frontend/`, but with a `src/` dir Next 16 only reads `src/proxy.ts`. `middleware-manifest.json` is empty, so `auth.protect()` never runs. | `frontend/proxy.ts` | — (security) | L | **H** | Not touched (auth). If fixed, robots, sitemap, llms.txt, /about and the image routes must be made public. Decision #3. **Open** |
| 15 | **Production uses a Clerk development instance** (`*.clerk.accounts.dev`): third-party cookies (Lighthouse Best Practices 75) and dev-instance limits | Vercel env | L (SEO) | L | M | Decision #5. **Open** |
| 16 | **Colour contrast:** `.auth-copy p`, divider text and the `small` legal copy fail Lighthouse contrast | `globals.css` | L | L | L | Visual design change, so left as a recommendation. **Open** |
| 17 | **Preview deployments:** Vercel already sends `X-Robots-Tag: noindex`; production has none (correct) | Vercel | L | — | — | Also added a robots.txt `Disallow: /` when `VERCEL_ENV=preview`, and canonicals always point to production. **Fixed** |
| 18 | **Trailing slash** | — | — | — | — | Already consistent: `/about/` → 308 → `/about`. HTTPS + HSTS preload already on. **OK** |
| 19 | **Performance:** font via `next/font` with `display: swap`, SVG-only imagery, immutable hashed assets. CLS 0. LCP 3.7–4.7 s in lab, held back by the Clerk JS boot before the landing appears. | — | M | — | — | Nothing safe to change without touching the app. LCP improves only with decision #1. **OK / tied to #1** |
| 20 | **i18n / hreflang** | — | — | — | — | English only; not needed. **N/A** |
| 21 | `lang`, viewport, charset, theme-color | `layout.tsx` | — | — | — | Already correct. **OK** |
