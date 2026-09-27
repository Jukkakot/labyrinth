// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "../i18n";
import { DailyOver } from "../game/DailyShare.tsx";
import { saveDailyRecord, todayString } from "../session/dailyRecord.ts";
import { LocalRoom } from "../session/localRoom.ts";
import type { GameSession } from "../session/useGameSession.ts";
import { toGameView } from "../session/viewModel.ts";
import { GameScreen } from "./GameScreen.tsx";
import { StartScreen, type StartScreenProps } from "./StartScreen.tsx";

const ready = { state: "ready", slow: false, server: { builtAt: null } } as const;
const quiet = { setTimeout: () => 0, clearTimeout: () => {} };

function startScreen(playDaily = vi.fn()) {
  const session = {
    status: "idle",
    slow: false,
    play: vi.fn(),
    createPrivate: vi.fn(),
    joinById: vi.fn(),
    playBots: vi.fn(),
    playDaily,
    joinInvite: vi.fn(),
    watch: vi.fn(),
    watchBots: vi.fn(),
    retry: vi.fn(),
    resume: vi.fn(),
  } satisfies StartScreenProps["session"];
  render(<StartScreen session={session} wake={ready} />);
  return playDaily;
}

function gameScreen(roomId: string, state: Parameters<typeof toGameView>[0]) {
  const session = {
    shift: vi.fn<GameSession["shift"]>(async () => ({ ok: true })),
    move: vi.fn<GameSession["move"]>(async () => ({ ok: true })),
    kick: vi.fn<GameSession["kick"]>(async () => ({ ok: true })),
    undo: vi.fn<GameSession["undo"]>(async () => ({ ok: true })),
    playDaily: vi.fn(),
    leave: vi.fn(),
    pending: false,
    setSpeed: vi.fn(),
    rematch: vi.fn(),
    rematching: false,
    watchBots: vi.fn(),
    nickname: () => "Maija",
  };
  render(<GameScreen view={toGameView(state, roomId, "me")!} session={session} />);
  return session;
}

beforeEach(() => localStorage.setItem("labyrinth.nickname", "Maija"));
afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("daily-puzzle › Start screen puzzle entry", () => {
  it("no attempt today: the puzzle button starts it under the nickname", () => {
    const playDaily = startScreen();
    fireEvent.click(screen.getByRole("button", { name: "Pelaa päivän pulma" }));
    expect(playDaily).toHaveBeenCalledWith("Maija");
  });

  it("an unfinished attempt is continued", () => {
    LocalRoom.createDaily("Maija", todayString(), quiet);
    startScreen();
    expect(screen.getByRole("button", { name: "Jatka päivän pulmaa" })).toBeTruthy();
  });

  it("Solved today: best against par, share, and the button plays again", () => {
    saveDailyRecord({ date: todayString(), roomId: "local-daily-x", par: 2, best: { turns: 3, marks: "--t" } });
    const playDaily = startScreen();
    expect(screen.getByText("Paras tuloksesi tänään: 3 vuoroa (paras mahdollinen 2)")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Jaa tulos" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Pelaa uudelleen" }));
    expect(playDaily).toHaveBeenCalledWith("Maija");
  });
});

describe("daily-puzzle › Puzzle game screen with par", () => {
  it("During the puzzle: turn and best shown, hint on, Peru disabled with nothing to undo", () => {
    const room = LocalRoom.createDaily("Maija", "2026-09-27", quiet);
    gameScreen(room.roomId, room.state);
    expect(screen.getByText(`Vuoro 1 · paras mahdollinen ${room.state.par}`)).toBeTruthy();
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Vihje" }).disabled).toBe(false);
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Peru siirto" }).disabled).toBe(true);
  });

  it("Peru takes back the last shift", async () => {
    const room = LocalRoom.createDaily("Maija", "2026-09-27", quiet);
    await room.request("shift", { insertion: "N1", rotation: 0 });
    const { undo } = gameScreen(room.roomId, room.state);
    fireEvent.click(screen.getByRole("button", { name: "Peru siirto" }));
    expect(undo).toHaveBeenCalled();
  });

  it("Leaving midway needs no confirmation", () => {
    const room = LocalRoom.createDaily("Maija", "2026-09-27", quiet);
    const { leave } = gameScreen(room.roomId, room.state);
    fireEvent.click(screen.getByRole("button", { name: "Poistu pelistä" }));
    expect(leave).toHaveBeenCalled();
  });

  it("Puzzle end: turns against the best, share, Uudelleen and home, no rematch", () => {
    const room = LocalRoom.createDaily("Maija", "2026-09-27", quiet);
    saveDailyRecord({ date: "2026-09-27", roomId: room.roomId, par: 2, best: { turns: 3, marks: "--t" } });
    const { playDaily } = gameScreen(room.roomId, { ...room.state, phase: "finished", winnerSeat: 1, turn: 3, par: 2 });
    expect(screen.getByText("Ratkaisit pulman 3 vuorossa (paras 2)")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Jaa tulos" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Alkuun" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Pelaa uudelleen" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Uudelleen" }));
    expect(playDaily).toHaveBeenCalledWith("Maija");
  });

  it("Best reached: the end says so", () => {
    const room = LocalRoom.createDaily("Maija", "2026-09-27", quiet);
    gameScreen(room.roomId, { ...room.state, phase: "finished", winnerSeat: 1, turn: 2, par: 2 });
    expect(screen.getByText("Ratkaisit pulman 2 vuorossa – paras mahdollinen! ⭐")).toBeTruthy();
  });
});

describe("daily-puzzle › Shareable result", () => {
  it("No share sheet: the text is copied and the copy confirmed", async () => {
    saveDailyRecord({ date: "2026-09-27", roomId: "local-daily-x", par: 2, best: { turns: 3, marks: "--t" } });
    const copy = vi.fn(async (_text: string) => {});
    render(<DailyOver roomId="local-daily-x" onHome={vi.fn()} onRetry={vi.fn()} sharer={{ copy }} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Jaa tulos" }));
    });
    expect(copy.mock.calls[0]![0].split("\n")).toEqual([
      "Muuttuva labyrintti – päivän pulma 27.9.2026",
      "3 vuoroa (paras 2)",
      "⬜⬜💎",
      `${location.origin}${location.pathname}`,
    ]);
    expect(screen.getByRole("status").textContent).toBe("Tulos kopioitu leikepöydälle");
  });

  it("Result text: a star when the best was reached", async () => {
    saveDailyRecord({ date: "2026-09-27", roomId: "local-daily-x", par: 2, best: { turns: 2, marks: "-t" } });
    const copy = vi.fn(async (_text: string) => {});
    render(<DailyOver roomId="local-daily-x" onHome={vi.fn()} onRetry={vi.fn()} sharer={{ copy }} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Jaa tulos" }));
    });
    expect(copy.mock.calls[0]![0].split("\n")[1]).toBe("2 vuoroa (paras 2) ⭐");
  });
});
