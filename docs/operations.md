# Operations

## Environments — Implemented

| | URL | Hosted on | Deploys when |
|---|---|---|---|
| Client | https://jukkakot.github.io/labyrinth/ | GitHub Pages | push to `main` touching `client/`, `packages/rules/`, lockfile ("Deploy client" workflow) |
| Server | https://labyrinth-server-3z1m.onrender.com | Render free web service `labyrinth-server` (Frankfurt) | push to `main` touching `server/`, `packages/rules/`, lockfile, `render.yaml` — **after CI passes** |

- Render ids: service `srv-darps5navr4c73fmplh0`, workspace `tea-d7vbs7l7vvec73dbddt0`.
- **Free tier:** the server sleeps after ~15 min without traffic; the next request wakes it in
  about a minute. Sleeping, restarting or deploying loses all games in memory (accepted, budget
  0 €).
- Service definition is code: [`render.yaml`](../render.yaml) (Blueprint). Change settings there,
  not in the dashboard.

## Release flow — Implemented

commit → push to `main` (Claude pushes before each summary) → CI (lint, typecheck, tests, build, bundle
size, E2E smoke) → Pages deploy (client) and Render deploy (server, only after green CI). No staging
environment.

### After a deploy (manual checks)

1. Open https://jukkakot.github.io/labyrinth/ on the phone (or Playwright MCP `playwright-mobile`).
   If the server was asleep, Pelaa is greyed out with "Herätetään palvelinta…" (up to about a
   minute); then Pelaa becomes available. The footer shows "Client …" and "Server …" build times:
   they must match the Pages and Render deploys you just made (newer than the push). Enter a
   nickname and tap Pelaa → the waiting room, you are the host.
2. Open the same page in a second tab or device: the game shows in "Avoimet pelit" as
   "<name> · 1/4". Tap it → both tabs list two players; the host taps "Aloita peli" → both see the
   board, same game id.
3. Tap the game id → "Kopioitu".
4. On the current player's tab tap an edge arrow, then "Työnnä" → the line slides in both tabs.
5. In Render logs (`list_logs`, text = the game id) find `game.setup`; its seed reproduces the
   starting board: `boardToText(setupBoard(seed))`. `game.started` has the `dealSeed`, seats and
   start seat. Each `cmd.accepted` `shift` line then replays one shift with `shiftBoard`.
6. **Leave through the Render proxy:** in one tab tap the door icon → "Poistu". The tab is on the
   start screen at once and the other tab wins. In the logs for the game id, look for how the
   leave arrived: `player.left` with `code: 4000` (consented, removed at once, as intended) or
   `player.dropped` followed 5 minutes later by `player.removed { reason: "timeout" }` (the proxy
   turned the leave into a drop; the other player then waits for the removal). Record the result
   here.

## Configuration — Implemented

| Name | Where | Purpose |
|---|---|---|
| `VITE_SERVER_URL` | GitHub repository variable → client build | Server base URL |
| `VITE_BASE` | set in deploy workflow | `/labyrinth/` path on Pages |
| `ALLOWED_ORIGINS` | `render.yaml` env | CORS allow-list (comma-separated) |
| `NODE_ENV=production` | `render.yaml` env | Disables `/monitor` and `/playground` |
| `PORT` | set by Render | Server listen port |

## Logs — Implemented

All logs — server and client — end up in Render's log stream. Render stamps each line with a UTC
timestamp. Read them in the Render dashboard (service → Logs) or with Render MCP
`list_logs(resource=[service id], text=[…], startTime, endTime)`.

**Format:** one JSON object per line, keys in this order:

```
{"level":"warn","evt":"cmd.rejected","room":"brave-otters-sing","player":"r39lF4Y3r",
 "cmd":"shift","code":"REVERSE_PUSH_FORBIDDEN", …,"src":"server","ver":"a1b2c3d","msg":"…"}
```

- `level` debug/info/warn/error; production writes `info` and up (`LOG_LEVEL` overrides).
- `evt` from a fixed catalogue: server events in `server/src/logging/events.ts`, client events in
  `packages/protocol/src/log-events.ts`. Filter by `"evt":"cmd.rejected"` etc.
- `room` is the readable game id shown to players; `player` the session id.
- `src` `server` or `client`; `ver` short git commit of the side that logged (`dev` locally).
- Errors: `err` (server) or `stack` (client) inside the line — never multi-line.
- Server lines have no own timestamp in production; client lines carry the client clock in `ts`.

**What gets logged:**

| Event | When |
|---|---|
| `http.request` | every HTTP request incl. matchmaking (`/health` only at debug) |
| `room.created` / `room.disposed` / `room.error` | room lifecycle, uncaught room exceptions |
| `room.closed` | the host left the waiting room, so the game closed for everyone, `{ reason: "hostLeft" }` |
| `room.refused` | a join or creation refused, `{ reason }`: `nickname` (invalid) or `cap` (`open` games at the limit) |
| `player.joined` / `left` / `dropped` / `reconnected` | connection changes (a dropped seat is held 5 min); `joined` carries the nickname `name` |
| `player.removed` | a player is taken out of a game, `{ seat, reason, by? }` (`left`, `kicked` by seat `by`, `timeout` after 5 min disconnected) |
| `game.setup` | a new game's seed |
| `game.started` | the host started the game, `{ dealSeed, seats, startSeat }` (reproduces the deal and who began; seed never synced) |
| `treasure.collected` | a player collects their target, `{ seat, treasure, found, cards }` |
| `game.finished` | someone won, `{ winner, reason }` (seat; `home` or `lastPlayer`) |
| `turn.changed` | every turn change, `{ from, to }` seats (0 = nobody) |
| `turn.expired` | the current turn's 60 s ran out, `{ seat }`; from now on the others may kick |
| `phase.changed` | the step within a turn changes, `{ from, to, turnSeat }` (`shift` → `move`, `move` → `finished`) |
| `cmd.accepted` / `cmd.rejected` / `cmd.failed` | every room command, exactly once, with code and state facts |
| `framework.log` | Colyseus's own messages |
| `server.started` / `server.shutdown`, `process.*` | process lifecycle and fatal errors |
| `client.*` | client warnings/errors, crashes, key events (connection, rejections) |

**Client logs** are batched and sent to `POST /client-logs` (JSON as text/plain; max 50 entries,
30 requests/min per IP; IPs are never logged). Opening the game with `?debug=1` makes that one
client ship its debug and info entries too.

**Locally:** the terminal shows pretty lines and `logs/dev.log` (git-ignored) gets the JSON lines,
server and client together.

## Investigating a reported bug

Report shape: "around 14:30 in game brave-otters-sing, X happened".

1. Convert the reported local time (Europe/Helsinki) to UTC.
2. Fetch Render logs for the server service: `list_logs(resource=[service id], text=["<game id>"],
   startTime, endTime)` with a window of ±15 min (widen if needed; `direction: "forward"` gives
   chronological order). Render reads the JSON `level`, so `level: ["error"]` filters too.
   Locally, read `logs/dev.log`.
3. Follow the room timeline: `player.*`, `cmd.accepted`/`cmd.rejected`/`cmd.failed`,
   `client.error` (`src:"client"`), `framework.log`. Compare `ver` of client and server.
   Client `ts` is the device clock and can be off by seconds; order by Render's timestamp.
4. Reproduce as a failing test (rules unit test, or room test with @colyseus/testing). For UI
   bugs, reproduce with Playwright MCP (two tabs = two players).
5. Fix; the failing test stays as a regression test. Record the root cause and the log lines
   that showed it.
