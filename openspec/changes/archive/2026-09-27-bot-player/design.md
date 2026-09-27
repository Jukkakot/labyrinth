# Design

## Context

- `GameRoom` keys `state.players` by Colyseus `sessionId`; every seat has a connection. Seats are
  picked in `onJoin` (lowest free), the waiting room is locked/listed through Colyseus
  (`maxClients = 4`, automatic lock when full) and `metadata { host, open, pool }`.
- Commands go through `LoggedRoom.command()` → `defineCommand()`, whose handler takes a Colyseus
  `Client` but only uses `client.sessionId` (log context, player lookup).
- Turn flow is `setTurn()` → shift → move → `passTurn()`; removal goes through `removePlayer()`.
- The rules package already has everything a bot needs to evaluate a turn: `shiftBoard` (moves
  pawns too), `reverseOf`, `reachableSquares`, `targetTileId` (treasure tile, or the home tile
  once all are found), `createRng`/`shuffle`.
- The open games list shows `clients/4` from the Colyseus listing.

## Goals / Non-Goals

**Goals:**
- Bots are ordinary seats in the synced state; the client needs only a `bot` flag.
- The bot's choice is a pure, seeded rules function, so it is unit-tested and a whole bot game can
  be simulated without a server.
- Bot commands take exactly the path of a person's command (validation, audit, rejection).
- The turn choice is a replaceable strategy: a much smarter bot comes later (the user's stated
  goal), and swapping it in must not touch the server, protocol or client.

**Non-Goals:**
- Several difficulty levels, bots that block opponents or plan ahead more than one turn.
- Bots in rematch (comes with `spectators-and-rematch`) or adding bots after the start.
- Bots taking over the seat of a person who left.

## Decisions

### 1. A bot is a `Player` with `bot = true`, keyed `bot:<seat>`
The synced `Player` gets `bot: boolean`. A bot's key in `state.players` is `bot:<seat>` (cannot
clash with a sessionId). Everything seat-based (`seats()`, `nextSeat`, `dealGame`, `soleSurvivor`,
kick) then works unchanged. Its `target` stays `.view()`-tagged; no client view contains a bot's
player, so the target never leaves the server.
*Alternative:* a separate `bots` map in state. Rejected: every seat-based rule and the client
would have to merge two collections.

### 2. Bot names: fixed, language-neutral list
Robo, Pixel, Byte, Nova, the first one not used by another bot in the room. They read fine in
Finnish and English, so `name` stays a plain synced string and every place that shows a name
(turn line, result, departures) works as is. The client marks bots with a robot icon (tabler
`IconRobot`) and a "botti"/"bot" badge (lower case like "sinä" and "isäntä") in the waiting room.
*Alternative:* localized "Botti 2" built on the client. Rejected: every name display would need a
bot branch.

### 3. Seats, listing and joins with bots
- `addBot { seat }` / `removeBot { seat }` commands (protocol schemas, seat 1–4), host only, in the
  waiting room; checks in the order of the spec: `NOT_SEATED`, `NOT_HOST`, `WRONG_PHASE`, then
  `SEAT_TAKEN` / `NOT_A_BOT`.
- **Pending joins:** Colyseus reserves a seat before `onJoin`, and `onJoin` takes the lowest free
  seat. So with *k* pending reservations the *k* lowest free seats count as being taken: adding a
  bot there is `SEAT_TAKEN`. This keeps `onJoin` from ever finding no free seat.
- **Capacity:** `maxClients = 4 − bots` is updated on every add/remove, and the room is locked
  when people + bots fill all four seats and unlocked again when a bot is removed (only in the
  waiting room). The implementation checks how Colyseus 0.18 tracks explicit vs. automatic locks
  and uses the one that lets automatic unlocking on a person's leave keep working.
- **Listing:** metadata gains `seated` (people + bots); the list shows `seated/4` and hides games
  where `seated` is 4. `clients` alone would undercount.

### 4. Bot actor through the same command wrapper
`defineCommand` handlers take an `Actor = { sessionId: string; bot?: true }` instead of `Client`
(a `Client` satisfies it). The room keeps the wrapped handlers in `messages`, and a bot calls
`this.messages.shift({ sessionId: "bot:2", bot: true }, payload)`. Log context adds `bot: true` for
bot actors. Validation, audit lines and `CommandRejection` behave exactly as for people.
*Alternative:* call the state-changing code directly for bots. Rejected: two paths to keep in
sync, and bot moves would bypass the rules checks that protect state.

### 5. Turn choice: `chooseBotTurn` in `packages/rules/src/bot.ts`
Input: board, own seat, own pawn square, current target (treasure or none = home), last insertion,
an `Rng`. For every insertion except `reverseOf(last)` and every rotation (≤ 44 candidates):
`shiftBoard(board, id, rot, [pawn])`, find the target tile's square by id (`targetTileId`; on the
spare = out of reach), `reachableSquares` from the shifted pawn. Score = 0 if the target square is
reachable, else the least row+column distance from a reachable square to the target square (out
of reach = worst). Pick the best candidates, break ties with the rng, return
`{ insertion, rotation, to }`. Cost is ~44 BFS runs on 49 squares: well under a millisecond.
**Rng:** each bot gets `createRng(mix(dealSeed, seat))` at the start and keeps it for the game, so
a game is reproducible from `game.started` plus the commands in the log.
Pawns of other players are ignored (they do not block movement in this game).
**Replaceable strategy:** `chooseBotTurn` is the first implementation of a `BotStrategy` type,
`(view: BotView, rng: Rng) => BotTurn`. `BotView` holds what a player may fairly know: the board
and spare, every pawn square, the last insertion, each seat's found treasures and cards left, and
the bot's own target, but never other players' targets or stacks (bots play fair, also when they
get smarter). The server builds the `BotView` and calls the strategy it was given, so a later,
smarter strategy (look-ahead, blocking opponents, difficulty levels) is a rules-only change. The
simulation test takes the strategy as a parameter so it can compare strategies later.

### 6. Driving bot turns: timers in `GameRoom`
`setTurn()` checks whether the new current player is a bot and schedules its shift after
`botShiftDelayMs` (1500); an accepted bot shift schedules its move after `botMoveDelayMs` (1000,
longer than the client's tile slide). The choice for the whole turn is computed at shift time and
the move re-checked at move time. One `botTimer` per room, cleared on every `setTurn`, `finish`,
removal of that bot and `onDispose`. Room tests shorten both delays.
**Fallback:** if a bot command returns `ok: false`, log `bot.fallback` (error) and send the first
allowed shift (first insertion that is not the reverse, rotation unchanged), then `move` to its
own square (stay), which is always allowed. This keeps the game from stalling on a bug.

### 7. Game end without people
In `removePlayer()` for a started, unfinished game: if no non-bot player is left, finish with
`winnerSeat = 0` and reason `noPeople` (clock and bot timer stop). Otherwise the existing rule
applies: `soleSurvivor` (bots count) wins, or the turn passes. A dropped person still in their
hold counts as a person. With no clients left Colyseus disposes the room as before.
*Decision (rules):* the product note "if only one human remains, they win" is read as the existing
last-player-standing rule; a person alone with bots plays on against them.

### 8. Client
- View model: `SeatView.isBot`; bots are always `connected`.
- Waiting room: free seat row → "Lisää botti" button (host only, ≥ 44 px); bot row → robot icon,
  "botti" badge (lower case like the other marks), and for the host an icon button "Poista botti". Both use the session's pending
  state like "Aloita peli".
- Player strip: robot icon next to a bot's name. No other screen changes.
- Session: `addBot(seat)`, `removeBot(seat)`; fi/en strings, including `errors.SEAT_TAKEN` and
  `errors.NOT_A_BOT`.

### NFRs
- **Logging:** new catalogue events `bot.added`, `bot.removed` (seat, name) and `bot.fallback`
  (error, rejected command and code); bot commands produce the normal `cmd.*` line with
  `bot: true`; `game.finished` gets the reason `noPeople`. No personal data involved.
- **Tests:** rules unit tests for `chooseBotTurn` (one per scenario of *Bot turn choice*) plus a
  simulation test: 2-, 3- and 4-bot games over several seeds end with a winner within a turn cap.
  Room tests: add/remove rejections and order, pending-join `SEAT_TAKEN`, listing count/lock, a
  bot plays a turn (shortened delays, audit lines with `bot: true`), fallback, `noPeople` end.
  Client: view-model `isBot`, one waiting-room render test for the host's bot controls. E2E smoke
  test unchanged.
- **Limits:** bots count against the four seats and the existing game cap; no new limits needed.
  Bot work is < 1 ms per turn, far under the 300 ms response target.
- **Bundle:** one extra icon; `npm run size` keeps it within budget.

## Risks / Trade-offs

- [Greedy bots circle without finishing] → the simulation test over several seeds with a turn cap;
  random tie-breaks keep them from repeating the same move.
- [Colyseus lock/`maxClients` behaviour differs from what the design assumes] → room tests for
  listing and joining with bots; adjust the mechanism, not the spec.
- [A person joins at the exact moment a bot is added] → the pending-reservation rule in decision
  3, covered by a room test.
- [Bot timer fires after the game changed] → the timer is cleared on every turn change; the fired
  command still goes through the normal checks, so a stale one is just rejected and logged.

## Migration Plan

None: games live in memory. Deploy as usual; rollback by redeploying the previous commit.
