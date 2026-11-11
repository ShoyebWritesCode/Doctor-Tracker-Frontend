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

Phases 01-03 provide the project foundation, accessible design system, typed API client, administrator sign-in, authoritative session checks, and responsive portal navigation. Dashboard, doctor, and patient routes are protected placeholders; their product workflows follow in later phases.

## Authentication verification

The browser accesses the backend through `/api/v1`. Use `http://localhost:3000` in development so the browser's Origin matches the backend's `FRONTEND_ORIGIN`. The session cookie is `HttpOnly` and scoped to `/api/v1`; it is never stored in browser storage. The portal waits for `/auth/me` before rendering its workspace. It rechecks sessions on navigation, focus, and browser-history restoration, and clears private query data on authentication failures and successful logout.

Start `npm run test:auth-server` in the backend repository to use a disposable MongoDB replica set and the actual authentication routes. This verification path does not need Atlas or a local `.env`. With the backend fixture running, execute:

```bash
AUTH_E2E_EMAIL=browser-test@example.test \
AUTH_E2E_PASSWORD=fictional-browser-verification-only \
npm run test:e2e -- --workers=2
```

The suite checks private cookies, login failures, safe redirects, direct navigation, refresh, session revocation, sign-out/Back navigation, keyboard interaction, and layout at 360, 768, 1024, and 1440 px. Without the two test credential variables, authentication integration cases are explicitly skipped; the login and component-gallery tests still run.

For everyday development, configure the backend `.env` with a persistent MongoDB URI and administrator seed credentials, run its seed command, and start the backend normally. `.env` and `.env.local` are ignored by Git.
