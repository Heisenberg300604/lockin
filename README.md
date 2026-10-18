<div align="center">
  <img src="docs/assets/lockin-logo.svg" alt="LockIn" width="192" />

  <p><strong>Keep promises to yourself.</strong></p>

  <p>
    <a href="https://lockin-web-app.vercel.app/">Live demo</a> ·
    <a href="#features">Features</a> ·
    <a href="#getting-started">Getting started</a> ·
    <a href="#project-structure">Project structure</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs" alt="Next.js 16" />
    <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React 19" />
    <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/NestJS-12-E0234E?logo=nestjs&logoColor=white" alt="NestJS 12" />
    <img src="https://img.shields.io/badge/Deployed%20on-Vercel-000000?logo=vercel" alt="Deployed on Vercel" />
  </p>
</div>

---

## About

**LockIn** is a commitment-driven habit companion for people who want more than an endless streak counter. Users define a clear target, set a timeline and a measurable execution rule, protect their commitment with daily check-ins, and unlock a personal reward when they follow through.

It supports two kinds of commitments:

- **Build habits** — create a positive rhythm, such as daily yoga or working out three times a week.
- **Quit habits** — protect a goal by avoiding a behavior, such as fast food or late-night scrolling.

**Live app:** [lockin-web-app.vercel.app](https://lockin-web-app.vercel.app/)

## Features

- A focused, responsive web experience designed for desktop and mobile.
- Guided six-step commitment creation flow.
- Build and quit commitment paths.
- Daily, weekly, monthly, and custom-window goal rules.
- Commitment timelines, progress, reward previews, and check-in history.
- Explicit breach logging for quit commitments.
- Commitment status views for active, paused, completed, and broken records.
- Account-scoped commitments and check-ins persisted in Neon Postgres.
- Clerk-powered sign-in/sign-up wiring; LockIn never handles user passwords.
- NestJS API with PostgreSQL/Prisma schema, Clerk bearer-token verification, user-scoped commitment endpoints, health checks, rate limiting, and Swagger.

## Tech stack

| Area | Technology |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS 4 and custom CSS |
| Data | Neon Postgres via NestJS API; IndexedDB only for one-time legacy import |
| Backend | NestJS 12, Neon Postgres, Prisma 7, Clerk |
| Validation & tests | ESLint, TypeScript, Vitest |
| Deployment | Vercel |

## Getting started

### Prerequisites

- Node.js 20.19 or newer
- npm

### Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Useful commands:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

### Run the API

```bash
cd backend/lockin-api
cp .env.example .env
npm install
npm run db:generate
npm run db:migrate:deploy
npm run start:dev
```

The API starts at `http://localhost:3001`. See [backend setup notes](docs/backend-setup.md) for environment setup, [API documentation](docs/api.md) for routes, and [authentication notes](docs/authentication.md) for Clerk linking.

## Project structure

```text
lockin/
├── frontend/                 # Next.js web application
│   └── src/
│       ├── app/              # Routes, application shell, global styles
│       ├── lib/              # IndexedDB repository and commitment services
│       └── types/            # Shared frontend domain types
├── backend/
│   └── lockin-api/           # NestJS API foundation
│       └── src/
├── docs/                     # Product and backend documentation
│   └── assets/               # Project branding assets
└── README.md
```

## Product principles

1. **A commitment has a finish line.** LockIn tracks a meaningful, time-bound promise—not an abstract streak.
2. **Rules should be measurable.** Goals are configured around what success actually means.
3. **Honest data beats perfection.** A broken commitment is recorded clearly so a user can learn and begin again.
4. **Rewards make the finish tangible.** Each commitment carries a personal reason to protect it.

## Data & privacy

Commitments, check-ins, and profile changes are stored in the signed-in member's account in Neon Postgres. Clerk owns authentication, and LockIn never handles passwords. Existing browser-only records are discovered by email and require an explicit, one-time user-confirmed import; they are never silently uploaded.

## Roadmap

- Link the selected Clerk application and supply development/production keys.
- Expand automated coverage for commitment-rule evaluation and end-to-end flows.
- Add richer completion and reward experiences.

## Contributing

1. Create a focused branch.
2. Make your change and keep the UI responsive.
3. Run frontend linting and TypeScript checks.
4. Open a pull request with a concise description and screenshots for visual changes.

## License

This project is currently private and unlicensed. All rights reserved unless a license is added.
