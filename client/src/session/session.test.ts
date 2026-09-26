// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { setupBoard } from "@labyrinth/rules";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadToken, saveToken } from "./sessionToken.ts";
import { useGameSession, type Connector, type GameRoomLike } from "./useGameSession.ts";
import { toGameView, type SyncedState } from "./viewModel.ts";

const board = setupBoard(1);

function syncedState(players: Record<string, number>): SyncedState {
  return {
    squares: board.squares.map(({ id, rotation }) => ({ id, rotation })),
    spare: { id: board.spare.id, rotation: board.spare.rotation },
    players: new Map(Object.entries(players).map(([id, seat]) => [id, { seat, connected: true }])),
  };
}

function fakeRoom(overrides: Partial<GameRoomLike> = {}): GameRoomLike {
  return {
    roomId: "brave-otters-sing",
    sessionId: "me",
    reconnectionToken: "brave-otters-sing:token",
    state: syncedState({ me: 1, other: 2 }),
    onStateChange: vi.fn(),
    onLeave: vi.fn(),
    onDrop: vi.fn(),
    onReconnect: vi.fn(),
    ...overrides,
  };
}

beforeEach(() => sessionStorage.clear());

describe("game-session › view model", () => {
  it("rebuilds the real board from ids and rotations and lists seats in order", () => {
    const view = toGameView(syncedState({ b: 2, me: 1 }), "r", "me")!;
    expect(view.board).toEqual(board);
    expect(view.seats.map((s) => [s.seat, s.isMe])).toEqual([
      [1, true],
      [2, false],
    ]);
    expect(view.mySeat).toBe(1);
  });

  it("returns undefined until the board has arrived", () => {
    expect(toGameView({ squares: [], players: new Map() }, "r", "me")).toBeUndefined();
  });
});

describe("game-session › One player per browser tab", () => {
  it("stores the reconnection token on join", async () => {
    const connector: Connector = { joinOrCreate: vi.fn(async () => fakeRoom()), reconnect: vi.fn() };
    const { result } = renderHook(() => useGameSession(connector));
    expect(result.current.status).toBe("idle");

    act(() => result.current.play());
    await waitFor(() => expect(result.current.status).toBe("playing"));
    expect(loadToken()).toBe("brave-otters-sing:token");
    expect(result.current.view?.roomId).toBe("brave-otters-sing");
  });

  it("Reload keeps the seat: a stored token rejoins without Play", async () => {
    saveToken("old-token");
    const connector: Connector = { joinOrCreate: vi.fn(), reconnect: vi.fn(async () => fakeRoom()) };
    const { result } = renderHook(() => useGameSession(connector));
    expect(result.current.status).toBe("connecting");
    await waitFor(() => expect(result.current.status).toBe("playing"));
    expect(connector.reconnect).toHaveBeenCalledWith("old-token");
    expect(connector.joinOrCreate).not.toHaveBeenCalled();
  });

  it("a failed rejoin clears the token and shows the start screen", async () => {
    saveToken("stale");
    const connector: Connector = { joinOrCreate: vi.fn(), reconnect: vi.fn(async () => Promise.reject(new Error("gone"))) };
    const { result } = renderHook(() => useGameSession(connector));
    await waitFor(() => expect(result.current.status).toBe("idle"));
    expect(loadToken()).toBeUndefined();
  });
});

describe("game-session › Quick play", () => {
  it("Join fails: error state", async () => {
    const connector: Connector = { joinOrCreate: vi.fn(async () => Promise.reject(new Error("offline"))), reconnect: vi.fn() };
    const { result } = renderHook(() => useGameSession(connector));
    act(() => result.current.play());
    await waitFor(() => expect(result.current.status).toBe("error"));
  });

  it("Slow server: flags a slow connection after 5 s", async () => {
    vi.useFakeTimers();
    try {
      const connector: Connector = { joinOrCreate: vi.fn(() => new Promise<GameRoomLike>(() => {})), reconnect: vi.fn() };
      const { result } = renderHook(() => useGameSession(connector));
      act(() => result.current.play());
      expect(result.current.slow).toBe(false);
      act(() => vi.advanceTimersByTime(5_000));
      expect(result.current.status).toBe("connecting");
      expect(result.current.slow).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});
