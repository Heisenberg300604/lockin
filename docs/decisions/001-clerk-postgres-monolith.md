# ADR 001: Clerk, PostgreSQL, and a modular monolith

## Decision

Use Clerk for identity, PostgreSQL with Prisma 7 for application data, and a feature-oriented NestJS monolith.

## Context

The frontend has local-only IndexedDB persistence and a simulated sign-in form. It needs durable, user-owned data but has no observed requirement for teams, queues, storage, or distributed services.

## Consequences

The API stores a minimal profile keyed by Clerk ID and separately owns commitments/check-ins. This keeps password/OAuth implementation out of LockIn and allows future feature modules without premature service boundaries. Existing browser-local data is not silently migrated or uploaded.
