## 1. Game engine (rules)

- [x] 1.1 `packages/rules/src/game.ts`: serialisable game state, `startGame`, `applyShift`, `applyMove` (collect, next target, win, pass turn), `botViewOf`, `botRngFor(state, seat)`; export from the package entry
- [x] 1.2 Tests: start (cards per seat count, start seat from the seed), shift and move outcomes, every rejection in the server's order, collect/home/win, JSON round trip, bot view hides other targets; property test: bot-vs-bot games through the engine stay legal and finish

## 2. Local room and routing (client)

- [x] 2.1 `client/src/session/localGameStore.ts`: save/load/clear the one local game (try/catch storage)
- [x] 2.2 `client/src/session/localRoom.ts`: `GameRoomLike` over the engine (synced-state shape, command results, bot pacing and fallback, save after every step, rematch creates the next game, leave drops it, start/finish log lines)
- [x] 2.3 Connector: `createBotGame` → local; `reconnect`/`joinById` route `local:` / `local-` ids; lazy Colyseus client untouched for local games
- [x] 2.4 Resume record: no age limit for local tokens
- [x] 2.5 Start screen and App: bot buttons and a local "Jatka peliä" do not wait for the wake-up; `?dev=1vN` starts at once
- [x] 2.6 Protocol: `client.local.started`, `client.local.finished` in the log catalogue
- [x] 2.7 Tests: local room (commands, rejections, bot turns with fake timers, restore, rematch, leave), connector routing, resume record, session starts a bot game with no network, start-screen render test (bot buttons enabled while waking)

## 3. Installable app (PWA)

- [x] 3.1 Add `vite-plugin-pwa` and `@vite-pwa/assets-generator`; generate and commit icons from `favicon.svg` (`npm run icons`)
- [x] 3.2 Vite config: manifest (names, icons, theme, standalone, portrait, base-relative scope), autoUpdate worker precaching the app shell, off in dev; `index.html` apple-touch-icon
- [x] 3.3 Check `npm run build` output (manifest, sw.js) and the size budget

## 4. Verify and document

- [x] 4.1 Check chain; UI check on mobile portrait: 1v2 starts at once, a reload continues it, leave and resume from the start screen; `vite preview` offline start
- [x] 4.2 Wiki: architecture (local play, engine, PWA), development (PWA in dev/preview, icons), operations (service worker updates after a deploy); roadmap item 15 marked done

Notes: the production smoke (`e2e/tests/prod.spec.ts`) now starts a local 1v1 game and then a server game via Pelaa + one bot, so it still exercises the live server. The Vite default favicon was replaced by a labyrinth icon, which the PWA icons are generated from.
