# Environment variables

Use the committed `.env.example` files as templates. Never commit `.env`, `.env.local`, secrets, database URLs, or Clerk keys.

## Frontend

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk browser SDK key. |
| `CLERK_SECRET_KEY` | Yes | Next.js server/proxy key; never exposed to client code. |
| `NEXT_PUBLIC_API_URL` | Yes for API migration | Nest API base URL. |

## Backend

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string. |
| `DATABASE_URL_UNPOOLED` | Yes for Neon migrations | Direct Neon connection string used only by Prisma Migrate. |
| `CLERK_SECRET_KEY` | Yes | Clerk token verification. |
| `FRONTEND_ORIGINS` | Yes | Comma-separated CORS and Clerk authorized-party origins. |
| `PORT` | No | API port; defaults to `3001`. |
| `NODE_ENV` | No | `development`, `test`, or `production`. |
| `CLERK_JWT_KEY` | No | Clerk PEM public key for networkless verification. |

Neon writes `DATABASE_URL` (pooled runtime connection),
`DATABASE_URL_UNPOOLED` (direct Prisma Migrate connection), and `NEON_BRANCH` to
the repository-root `.env.local` when `neon deploy` runs. Keep that file local.
