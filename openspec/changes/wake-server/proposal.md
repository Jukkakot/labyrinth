# Proposal

## Why

The free Render server sleeps after about 15 minutes idle and needs about a minute to wake. Today the wake-up only starts when the player taps Play, so the whole minute is spent staring at "Yhdistetään palvelimeen…". Starting the wake-up the moment the start screen opens hides most of that minute behind the time the player needs to read the screen, and it tells them honestly that Play is not ready yet.

## What Changes

- As soon as the app opens, the client sends one lightweight request to the server's health endpoint. This is a single wake-up per page load, not a keep-alive: the "no keep-alive pinging" rule in the NFRs still holds.
- Until the server answers, the start screen:
  - shows the Play button disabled (greyed out, still visible);
  - shows a status line "Herätetään palvelinta…", and after a few seconds adds that this can take about a minute.
- When the server answers, the status line goes away and Play becomes available.
- If the server doesn't answer, the client retries quietly for about 90 seconds. After that, Play is enabled anyway with a calm note ("Palvelin ei vastannut vielä – voit silti yrittää"), and the existing connecting and join-error flow takes over.
- A tab that rejoins its game after a reload is unchanged: the rejoin wakes the server itself.
- Workspaces touched: **client** only. The server's `GET /health` already exists and is logged only at debug level.

Out of scope:
- Animation and playability tuning of the board (deferred until tried on a phone).
- Periodic keep-alive pings, and a server-status indicator during a game.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `game-session`: the Quick play requirement gains the early wake-up. Play is unavailable (disabled and explained) until the server answers or the wait gives up.

## Impact

- **client**:
  - a small wake-up module (fetch `/health` with a timeout and retries), started once at app start;
  - `StartScreen` reads its state and disables Play;
  - new fi/en strings `start.waking`, `start.wakingSlow` and `start.wakeFailed`.
- **server**: none.
- **E2E**: the smoke test taps Play, so it now has to wait until Play is enabled. It uses a web-first assertion; against a running local server this happens at once.
- **Docs**: the Quick play section in `docs/architecture.md`, and the manual post-deploy check in `docs/operations.md`.
