# Proposal

## Why

A new player against the look-ahead bots (the project's direction: single player vs bots) often
does not see a good shift, and nothing in the game teaches one. Roadmap item 18 asks for a "Vihje"
button that shows the move the best bot would make for you. The backlog item "Bots rule out found
treasures" improves the same bot: it still counts treasures that are already found (public
information) as possible targets of an opponent, which blurs its blocking.

## What Changes

- The bot's view can carry each seat's public list of found treasures. The look-ahead bot then
  counts only treasures nobody has found yet (and not its own target) as an opponent's possible
  targets. Without the lists it behaves as before.
- A hint, computed in the rules package from the player's own information only (board, spare,
  pawns, public found lists and card counts, the last insertion, the player's own target): the
  best bot's shift and destination for the shift step, or just the destination for the move step
  after a shift. It is deterministic: the same position always gives the same hint.
- A "Vihje" button in the game screen's step controls, enabled only on your own turn while no
  command waits for the server (disabled, not hidden, otherwise). In the shift step it previews the
  hinted shift (arrow selected, spare turned) and rings the square to walk to; in the move step it
  rings the square. Nothing is sent: the player still confirms and moves. Unlimited use.
- Workspaces: `rules` (bot view, look-ahead, hint), `client` (button, ring, wiring). The server
  needs a one-line follow-up to pass the found lists to its bots (outside this change's files; the
  bots keep working without it).

## Capabilities

### New Capabilities

### Modified Capabilities
- `bots`: "Bot turn choice" - an opponent's possible targets exclude treasures already found.
- `board-view`: new requirement "Hint" (button, what it shows, when it is enabled).

## Impact

`packages/rules/src/bot.ts` (seat view gains found treasures), `botLookahead.ts` (found treasures,
move-step search), new `botHint.ts`, `botTournament.ts` (passes found lists), rules tests.
Client: `client/src/game/` (hint adapter, ring mark, button in the step controls),
`GameScreen.tsx`, locales. Wiki: `architecture.md` (bots / client hint).
