# LockIn — product profile (for SEO)

Inferred from the repository and the live site on 2026-10-26. Confidence: **H** high, **M** medium, **L** low.

## Name — H

**LockIn** (one word, capital L and I). Used consistently in `layout.tsx` metadata, the `Brand` component, `README.md`, `docs/assets/lockin-logo.svg` and `apple-mobile-web-app-title`. "Lock In" appears only as a verb in UI copy ("Ready to Lock In?", "LOCK-IN NEW COMMITMENT").

The name is heavily shared: several iOS focus and habit apps, a McMaster University scroll blocker, a Chrome extension and a password manager all use "LockIn" or "Lock In" (see RESEARCH.md §3). Branded search for "lockin app" is already owned by others.

## What it is — H

> LockIn is a habit tracker for time-boxed commitments: build a habit or quit one, check in honestly each day, and unlock a reward you chose at the finish line.

Users create a *commitment* with a fixed start and end date and a measurable rule. They log each day as kept (or broken, for quit habits), see progress on a calendar, and aim at a reward they picked up front. The README frames it as "a commitment-driven habit companion for people who want more than an endless streak counter." Tagline: **"Keep promises to yourself."**

## Audience and use cases — M

- Self-directed people who want a finish line, not an endless streak: 7/30/45/90-day challenges.
- Building a routine ("Daily Yoga Practice", "working out three times a week"), from builder placeholders and the README.
- Quitting a pattern ("No Fast Food", "late-night scrolling").
- People who want privacy. There is no social feed or public profile, and the sign-in copy says "Private by default".

## Core features (verified in code) — H

| Feature | Evidence |
| --- | --- |
| Build or quit commitment types | `CommitmentKind`, Builder step 1 |
| Six-step guided setup | `Builder` (STEP n OF 6) |
| Durations of 7/30/45/90 days or custom, max 365 | Builder step 3; API `A commitment may not exceed 365 days.` |
| Build cadence: every day or a weekly target. "Custom days" stores a weekly count, not specific weekdays | `applyDays()` sets `{type: "weekly", target}` |
| Quit habits are daily; a broken check-in ends the commitment | API `check-in`: BROKEN sets status BROKEN |
| Kept/broken check-ins, calendar, backfill of the previous 2 days | `RecentHistory`; API `LATE_CHECK_IN_GRACE_DAYS = 2` |
| Reward chosen up front and editable while active | Builder step 5; `edit-reward` dialog |
| Pause/resume; resume pushes the end date back by the paused days | API `resume()` |
| Clerk sign-in; "LockIn never receives or stores your password" | `Login` copy |
| Data stored in Neon Postgres via a NestJS API on Render | README, `docs/flutter-integration.md` |

The API also supports monthly and rolling-window rules, but the web builder does not offer them, so public copy does not claim them.

Not implemented: automatic completion (nothing sets `COMPLETED` apart from legacy import), notifications, social features, mobile or desktop apps. The apps are planned (`enhancements.md`) and are not claimed.

## Pricing — unknown

There is no billing code, so the app is probably free today. That is **unconfirmed** and is not stated anywhere public.

## Language and market — M

English only (`lang="en"`, `en` date formats). No i18n. Git timestamps (+0530) suggest an India-based maker; the audience is likely global English.

## Category and schema type — H

Habit tracker / self-improvement productivity app. Schema.org: **`WebApplication`** with `applicationCategory: "LifestyleApplication"` (a Google-supported value) and `operatingSystem: "Any (web browser)"`.

## Keywords

Based on live Google autocomplete research (RESEARCH.md §3). No volume data was available.

- **Primary:** habit tracker with rewards · quit habit tracker · 30 day challenge tracker · habit tracker web app · break bad habit tracker
- **Secondary:** quit habit tracker online/free · habit tracker reward system · habit reward ideas · build and break habits app · 30 day habit tracker · 90 day habit challenge · no sugar challenge app/calendar · no fast food challenge · habit tracker website free · stop habit tracker · self accountability app · commitment contract app · habitica alternative · stickK alternative
- **Long-tail / AI-assistant questions:** "habit tracker that tracks both good and bad habits" · "web habit tracker with a reward at the end" · "30 day no fast food challenge tracker" · "how to reward yourself for good habits" · "what's a good reward for finishing a 30-day challenge" · "app to make a commitment to myself without betting money" · "private habit tracker with no social features" · "habit tracker that lets me backfill a missed day" · "custom length habit challenge 7/45/90 days"
- **Branded:** LockIn habit tracker · LockIn keep promises to yourself · lockin-web-app. Pair the name with the category every time; the bare "LockIn" is not winnable.

The tagline phrasing ("app to keep promises to myself") has **no measurable search demand**. Keep it as brand voice, not as a target keyword.

## Competitors / alternatives — M

Habitify, Streaks, Loop Habit Tracker, Habitica (gamified with rewards), stickK and Beeminder (money-at-stake commitment contracts), Quitzilla / I Am Sober (quit-only), Punchcard / Fun Habit (self-chosen rewards, iOS).

**Differentiator:** none of these combines a fixed-length promise, a reward chosen up front, an honest kept/broken log, and both building and quitting, on the web, with no money at stake. LockIn is effectively the "carrot" version of stickK and Beeminder.

## Could not determine

- Maker or company name to publish. Git author "Nibedan Pati" / GitHub `Heisenberg300604` is not used publicly without your confirmation.
- Pricing, contact email, social profiles, privacy policy and terms, launch date, user numbers.
- Whether a custom domain is planned.
