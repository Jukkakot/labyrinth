# Design

## Decisions

1. **The policy lives in rules:** `firstSeat(hostSeat, seats, drawnSeat)` returns the host's seat
   when the host is seated, else the seat `dealGame` drew. `dealGame` is unchanged, so every deal
   stays reproducible from its seed (golden tests untouched).
2. **Server:** `startGame()` uses `firstSeat(this.state.hostSeat, …)`. A bot-only watch game has
   no seated host (`hostSeat` 0) and keeps the drawn seat. Rematch: the requester joins first and
   hosts, so they start.
3. **Tests that need another first seat** replace a `chooseStartSeat` hook on the room (like
   `drawDealSeed`), instead of searching for a seed.
4. **Local game:** the engine's `startGame(seed, seats, hostSeat?)` applies the same policy; the
   local room passes seat 1.

## NFRs

Rules unit test for `firstSeat`, one room test that the host starts, the engine test updated;
no new log fields.
