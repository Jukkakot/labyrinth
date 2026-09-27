# Roadmap

One OpenSpec change at a time, in this order. Adjust as we learn.

0. ~~`setup-infrastructure`~~ (done): Pages and Render live, server URL, CORS, MCP and VS Code debugging
1. ~~`add-logging`~~ (done): structured JSON logging, audit of commands and HTTP, client log shipping
2. ~~`add-board-model`~~ (done): tiles, board, connections, rotation (rules only)
3. ~~`add-board-setup`~~ (done): original tile distribution, treasures, seeded shuffle
4. ~~`show-board`~~ (done): quick play creates a room; the client renders the board on mobile
5. ~~`tile-shift`~~ (done): shift rule, turn order, `shift` command, arrows with preview and confirm
6. ~~`pawn-movement`~~ (done): pawn squares, shift → move turn, `move` command, reachable highlight, walking pawns
7. ~~`treasures-and-win`~~ (done): seeded deal, secret target, collect, return home, finished game, target highlight and result
8. ~~`turn-rules`~~ (done): 60 s turn clock, kick after the time is up, 5 min disconnect hold, last player standing wins
9. ~~`lobby`~~ (done): nickname, open games list, private games and invite links, waiting room with host start (24/n cards, random start seat), host leaving closes the room, game cap, local-first leave with a leave button in the game
10. ~~`bot-player`~~ (done): host adds/removes bots in the waiting room, greedy bots behind a replaceable `BotStrategy`, bot turns through the normal command path, game ends when no person is left
11. `quick-play-vs-bots`: start screen quick games against bots, "Pikapeli 1v1", "1v2", "1v3"
    (the player alone against 1–3 bots, straight into the game). Requested 2026-09-27 to follow
    `bot-player` directly
12. `spectators-and-rematch`
13. `settings`: confirmations, theme, sounds, turn notification

## Improvement backlog

Ideas for existing features, picked up after the roadmap items above or when a change touches the
same area. Each becomes its own change (or joins a related one) when picked up.

- **Server wake-up progress** (start screen, spec `game-session` → early wake-up; suggested
  2026-09-27): while "Herätetään palvelinta…" is shown, count the seconds waited so far ("0:23"),
  and show a loading animation, so the player sees that something is waiting and progressing
  rather than stuck. Honour reduced motion.
- **Smarter bots** (suggested 2026-09-27; the user wants bots as smart as possible eventually):
  a new `BotStrategy` in `packages/rules` (look-ahead over the next players' shifts, blocking the
  leader, keeping own target reachable), compared with the simple one in the bot simulation test;
  maybe difficulty levels. Bots stay fair: no knowledge of others' targets.
