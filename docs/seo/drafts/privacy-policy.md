# DRAFT — LockIn privacy policy

**Not published.** Every statement below was checked against the code on 2026-10-26. Lines marked TODO need facts only you can supply, and a policy should be reviewed by someone qualified for your jurisdiction before it goes live. Once it's ready, it can ship as `src/app/privacy/page.tsx`, following the `/about` pattern, and be added to `PUBLIC_PAGES` in `src/lib/seo/site.ts`.

---

**Who we are.** LockIn is operated by TODO(legal name / person), TODO(country). Contact: TODO(email).

**What we collect**
- **Account details:** your email address and name, provided through Clerk when you sign up. LockIn never receives or stores your password.
- **What you enter:** commitments (title, optional description, dates, time zone, rule, reward), check-ins (date, kept/broken, optional note and reason), and your display name.
- **Usage analytics:** anonymous page-view analytics through Vercel Web Analytics. TODO: confirm settings; Vercel Web Analytics does not use cookies by default.

**Where it is stored**
- Commitments, check-ins and your profile live in a PostgreSQL database (Neon), accessed through the LockIn API (hosted on Render). TODO: region.
- Authentication is handled by Clerk. TODO: link to Clerk's privacy policy.
- Earlier versions stored data only in your browser (IndexedDB). That copy is uploaded only if you explicitly confirm a one-time import, and you can delete it in Settings.

**How we use it.** To provide the service: showing your commitments, recording check-ins and computing progress. TODO: confirm no marketing emails, no selling or sharing of data, no advertising.

**Your choices.** You can delete any commitment and its check-in history in the app. TODO: account deletion process. TODO: data export.

**Retention.** TODO.

**Children.** TODO (minimum age).

**Changes.** TODO (how changes are announced). Last updated: TODO.
