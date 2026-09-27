// @vitest-environment jsdom
import { DAILY_SEAT, homeSquare, startDailyPuzzle } from "@labyrinth/rules";
import { uniformBoard } from "@labyrinth/rules/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { loadDailyRecord, marksRow, saveDailyRecord, todayString } from "./dailyRecord.ts";
import { isDailyRoomId, loadLocalGame, saveLocalGame } from "./localGameStore.ts";
import { LocalRoom } from "./localRoom.ts";
import { createConnector } from "./useGameSession.ts";

const DATE = "2026-09-27";
const quiet = { setTimeout: () => 0, clearTimeout: () => {} };

beforeEach(() => localStorage.clear());

/** A saved puzzle one step from the end: all treasures found, standing in the home column. */
function almostSolved(marks: string) {
  const roomId = "local-daily-test";
  const start = startDailyPuzzle(DATE, "Maija");
  const home = homeSquare(DAILY_SEAT);
  const game = {
    ...start,
    board: uniformBoard("I0"),
    turn: 4,
    seats: start.seats.map((s) => ({ ...s, pawn: { row: 3, col: home.col }, found: [...s.stack] })),
  };
  saveLocalGame({ roomId, game, marks });
  saveDailyRecord({ date: DATE, roomId });
  return LocalRoom.restore(roomId, quiet)!;
}

describe("daily-puzzle › Same puzzle for everyone on a day (on the device)", () => {
  it("a new puzzle is a solo game of that date in the puzzle slot, recorded as today's attempt", () => {
    const room = LocalRoom.createDaily("Maija", DATE, quiet);
    expect(isDailyRoomId(room.roomId)).toBe(true);
    expect(room.game).toEqual(startDailyPuzzle(DATE, "Maija"));
    expect(loadDailyRecord(DATE)).toEqual({ date: DATE, roomId: room.roomId });
    expect(loadDailyRecord("2026-09-28")).toBeUndefined();
  });

  it("todayString is the local date", () => {
    expect(todayString(new Date(2026, 8, 7, 23, 59))).toBe("2026-09-07");
  });
});

describe("daily-puzzle › One attempt per day", () => {
  it("Quick game in between: the quick game and the puzzle are saved side by side", () => {
    const puzzle = LocalRoom.createDaily("Maija", DATE, quiet);
    const quick = LocalRoom.create("Maija", 1, { ...quiet, seed: () => 7 });
    expect(loadLocalGame(puzzle.roomId)?.game.seats).toHaveLength(1);
    expect(loadLocalGame(quick.roomId)?.game.seats).toHaveLength(2);
  });

  it("Leaving midway: the puzzle stays saved and the connector continues it", async () => {
    const room = LocalRoom.createDaily("Maija", DATE, quiet);
    await room.request("shift", { insertion: "N1", rotation: 0 });
    await room.leave();
    const again = (await createConnector().playDaily({ nickname: "Maija", date: DATE })) as LocalRoom;
    expect(again.roomId).toBe(room.roomId);
    expect(again.game.step).toBe("move");
  });

  it("a puzzle of another date is replaced by a new one", async () => {
    const old = LocalRoom.createDaily("Maija", "2026-09-26", quiet);
    const today = (await createConnector().playDaily({ nickname: "Maija", date: DATE })) as LocalRoom;
    expect(today.roomId).not.toBe(old.roomId);
    expect(today.game.seed).toBe(startDailyPuzzle(DATE, "Maija").seed);
  });

  it("no rematch in a puzzle", async () => {
    const room = almostSolved("-t-t");
    await room.request("shift", { insertion: "N5", rotation: 0 });
    await room.request("move", homeSquare(DAILY_SEAT));
    expect((await room.request("rematch", {})).ok).toBe(false);
  });
});

describe("daily-puzzle › Goal and score (on the device)", () => {
  it("Solved: each turn adds its mark; home ends the puzzle and records turns and marks", async () => {
    const room = LocalRoom.createDaily("Maija", DATE, quiet);
    await room.request("shift", { insertion: "N1", rotation: 0 });
    await room.request("move", room.game.seats[0]!.pawn);
    expect(loadLocalGame(room.roomId)?.marks).toBe("-");

    const last = almostSolved("-t-t");
    await last.request("shift", { insertion: "N5", rotation: 0 });
    await last.request("move", homeSquare(DAILY_SEAT));
    expect(last.game.step).toBe("finished");
    expect(loadDailyRecord(DATE)?.result).toEqual({ turns: 4, marks: "-t-th" });
    // Solved and left: the game goes, the result stays.
    await last.leave();
    expect(loadLocalGame(last.roomId)).toBeUndefined();
    expect(loadDailyRecord(DATE)?.result?.turns).toBe(4);
  });
});

describe("daily-puzzle › Shareable result", () => {
  it("Result text: one mark per turn", () => {
    expect(marksRow("-tt-th")).toBe("⬜💎💎⬜💎🏠");
  });
});
