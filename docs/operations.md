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

commit → push to `main` → CI (lint, typecheck, test, build) → Pages deploy (client) and Render
deploy (server, only after green CI). No staging environment.

## Configuration — Implemented

| Name | Where | Purpose |
|---|---|---|
| `VITE_SERVER_URL` | GitHub repository variable → client build | Server base URL |
| `VITE_BASE` | set in deploy workflow | `/labyrinth/` path on Pages |
| `ALLOWED_ORIGINS` | `render.yaml` env | CORS allow-list (comma-separated) |
| `NODE_ENV=production` | `render.yaml` env | Disables `/monitor` and `/playground` |
| `PORT` | set by Render | Server listen port |

## Logs — Implemented (format: Planned, `add-logging`)

- All logs — server and, from `add-logging` on, client logs relayed through the server — go to
  Render's log stream. Render stamps each line with a UTC timestamp.
- Read them in the Render dashboard (service → Logs) or with Render MCP
  `list_logs(resource=[service id], text=[…], startTime, endTime)`.
- Planned format: one JSON object per line, `level` and `evt` first, `room` = readable game id
  (e.g. `brave-otters-sing`). See `openspec/changes/add-logging/`.

## Investigating a reported bug

Report shape: "around 14:30 in game brave-otters-sing, X happened".

1. Convert the reported local time (Europe/Helsinki) to UTC.
2. Fetch Render logs for the server service, text filter `"room":"<game id>"`, window ±15 min
   (widen if needed). Locally, read `logs/dev.log`.
3. Follow the room timeline: `player.*`, `cmd.accepted`/`cmd.rejected`/`cmd.failed`,
   `client.error` (`src:"client"`), `framework.log`. Compare `ver` of client and server.
4. Reproduce as a failing test (rules unit test, or room test with @colyseus/testing). For UI
   bugs, reproduce with Playwright MCP (two tabs = two players).
5. Fix; the failing test stays as a regression test. Record the root cause and the log lines
   that showed it.
