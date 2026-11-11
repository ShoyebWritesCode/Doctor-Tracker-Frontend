# Doctor Tracker

Doctor Tracker is a focused administrative workspace for managing doctors, their patients, and operational trends. This repository contains the standalone Next.js client; it communicates with the separate Express API through a same-origin `/api/v1` proxy.

## Prerequisites

- Node.js `22.17.1`
- npm `10.9.2`
- The Doctor Tracker backend running locally on port `4000`

## Local setup

```bash
cp .env.example .env.local
npm ci
npm run dev
```

Open `http://localhost:3000`. Next.js proxies `/api/v1/*` requests to the configured backend target.

## Commands

| Command                 | Purpose                                 |
| ----------------------- | --------------------------------------- |
| `npm run dev`           | Start Next.js in development mode       |
| `npm run build`         | Create the production build             |
| `npm start`             | Run the production build                |
| `npm run lint`          | Run ESLint with zero warnings           |
| `npm run typecheck`     | Check TypeScript without emitting files |
| `npm test`              | Run Vitest in watch mode                |
| `npm run test:run`      | Run unit/component tests once           |
| `npm run test:coverage` | Run tests with coverage                 |
| `npm run test:e2e`      | Run Playwright browser tests            |
| `npm run format`        | Format supported files                  |
| `npm run format:check`  | Check formatting without changing files |

## Environment

`NEXT_PUBLIC_API_BASE_PATH` is the relative path used by browser requests. `API_PROXY_TARGET` is server-only and identifies the separately running Express service. Do not expose secrets through `NEXT_PUBLIC_*` values.

## API contract

- Frontend consumption rules: [`docs/api-contract.md`](./docs/api-contract.md)
- Canonical backend repository: [Doctor Tracker Backend](https://github.com/ShoyebWritesCode/Doctor-Tracker-Backend)

## Current implementation status

Phase 01 establishes the frontend foundation: strict TypeScript, App Router, Tailwind, validated environment values, TanStack Query, route boundaries, tests, and CI. Authentication and product features follow in later phases.
