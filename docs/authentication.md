# Authentication

LockIn uses Clerk for identity. The browser uses `@clerk/nextjs`; `frontend/proxy.ts` protects application routes and `ClerkProvider` is installed at the App Router root.

The NestJS `ClerkAuthGuard` requires a bearer token, calls Clerk's supported `verifyToken` server SDK method, and attaches only the verified `sub` (Clerk user ID) and session ID to the request. Invalid, expired, malformed, or missing tokens receive a uniform `401` response.

The backend provisions `UserProfile` with an idempotent upsert keyed by `clerkId`; it does not trust email, role, or user ID provided by a client. Webhooks are intentionally not implemented because the current product needs no Clerk profile synchronization or account-deletion workflow.

## Current connection status

The repository is not linked because Clerk returned a 404 for the selected application ID under the current CLI account. No alternative application was created. Sign in to the owning Clerk account and run:

```bash
cd frontend
clerk link --app app_3KrMeVx8glLm6lK0kgePJTg5IFK
clerk env pull
```

Then copy the backend values into `backend/lockin-api/.env` from its `.env.example`. Keep `CLERK_SECRET_KEY` server-only.
