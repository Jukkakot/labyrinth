# Design

## Context

Bots already play through the room's command path (`GameRoom.playBotShift` / `playBotMove`, and
the same in `LocalRoom.scheduleBot`), triggered from `setTurn` when the seat on turn is a bot. The
fair view (`botViewOf`) already exists for any seat. Autoplay reuses exactly this for a person's
seat; what is new is the switch, the synced flag, taking over mid-turn, and the drop rule.

## Goals / Non-Goals

**Goals:** hand a seat to the bot and take it back at any time; everyone sees it; dropped
players are played for during the hold; same on the device's quick games.

**Non-Goals:** autoplay for timed-out connected players (kick stays), a separate autoplay
strategy or difficulty, autoplay in the daily puzzle, autoplay in the waiting room.

## Decisions

1. **Dropped → auto-played; timed-out → kick as before.** A drop is involuntary and usually short
   (screen off, network switch): playing for them keeps the game moving and keeps their place,
   which is what autoplay is for. A connected player who is just slow may be thinking or gone;
   auto-playing them would take their turn away, and the kick already solves a truly absent one.
   Keeping kick unchanged also avoids reworking `turns`/`KickControl`. The kick of a dropped player
   remains allowed by the rule, but in practice the bot finishes the turn in ~2.5 s.
2. **Why autoplay is on is kept server-side:** synced `Player.autoplay: boolean` (public), plus a
   room-private `Map<sessionId, "player" | "drop">`. Reconnect clears only `"drop"`. Turning it on
   by hand while dropped-autoplayed turns the reason into `"player"` (cannot happen from a dropped
   client, but keeps the rule simple). Turning it off always clears it.
3. **One command `setAutoplay { on: boolean }`**, idempotent. Checks: `NOT_SEATED` (incl.
   spectators), `WRONG_PHASE` when not running. Bots never send it.
4. **The autoplay actor** is `{ sessionId: <player's id>, bot: true }`; `shift`/`move` reject a
   non-bot actor on an auto-played seat with new code `AUTOPLAYING` (checked right after
   `NOT_SEATED`, before the engine). The audit line then shows `bot: true` for autoplayed steps.
5. **Scheduling:** `setTurn` schedules the bot when the seat on turn is a bot *or* auto-played
   (`isBotPlayed(seat)`). Turning autoplay on during the seat's turn schedules the current step:
   shift step → `playBotShift` after the shift pause; move step → a move-only choice after the
   move pause. Turning it off (or reconnecting from a drop) during the seat's turn clears
   `botTimer`. `playBotShift`/`playBotMove` re-check `isBotPlayed(seat)` when they fire, so a race
   never plays a step for a player who took back.
6. **Move-only choice** (taking over after the player's own shift): `lookaheadMove(view, rng)`
   from `botLookahead`, exported from the rules entry as `botMoveAfterShift` (a thin wrapper, so
   the room does not depend on the look-ahead's internals). The `BotStrategy` interface stays
   whole-turn; a replaced strategy only affects whole turns. Documented as a small asymmetry.
7. **Rng:** server bots keep their per-seat rng map; an auto-played seat gets one on first use,
   seeded the same way (`botSeed(dealSeed, seat)`). Local games use `botRngFor(game, seat)` as
   for bots.
8. **Local play:** `SavedLocalGame.autoplay?: boolean` (the one person's seat), so reload and
   "Jatka peliä" keep it. `LocalRoom.handle("setAutoplay")` mirrors the server's checks; the daily
   puzzle answers `WRONG_PHASE`. `scheduleBot` treats the person's seat as a bot while it is on.
   A fully auto-played local game has no "nobody left" end: it plays to a winner (bounded, as
   bot-only games are).
9. **UI:**
   - Chip: the existing `IconRobot` next to the nickname (same concept = same icon), accessible
     text "botti pelaa hänen puolestaan" / own "botti pelaa puolestasi".
   - Turn line on an auto-played seat's turn: "Botti pelaa: Maija" / own "Botti pelaa
     puolestasi"; the disconnected wording still wins when the seat is dropped (more important).
   - Controls: while the viewer's seat is auto-played, the controls area shows a small panel with
     the text and a primary "Ota vuoro takaisin" button instead of shift/move controls (disabled
     controls with a separate button would duplicate hierarchy). The kick control still wins when
     the viewer can kick (someone else's turn expired).
   - Handing over: a 44 px robot icon button in the top bar ("Anna botin pelata"), shown only to
     a seated player in a running non-daily game while not auto-played. Top bar keeps it
     secondary and reachable on anyone's turn; no confirmation (taking back is one tap).
   - Local optimistic nothing: the flag comes back through state like every command.
10. **Log:** `autoplay.changed { seat, on, reason: "player" | "drop" | "reconnect" }` on the
   server. Local games log nothing new (commands aren't logged locally either).

## Risks / Trade-offs

- Existing room tests that kick a *dropped* current player after expiry would now see the bot
  play first. → Those tests set bot delays longer than the (shortened) turn limit, or assert the
  new behaviour; checked while implementing.
- All people auto-played on the server with nobody at the screen: the game plays itself to a win
  (bounded), then idles like any finished game. Accepted.
- A player might miss that autoplay is on after coming back to the tab. → The turn line and the
  panel with "Ota vuoro takaisin" in place of the controls make it hard to miss.

## NFR (openspec/context/nfr.md)

- **Logging/audit:** `setAutoplay` goes through `LoggedRoom.command` (one audit line), autoplayed
  shift/move lines carry `bot: true`; `autoplay.changed` records reason; rejections get state facts.
- **Tests:** rules unit test for `botMoveAfterShift`; server room tests for the command's
  rejections, idempotence, bot playing an auto-played turn, taking over mid-turn (both steps),
  taking back cancelling the pending step, `AUTOPLAYING`, drop → autoplay, reconnect ends drop
  autoplay but not a chosen one; client tests for `LocalRoom` autoplay (incl. restore) and the
  view model; one render test for the take-back panel. No E2E change (critical path unchanged).
- **Limits/abuse:** the command is tiny, idempotent and seat-bound; toggling spam only reschedules
  one timer. No new rate limit.
- **Performance:** the bot choice already takes a few ms; no change.
- **Error UX:** `errors.AUTOPLAYING` fi/en strings.
