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
  seat 5 min for reconnection (`holdSeat`); turn clock, kicks and removals: see the game flow section. Turn model, the `shift` / `move` commands, treasures and winning: see
  [Game flow and commands](#game-flow-and-commands--implemented-shift-move-collect-win-rest-planned).
- HTTP: `GET /health` → `{ status, rulesVersion, version, builtAt }` (`version` = short commit from
  `RENDER_GIT_COMMIT` or `"dev"`; `builtAt` = build time, `null` without a build). It is Render's
  health check and the client's wake-up request. `POST /client-logs` (client log batches).
- **Build time:** the server `build` script writes `build/build-info.json` (`{ builtAt }`, UTC ISO)
  after `tsc`; `server/src/buildInfo.ts` reads it once at startup. `tsx` dev and tests have no
  file, so `builtAt` is `null`.
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
  `phase`, `turnSeat`, `lastInsertion`, `pawn`).
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
- Build version `VITE_APP_VERSION` = short commit (set in CI and the Pages deploy). Build time
  `__BUILD_TIME__` (UTC ISO of `vite build`, `null` for the dev server and tests) is defined in
  `vite.config.ts` and read with `clientBuiltAt()` (`client/src/config.ts`).

### Client structure — Implemented

```
client/src/
  App.tsx              StartScreen until playing, then GameScreen
  screens/             StartScreen (idle / connecting / error), GameScreen
  session/             useGameSession (quick play, per-tab rejoin, commands), viewModel (state → GameView)
  game/                Board, TileView, Pawn, PawnLayer (+ pawnMotion), SpareTile, ShiftTargets,
                       ShiftControls, MoveTargets, MoveControls, GameOverControls, TurnLine,
                       PlayerStrip, GameIdBadge, treasureIcons, target (TargetMark),
                       TurnTimer (+ turnClock), KickControl
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
  triangle, diamond), own pawn with a dashed ring. Pawns stand on their synced squares; pawns
  sharing a square are drawn at 60 % in their seat's quadrant (seat 1 top-left … seat 4
  bottom-left), so nobody jumps around when another pawn arrives. The pawn layer never catches
  taps (`pointer-events: none`), so move targets under pawns stay tappable.
- **Shift interaction** (`screens/GameScreen.tsx`):
  - `TurnLine` above the board names the player and the step: "Sinun vuorosi – työnnä laatta" /
    "Sinun vuorosi – siirrä nappulaa", or "Pelaaja 2 työntää" / "Pelaaja 2 siirtää", with the
    player's pawn shape and colour.
  - On your turn `ShiftTargets` puts an arrow badge on each of the 12 entry edge tiles; the whole
    tile is the tap target (`role="button"`, Enter/Space, labels count lines 1–7). The reverse of
    the previous shift is shown faded with `aria-disabled`.
  - Tapping an arrow previews locally with the same `shiftBoard()` the server uses: the board
    shows the shifted line, the inserted spare is outlined (`--highlight`), and `ShiftControls`
    shows the tile that would drop out. Tapping the same arrow again or "Työnnä" sends; "Peru"
    cancels; another arrow switches the preview. The rotate button turns the local spare 90°.
    The preview passes the pawn squares to `shiftBoard()` too, so pawns on the line are shown
    where the shift would carry them.
  - The preview and local rotation are dropped when a new synced board arrives (key: spare id,
    last insertion, turn seat, step) or when the server rejects the shift. While a command is
    pending, arrows and buttons wait.
  - **Slide animation:** `TileView` is positioned with a CSS `transform` and a 200 ms transition,
    and tiles are keyed by id, so tiles that change square slide (preview and real shifts alike).
    The inserted tile appears in place and the pushed-out one disappears; the global
    reduced-motion rule turns the transition off.
- **Move interaction** (move step; `GameView.reachable` = `reachableSquares()` of the viewer's
  pawn, only on their own move step):
  - `MoveTargets` outlines every reachable square (dashed outline + hub dot, not colour alone);
    the whole tile is the tap target and tapping sends `move` at once (no confirmation yet; the
    optional one comes with `settings`). The own square means stay.
  - `MoveControls` replaces `ShiftControls` in the same slot: the spare, the hint "Napauta
    korostettua ruutua" and the "Jää paikalleen" button. No arrows, no rotate button.
  - **Pawn motion** (`PawnLayer` + `pawnMotion.ts`): when a pawn's square changes it walks a
    `shortestPath()` square by square (step `min(120 ms, 900 ms / steps)`, CSS transform
    transitions, timers for the steps); if the spare changed at the same time it was a shift, so
    the pawn slides one square (200 ms, with its tile) or jumps when it wrapped to the inserted
    tile. No path or `prefers-reduced-motion` → jump. A newer change finishes a walk at once.
    The motion is derived during render from the last seen squares; only the remaining walk
    steps run in an effect.
- **Treasures and result** (`GameView.myTarget`, `targetTileId`, per-seat `cards`/`found`,
  `winnerSeat`, `finished`):
  - The viewer's target is marked **by tile id** (`targetTileId()` from rules: the treasure's tile,
    or the start-corner tile when heading home), so the mark follows the tile through previews,
    slides and onto the spare / the dropping-out tile. `TileView` draws a solid `--target` ring
    plus a flag badge (home: house badge), distinct from the dashed move outline and the orange
    preview outline; the accessible name says "Kohteesi: …" / "Kotiruutusi …".
  - `PlayerStrip` between the turn line and the board: one chip per seat (pawn, found/cards); the
    viewer's chip also shows the target icon. A visually hidden summary sentence per chip is the
    accessible text.
  - When the viewer's `found` grows, `GameScreen` shows "Löysit: …" in the shared `Notice` (a
    rejection message wins if both happen).
  - Finished: `isMyTurn` is false, `TurnLine` shows "Voitit!" / "Pelaaja N voitti" with the
    winner's pawn, and `GameOverControls` ("Uusi peli") replaces the step controls; it calls
    `useGameSession().leave()` → `room.leave()` → the normal leave handling (token cleared, start
    screen).
- **Turn clock, kicks and departures** (`GameView.turnDeadline`, `turnExpired`, `turnDisconnected`,
  `canKick`):
  - `TurnTimer` at the end of `TurnLine`: `m:ss` from `turnDeadline − Date.now()`, clamped to
    0–60 s (`turnClock.ts`) so phone clock skew cannot show nonsense; ticks every 250 ms and only
    re-renders itself; `role="timer"` (not announced every second) with an "Aikaa jäljellä …" label.
    The last 10 s and "Aika loppui" are bold, `--danger` and use an alarm icon instead of the clock.
    A dropped current player reads "Pelaaja N – yhteys katkennut".
  - `KickControl` replaces the (disabled) step controls for other seated players while
    `turnExpired`: "Pelaajan N aika loppui" + "Poista pelaaja N" → "Poistetaanko pelaaja N
    pelistä?" with "Peru" / "Poista". It is keyed by the turn key, so a pending confirmation
    vanishes when the turn changes. Only `turnExpired` (the server) enables it, never the local
    countdown.
  - `PlayerStrip`: a dropped player's chip is dashed with a faded pawn and a `wifi-off` icon, and
    its accessible text adds "yhteys katkennut"; text contrast is unchanged.
  - `GameScreen` notices a seat disappearing from a running game and shows "Pelaaja N poistui
    pelistä" in the shared `Notice` (after rejection and collect messages).
  - Kicked: the room closes with 4100; `useGameSession` sets `endReason: "kicked"` and the start
    screen says "Sinut poistettiin pelistä, koska vuorosi aika loppui." until the next Play.
- **Quick play:** `joinOrCreate("game", { pool? })`; `?pool=…` in the URL keeps a group of players
  (or an E2E test) in their own games. While connecting the start screen says so, and after 5 s
  adds that the server may be waking up.
- **Early wake-up** (`client/src/session/serverWake.ts`): `App` starts it once per page load
  (a module singleton, so StrictMode, remounts and a rejoining tab do not refetch). It fetches
  `/health` with a 20 s timeout per attempt and retries every 2 s on errors or non-2xx replies
  until 90 s have passed; after an answer it never contacts the server again (no keep-alive).
  States: `waking` (Play disabled, "Herätetään palvelinta…", after 5 s also "can take about a
  minute"), `ready` (Play enabled), `failed` (Play enabled with a calm note; the normal connecting
  and join-error flow follows). A missing server URL is `failed` at once. The body is read loosely:
  a reply without `builtAt` is still `ready`, with the server time unknown. Logs one `client.info`
  (`kind: "wake"`, `durMs`, `attempts`, `serverBuiltAt`) or `client.warn` line.
- **Build times in the start screen footer** (`BuildInfo`): "Client …" and "Server …" in local time
  and the UI language (shared `formatDateTime`, also used by the bug-report copy line); "dev" for a
  build without a time, "?" when unknown, "Server: herätetään…" / "Server: ei vastannut" while
  waking or after giving up.

## State sync principle — Implemented (board, seats, pawns, turn, treasures, turn clock); rest Planned

- Synced today (`server/src/rooms/schema/GameState.ts`):
  `players: map<sessionId, { connected, seat 1–4, row, col, cards, found[], target }>` (`row`/`col` =
  pawn square; `cards` = stack size and `found` = collected treasures, both public; `target` =
  current treasure or `""` when heading home, **view-filtered**),
  `squares: array<{ id, rotation }>` (49, row-major), `spare: { id, rotation }`, `turnSeat`
  (0 = nobody), `phase` (`"shift"` → `"move"`, `"finished"` after a win), `winnerSeat` (0 = none),
  `lastInsertion` (`""` or an insertion id), `turnDeadline` (server epoch ms when the turn's time
  runs out, 0 = no clock; for the countdown only) and `turnExpired` (the server's "time is up",
  which alone enables kicking). The client rebuilds a rules `Board` from these plus the
  static `TILE_SET` (`client/src/session/viewModel.ts`). The seed is a private room field, logged
  as `game.setup`, never synced.
- Tile kinds and treasures are static per tile id, so they are never synced. The treasure stacks and the deal seed stay on the server.
- The client derives everything else with `@labyrinth/rules` (openings, reachable squares, slide
  animations from tile-id diffs, seat colour/shape).
- UI-only state (shift preview, spare rotation before sending, settings) never crosses the
  network. The seed stays on the server. Don't optimise beyond this; Colyseus sends only deltas.
- **Hidden information — Implemented:** `Player.target` is a view-tagged field
  (`t.string().view()`). Each client gets a `StateView` holding only its own `Player`
  (`GameRoom.showOwnPlayer`, on join and again on reconnect; disposed on leave), so only that
  client decodes its target; untagged fields stay visible to everyone. A room test decodes the
  state as another client to prove nothing leaks. Spectators seeing every target: Planned
  (`spectators-and-rematch`).
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
  for reachability.
- **Movement** (`packages/rules/src/move.ts`, spec `openspec/specs/pawn-movement/`):
  `reachableSquares(board, from)` (BFS over connected neighbours; `from` first, rest row-major),
  `isReachable(board, from, to)`, `shortestPath(board, from, to)` → `[from, …, to]` or
  undefined. Pawns never block, so these take no pawns. Properties: own square always reachable,
  reachability symmetric, every path step connected.
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

### Treasures and winning — Implemented

Spec: `openspec/specs/treasures/`. Code: `packages/rules/src/treasures.ts`.

- `dealTreasures(seed, seatCount)` (2–4): seeded `shuffle()` of `TREASURES`, cut into consecutive
  stacks of 24 / n, seat 1 first. The first card is the first target.
- `homeSquare(seat)`, `homeTileId(seat)` (start-corner tiles 0, 3, 15, 12), `tileOfTreasure()`,
  `targetTileId(seat, target | undefined)` (undefined = heading home).
- `settleMove(board, { seat, square, target })` → `{ collected?, won }`: what the end of a move
  does. Collect only when the move ends (staying included) on the current target's tile; heading
  home, ending on the own start corner wins. Passing through, shifts and other players' targets
  never count.

### Turn rules — Implemented

Spec: `openspec/specs/turns/`. Code: `packages/rules/src/turns.ts`.

- `TURN_TIME_LIMIT_SECONDS` (60), `DISCONNECT_LIMIT_SECONDS` (300).
- `nextSeat(taken, from)`: next taken seat clockwise, `from` when alone, 0 when nobody.
- `kickRejection({ kicker, target, turnSeat, expired, finished })` → `WRONG_PHASE` /
  `NOT_KICKABLE` / `TURN_NOT_EXPIRED` / undefined.
- `soleSurvivor(taken)`: the only taken seat, else undefined.

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

## Game flow and commands — Implemented (shift, move, collect, win, turn clock, kick, removals); rest Planned

- **Turn model — Implemented (temporary start rule):** `turnSeat` is the current player's seat.
  The first player to sit down starts (`lobby` replaces this with a random start). A turn has two
  steps (`phase`): `shift`, then `move`. After an accepted move, and when the current player
  leaves (in either step), the turn passes to the next taken seat clockwise (1 → 2 → 3 → 4 → 1),
  skipping empty seats, and starts with `shift`; a player alone keeps it; a dropped player still
  holding their seat is not skipped. Every turn change logs `turn.changed { from, to }`, the
  step change `phase.changed { from, to, turnSeat }`.
- **Pawns:** a joining player's pawn starts on their seat's start corner; pawns ride shifts (the
  room passes all pawn squares to `shiftBoard()`); any number may share a square.
- **`shift { insertion, rotation }` — Implemented:** rejections `NOT_SEATED`, `NOT_YOUR_TURN`,
  `WRONG_PHASE`, `REVERSE_PUSH_FORBIDDEN` (`GAME_ERROR_CODES`), a fixed line or bad rotation is
  `INVALID_COMMAND`. Only in the `shift` step. Accepted: squares, spare, pawn squares and
  `lastInsertion` are written from `shiftBoard()`, then the step becomes `move` (the turn does
  not pass). `rotation` is the spare's absolute rotation; it stays client-side until the shift.
- **`move { row, col }` — Implemented:** only in the `move` step; the own square = stay.
  Rejections `NOT_SEATED`, `NOT_YOUR_TURN`, `WRONG_PHASE`, `UNREACHABLE` (fact `to`, plus the
  state fact `pawn` = the current player's square); a square off the board is
  `INVALID_COMMAND`. Accepted: the pawn moves, then `settleMove()` decides: a collected treasure
  is appended to `found` and the next card (or `""`) becomes `target`
  (`treasure.collected`); a win sets `winnerSeat`, `phase = "finished"` (`phase.changed`,
  `game.finished { reason: "home" }`), stops the clock and locks the room; otherwise the turn
  passes.
- **Treasure deal — Implemented (temporary rule):** at room creation the room draws a second seed
  (`game.dealt { dealSeed }`) and deals **four stacks of 6**, one per seat, because without a
  waiting room the player count is unknown. Whoever takes a seat plays that seat's stack from the
  first card; a player who leaves loses their progress. `lobby` replaces this with
  `dealTreasures(seed, n)` at the start (12 / 8 / 6 cards).
- **Finished game — Implemented:** `requireTurn` rejects every shift/move with `WRONG_PHASE` once
  `phase` is `finished` (before the turn check, so everyone gets the same code); leaving starts no
  turn; the explicitly locked room stays locked when someone leaves, so quick play never joins it.
- **Turn clock — Implemented (temporary start rule):** every turn gets `TURN_TIME_LIMIT_SECONDS`
  (60) for both steps: `setTurn()` → `restartClock()` writes `turnDeadline` and sets a
  `this.clock` timeout that flips `turnExpired` and logs `turn.expired { seat }`. Nothing
  automatic happens; the slow player may still act. Until `lobby`, the clock only runs while at
  least two players are seated: it starts when the second player sits down (full 60 s from
  then), a third joining does not restart it, and it stops when one is left. Room tests shorten
  the limit through the instance field `turnLimitMs`.
- **`kick { seat }` — Implemented:** any other seated player, once `turnExpired`. Rejections
  (`kickRejection()` from rules): `NOT_SEATED`, `WRONG_PHASE` (finished), `NOT_KICKABLE` (not the
  current player, or oneself — this also catches a stale kick after the turn passed),
  `TURN_NOT_EXPIRED`. Accepted: the player is removed first (state changes before the reply), then
  a connected player is closed with `CLOSE_CODES.KICKED` (4100, outside Colyseus' 4000–4010, so
  the SDK passes it to `onLeave` without reconnecting) and a dropped player's seat hold is
  rejected. Rejection lines carry the state fact `turnExpired`.
- **Removal — Implemented:** `removePlayer(sessionId, reason)` is the single way out of a running
  game: `left` (consented leave), `kicked` (with `by`), `timeout` (the 5-minute hold,
  `DISCONNECT_LIMIT_SECONDS`, ran out; room tests shorten `disconnectLimitSeconds`). Pawn,
  progress and seat go (a new player on that seat starts its stack from the first card); logs
  `player.removed { seat, reason, by? }`. Then: in a finished game nothing more; if exactly one
  player is left and the game is under way, that player wins (`game.finished { reason:
  "lastPlayer" }`); else the turn passes if it was theirs. `onDrop`/`onLeave` check that the player
  still exists, so a kick's closing hooks change nothing more. **Under way (temporary):** a
  private `contested` flag set by a shift made while at least two players are seated; `lobby`
  replaces it with the explicit start.
- **Planned:** a `LOBBY` phase before the first shift (`lobby`); creator only:
  `addBot`, `removeBot`, `start`.
- **Bots** (`bot-player`): an ordinary seat; the decision is a pure function in rules, submitted
  through the same command wrapper as humans.
