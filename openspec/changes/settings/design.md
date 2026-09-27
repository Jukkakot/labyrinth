# Design

## Context

The client already keeps small per-device records in localStorage (nickname, tips, daily record,
local games), each module with its own key and a try/catch around storage. Colours are tokens in
`client/src/ui/tokens.css` with a `prefers-color-scheme: dark` block. The shift is already a
two-step preview → confirm; a move is a single tap. The top bars of both screens hold the language
switcher; the game's top bar is already full (game id, spectators, autoplay, leave, language).

## Goals / Non-Goals

**Goals:** the product's per-user settings (confirm shift, confirm move, theme, sounds, vibration)
plus the turn notification, kept on the device, Finnish first.

**Non-Goals:** push notifications (product decision), sound files or a volume slider, syncing
settings between devices, a settings entry inside a running game (see decision 2).

## Decisions

1. **One store module, `client/src/settings/settings.ts`.** A typed `Settings` object under one
   localStorage key (`labyrinth.settings`), merged field by field over the defaults so an older or
   partly broken record still works; a tiny subscribe/notify store read with
   `useSyncExternalStore`, so a change applies at once in every mounted component.
2. **Entry point: a gear button in the start screen's top bar, opening a full settings view in
   place of the start content** (with "Takaisin"). A game screen entry is not added here: the
   game's top bar is full on a phone, and a panel there would replace or cover the turn controls,
   which is a placement decision left to the coordinator (see the job report). The settings that
   matter mid-game (sounds, notification) are set before a game in practice.
3. **Leave confirmation is not a setting.** The brief mentioned it, but leaving a running game is
   irreversible (the seat is lost) and the product's list does not include it; the question stays.
4. **Confirm shift off = one tap shifts with the current rotation.** Rotating first is still
   possible; the hint's preview is unaffected (it only selects, the player still taps).
5. **Confirm move on = choose, then confirm.** The chosen square gets the "selected" look (filled
   highlight outline) in `MoveTargets`; `MoveControls` shows "Kävele tänne" and "Peru" in place of
   "Jää paikalleen". Tapping the pawn's own square with the setting on is also a choice (stay).
6. **Theme via `data-theme` on `<html>`.** `system` removes the attribute; `light`/`dark` set it.
   The dark token block is written once for `@media (prefers-color-scheme: dark)` guarded by
   `:root:not([data-theme="light"])` and once for `:root[data-theme="dark"]` (duplication accepted:
   plain CSS cannot share a block between a media query and a selector without a build step).
   `color-scheme` follows so form controls match. Applied synchronously in `main.tsx` before
   React renders; a forced theme opposite to the device's may show the other background for a
   frame before the script runs in production (accepted; an inline script in `index.html` would fix
   it if it ever shows).
7. **Sounds generated with Web Audio** (a soft two-note sine chime for the turn, a brighter one
   for a treasure, ~0.25 s, low gain). No asset files, nothing added to the bundle budget beyond
   a few lines. The audio context is created lazily on first use and resumed; browsers that block
   it simply stay silent. Default on (product: "subtle sounds").
8. **Turn begins = `isMyTurn` goes from false to true** in a game with another seat, not
   spectating, not auto-played, not the daily puzzle, not finished. The first view already on my
   turn (game start where I begin) counts too. Vibration is one 80 ms pulse. The tab title changes
   only while `document.hidden` (product: "when backgrounded"); sound and vibration play whether
   hidden or not, since a visible phone lying on the table benefits too, and browsers usually
   block both in the background anyway.
9. **Vibration setting disabled where `navigator.vibrate` is missing** (iPhone, desktop), with a
   short note, per the "disabled, not hidden" UI rule.

## Risks / Trade-offs

- A turn sound in fast bot games repeats every few seconds → it is short and quiet, and one
  toggle turns it off.
- Autoplay of the viewer's own seat: no alert (the bot plays).

## NFR

- Logging: settings are local comfort choices and never affect the game; no log events (nothing
  to audit, and they are not personal data).
- Tests: store (defaults, merge, broken storage, notify), theme application, turn-alert logic
  (when it fires, title set/restored) as unit tests; one render test for the settings screen and
  one for a one-tap shift. No server or rules tests (nothing changes there).
- Limits and size: no new dependencies; bundle growth is a few kB.
