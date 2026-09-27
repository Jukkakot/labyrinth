import type { GameState } from "./game.js";
import { createRng, shuffle } from "./rng.js";
import { setupBoard } from "./setup.js";
import { TREASURES } from "./tileSet.js";
import { homeSquare } from "./treasures.js";

/**
 * The daily puzzle: a solo game whose board, spare and treasures come only from the calendar
 * date, so everyone on the same day plays the same puzzle.
 */

/** Treasures to find before heading home. */
export const DAILY_TREASURES = 3;

/** The seat the puzzle player sits in (its home corner). */
export const DAILY_SEAT = 1;

/** The seed of a date `YYYY-MM-DD`: FNV-1a over the string, so it is stable everywhere. */
export function dailySeed(date: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < date.length; i++) {
    hash ^= date.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * The puzzle of `date`: the board of its seed and one seat on turn at home, with the first
 * `DAILY_TREASURES` cards of a seeded shuffle (the deal needs opponents, the puzzle has none).
 */
export function startDailyPuzzle(date: string, name: string): GameState {
  const seed = dailySeed(date);
  return {
    seed,
    board: setupBoard(seed),
    seats: [
      {
        seat: DAILY_SEAT,
        name,
        bot: false,
        pawn: homeSquare(DAILY_SEAT),
        stack: shuffle(createRng(seed), TREASURES).slice(0, DAILY_TREASURES),
        found: [],
      },
    ],
    step: "shift",
    turnSeat: DAILY_SEAT,
    turn: 1,
    lastInsertion: undefined,
    winnerSeat: 0,
  };
}
