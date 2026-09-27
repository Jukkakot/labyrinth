## Context

Seat number drives both pawn colour (`--seat-N`) and shape (`SHAPES[seat]`) in `Pawn` and the
colour in `TurnMarks`; `PlayerStrip`, `TurnLine` and the waiting room pass `seat` to `Pawn`. The
server's `Player` schema has `seat`; device games (`LocalRoom`) build the same synced shape.

## Goals / Non-Goals

**Goals:** a player's own pawn, chosen once on the start screen and changeable in the waiting room;
only free pawns; the Okabe–Ito palette and the colour+shape pairing stay.

**Non-Goals:** avatars or pictures, more than four pawns, splitting colour from shape, changing the
pawn mid-game, a pawn choice for spectators.

## Decisions

- **A "look" is a colour+shape pair, numbered 1–4** (the same numbers as today's seats, so the
  tokens `--seat-1..4` and `SHAPES` just get indexed by look). Splitting colour and shape was
  rejected: two players could end up with the same colour and a different shape, which is hard to
  tell apart for colour-blind players and at pawn size.
- **Identifier `look`** (UI: "nappula" / "pawn"): `pawn` already means the position in the rules
  package; `colour` would hide that the shape comes with it.
- **Assignment in one pure helper** in `packages/protocol` (`pickLook(taken, seat, preferred?)`),
  shared by the server and device games: preferred if free → seat's if free → lowest free. With no
  preference every game looks exactly as before.
- **Preference on the device** (`labyrinth.look`, localStorage), sent as join option `look` (1–4,
  optional). Stored only when the player taps a pawn (start screen or waiting room), so players who
  never choose keep the seat-based default everywhere. The start-screen picker shows the blue circle
  as selected when nothing is stored (it is what they get in a device game, seat 1).
- **Picker UI**: a row of four pawn buttons (radio group, `aria-pressed`, ≥44 px), labelled with
  colour and shape names ("sininen ympyrä"), under the nickname on the start screen; in the waiting
  room under the seat list, for the viewer only, other players' pawns disabled. The same component
  in both places.
- **Server**: `Player.look` (uint8). `onJoin` and `seatBot` call `pickLook`. New command `setLook`
  (`{ look: 1–4 }`): `NOT_SEATED`, `WRONG_PHASE` (not waiting), `LOOK_TAKEN`; logged as
  `player.look` with old and new look. A bot never changes its look.
- **Device games**: `SavedLocalGame.looks` (seat → look), fixed at creation from the preference;
  a save without it (older saves) falls back to look = seat. A rematch on the device re-reads the
  preference.
- **Rendering**: `SeatView.look`; `Pawn` gets `look` (colour and shape) next to `seat` (crowd
  quadrant only); `TurnMarks` and the turn line and result look up the mover's look.

## Risks / Trade-offs

- A joiner racing another joiner for the same preferred pawn: Colyseus handles joins one at a
  time in the room, so `pickLook` always sees the current holders.
- Rematch rooms: people rejoin with their stored preference, so a pawn changed in the waiting room
  carries over (it was stored); bots re-pick.

## NFR

Logging: `player.look` info event on each accepted change; rejections go through the existing
command audit. Tests: `pickLook` unit tests (protocol); room tests for join assignment, bots and
`setLook` rejections; client tests for the preference store, device-game looks and the waiting-room
picker. Limits: the payload schema bounds `look` to 1–4; the command is only valid in the waiting
room, so it cannot be used to spam a running game.
