# Design

## Context

The look-ahead bot (`botLookahead.ts`, change `smarter-bots`) scores every shift and square by the
bot's chances on its next turn (over every shift it could then make) minus the opponents' chances
on the board it leaves. It never plays turns in alternation: between the bot's turns every
opponent shifts too, which it ignores, and it cannot know their targets. It costs ~2–4 ms per turn
on a desktop. The same strategy drives the server's bots, the device's quick games, autoplay and
the hint, all through `chooseBotTurn` / `botMoveAfterShift` / `hintTurn` / `hintMove` in the rules
package.

## Goals / Non-Goals

**Goals:** a clearly stronger bot that stays fair (no hidden information), not more blocking, and
well under ~100 ms per turn on a phone; decided by the tournament; server and client untouched.

**Non-Goals:** difficulty levels; full-game tree search; learning opponents' targets from their past
moves; moving the bot off the main thread.

## Decisions

1. **Refine the look-ahead's best choices, don't replace it.** The look-ahead scores every choice
   (`scoreTurns`, now exported with its fast board model). The sampling bot takes its best 10
   choices, at most 2 squares per shift (so the candidates cover several shifts), and plays each
   out. Collecting stays absolute: when some choice collects, only collecting choices are
   compared; a winning move is taken at once. The look-ahead's own blocking draw (`blockChance`
   0.8) is reused, so the bot still plays only for itself on about one turn in five.
2. **Play-out = one round with good moves for everyone.** After the candidate, every opponent in
   seat order and then the bot make a greedy turn on the fast board (collect if some shift allows,
   else end closest to the target; ties at random). Deeper play-outs (2 rounds) cost twice as much
   and were no stronger in the tournament (65 / 46 / 37 % vs 67 / 36 / 38 %, within noise).
3. **Fair sampling.** Each play-out draws the opponents' targets (and everyone's next targets once
   one is collected) from a shuffled deck of the treasures that could still be anyone's target:
   all 24 minus the bot's own target and every treasure found by anyone. An opponent with no cards
   left is heading for its corner (public). The bot's own later targets are sampled the same way.
4. **Common random numbers.** Every candidate is played out against the same sampled decks and the
   same dice, so the comparison measures the choice, not the luck.
5. **Value = own standing − 0.5 × mean opponents' standing** (the latter only on a turn that minds
   the opponents; leader weighted 1.25 as in the look-ahead). Standing = treasures collected in the
   play-out − 0.1 × distance to the current target at the end (7 while it is on the spare); a win
   counts 5. The look-ahead score is added with weight 0.2 so near-equal averages follow it.
   Block 0.25 / 0.5 / 1 were within noise; 0.5 kept (same as the look-ahead).
6. **A turn budget, not a sample count.** `budget` = 160 play-out turns per bot turn, shared out
   as `160 / (candidates × players)` play-outs per candidate (8 with two players, 4 with four; at
   least 4). This keeps the time per turn flat across seat counts (~11 ms on a desktop). A fixed
   sample count made 4-player turns twice as slow as 2-player ones. Budget 240 was no stronger
   (72 / 47 / 30 % vs 74 / 45 / 32 %) and 40 % slower.
7. **Reproducible, not time-boxed.** The work per turn is fixed (no wall-clock cut-off), so a turn
   depends only on the view and the seed. The play-out dice (mulberry32) are seeded by one draw
   from the bot's rng, made every turn.
8. **Switch everything to it.** `chooseBotTurn`, `botMoveAfterShift` (autoplay after a person's own
   shift: the candidates are the squares of that one shift) and the hint (`hintTurn` / `hintMove`,
   always minding the opponents) now use the sampling bot. The look-ahead stays as the candidate
   generator and as `lookaheadStrategy` for the tournament and tests.

### Tournament (300 games per lineup, seats rotated, seeds 1–300)

| Lineup | Sampling wins | Fair share | Mean turns |
|---|---|---|---|
| sampling vs look-ahead | 74 % | 50 % | 46 |
| sampling vs 2 look-ahead | 45 % | 33 % | 47 |
| sampling vs 3 look-ahead | 32 % | 25 % | 48 |
| 4 sampling | – | – | 48 (4 look-ahead: 50) |

Fun check (greedy stands in for a casual person): greedy wins 3 % against one sampling bot (6 % against one look-ahead; games 37 vs 43 turns) and 7 % against three (13 %; 43 vs 45 turns). Games among sampling bots are not
longer than among look-ahead bots, so the extra strength comes from racing, not from more blocking.

Time per turn (desktop i5-8600K, Node, single run): mean ~11 ms with 2–4 players, worst ~50–60 ms
(JIT warm-up of the first turns). A mid-range phone is roughly 5× slower: ~55 ms mean, within the
~100 ms aim and far below the bot's 1.5 s pause; a hint tap costs the same.

## NFR (openspec/context/nfr.md)

- **Logging:** nothing new; the server's `bot.fallback` still covers a rejected choice.
- **Tests:** `botSampling.test.ts` covers the spec scenarios for the sampling bot (collect, heading
  home, forbidden reverse, reproducibility, legality property, the move after a made shift); the
  existing `bot.test.ts` / `botHint.test.ts` scenarios now run through it (the look-ahead's own
  reference checks stay on `lookaheadStrategy`); the simulation (`BOT_SIM=full`) and the opt-in
  tournament (`BOT_TOURNAMENT=<games>`, now sampling vs look-ahead) play whole games.
- **Limits:** fixed work per turn (see 6); no memory kept between turns; the client bundle grows by
  one small module.

## Risks / Trade-offs

- The bot is harder for a casual player (see the fun check). If people find it too strong, lower
  `candidates` or `budget` in `DEFAULT_SAMPLING`, or point `chooseBotTurn` back at
  `lookaheadStrategy()`; both are one-line changes in the rules package.
- On the device the bot thinks on the main thread for ~50 ms at the start of its 1.5 s pause; a
  frame or two of an animation still running then may drop. If visible, compute the turn after
  the previous animation or in a worker.
- A slower phone than assumed could approach 100 ms; the budget is a single number.
