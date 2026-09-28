## Context

Moments are already detected in the client: the game screen compares successive views (the
viewer's `found` list for the "collected" notice, `finished`/`winnerSeat` for the result, the spare
id for a shift). Sounds are generated with WebAudio (`settings/feedback.ts`, two-note chimes).
Tiles slide with CSS transitions; the board is one SVG.

## Goals / Non-Goals

**Goals:** short, one-shot effects at pickup, win, rotation and shift; no controls, no text, no
dependency; honour reduced motion and the sounds setting.

**Non-Goals:** background music, haptics beyond the existing turn vibration, effects in the
how-to-play pictures, a lose animation.

## Decisions

- **Pickup detection for every seat:** compare each seat's `found` count with the previous view
  (seat → count map kept in the game screen, like the departed map). The square is the collector's
  pawn square in the new view (a treasure is collected by stopping on its tile). The effect is keyed
  by seat and count, so it plays once, and removed after 900 ms. The viewer's own pickup still shows
  the notice and plays the treasure chime; others' pickups are silent (sound only for your own).
- **Pickup look:** the treasure icon (same Tabler icon) drawn over the square rises 40 units and
  fades; a ring in the collector's colour grows from r 20 to r 48 and fades. Not tappable,
  `aria-hidden` (the notice line / player strip already say it).
- **Win celebration:** when the view turns finished with a winner (or the daily puzzle is solved),
  the board gets a celebration keyed by the finish: the winner's pawn hops three times (CSS on the
  pawn group) and 18 small pieces (squares and circles in the four seat colours, seeded positions so
  tests are stable) fly out from its square and fade within 1.2 s. Only on the transition to
  finished, not when opening an already finished game.
- **Spare rotation:** `SpareTile` draws the tile at rotation 0 inside a group rotated by a
  cumulative angle (+90 per turn of the same tile, reset when the tile changes), with a 180 ms
  transform transition. Cumulative so 270° → 360° keeps turning clockwise instead of spinning back.
  The drawn corridors are the same as before; tests reading `data-openings` of the spare now read
  the group's angle instead, so the spare exposes `data-rotation`.
- **Sounds:** `shift` = a low sine at 196 Hz, 90 ms, with a quick drop; `win` = C5 E5 G5; `finish`
  (someone else won) = G4 E4. Played from the game screen: shift when the synced spare changes (a
  shift landed) for seated viewers; win/finish on the transition to finished. Sounds setting governs
  all.
- **Reduced motion:** the global reduced-motion rule already shortens animations to ~0; effect
  components also skip the burst and the hop when `prefersReducedMotion()` is true, and the pickup
  icon only fades.

## NFR (openspec/context/nfr.md)

- Logging: none (visual only).
- Tests: render tests for pickup (appears for another seat's pickup, keyed, gone after the time),
  win celebration (on transition only, pieces and hop on the winner), spare angle accumulation,
  sounds chosen (shift for a player, none for a spectator, win vs finish) with `playSound` mocked.
- Performance: a few short CSS animations; nothing runs while idle. Bundle +1–2 kB.

## Risks / Trade-offs

- A 4× bot game shows frequent pickups; effects are short and keyed, so they never pile up.
