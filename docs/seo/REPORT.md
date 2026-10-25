# SEO / GEO report — branch `seo/optimization`

Written 2026-10-26. Companion docs: [PRODUCT_PROFILE.md](PRODUCT_PROFILE.md), [RESEARCH.md](RESEARCH.md) and [AUDIT.md](AUDIT.md).

## Summary

Before this branch, every URL on the site (including `/robots.txt` and `/sitemap.xml`) returned the same client-rendered loading screen with status 200. Crawlers that don't run JavaScript, which includes most AI crawlers, could not tell what LockIn is. Private app screens and made-up URLs were also indexable.

This branch makes no change to app logic, routing, auth or data flow. It adds:
- a server-rendered `/about` explainer;
- real `robots.txt`, `sitemap.xml` and `llms.txt` files;
- canonicals, Open Graph/Twitter tags and a generated share image;
- JSON-LD;
- `noindex` on every private or unknown URL;
- an automated SEO check wired into CI.

The home page `/` still renders its visible content client-side. Fixing that is an architecture decision (see "Needs my decision" #1 below).

## Commits

| Commit | What |
| --- | --- |
| `seo: central SITE_URL config, page metadata helper and JSON-LD` | `src/lib/seo/site.ts` holds `SITE_URL` (from `NEXT_PUBLIC_SITE_URL`, falling back to the vercel.app URL), the verified product facts and `pageMetadata()`. `src/lib/seo/json-ld.tsx` holds the WebSite + WebApplication graph. Root `layout.tsx` gets `metadataBase`, a title template and defaults; `page.tsx` gets its canonical, title, description and JSON-LD. |
| `seo: noindex every route served by the catch-all` | One `metadata` export in `[...slug]/page.tsx`. |
| `seo: generated share image, apple-touch-icon and web manifest` | `opengraph-image.tsx` (1200×630), `apple-icon.tsx` (180×180) and `manifest.ts`, all built at build time with no binary assets. |
| `seo: server-rendered /about page with product facts and FAQ` | `app/about/page.tsx`, new `.guide-*` CSS, and one `<Link href="/about">` in the sign-in footer. |
| `seo: robots.txt, sitemap.xml and llms.txt` | `robots.ts`, `sitemap.ts` and `llms.txt/route.ts`. |
| `seo: automated raw-HTML SEO check, wired into frontend CI` | `scripts/seo-check.mjs`, an `npm run seo:check` script, and one new CI step after the existing build. |
| `seo: list the share image explicitly in page metadata` | Fixes a missing `og:image` on `/about` that the new check caught. |
| `seo: optional Search Console and Bing verification tokens` | `verification` metadata driven by the `GOOGLE_SITE_VERIFICATION` and `BING_SITE_VERIFICATION` env vars; documents the new env vars. |
| `docs(seo): …` | These documents and the privacy-policy draft. |

**Business-logic check** (`git diff --stat main..HEAD`): 18 code files, +434/−5. Untouched: `lib/services`, `lib/storage`, `types`, `proxy.ts`, and all API calls, state and auth. The only edit to app code is the footer link in `lockin-app.tsx` (one import, one JSX line).

**Changing the domain later** means setting `NEXT_PUBLIC_SITE_URL` in Vercel and redeploying. Canonicals, `og:url`, the sitemap, robots.txt, JSON-LD and llms.txt all follow it.

## Verification

| Check | `main` (baseline) | This branch |
| --- | --- | --- |
| `npm run lint` | pass | pass |
| `npx tsc --noEmit` | pass | pass |
| `npm run build` | pass | pass (new static routes: `/about`, `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/manifest.webmanifest`, `/opengraph-image`, `/apple-icon`) |
| Tests | none exist in `frontend/`; backend untouched | same |
| `npm run seo:check` | **8 failures** (run against production) | **0 failures**, 1 warning (no server-side H1 on `/`) |
| Smoke test | — | Sign-in landing renders as before, plus the footer link. `/about` renders at 1280 px and at a true 390 px width with no overflow. `/about/` 308-redirects to `/about`. |

**Raw HTML** fetched with a GPTBot user agent:
- `/about`: title, description, canonical, OG/Twitter tags, three JSON-LD nodes, one H1, six H2s and about 820 words.
- `/`: title, description, canonical, OG/Twitter tags and JSON-LD.

**Lighthouse 12.8** (mobile, lab data, single runs, `next start` locally):

| Page | Perf | A11y | Best practices | SEO |
| --- | --- | --- | --- | --- |
| `/` on main | 79 | 95 | 75 | **91** (robots.txt invalid) |
| `/` on this branch | 90 | 96 | 75 | **100** |
| `/about` on this branch | 96 | 100 | 75 | **100** |
| `/` in production (before) | 86 | 95 | 79 | 91 |

Reading the numbers:
- The performance difference on `/` comes from single noisy runs; this branch did not change any code that affects it. Lab scores aren't field data, so watch Core Web Vitals in Search Console once there's traffic.
- Best Practices sits at 75 because of the Clerk development instance's third-party cookies (decision #5).
- Locally there is also a console error from `/_vercel/insights/script.js`, which only exists on Vercel. It appears on `main` too, so it isn't a regression.

## Assumptions (lower confidence)

- **Audience and positioning:** I inferred them from UI copy and the README.
- **Keywords:** based on autocomplete, not search volumes.
- **AI crawlers:** you want them all allowed, including **training** crawlers. Search and answer crawlers are what earn citations; training tokens can be disallowed without affecting that.
- **Category:** `LifestyleApplication` is the closest Google-supported category for a habit tracker.

## Skipped, and why

- **Real 404 status code:** requires changing routing (decision #2). `noindex` mitigates it.
- **Visible changes to the home landing** (H1, copy, contrast): this is visible UI, so it's up to you (decisions #1 and #6).
- **FAQPage markup:** Google retired FAQ rich results on 2026-05-07; the visible FAQ remains.
- **Organization/publisher, `offers`, `sameAs`:** no verified facts. They're marked TODO in `json-ld.tsx`.
- **IndexNow:** Google doesn't participate, and it only matters with frequently changing content. Bing Webmaster Tools plus the sitemap is enough for now.
- **Security headers beyond the existing HSTS:** little SEO value and some risk to Clerk's flows.
- **`llms-full.txt`:** not part of the spec, and there are only two pages.
- **Privacy, terms and contact pages:** these need your facts. A draft is in `drafts/privacy-policy.md`.

## Risks

- **Low.** Everything added is either a new route or metadata.
- **The one behavioural risk is `robots.ts` on preview deployments.** With `VERCEL_ENV=preview` it returns `Disallow: /`. Production is unaffected.
- **If someone moves `proxy.ts` into `src/`,** the new public routes would be auth-gated unless they are added to `isPublicRoute` (decision #3).

## Needs my decision

1. **Server-render the home page content.** This is the biggest remaining gap: `/` shows "Preparing your focus space…" to non-JS crawlers, and LCP waits for Clerk. Options:
   - **(a) Static landing as the fallback (small effort).** Replace the `/` Suspense fallback with a server-rendered copy of the sign-in landing, plus a descriptive H1. Signed-out visitors see content immediately. Signed-in visitors briefly see the landing before their dashboard.
   - **(b) Split marketing from the app (recommended, medium effort).** Make `/` a static marketing page and the app's home `/dashboard`, which already exists. Signed-in users who hit `/` are sent to `/dashboard`: client-side today, or server-side once #3 is fixed. This is the best result for both SEO and LCP. It changes where signed-in users land, so it needs your approval.
   - **(c) Leave it.** Rely on `/about` for crawlable content.
2. **Real 404s.** Return `notFound()` from `[...slug]` for paths outside `dashboard|history|settings|commitments/*|sign-in|sign-up`, and add a branded `not-found.tsx`. This needs testing with Partial Prerendering so the status really is 404. Today, signed-in users who hit an unknown URL see the dashboard; with this change they would see a 404.
3. **`proxy.ts` is not running (security, found during the audit).** With a `src/` directory, Next 16 only loads `src/proxy.ts`, and the build's `middleware-manifest.json` is empty, so `auth.protect()` never runs. The API still verifies tokens server-side, so data isn't exposed. If you move it, also make these routes public:
   ```ts
   createRouteMatcher(["/", "/about", "/sign-in(.*)", "/sign-up(.*)", "/robots.txt", "/sitemap.xml", "/llms.txt", "/opengraph-image(.*)", "/apple-icon(.*)"])
   ```
4. **Facts only you can supply:**
   - maker name (Person or Organization) for `publisher`;
   - pricing (if it's free, `offers.price: "0"`);
   - contact email;
   - real social and GitHub profiles for `sameAs`;
   - privacy policy and terms (start from `drafts/privacy-policy.md`).
5. **Clerk production instance.** Production uses a development instance (`*.clerk.accounts.dev`), which brings third-party cookies, dev-instance limits and a "development mode" badge. Create a production instance once you have a custom domain; it requires one.
6. **Small visual and copy tweaks on the landing:**
   - raise contrast for `.auth-copy p`, the divider text and the legal `small` text;
   - consider an H1 that says what the product is, e.g. "Ready to lock in?" kept as the eyebrow over "A habit tracker that ends with a reward";
   - optionally use a bold-weight font in the share image.
7. **Custom domain.** Strongly recommended (see the checklist below).
8. **Confirm AI training crawlers should stay allowed.** To opt out of training without affecting search or AI answers, move the `AI_TRAINING_BOTS` group in `src/app/robots.ts` to `disallow: "/"`.

## Manual checklist (off-code)

### Search engines

1. **Google Search Console:** add a **URL-prefix** property for `https://lockin-web-app.vercel.app/`.
   - Choose "HTML tag", copy the `content` value into `GOOGLE_SITE_VERIFICATION` in Vercel (Production), redeploy, then click Verify.
   - Submit `https://lockin-web-app.vercel.app/sitemap.xml`.
   - Run URL Inspection → Request indexing for `/` and `/about`.
   - Check Settings → "Search generative AI" is on (it is by default).
2. **Bing Webmaster Tools:** import the site from Search Console (fastest), or verify with `BING_SITE_VERIFICATION`. Submit the sitemap. Bing's index also feeds Copilot and DuckDuckGo.
3. **IndexNow:** optional; skip until you publish content regularly.

### Custom domain — strongly recommended

Why it matters:
- A `*.vercel.app` subdomain shares a domain with thousands of unrelated projects.
- It can't be verified as a Search Console Domain property.
- It is a weak trust signal, and "LockIn" alone is not a distinctive brand.
- A domain that pairs the name with the category helps disambiguation, e.g. `lockin.app`, `getlockin.app` or `lockinhabits.com` (check availability).

Migration steps:
1. Buy the domain and add it to the Vercel project as the production domain.
2. In Vercel, set `lockin-web-app.vercel.app` to **redirect** to the new domain. Use a **301 (permanent)** if offered; Google's Change of Address check expects a 301.
3. Set `NEXT_PUBLIC_SITE_URL=https://<new-domain>` and redeploy. Confirm with `npm run seo:check -- https://<new-domain>`.
4. Verify the new domain in Search Console as a **Domain** property (DNS) and submit its sitemap.
5. In the old property, use **Settings → Change of address**. This requires the 301, and its eligibility for a vercel.app property is unverified, so the 301s alone still do most of the work.
6. Update Clerk (production instance), `FRONTEND_ORIGINS` on the API, the README links and every external profile.

### Monitoring

- **Search Console Pages report:** `/` and `/about` should show as Indexed. App URLs, if discovered at all, should show "Excluded by noindex".
- **Performance report:** watch queries and impressions first; clicks lag by weeks.
- **Generative AI report:** shows AI Overviews and AI Mode appearances.
- **Vercel Analytics:** track referrers, including `chatgpt.com`, `perplexity.ai`, `bing.com` and `google.com`.
- **CI:** `npm run seo:check -- https://<prod>` also works as a post-deploy check.

### Authority and mentions (what moves rankings and AI citations most)

- **Product Hunt launch:** a distinctive tagline, e.g. "Habit tracker that ends with a reward you chose".
- **AlternativeTo:** list LockIn as an alternative to stickK, Beeminder, Habitica, Quitzilla and Habitify.
- **PeerPush and similar directories.**
- **Reddit:** helpful, non-promotional answers in r/getdisciplined, r/productivity, r/decidingtobebetter, r/sugarfree and r/nosurf, with disclosure.
- **GitHub:** a public repo or README with the live link. The repo is private and "All rights reserved" today; your call.
- **Social profiles:** LinkedIn and X posts (build in public), then add the profiles to `sameAs`.
- **Ask habit/productivity bloggers and roundup authors** (Zapier, Reclaim, ClickUp lists) for inclusion once there's traction.

### Content plan

One page at a time, each genuinely useful, linked from `/about` and listed in `PUBLIC_PAGES`.

1. **How it works / features:** possibly split out of `/about` later, with screenshots.
2. **Comparisons:**
   - "LockIn vs stickK: commitment without betting money"
   - "Beeminder alternative without penalties"
   - "Habitica alternative that's simpler"
   - "Quit habit trackers for the web"
3. **Challenge pages,** each tied to a ready-made commitment setup:
   - 30-day no fast food challenge
   - No sugar challenge tracker
   - 90-day habit challenge
   - 7-day reset

   Only build these with real substance, never as thin doorway variants.
4. **Guides:**
   - "How long does it take to build or break a habit?" Cite the UCL ~66-day study and explain why LockIn offers 7, 30, 45 and 90 days.
   - "Reward ideas for finishing a 30-day challenge"
   - "How to reward yourself for quitting sugar or drinking", addressing the "rewards end the behaviour" critique.
5. **Privacy, Terms and Contact pages** (trust signals).

### Test AI visibility monthly

Ask ChatGPT (search on), Perplexity, Claude (web search on), Gemini and Copilot the same prompts each month, and log whether LockIn is mentioned or cited and which URL is used:
- "What is LockIn habit tracker?"
- "habit tracker that tracks both good and bad habits with a reward at the end"
- "app to make a commitment to myself without betting money"
- "best quit habit tracker for web"
- "30 day no fast food challenge tracker"

Expect nothing for the first weeks; citations follow indexing and third-party mentions.

## What to expect

- **No one can guarantee rankings.** This branch removes the technical blockers: crawlers can now read what LockIn is, private pages stay out of the index, and the site's identity is consistent across title, Open Graph, JSON-LD and llms.txt.
- **Indexing** of `/` and `/about` typically takes days to a few weeks after submitting the sitemap.
- **Ranking for competitive terms** like "habit tracker" is unrealistic for a new two-page site on a vercel.app subdomain, against Zapier, Habitify and others. Specific long-tail queries are realistic within a few months **if** you add the content above and earn some mentions.
- **AI assistants** cite pages that rank and are mentioned elsewhere. The biggest remaining levers, in order:
  1. server-rendered home content (decision #1);
  2. a custom domain;
  3. listings and mentions;
  4. a handful of genuinely useful content pages.
