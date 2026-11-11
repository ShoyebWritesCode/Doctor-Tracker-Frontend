# Doctor Tracker Frontend Contract

Status: accepted for version 1

The backend OpenAPI document is the canonical HTTP contract. This document records how the Next.js application consumes it and freezes frontend-specific decisions before scaffolding.

Canonical backend files:

- `Doctor-Tracker-Backend/docs/openapi.yaml`
- `Doctor-Tracker-Backend/docs/architecture-decisions.md`

GitHub source: `https://github.com/ShoyebWritesCode/Doctor-Tracker-Backend`

Any contract change must update the OpenAPI document first, then this document and affected frontend types/tests in the same change set.

## Runtime and application choices

- Node.js: `22.17.1`.
- Package manager: npm `10.9.2` with a committed lockfile.
- Framework: Next.js App Router with strict TypeScript.
- API state: TanStack Query.
- Form state and validation: native React forms with local state and Zod.
- Filter/page/sort state: URL search parameters.
- Transient interaction state: local component state.
- Styling: Tailwind CSS backed by project-owned CSS design tokens.
- Complex accessible primitives: selective Radix UI usage, restyled for this product.
- Charts: project-owned SVG/HTML with text/table alternatives; no chart-library dependency.
- Tests: Vitest, Testing Library, Mock Service Worker, and Playwright.

Redux is not selected. Authentication and entity data are server state, list controls are URL state, and dialogs/navigation are local UI state. This decision will be revisited only if a concrete cross-route client-state requirement emerges.

## Browser-to-API topology

The browser uses relative `/api/v1/...` URLs on the Next.js origin. A Next.js rewrite proxies requests to the standalone Express service.

```text
Browser -> https://frontend.example/api/v1/*
        -> Next.js rewrite
        -> https://api.example/api/v1/*
        -> Express + MongoDB
```

This keeps the backend separately deployable while allowing a host-only, first-party session cookie. Local development uses the same browser URL pattern with Next.js port 3000 proxying to Express port 4000.

The API client always uses `credentials: "include"`. It never reads, stores, or forwards a session token from JavaScript.

## Session behavior

- Cookie name: `doctor_tracker_session`.
- Opaque token, stored only as a hash by the backend.
- Absolute session duration: 12 hours.
- Cookie is `HttpOnly`; `Secure` in production; `SameSite=Lax`; path `/api/v1`; no Domain attribute.
- Login success seeds the current-user query and redirects to a validated internal `next` path or `/dashboard`.
- The session cookie uses `Path=/api/v1`, so browsers do not send it to page routes. The portal layout's client session boundary checks `/auth/me` before displaying the workspace; there is no cookie-presence redirect in Next.js Proxy. API routes remain the authorization boundary. Future Server Components must not include private data without their own authoritative session check.
- A `401` clears private query data and returns to `/login?next=<safe-relative-path>`.
- Logout calls the API, clears private query data, and returns to login.
- Tokens are never stored in localStorage, sessionStorage, React state, or logs.

The API validates `Origin` on unsafe requests. The browser naturally provides the frontend origin through the proxy; no frontend-managed CSRF token is required for the accepted same-site topology.

## Shared envelopes

```ts
export type ApiSuccess<T> = {
  data: T;
};

export type PaginatedSuccess<T> = {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type ApiFailure = {
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string[]>;
    requestId: string;
  };
};
```

The frontend converts non-2xx JSON into one `ApiError` containing HTTP status, stable code, safe message, field errors, and request ID. Malformed/non-JSON server failures become a generic `UNEXPECTED_RESPONSE` error. Raw response bodies and stack traces are never shown.

## Core DTOs

```ts
type Admin = {
  id: string;
  name: string;
  email: string;
  status: "active" | "disabled";
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type Doctor = {
  id: string;
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
  patientCount: number;
  createdAt: string;
  updatedAt: string;
};

type DoctorSummary = Pick<Doctor, "id" | "name">;

type PatientStatus = "active" | "follow_up" | "discharged";
type PatientGender = "female" | "male" | "non_binary" | "prefer_not_to_say";

type Patient = {
  id: string;
  doctor: DoctorSummary;
  name: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null; // YYYY-MM-DD
  gender: PatientGender | null;
  condition: string;
  status: PatientStatus;
  lastVisitAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};
```

Patient create/update forms enforce at least one contact method after the user has interacted or submits. Server validation remains authoritative.

## Endpoint inventory

| Method | Path                                            | Frontend use                           |
| ------ | ----------------------------------------------- | -------------------------------------- |
| POST   | `/api/v1/auth/login`                            | Login form                             |
| POST   | `/api/v1/auth/logout`                           | Shell sign-out                         |
| GET    | `/api/v1/auth/me`                               | Protected layout/current administrator |
| GET    | `/api/v1/doctors`                               | Doctor directory                       |
| POST   | `/api/v1/doctors`                               | Add doctor                             |
| GET    | `/api/v1/doctors/:doctorId`                     | Doctor detail                          |
| GET    | `/api/v1/doctors/:doctorId/patients`            | Doctor-scoped patients                 |
| POST   | `/api/v1/doctors/:doctorId/patients`            | Add patient under doctor               |
| DELETE | `/api/v1/doctors/:doctorId/patients/:patientId` | Scoped patient deletion                |
| GET    | `/api/v1/patients`                              | Global patient directory               |
| GET    | `/api/v1/patients/:patientId`                   | Hydrate patient edit view              |
| PATCH  | `/api/v1/patients/:patientId`                   | Edit patient                           |
| DELETE | `/api/v1/patients/:patientId`                   | Global patient deletion                |
| GET    | `/api/v1/dashboard/summary`                     | Dashboard metrics and charts           |

## URL-state contract

### Doctors

- `page`: positive integer, default 1.
- `limit`: default 20; UI options remain within backend maximum 100.
- `search`: debounced case-insensitive prefix search over name/email/hospital.
- `specialization`: exact normalized value.
- `hospital`: exact normalized value.
- `createdFrom`: inclusive ISO date-time.
- `createdTo`: exclusive ISO date-time.
- `sort`: `createdAt:desc` (default), `createdAt:asc`, `name:asc`, or `name:desc`.

### Patients

- `page`, `limit`, and `search` follow doctor rules.
- `doctorId`: exact doctor ID on the global list; implied by route on doctor detail.
- `condition`: exact normalized value.
- `status`: `active`, `follow_up`, or `discharged`.
- `createdFrom` and `createdTo` use the same boundary rules.
- `sort`: creation/name sorts plus `lastVisitAt:desc` and `lastVisitAt:asc`.

Directory views omit defaults from URLs, reset `page` to 1 when another control changes, debounce search 300-400 ms, apply discrete filters immediately, and preserve state through refresh/back/forward.

### Dashboard

- `from`: inclusive local calendar date (`YYYY-MM-DD`).
- `to`: exclusive local calendar date, after `from` and at most 366 calendar days later.
- `timezone`: named IANA time zone, default `Asia/Dhaka`. Each local boundary is converted independently by the backend, including daylight-saving changes.
- Without explicit dates, the client selects the last 30 local calendar days including today. It writes all three normalized values into the URL so a shared link does not shift with the current date. Range edits fetch only after Apply; shortcuts apply immediately. Invalid URL values remain editable and disable requests.

The summary's `totals.doctors`, `totals.patients`, `totals.averagePatientsPerDoctor`, and top-ten `patientsByDoctor` ranking are all-time current-record values. `totals.patientsCreatedInRange` and zero-filled `patientsByDate` use the selected range. The client verifies every daily date, the period total, and the returned range before rendering. Ranking order is count descending, then stored doctor name and ID ascending. Counts are live reads, not a cross-query transaction snapshot; do not infer a previous period or percentage change.

## Query-key policy

Query keys contain normalized values only:

```ts
["session"];
["doctors", "list", normalizedDoctorQuery];
["doctors", "detail", doctorId];
["doctors", doctorId, "patients", normalizedPatientQuery];
["patients", "list", normalizedPatientQuery];
["patients", "detail", patientId];
["dashboard", "summary", { from, to, timezone }];
```

Mutation invalidation:

- Create doctor: doctor lists and dashboard.
- Create/delete doctor-scoped patient: scoped patient lists, global patient lists, doctor detail/list counts, and dashboard.
- Update patient: patient detail, global/scoped lists, and dashboard if a dashboard-relevant field changes.
- Delete patient: patient detail removal, global/scoped lists, doctor counts, and dashboard.

Prefer invalidation/refetch over fragile optimistic deletion. Preserve previous list data during page changes. If deletion empties the current page, navigate to the previous valid page and refetch.

## Dashboard contract

Query:

- `from`: required `YYYY-MM-DD`, inclusive.
- `to`: required `YYYY-MM-DD`, exclusive.
- `timezone`: IANA name; frontend default `Asia/Dhaka`.
- Maximum range: 366 days.

Response:

```ts
type DashboardSummary = {
  range: { from: string; to: string; timezone: string };
  totals: {
    doctors: number;
    patients: number;
    patientsCreatedInRange: number;
    averagePatientsPerDoctor: number;
  };
  patientsByDate: Array<{ date: string; count: number }>;
  patientsByDoctor: Array<{
    doctorId: string;
    doctorName: string;
    count: number;
  }>;
};
```

The backend supplies zero-filled dates and at most ten ranked doctors. The frontend does not invent missing buckets, percentages, comparisons, or trends.

## Error behavior

| Status  | Frontend behavior                                              |
| ------- | -------------------------------------------------------------- |
| 400     | Map field errors; keep user input; show safe form/page message |
| 401     | Clear private cache and redirect to login                      |
| 403     | Show access/origin failure without retry loop                  |
| 404     | Show route/resource not-found state                            |
| 409     | Show conflict in form context, such as duplicate doctor email  |
| 429     | Disable/retry according to `Retry-After`; explain rate limit   |
| 500/503 | Generic recovery UI with request ID and deliberate retry       |

Toasts announce completed background mutations. Validation and destructive-action errors stay in context. A request ID may be shown for support, but raw server details never are.

## Form constraints

Doctor:

- Name 2-120 characters.
- Specialization 2-100.
- Hospital 2-160.
- Phone 7-32 as text/tel.
- Valid email up to 254.

Patient:

- Name 2-120.
- At least one of valid email (up to 254) or phone (7-32).
- Condition 2-120.
- Status from the fixed enum.
- Optional date of birth as calendar date.
- Optional last visit as ISO date-time.
- Optional notes up to 1000.
- Doctor cannot be changed from the edit form.

Visible labels are mandatory; placeholders are examples, not labels. Forms validate on blur and submit rather than on untouched keystrokes.

## Security and privacy boundaries

- No real patient or health data in development, tests, screenshots, logs, or Git.
- No session token in JavaScript-accessible storage.
- No raw error/body logging in the browser.
- `next` redirects accept only safe internal paths.
- Destructive operations use a confirmation naming the patient and explaining permanence.
- The UI does not claim HIPAA, GDPR, or clinical compliance.

## Decisions requiring human intervention later

No account access or key is needed for Phases 00-07. Phase 08 will require the user to choose or authorize:

- MongoDB Atlas access/connection configuration.
- Backend hosting account and production environment variables.
- Frontend hosting account and production environment variables.
- Optional domain/DNS configuration.
- Optional error-monitoring provider.

The assistant must pause and provide exact, non-secret setup instructions at that time. Secrets should be entered directly into the platform, not pasted into chat.
