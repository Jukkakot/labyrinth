# Architecture

How the solution is built: structure, flows and contracts. Details (function lists, UI texts,
component behaviour) live in the code and in [`openspec/specs/`](../openspec/specs/); this page
only points to them. Status markers: **Implemented** = on `main`; **Planned (`change`)** = agreed,
delivered by that roadmap change.

## Overview — Implemented

```
 Browser (mobile first)                          Render (free, Frankfurt)
┌──────────────────────────────┐   WebSocket   ┌─────────────────────────────┐
│ client  React 19 + Vite      │◀────────────▶│ server  Colyseus 0.18        │
│  i18next (fi default, en)    │   + HTTP      │  one Room per game + lobby  │
│  uses @labyrinth/rules for   │               │  authoritative: validates   │
│  previews and highlights     │               │  every command              │
└──────────────┬───────────────┘               └──────────────┬──────────────┘
               │ imports                                       │ imports
               ├────────────▶ packages/rules ◀─────────────────┤
               │              pure, deterministic game logic   │
               └────────────▶ packages/protocol ◀──────────────┘
                              shared contract: codes, schemas, log events
```

- **Monorepo**, npm workspaces, TypeScript everywhere. Hosting: client on GitHub Pages, server on
  Render ([operations.md](operations.md)).
- **No database.** Games live in server memory and are lost on restart, deploy or sleep.

## Workspaces — Implemented

| Workspace | Responsibility | Must not |
|---|---|---|
| `packages/rules` | Game rules as pure functions on plain data. Randomness only from an injected seed. | Depend on React, Colyseus or any I/O. |
| `packages/protocol` | What client and server agree on: command codes, payload and join-option schemas, close codes, log event catalogue. zod schemas sit in `*-schema.ts` modules; rules the client needs are plain functions, so the client bundle has no zod. | Contain game logic. |
| `server` | Rooms, matchmaking, command validation (via rules), state sync, bots. Source of truth. | Trust the client. |
| `client` | Rendering, input, local previews, i18n, settings. | Hold authoritative state. |

**No build step between packages:** `rules` and `protocol` export a `source` condition pointing at
`src/index.ts`; Vite, Vitest and `tsx` resolve it. The server production build uses the compiled
`dist/` instead.

## Server — Implemented

- Entry `server/src/index.ts`; rooms and routes in `server/src/app.config.ts`.
- Every room extends `LoggedRoom`: readable room id (`brave-otters-sing`, also the `room` field of
  every log line), lifecycle logging, `this.command()` for commands, `holdSeat()` for drops.
- Rooms: `game` → `GameRoom` (one game; `filterBy(["pool"])`, realtime listing on) and `lobby` →
  Colyseus' built-in `LobbyRoom` (pushes the game listing to start screens).
- HTTP: `POST /watch` (`server/src/watch.ts`: a seat reservation for a spectator, see below),
  `GET /health` (`{ status, rulesVersion, version, builtAt }`; Render's health check and the
  client's wake-up request), `POST /client-logs`. Development only: `/monitor`, `/playground`.
- CORS restricted to `ALLOWED_ORIGINS` (`server/src/cors.ts`).

### Commands and rejection contract — Implemented

- Clients send `room.request(name, payload)` and always get `CommandResult`: `{ ok: true }` or
  `{ ok: false, code }`.
- `LoggedRoom.command(name, schema, handler)` validates with zod (→ `INVALID_COMMAND`), runs the
  handler and writes exactly one audit line (`cmd.accepted` / `cmd.rejected` / `cmd.failed`); an
  unexpected exception becomes `INTERNAL_ERROR` and the room keeps running.
- A handler rejects by throwing `CommandRejection(code, facts)` **before changing state**. State
  facts (phase, turn, host …) are added to rejection lines via `commandStateFacts()`.
- Handlers take an `Actor { sessionId, bot? }`, not a Colyseus `Client` (a client fits). A bot
  calls the same wrapped handler (`this.messages.shift(botActor, payload)`), so its commands get
  the same checks and audit line, marked `bot: true`.
- **Adding a command:** (1) codes/types in `protocol/src/game-codes.ts`, payload schema in
  `game-schema.ts`; (2) `GameRoom.messages` entry; phase and turn checks first, then rule
  preconditions via `@labyrinth/rules`, then write state; (3) a `useGameSession` method, and
  `errors.<CODE>` strings in fi/en.

## Game flow — Implemented

Specs: `lobby`, `game-session`, `turns`, `tile-shift`, `pawn-movement`, `treasures`.

```
 create/join ──▶ waiting ──start──▶ shift ──▶ move ──▶ (next seat) shift … ──▶ finished
 (nickname)     host = 1st joiner   └─ 60 s turn clock ─┘   win: home or last player standing
```

- **Joining:** join options `{ nickname, pool?, private?, bots? }` are validated in `onCreate` (no room is
  created) and `onAuth` (before a seat); refusals are a `ServerError` whose message is the code
  (`INVALID_NICKNAME`, `INVALID_OPTIONS` for any other bad option, `SERVER_FULL`). Seats: lowest free 1–4 → start corner clockwise from
  top-left, taken only in the waiting room. `MAX_OPEN_GAMES` caps the rooms (static counter).
- **Waiting room:** `phase = "waiting"`, no turn, no cards, no clock. The first joiner is the host
  (`hostSeat`). A guest leaving frees the seat; the host leaving (or a dropped host's hold running
  out) closes the room for everyone (`closeRoom`, close code `HOST_LEFT` 4101). Private rooms
  (`setPrivate`) are never listed or quick-matched; metadata `{ host, open, pool, seated }` feeds
  the list (`seated` = people + bots).
- **Start** (host only, ≥ 2 seated): `dealGame(dealSeed, seats)` deals 24/n cards and draws the
  start seat from one seeded RNG, so `game.started { dealSeed, seats, startSeat }` reproduces the
  opening. The room locks: nobody joins a started game.
- **Turn:** `shift` then `move` by the current player; the turn passes clockwise to the next taken
  seat after the move or when the current player leaves. Shift and move before the start or after
  the end are `WRONG_PHASE`.
- **Turn clock:** 60 s per turn while `phase` is `shift` or `move`; expiry only sets
  `turnExpired`, which lets the others `kick` the slow player (close code `KICKED` 4100).
- **Removal** (`removePlayer`: left, kicked, or a 5-minute drop hold ran out) is the single way
  out: pawn, stack and seat go; then the last player standing wins, or the turn passes.
- **Finished:** `winnerSeat` set, clock stopped, room locked; players may stay and look.
- **Bots** (spec `bots`): the host's `addBot` / `removeBot { seat }` in the waiting room. A bot is
  an ordinary `Player` with `bot = true`, keyed `bot:<seat>`, named from Robo, Pixel, Byte, Nova;
  every seat-based rule works unchanged. While waiting, `maxClients = 4 − bots` (Colyseus locks and
  unlocks the room itself), and a seat reserved by a person who is joining right now counts as
  taken (`SEAT_TAKEN`). On its turn `setTurn` schedules the bot: after 1.5 s the room builds a fair
  `BotView` (no one else's target), asks `botStrategy` (default `chooseBotTurn`, rng seeded from
  the deal seed and seat) and sends the shift; 1 s later the move. A rejected choice logs
  `bot.fallback` and the bot makes an allowed shift and stays. One `botTimer` per room, cleared
  on every turn change, finish and dispose.
- **Quick bot game:** creating a room with `bots: 1–3` makes it private; when the creator joins,
  `onJoin` seats the bots in the next seats and calls the same `startGame()` as the host's `start`
  (`game.started { quick: true }`), so the client lands straight on the board.
- **Nobody left:** when no person is seated and nobody watches (held drops count), a started game
  finishes with `winnerSeat = 0` (reason `noPeople`); bots play on only for spectators.
- **Spectators** (spec `spectators`): a started room stays locked, so `joinById` refuses everyone;
  `POST /watch { roomId, nickname }` checks the listing's `watchable` (running, < 8 spectators) and
  calls `matchMaker.reserveSeatFor` with `watch: true` in the auth, and the client consumes the
  reservation. `onJoin` keeps spectators in a set (not in `players`), syncs their count and gives
  their `StateView` every player (so they see all targets); drops are held like players'. A bot-only
  game is created with `{ watch: true, bots: 2–4, speed? }`: private, its creator becomes the
  spectator, bots take seats 1..n and it starts. `setSpeed` (spectator, no person seated) sets
  `botSpeed`; bot pauses are divided by it. After the start `maxClients` = 4 + 8.
- **Rematch:** `rematch` (seated, finished) creates one new room through `matchMaker.createRoom`
  with the requester's nickname, the same `private`/`pool`, and `botSeats` (bots of the start) or
  the quick game's `bots`; concurrent requests share one pending creation. The id is synced as
  `rematchRoomId`; clients that tapped "Pelaa uudelleen" leave and `joinById` it (the requester
  first, so they host).

## State sync — Implemented

- Synced (`server/src/rooms/schema/GameState.ts`): players (seat, nickname, `bot`, connected, pawn
  square, card count, found treasures, and the **view-filtered** current target), the 49 squares
  and the spare as `{ id, rotation }`, `phase`, `turnSeat`, `hostSeat`, `winnerSeat`,
  `lastInsertion`, `turnDeadline`, `turnExpired`, `spectators` (count), `botSpeed`, `rematchRoomId`.
- Never synced: seeds, treasure stacks, tile kinds and treasures (static per tile id). The client
  rebuilds a rules `Board` from ids and derives everything else with `@labyrinth/rules`.
- **Hidden information:** `Player.target` is `.view()`-tagged; each player's `StateView` holds only
  its own player, a spectator's holds all. A room test decodes another client's state to prove
  nothing leaks.
- UI-only state (shift preview, local rotation, the last turn's marks, the hint) never crosses the
  network.

## Rules package — Implemented

`packages/rules/src/`: `geometry` (squares, directions), `tile` (kinds, openings, rotation),
`board` (validated board, fixed squares, connections), `tileSet` (static 50-tile catalogue with
the 24 treasures), `rng` + `setup` (seeded board; draw order pinned by a golden test), `shift`
(`shiftBoard`, insertion ids, reverse rule), `move` (reachability, shortest path), `treasures`
(deals, collect and win), `turns` (next seat, kick rule, clock limits), `bot` (the replaceable
`BotStrategy` over a fair `BotView`, `chooseBotTurn` = the look-ahead bot in `botLookahead`
(typed-array board, one own turn plus every next shift, averaged opponent blocking; a few ms per
turn; each seat's optional public `foundTreasures` rules those out as an opponent's targets), the
old greedy one kept as a baseline, `botSeed`), `botHint` (the "Vihje" hint: the look-ahead in the
viewer's seat, always blocking, rng seeded from the position; `hintTurn` for the shift step,
`hintMove` for the move step after a shift; the client maps its view to a `BotView` with only
its own target in `client/src/game/hint.ts`), `botTournament` (whole games among
strategies, win rates and ms per turn; not in the package entry). Test fixtures in
`@labyrinth/rules/testing` (`boardFromRows`, `boardToText`). Board coordinates: `(row, col)`
0–6 from the top-left; tile ids never change, which is what the client animates by.

## Client — Implemented

```
client/src/
  App.tsx       StartScreen → WaitingRoomScreen (phase waiting) → GameScreen
  screens/      the three screens
  session/      useGameSession (join, rejoin, commands, local-first leave), viewModel
                (state → GameView), useOpenGames, serverWake, nickname, inviteLink, sessionToken
  game/         board SVG and its layers, turn line, player strip, step/kick/leave controls
  tips/         first-game tips (pure pick + localStorage) and the start screen's reset link
  ui/           tokens.css and shared components (Screen, Message, Button, Badge, Notice, …)
  logging/ i18n/ config.ts CrashBoundary.tsx
```

- **Server state is the truth.** `toGameView()` turns synced state into an immutable `GameView`;
  components render it. Previews (shift and the reach after it) are computed locally with the same rules functions;
  the last turn's marks (pushed-in tile, walked route) are derived by comparing successive views.
- **UI foundation:** every colour, spacing and radius is a token (light and dark); CSS Modules;
  anything shown twice is a shared component. Board: one SVG, 100 units per tile; pawns = seat
  colour + shape; tiles and pawns animate with CSS transforms keyed by id; reduced motion honoured.
- **Session:** a per-tab reconnection token (sessionStorage) rejoins after a reload; the last
  nickname is kept in localStorage only to prefill the field. A seated player's unfinished game is
  also remembered in localStorage (token, room, last seen; refreshed every 15 s and on hide), so a
  newly opened app offers "Jatka peliä" within the server's 5-minute seat hold. `leave()` is local-first: the start
  screen shows at once, then `room.leave()`. Close codes 4100/4101 and join failures become a
  start-screen notice.
- **First-game tips:** which one-time tips were seen is kept in localStorage
  (`labyrinth.tips.seen`); the tips take plain props from the game screen, so they do not depend on
  the session or its transport.
- **Early wake-up:** the start screen fetches `/health` once per page load (retries up to 90 s) so
  a sleeping Render server wakes while the player types; join actions wait for it, and the screen
  counts the seconds waited.
- **i18n:** Finnish is the key source of truth (type-checked), a test enforces fi/en parity.
  Language: `?lng=` → saved choice → Finnish.
- **Logging:** pino browser build, batched to `POST /client-logs`; global error handlers and
  `CrashBoundary` log `client.error`. See [operations.md](operations.md#logs--implemented).
