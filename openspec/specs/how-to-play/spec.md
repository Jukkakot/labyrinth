# how-to-play Specification

## Purpose
The "Näin pelaat" rules screen: where it opens from and what it must explain (goal, push, walk,
treasures, return home, daily puzzle).

## Requirements

### Requirement: Rules screen reachable before and during a game
The app SHALL have a "Näin pelaat" (English "How to play") screen. It opens from the start screen
and from the settings screen, so it is also reachable during a game through the settings gear.
"Takaisin" returns to the screen it was opened from; a game keeps running underneath, as with the
settings. Opening it MUST NOT change any game or setting.

#### Scenario: From the start screen
- **WHEN** Maija taps "Näin pelaat" on the start screen
- **THEN** the rules screen opens, and "Takaisin" returns to the start screen

#### Scenario: During a game
- **WHEN** Maija, in a game, opens the settings and taps "Näin pelaat"
- **THEN** the rules screen opens, "Takaisin" returns to the settings, and "Takaisin" there returns to the same game

### Requirement: What the rules screen explains
The rules screen SHALL explain, in short sections in this order, each with a picture made of the
game's own tiles and pawns (the text alone must still be complete, the pictures are decorative
for assistive technology):
- **Goal**: collect your secret treasures one at a time, then return home; the first to do so wins.
- **Push a tile**: every turn starts by pushing the spare tile into the board from an arrow on the
  edge; it may be turned first; the tile pushed out is the next spare; a pawn pushed out comes back
  on the opposite side; the push that would undo the previous one is not allowed.
- **Walk**: then walk along open corridors as far as you like, or stay.
- **Treasures**: ending the walk on your target's tile collects it and reveals the next one; the
  target is marked on the board.
- **Return home**: with every treasure found, return to your start corner to win.
- **Daily puzzle**: one solo puzzle a day, the same for everyone: reach one treasure in as few
  turns as possible; the best possible result is shown; moves can be undone and the puzzle
  retried, the day keeps the best result, which can be shared; no time limit.

#### Scenario: Push rules
- **WHEN** Maija reads the push section
- **THEN** it says the spare can be turned, the pushed-out tile is the next spare, a pushed-out pawn comes back on the other side, and the reverse of the previous push is not allowed

#### Scenario: Daily puzzle rules
- **WHEN** Maija reads the daily puzzle section
- **THEN** it says the puzzle is the same for everyone that day, scores by turns, shows the best possible, allows undo and retries and keeps the best result

### Requirement: Language and layout of the rules screen
The rules screen SHALL be in the app's current language (Finnish first, English) and follow the
language switch at once. It MUST fit a phone in portrait with no sideways scrolling; the pictures
scale to the screen width.

#### Scenario: English
- **WHEN** the language is English and Maija opens the rules
- **THEN** the title is "How to play" and every section is in English
