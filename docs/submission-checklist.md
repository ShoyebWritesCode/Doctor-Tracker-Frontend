# Submission handoff

This is documentation/handoff for the already deployed project, not a new release or infrastructure setup. The source assignment asks for separate Next.js and Express repositories, MongoDB, administrator workflows, responsive analytics and a README with setup, architecture, two decisions and screenshots.

## Requirement map

| Requirement                                     | Implemented evidence                                                                              | Reviewer check                                                                                   |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Secure authenticated portal                     | Opaque HttpOnly sessions, `/auth/me` boundary, API authorization and exact-Origin mutations       | Open a private route signed out; sign in; refresh; sign out and use Back.                        |
| Doctor creation/list/search/filter/pagination   | Doctor directory and validated real API                                                           | Create a fictional doctor; combine filters; navigate pages and refresh the URL.                  |
| Patients belonging to a doctor                  | Doctor profile with scoped list, Add patient and confirmed deletion                               | Open a doctor and create a patient there; verify the assigned count updates.                     |
| Global patient list/edit/delete                 | Dedicated Patients workspace, searchable doctor picker and partial patch                          | Locate the new record, edit it, cancel then confirm deletion.                                    |
| Dashboard totals, patients per doctor and dates | Metrics, native SVG daily trend, doctor ranking, range/time-zone controls, data-table alternative | Change the range and inspect the chart by keyboard; totals/ranking remain all-time as labeled.   |
| Modern responsive UX/navigation                 | Shared tokens/primitives, mobile record layouts and navigation drawer                             | Review dashboard/doctors/profile/patients at 360 px and desktop sizes.                           |
| Validation/error handling/state                 | Zod schemas, typed transport errors, URL filters, TanStack Query invalidation                     | Invalid submit focuses the field; a failed save preserves values; Back/Forward restores filters. |
| MongoDB query optimization                      | Backend explain-plan/index/race tests and documented residual costs                               | Inspect backend query-plan reports; do not infer production-scale guarantees.                    |
| Technical README                                | Live/repository links, clone/setup/env/scripts, diagrams and two decision deep dives              | Follow each README in a fresh directory.                                                         |
| Visual evidence                                 | Eight actual desktop/mobile screenshots in `docs/screenshots/`                                    | View them in the README; all records are synthetic.                                              |

## Reviewer access and boundaries

- Application: <https://doctor-tracker-shoyeb.vercel.app>.
- Frontend: <https://github.com/ShoyebWritesCode/Doctor-Tracker-Frontend>.
- Backend: <https://github.com/ShoyebWritesCode/Doctor-Tracker-Backend>.
- API documentation: <https://doctor-tracker-api-shoyeb.vercel.app/api-docs/openapi.json>.
- Share the production demo password privately with the recipient, never in Git or screenshots. This repository does not claim the submission has been sent or that reviewer credentials have already been delivered.
- Use fictional data only. The only actor is an administrator. Email verification, public registration, extra roles and clinical compliance are not required/implemented features.
- Spoken-output screen-reader testing remains explicitly deferred by the owner. Automated axe checks do not establish WCAG certification. The optional Docker recipe and production restore/backup procedures are not claimed as executed.

## Verification evidence

The frontend quality audit records 67 unit/component tests, 25 passing production browser cases per desktop/mobile project, 23 accessibility scans per project, the intentional development-gallery exclusions and contextualized local Lighthouse results. See [quality audit](quality-audit.md). The backend's test/performance and security reports document isolated load, transaction/count races, index evidence and limitations.

The documentation phase additionally validates OpenAPI against real disposable API responses and captures all eight screenshots from an optimized local build with the same synthetic dataset shape. No live patient mutations, reseeding, Atlas/hosting configuration changes or release tags are needed for this handoff. A normal Git push may still trigger the existing CI/automatic Vercel deployment.

Use the README's managed production browser command once for each project, with a fresh fixture per invocation. The screenshot-only test is opt-in and intentionally skipped by ordinary browser runs. Browser tests never target the deployed database.

## Screenshot maintenance

Use `BROWSER_TEST_DEMO_DATA=1` only with the disposable fixture and `E2E_CAPTURE_SCREENSHOTS=1` for the explicit capture command. Desktop is 1440×1000; mobile is 390×844; dashboard and doctor-profile captures are full-page. PNG files contain the application only, with no login password, cookie inspector, address bar or real data. Keep actual captures rather than replacing them with mockups.

## Type-check note

The pinned Next.js development generator can produce an unused `AppRouteHandlerRoutes` import in its own `dev/types/validator.ts` while an existing dev server watches metadata-route additions. TypeScript excludes only those two framework-owned development validator files. Application code remains strict, route declaration types remain included, and optimized builds still check production-generated validators. No application type-check or production validation is disabled.
