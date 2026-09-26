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
  seat 60 s for reconnection (`holdSeat`). Turn model and the `shift` command: see
  [Game flow and commands](#game-flow-and-commands--implemented-shift-rest-planned).
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
  Rooms add phase/turn to rejection lines by overriding `commandStateFacts()` (`GameRoom`:
  `phase`, `turnSeat`, `lastInsertion`).
- **Adding a command** (the `shift` command is the example):
  1. `@labyrinth/protocol`: constants and types in `game-codes.ts` (ids, error codes), the zod
     payload schema in `game-schema.ts` — separate so the client bundle never pulls in zod.
  2. `GameRoom.messages`: `name: this.command(name, schema, handler)`. The handler checks
     `requireTurn(client, phase)` (→ `NOT_SEATED` / `NOT_YOUR_TURN` / `WRONG_PHASE`) and the rule
     preconditions, then computes the result with `@labyrinth/rules` and only then writes state.
  3. Client: a method on `useGameSession` that calls `room.request()` and turns a rejection into
     a notice key `errors.<CODE>` (unknown codes → `errors.generic`), plus fi/en strings.
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

### Client structure — Implemented

```
client/src/
  App.tsx              StartScreen until playing, then GameScreen
  screens/             StartScreen (idle / connecting / error), GameScreen
  session/             useGameSession (quick play, per-tab rejoin, commands), viewModel (state → GameView)
  game/                Board, TileView, Pawn, SpareTile, ShiftTargets, ShiftControls, TurnLine,
                       GameIdBadge, treasureIcons
  ui/                  tokens.css + shared components: Screen, Message, Button, Badge, Notice,
                       LanguageSwitcher
  logging/ i18n/ config.ts CrashBoundary.tsx
```

- **UI foundation:** every colour, spacing step and radius is a token in `ui/tokens.css` (light and
  dark). Components use CSS Modules; anything shown in two places is a shared component (`Screen`
  page frame, `Message` title/text/action, `Button` primary/secondary ≥ 44 px, `Badge`, `Notice`
  floating polite status message, e.g. why a command was rejected).
- **Board rendering:** one SVG, 100 units per tile, corridor style — rounded tile, corridor arms
  from the centre to each open side, Tabler treasure icon (`game/treasureIcons.ts`, typed over
  every `TreasureId`). Fixed tiles: darker fill plus a corner notch. Corridors are clipped at the
  board edge. Pawns: seat colour (Okabe–Ito tokens `--seat-1…4`) + shape (circle, square,
  triangle, diamond), own pawn with a dashed ring.
- **Shift interaction** (`screens/GameScreen.tsx`):
  - `TurnLine` above the board: "Sinun vuorosi – työnnä laatta" or "Pelaaja 2 työntää" with the
    player's pawn shape and colour.
  - On your turn `ShiftTargets` puts an arrow badge on each of the 12 entry edge tiles; the whole
    tile is the tap target (`role="button"`, Enter/Space, labels count lines 1–7). The reverse of
    the previous shift is shown faded with `aria-disabled`.
  - Tapping an arrow previews locally with the same `shiftBoard()` the server uses: the board
    shows the shifted line, the inserted spare is outlined (`--highlight`), and `ShiftControls`
    shows the tile that would drop out. Tapping the same arrow again or "Työnnä" sends; "Peru"
    cancels; another arrow switches the preview. The rotate button turns the local spare 90°.
  - The preview and local rotation are dropped when a new synced board arrives (key: spare id,
    last insertion, turn seat) or when the server rejects the shift. While a command is pending,
    arrows and buttons wait.
  - **Slide animation:** `TileView` is positioned with a CSS `transform` and a 200 ms transition,
    and tiles are keyed by id, so tiles that change square slide (preview and real shifts alike).
    The inserted tile appears in place and the pushed-out one disappears; the global
    reduced-motion rule turns the transition off.
- **Quick play:** `joinOrCreate("game", { pool? })`; `?pool=…` in the URL keeps a group of players
  (or an E2E test) in their own games. While connecting the start screen says so, and after 5 s
  adds that the server may be waking up.

## State sync principle — Implemented (board, seats, turn); rest Planned

- Synced today (`server/src/rooms/schema/GameState.ts`):
  `players: map<sessionId, { connected, seat 1–4 }>`, `squares: array<{ id, rotation }>` (49,
  row-major), `spare: { id, rotation }`, `turnSeat` (0 = nobody), `phase` (`"shift"`),
  `lastInsertion` (`""` or an insertion id). The client rebuilds a rules `Board` from these plus the
  static `TILE_SET` (`client/src/session/viewModel.ts`). The seed is a private room field, logged
  as `game.setup`, never synced.
- Still to come with their changes: pawn squares, the `move` phase, turn deadline, found
  treasures, result. Tile kinds and treasures are static per tile id, so they are
  never synced.
- The client derives everything else with `@labyrinth/rules` (openings, reachable squares, slide
  animations from tile-id diffs, seat colour/shape).
- UI-only state (shift preview, spare rotation before sending, settings) never crosses the
  network. The seed stays on the server. Don't optimise beyond this; Colyseus sends only deltas.
- **Hidden information — Planned (`treasures-and-win`):** a player's current target goes only to that player and spectators
  (Colyseus StateView).
- **Client identity — Implemented:** the Colyseus reconnection token is kept in sessionStorage
  (`labyrinth.session`) — one player per tab; a reload rejoins the same seat, a failed rejoin
  clears the token and shows the start screen.
- **Seats — Implemented:** lowest free seat 1–4 on join; seat → start corner clockwise from the
  top-left; `maxClients = 4`, so quick play opens a new game when every game is full.

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

### Tile set, treasures and setup — Implemented

Spec: `openspec/specs/board-setup/`. Code: `packages/rules/src/tileSet.ts`, `rng.ts`, `setup.ts`.

- **One static catalogue** `TILE_SET` (50 tiles). Each id has the same kind and treasure in every
  game, so only positions, rotations and the seed are per game:

  | Ids | Tiles | Treasures |
  |---|---|---|
  | 0–15 | fixed, row-major over the fixed squares (0, 3, 12, 15 = start corners) | objects on the 12 fixed T-junctions |
  | 16–27 | movable straight | — |
  | 28–43 | movable corners | creatures on 28–33 |
  | 44–49 | movable T-junctions | creatures |

- **Treasures** (`TREASURES`, `TreasureId`): 24 own names (objects: `crown` … `chest`;
  creatures: `dragon` … `deer`), not the original game's. `treasureOf(tileId)`.
- **Fixed layout** (`FIXED_LAYOUT`), as in the original game (checked against the physical game):

  ```
  row 0   ┌  ┬  ┬  ┐      start corners open inward,
  row 2   ├  ├  ┬  ┤      edge T-junctions closed toward the edge,
  row 4   ├  ┴  ┤  ┤      inner four closed W (2,2), N (2,4), E (4,4), S (4,2)
  row 6   └  ┴  ┴  ┘
  ```

- **`setupBoard(seed)`**: seed = integer 0…2³²−1 → pure-rand `xoroshiro128plus` → Fisher–Yates
  shuffle of the 34 movable ids → 33 movable squares row-major, last one is the spare → one
  rotation draw per tile. Same seed ⇒ same board; the draw order is a contract pinned by the
  golden test in `setup.test.ts` (seed 1). Changing it is a deliberate, visible change.
- **`boardToText(board)`** (`@labyrinth/rules/testing`): box-drawing text of a board, fixed squares
  in brackets, plus the spare — use it in tests and bug reports.

### Shifting — Implemented

Spec: `openspec/specs/tile-shift/`. Code: `packages/rules/src/shift.ts`.

- Rows/cols 1, 3, 5 are pushable → 12 insertion points (`INSERTIONS`) named by the side the spare
  enters from + the line index: `N1` pushes column 1 down from the top, `S1` up from the bottom,
  `W3` pushes row 3 right from the left, `E3` left from the right. `insertionLine(id)` lists the
  line's squares entry first; `reverseOf(id)` is the opposite side, same index (`N1` ↔ `S1`).
- `shiftBoard(board, id, rotation, pawns?)` → `{ board, pawns, pushedOut }`: the line moves one
  square away from the entry, the spare goes to the entry square with the chosen (absolute)
  rotation, the tile pushed off the far end becomes the new spare with its rotation unchanged.
  Pawns on the line ride along; a pawn pushed off lands on the inserted tile. Pure: it says what a
  shift does, not whether it is allowed (the server checks turn and the no-reverse rule).
- Properties (fast-check): tile ids preserved, fixed squares unchanged, shift + reverse with the
  pushed-out tile restores board and pawns.

## Game flow and commands — Implemented (shift); rest Planned

- **Turn model — Implemented (temporary start rule):** `turnSeat` is the current player's seat.
  The first player to sit down starts (`lobby` replaces this with a random start). After an
  accepted shift, and when the current player leaves, the turn passes to the next taken seat
  clockwise (1 → 2 → 3 → 4 → 1), skipping empty seats; a player alone keeps it; a dropped player
  still holding their seat is not skipped. Every change logs `turn.changed { from, to }`.
- **`shift { insertion, rotation }` — Implemented:** rejections `NOT_SEATED`, `NOT_YOUR_TURN`,
  `WRONG_PHASE`, `REVERSE_PUSH_FORBIDDEN` (`GAME_ERROR_CODES`), a fixed line or bad rotation is
  `INVALID_COMMAND`. Accepted: squares, spare and `lastInsertion` are written from `shiftBoard()`,
  then the turn passes. `rotation` is the spare's absolute rotation; it stays client-side until
  the shift.
- **Planned:** phases `LOBBY → SHIFT → MOVE → (next player) SHIFT … → FINISHED` (`pawn-movement`
  adds `move` between the shift and the turn passing); `move{square}` (own square = stay),
  `kick{player}`; creator only: `addBot`, `removeBot`, `start`. Codes to come: `UNREACHABLE`, …
- **Bots** (`bot-player`): an ordinary seat; the decision is a pure function in rules, submitted
  through the same command wrapper as humans.
