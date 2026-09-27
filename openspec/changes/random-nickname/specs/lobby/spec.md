# Spec Delta

## MODIFIED Requirements

### Requirement: Nickname
Every player SHALL have a nickname before joining or creating a game. The start screen MUST have a
nickname field ("Nimimerkki"). A nickname is valid when, after trimming, it is 2–16 characters long
and contains no control characters. Play, "Luo yksityinen peli", joining from the list and
"Liity peliin" MUST be disabled while the nickname is invalid, and a short hint MUST say what is
wrong. The browser MUST remember the last nickname used and prefill the field with it; the
nickname MUST NOT be stored anywhere else in the browser. When no nickname is remembered, the field
MUST be prefilled with a random valid name, an adjective and an animal in the UI language (for
example "Rohkea Ilves"), drawn from lists long enough that two players rarely get the same one.
Next to the field a dice button ("Arvo uusi nimi") MUST replace the field's content with a new
random name. A random name is remembered only once the player joins with it. The server MUST
refuse to seat a player whose nickname is invalid. Nicknames need not be unique: players are still
told apart by pawn shape and colour.

#### Scenario: Valid nickname
- **WHEN** a player types "  Maija  " into the nickname field
- **THEN** the actions become available, and in the game they are called "Maija"

#### Scenario: Too short
- **WHEN** the nickname field holds "M"
- **THEN** every join and create action is disabled and a hint says the nickname needs 2–16 characters

#### Scenario: Remembered nickname
- **WHEN** a player who played as "Maija" opens the start screen again later in the same browser
- **THEN** the nickname field already says "Maija"

#### Scenario: Random name for a new player
- **WHEN** a player opens the start screen for the first time in a browser
- **THEN** the nickname field already holds a random name such as "Rohkea Ilves", and Play can be tapped at once

#### Scenario: Another random name
- **WHEN** the player taps the dice button
- **THEN** the field holds a new random name

#### Scenario: Server refuses an invalid nickname
- **WHEN** a join arrives at the server with a whitespace-only nickname
- **THEN** the join is refused and no seat is taken

#### Scenario: Same nickname twice
- **WHEN** two players both call themselves "Maija"
- **THEN** both are seated, told apart by their pawns
