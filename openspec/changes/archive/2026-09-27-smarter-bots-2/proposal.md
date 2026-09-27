# Proposal

## Why

The look-ahead bot scores one own turn and each opponent's best next shift on the board it leaves,
but never plays turns in alternation: the opponents' shifts between its turns are ignored, and it
cannot know their targets. The backlog item "Smarter bots 2: sampling search" asks for a bot that
plays a few turns ahead against sampled targets, as long as it stays fair, fun and fast enough for
a phone, and only if a tournament shows it is clearly better.

## What Changes

- A new sampling strategy behind the existing replaceable bot strategy: it takes the look-ahead's
  best few choices and plays each out a few turns ahead (every opponent once, then itself) with
  good moves for everyone, many times over, with the opponents' targets drawn from the treasures
  that could still be theirs (never their real ones). It picks the choice with the best average
  outcome: its own progress minus the opponents' (on the turns it minds them).
- It keeps every existing rule of the bot: collect or win when it can, never the reverse shift,
  mind the opponents on about four turns in five, reproducible from the seed, games always end.
- The tournament compares it with the look-ahead bot (win rates, game length, ms per turn). The
  default bot, the bots' move after a handed-over shift and the hint switch to it only if it is
  clearly stronger, not more blocking, and within the phone time budget (see design).
- Workspaces: `rules` only. The server and the client keep calling the same rules functions.

## Capabilities

### New Capabilities

### Modified Capabilities
- `bots`: "Bot turn choice" — beyond the next turn, the bot plays a few turns ahead against
  sampled opponents' targets, and a bot turn has a time budget.

## Impact

`packages/rules/src/botSampling.ts` (new), `botLookahead.ts` (exports its fast board model and
scored choices), `bot.ts` / `botHint.ts` (default strategy), tournament and bot tests. Wiki:
`docs/architecture.md` (rules modules), `docs/development.md` (tournament).
