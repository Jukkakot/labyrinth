# Product decisions

Agreed before any capability was specified. Once a capability has a spec under
`openspec/specs/`, that spec wins over this file.

## Rules
- Original Ravensburger rules and limits, no house rules: 2–4 players; all 24
  treasure cards dealt evenly; only your current target card is secret; after
  collecting all your treasures, return to your own start corner to win; the
  game ends when the first player wins.
- Tile set: 16 fixed tiles; 34 movable tiles = 12 straight, 16 corner (6 with
  treasure), 6 T-junction (all with treasure); one movable tile is the spare.
- Starting player is random; turn order is clockwise by start corner.

## Modes and players
- Online multiplayer, humans + bots mixed, solo vs bots. No hot-seat.
- Identity = nickname only, no accounts. Session is per browser tab
  (sessionStorage), so two tabs = two players; reload rejoins the same seat.
  Nickname is remembered (localStorage) only as a prefill.
- One bot difficulty level. Bots act with a short delay so humans can follow.

## Lobby and game lifecycle
- Public lobby: list of open games, quick play, create public or private game.
  Private games are joined by invite link only (no code entry field).
- Waiting room: creator adds/removes bots in empty seats and presses Start
  (min 2 players). If the creator leaves the waiting room, the room closes.
- Turn limit 60 s. Nothing automatic happens; after it expires the other human
  players may kick the slow player.
- Leaving or being kicked removes the player with pawn and treasures. If only
  one human remains, they win; if the only human in a bot game leaves, the game
  ends.
- A dropped connection is not leaving: the player shows as disconnected and may
  return; the 60 s turn limit and kick still apply; after 5 min disconnected the
  player is removed automatically.
- Spectators can join and see everything, including secret targets.
- Rematch: "Play again" moves everyone who wants into a new waiting room with
  the same settings and bots.

## UI and UX
- Modern, minimalist, no clutter: no event log, no chat, no emoji reactions.
  The last push is shown on the board itself (animation + blocked reverse arrow).
- Mobile portrait is the design target; landscape must not break; desktop works.
  Android (Chrome) is the primary platform, iOS Safari must also work. Reference
  device: Samsung Galaxy S24 (360×780 CSS px, DPR 3) — the default for design
  checks and mobile tests.
  A dedicated landscape layout only if the board gets too small.
- Shift: tap an edge arrow → ghost preview → tap again / Confirm. Move: reachable
  tiles are highlighted, tapping one moves immediately; "Stay" is a button.
- The player's own target tile is always highlighted on the board.
- During a game the room's readable id (e.g. `brave-otters-sing`) is shown small in
  the top area. Tapping it copies "game id · local date and time · app version"
  to the clipboard for bug reports.
- Treasures and all UI icons come from Tabler Icons (line style). Board tiles use
  the corridor style: plain tile, corridor drawn in the accent colour, treasure
  icon on the corridor. Comparison page: https://claude.ai/artifact/UffuCoPpjAtHTYcBJJgCjz
- Styling: CSS Modules on shared design tokens; reusable components for
  everything shown in more than one place (buttons, badges, tiles, pawns).
- Players are distinguished by colour-blind-safe colour + pawn shape.
- Per-user settings (browser-local, never affect rules): confirm shift (default
  on), confirm move (default off), language, theme (system/light/dark), sounds,
  vibration. New comfort toggles of the same kind go here.
- Subtle sounds + vibration (Android). Turn notification when backgrounded: tab
  title + sound. No push notifications.
- Accessibility: basic level — WCAG AA contrast, ≥44 px targets, never colour
  alone, prefers-reduced-motion respected. Full screen-reader play is out of scope.
