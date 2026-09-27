# Design

## Context

`StartScreen` initialises its field from `loadNickname()` (localStorage, "" when missing);
`useGameSession` saves the nickname after a successful join. Nickname rule: 2–16 code points, no
control characters (`nicknameIssue` in protocol).

## Decisions

### 1. Adjective + animal, in the UI language, on the client
`randomNickname(language, random = Math.random)` in `client/src/session/nickname.ts` picks one of
~30 adjectives and one of ~30 animals per language (fi, en): ~900 names each. Finnish pairs use the
nominative adjective ("Rohkea Ilves"). Every combination fits 16 characters; a unit test checks all
of them against the nickname rule. Plain `Math.random`: nothing needs to be reproducible.
*Alternative:* a flat list of names. Rejected: pairs give far more names from short lists.

### 2. Only as a default, remembered on use
The field starts with the remembered nickname, else a random one. Nothing is stored until the
player joins (unchanged save-on-join), so an unused random name is not remembered and the next
visit draws a new one.

### 3. Dice button
An icon button (tabler `IconDice5`, 44 × 44 px, secondary, accessible name "Arvo uusi nimi") on the
right of the input, in the same row. Always enabled on the start screen, also in invite mode.

### NFRs
- Logging: none needed (no server event; the nickname already appears in `player.joined`).
- Tests: unit tests for `randomNickname` (all combinations valid, language picks the list, the
  draw uses `random`); one start-screen render test (empty storage → a valid name and Play enabled;
  dice changes it). UI check in portrait.
- Limits/bundle: two short word lists and one icon, a few hundred bytes.

## Risks / Trade-offs

- [Same random name twice in a game] → harmless: nicknames need not be unique.
