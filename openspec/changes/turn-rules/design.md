# Design

## Context

`GameRoom` syncs seats (with a `connected` flag), pawns, `turnSeat`, `phase` (`shift` → `move`,
`finished`) and `winnerSeat`. Turn passing (`passTurn`) lives in the room. An unintended
disconnect goes through Colyseus `onDrop` → `holdSeat` → `allowReconnection(client, 60)`; when
the window ends Colyseus calls `onLeave`, which deletes the player and passes the turn if it was
theirs. An intentional `room.leave()` (e.g. "Uusi peli") also ends in `onLeave`. There is no
waiting room yet, so players sit down into a running game one by one, and a lone player keeps
the turn. Colyseus facts checked in `@colyseus/core` 0.18: `allowReconnection()` returns a
deferred whose `reject()` ends the hold at once and routes to `onLeave`; a server-side
`client.leave(code)` with a code other than 4000 goes through `onDrop` first; the SDK passes a
custom close code (4xxx) straight to the client's `onLeave(code)`; `this.clock` is ticked by the
patch interval.

## Goals / Non-Goals

**Goals:** a server-owned turn clock visible to all, a validated `kick` command, one removal path
for every way of leaving, a 5-minute seat hold with a visible disconnected state, the last player
standing wins, and the client UI for all of it.

**Non-Goals:** an in-game leave button (`lobby` brings navigation), ending a bot game when its only
human leaves (`bot-player`), sounds/vibration/tab-title alerts when the time runs out (`settings`),
voting on kicks, penalties beyond removal, pausing the clock for disconnected players.

## Decisions

Autopilot decisions (made without review; revisit freely):

1. **One kick is enough, no vote.** Any other seated player may kick once the time is up. Most
   games have 2–3 humans, where a vote is the same as a single request; a majority rule would add
   state and UI for little gain. Bots (later) never kick.
2. **The kick names the seat.** Payload `{ seat }`. It must equal `turnSeat`, which makes a stale
   kick (the slow player finished just before) fail with `NOT_KICKABLE` instead of hitting the next
   player. Kicking oneself is `NOT_KICKABLE` too.
3. **Clock state = deadline + expired flag.** The room syncs `turnDeadline` (server epoch ms,
   `0` = no clock) for the countdown and `turnExpired` (boolean) as the authoritative "time is up".
   The server sets the flag from a `this.clock` timeout, logs `turn.expired`, and `kick` checks the
   flag. The client computes `remaining = clamp(deadline − Date.now(), 0, 60 s)`; phone clocks are
   NTP-synced, so skew is small and only affects the display. The kick control follows
   `turnExpired`, never the local countdown, so skew can never let a client kick early.
   *Alternatives:* syncing the remaining seconds every second (60 patches per turn, jumpy with
   latency); counting locally from the moment the turn arrived (wrong after a reload); a time-sync
   handshake (not worth it for a display).
4. **Clock only with two or more players (temporary).** Before `lobby`, the first player waits
   alone; a clock would let the joining player kick them at once. The clock starts when a turn
   starts with ≥ 2 seated, or when the second player sits down (full 60 s from then), and stops
   (deadline 0, not expired) when only one is left. `lobby` makes this moot.
5. **"Under way" = a shift with ≥ 2 seated (temporary).** Last-player-standing needs a started
   game; before `lobby` a private `contested` flag is set by the first shift made while at least two
   players are seated. Without it, a player joining and leaving at once would hand the waiting
   player a win.
6. **One removal path.** `removePlayer(sessionId, reason)` deletes the player (pawn, stack
   progress, view), logs `player.removed { seat, reason, by? }`, then: finished game → nothing
   more; exactly one player left and `contested` → that player wins (`game.finished { reason:
   "lastPlayer" }`); else if it was their turn → `passTurn()`; else if one player is left → stop the
   clock. `onLeave` calls it with `left` (consented) or `timeout` (hold expired) unless the player
   is already gone.
   - **Kick of a connected player:** `removePlayer(…, "kicked")` first (state changes before the
     command replies), then `client.leave(CLOSE_KICKED)`. The following `onDrop` sees no player and
     does not hold a seat; `onLeave` then finds nothing to remove.
   - **Kick of a dropped player:** `removePlayer` first, then reject the stored reconnection
     deferred, which ends the hold; a reconnect attempt afterwards fails and the client lands on the
     start screen (existing behaviour).
7. **Close code 4100 = kicked** (`CLOSE_CODES.KICKED` in protocol, outside Colyseus' 4000–4010).
   The client's `onLeave(code)` stores an end reason `kicked`; the start screen shows it as a calm
   message until the next Play.
8. **Seat hold 300 s** (`DISCONNECT_LIMIT_SECONDS` in rules; was 60). Reload still rejoins through
   the same token.
9. **Rules package owns the numbers and pure checks:** `TURN_TIME_LIMIT_SECONDS = 60`,
   `DISCONNECT_LIMIT_SECONDS = 300`, `nextSeat(taken, from)` (moved out of the room),
   `kickRejection({ kicker, target, turnSeat, expired, finished })` → error code or undefined,
   `soleSurvivor(seats)`. The room only wires timers and state.
10. **Test hooks for time:** the room reads its limits from instance fields (`turnLimitMs`,
    `disconnectLimitSeconds`) that room tests shorten; no fake timers over live websockets.
11. **UI:**
    - `TurnTimer` inside `TurnLine`: `m:ss` in tabular numbers; last 10 s bold + warning token +
      a clock icon (not colour alone); "Aika loppui" when expired. It re-renders itself every
      250 ms and has `role="timer"` (implicitly not live) with an "Aikaa jäljellä m:ss" label, so
      screen readers can read it on demand without being flooded every second.
    - `KickControl` replaces the (disabled) step controls under the board for other seated players
      while `turnExpired`: text "Pelaaja N:n aika loppui" + secondary button "Poista pelaaja N"; a
      tap shows "Poistetaanko pelaaja N pelistä?" with "Poista" (primary) and "Peru". The confirm
      state resets when the turn key changes. Same slot and width as the other controls.
    - Disconnected: `PlayerStrip` chip dimmed with a Tabler `wifi-off` icon; `TurnLine` says
      "Pelaaja N – yhteys katkennut" for the current player.
    - Departure notice: `GameScreen` compares seat sets between views and shows "Pelaaja N poistui
      pelistä" in the shared `Notice` (lowest priority after rejection and collect messages).
    - A last-player win shows the normal "Voitit!" result; the departure notice explains why.

## How the NFRs are met

- **Logging/audit:** `kick` goes through `LoggedRoom.command()` (one `cmd.accepted`/`cmd.rejected`
  line; rejections carry `phase`, `turnSeat`, and the new state fact `turnExpired`). New catalogue
  events `turn.expired` and `player.removed`; `game.finished` gains `reason`. No IPs, no new
  personal data.
- **Tests:** rules unit tests per spec scenario (`nextSeat`, `kickRejection`, `soleSurvivor`) plus a
  fast-check property for `nextSeat`; server room tests for the clock (short limits), kick
  rejections and acceptance, dropped-player kick, disconnect timeout, last-player win and the
  logs; client component tests for `TurnTimer`, `KickControl`, the disconnected chip, the departure
  notice and the kicked message. E2E smoke test unchanged.
- **Limits/abuse:** `kick` is an ordinary command under the existing per-connection handling; it
  only works in a narrow state and changes nothing when rejected. Timers are cleared on turn change
  and room dispose.
- **Performance:** one 250 ms interval in a tiny component; two small synced fields per turn.

## Risks / Trade-offs

- [Clock skew on a phone makes the countdown a few seconds off] → the server flag decides; the
  display is clamped to 0–60 s.
- [A kicked player's connection closes with a non-consented code, so the SDK could try to
  reconnect] → the SDK only auto-reconnects on 1001/1005/1006/4010; 4100 goes straight to
  `onLeave`. A room test asserts the kicked client receives code 4100.
- [Order of Colyseus hooks after `client.leave()`] → `removePlayer` runs first and the hooks are
  idempotent (they check that the player still exists).
- [Five-minute holds keep empty rooms alive longer] → only while someone may come back; the room is
  disposed as before when the last hold ends.

## Migration Plan

No persisted data. Deploying restarts the server and ends running games (accepted). Rollback =
redeploy the previous commit.
