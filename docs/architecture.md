# Backend architecture

LockIn is a modular NestJS monolith in `backend/lockin-api`. It exposes a versioned REST API at `/api/v1` and uses PostgreSQL through Prisma 7.

```text
Next.js + Clerk session
        │ Bearer token
        ▼
NestJS controller → ClerkAuthGuard → feature service → PrismaService → PostgreSQL
```

## Modules

- `config` validates required runtime values at startup.
- `database` owns the Prisma 7 PostgreSQL adapter and connection lifecycle.
- `auth` verifies Clerk bearer tokens and exposes `@CurrentUser()`.
- `users` provisions the minimal application profile for a Clerk subject.
- `commitments` owns user-scoped commitment, check-in, pause/resume, and deletion operations.
- `health` provides liveness and database-readiness probes.

Controllers handle transport concerns; services enforce domain rules; Prisma is only accessed through services. No module accepts a client-provided user ID as an authorization input.

## Important decisions

- Clerk is the identity source; `UserProfile` stores only a stable Clerk ID and optional display name.
- Commitment dates use `YYYY-MM-DD`, persisted as PostgreSQL `DATE`. A commitment stores its creation timezone and the server evaluates “today” in that timezone.
- Pausing extends the end date by complete calendar days elapsed while paused.
- Custom Days are persisted as ISO weekdays (`1` Monday through `7` Sunday), not merely as a weekly count.

See [database design](database-design.md), [authentication](authentication.md), and [ADR 001](decisions/001-clerk-postgres-monolith.md).
