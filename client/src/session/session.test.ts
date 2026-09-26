// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { reachableSquares, setupBoard } from "@labyrinth/rules";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadToken, saveToken } from "./sessionToken.ts";
import { useGameSession, type Connector, type GameRoomLike } from "./useGameSession.ts";
import { toGameView, type SyncedState } from "./viewModel.ts";

const board = setupBoard(1);

function syncedState(players: Record<string, number>, turn: Partial<SyncedState> = {}): SyncedState {
  return {
    turnSeat: 1,
    lastInsertion: "",
    ...turn,
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
    request: vi.fn(async () => ({ ok: true })),
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

  it("derives whose turn it is and the previous shift", () => {
    expect(toGameView(syncedState({ me: 1, b: 2 }), "r", "me")).toMatchObject({ turnSeat: 1, isMyTurn: true, lastInsertion: undefined });
    const other = toGameView(syncedState({ me: 1, b: 2 }, { turnSeat: 2, lastInsertion: "N1" }), "r", "me")!;
    expect(other).toMatchObject({ turnSeat: 2, isMyTurn: false, lastInsertion: "N1" });
  });

  it("pawns stand on their synced squares; without a square, on their start corner", () => {
    const state = syncedState({ me: 1 });
    state.players = new Map([
      ["me", { seat: 1, connected: true, row: 3, col: 2 }],
      ["b", { seat: 3, connected: true }],
    ]);
    const view = toGameView(state, "r", "me")!;
    expect(view.seats.map((s) => s.square)).toEqual([
      { row: 3, col: 2 },
      { row: 6, col: 6 },
    ]);
  });

  it("the move step lists reachable squares only for the player whose move it is", () => {
    const mine = toGameView(syncedState({ me: 1, b: 2 }, { phase: "move" }), "r", "me")!;
    expect(mine.step).toBe("move");
    expect(mine.reachable).toEqual(reachableSquares(board, { row: 0, col: 0 }));
    expect(toGameView(syncedState({ me: 1, b: 2 }, { phase: "move" }), "r", "b")!.reachable).toBeUndefined();
    const shiftStep = toGameView(syncedState({ me: 1, b: 2 }), "r", "me")!;
    expect(shiftStep).toMatchObject({ step: "shift", reachable: undefined });
  });

  it("returns undefined until the board has arrived", () => {
    expect(toGameView({ squares: [], players: new Map() }, "r", "me")).toBeUndefined();
    // Right after joining, before the first patch, the decoded state is still empty.
    expect(toGameView({}, "r", "me")).toBeUndefined();
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

describe("game-session › quick-play pool", () => {
  it("reads ?pool= and ignores an empty value", async () => {
    const { quickPlayPool } = await import("./useGameSession.ts");
    expect(quickPlayPool("?pool=e2e-123")).toBe("e2e-123");
    expect(quickPlayPool("?pool=")).toBeUndefined();
    expect(quickPlayPool("")).toBeUndefined();
  });
});

describe("game-session › shift command", () => {
  async function playing(room: GameRoomLike) {
    const connector: Connector = { joinOrCreate: vi.fn(async () => room), reconnect: vi.fn() };
    const hook = renderHook(() => useGameSession(connector));
    act(() => hook.result.current.play());
    await waitFor(() => expect(hook.result.current.status).toBe("playing"));
    return hook;
  }

  it("accepted: sends the payload and shows no notice", async () => {
    const room = fakeRoom();
    const { result } = await playing(room);
    let reply: unknown;
    await act(async () => {
      reply = await result.current.shift("N3", 90);
    });
    expect(reply).toEqual({ ok: true });
    expect(room.request).toHaveBeenCalledWith("shift", { insertion: "N3", rotation: 90 });
    expect(result.current.notice).toBeUndefined();
    expect(result.current.pending).toBe(false);
  });

  it("rejected: notice key for the code, cleared after 4 s", async () => {
    const room = fakeRoom({ request: vi.fn(async () => ({ ok: false, code: "REVERSE_PUSH_FORBIDDEN" })) });
    const { result } = await playing(room);
    vi.useFakeTimers();
    try {
      await act(async () => {
        await result.current.shift("S1", 0);
      });
      expect(result.current.notice).toBe("errors.REVERSE_PUSH_FORBIDDEN");
      act(() => vi.advanceTimersByTime(4_000));
      expect(result.current.notice).toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it("unknown codes and lost replies fall back to the generic message", async () => {
    const room = fakeRoom({ request: vi.fn(async () => Promise.reject(new Error("closed"))) });
    const { result } = await playing(room);
    await act(async () => {
      await result.current.shift("N1", 0);
    });
    expect(result.current.notice).toBe("errors.generic");
  });

  it("pending blocks a second shift", async () => {
    let resolve!: (r: unknown) => void;
    const room = fakeRoom({ request: vi.fn(() => new Promise((r) => (resolve = r))) });
    const { result } = await playing(room);

    let first!: Promise<unknown>;
    act(() => {
      first = result.current.shift("N1", 0);
    });
    expect(result.current.pending).toBe(true);
    let second: unknown = "not called";
    await act(async () => {
      second = await result.current.shift("N3", 0);
    });
    expect(second).toBeUndefined();
    expect(room.request).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolve({ ok: true });
      await first;
    });
    expect(result.current.pending).toBe(false);
  });
});

describe("game-session › move command", () => {
  it("sends the target square; a rejection gives its notice", async () => {
    const room = fakeRoom({ request: vi.fn(async () => ({ ok: false, code: "UNREACHABLE" })) });
    const connector: Connector = { joinOrCreate: vi.fn(async () => room), reconnect: vi.fn() };
    const { result } = renderHook(() => useGameSession(connector));
    act(() => result.current.play());
    await waitFor(() => expect(result.current.status).toBe("playing"));

    await act(async () => {
      await result.current.move({ row: 2, col: 4 });
    });
    expect(room.request).toHaveBeenCalledWith("move", { row: 2, col: 4 });
    expect(result.current.notice).toBe("errors.UNREACHABLE");
  });
});
