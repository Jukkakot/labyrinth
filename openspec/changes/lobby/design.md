# Design

## Context

`GameRoom` (Colyseus 0.18, `@colyseus/core` 0.18.17) creates the seeded board and deals four stacks of
6 in `onCreate`. Players sit down one by one into a running game: the first to join gets the turn
(`onJoin` → `setTurn`). The turn clock runs only while two or more players are seated
(`restartClock`). A private `contested` flag marks the game as "under way" for last-player-standing.
The room is registered as `defineRoom(GameRoom).filterBy(["pool"]).enableRealtimeListing()`, so
realtime listing is already switched on, although nothing uses it yet. The room is locked only
when the game finishes. On the client, `useGameSession` has a `Connector` with `joinOrCreate` and
`reconnect`. `App` shows either `StartScreen` or `GameScreen`. `leave()` waits for the SDK's
`onLeave` before returning to the start screen. Every name in the UI is "Pelaaja N".

These Colyseus facts were checked in `node_modules`:
- The built-in `LobbyRoom` sends a `rooms` list on join, then `+` (roomId, room) and `-` (roomId)
  updates. It accepts a `filter: { name, metadata }`, where each metadata field must be equal.
- `updateLobby` never announces private rooms (`setPrivate`), and matchmaking skips them.
- A locked room stays in the lobby list with `locked: true`, and `joinOrCreate` and `joinById`
  refuse it.
- `lock()` called by our code is explicit, so Colyseus does not unlock the room when a client
  leaves.
- From turn-rules: a server-side `client.leave(code)` with a code other than 4000 goes through
  `onDrop` first, and the SDK passes custom 4xxx codes to the client's `onLeave(code)` unchanged.

## Goals / Non-Goals

**Goals:** the lobby spec (nickname, list, private game, invite link, waiting room, start, host
leaving, game limit). Removing the two temporary turn-rules conditions. A reliable in-game leave.
Nicknames everywhere a player is named.

**Non-Goals:**
- Bots in the waiting room (`bot-player` adds "Lisää botti" to the same waiting room).
- Spectators, and joining started games as a spectator (`spectators-and-rematch`).
- Rematch.
- Closing finished games after 10 minutes (NFR, later).
- A per-connection limit on open rooms. Room creation needs a connection that joins at once, and
  the global cap covers the 0 € instance.
- Renaming yourself inside a room.
- Kicking players from the waiting room.
- Picking a seat or colour.

## Decisions

Autopilot decisions, made without review (revisit freely):

1. **One room type with a `waiting` phase, not a separate lobby room per game.** `TurnPhase` becomes
   `waiting | shift | move | finished`, and `GameState.phase` starts as `waiting` with `turnSeat 0`.
   The board is still set up in `onCreate`, so the seed and board logging stay as they are. The
   waiting room simply does not show the board. *Alternative:* a separate `WaitingRoom` that hands
   players over to a new `GameRoom`. It would need two joins, seat reservations and a second
   reconnection token, all for nothing.
2. **The host is a synced `hostSeat`.** It is set to the seat of the first player to join (the
   creator, whether through quick play or "Luo yksityinen peli"). It is public, so every client can
   mark the host and show the host's nickname. Host powers end at the start; after that the host is
   an ordinary player.
3. **When the host leaves the waiting room, the room closes.** This covers a consented leave, and a
   drop whose 5-minute hold runs out (product.md: "if the creator leaves the waiting room, the
   room closes"). `closeRoom("hostLeft")` does the following:
   - sets a private `closing` flag (so the `onDrop` of the kicked-out clients holds no seats) and
     locks the room;
   - calls `client.leave(CLOSE_CODES.HOST_LEFT = 4101)` for every other client;
   - rejects the pending holds;
   - logs `room.closed { reason }`. Colyseus disposes the empty room.

   *Alternative:* passing host to the next player. That is friendlier, but product.md decided
   otherwise and it would need a hand-over UI.
4. **The waiting-room host leave is confirmed only when others are seated.** Alone, nothing is
   lost. The in-game leave is always confirmed in a running game and never in a finished one. The
   confirmation reuses the KickControl pattern: it replaces the controls under the board with a
   short question, "Peru" and "Poistu". It is not a modal. This keeps one confirmation style in the
   app, and on the S24 the confirmation sits where the thumb already is.
5. **The leave action lives in the top bar.** It is an icon button (Tabler `door-exit`, 44 px,
   `aria-label` "Poistu pelistä") before the language switcher. It is visible but secondary, as
   hierarchy requires. "Uusi peli" in a finished game stays as the primary action.
6. **Leaving happens locally first.** `leave()` marks the session as leaving, clears the token, log
   context and view, and sets `idle` at once. Then it calls `room.leave()` and removes the room's
   listeners, so a late `onLeave` or a reconnect attempt through Render's proxy cannot bring the
   game back or set an end reason. The server still sees the consented leave (4000) or, at worst,
   a drop. A drop would hold the seat for 5 minutes and then remove it, so the worst case is
   delayed removal, never wrong state. A production check (tasks) confirms which one happens
   behind the proxy, and the finding goes into `docs/operations.md`.
7. **Nickname rule in `@labyrinth/protocol`.** It is input validation shared by client and server,
   not a game rule. `nicknameSchema` is a zod string: trim, then 2–16 code points, then no
   `\p{Cc}`. It is part of `joinOptionsSchema = { nickname, pool?, private? }`. The server
   validates the options in `onAuth`, which runs before a seat is reserved, and refuses with
   `INVALID_NICKNAME`. The client uses the same schema to enable the buttons and pick the hint.
   The nickname is synced as a public `Player.name`. The last nickname used is kept in
   `localStorage` (`labyrinth.nickname`), try/catch like the session token.
8. **Dealing and the start seat are one seeded rules function.**
   `dealGame(seed, seats) → { stacks: Map<seat, TreasureId[]>, startSeat }` reuses
   `dealTreasures(seed, seats.length)`, hands the stacks to the seats in ascending order, and draws
   the start seat from the same seeded RNG. So `game.started { dealSeed, seats, startSeat }`
   reproduces the whole opening, including who began. The server draws `dealSeed` at the start,
   not at creation. The `game.dealt` event is folded into `game.started`, and the catalogue drops
   `game.dealt`. *Alternative:* `crypto.randomInt` for the start seat. It is not reproducible from
   the logs.
9. **The `start` command** has an empty strict payload. It is checked in this order: `NOT_SEATED`,
   `NOT_HOST`, `WRONG_PHASE`, `NOT_ENOUGH_PLAYERS`. Then it deals, sets each player's `cards` and
   `target`, locks the room, sets the metadata `open: false`, and calls `setTurn(startSeat)`, which
   starts the clock.
   - `restartClock` applies whenever the phase is `shift` or `move` and `turnSeat ≠ 0`. The
     player-count condition goes.
   - `contested` goes, and `removePlayer` uses `phase ≠ waiting`.
   - `onJoin` no longer gives anyone the turn.
   - Shift, move and kick in the waiting room return `WRONG_PHASE`. `requireTurn` checks the phase
     before the turn, so no one gets `NOT_YOUR_TURN` there, and `kickRejection` gains a `waiting`
     input.
10. **The list uses the built-in `LobbyRoom`, registered as `lobby`.** Game rooms publish the
    metadata `{ host, open, pool }`. `pool` is `""` outside E2E, so tests never show up in the
    real list. `host` is the host's nickname and is set when the host joins. The client joins
    `lobby` with `filter: { name: "game", metadata: { open: true, pool } }` while the start screen
    is shown, and leaves it when a game opens. It shows the rooms with `!locked && clients <
    maxClients`, oldest first. This is an established part of Colyseus, pushes updates without
    polling, and adds no dependency. *Alternative:* an HTTP endpoint polled every few seconds. It
    is more code and more requests, and the listing would still be stale. Private rooms
    (`setPrivate(true)` in `onCreate` when `private` is set) are never announced.
11. **Joining by id and creating private.** `Connector` gains `joinById(id, options)` and
    `createPrivate(options)` (SDK `create("game", { …, private: true })`). The client maps join
    errors to three messages: game not open (room not found, locked or full), server full, and the
    generic join error. The server refuses with protocol-defined codes (`JOIN_ERROR_CODES`:
    `INVALID_NICKNAME`, `SERVER_FULL`) through Colyseus `ServerError`. The SDK reports its own
    matchmaking errors for missing or locked rooms, and these map to "not open".
12. **The invite link is `<app URL>?game=<roomId>`.** Any `pool` parameter is kept. `App` reads
    `game` once at load. A stored reconnection token wins, because a reload of a tab that is
    already in a game rejoins it. Otherwise the start screen opens in invite mode. After the join
    attempt, success or failure, `history.replaceState` drops `game` from the URL. "Muut pelit"
    leaves invite mode. Sharing uses `navigator.share({ url })` where it exists and falls back to
    `navigator.clipboard.writeText` with "Linkki kopioitu" in the shared `Notice`. If the share is
    aborted, nothing more happens.
13. **Game limit: `MAX_OPEN_GAMES = 100`,** counted with a static counter in `GameRoom`
    (`onCreate` ++, `onDispose` --). This fits a single instance, and the NFR scale target is tens
    of games. `onCreate` throws `ServerError(SERVER_FULL)` before it sets anything up, and logs
    `room.refused { reason: "cap", open }`. Room tests lower the cap.
14. **The waiting room is its own screen** (`WaitingRoomScreen`), picked in `App` by `view.phase
    === "waiting"`. It has the `GameIdBadge` and the language switcher in the top bar, a title
    "Odotushuone", and four rows in seat order. A taken seat shows the pawn, the nickname, a
    "(sinä)" or "isäntä" badge and the disconnected mark. A free seat shows a dim "Vapaa paikka".
    Below come "Kutsu pelaajia" (secondary), then "Aloita peli" (primary, host only, disabled with
    a hint under 2 players) or the waiting text for guests, then "Poistu" (secondary). The board
    appears only at the start, so every screen has one clear job.
15. **Names in the UI.** `SeatView` gains `name`. All the "Pelaaja {{seat}}" strings become
    `{{name}}`: the turn line, the strip, the result, the kick control, departures and the pawn
    labels. The strip chip shows the name with `text-overflow: ellipsis` and a fixed maximum width.
    Only one chip is shown per player, so the chips stay within 360 px. The departure notice needs
    the departed player's name, which is gone from the state once they are removed, so `GameScreen`
    remembers the last seen seat → name map.
16. **Start screen layout.** From the top: the title, the nickname field (label "Nimimerkki",
    `maxLength` 32 so pasting is forgiving, and the hint under the field once touched), Play
    (primary), "Luo yksityinen peli" (secondary), then "Avoimet pelit" with its list (each entry a
    44 px row button "Maija · 2/4") or "Ei avoimia pelejä juuri nyt". The kicked, host-left and
    not-open messages share the existing status line. The wake-up flow is unchanged. The list
    connects only once the wake-up is `ready` or `failed`.

## How the NFRs are met

- **Logging and audit:** `start` goes through the command wrapper (one `cmd.accepted` or
  `cmd.rejected` line, with the phase, host and seated count as facts).
  - New server events: `game.started { dealSeed, seats, startSeat }`, `room.closed { reason }`
    and `room.refused { reason, open? }`. A refused join (bad nickname) logs
    `room.refused { reason: "nickname" }`.
  - `player.joined` adds `name` (the nickname is the only personal data, and it is allowed in the
    logs; no IP addresses are logged).
  - `game.dealt` is removed from the catalogue.
  - Client: a failed join logs `client.warn { kind: "join", reason }`. No new client events.
- **Tests:**
  - Rules unit: `dealGame` (every scenario of the deal requirement, plus a fast-check property:
    for any 2–4 seat subset and seed, all 24 treasures once, equal sizes, start seat among the
    seats).
  - Protocol unit: the nickname schema (valid, trimmed, too short or long, control characters,
    whitespace only).
  - Server room tests with `@colyseus/testing`: the waiting phase, each start rejection, the deal,
    the start seat, lock and metadata, host-left closing, private rooms skipped by quick play,
    joinById on a started room refused, the cap, the invalid nickname, no clock or kick in the
    waiting room, and last player standing after the start.
  - Existing room tests move to a `startedGame(n)` helper.
  - Client unit tests: the session (join by id, create private, local-first leave, the host-left
    reason, error mapping), the start screen, the waiting room, and the game screen's names and
    leave confirmation.
  - The single E2E smoke test goes through the waiting room with two browser contexts.
- **Limits:** `MAX_OPEN_GAMES`, the nickname length and characters, and a strict `start` payload.
  The command rate limit is unchanged.
- **Performance:** the lobby list uses the SDK already in the bundle. `npm run size` is checked
  before the commit.
- **Error UX:** join failures are short, localized and calm. Technical details go only to the logs.

## Risks / Trade-offs

- [Every existing room test assumes players sit into a running game] → A `startedGame(n)` helper
  is added first (task 3), and the tests are migrated in the same task group.
- [The lobby WebSocket opens on the start screen of a sleeping server] → It connects only after
  the wake-up is `ready` or `failed`. If it fails, the list shows nothing and says so quietly, and
  Play still works.
- [`room.leave()` through Render's proxy may end as a drop (seen in add-logging)] → The client
  leaves locally first (decision 6), and the server removes the player after the hold at worst. The
  production check tells us whether the 5-minute delay actually happens.
- [The host drops in the waiting room and the guests wait up to 5 minutes] → This is accepted.
  Guests can leave and find another game. A shorter host hold would add a second timer rule.
- [LobbyRoom lists rooms that are full or locked] → The client filters them. The server truth
  still refuses joins, and a stale click gives "Peli ei ole enää avoinna".
- [A static game counter drifts if `onCreate` throws after incrementing] → Increment only after
  the cap check, and decrement in `onDispose`, which runs for every created room.

## Migration Plan

This is in-memory only. A deploy ends all running games anyway (NFR). Old clients get protocol
errors on join, and the existing version check covers a stale client. There is no rollback
complexity: revert the commit.

## Implementation notes (deviations found while building)

- **The lobby is joined with `joinOrCreate("lobby")`**, not `join`: nobody creates the lobby room
  otherwise, and `join` fails with "no rooms found". Found in the UI check.
- **The nickname rule is a plain function** (`nicknameIssue()` in `game-codes.ts`); `nicknameSchema`
  wraps it. The client imports the function, so zod stays out of the client bundle.
- **`onCreate` also validates the join options**, so an invalid nickname or a full server never
  creates a room (not only `onAuth`).
- **`endReason` became `startNotice`** (`kicked | hostLeft | notOpen | serverFull`): it now also
  carries join failures, which are not end reasons. The generic join error's "Yritä uudelleen"
  repeats the last attempt (`retry()`), not quick play.
- **The start seat in room tests** is fixed by replacing `GameRoom.drawDealSeed` with a seed whose
  `dealGame` start seat is the wanted one, so the real deal code runs.
- **Four long nicknames** wrap the strip to two rows at 360 px (names capped at 5.5em with an
  ellipsis); the board still fits without scrolling. One row would leave about 3 characters per name.
- **The join actions stay disabled while the server wakes** (Play, private game and list rows), for
  one consistent rule.
