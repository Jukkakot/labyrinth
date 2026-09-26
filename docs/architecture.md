# Architecture

Status markers: **Implemented** = in the code on `main`; **Planned (`change`)** = agreed
convention, delivered by that roadmap change.

## Overview — Implemented

```
 Browser (mobile first)                          Render (free, Frankfurt)
┌──────────────────────────────┐   WebSocket   ┌─────────────────────────────┐
│ client  React 19 + Vite      │◀────────────▶│ server  Colyseus 0.18        │
│  i18next (fi default, en)    │   + HTTP      │  one Room per game          │
│  uses @labyrinth/rules for   │               │  authoritative: validates   │
│  previews and highlights     │               │  every command              │
└──────────────┬───────────────┘               └──────────────┬──────────────┘
               │ imports                                       │ imports
               ├────────────▶ packages/rules ◀─────────────────┤
               │              pure, deterministic game logic   │
               └────────────▶ packages/protocol ◀──────────────┘
                              shared contract: log events, command results
```

- **Monorepo**, npm workspaces: `packages/rules` (`@labyrinth/rules`), `packages/protocol`
  (`@labyrinth/protocol`), `server` (`@labyrinth/server`), `client` (`@labyrinth/client`).
  TypeScript everywhere.
- **Hosting**: client on GitHub Pages, server on Render. Details in [operations.md](operations.md).
- **No database.** Games live in server memory and are lost on restart, deploy or sleep.

## Workspaces — Implemented

| Workspace | Responsibility | Must not |
|---|---|---|
| `packages/rules` | Game rules as pure functions on plain data. Randomness only from an injected seed. | Depend on React, Colyseus or any I/O. |
| `server` | Rooms, matchmaking, command validation (via rules), state sync, bots. Source of truth. | Trust the client. |
| `client` | Rendering, input, local previews, i18n, settings. | Hold authoritative state. |
| `packages/protocol` | What client and server must agree on: log event catalogue and batch schema, command result type and common error codes (later: command payload schemas). Marked side-effect free; zod schemas sit in their own modules so the client bundle drops them. | Contain game logic or runtime behaviour. |

**Sharing packages without a build step:** `@labyrinth/rules` and `@labyrinth/protocol` export a
`source` condition pointing at `src/index.ts`. Vite (client, also its `ssr` resolution for
Vitest), server Vitest and `tsx` (server dev) resolve it, so edits are live. The server production
build (`tsconfig.build.json`) disables the condition and uses the compiled `dist/`, which Render
builds first.

## Server — Implemented

- Entry `server/src/index.ts` → `@colyseus/tools` `listen()`; config in `server/src/app.config.ts`
  (rooms, Express routes).
- Every room extends `LoggedRoom` (`server/src/rooms/LoggedRoom.ts`), which gives it:
  - a **readable room id** (`brave-otters-sing`, `human-id`, unique among running rooms) — the id
    players see and the `room` field in every log line;
  - lifecycle log lines and logging of uncaught exceptions in hooks and timers;
  - `this.command(name, zodSchema, handler)` — the **only** way to define a command (below).
- Room `game` → `GameRoom`: players map with a `connected` flag; unintended disconnects hold the
  seat 60 s for reconnection (`holdSeat`).
- HTTP: `GET /health` → `{ status, rulesVersion }`; `POST /client-logs` (client log batches).
  Development only: `/monitor` (room inspector), `/playground` (test client).
- **Logging** (`server/src/logging/`): pino JSON lines to stdout; details in
  [operations.md → Logs](operations.md#logs--implemented). HTTP requests are audited on the Node
  HTTP server, not in Express, because Colyseus answers matchmaking before Express.

### Commands and rejection contract — Implemented

- Clients send commands with `room.request(name, payload)` and always get back
  `CommandResult` (`@labyrinth/protocol`): `{ ok: true }` or `{ ok: false, code }`.
- `LoggedRoom.command()` validates the payload with zod (→ `INVALID_COMMAND`), runs the handler,
  and writes exactly one audit line (`cmd.accepted` / `cmd.rejected` / `cmd.failed`). An
  unexpected exception becomes `INTERNAL_ERROR`; the room keeps running.
- A handler rejects by throwing `CommandRejection(code, facts)` **before changing state**.
  Rooms add phase/turn to rejection lines by overriding `commandStateFacts()`.
- **CORS:** Colyseus adds CORS headers to every HTTP response and by default echoes any origin.
  `server/src/cors.ts` restricts this through `matchMaker.controller.getCorsHeaders` to
  `ALLOWED_ORIGINS` (plus localhost/LAN origins outside production).

## Client — Implemented

- `client/src/main.tsx` → i18n init → `App`. Strings in `client/src/i18n/locales/{fi,en}.json`;
  Finnish is the key source of truth (type-checked), a test enforces key parity.
- Language: `?lng=en` → saved choice (localStorage) → Finnish. Browser language is ignored.
- Server URL: `client/src/config.ts` `serverUrl()` from `VITE_SERVER_URL` (localhost in dev).
- Mobile first: `100dvh`, safe-area insets, 44 px tap targets, light/dark via system.
- **Logging** (`client/src/logging/`): `log.warn(evt, fields, msg)` etc. on pino's browser build;
  entries are batched to `POST /client-logs` (every 5 s, at once on errors, keepalive on page
  hide). Global `error`/`unhandledrejection` handlers and `CrashBoundary` (calm localized reload
  screen) log `client.error`. `setLogContext({ room, player })` tags entries with the game.
- Build version `VITE_APP_VERSION` = short commit (set in CI and the Pages deploy).

## State sync principle — Planned (`show-board`)

- The server syncs only authoritative facts that cannot be derived: tile ids and rotations per
  square and spare, last insertion, pawn squares, phase, current player, turn deadline, found
  treasures, player flags, result. Tile kinds and treasures per tile are static per game and sent
  once.
- The client derives everything else with `@labyrinth/rules` (openings, reachable squares, slide
  animations from tile-id diffs, seat colour/shape).
- UI-only state (shift preview, spare rotation before sending, settings) never crosses the
  network. The seed stays on the server. Don't optimise beyond this; Colyseus sends only deltas.
- **Hidden information:** a player's current target goes only to that player and spectators
  (Colyseus StateView).
- **Client identity:** Colyseus reconnection token in sessionStorage — one player per tab.

## Board model — Implemented

Spec: [`openspec/specs/board/`](../openspec/specs/). Code: `packages/rules/src/` —
`geometry.ts` (squares, directions), `tile.ts` (kinds, openings, rotation), `board.ts` (board,
fixed squares, connections).

- **Squares** `(row, col)`, 0–6, `(0,0)` top-left; row grows down, col right. `square()` throws
  `RangeError` off the board; `neighbour()` returns `undefined` beyond the edge.
- **Directions** N (toward row 0), E, S, W; `DIRECTIONS` is clockwise order.
- **Tiles** are plain data `{ id, kind, rotation }`: kind `straight` | `corner` | `tee`
  (T-junction), rotation 0/90/180/270 clockwise. Openings are derived, never stored: at 0° the
  shapes read like the letters I (N, S), L (N, E) and T (E, S, W). `rotate(tile, steps)` keeps id
  and kind. Tile ids (0…49) never change — the client animates tiles by id.
- **Board** = `{ squares: Tile[49] (row-major), spare: Tile }`, frozen, JSON round-trips through
  `createBoard()`, which is the only validating entry point (49 squares, spare, unique ids, valid
  kinds/rotations). Other functions trust a valid board.
- **Fixed squares**: row and column both even (16 squares, `FIXED_SQUARES`); fixedness comes from
  the position, not from the tile. `START_CORNERS` (0,0), (0,6), (6,6), (6,0), clockwise.
- **Connections**: orthogonal neighbours are connected when each tile is open toward the other;
  an opening toward the board edge leads nowhere. `connectedNeighbours()` is the building block
  for reachability (`pawn-movement`).
- **Test fixtures**: `@labyrinth/rules/testing` — `boardFromRows(["L90 I0 T0 …" × 7], "I0")`
  (ids assigned row-major, spare = 49), `uniformBoard()`, `withTile()`.

### Shifting — Planned (`tile-shift`)

- Rows/cols 1, 3, 5 are pushable → 12 insertion points named by entry side + index (`N1` pushes
  column 1 down from the top).

## Game flow and commands — Planned (`tile-shift` … `turn-rules`)

- Phases: `LOBBY → SHIFT → MOVE → (next player) SHIFT … → FINISHED`.
- Commands: `shift{insertion, rotation}`, `move{square}` (own square = stay), `kick{player}`;
  creator only: `addBot`, `removeBot`, `start`. Spare rotation stays client-side until the shift.
- Each command is defined with `this.command()` (see Commands and rejection contract above).
  Game codes to come: `NOT_YOUR_TURN`, `WRONG_PHASE`, `REVERSE_PUSH_FORBIDDEN`, `UNREACHABLE`, …
- **Bots** (`bot-player`): an ordinary seat; the decision is a pure function in rules, submitted
  through the same command wrapper as humans.
