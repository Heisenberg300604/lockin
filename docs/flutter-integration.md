# LockIn API — Flutter integration guide

This document is for the AI/engineer building the **Flutter mobile client** of LockIn. It describes the existing, already-deployed REST API and how authentication works. The backend is not changed by the mobile app; the mobile app is just another client of it (the Next.js web app is the other one).

LockIn is a **commitment tracker**: a user creates a commitment (build a habit or quit something) with a date range and a rule (daily / weekly / monthly / window), then checks in once per day. Everything is scoped to the signed-in user.

---

## 1. Base URLs

| Environment | Base URL |
| --- | --- |
| Live (Render) | `https://lockin-a0os.onrender.com/api/v1` |
| Local backend | `http://localhost:3001/api/v1` (iOS simulator) · `http://10.0.2.2:3001/api/v1` (Android emulator) · `http://<Mac-LAN-IP>:3001/api/v1` (real device, same Wi‑Fi) |

- Make the base URL configurable: `--dart-define=API_URL=...`. No trailing slash.
- All paths below are relative to the base URL (they already include `/api/v1`).
- Live server is on Render's free tier: after ~15 min idle the **first request can take 30–60 s** (cold start). Use a request timeout of at least 60 s on the first call, show a loading state, and retry once on timeout/5xx.
- Swagger UI exists only on a local backend (`http://localhost:3001/docs`); it is disabled in production.
- Health checks (no auth): `GET /health/live` → `{"status":"ok","service":"lockin-api"}`, `GET /health/ready` → `{"status":"ok","database":"ready"}`.
- CORS does not apply to native mobile apps. (Only relevant if you also run Flutter *web*: that origin would have to be added to `FRONTEND_ORIGINS` on Render.)

All requests/responses are JSON (`Content-Type: application/json` on requests with a body).

---

## 2. Authentication (Clerk)

Authentication is handled by **Clerk**, not by this API. There is **no** `/login`, `/signup` or `/refresh` endpoint on the backend.

Flow:

1. The Flutter app signs the user in/up with Clerk (email/OTP, OAuth, etc.) using Clerk's Flutter SDK (`clerk_flutter` on pub.dev — check its current status/API on pub.dev before relying on method names; it may be beta).
2. After sign-in, the app obtains the **Clerk session token** (a short-lived JWT, ~60 s lifetime) from the Clerk SDK — the same thing the web app gets from `useAuth().getToken()` with **no custom JWT template**.
3. Every API call sends it as:
   ```
   Authorization: Bearer <clerk session token>
   ```
4. The backend verifies the JWT with `CLERK_SECRET_KEY` (`verifyToken` from `@clerk/backend`) and reads `sub` as the user's Clerk id.

Rules of thumb:

- **Fetch a fresh token before every request** (ask the SDK each time; it caches/refreshes internally). Never store the token yourself or reuse an old one — it expires in about a minute.
- The app must use the **same Clerk application/instance** as the web app: same `pk_...` publishable key. The backend's `CLERK_SECRET_KEY` belongs to that instance. A key from a different Clerk instance → every call returns 401. (Currently the project uses development keys: `pk_test_...` / `sk_test_...`.)
- The user profile row is created **automatically** on the first authenticated call (`GET /me` or any commitments call does an upsert). There is no explicit registration step against this API.
- The API does not store email. Get email/name from Clerk's user object.
- On any `401`: get a fresh token and retry once; if it still fails, treat the session as expired and send the user to sign-in.

> **Authorized party (`azp`) and native tokens:** the backend verifies every token with Clerk's `verifyToken` (signature, expiry, issuer). Browser tokens carry an `azp` claim (the web origin); when a token has `azp`, the backend also requires it to be one of the comma-separated `FRONTEND_ORIGINS` (e.g. `https://lockin-web-app.vercel.app`). The Clerk Flutter SDK sends no `Origin`, so native session tokens have **no `azp`**. Those tokens get the same full verification but skip the origin check. (Older `@clerk/backend` versions skipped `azp`-less tokens on their own; 3.x rejects them whenever `authorizedParties` is set, so the guard only passes `authorizedParties` when the token actually has `azp`.) The app needs no special handling: just send `Authorization: Bearer <session token>`. The API always answers a failed verification with the generic `401 "A valid bearer token is required."`. The real reason is logged server-side as `Token verification failed: <reason>`, so if you get a 401 with a token you're sure is valid, ask the backend owner to check the API logs. Don't work around it in the app.

---

## 3. Conventions

### Error format
NestJS default shape:

```json
{ "message": "A valid bearer token is required.", "error": "Unauthorized", "statusCode": 401 }
```

- `message` is a **string** for most errors, but for validation errors (`400`) it is an **array of strings**, e.g. `["title must be shorter than or equal to 120 characters"]`. Handle both (`message is List ? join : message`).
- Status codes used: `200`, `201`, `204` (delete, empty body), `400` (validation/business rule), `401` (missing/invalid token), `404` (not found **or** belongs to another user), `409` (state conflict), `500`.
- Request bodies are validated with **whitelist + forbidNonWhitelisted**: sending any field not listed for an endpoint returns `400`. Send only documented fields; omit optional fields rather than sending `null` where possible.
- IDs are UUIDs. Always send real UUIDs in `:id` paths (a malformed id may produce a 500 rather than a 404).

### Dates and times
- **Calendar dates** in *requests* (`startDate`, `endDate`, check-in dates) are plain `YYYY-MM-DD` strings.
- **Calendar dates in responses** (`startDate`, `endDate`, check-in `date`) come back as ISO timestamps at UTC midnight, e.g. `"2026-10-19T00:00:00.000Z"`. **Take the first 10 characters** (`substring(0, 10)`) and treat it as a date-only value. Do **not** parse into a local `DateTime` and convert time zones — that shifts the day for users west of UTC.
- Other timestamps (`createdAt`, `updatedAt`, `pausedAt`, `completedAt`, `brokenAt`) are real ISO‑8601 UTC instants.
- Each commitment has a `timeZone` (IANA name, e.g. `Asia/Kolkata`; get it on-device with the `flutter_timezone` package). The **server decides what "today" is** in that time zone when checking in.

### Enums (all UPPERCASE on the wire)
- `kind`: `BUILD` | `QUIT`
- `status`: `ACTIVE` | `PAUSED` | `COMPLETED` | `BROKEN`
- `ruleFrequency`: `DAILY` | `WEEKLY` | `MONTHLY` | `WINDOW`
- check-in `outcome`: `KEPT` | `BROKEN`

---

## 4. Data models

### UserProfile
```json
{
  "id": "uuid",
  "clerkId": "user_2abc...",
  "displayName": "Nibedan" ,
  "createdAt": "2026-10-18T10:00:00.000Z",
  "updatedAt": "2026-10-18T10:00:00.000Z"
}
```
`displayName` is `null` until set. The web app sets it once from the Clerk user's name if it's `null`; the mobile app should do the same.

### CheckIn
```json
{
  "id": "uuid",
  "commitmentId": "uuid",
  "userId": "uuid",
  "date": "2026-10-19T00:00:00.000Z",
  "outcome": "KEPT",
  "note": null,
  "reason": null,
  "createdAt": "2026-10-19T06:30:00.000Z",
  "updatedAt": "2026-10-19T06:30:00.000Z"
}
```
`note`, `reason` are `string | null`. `userId` is the internal profile uuid (not the Clerk id).

### Commitment
```json
{
  "id": "uuid",
  "userId": "uuid",
  "legacyId": null,
  "title": "Morning yoga",
  "description": null,
  "kind": "BUILD",
  "startDate": "2026-10-19T00:00:00.000Z",
  "endDate": "2026-12-02T00:00:00.000Z",
  "timeZone": "Asia/Kolkata",
  "ruleFrequency": "WEEKLY",
  "targetCount": 3,
  "windowDays": null,
  "scheduledDays": [1, 3, 5],
  "reward": "A good coffee",
  "status": "ACTIVE",
  "pausedAt": null,
  "completedAt": null,
  "brokenAt": null,
  "breakReason": null,
  "createdAt": "2026-10-18T10:00:00.000Z",
  "updatedAt": "2026-10-18T10:00:00.000Z",
  "checkIns": [ /* CheckIn[] sorted by date ascending */ ]
}
```
Nullable: `legacyId`, `description`, `windowDays`, `pausedAt`, `completedAt`, `brokenAt`, `breakReason`. `scheduledDays` is `int[]` (ISO weekdays: **1 = Monday … 7 = Sunday**), empty when not used. Ignore `legacyId` (used only for web migration).

Note: `checkIns` is present on create, list, get and update responses, but **`pause` and `resume` responses do not include `checkIns`** — keep the existing check-ins from local state or re-fetch.

---

## 5. Endpoints

All endpoints except `/health/*` require the bearer token.

### Profile

**`GET /me`** → `200` UserProfile (auto-creates it on first call).

**`PATCH /me`** → `200` UserProfile
```json
{ "displayName": "Nibedan" }   // optional, 1–80 chars
```

### Commitments

**`GET /commitments?status=ACTIVE`** → `200` `Commitment[]` (newest first, each with `checkIns`). `status` is optional (`ACTIVE|PAUSED|COMPLETED|BROKEN`). Use `includeCheckIns=false` for a lightweight list response; then load `GET /commitments/:id` when opening the detail screen. Invalid query values → `400`.

**`GET /commitments/:id`** → `200` Commitment with `checkIns`; `404` if missing or not yours.

**`POST /commitments`** → `201` Commitment (with `checkIns: []`)

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `title` | string | yes | 1–120 chars |
| `description` | string | no | ≤ 1000 chars |
| `kind` | `BUILD`\|`QUIT` | yes | |
| `startDate` | `YYYY-MM-DD` | yes | **not before today** in `timeZone` |
| `endDate` | `YYYY-MM-DD` | yes | ≥ `startDate`; total span ≤ **365 days** inclusive |
| `timeZone` | string | yes | valid IANA zone, ≤ 100 chars |
| `ruleFrequency` | enum | yes | see rules below |
| `targetCount` | int | yes | 1–31 |
| `windowDays` | int | only for `WINDOW` | 1–365; forbidden for other rules |
| `scheduledDays` | int[] | no | values 1–7, unique; only for `WEEKLY`; length must equal `targetCount` |
| `reward` | string | yes | 1–160 chars |

Business rules (violations → `400` with an explanatory message):
- `QUIT` must be `DAILY` with `targetCount: 1`.
- `DAILY` requires `targetCount: 1`.
- `WEEKLY`: `targetCount` ≤ 7.
- `MONTHLY`: `targetCount` 1–31.
- `WINDOW`: requires `windowDays`, and `targetCount` ≤ `windowDays`.

Example:
```json
{
  "title": "Morning yoga",
  "kind": "BUILD",
  "startDate": "2026-10-19",
  "endDate": "2026-12-02",
  "timeZone": "Asia/Kolkata",
  "ruleFrequency": "WEEKLY",
  "targetCount": 3,
  "scheduledDays": [1, 3, 5],
  "reward": "A good coffee"
}
```

**`PATCH /commitments/:id`** → `200` Commitment. Only these optional fields are accepted: `title` (1–120), `description` (≤1000; empty string clears it), `reward` (1–160). Anything else → `400`. Only `ACTIVE` commitments can be edited, else `409` `"Only active commitments can be edited."`.

**`POST /commitments/:id/check-ins`** → `201` CheckIn (the check-in only, not the commitment)
```json
{ "outcome": "KEPT", "note": "felt great" }
{ "outcome": "BROKEN", "reason": "had a cigarette" }
```
- `outcome` required. `note` optional (≤1000). `reason` is **required when `outcome` is `BROKEN`** (≤240).
- No date is sent: the server records **today in the commitment's `timeZone`**. One check-in per commitment per day.
- Errors: `409` not active / today is outside start–end range / today is not one of `scheduledDays` / `"Today has already been logged."`; `400` for a `BROKEN` outcome on a `BUILD` commitment (BUILD can only record `KEPT`).
- A `BROKEN` check-in also flips the commitment to `status: "BROKEN"` and sets `brokenAt` and `breakReason`. **Re-fetch the commitment** (or `GET /commitments`) after any check-in to get updated state.

**`POST /commitments/:id/pause`** → `200` Commitment (no `checkIns`). Only `ACTIVE`, else `409`.

**`POST /commitments/:id/resume`** → `200` Commitment (no `checkIns`). Only `PAUSED`, else `409`. Sets status back to `ACTIVE` and **extends `endDate` by the number of days it was paused**.

**`DELETE /commitments/:id`** → `204` no body. Deletes the commitment and all its check-ins.

**`POST /commitments/import`** — web-only migration of old browser data. **Do not implement in mobile.**

### Behaviour notes
- The backend reconciles active commitments before reads and mutations. It persists `BROKEN` when a completed build-rule period is short of target and `COMPLETED` when an unbroken commitment finishes. Do not infer or mutate lifecycle status on the client.
- Flexible weekly/monthly/window goals use a minimum count per period. Reaching the target before the period ends secures that period; skipped remaining days do not affect the commitment. Weekly `scheduledDays` are different: every selected weekday is required.
- Daily build commitments allow late logs for the preceding two days. Weekly, monthly, and window periods have no late-log grace after they close.
- No pagination: `GET /commitments` returns everything the user owns.

---

## 6. Progress calculation (client-side)

The API returns raw data only; progress numbers are computed in the client (the web app does this in `frontend/src/lib/services/commitment-service.ts → getProgress`). Port this logic to Dart so mobile and web agree. Work on **date-only** `YYYY-MM-DD` values, with "today" = the device's local date (or the commitment's `timeZone` date if you want to match the server exactly).

- `durationDays = daysBetween(startDate, endDate) + 1`
- `elapsedDays = today < startDate ? 0 : min(durationDays, daysBetween(startDate, today) + 1)`; `daysRemaining = max(0, durationDays - elapsedDays)`; `elapsedPercent = round(elapsedDays / durationDays * 100)`
- `successfulCheckIns` = count of check-ins with `outcome == KEPT`
- Current **period** (reference date = today clamped into `[startDate, endDate]`):
  - `DAILY`: the day itself; target 1; label "Today"
  - `WEEKLY`: Monday–Sunday week containing the date; target `targetCount`; label "This week"
  - `MONTHLY`: the calendar month; target `targetCount`; label "This month"
  - `WINDOW`: consecutive blocks of `windowDays` days counted from `startDate`; target `targetCount`; label "N-day window"
- `periodProgress` = KEPT check-ins whose `date` falls inside the current period
- `checkedToday` = any check-in with `date == today`
- `eligibleToday` = `status == ACTIVE && startDate <= today <= endDate` (additionally, if `scheduledDays` is non-empty, today's ISO weekday must be in it — the server enforces this with a `409`)

---

## 7. Suggested Flutter structure

- `ApiClient` (e.g. `dio`) with: base URL from `--dart-define=API_URL`, a request interceptor that **awaits a fresh Clerk token** and sets `Authorization: Bearer ...`, an error interceptor that maps the NestJS error body to a typed `ApiException(statusCode, message)`, `connectTimeout/receiveTimeout ≥ 60s`, and a single retry on 401 (fresh token) and on timeout.
- Models with `json_serializable`/`freezed`: `UserProfile`, `Commitment`, `CheckIn`, plus enums with `@JsonValue('BUILD')` etc. Convert date-only fields by taking the first 10 characters.
- Repository layer mirroring the web service methods: `load()` (profile + commitments), `create`, `update`, `pause`, `resume`, `remove`, `checkIn`, `updateProfile`.
- Screens map to the web app: sign-in/sign-up (Clerk) → commitment list (with progress) → create commitment → commitment detail (check-in kept/broken, pause/resume, edit, delete) → profile (display name, sign out).

## 8. Quick manual test (curl)

```bash
# get a token from the Clerk SDK / a signed-in web session, then:
TOKEN=...
curl -s https://lockin-a0os.onrender.com/api/v1/me -H "Authorization: Bearer $TOKEN"
curl -s https://lockin-a0os.onrender.com/api/v1/commitments -H "Authorization: Bearer $TOKEN"
```
Without a token you should get `401 {"message":"A valid bearer token is required.", ...}` — that confirms you're hitting the right server.
