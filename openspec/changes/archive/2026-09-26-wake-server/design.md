# Design

## Context

- See proposal.md → Why.
- **Server:**
  - `GET /health` returns `{ status, rulesVersion }` (`server/src/app.config.ts`). It is Render's health check, and it is logged only at debug level, so wake-up requests add no log noise in production.
  - The server's commit id comes from `RENDER_GIT_COMMIT` (`serverVersion()` in `server/src/logging/logger.ts`).
  - The Render build runs `npm run build -w … -w @labyrinth/server` (`rimraf build && tsc`); local dev runs `tsx` without a build.
- **Client:**
  - The commit id comes from `VITE_APP_VERSION`, set in CI and in the Pages deploy (`clientVersion()`).
  - The server base URL comes from `serverUrl()`; a production build without `VITE_SERVER_URL` throws there.
  - `StartScreen` renders from `GameSession` (`idle` / `connecting` / `error`); its footer shows "Säännöt v…". `SLOW_CONNECT_MS` (5 s) already drives a "server may be waking up" hint while connecting.
- CORS for local and production origins is handled in `server/src/cors.ts`.

## Goals / Non-Goals

**Goals:**
- One wake-up per page load, started as early as possible, with a bounded number of requests.
- Play disabled and explained until the server answers, and never disabled for good.
- Build times of both sides visible without developer tools.

**Non-Goals:**
- The NFR's version-mismatch "reload" prompt; server status during a game.

## Decisions

### 1. Server build time
- **Build step:** the server `build` script writes `build/build-info.json` = `{ "builtAt": "<UTC ISO time>" }` after `tsc`, using a one-line node script (no new dependency).
- **At startup:** `app.config.ts` reads the file once. When it is missing (local `tsx` dev, tests), `builtAt` is `null`.
- **`/health`** returns `{ status, rulesVersion, version, builtAt }`. `version` is `serverVersion()`: not shown in the UI, but free and useful for tools and bug reports.
- *Alternative:* the process start time. Rejected: Render restarts and wake-ups change it, so it would not say which build runs.
- *Alternative:* a separate `/version` endpoint. Rejected: two requests or two endpoints for the same purpose.

### 2. Client build time
- `vite.config.ts` defines `__BUILD_TIME__` as the UTC ISO time of `vite build`. It is `null` for `vite` dev serve, shown as "dev".
- `client/src/config.ts` exports `clientBuiltAt(): string | null`.

### 3. The wake-up module: a singleton, not component state
`client/src/session/serverWake.ts`:
- `startServerWake(deps?)` starts on the first call and returns the same promise afterwards.
- `useServerWake()` returns `{ state: "waking" | "ready" | "failed", slow: boolean, server?: { builtAt: string | null } }`.
- It is started from `App`, so it runs even when the tab goes straight to a rejoin. Returning to the start screen after a game does not fetch again.
- A singleton survives StrictMode's double effect and remounts.
- *Alternative:* an effect in `StartScreen`. Rejected: it refetches on every remount, and a rejoining tab would start late.

### 4. Request and retry policy
- Each attempt is `fetch(serverUrl() + "/health", { cache: "no-store", signal: AbortSignal.timeout(20 s) })`, and any `2xx` means ready.
- The body is read loosely: `builtAt` is used when it is a string or `null`. A missing or odd body still counts as ready, with the server build time unknown ("?"). This keeps an older server that lacks the field usable during a deploy.
- On a network error, a timeout or a non-2xx reply (Render may answer 502/503 while spinning up), the client waits 2 s and tries again, until 90 s have passed since the start. Then the state is `failed`.
- This is at most about 10 requests per page load, and zero after success.
- `serverUrl()` throwing counts as `failed` at once: Play then leads to the existing join error, which is today's behaviour for a misconfigured build.
- `slow` becomes true after `SLOW_CONNECT_MS` while still `waking`.
- `fetch`, the clock and timers are injectable for tests.

### 5. Start screen
- **`waking`:**
  - the idle screen keeps its title and tagline;
  - Play is rendered disabled (the shared `Button`'s disabled style is the greyed look);
  - a `role="status"` line under it shows `start.waking`, plus `start.wakingSlow` once `slow` is true.
- **`ready`:** no status line.
- **`failed`:** Play is enabled, with the muted note `start.wakeFailed`.
- The `connecting` and `error` screens are unchanged.
- **Footer:** a `BuildInfo` component under the rules version, two short lines:
  - `build.client` "Client {{time}}";
  - `build.server` "Server {{time}}", or `build.serverWaking` "Server: herätetään…" / `build.serverNoAnswer` "Server: ei vastannut".
  - `time` is formatted with `Intl.DateTimeFormat(i18n.language, { dateStyle: "short", timeStyle: "short" })` in the viewer's time zone. A `null` time is `build.dev` "dev", an unknown one "?".
- `StartScreen` gets the wake state as a prop, so tests can drive it without timers.
- **Other strings:**
  - fi `start.waking` "Herätetään palvelinta…", `start.wakingSlow` "Palvelin on ollut levossa. Herääminen voi kestää noin minuutin.", `start.wakeFailed` "Palvelin ei vastannut vielä – voit silti yrittää.";
  - en "Waking up the server…" / "The server was asleep. Waking up can take about a minute." / "The server hasn't answered yet – you can still try."

### 6. NFRs
- **Logging:**
  - one `client.info` line on success, `{ kind: "wake", durMs, attempts, serverBuiltAt }` (shipped only in debug mode);
  - one `client.warn` line on giving up, `{ kind: "wake", attempts }`.
  - Server side, nothing new: `/health` stays at debug.
- **Limits:** bounded by the 90 s deadline, and no keep-alive, so "no keep-alive pinging; sleeping is accepted" still holds: the server wakes only when a person opens the page.
- **Tests:**
  - server test for the `/health` fields, with and without `build-info.json`;
  - unit tests of the wake module (fake fetch and timers);
  - component tests of `StartScreen` and `BuildInfo`.
  - The E2E smoke test needs no change: Playwright's click waits until the button is enabled.

## Risks / Trade-offs

- [Bots or link previews opening the page wake the server] → Accepted: at most one wake-up per page load, which costs nothing on the free tier.
- [Render holds the first request for the whole spin-up and it outlives the 20 s attempt timeout] → The next attempt follows 2 s later, and the spin-up continues on Render's side regardless.
- [Build time is not the commit: two builds of the same commit show different times] → Fine for "is the newest live?". The commit id is still in `/health` and in the bug-report copy line.
- [The client build time comes from the GitHub runner's clock and the server's from Render's] → Both are UTC with NTP, and both are shown in the viewer's local time.
