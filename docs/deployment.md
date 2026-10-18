# Deployment

Deploy the Next.js frontend and Nest API separately. Configure the production frontend origin in `FRONTEND_ORIGINS`, use TLS at the hosting boundary, inject secrets through the host’s secret manager, and run `npm run db:migrate:deploy` before starting a new API version.

## API container

The API has a production Dockerfile at `backend/lockin-api/Dockerfile`, suitable for Render, Railway, Fly.io, Google Cloud Run, or another container host:

```bash
docker build -t lockin-api backend/lockin-api
docker run --rm -p 3001:3001 --env-file backend/lockin-api/.env lockin-api
```

Set these values in the backend host's secret manager, never in the image or repository:

```text
NODE_ENV=production
PORT=<host-provided port>
DATABASE_URL=<Neon pooled runtime URL>
CLERK_SECRET_KEY=<production Clerk secret>
FRONTEND_ORIGINS=https://lockin-web-app.vercel.app
```

Run `npm run db:migrate:deploy` once as a release step using `DATABASE_URL_UNPOOLED` before rolling out an image. Do not run migrations in every application container, because parallel instances can race during deploys.

After the API has a public TLS URL, set Vercel's `NEXT_PUBLIC_API_URL` to `https://<api-domain>/api/v1`, redeploy the frontend, and add that API domain to the Clerk application's allowed origins as needed.

## Continuous integration

GitHub Actions verifies the backend in `.github/workflows/backend-ci.yml` and the frontend in `.github/workflows/frontend-ci.yml`. Before enabling the frontend build workflow, add repository secrets `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`, plus a repository variable `NEXT_PUBLIC_API_URL`. The API URL variable should point to a non-production test API if you later add browser end-to-end tests.

Probe `/api/v1/health/live` for liveness and `/api/v1/health/ready` for database readiness. Swagger is disabled in production. Back up PostgreSQL before destructive schema changes and use versioned Prisma migrations rather than schema resets.

Before production, link and deploy the claimed Clerk application, configure its production keys and allowed origins, and verify an authenticated browser request reaches the API with a valid bearer token.
