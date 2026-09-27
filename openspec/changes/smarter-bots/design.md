# Design

## Context

Bots choose a whole turn through the replaceable `BotStrategy(view, rng)` over a fair `BotView`
(board, every seat's pawn / found / cards left, last insertion, own target). The server calls
`chooseBotTurn` once per bot turn, then pauses 1.5 s and 1 s for the animation. The greedy
strategy scores each allowed shift and reachable square by Manhattan distance to the target.
The roadmap asks for one best bot (no levels), look-ahead, even blocking with a slightly heavier
leader, fairness, a tournament, and a bot that stays fun and fast. Item 18 (`hint`) will run the
same strategy in the client, so it must be cheap on a phone.

## Goals / Non-Goals

**Goals:** a clearly stronger bot; only public information; a few ms per turn; games among bots
always end; a repeatable tournament with win rates and ms/turn.

**Non-Goals:** difficulty levels; modelling other players' targets from their past moves; deep
game-tree search; server or client changes.

## Decisions

1. **Score = own outlook − blocking penalty.** For every allowed shift S1 (rotations giving the same
   tile deduplicated) and every reachable square d:
   - collect now: 100 (win: 1000), so collecting always beats anything else;
   - otherwise: over every shift S2 the bot could make next on the board it leaves (all but the
     reverse of S1): `reach share − 0.1 × mean distance to the target` (7 while the target is out
     on the spare). The share rewards squares from which many shifts open a path, the distance
     breaks ties towards the target. Opponents' shifts in between are not modelled (too costly and
     unknown); the share already favours robust squares.
2. **Opponents' chance, without their targets.** An opponent's chance on a board = the share of the
   treasures (all 24 but the bot's own target) it could reach with *some* next shift, the union of
   what it reaches over all its shifts. Its real target is one of them, so this is the fair
   estimate of "could it collect next turn". An opponent with no cards left has a known target, its
   corner.
3. **Even blocking, leader a bit more:** penalty = `0.5 × mean over opponents of (weight × chance)`,
   weight 1.25 for the opponents with the fewest cards left, else 1. The mean (not the sum) keeps
   blocking from growing with the seat count; the tournament showed the sum made 4-player bots
   block too much and play worse (and games longer).
4. **Stop a win:** if the *next* player has no cards left and could get home after this shift, the
   penalty adds 3 × weight: more than the widest spread of the own outlook (≈ 2.4), so the bot
   blocks whenever it can, but far below collecting its own treasure. Only the next player is
   treated this way, because only it shifts the exact board the bot leaves; later players count as
   a sure chance in the mean.
5. **Blocking on four turns in five (`blockChance` 0.8, drawn first each turn from the bot's rng).**
   Pure blocking locked games: four bots all blocking one player heading home forever, and two
   bots on the same fixed square mutually blocking for 1500 turns. A random selfish turn now and
   then breaks every such lock (termination with probability 1; 0 unfinished in 1800 tournament
   games) and gives a blocked person a way through, which keeps it fun. Reproducibility is kept:
   the draw comes from the seeded bot rng.
6. **Fast board model.** `botLookahead.ts` uses typed arrays (open-side masks, kinds, ids), a
   precomputed pawn-after-shift table and a stamp-based BFS, so about 44 × 44 shifts with one BFS
   per player each cost ~2–4 ms per turn on a desktop. The ordinary rules functions stay the
   truth: tests check the choice against a slow reference written with `shiftBoard` /
   `reachableSquares`, and every simulated turn is replayed through the rules.
7. **Weights from the tournament** (60–100 games per variant, seeds 1000+): block 0 lost clearly
   (2-player 73 % vs greedy instead of 95 %); block ≥ 1 and distance 0.3 lost head-to-head against
   the defaults; leader 0 / 1 were within noise, 0.25 kept per the roadmap's "slightly".
8. **Greedy kept as `greedyBotTurn`**, only as the tournament baseline. `chooseBotTurn` keeps its
   name so the server wiring does not change.

### Tournament (300 games per lineup, seats rotated, seeds 1–300)

| Lineup | Look-ahead wins | Fair share | Mean turns |
|---|---|---|---|
| look-ahead vs greedy | 90 % | 50 % | 43 |
| look-ahead vs 2 greedy | 61 % | 33 % | 40 |
| look-ahead vs 3 greedy | 42 % | 25 % | 39 |
| 2 look-ahead | – | – | 50 |
| 4 look-ahead | – | – | 48 (4 greedy: 37) |

Time per turn (desktop, Node): mean 1.8 ms (2 players) to 3.8 ms (4 players), worst 51 ms (JIT
warm-up of the first turns). A phone is roughly 5× slower: ~20 ms mean, well under the 200 ms aim.

## NFR (openspec/context/nfr.md)

- **Logging:** nothing new; the server's existing `bot.fallback` still covers rejected choices.
- **Tests:** spec scenarios in `bot.test.ts` (reference check of the look-ahead, blocking
  statistics over 40 positions, blocking a win, properties); the simulation test (`BOT_SIM=full`)
  plays whole games with the new bot; the tournament is opt-in (`BOT_TOURNAMENT=<games>`) because
  it takes minutes.
- **Limits:** CPU per bot turn measured by the tournament (above); no memory kept between turns.

## Risks / Trade-offs

- Games among bots are ~30 % longer (more blocking). Acceptable: a person plays against them and
  the bot pause dominates the time anyway.
- "Fun" is judged only by proxies (game length, the 1-in-5 selfish turn). If people find it too
  blocking, lower `block` or `blockChance`; if too weak, raise them. Both are single numbers in
  `DEFAULT_WEIGHTS`.
- Collected treasures of others are not excluded from their possible targets (the view gives only
  counts). Adding the found list to `BotView` would sharpen the estimate slightly; left out to keep
  the server untouched.
