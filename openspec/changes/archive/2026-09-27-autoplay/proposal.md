# Proposal

## Why

A player who has to step away (a call, a doorbell) today can only leave or make everyone wait and
kick them; a dropped connection stalls the game for a minute per turn until someone kicks. Letting
the bot play a seat for a while keeps the game moving and keeps the player's place and progress
(roadmap 20).

## What Changes

- A seated player can hand their seat to the bot ("Anna botin pelata") and take it back ("Ota
  vuoro takaisin") at any time while the game runs. While autoplay is on, the bot plays that seat's
  turns with the same fair strategy and pauses as the bots, knowing only that seat's own target.
- Taking back during the seat's own turn stops the bot before its next step; the player continues
  from the step the turn is in. Handing over during the own turn lets the bot finish that turn.
- Everyone sees it: the seat's chip gets the robot icon and the turn line says the bot is playing
  for that player. The player's own shift and move controls are disabled while autoplay is on, and
  their own shift or move is rejected (`AUTOPLAYING`).
- **Decision:** a player whose connection drops is auto-played while their seat is held (5
  minutes), instead of the others having to wait for the clock and kick; coming back ends that
  autoplay (one they chose themselves stays on). A timed-out but connected player is **not**
  auto-played: the kick rule stays as it is.
- Quick games against bots on the device support autoplay too (the game then plays itself until
  taken back). The daily puzzle does not (it is a solo puzzle with its own replay).
- An auto-played person still counts as a person: a game does not end for "no people" because of
  autoplay.

## Capabilities

### New Capabilities
- `autoplay`: handing a seat to the bot and taking it back, how the bot plays it, how it is shown,
  and autoplay of dropped players.

### Modified Capabilities
- `game-session`: "Dropped connection" — a dropped player's turns are played by the bot during
  the seat hold, and reconnecting ends that autoplay.

## Impact

- Workspaces: **protocol** (command, code, synced field), **rules** (a move-only choice for a bot
  taking over after the shift, if not already exported), **server** (`GameRoom`: command, synced
  `autoplay`, bot scheduling for autoplayed seats, drop/reconnect), **client** (`LocalRoom`,
  `useGameSession`, view model, player strip, turn line, game screen control, i18n).
- New command `setAutoplay { on }`, new rejection code `AUTOPLAYING`, new synced player field
  `autoplay`, new log event `autoplay.changed`.
- No new dependencies.
