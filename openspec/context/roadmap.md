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
11. ~~`quick-play-vs-bots`~~ (done): start screen "Pikapeli botteja vastaan" 1v1/1v2/1v3, a private game started at once against 1–3 bots
12. ~~`spectators-and-rematch`~~ (done): running public games and invite links to watch, bot-only
    games to watch at 1×/2×/4×, eye count for players, rematch with the same settings. Originally: **bot-only games to watch** (requested 2026-09-27): start a
    game of 2–4 bots and follow it as a spectator, maybe with a speed choice. A watched game then
    ends when its last spectator leaves, not "when no person is seated". Also useful for comparing
    bot strategies by eye
Direction (decided 2026-09-27): **single player first** (vs bots); multiplayer extras after.

13. `last-move-highlight`: after each turn, highlight for a moment the tile that was pushed in and
    the pawn's from and to squares, so an opponent's turn is easy to follow. No event log (the user:
    nobody reads it)
14. `resume-game`: the start screen offers "Jatka peliä" when the app was closed mid-game and the
    seat is still held
15. `local-play-and-pwa`: games vs bots run in the browser with `packages/rules` (no server, no
    wake-up wait, works offline) and the app installs to the home screen as a PWA. Multiplayer and
    watching stay on the server
16. `first-game-tips`: 3–4 hints during the first game (push a row from an arrow, walk to a
    highlighted square, your target, return home); shown once, can be reset
17. `smarter-bots` (**parallel candidate**: `packages/rules` only): a new `BotStrategy` with
    look-ahead; it blocks **all** opponents evenly, the leader with a slightly higher priority,
    while keeping its own target reachable; a bot tournament (simulation of many games) compares
    strategies by win rate; maybe difficulty levels. Fair: no knowledge of others' targets
18. `daily-puzzle`: one seed per day for everyone, solo: reach the treasure in as few turns as
    possible; result shareable as text (Wordle style). Builds on local play
19. `autoplay` (requested 2026-09-27): a player can hand their seat to the bot for a while and take
    it back; the chip shows it to everyone. Same fair `BotStrategy` as bots. To decide in the
    proposal: whether a dropped or timed-out player is auto-played instead of kicked
20. `settings`: confirmations, theme, sounds, **turn notification** (tab title, vibration, sound)
21. `share-and-colors`: share the invite link through the phone's share sheet (Web Share API);
    a player picks their own colour or avatar

## Improvement backlog

Ideas for existing features, picked up after the roadmap items above or when a change touches the
same area. Each becomes its own change (or joins a related one) when picked up.

- **Server wake-up progress** (start screen, spec `game-session` → early wake-up; suggested
  2026-09-27): while "Herätetään palvelinta…" is shown, count the seconds waited so far ("0:23"),
  and show a loading animation, so the player sees that something is waiting and progressing
  rather than stuck. Honour reduced motion.
