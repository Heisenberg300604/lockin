# Deployment

Deploy the Next.js frontend and Nest API separately. Configure the production frontend origin in `FRONTEND_ORIGINS`, use TLS at the hosting boundary, inject secrets through the host’s secret manager, and run `npm run db:migrate:deploy` before starting a new API version.

Probe `/api/v1/health/live` for liveness and `/api/v1/health/ready` for database readiness. Swagger is disabled in production. Back up PostgreSQL before destructive schema changes and use versioned Prisma migrations rather than schema resets.

Before production, link and deploy the claimed Clerk application, configure its production keys and allowed origins, and verify an authenticated browser request reaches the API with a valid bearer token.
