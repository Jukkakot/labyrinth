# Design

## Context

- The client talks to a game only through `GameRoomLike` (state, `onStateChange`, `request`,
  `leave`, reconnection token) and a `Connector` that creates rooms (`useGameSession.ts`).
  `toGameView()` accepts any plain object shaped like the synced state.
- The rules package has every rule the server applies (`shiftBoard`, `isReachable`, `settleMove`,
  `dealGame`, `nextSeat`, `chooseBotTurn`); the server composes them in `GameRoom`, the tournament
  in `simulateGame`. The client already bundles the look-ahead bot for the hint.
- Client JS budget: 200 kB gzip over `dist/assets/*.js`.

## Goals / Non-Goals

**Goals:** quick bot games with no server; resume them any time; installable, offline-capable app
that updates itself.

**Non-goals:** moving online games, spectating or bot-only watching to the device; moving the
server onto the new engine (possible later); an in-app install button; an offline banner;
syncing a local game to another device.

## Decisions

1. **A pure game engine in rules (`packages/rules/src/game.ts`).** Plain immutable data
   (`LocalGameState`: board, seats with name/bot/pawn/stack/found, phase `shift|move|finished`,
   turn seat, last insertion, winner, turn count, deal seed) and functions `startGame(seed, seats)`,
   `applyShift`, `applyMove`, `botViewOf`, each returning the new state or a rejection code from
   the server's code set (`NOT_YOUR_TURN`, `WRONG_PHASE`, `REVERSE_PUSH_FORBIDDEN`,
   `UNREACHABLE`). The rule tests move with it; the engine is JSON-serialisable (tile ids +
   rotations) so it can be saved. *Alternative:* a client-only engine — rejected, rules logic
   belongs in rules and the daily puzzle will reuse it. The server is not rewired now (hot file,
   no behaviour gain); noted as a later cleanup.

2. **`LocalRoom` implements `GameRoomLike` (`client/src/session/localRoom.ts`).** Its `state` is a
   `SyncedState` built from the engine (players keyed `me` / `bot:<seat>`, targets only for the
   player — so the view is identical to an online game), `request()` resolves `CommandResult`
   like the server, `onStateChange` listeners fire after each step. Bots play through the same
   `request` path with the server's pacing (shift after 1.5 s, move 1 s later) and the server's
   fallback (reject → an allowed shift and stay). The session, view model, screens, hint and turn
   marks need no change. *Alternative:* a separate `useLocalGame` hook — rejected, it would fork
   every screen's wiring.

3. **Routing by id prefix in the connector.** `createBotGame` → a new local game. Local room ids
   are `local-<random words>`; tokens `local:<roomId>`. `reconnect(token)` and `joinById(id)` with
   the local prefix go to the local store, everything else to Colyseus. The Colyseus client is
   created lazily, so a local game never touches the network. *Rationale:* the rematch and resume
   paths in `useGameSession` work unchanged.

4. **Persistence.** One saved local game in `localStorage` (`labyrinth.localGame`: room id, engine
   state, player name, saved at). Saved after every step; removed on leave and when the game
   finishes and the player leaves; replaced by a new local game. Rematch: the room answers
   `rematch` by creating and saving the new game and syncing its id as `rematchRoomId`; the session
   then `joinById`s it. Storage blocked → the game still plays, it just cannot resume.

5. **Resume without the 5-minute limit.** `loadResume` skips the age check for a `local:` token;
   the start screen enables "Jatka peliä" for it while the server wakes. Per-tab token
   (sessionStorage) reload works as for online games, via `reconnect`.

6. **Bot randomness after a resume.** The bot's rng is re-seeded per turn from
   `botSeed(dealSeed, seat)` mixed with the turn count, so a resumed game needs no saved rng
   state and stays reproducible from the deal seed.

7. **No turn clock locally** (`turnDeadline = 0`, never expired): kicking a bot or being kicked by
   one makes no sense, and a phone game may be paused. Recorded as a spec difference.

8. **Start screen.** 1v1–1v3 are disabled only for an invalid nickname; `?dev=1vN` no longer waits
   for the wake-up. Everything online is unchanged.

9. **PWA with `vite-plugin-pwa`** (established, Workbox): `registerType: "autoUpdate"`, precache
   the built JS/CSS/HTML/SVG/PNG, navigation fallback to `index.html`, manifest with
   `start_url`/`scope` relative to the Vite `base` (`/labyrinth/` on Pages), `display:
   standalone`, `orientation: portrait`, theme `#1f3a2e`. Disabled in `vite dev` so the dev
   server behaves as before; `vite preview` exercises it. Icons (192, 512, maskable 512, apple
   180) generated once from `favicon.svg` with `@vite-pwa/assets-generator` (`npm run icons -w
   @labyrinth/client`) and committed. *autoUpdate* reloads right after a new worker takes over,
   which happens shortly after opening; both kinds of game survive a reload (decision 4 and the
   existing token rejoin), so no prompt is needed.

10. **Logging.** Two catalogue events: `client.local.started { room, dealSeed, seats, startSeat }`,
    `client.local.finished { room, winner, turns }` (winner 0 = left). The shipper already
    buffers failed sends (max 200 entries), which covers offline play. No per-command lines
    locally (a local rejection still logs `client.cmd.rejected` through the session as today).

## How the NFRs are met

- **Tests:** engine rule outcomes in rules unit tests (start, shift/move/collect/win, every
  rejection, serialisation round trip, bot view fairness; a property test that bot-vs-bot games
  through the engine stay legal). Client: `LocalRoom` (commands, bot pacing with fake timers,
  save/restore, rematch, leave), connector routing, resume record, and one session test that a
  bot game starts without the network. Screens: one render test that the bot buttons are enabled
  while waking. E2E smoke unchanged (Play is still online).
- **Logging:** decision 10. **Limits:** the server's game cap no longer counts quick bot games
  (fewer rooms on Render). **Performance:** no new runtime code of note beyond the engine; the
  service worker is outside `dist/assets` and the budget; bot turns take a few ms.
- **Budget:** GitHub Pages only, 0 €.

## Risks / Trade-offs

- Server and engine hold the same composition twice → both are thin over the shared rule
  functions; engine tests mirror the room's rejection order. Later: the room can use the engine.
- A stale service worker could serve an old client against a new server → autoUpdate plus the
  existing version reporting; online joins already fail calmly.
- GitHub Pages cache headers are short, so the worker file itself updates promptly.
- iOS: install via "Lisää Koti-valikkoon" only; acceptable (Android primary).

## Open Questions

None blocking.
