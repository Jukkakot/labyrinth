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

describe("daily-puzzle › One attempt per day (start screen)", () => {
  it("no attempt today: the puzzle button starts it under the nickname", () => {
    const playDaily = startScreen();
    fireEvent.click(screen.getByRole("button", { name: "Pelaa päivän pulma" }));
    expect(playDaily).toHaveBeenCalledWith("Maija");
  });

  it("an unfinished attempt is continued", () => {
    saveDailyRecord({ date: todayString(), roomId: "local-daily-x" });
    startScreen();
    expect(screen.getByRole("button", { name: "Jatka päivän pulmaa" })).toBeTruthy();
  });

  it("Already solved: the button is disabled, today's result and share are shown", () => {
    saveDailyRecord({ date: todayString(), roomId: "local-daily-x", result: { turns: 6, marks: "-tt-th" } });
    startScreen();
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Päivän pulma ratkaistu" }).disabled).toBe(true);
    expect(screen.getByText("Tänään 6 vuoroa. Uusi pulma huomenna.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Jaa tulos" })).toBeTruthy();
  });
});

describe("daily-puzzle › Puzzle game screen", () => {
  it("During the puzzle: the turn number shows and there is no hint", () => {
    const room = LocalRoom.createDaily("Maija", "2026-09-27", quiet);
    gameScreen(room.roomId, room.state);
    expect(screen.getByText(/^Vuoro 1 · Sinun vuorosi/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Vihje" })).toBeNull();
  });

  it("Leaving midway needs no confirmation", () => {
    const room = LocalRoom.createDaily("Maija", "2026-09-27", quiet);
    const { leave } = gameScreen(room.roomId, room.state);
    fireEvent.click(screen.getByRole("button", { name: "Poistu pelistä" }));
    expect(leave).toHaveBeenCalled();
  });

  it("Puzzle end: solved in N turns, share and home, no rematch", () => {
    const room = LocalRoom.createDaily("Maija", "2026-09-27", quiet);
    saveDailyRecord({ date: "2026-09-27", roomId: room.roomId, result: { turns: 6, marks: "-tt-th" } });
    gameScreen(room.roomId, { ...room.state, phase: "finished", winnerSeat: 1, turn: 6 });
    expect(screen.getByText("Ratkaisit päivän pulman 6 vuorossa!")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Jaa tulos" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Alkuun" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Pelaa uudelleen" })).toBeNull();
  });
});

describe("daily-puzzle › Shareable result", () => {
  it("No share sheet: the text is copied and the copy confirmed", async () => {
    saveDailyRecord({ date: "2026-09-27", roomId: "local-daily-x", result: { turns: 6, marks: "-tt-th" } });
    const copy = vi.fn(async (_text: string) => {});
    render(<DailyOver roomId="local-daily-x" onHome={vi.fn()} sharer={{ copy }} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Jaa tulos" }));
    });
    const text = copy.mock.calls[0]![0];
    expect(text.split("\n")).toEqual([
      "Muuttuva labyrintti – päivän pulma 27.9.2026",
      "6 vuoroa",
      "⬜💎💎⬜💎🏠",
      `${location.origin}${location.pathname}`,
    ]);
    expect(screen.getByRole("status").textContent).toBe("Tulos kopioitu leikepöydälle");
  });
});
