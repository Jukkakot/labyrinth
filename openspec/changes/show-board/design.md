# Design

## Context

What exists (see `docs/architecture.md`):
- **Rules:** `setupBoard(seed)`, the static `TILE_SET` (kind and treasure per tile id) and `createBoard()`.
- **Server:** `GameRoom extends LoggedRoom` with a players map, readable room ids, a 60 s reconnection hold and the command wrapper (unused so far).
- **Client:** a title page with i18n, the logger, the crash boundary and `serverUrl()`. There is no Colyseus client yet.

UI decisions already made:
- Tabler icons, corridor tile style (comparison page linked in `openspec/context/product.md`).
- CSS Modules with shared tokens and reusable components.
- Galaxy S24 (360×780) as the reference device.

## Goals / Non-Goals

**Goals:**
- A thin, typed path from server state to rendered board that later changes extend: shift animation, reachable-square highlights, turns.
- A UI foundation (tokens and components) that every later screen uses.
- E2E infrastructure that later changes only add tests to.

**Non-Goals:**
- Any game action.
- Nicknames, the lobby list, private games.
- Animations: they come with `tile-shift`, and nothing moves yet.
- Landscape-specific layout.

## Decisions

### 1. Synced state: ids and rotations only
```
GameState
  players: map<sessionId, Player { connected: boolean, seat: uint8 (1–4) }>
  squares: array<TileState { id: uint8, rotation: uint16 }>   // 49, row-major
  spare:   TileState
```
- Tile kinds and treasures come from the static `TILE_SET` on both sides, so they are never synced (State sync principle).
- The client rebuilds a real rules `Board` with `createBoard({ squares: squares.map(s => ({ id, kind: TILE_SET[id].kind, rotation })) … })`, so all rules functions work client-side.
- The seed is a plain private field on the room, not a schema field, so it is never synced.
- Alternative considered: syncing full tiles. Kinds and treasures are static, so it would add bytes and the risk of the catalogue and the synced data disagreeing.

### 2. Seed and setup on room creation
`GameRoom.onCreate`:
1. `super.onCreate()` sets the readable id.
2. `seed = crypto.randomInt(0, 2**32)` (node:crypto).
3. `setupBoard(seed)`.
4. Copy the result into the state.
5. `log.info("game.setup", { room, seed })`, with `game.setup` added to the server event catalogue.

### 3. Seats
The seat is assigned in `onJoin`: the lowest seat 1–4 that no player holds. `maxClients = 4` already makes Colyseus's `joinOrCreate` create a new room when every room is full. A dropped player keeps their seat while the reconnection hold lasts. Seat → corner is `START_CORNERS[seat - 1]`.

### 4. Client connection: `useGameSession` hook
States: `idle`, then `connecting`, then either `playing` (room, derived view) or `error`.
- **Play:** `client.joinOrCreate("game")`. The `reconnectionToken` is stored in `sessionStorage` (key `labyrinth.session`), which gives one player per tab.
- **On app start:** if a token exists, call `client.reconnect(token)`. On failure, clear the token and show the start screen.
- **State changes** rebuild an immutable view model: `{ board, seats: [{ seat, sessionId, connected }], me, roomId }`.
- **Logging:** `setLogContext({ room, player })` on join. Connection drop and restore log `client.conn.lost` / `client.conn.restored` through the SDK's drop/reconnect hooks. Join failure logs `client.error` and shows the error state.
- The waiting state says "Yhdistetään palvelimeen…". After 5 s it adds "Palvelin saattaa herätä, tämä voi kestää hetken" (Render's free tier sleeps).

### 5. Rendering with SVG
- `Board` is one `<svg viewBox="0 0 700 700">`, where each tile is a `<g>` 100 units wide. This is the corridor style validated on the comparison page:
  - rounded tile rectangle;
  - corridor strokes from the centre to each open side with butt caps;
  - a centre disc;
  - the treasure icon as a Tabler component rendered as a nested `<svg>`.
- Fixed tiles use a darker tile fill **and** a small corner notch mark, so they are recognisable without colour.
- `Pawn` draws seat shapes (circle, square, triangle, diamond) in the seat colour (Okabe–Ito: `#0072B2`, `#E69F00`, `#009E73`, `#CC79A7`) with a light outline. The viewer's own pawn gets a ring.
- The board size is `min(100vw − 32px, 60dvh)`, square. At 360 px that gives about 47 px per tile. The spare tile sits under the board with a label.
- SVG scales crisply at DPR 3, and later changes animate tile `<g>` transforms keyed by tile id.

### 6. UI foundation
- `client/src/ui/tokens.css` holds the colour tokens (moved from `index.css`), spacing (4-px scale), radii, the tap minimum and the seat colours. It covers light and dark (system) themes.
- Components, each with a `.module.css`:
  - `ui/Button` (primary and secondary, ≥44 px);
  - `ui/Badge` (small pill used by the game id);
  - `game/Board`, `game/TileView`, `game/Pawn`, `game/SpareTile`, `game/GameIdBadge`.
- Screens: `screens/StartScreen`, `screens/GameScreen`, plus the existing crash screen, which moves onto `Button`.
- Rule: anything shown in two places becomes a component, and colours come only from tokens.

### 7. Treasure icons and names
`game/treasureIcons.ts` holds `Record<TreasureId, TablerIcon>`. Typing it over the full union makes a missing icon a compile error. Localized names live under `treasures.<id>` in fi/en (the locale key-parity test covers them).

Rules `TREASURES` is renamed so the names match the icons:
- objects: `crown key gem coins sword shield book map scroll potion lamp chest`
- creatures: `dragon bat spider butterfly ghost cat fish horse beetle mouse skull deer`

Only the names change; ids, tile placement and the golden board are unchanged.

### 8. Game id badge
The badge text is the room id. Tapping it:
- builds `t("game.copyLine", { id, date, time, ver })`, with the date and time from `Intl.DateTimeFormat` in the current language;
- calls `navigator.clipboard.writeText`;
- shows "Kopioitu" for 2 s;
- on rejection, shows the line in a selectable field instead.

### 9. E2E workspace
- `e2e/` workspace with `@playwright/test`:
  - `playwright.config.ts`: project `galaxy-s24` = `devices["Galaxy S24"]`.
  - `webServer` starts the server (2567) and the client (5173), and reuses running ones locally.
  - `trace: "retain-on-failure"`.
- Tests use two browser contexts for two players.
- CI gets an `e2e` job: `npx playwright install --with-deps chromium`, run tests, upload `playwright-report/` on failure.

### 10. Leaving through Render's proxy
`add-logging` observed a Node SDK client retrying after `room.leave()` in production, although the server logged a clean consented leave. The UI has no leave action yet, so this change investigates only:
- run the SDK leave against production;
- inspect the close code the client sees;
- record the finding in the wiki.

If the cause is client-side, it is handled when `lobby` adds a leave action. Nothing is changed blindly now.

## Risks / Trade-offs

- [SDK bundle size] → `@colyseus/sdk` plus the icons must stay within 200 kB gzip; the size check in CI guards it. Icons are imported per name (tree-shaken).
- [Render cold start makes E2E flaky if pointed at production] → E2E runs against local dev servers only. The production check is a separate, manual task.
- [Reconnect token of a disposed room] → `reconnect` fails, the token is cleared and the start screen is shown. A test covers it.
- [Board too small on short screens] → `60dvh` caps the height. Landscape optimisation is out of scope, and landscape must only not break.

## Implementation notes

- **Bundle:** 148.9 kB gzip after adding `@colyseus/sdk` and 25 Tabler icons (was 90.9 kB);
  unused Tabler icons are tree-shaken. Budget 200 kB.
- **UI components added beyond the list:** `ui/Screen` (page frame with top bar and footer) and
  `ui/Message` (title, text, action) — shared by the start, connecting, error and crash screens.
  `LanguageSwitcher` moved to `ui/` on a CSS Module.
- **Testing Library cleanup:** Vitest globals are off, so `client/src/test/setup.ts` registers
  `cleanup()`; configured in `vite.config.ts` `test.setupFiles`.
- **Quick-play pools (added for E2E isolation):** `defineRoom(GameRoom).filterBy(["pool"])`;
  the client passes `?pool=…` from the URL to `joinOrCreate`. Each E2E test plays in its own
  pool, so tests never share games even though closed pages keep their seats for 60 s. Also
  usable by hand to meet specific people.
- **Bug found by E2E through the logs:** right after joining, the decoded state is empty until
  the first patch; the view model threw `state.squares is not iterable`. The failing E2E showed
  only the join-error screen, and `logs/dev.log` had the `client.error` line with the message.
  Fixed by treating a not-yet-decoded state as "no board yet" (unit test added).
- **Board edge:** corridors open toward the board edge are clipped to the tiles' outer edge
  (`clipPath`), found in the Galaxy S24 screenshots.
