## Why

Players want to tune the game to their device and habits: a quicker shift without the confirming
second tap, a safer move with one, dark or light colours regardless of the phone's setting, and a
cue when their turn comes while they look away. Roadmap item 21; the settings list comes from
`openspec/context/product.md` (per-user settings, subtle sounds, turn notification).

## What Changes

- A settings screen ("Asetukset"), opened from a gear button in the start screen's top bar and
  closed with "Takaisin". Settings live on the device (localStorage), never affect the rules and
  never reach the server.
- **Confirm shift** (default on, today's behaviour): off → tapping an edge arrow shifts at once
  with the spare's current rotation.
- **Confirm move** (default off, today's behaviour): on → tapping a reachable square marks it,
  and a second tap or "Kävele tänne" moves; "Peru" drops the choice.
- **Theme**: system (default), light or dark; applied at once and before the first render.
- **Sounds** (default on): a short soft chime when the viewer's turn begins and when they collect
  a treasure. Generated in the browser (no audio files).
- **Turn notification**: while the page is hidden, the tab title shows "Sinun vuorosi" until the
  player comes back or the turn ends (setting "Välilehden otsikko", default on); a short vibration
  when the turn begins (setting "Värinä", default on, disabled where the device cannot vibrate).
- Language stays in the top bar's switcher (unchanged).

Workspaces: **client** only (no rules, server or protocol change).

## Capabilities

### New Capabilities

- `settings`: the per-device settings, their defaults and effects (confirmations, theme, sounds,
  turn notification).

### Modified Capabilities

(none; the default settings keep today's shift and move behaviour)

## Impact

- `client/src/settings/` (new): settings store, theme, sounds, turn alert, settings screen.
- `client/src/screens/StartScreen.tsx`: gear button and the settings view.
- `client/src/screens/GameScreen.tsx`: small wiring (confirm settings, turn alert hook, treasure
  sound); `MoveTargets`/`MoveControls`: chosen square and its confirm/cancel.
- `client/src/ui/tokens.css`: dark tokens also under a forced theme.
- i18n fi/en; wiki `docs/architecture.md` (client settings paragraph).
