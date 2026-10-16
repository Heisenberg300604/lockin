# LockIn API

MVP backend foundation for LockIn, built with NestJS, Firebase Authentication, Prisma ORM 7, and Neon PostgreSQL.

## Technology choices

- **NestJS + TypeScript** — REST API, application/business rules.
- **Firebase Authentication** — Google sign-in and email/password are configured in Firebase; the API verifies Firebase ID tokens.
- **Neon PostgreSQL** — managed relational database.
- **Prisma ORM 7** — schema, typed queries, and versioned migrations.

This is a modular monolith. Do not split it into microservices for the MVP.

## Current API routes

All routes use the `/api/v1` prefix by default.

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | No | Liveness check |
| GET | `/auth/me` | Firebase ID token | Verify auth integration and return token identity |
| POST | `/commitments` | Firebase ID token | Create a commitment |
| GET | `/commitments` | Firebase ID token | List the authenticated user's commitments and recent check-ins |
| GET | `/commitments/:id` | Firebase ID token | Get one commitment and its recent check-ins |
| PATCH | `/commitments/:id` | Firebase ID token | Edit title, description, or reward while active |
| POST | `/commitments/:id/check-ins` | Firebase ID token | Create or replace a check-in for one date |

Send protected requests with:

```http
Authorization: Bearer <FIREBASE_ID_TOKEN>
Content-Type: application/json
```

The API does not accept Firebase UIDs in request bodies as proof of identity. It derives the caller identity from the verified token and scopes all commitment operations to that user.

## Setup

### 1. Prerequisites

- Node.js 20.19+ (Node 22 LTS recommended)
- npm
- A Firebase project with Authentication providers configured
- A Neon PostgreSQL database

### 2. Install packages

```bash
npm install
```

### 3. Configure environment variables

Copy `.env.example` to `.env` and set the real values:

```bash
cp .env.example .env
```

In PowerShell:

```powershell
Copy-Item .env.example .env
```

Get both Neon connection strings from the Neon console:

- `DATABASE_URL`: pooled connection string for API runtime queries.
- `DIRECT_URL`: direct, non-pooled connection string for Prisma migrations.

Prisma 7 loads the CLI datasource URL from `prisma.config.ts`; don't commit `.env` or real connection strings.

### 4. Configure Firebase Admin credentials

In Firebase Console, open **Project settings → Service accounts**, generate a private key, and save the downloaded JSON locally as:

```text
secrets/firebase-service-account.json
```

Create the `secrets` directory if it doesn't exist. Set `GOOGLE_APPLICATION_CREDENTIALS` to that path in `.env`. Never commit this JSON key. Make sure `FIREBASE_PROJECT_ID` matches the Firebase project used by the Flutter app.

In Firebase Console → Authentication → Sign-in method, enable Google and Email/Password.

### 5. Generate Prisma Client and run migrations

After `.env` contains valid `DIRECT_URL` and `DATABASE_URL` values:

```bash
npm run db:generate
npm run db:migrate -- --name init
```

The first migration creates the initial User, Commitment, and CheckIn tables/enums. Prisma's generated code is written to `src/generated/prisma/` and is intentionally ignored by Git; regenerate it after cloning and whenever the schema changes.

### 6. Run the API

```bash
npm run start:dev
```

Open `http://localhost:3000/api/v1/health`; expected response:

```json
{"status":"ok","service":"lockin-api"}
```

## Example payloads

### Create a weekly gym commitment

`POST /api/v1/commitments`

```json
{
  "title": "Gym Consistency Challenge",
  "description": "Train at least four times in each week.",
  "type": "BUILD_HABIT",
  "startDate": "2026-10-19",
  "endDate": "2027-01-16",
  "timeZone": "Asia/Kolkata",
  "ruleFrequency": "WEEKLY",
  "targetCount": 4,
  "reward": "Buy new headphones"
}
```

### Record a successful workout

`POST /api/v1/commitments/<commitment-id>/check-ins`

```json
{
  "date": "2026-10-19",
  "outcome": "SUCCESS",
  "quantity": 1,
  "note": "Upper-body session"
}
```

`quantity` is the total number of goal units recorded for that date. Submitting the same commitment/date again updates that date's record rather than creating a duplicate.

### Record a successful quit-habit day

```json
{
  "date": "2026-10-19",
  "outcome": "SUCCESS",
  "note": "No fast food today"
}
```

## Important MVP rule assumptions

1. One check-in record is stored per commitment per date. This is suited to daily outcomes and per-day quantities. It is not an append-only audit log.
2. A `BUILD_HABIT` check-in must have outcome `SUCCESS`; an unchecked date represents no recorded success.
3. A `QUIT_HABIT` check-in with outcome `VIOLATION` marks the commitment `FAILED` immediately. This is a provisional product rule based on the PRD and should be reconsidered if the product should allow users to recover after a slip.
4. **The full completion/progress rule engine is not implemented yet.** The API stores rule configuration and check-in data, but weekly/monthly/custom-window completion, missed-period decisions, automatic completion at end date, and accurate dashboard percentages need a dedicated domain service and explicit product semantics before being treated as finished.

## Folder structure

```text
lockin-backend/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── auth/
│   │   ├── decorators/current-user.decorator.ts
│   │   ├── guards/firebase-auth.guard.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.module.ts
│   │   ├── authenticated-user.ts
│   │   └── firebase-auth.service.ts
│   ├── check-ins/
│   │   ├── dto/upsert-check-in.dto.ts
│   │   ├── check-ins.controller.ts
│   │   ├── check-ins.module.ts
│   │   └── check-ins.service.ts
│   ├── commitments/
│   │   ├── dto/create-commitment.dto.ts
│   │   ├── dto/update-commitment.dto.ts
│   │   ├── commitments.controller.ts
│   │   ├── commitments.module.ts
│   │   └── commitments.service.ts
│   ├── common/date-only.ts
│   ├── health/health.controller.ts
│   ├── health/health.module.ts
│   ├── prisma/prisma.module.ts
│   ├── prisma/prisma.service.ts
│   ├── app.module.ts
│   └── main.ts
├── .env.example
├── .gitignore
├── nest-cli.json
├── package.json
├── prisma.config.ts
├── tsconfig.build.json
└── tsconfig.json
```

## Next implementation milestone

Before implementing the dashboard's numbers, define the evaluation semantics for daily, weekly, monthly, and custom windows. In particular, decide whether windows align to calendar periods or to the commitment start date, how missed periods are handled, and when a commitment becomes completed or failed. Then implement this in a tested `progress/` or `rules/` domain service rather than in controllers.
