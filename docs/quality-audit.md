# Frontend quality audit

## Scope and environment

Audit performed on 11–12 November 2026 using Node 22.17.1, npm 10.9.2, Linux x86_64, Playwright Chromium 158, and an optimized Next.js 16.4.6 webpack build. Successful requests exercised the actual Express routes and a fresh disposable MongoDB replica set. Only failure scenarios intercepted the network boundary. No deployed records or Atlas configuration were changed.

The reviewed backend fixture is pinned to `9748922575b3920ffcd7494619b8ad5bbdc3bb96` in CI. Update this reference deliberately when the integration contract changes. Separate desktop/mobile jobs prevent shared writes and login budgets from contaminating each other. The fixture is integration infrastructure, not a substitute for the backend's own production-runtime/security tests.

## Findings and corrections

| Evidence                                                                                                                      | Correction                                                                                                                                                                                                                                    | Regression coverage                                                                                   |
| ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Production sign-in rendered only a Suspense placeholder when JavaScript was disabled; development mode concealed the problem. | Read the redirect query in the server page and pass it into the client form. The full form now server-renders, with native submission disabled until hydration and an explicit JavaScript notice. Safe-redirect validation remains mandatory. | Production no-JavaScript browser test, safe redirects, login component tests.                         |
| Offline mutation default behavior paused a write indefinitely, disabling dismissal and providing no error.                    | Mutations use `networkMode: "always"` and no retries: connection failure is reported immediately, values remain, and the user explicitly retries. Writes are not silently queued for reconnect.                                               | Browser transitions offline during a completed form, observes the failure, reconnects and saves once. |
| Axe flagged the doctor breadcrumb's color-only link styling.                                                                  | Persistent underline, without changing the established visual palette.                                                                                                                                                                        | Doctor-profile axe scans at four widths.                                                              |
| Lighthouse found an h1→h3 jump in standalone mobile record directories.                                                       | Record headings default to h2; nested doctor-profile patient records explicitly use h3 under their h2 section.                                                                                                                                | Component heading tests, browser best-practice rules and Lighthouse.                                  |
| Axe's incomplete results identified unsupported `aria-label` attributes on generic count spans.                               | Ranking units are actual screen-reader text; the updating assigned-patient count is a labeled `output`.                                                                                                                                       | Count assertions and accessible-name/role scans.                                                      |
| Manual contrast calculation found tertiary text at 4.17:1 against the canvas.                                                 | Darkened the tertiary token from `#6c7975` to `#62716b`, preserving hierarchy while exceeding 4.5:1.                                                                                                                                          | Token contrast calculation plus browser color-contrast scans.                                         |

No speculative memoization, chart-library replacement, lazy-loading abstraction, or performance claim was added. Existing charts use native SVG, stable query keys, cancellation signals and retained previous list data.

## Verification

Run from the frontend repository with the backend installed as a sibling:

```bash
npm ci
npx playwright install chromium
npm run format:check
npm run lint
npm run typecheck
npm run test:run

E2E_START_BACKEND=1 E2E_PRODUCTION=1 \
E2E_BASE_URL=http://localhost:3002 API_PROXY_TARGET=http://localhost:4002 \
npm run test:e2e -- --project=desktop-chromium

E2E_START_BACKEND=1 E2E_PRODUCTION=1 \
E2E_BASE_URL=http://localhost:3002 API_PROXY_TARGET=http://localhost:4002 \
npm run test:e2e -- --project=mobile-chromium
```

Each production invocation builds its own optimized `.next-e2e` output, starts a new database, uses fictional fixture credentials, and stops its processes. The managed API and browser origins must be localhost. These tests must never point at production or a database containing user records. Missing integration credentials fail production verification instead of producing a misleading green run with skipped workflows. Browser retries are zero; failure screenshots and traces are retained.

Coverage includes authentication/expiry/sign-out, safe redirect and URL parsing, API conversion, record schemas, UTC formatting, pagination/history, create/edit/delete, conflict and missing-record recovery, loading/empty/no-match states, preserved field values, 401/403/404/409/429/500 responses, malformed JSON, offline writes, chart totals/ranges/time zones, and first-click dismissal. Phone values are preserved as entered and linked with `tel:` rather than reformatted into a guessed locale.

The audit scans sign-in and validation states, populated directories, a doctor profile, dashboard, navigation drawer, and create dialogs/errors. Widths are 360, 768, 1024 and 1440 px. Rules include WCAG A/AA through the available 2.2 tags plus best practices, with no disabled rules or excluded application regions. JSON reports are stored in ignored `test-results/` and uploaded by CI. Normal successful workflows also assert no console errors, hydration warnings or uncaught page errors. Expected HTTP failures belong to separate recovery tests.

Keyboard checks cover the skip link, current navigation, modal/drawer entry, tab containment, Escape/cancel, focus restoration, form errors and the chart slider/data table. Reduced motion is respected by the shared CSS. Loading/result updates use status regions; errors use alerts; destructive actions require confirmation. The previous development-server JSON-overlay observation did not reproduce in optimized production workflows.

### Accessibility limitations

Automated results are not a WCAG certification. Inspect axe `incomplete` results as well as violations. Radix modal focus guards/background hiding can require manual review; keyboard containment and restoration are regression-tested rather than disabling the rule. Short numerical text and partially clipped scroll-list items can prevent automated contrast calculation; the relevant foreground/surface token pairs were checked separately (action/canvas 6.36:1, secondary/canvas 6.47:1, focus/canvas 4.67:1). No actual spoken-output screen-reader session was performed. The user explicitly deferred that manual spot check; it remains pending for release review.

## Performance reproduction

Use the disposable backend on port 4002 with frontend origin `http://localhost:3002`, and the production `.next-e2e` build targeting it. Start that frontend with `E2E_ISOLATED_BUILD=1 npm start -- --port 3002`. Do not run builds or browser suites concurrently with measurements.

Lighthouse is intentionally not an application development dependency: the available profiling-tool dependency trees introduced security advisories. Install it into a temporary tool directory instead:

```bash
audit_tools=$(mktemp -d /tmp/doctor-tracker-lighthouse.XXXXXX)
npm install --prefix "$audit_tools" --no-save lighthouse@12.6.1
LIGHTHOUSE_MODULE_PATH="$audit_tools/node_modules/lighthouse/core/index.js" \
E2E_BASE_URL=http://localhost:3002 node scripts/audit-performance.mjs
```

The script launches an isolated temporary browser profile with a loopback-only debugging endpoint, signs in with the disposable fixture, creates 12 fictional doctors and 60 patients, checks each measured final URL, and writes reports to ignored `test-results/performance/`. It never reads production passwords or connects to a remote origin. Keep these temporary tool packages separate from the application; `npm audit` and `npm audit --omit=dev` both reported zero application-tree vulnerabilities at audit time.

Measurements use Lighthouse 12.6.1's simulated mobile profile (412×823, 4× CPU slowdown, 150 ms RTT, 1638.4 Kbps throughput). Authentication/storage is retained between navigations. These are single-run local lab snapshots, not cold-cache CDN results, field Core Web Vitals or an INP measurement. They cannot establish production percentile performance; repeat under representative hosting/network conditions before making that claim. Total Blocking Time is only a lab responsiveness indicator.

## Final results

All 67 unit/component tests passed (15 files). Each optimized browser project passed 25 cases without retries, including 23 accessibility scans with zero violations. The two development-gallery cases per project were intentionally skipped and the production 404 guard passed. Formatting, lint, strict type-check and optimized builds passed. Remaining final axe incomplete categories were `color-contrast` (short/clipped content) and `aria-hidden-focus` (modal focus/background review), not unsupported count labels.

Local Lighthouse snapshot of the corrected build:

| Route     | Performance | Accessibility | Best practices | LCP    | TBT    | CLS    |
| --------- | ----------- | ------------- | -------------- | ------ | ------ | ------ |
| Sign in   | 100         | 100           | 100            | 0.63 s | 7 ms   | 0.0163 |
| Dashboard | 100         | 100           | 100            | 1.20 s | 88 ms  | 0      |
| Doctors   | 98          | 100           | 100            | 1.21 s | 153 ms | 0      |
| Patients  | 99          | 100           | 100            | 1.04 s | 143 ms | 0      |

No Lighthouse runtime errors or run warnings occurred. Before the heading correction, Lighthouse accessibility scored 98 on both directories; the corrected pages scored 100. Performance scores varied between runs, so this is not evidence of a speed improvement and no performance-optimization commit is claimed. See the measurement limitations above before interpreting these scores.

Production CI now runs formatting, lint, type-check, unit tests and build, plus separate real-backend desktop/mobile browser jobs and retained audit artifacts.
