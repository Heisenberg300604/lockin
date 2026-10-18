# LockIn API setup

The LockIn API is a NestJS 12 application using Clerk for authentication and PostgreSQL through Prisma 7. It replaces the earlier Firebase-oriented planning note; Firebase is not used in this repository.

## Local setup

```bash
cd backend/lockin-api
cp .env.example .env
npm install
npm run db:generate
npm run db:migrate:deploy
npm run start:dev
```

Set `DATABASE_URL`, `CLERK_SECRET_KEY`, and `FRONTEND_ORIGINS` in `.env`. The API starts on `http://localhost:3001`; liveness is at `/api/v1/health/live`, readiness at `/api/v1/health/ready`, and Swagger at `/docs` outside production.

Run `npm run build`, `npm run typecheck`, `npm run lint`, `npm test`, and `npm run test:e2e` before a change is handed off.

See [architecture](architecture.md), [API](api.md), [authentication](authentication.md), and [environment variables](environment-variables.md) for the detailed contract.
