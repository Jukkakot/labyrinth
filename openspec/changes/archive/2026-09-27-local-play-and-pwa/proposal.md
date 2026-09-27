# Proposal

## Why

Direction is single player first, but a game against bots still needs the Render server: the first
tap after a quiet spell waits up to a minute for it to wake, and nothing works offline or after a
deploy. The rules and the look-ahead bot already run in the browser (the hint uses them), so a game
against bots can run entirely on the phone, start at once, and work without a network. Installing
the app to the home screen makes it feel like a real game and is the base for the daily puzzle.

## What Changes

- **Local bot games.** "Pikapeli botteja vastaan" 1v1/1v2/1v3 (and the dev shortcut `?dev=1vN`)
  start a game that runs in the browser with `packages/rules`: no server, no wake-up wait, works
  offline. It looks and plays like today's quick bot game (same board, bots, pacing, hint, turn
  marks, result, "Pelaa uudelleen"), but has no turn clock (nobody can kick anyone) and no
  spectators.
- **Local resume.** The local game is saved on the phone after every step. A reload continues it;
  a reopened app offers "Jatka peliä" for it with no 5-minute limit, even offline. Leaving,
  finishing or starting another game forgets it.
- **Online stays online.** Quick play, private games, invites, the open list, watching and bot-only
  games to watch still use the server and still wait for it to wake. The start screen's bot-game
  buttons and a local "Jatka peliä" no longer wait for the server. An online game never turns into
  a local one.
- **Installable app (PWA).** A web app manifest (name, icons, theme colour, standalone, portrait)
  and a service worker that caches the app shell, so the app installs to the home screen, opens
  offline and updates itself on the next load after a deploy.
- **Game engine in rules.** A pure game engine (start, shift, move, collect, win, bot view) in
  `packages/rules`, composing the existing rule functions, used by the local game. The server
  keeps its own room code for now.

## Capabilities

### New Capabilities
- `installable-app`: home-screen install, offline start, self-update of the web app.

### Modified Capabilities
- `bots`: "Quick game against bots" runs on the phone, starts without waiting for the server,
  works offline, has no turn clock.
- `game-session`: "Resume after closing the app" also covers the local game (no time limit, not
  disabled while the server wakes).
- `observability`: local games report their start and end in the shipped client logs.

## Impact

- Workspaces: **rules** (new game engine module and tests), **client** (local room behind the
  existing session interface, connector routing, start screen, resume record, PWA build config,
  icons, i18n), **protocol** (two client log event names). **server**: no change.
- New dev dependencies: `vite-plugin-pwa` (Workbox) and `@vite-pwa/assets-generator` for the icons.
- Hosting: GitHub Pages serves the manifest and service worker under `/labyrinth/`; no new service,
  0 €.
- Wiki: architecture (local play, PWA), development (PWA in dev and preview, icons), operations
  (service worker updates after a deploy).
