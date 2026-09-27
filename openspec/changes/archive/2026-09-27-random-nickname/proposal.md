# Proposal

## Why

The lobby should get a player into a game as fast as possible. A first-time player now meets an
empty nickname field and every action disabled until they invent a name. A ready random name
removes that step: one tap on Play or "1v1" is enough.

## What Changes

- When the browser has no remembered nickname, the field is prefilled with a random name made of
  an adjective and an animal ("Rohkea Ilves"; in English "Brave Lynx"), drawn from long lists
  (hundreds of combinations), in the UI language.
- A small dice button next to the field draws a new name. The player can still type any name.
- A remembered nickname still wins. The random name is remembered only once the player uses it to
  join, as any typed name.

Workspaces: **client** only (name lists and draw, start screen, fi/en strings). No rules, protocol
or server change: random names follow the normal nickname rule.

## Capabilities

### New Capabilities
- (none)

### Modified Capabilities
- `lobby`: the Nickname requirement gains the random default name and the dice button.

## Impact

- `client/src/session/nickname.ts` (random name), `StartScreen` field with the dice button, fi/en
  strings. One more tabler icon; bundle stays within budget.
