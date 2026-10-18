# Development

## Backend

```bash
cd backend/lockin-api
cp .env.example .env
npm install
npm run db:generate
npm run db:migrate:deploy
npm run start:dev
```

Run quality checks with `npm run build`, `npm run typecheck`, `npm run lint`, `npm test`, and `npm run test:e2e`.

Neon CLI setup writes the linked branch's pooled runtime URL and direct migration URL to the repository-root `.env.local`. The API reads that file locally; Prisma Migrate uses `DATABASE_URL_UNPOOLED`, while runtime uses pooled `DATABASE_URL`. Do not run reset commands against a shared or production database. The recommended Node baseline is Node `22.22+`; the host may run Node 20.9+ for the Clerk SDK, but current Nest CLI development tooling warns below 22.22.

## Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Populate the copied Clerk values only after linking the intended Clerk application.
