# Backend requirements — LockIn

Status: discovery findings recorded on 2026-10-18. This document distinguishes observed behavior from the proposed server design so the implementation does not turn visual assumptions into data rules.

## Product summary

LockIn is a time-bound commitment tracker. A person creates a commitment to either build a habit or quit a pattern, chooses a timeline and execution rule, logs outcomes, and views progress, history, and a promised reward.

## Evidence reviewed

- `frontend/src/app/lockin-app.tsx` — all routes, forms, dialogs, and user actions.
- `frontend/src/types/commitment.ts` — current client domain contract.
- `frontend/src/lib/services/commitment-service.ts` — validation and lifecycle behavior.
- `frontend/src/lib/storage/lockin-store.ts` — current IndexedDB persistence.
- `backend/lockin-api/src` — existing NestJS foundation.

## Existing feature inventory

| Feature | Observed implementation | Server requirement |
| --- | --- | --- |
| Sign in / profile | Local email-and-name simulation; password input is ignored; “Google” is a demo shortcut. | Replace with Clerk on the frontend; server trusts verified Clerk tokens only. Store an app profile only for the editable display name and timestamps. |
| Dashboard | Lists the current local profile's commitments, status filters, counts, and empty state. | User-scoped commitment list with status filtering. |
| Commitment builder | Six steps: kind, title/description, dates, pace, reward, and review. | Create endpoint with server validation. |
| Build rules | Daily, flexible weekly/monthly targets, fixed weekdays, and fixed windows. | Evaluate every completed rule period server-side; flexible targets are minimum counts, fixed weekdays require each selected day. |
| Quit rules | The builder always creates a daily rule. | Enforce daily-only quit commitments on the server. |
| Check-ins | One entry per commitment and local date. Build: successful log; quit: kept or broken. A broken outcome immediately breaks the commitment. | User-scoped, idempotency-safe one-per-date endpoint. |
| Lifecycle | Active, paused, completed, broken. The local service evaluates expired and missed completed periods at read/check-in time. | Move the same evaluation to a server domain service and persist status changes. |
| Detail/history | Timeline, check-in calendar, reward preview, pause/resume, delete, and a chronological history list. | Detail, delete, and pause/resume endpoints plus check-in data in commitment responses. |
| Local data deletion | Clears all browser IndexedDB records. | No matching account/data deletion endpoint is currently implied; keep this out of scope until retention/deletion policy is decided. |

## User workflows and business rules

### Commitment creation

Observed rules from `commitment-service.ts`:

- Title is required after trimming.
- Start date cannot be before the caller's local current date.
- End date must not precede start date.
- The inclusive timeline may not exceed 365 days.
- Rule targets must be whole numbers of at least one.
- Maximum targets: daily `1`, weekly `7`, monthly `31`, window rule `windowDays`.
- Reward falls back to “A meaningful reward” if blank.
- All new commitments begin `active`.

### Check-ins and lifecycle

Implemented rules:

- A check-in can only be recorded while a commitment is active and inside its timeline.
- A commitment has at most one check-in for a calendar date.
- A quit-habit `broken` check-in immediately changes its status to `broken` and records the selected reason.
- A flexible weekly, monthly, or fixed-window build goal succeeds as soon as its minimum count is reached; further check-ins in that period are optional.
- A build commitment becomes `broken` when a completed weekly, monthly, or fixed-window period falls short of its target. There is no grace period for those frequencies.
- Daily build commitments retain a two-day late-log allowance; an unlogged day breaks the commitment when that allowance closes.
- Fixed weekly schedules use `scheduledDays`: each selected weekday is required, unlike a flexible weekly target.
- At the end of a commitment, quit commitments complete if unbroken. Build commitments complete only after every rule period—including the final partial period—has met its target; otherwise they become broken.
- The API reconciles lifecycle status before commitment reads and mutations, so status does not depend on browser-only calculations.
- Pause/resume currently changes only the status. The local implementation does not change dates or retroactively adjudicate paused days.

### Calendar semantics

Observed implementation:

- Dates are `YYYY-MM-DD` values and are parsed at local noon to avoid DST shifts.
- Weeks start on Monday.
- Monthly rules use calendar months.
- Window rules are anchored to the commitment start date.

The server must make date interpretation explicit. The proposed design stores an IANA `timeZone` on each commitment and evaluates the “today” date in that zone. The current frontend does not collect this field; initial integration may send `Intl.DateTimeFormat().resolvedOptions().timeZone` and the server can default only after a product decision.

## Entities and relationships

| Entity | Purpose | Relationships |
| --- | --- | --- |
| `UserProfile` | Local application data associated with a Clerk identity: Clerk user ID and optional display name. No passwords, emails, or roles are required for the observed product. | One user owns many commitments. |
| `Commitment` | The protected goal, its rule, dates, reward, and lifecycle state. | Belongs to one user; has many check-ins. |
| `CheckIn` | The outcome recorded for one commitment on one local calendar date. | Belongs to one commitment and, redundantly for indexed ownership queries, one user. |

## Required API operations

All protected routes require a valid Clerk bearer token and scope data by the authenticated Clerk subject.

| Method | Route | Operation |
| --- | --- | --- |
| `GET` | `/api/v1/health/live` | Process liveness; no database requirement. |
| `GET` | `/api/v1/health/ready` | Database readiness. |
| `GET` | `/api/v1/me` | Get/provision the caller's application profile. |
| `PATCH` | `/api/v1/me` | Update display name only. |
| `POST` | `/api/v1/commitments` | Create a commitment. |
| `GET` | `/api/v1/commitments` | List the caller's commitments; optionally filter by status. |
| `GET` | `/api/v1/commitments/:id` | Get one owned commitment with check-ins. |
| `PATCH` | `/api/v1/commitments/:id` | Update permitted active-commitment fields; do not permit ownership or immutable history changes. |
| `POST` | `/api/v1/commitments/:id/check-ins` | Record the current-date outcome, with an optional note/reason. |
| `POST` | `/api/v1/commitments/:id/pause` | Pause an active owned commitment. |
| `POST` | `/api/v1/commitments/:id/resume` | Resume a paused owned commitment. |
| `DELETE` | `/api/v1/commitments/:id` | Delete an owned commitment and its check-ins. |

`GET /commitments` will use bounded pagination if needed by a future larger history UI. The currently observed UI displays all local records and has no pagination controls, so initial integration can use a conservative default/maximum without changing the interface.

## Validation and ownership requirements

- Bearer tokens are verified by Clerk; callers never supply a `userId`.
- Every commitment query includes the authenticated user’s Clerk ID through its profile relationship.
- Every check-in validates that the commitment belongs to the caller.
- Check-in uniqueness is enforced by a database unique constraint on `(commitmentId, date)`.
- IDs are server-generated UUIDs.
- Dates must be ISO calendar dates. Time zones must be valid IANA identifiers if exposed in the create contract.
- Only active commitments may accept check-ins; pause/resume transitions are explicit and status constrained.
- Unknown request properties are rejected globally.
- Notes and reasons are bounded text fields; title, description, and reward also have explicit length limits.

## Authentication and provisioning

Observed fact: there is no Firebase SDK, Firebase configuration, Firebase request, Clerk SDK, or remote API call in the frontend or backend. `docs/backend-setup.md` describes Firebase and Prisma as intended work, but its routes and files do not exist in this checkout.

Proposed replacement:

1. Clerk is the identity provider.
2. A Nest guard verifies the bearer JWT using Clerk’s supported server SDK/JWKS strategy.
3. The guard attaches the verified Clerk subject to the request.
4. `GET /me` and the first authenticated feature request idempotently create the minimal `UserProfile` row. No client-provided identity fields are trusted.
5. Clerk webhooks are not required for the observed application because profile data is not synchronized from Clerk. They can be added later if account deletion or profile synchronization is required.

## Files and external services

No upload input, Firebase Storage usage, Firestore usage, or external API call exists in the inspected frontend. PostgreSQL and Clerk are the only proposed production dependencies. No file-service module is needed.

## Assumptions and unresolved decisions

1. **Timezone policy (decision needed before frontend integration):** the current local app evaluates dates in the browser’s timezone, but does not persist it. The backend should store an IANA timezone per commitment to make server lifecycle evaluation deterministic. Confirm whether a commitment stays in the timezone chosen at creation (recommended) or follows the user’s current location.
2. **Paused timeline policy (decision needed):** observed code preserves dates and does not clearly say whether a paused day should count as a missed daily/weekly target. The backend should preserve existing dates and exclude no days until this is clarified; automated adjudication while paused must be explicitly specified.
3. **Custom Days semantics (implementation gap):** the new UI lets people select weekdays, but the current domain type only stores a weekly target count. The server cannot truthfully enforce weekday-specific execution without adding a `scheduledDays` field and a migration. This should be decided before claiming Custom Days is server-enforced.
4. **Existing local data migration:** IndexedDB records have no Clerk identity. Migration to cloud data requires an explicit user-confirmed import flow, or local data remains separate. This backend will not silently upload browser records.
5. **Account deletion/retention:** no product requirement currently defines account or data deletion. It should be specified before a public release.
