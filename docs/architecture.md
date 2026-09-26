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
               └────────────▶ packages/rules ◀─────────────────┘
                              pure, deterministic game logic
```

- **Monorepo**, npm workspaces: `packages/rules` (`@labyrinth/rules`), `server`
  (`@labyrinth/server`), `client` (`@labyrinth/client`). TypeScript everywhere.
- **Hosting**: client on GitHub Pages, server on Render. Details in [operations.md](operations.md).
- **No database.** Games live in server memory and are lost on restart, deploy or sleep.

## Workspaces — Implemented

| Workspace | Responsibility | Must not |
|---|---|---|
| `packages/rules` | Game rules as pure functions on plain data. Randomness only from an injected seed. | Depend on React, Colyseus or any I/O. |
| `server` | Rooms, matchmaking, command validation (via rules), state sync, bots. Source of truth. | Trust the client. |
| `client` | Rendering, input, local previews, i18n, settings. | Hold authoritative state. |

**Sharing rules without a build step:** `@labyrinth/rules` exports a `source` condition pointing
at `src/index.ts`. Vite (client), Vitest and `tsx` (server dev) resolve it, so edits are live. The
server production build (`tsconfig.build.json`) disables the condition and uses the compiled
`dist/`, which Render builds first.

## Server — Implemented

- Entry `server/src/index.ts` → `@colyseus/tools` `listen()`; config in `server/src/app.config.ts`
  (rooms, Express routes).
- Room `game` → `GameRoom`: players map with a `connected` flag; unintended disconnects hold the
  seat 60 s for reconnection.
- HTTP: `GET /health` → `{ status, rulesVersion }`. Development only: `/monitor` (room
  inspector), `/playground` (test client).
- **CORS:** Colyseus adds CORS headers to every HTTP response and by default echoes any origin.
  `server/src/cors.ts` restricts this through `matchMaker.controller.getCorsHeaders` to
  `ALLOWED_ORIGINS` (plus localhost/LAN origins outside production).

## Client — Implemented

- `client/src/main.tsx` → i18n init → `App`. Strings in `client/src/i18n/locales/{fi,en}.json`;
  Finnish is the key source of truth (type-checked), a test enforces key parity.
- Language: `?lng=en` → saved choice (localStorage) → Finnish. Browser language is ignored.
- Server URL: `client/src/config.ts` `serverUrl()` from `VITE_SERVER_URL` (localhost in dev).
- Mobile first: `100dvh`, safe-area insets, 44 px tap targets, light/dark via system.

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

## Board geometry — Planned (`add-board-model`)

- Squares `(row, col)`, 0–6, origin top-left; row grows down, col right. Directions N, E, S, W.
- A tile is its kind + rotation (clockwise 0/90/180/270); openings are derived.
- Fixed tiles where row and col are both even. Rows/cols 1, 3, 5 are pushable → 12 insertion
  points named by entry side + index (`N1` pushes column 1 down from the top).
- Start corners (0,0), (0,6), (6,6), (6,0), clockwise.

## Game flow and commands — Planned (`tile-shift` … `turn-rules`)

- Phases: `LOBBY → SHIFT → MOVE → (next player) SHIFT … → FINISHED`.
- Commands: `shift{insertion, rotation}`, `move{square}` (own square = stay), `kick{player}`;
  creator only: `addBot`, `removeBot`, `start`. Spare rotation stays client-side until the shift.
- Every command goes through one wrapper (`add-logging`): schema validation, rules validation,
  audit log line, uniform reply `{ ok }` / `{ ok: false, code }` via Colyseus `room.request()`.
  Invalid commands never change state. Codes: `INVALID_COMMAND`, `NOT_YOUR_TURN`, `WRONG_PHASE`,
  `REVERSE_PUSH_FORBIDDEN`, `UNREACHABLE`, `INTERNAL_ERROR`, …
- **Bots** (`bot-player`): an ordinary seat; the decision is a pure function in rules, submitted
  through the same command wrapper as humans.
