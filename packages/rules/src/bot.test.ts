import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { allowedShifts, botSeed, chooseBotTurn, type BotStrategy, type BotView } from "./bot.js";
import type { Board } from "./board.js";
import { ALL_SQUARES, sameSquare, square } from "./geometry.js";

const CENTRE = square(3, 3);
import { isReachable, reachableSquares } from "./move.js";
import { createRng, isValidSeed, MAX_SEED } from "./rng.js";
import { setupBoard } from "./setup.js";
import { INSERTIONS, reverseOf, shiftBoard, type InsertionId } from "./shift.js";
import { TREASURES, type TreasureId } from "./tileSet.js";
import { dealGame, homeSquare, settleMove, targetTileId } from "./treasures.js";
import { nextSeat } from "./turns.js";

function viewOf(board: Board, target: TreasureId | undefined, pawn = homeSquare(1), lastInsertion?: InsertionId): BotView {
  return { board, seat: 1, seats: [{ seat: 1, pawn, found: 0, cardsLeft: 1 }], lastInsertion, target };
}

/** The best distance any allowed shift and reachable square leaves (0 = on the target, 100 = out of reach). */
function bestDistance(view: BotView): number {
  const tileId = targetTileId(view.seat, view.target);
  let best = Infinity;
  for (const { insertion, rotation } of allowedShifts(view.lastInsertion)) {
    const shifted = shiftBoard(view.board, insertion, rotation, [view.seats[0]!.pawn]);
    const at = shifted.board.squares.findIndex((t) => t.id === tileId);
    for (const to of reachableSquares(shifted.board, shifted.pawns[0]!)) {
      best = Math.min(best, at === -1 ? 100 : Math.abs(to.row - ALL_SQUARES[at]!.row) + Math.abs(to.col - ALL_SQUARES[at]!.col));
    }
  }
  return best;
}

/** The first view over seeded boards and treasures for which `wanted` says yes. */
function findView(
  wanted: (view: BotView) => boolean,
  target: (seed: number) => TreasureId | undefined = (seed) => TREASURES[seed % TREASURES.length],
  pawn = homeSquare(1),
): BotView {
  for (let seed = 1; seed < 500; seed++) {
    const view = viewOf(setupBoard(seed), target(seed), pawn);
    if (wanted(view)) return view;
  }
  throw new Error("No such view in the first 500 seeds");
}

function play(view: BotView, seed = 7) {
  const turn = chooseBotTurn(view, createRng(seed));
  const shifted = shiftBoard(view.board, turn.insertion, turn.rotation, [view.seats[0]!.pawn]);
  return { turn, board: shifted.board, pawn: shifted.pawns[0]! };
}

describe("bots › Bot turn choice", () => {
  it("Target reachable this turn", () => {
    const view = findView((v) => bestDistance(v) === 0);
    const { turn, board, pawn } = play(view);
    expect(isReachable(board, pawn, turn.to)).toBe(true);
    expect(settleMove(board, { seat: 1, square: turn.to, target: view.target }).collected).toBe(view.target);
  });

  it("Target out of reach", () => {
    const view = findView((v) => bestDistance(v) > 0);
    const { turn, board, pawn } = play(view);
    expect(isReachable(board, pawn, turn.to)).toBe(true);
    const at = board.squares.findIndex((t) => t.id === targetTileId(1, view.target));
    const dist = at === -1 ? 100 : Math.abs(turn.to.row - ALL_SQUARES[at]!.row) + Math.abs(turn.to.col - ALL_SQUARES[at]!.col);
    expect(dist).toBe(bestDistance(view));
  });

  it("Never the forbidden reverse", () => {
    const view = viewOf(setupBoard(3), "skull", homeSquare(1), "N1");
    for (let seed = 0; seed < 50; seed++) expect(chooseBotTurn(view, createRng(seed)).insertion).not.toBe("S1");
  });

  it("Heading home", () => {
    // From the centre, home is not reachable without the right shift.
    const view = findView((v) => bestDistance(v) === 0, () => undefined, CENTRE);
    const { turn, board } = play(view);
    expect(sameSquare(turn.to, homeSquare(1))).toBe(true);
    expect(settleMove(board, { seat: 1, square: turn.to, target: undefined }).won).toBe(true);
  });

  it("is reproducible from the seed", () => {
    const view = viewOf(setupBoard(11), TREASURES[0]);
    expect(chooseBotTurn(view, createRng(5))).toEqual(chooseBotTurn(view, createRng(5)));
  });

  it("property: the chosen shift is never the reverse and the move is reachable after it", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: MAX_SEED }),
        fc.integer({ min: 0, max: MAX_SEED }),
        fc.constantFrom(...ALL_SQUARES),
        fc.constantFrom(...INSERTIONS),
        fc.option(fc.constantFrom(...TREASURES), { nil: undefined }),
        (boardSeed, rngSeed, pawn, last, target) => {
          const view = viewOf(setupBoard(boardSeed), target, pawn, last);
          const { turn, board, pawn: moved } = play(view, rngSeed);
          expect(turn.insertion).not.toBe(reverseOf(last));
          expect(isReachable(board, moved, turn.to)).toBe(true);
        },
      ),
      { numRuns: 60 },
    );
  });

  it("botSeed gives valid, seat-specific seeds", () => {
    expect(isValidSeed(botSeed(MAX_SEED, 4))).toBe(true);
    expect(botSeed(42, 1)).not.toBe(botSeed(42, 2));
    expect(botSeed(42, 3)).toBe(botSeed(42, 3));
  });
});

interface SimResult {
  winner: number;
  turns: number;
}

/** Plays a whole game among bots with `strategy`, checking every turn against the rules. */
function simulate(seed: number, seats: number[], strategy: BotStrategy, turnCap = 1500): SimResult | undefined {
  let board = setupBoard(seed);
  const deal = dealGame(seed, seats);
  const pawns = new Map(seats.map((s) => [s, homeSquare(s)]));
  const stacks = new Map(seats.map((s) => [s, [...deal.stacks.get(s)!]]));
  const found = new Map(seats.map((s) => [s, 0]));
  const rngs = new Map(seats.map((s) => [s, createRng(botSeed(seed, s))]));
  let last: InsertionId | undefined;
  let turnSeat = deal.startSeat;
  for (let turns = 1; turns <= turnCap; turns++) {
    const view: BotView = {
      board,
      seat: turnSeat,
      seats: seats.map((s) => ({ seat: s, pawn: pawns.get(s)!, found: found.get(s)!, cardsLeft: stacks.get(s)!.length })),
      lastInsertion: last,
      target: stacks.get(turnSeat)![0],
    };
    const turn = strategy(view, rngs.get(turnSeat)!);
    if (last !== undefined && turn.insertion === reverseOf(last)) throw new Error("reverse shift");
    const shifted = shiftBoard(board, turn.insertion, turn.rotation, seats.map((s) => pawns.get(s)!));
    board = shifted.board;
    seats.forEach((s, i) => pawns.set(s, shifted.pawns[i]!));
    if (!isReachable(board, pawns.get(turnSeat)!, turn.to)) throw new Error("unreachable move");
    pawns.set(turnSeat, turn.to);
    last = turn.insertion;
    const outcome = settleMove(board, { seat: turnSeat, square: turn.to, target: view.target });
    if (outcome.won) return { winner: turnSeat, turns };
    if (outcome.collected) {
      stacks.get(turnSeat)!.shift();
      found.set(turnSeat, found.get(turnSeat)! + 1);
    }
    turnSeat = nextSeat(seats, turnSeat);
  }
  return undefined;
}

describe("bots › Bots finish a game (simulation)", () => {
  for (const seats of [[1, 3], [1, 2, 4], [1, 2, 3, 4]]) {
    it(`${seats.length} bots end with a winner within the turn cap over 20 seeds`, () => {
      for (let seed = 1; seed <= 20; seed++) {
        const result = simulate(seed, seats, chooseBotTurn);
        expect(result, `seed ${seed}`).toBeDefined();
        expect(seats).toContain(result!.winner);
      }
    });
  }
});
