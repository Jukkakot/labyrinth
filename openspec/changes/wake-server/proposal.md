# Proposal

## Why

Two problems with the start screen:
- **Slow first tap.** The free Render server sleeps after about 15 minutes idle and needs about a minute to wake. Today the wake-up only starts when the player taps Play, so the whole minute is spent on "Yhdistetään palvelimeen…". Starting the wake-up the moment the start screen opens hides most of that minute behind the time the player needs to read the screen, and it says honestly that Play is not ready yet.
- **No way to see what is live.** After pushing, there is no way to see whether the newest client (GitHub Pages) and the newest server (Render) are actually live. Showing both build times on the start screen answers that at a glance, and fetching the server's build time doubles as the wake-up request.

## What Changes

- **Server:** the health endpoint also reports when the running server was built (and its commit id, for logs and tools). This is still one endpoint, so Render's health check keeps working.
- **Wake-up:** as soon as the app opens, the client fetches this build info from the server once. This is a single wake-up per page load, not a keep-alive: the "no keep-alive pinging" rule in the NFRs still holds.
- **Until the server answers**, the start screen:
  - shows the Play button disabled (greyed out, still visible);
  - shows a status line "Herätetään palvelinta…", and after a few seconds adds that this can take about a minute.
- **When the server answers**, the status line goes away and Play becomes available.
- **If the server doesn't answer**, the client retries quietly for about 90 seconds. After that, Play is enabled anyway with a calm note ("Palvelin ei vastannut vielä – voit silti yrittää"), and the existing connecting and join-error flow takes over.
- **Build times in the footer.** Under the rules version, the start screen footer shows the build time of the client and of the server, in the viewer's local time and language, for example "Client 26.9.2026 18.40" and "Server 26.9.2026 18.35". Until the server answers, its line says it is being woken; if it never answers, the line says so. Local development builds show "dev".
- A tab that rejoins its game after a reload is unchanged: the rejoin wakes the server itself.
- Workspaces touched: **server** (build time in the health response) and **client** (wake-up, start screen, footer).

Out of scope:
- Animation and playability tuning of the board (deferred until tried on a phone).
- Periodic keep-alive pings, and server status or versions during a game.
- The "new version available, reload" prompt from the NFRs (versioning).

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `game-session`: the Quick play requirement gains the early wake-up. Play is unavailable (disabled and explained) until the server answers or the wait gives up.
- `observability`: the start screen shows the client's and the server's build times, and the server reports its build time.

## Impact

- **server**:
  - the build writes the build time into its output;
  - `GET /health` returns it (`builtAt`), plus the commit id (`version`).
- **client**:
  - the build time is baked in at build;
  - a small wake-up module (fetches `/health` with a timeout and retries), started once at app start;
  - `StartScreen` disables Play while waking and shows the build-time lines in its footer;
  - new fi/en strings.
- **E2E**: the smoke test taps Play, and Playwright's click already waits until the button is enabled. No change is expected.
- **Docs**: the Quick play section in `docs/architecture.md`; the post-deploy checks in `docs/operations.md` (compare the build times on the start screen).
