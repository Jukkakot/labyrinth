import { describe, expect, it } from "vitest";
import { DAILY_SEAT, DAILY_TREASURES, dailySeed, startDailyPuzzle } from "./daily.js";
import { applyMove, applyShift, type GameState } from "./game.js";
import { homeSquare } from "./treasures.js";
import { uniformBoard } from "./testing.js";

describe("daily-puzzle › Same puzzle for everyone on a day", () => {
  it("Two players, same day: the same board, spare and treasures", () => {
    expect(startDailyPuzzle("2026-09-27", "Aino")).toEqual({ ...startDailyPuzzle("2026-09-27", "Aino") });
    expect(dailySeed("2026-09-27")).toBe(dailySeed("2026-09-27"));
  });

  it("Next day: another puzzle", () => {
    const today = startDailyPuzzle("2026-09-27", "Aino");
    const tomorrow = startDailyPuzzle("2026-09-28", "Aino");
    expect(tomorrow.seed).not.toBe(today.seed);
    expect(tomorrow.board).not.toEqual(today.board);
  });
});

describe("daily-puzzle › Goal and score", () => {
  it("one seat on turn with a stack of 3 treasures", () => {
    const game = startDailyPuzzle("2026-09-27", "Aino");
    expect(game.seats).toHaveLength(1);
    expect(game.seats[0]!.stack).toHaveLength(DAILY_TREASURES);
    expect(game.turnSeat).toBe(DAILY_SEAT);
    expect(game.turn).toBe(1);
  });

  it("each solo turn passes back to the player and counts up; reaching home keeps the winning turn", () => {
    const start = startDailyPuzzle("2026-09-27", "Aino");
    const home = homeSquare(DAILY_SEAT);
    // Straight corridors N–S: the home column is one open line.
    const board = uniformBoard("I0");
    let game: GameState = { ...start, board, seats: start.seats.map((s) => ({ ...s, pawn: { row: 3, col: home.col } })) };

    const shifted = applyShift(game, DAILY_SEAT, "N3", 0);
    expect(shifted.ok).toBe(true);
    if (!shifted.ok) return;
    const stay = applyMove(shifted.state, DAILY_SEAT, shifted.state.seats[0]!.pawn);
    expect(stay.ok && stay.state.turnSeat).toBe(DAILY_SEAT);
    expect(stay.ok && stay.state.turn).toBe(2);
    if (!stay.ok) return;

    game = { ...stay.state, seats: stay.state.seats.map((s) => ({ ...s, found: [...s.stack] })) };
    const again = applyShift(game, DAILY_SEAT, "N5", 0);
    if (!again.ok) throw new Error(again.code);
    const won = applyMove(again.state, DAILY_SEAT, home);
    expect(won.ok && won.state.step).toBe("finished");
    expect(won.ok && won.state.turn).toBe(2);
  });
});
