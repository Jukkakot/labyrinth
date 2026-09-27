# Proposal

## Why

The first bot is greedy: it walks as close to its target as it can and ignores everyone else. It is
easy to beat and never gets in anyone's way, so a single player against bots (the project's
direction) has little to push against. Roadmap item 17 asks for the best bot we can make, with no
difficulty levels, that still stays fair and fun.

## What Changes

- A new look-ahead strategy replaces the greedy one as the bots' `BotStrategy`. It still collects
  (or wins) whenever it can this turn. Otherwise it picks the shift and square that give it the
  best chances on its next turn (over every shift it could then make), and it holds back the
  opponents: it prefers shifts that leave them fewer treasures within reach, all opponents evenly,
  the leader a little more, and it stops the next player's winning move when it can.
- Fair: it uses only public information (board, spare, pawns, card counts) and its own target.
- To stay fun and to guarantee that games end, it minds its opponents on four turns in five and
  plays only for itself on the others.
- A bot tournament (opt-in test) plays many games among strategies and reports win rates and
  time per turn; the greedy strategy is kept as its baseline.
- Workspaces: `rules` only (bot code, tests). The server keeps using `chooseBotTurn`, which now
  points to the new strategy; no server or client code changes.

## Capabilities

### New Capabilities

### Modified Capabilities
- `bots`: the "Bot turn choice" requirement changes from greedy closest-square to look-ahead with
  blocking.

## Impact

`packages/rules/src/bot.ts` (default strategy, greedy renamed), new `botLookahead.ts` and
`botTournament.ts` (not in the package entry), bot tests. Bot turns get slightly slower (a few ms
on a desktop, still far below the bot's 1.5 s pause). Wiki: `architecture.md`, `development.md`.
