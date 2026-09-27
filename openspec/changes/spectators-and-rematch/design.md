## Context

`GameRoom` locks itself at the start (`lock()`), so Colyseus' `joinById` refuses every later join;
the built-in `LobbyRoom` still lists locked public rooms, and the client filters them out
(`metadata.open`). A client's `StateView` holds only its own `Player`, which is how targets stay
secret. The room ends a started game with `winnerSeat = 0` as soon as no person is seated. Bot
pauses are two room fields (`botShiftDelayMs`, `botMoveDelayMs`). A finished game only offers
"Uusi peli" (= leave).

## Goals / Non-Goals

**Goals:** spectators of running public games, of invited games that already started, and of
bot-only games; bot speed while only bots play; a spectator count for players; "Pelaa uudelleen"
that keeps a group together with the same settings.

**Non-Goals:** spectators in the waiting room; chat or reactions; spectators following a rematch;
closing finished games after 10 minutes (nfr, separate); spectator nicknames shown anywhere.

## Decisions

1. **Spectators join through `POST /watch`.** The body `{ roomId, nickname, pool? }` is validated
   with the join-option schema; the route looks the room up in the matchmaker cache and, if its
   metadata says `watchable`, calls `matchMaker.reserveSeatFor(room, options, { ...options, watch:
   true })` and returns the seat reservation; the client consumes it with the SDK
   (`consumeSeatReservation`). Any refusal is HTTP 409/404 → the client's "not open" notice.
   *Why:* `reserveSeatFor` only checks `maxClients`, not the lock, so the room stays locked for
   players and quick play keeps skipping it. Alternative (no lock, make started rooms private and
   refuse players in `onAuth`) would hide running games from the lobby listing. The route is one
   audited HTTP request like the others.
2. **Spectator seats.** At the start `maxClients` becomes 4 + 8 (`MAX_SPECTATORS = 8`), the lock
   stays explicit. `onJoin` checks `auth.watch`: a spectator is not added to `players`; the room
   keeps `spectators: Set<sessionId>` and syncs `state.spectators` (count). `onJoin` throws for a
   spectator of a game that is not running (race with the route) — the client sees a join failure.
   Metadata gets `watchable` (started, not finished, not closing, < 8 spectators) and `seated`.
3. **Spectators see all targets.** A spectator's `StateView` gets every `Player` (added again at
   `startGame` for the watch-created room, where the spectator joins before the bots are seated).
   Players' views are unchanged; a room test decodes a player's state with a spectator present.
4. **Watch a bot game = create with `{ watch: true, bots: 2–4, speed? }`.** Schema: `bots` 1–4,
   `watch` requires `bots` ≥ 2, `bots` = 4 requires `watch`, `speed` ∈ {1,2,4} only with `watch`.
   Such a room is private; when its creator joins, the room makes them a spectator, seats bots
   in seats 1..n and calls `startGame()` (`game.started { quick: true, watch: true }`). The dev
   shortcut learns `?dev=0v3` for this.
5. **End rule.** `noPeopleLeft()` = no non-bot player **and** no spectators (held drops count, as
   for players). It is checked on player removal and on spectator removal. A bot-only game whose
   last spectator leaves finishes (`noPeople`) and Colyseus disposes the empty room.
6. **Speed.** Synced `botSpeed` (1/2/4, default 1). Command `setSpeed { speed }`: `NOT_SPECTATOR`,
   then `WRONG_PHASE` (not shift/move), then `PEOPLE_PLAYING`. Bot pauses are the base delays
   divided by `botSpeed` at scheduling time; a change applies from the next pause.
7. **Rematch on the server.** Command `rematch {}` (seated, finished; else `NOT_SEATED` /
   `WRONG_PHASE`). If `rematchRoomId` is set it is a no-op; otherwise the room calls
   `matchMaker.createRoom("game", options)` with the requester's nickname, the same `private` and
   `pool`, and either `bots: n` (quick game) / `watch` never (spectators get the client-side "Uusi
   bottipeli"), or `botSeats: [seats of bots at the start]`. A concurrent second `rematch` awaits
   the same pending promise. `SERVER_FULL` from `onCreate` becomes a rejection with that code
   (added to the game error codes). The new id is synced as `rematchRoomId`; log `game.rematch`.
   *Why server-side:* one new room even when two players tap at once; the finished room knows the
   bots and settings. The new room's bots are seated in `onCreate`; people take the lowest free
   seat; the first person to join is the host (the requester, who joins as soon as the id arrives;
   Colyseus keeps an unjoined new room for the seat-reservation time, 15 s).
8. **Rematch on the client.** `rematch()` sends the command (if no id yet), waits for
   `view.rematchRoomId`, then leaves the finished room locally and `joinById`s the new one through
   the normal `connect()` path (so failures become "notOpen"/retry as usual).
9. **Spectator UI.** `GameView` gets `spectating`, `spectators`, `botSpeed`, `botOnly` (no person
   seated), `rematchRoomId`; for a spectator `myTarget` is unset, every seat gets its `target`, and
   `targetTileId` follows the current player's target. The bottom slot shows `SpectatorPanel`
   ("Katsot peliä", the speed segmented control when `botOnly` and running; when finished and
   `botOnly`: "Uusi bottipeli" + "Alkuun"; finished otherwise: "Alkuun"). The top bar shows
   `SpectatorCount` (eye + number) for everyone when > 0. Leave needs no confirmation for a
   spectator. Finished controls for players: "Pelaa uudelleen" (primary) + "Alkuun" (secondary).
10. **Start screen.** A second lobby filter is not needed: `useOpenGames` already receives every
    public listing of the pool (the lobby filter is `open: true` today → changed to the pool only),
    and splits it into open and running (`watchable`) games. New group "Katso bottien peliä" with
    2/3/4 under the bot quick games. Invite join failing with "not open" retries once as a spectator
    and shows the one-off notice "Peli oli jo alkanut – katsot sitä".

Decisions made on autopilot, to revisit: spectators see every target (product.md says so, but it
lets a watching friend help a player); speed only while no person is seated; rematch keeps the
bots of the start, not the ones left at the end; "Uusi peli" renamed "Alkuun"; up to 8 spectators.

## Risks / Trade-offs

- [Private Colyseus internals] `reserveSeatFor` is exported but less common API → covered by room
  tests through the real route; pinned Colyseus 0.18.
- [A spectator sees all targets and could tell a player] → accepted product decision; the eye
  count makes watching visible.
- [Someone joins a public rematch room before the requester] → they become host; rare and
  harmless.
- [Bots at 4× faster than the tile slide animation] → the client animation just overlaps; fine
  for watching.

## NFR

- **Logging:** `/watch` gets the standard `http.request` audit; `spectator.joined`/`spectator.left`
  with the count; `setSpeed` and `rematch` through `this.command()` (one audit line each, state
  facts on rejection); `game.rematch { rematchRoom }`; new events added to the catalogue.
- **Tests:** protocol schema tests (watch/bots/speed combinations); server room tests: watch route
  and refusals, spectator view (all targets) and player privacy, rejections, end rule with and
  without spectators, speed, rematch (settings, idempotent, quick, full, wrong phase); client tests
  for view model (spectator), open/running split, session rematch and watch flows, and a few
  render tests (spectator panel, finished controls). E2E smoke unchanged.
- **Limits:** 8 spectators per game; rematch rooms count towards `MAX_OPEN_GAMES`.
- **Performance:** no new client dependency; icons from Tabler (already used); bundle size check.
