# Design

## Context

- `bot-player` gave the waiting room `addBot`, bot seats keyed `bot:<seat>`, bot turns and the
  `noPeople` end. The host's `start` command deals (`dealGame`), locks the room and sets the first
  turn.
- Rooms are created with join options `{ nickname, pool?, private? }`, validated in `onCreate`
  (refusal before the room exists) and `onAuth`. The creator's join is the first `onJoin`.
- The client's `useGameSession` has `play`, `createPrivate`, `joinById`, each a `connect()` around
  a `Connector` method; the start screen disables its actions while the nickname is invalid or the
  server wakes.

## Goals / Non-Goals

**Goals:** one tap from the start screen to a running game against 1–3 bots; no second path for
dealing or starting; the same connecting/error UX as Play.

**Non-Goals:** choosing seats, bot names or difficulty; rematch (comes with
`spectators-and-rematch`); quick bot games for more than one person.

## Decisions

### 1. The server starts the game, from one join option
The client creates a room with `{ nickname, bots: n, private: true }` (`bots` integer 1–3 in
`joinOptionsSchema`). `onCreate` remembers `n` (and ignores it on later joins; the room is private
and started, so there are none). When the creator joins, `onJoin` seats the bots in seats 2…n+1
through the same helper as `addBot` (names Robo, Pixel, Byte; `bot.added` lines), then calls the
shared `startGame()` that the host's `start` command also uses. So there is one way to deal and
start, and the first seat is drawn as usual.
*Alternative:* the client creates a private room and sends `addBot` × n and `start`. Rejected:
n + 1 round trips on a possibly slow server, a visible waiting-room flash, and partial states when
one fails.

### 2. Invalid `bots` refuses the creation
A `bots` outside 1–3 (or not an integer) fails `joinOptionsSchema`. Today every schema failure is
reported as `INVALID_NICKNAME`; the refusal now names the failing field: a nickname issue stays
`INVALID_NICKNAME`, anything else becomes the new join code `INVALID_OPTIONS`, which the client
shows as its generic join error (the UI never sends it). `room.refused { reason: "options" }`.

### 3. Private, straight to the board
`private: true` keeps the game out of the list and quick play (existing mechanism); `startGame`
locks it. The client needs no new screen: the first state it receives already has phase `shift`
or `move`, so `App` shows the game screen directly.

### 4. Start screen
Under Play and "Luo yksityinen peli", a small group titled "Pikapeli botteja vastaan" with three
equal secondary buttons in one row, "1v1", "1v2", "1v3" (≥ 44 px each; accessible names "Pikapeli:
sinä ja 1 botti" …). Secondary, because Play stays the screen's primary action. Hidden when the
screen was opened from an invite link (like "Luo yksityinen peli"). Session: `playBots(nickname,
bots)` → `connector.createBotGame({ nickname, bots })` → `sdk.create("game", { …, bots, private:
true })`, retried by the existing `retry()` like the other attempts.

### NFRs
- **Logging:** `game.started` gets `quick: true` for these games; bots get `bot.added`; a refused
  option gets `room.refused { reason: "options" }`. No personal data.
- **Tests:** protocol schema test for `bots`; room tests: creating with 1 and 3 bots starts at once
  with the right seats, cards and log lines, the room is private and locked, and `bots: 4` is
  refused; session test for `playBots`; one start-screen render test (buttons disabled with a bad
  nickname, tapping calls `playBots`). UI check in portrait. E2E smoke test unchanged.
- **Limits:** one room per tap, counted against the existing game cap; bots add no connections.
- **Bundle:** a few strings, no new icon.

## Risks / Trade-offs

- [Starting inside `onJoin` before the client has its view] → the client already handles a game
  that starts while it is connected; state changes in `onJoin` are sent with the first patch.
- [Changing the refusal code for non-nickname failures] → only `bots` and the E2E `pool` can fail
  besides the nickname, and neither is sent wrong by the client.

## Migration Plan

None: games live in memory. Deploy as usual.
