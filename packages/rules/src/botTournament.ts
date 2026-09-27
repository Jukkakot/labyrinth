import type { BotStrategy, BotView } from "./bot.js";
import { botSeed } from "./bot.js";
import { isReachable } from "./move.js";
import { createRng } from "./rng.js";
import { setupBoard } from "./setup.js";
import { reverseOf, shiftBoard, type InsertionId } from "./shift.js";
import { dealGame, homeSquare, settleMove } from "./treasures.js";
import { nextSeat } from "./turns.js";

/*
 * Whole games among bots, for tests and for comparing strategies. Not part of the package's
 * public entry point.
 */

// The rules package has no DOM or Node types; both runtimes have a high-resolution clock.
const clock: { now(): number } = (globalThis as { performance?: { now(): number } }).performance ?? Date;

export interface GameResult {
  winner: number;
  turns: number;
}

/** Wall-clock time spent choosing turns, per seat. */
export interface TurnTimes {
  total: number;
  max: number;
  count: number;
}

/**
 * Plays a whole game among bots (`strategies` by seat), checking every turn against the rules.
 * Undefined when nobody wins within `turnCap` turns. `times` collects the time each seat's
 * strategy took per turn.
 */
export function simulateGame(
  seed: number,
  strategies: ReadonlyMap<number, BotStrategy>,
  turnCap = 1500,
  times?: Map<number, TurnTimes>,
): GameResult | undefined {
  const seats = [...strategies.keys()].sort((a, b) => a - b);
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
    const started = clock.now();
    const turn = strategies.get(turnSeat)!(view, rngs.get(turnSeat)!);
    if (times) {
      const took = clock.now() - started;
      const t = times.get(turnSeat) ?? { total: 0, max: 0, count: 0 };
      times.set(turnSeat, { total: t.total + took, max: Math.max(t.max, took), count: t.count + 1 });
    }
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

export interface Standing {
  games: number;
  wins: number;
  /** Mean and worst time per turn in milliseconds. */
  meanMs: number;
  maxMs: number;
}

export interface TournamentResult {
  standings: Map<string, Standing>;
  /** Games nobody won within the turn cap. */
  unfinished: number;
  /** Mean number of turns of the finished games. */
  meanTurns: number;
}

/**
 * Plays `games` games on `seatCount` seats. Every game rotates who sits where (`lineup` gives the
 * strategy names in seat order and is rotated by the game number), so no strategy keeps the best
 * seat. Wins and turn times are counted per strategy name.
 */
export function runTournament(
  strategies: Readonly<Record<string, BotStrategy>>,
  lineup: readonly string[],
  games: number,
  firstSeed = 1,
): TournamentResult {
  const seatCount = lineup.length;
  const seats = seatCount === 2 ? [1, 3] : seatCount === 3 ? [1, 2, 4] : [1, 2, 3, 4];
  const standings = new Map<string, Standing>(Object.keys(strategies).map((name) => [name, { games: 0, wins: 0, meanMs: 0, maxMs: 0 }]));
  const time = new Map<string, TurnTimes>();
  let unfinished = 0;
  let turnSum = 0;
  for (let g = 0; g < games; g++) {
    const names = seats.map((_, i) => lineup[(i + g) % seatCount]!);
    const bySeat = new Map(seats.map((s, i) => [s, strategies[names[i]!]!]));
    const times = new Map<number, TurnTimes>();
    const result = simulateGame(firstSeed + g, bySeat, 1500, times);
    new Set(names).forEach((name) => (standings.get(name)!.games += 1));
    seats.forEach((s, i) => {
      const t = times.get(s);
      if (!t) return;
      const acc = time.get(names[i]!) ?? { total: 0, max: 0, count: 0 };
      time.set(names[i]!, { total: acc.total + t.total, max: Math.max(acc.max, t.max), count: acc.count + t.count });
    });
    if (!result) {
      unfinished++;
      continue;
    }
    turnSum += result.turns;
    standings.get(names[seats.indexOf(result.winner)]!)!.wins += 1;
  }
  for (const [name, s] of standings) {
    const t = time.get(name);
    if (t) standings.set(name, { ...s, meanMs: t.total / t.count, maxMs: t.max });
  }
  return { standings, unfinished, meanTurns: turnSum / Math.max(1, games - unfinished) };
}
