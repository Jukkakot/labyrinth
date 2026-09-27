## Context

The game screen shows a turn line, the player strip, the board with its edge arrows, and the step
controls (spare tile, rotate, "Vihje", "Työnnä") under the board. The `Notice` toast floats above
the bottom edge. There is no onboarding. The hint ring (`HintMark` in `TurnMarks.tsx`) draws a
thick `--highlight` (orange) ring on a surface halo; reach rings use the same orange.

A parallel job is changing how sessions run (local play in the browser), and `GameScreen.tsx`,
`useGameSession.ts` and `viewModel.ts` are hot files for this job, so the tips must plug in with
one line and depend only on plain values.

## Goals / Non-Goals

**Goals:** four one-time tips at the right moment; reset from the start screen; a hint ring that
stands out.

**Non-Goals:** a tutorial mode, pointing arrows or coach marks anchored to board elements, tips for
spectators or the waiting room, syncing tip state across devices.

## Decisions

- **Pure selection logic + a thin component.** `tips.ts` holds `pickTip(situation, seen)` (pure)
  and the storage helpers (`loadSeenTips`, `saveSeenTips`, `resetTips`, all try/catch, storage
  injectable for tests, key `labyrinth.tips.seen`, a JSON list of tip ids). `FirstGameTips.tsx`
  takes plain props `{ playing, isMyTurn, step, heading }` (heading: `"treasure" | "home"` or
  undefined) so it does not import the view model or the session.
- **Order: target → push → walk → home**, the first unseen relevant one wins. The target tip comes
  first because it is relevant from the first moment of the game (also while bots take their
  turns); push and walk follow on the viewer's own steps; home when the last treasure is found.
- **Seen when shown, not only when dismissed.** A tip is written as seen the moment it appears and
  it stays on screen until dismissed or until its moment passes (e.g. the push tip once the step
  becomes move). This keeps "shown once" true even if the player never taps ✕, and avoids tips
  nagging across reloads. Trade-off: a player who reloads while a tip is visible loses it; "Näytä
  vinkit uudelleen" covers that.
- **A tip whose moment passed is not re-queued**: it was seen. The next relevant unseen tip shows
  right away (e.g. walk after push).
- **Placement: a card fixed to the top of the screen over the top bar**, below the safe-area
  inset, max 36ch wide, centred. The bottom is taken by the step controls and the `Notice` toast;
  the board and its arrows must stay free. The top bar (game id, leave, language) is the least
  needed area during play, and the card is small and dismissable. Card look follows `Notice`
  (surface, border, radius-m, soft shadow) but in the surface colour so it does not read as an
  error or status toast. A lightbulb icon links it to "Vihje".
- **Dismiss:** an icon button "✕" (`aria-label` "Sulje vinkki"/"Close tip") 44 × 44 px. The card is
  a `role="status"` live region (polite), always mounted, so the text is announced when it
  appears.
- **Reset link in the start screen footer**, next to the rules version: "Näytä vinkit uudelleen",
  shown only when some tip has been seen; after a tap it turns into "Vinkit näytetään seuraavassa
  pelissä." A footer link is the least cluttering spot; it is rarely needed. The link is a text
  button with a 44 px tall hit area.
- **Tip texts** (fi first, en): short, one sentence each, naming the on-screen thing (arrow,
  highlighted square, purple ring for the target, start corner).
- **Hint ring look:** a colour of its own, the Okabe–Ito yellow `#f0e442` (colour-blind safe,
  unused on the board, matches the lightbulb of "Vihje") on a dark halo (`--text` in light mode;
  in dark mode the halo is the dark `--bg`), so it contrasts with light tiles, the orange reach
  rings and the purple target ring. It pulses: the ring's width and opacity breathe over 1.2 s;
  under `prefers-reduced-motion: reduce` it is static at full strength. The colour is a local
  custom property `--hint` in `TurnMarks.module.css` because this job may not touch
  `ui/tokens.css`; the coordinator may move it there (listed in the job report).

## How it meets the NFRs

- **Logging:** none; tips are local UI state with no server contact and no audit value.
- **Tests:** `tips.test.ts` covers the pure selection (order, one at a time, spectators, seen) and
  storage (round trip, blocked storage, reset). One render test for `FirstGameTips` (shown,
  dismissed, marked seen) and one for the reset link. The hint ring pulse is CSS only; the UI check
  (by the coordinator after the mount) covers the look.
- **Limits/performance:** no new dependency; a few hundred bytes of JS and CSS, well inside the
  bundle size budget.
- **Accessibility:** polite live region, 44 px targets, reduced motion respected, the tip never
  covers controls.

## Risks / Trade-offs

- Covering the top bar hides "Poistu" while a tip is up → the tip is one tap away from gone.
- The target tip also shows while bots are moving; it is informational and small.
- Tips are per browser, not per player: a shared device shows them once. Acceptable.
