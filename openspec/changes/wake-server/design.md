# Design

## Context

- See proposal.md → Why.
- The server already serves `GET /health` → `{ status, rulesVersion }`. It is logged only at debug level, so wake-up requests add no log noise in production. CORS for local and production origins is handled in `server/src/cors.ts`.
- The client resolves the server base URL with `serverUrl()` (`client/src/config.ts`). A production build without `VITE_SERVER_URL` throws there.
- `StartScreen` renders from `GameSession` (`idle` / `connecting` / `error`). `SLOW_CONNECT_MS` (5 s) already drives the "server may be waking up" hint while connecting.

## Goals / Non-Goals

**Goals:**
- One wake-up per page load, started as early as possible, with a bounded number of requests.
- Play disabled and explained until the server answers, and never disabled for good.

**Non-Goals:**
- Showing server status during a game, or measuring and logging cold-start durations beyond one line.

## Decisions

### 1. A module-level singleton, not component state
`client/src/session/serverWake.ts`:
- `startServerWake(deps?)` starts the wake-up the first time it is called and returns the same promise afterwards.
- `useServerWake()` returns `{ state: "waking" | "ready" | "failed", slow: boolean }`.
- It is started from `App`, so it runs even when the tab goes straight to a rejoin. Leaving a game and returning to the start screen does not ping again.
- A singleton survives StrictMode's double effect and remounts of `StartScreen`.
- *Alternative:* an effect inside `StartScreen`. Rejected: it pings again on every remount, and a rejoining tab would start late.

### 2. Request and retry policy
- Each attempt is `fetch(serverUrl() + "/health", { cache: "no-store", signal: AbortSignal.timeout(20 s) })`, and any `2xx` means ready.
- On a network error, a timeout or a non-2xx reply (Render may answer 502/503 while spinning up), the client waits 2 s and tries again, until 90 s have passed since the start. Then the state is `failed`.
- This is at most about 10 requests per page load, and zero after success.
- `serverUrl()` throwing counts as `failed` at once: Play then shows the existing join error, which is the current behaviour for a misconfigured build.
- `slow` becomes true after `SLOW_CONNECT_MS` while still `waking`.
- `fetch`, the clock and timers are injectable (`deps`) for tests.
- *Alternative:* a WebSocket or matchmaking call. Rejected: `/health` is the cheapest and does not create rooms.

### 3. Start screen
- **`waking`:** the idle screen keeps its title and tagline. Play is rendered disabled (the shared `Button`'s disabled style is the greyed look), and a `role="status"` line under it says `start.waking`, plus `start.wakingSlow` once `slow` is true.
- **`ready`:** no status line.
- **`failed`:** Play is enabled, with the muted note `start.wakeFailed`.
- The `connecting` and `error` screens are unchanged. `StartScreen` gets the wake state as a prop (`wake`), so tests can drive it without timers.
- **Strings:**
  - fi `start.waking` "Herätetään palvelinta…", `start.wakingSlow` "Palvelin on ollut levossa. Herääminen voi kestää noin minuutin.", `start.wakeFailed` "Palvelin ei vastannut vielä – voit silti yrittää.";
  - en "Waking up the server…" / "The server was asleep. Waking up can take about a minute." / "The server hasn't answered yet – you can still try."

### 4. NFRs
- **Logging:**
  - one `client.info` line on success, `{ kind: "wake", durMs, attempts }` (shipped only in debug mode);
  - one `client.warn` line on giving up, `{ kind: "wake", attempts }`.
  - Server side, nothing new: `/health` stays at debug.
- **Limits:** bounded by the 90 s deadline, and no keep-alive, so the NFR "no keep-alive pinging; sleeping is accepted" is respected: this wakes the server only when a person opens the page.
- **Tests:**
  - unit tests of the wake module with a fake fetch and fake timers;
  - component tests of `StartScreen` for the three states.
  - The E2E smoke test needs no change: Playwright's click waits until the button is enabled.

## Risks / Trade-offs

- [Bots or link previews opening the page wake the server] → Accepted: at most one wake-up per page load, which costs nothing on the free tier.
- [Render holds the first request for the whole spin-up and it outlives the 20 s attempt timeout] → The next attempt is sent 2 s later and the spin-up continues on Render's side regardless, so the retries only shorten the wait.
- [Player waits on a disabled button although joining would already work] → Play is disabled only until the first answer, which comes almost at once when the server is awake.
