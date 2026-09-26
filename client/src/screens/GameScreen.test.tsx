// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { isReachable, openings, reachableSquares, rotate, setupBoard, shiftBoard, square, squareIndex } from "@labyrinth/rules";
import { describe, expect, it, vi } from "vitest";
import "../i18n";
import type { GameSession } from "../session/useGameSession.ts";
import { toGameView, type SyncedState } from "../session/viewModel.ts";
import { GameScreen } from "./GameScreen.tsx";

const board = setupBoard(7);

interface Turn {
  turnSeat?: number;
  lastInsertion?: string;
  phase?: string;
  /** My pawn square (default: my start corner). */
  mine?: { row: number; col: number };
}

function view(turn: Turn = {}) {
  const state: SyncedState = {
    squares: board.squares.map(({ id, rotation }) => ({ id, rotation })),
    spare: { id: board.spare.id, rotation: board.spare.rotation },
    players: new Map([
      ["me", { seat: 1, connected: true, ...(turn.mine ?? { row: 0, col: 0 }) }],
      ["other", { seat: 2, connected: true }],
    ]),
    turnSeat: turn.turnSeat ?? 1,
    lastInsertion: turn.lastInsertion ?? "",
    phase: turn.phase ?? "shift",
  };
  return toGameView(state, "brave-otters-sing", "me")!;
}

function setup(turn?: Turn, session: Partial<GameSession> = {}) {
  const shift = vi.fn<GameSession["shift"]>(async () => ({ ok: true }));
  const move = vi.fn<GameSession["move"]>(async () => ({ ok: true }));
  const utils = render(<GameScreen view={view(turn)} session={{ shift, move, pending: false, ...session }} />);
  return { shift, move, ...utils };
}

/** Where the board draws a tile: its translate in board units. */
function tilePosition(container: HTMLElement, id: number) {
  const g = container.querySelector<SVGGElement>(`[aria-label="Pelilauta"] [data-tile-id="${id}"]`);
  return g?.style.transform;
}
const at = (row: number, col: number) => `translate(${col * 100}px, ${row * 100}px)`;

const arrow = (name: string) => screen.getByRole("button", { name });

describe("board-view › Shift controls", () => {
  it("Preview then confirm: N3 previews column 4 moved down, Työnnä sends once", async () => {
    const { container, shift } = setup();
    fireEvent.click(arrow("Työnnä ylhäältä sarakkeeseen 4"));

    expect(tilePosition(container, board.spare.id)).toBe(at(0, 3));
    const before = board.squares[squareIndex(square(2, 3))]!;
    expect(tilePosition(container, before.id)).toBe(at(3, 3));
    const outgoing = board.squares[squareIndex(square(6, 3))]!;
    expect(tilePosition(container, outgoing.id)).toBeUndefined();
    expect(screen.getByRole("group", { name: "Tippuu pois" })).toBeTruthy();
    expect(shift).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Työnnä" }));
    });
    expect(shift).toHaveBeenCalledTimes(1);
    expect(shift).toHaveBeenCalledWith("N3", board.spare.rotation);
  });

  it("tapping the selected arrow again confirms", async () => {
    const { shift } = setup();
    fireEvent.click(arrow("Työnnä vasemmalta riviin 2"));
    await act(async () => {
      fireEvent.click(arrow("Työnnä vasemmalta riviin 2"));
    });
    expect(shift).toHaveBeenCalledExactlyOnceWith("W1", board.spare.rotation);
  });

  it("Change of mind: N3 then W1 previews W1 and sends nothing; Peru restores the board", () => {
    const { container, shift } = setup();
    fireEvent.click(arrow("Työnnä ylhäältä sarakkeeseen 4"));
    fireEvent.click(arrow("Työnnä vasemmalta riviin 2"));

    expect(tilePosition(container, board.spare.id)).toBe(at(1, 0));
    const expected = shiftBoard(board, "W1", board.spare.rotation).board;
    expected.squares.forEach((tile, i) => {
      expect(tilePosition(container, tile.id)).toBe(at(Math.floor(i / 7), i % 7));
    });
    expect(shift).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Peru" }));
    expect(tilePosition(container, board.spare.id)).toBeUndefined();
    expect(screen.getByText("Valitse nuoli laudan reunalta")).toBeTruthy();
  });

  it("Rotate the spare twice: shown turned 180°, inserted with rotation + 180°", async () => {
    const { container, shift } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Käännä laattaa" }));
    fireEvent.click(screen.getByRole("button", { name: "Käännä laattaa" }));

    const turned = rotate(board.spare, 2);
    const spare = screen.getByRole("group", { name: "Ylimääräinen laatta" });
    expect(spare.querySelector("[data-tile-id]")?.getAttribute("data-openings")).toBe(openings(turned).join(""));

    fireEvent.click(arrow("Työnnä oikealta riviin 4"));
    const inserted = container.querySelector(`[aria-label="Pelilauta"] [data-tile-id="${board.spare.id}"]`);
    expect(inserted?.getAttribute("data-openings")).toBe(openings(turned).join(""));
    expect(inserted?.querySelector("[data-highlight]")).not.toBeNull();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Työnnä" }));
    });
    expect(shift).toHaveBeenCalledWith("E3", turned.rotation);
  });

  it("offers exactly 12 arrows on your turn", () => {
    const { container } = setup();
    expect(container.querySelectorAll("[data-insertion]")).toHaveLength(12);
  });

  it("keyboard: Enter selects an arrow", () => {
    const { container } = setup();
    fireEvent.keyDown(arrow("Työnnä alhaalta sarakkeeseen 6"), { key: "Enter" });
    expect(tilePosition(container, board.spare.id)).toBe(at(6, 5));
  });
});

describe("board-view › Tiles slide", () => {
  it("Someone shifts: tiles keep their element and get a new position; the preview gives way to the synced board", () => {
    const { container, rerender, shift } = setup();
    fireEvent.click(arrow("Työnnä ylhäältä sarakkeeseen 2"));
    const moving = board.squares[squareIndex(square(0, 1))]!;
    const element = container.querySelector(`[data-tile-id="${moving.id}"]`);

    const after = shiftBoard(board, "N5", board.spare.rotation).board;
    const synced = toGameView(
      {
        squares: after.squares.map(({ id, rotation }) => ({ id, rotation })),
        spare: { id: after.spare.id, rotation: after.spare.rotation },
        players: new Map([["me", { seat: 1, connected: true }]]),
        turnSeat: 1,
        lastInsertion: "N5",
      },
      "brave-otters-sing",
      "me",
    )!;
    rerender(<GameScreen view={synced} session={{ shift, move: vi.fn(), pending: false }} />);

    // The N1 preview is gone; the board is the synced one.
    expect(tilePosition(container, moving.id)).toBe(at(0, 1));
    const slid = board.squares[squareIndex(square(0, 5))]!;
    expect(tilePosition(container, slid.id)).toBe(at(1, 5));
    expect(container.querySelector(`[data-tile-id="${moving.id}"]`)).toBe(element);
    expect(element?.getAttribute("class")).toMatch(/slide/);
  });
});

describe("board-view › Forbidden reverse shown", () => {
  it("After N1: the S1 arrow is disabled and tapping it does nothing", () => {
    const { container, shift } = setup({ lastInsertion: "N1" });
    const s1 = container.querySelector("[data-insertion='S1']")!;
    expect(s1.getAttribute("aria-disabled")).toBe("true");
    expect(s1.getAttribute("aria-label")).toContain("ei sallittu");

    fireEvent.click(s1);
    expect(tilePosition(container, board.spare.id)).toBeUndefined();
    expect(shift).not.toHaveBeenCalled();
    expect(container.querySelector("[data-insertion='N1']")!.getAttribute("aria-disabled")).toBeNull();
  });
});

describe("board-view › Whose turn is shown (game screen)", () => {
  it("Other player's turn: no arrows, rotate disabled, turn line names player 2", () => {
    const { container } = setup({ turnSeat: 2 });
    expect(container.querySelectorAll("[data-insertion]")).toHaveLength(0);
    expect((screen.getByRole("button", { name: "Käännä laattaa" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText("Pelaaja 2 työntää")).toBeTruthy();
    expect(screen.queryByText("Valitse nuoli laudan reunalta")).toBeNull();
  });
});

describe("board-view › Rejected command message", () => {
  it("pending: arrows and buttons wait, and a rejection message is shown in words", () => {
    const { container } = setup({}, { pending: true, notice: "errors.NOT_YOUR_TURN" });
    expect(container.querySelector("[data-insertion='N1']")!.getAttribute("aria-disabled")).toBe("true");
    expect((screen.getByRole("button", { name: "Käännä laattaa" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText("Ei ole sinun vuorosi").closest("[role=status]")).not.toBeNull();
  });

  it("a rejected shift drops the preview", async () => {
    const { container } = setup({}, { shift: vi.fn(async () => ({ ok: false as const, code: "NOT_YOUR_TURN" })) });
    fireEvent.click(arrow("Työnnä ylhäältä sarakkeeseen 2"));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Työnnä" }));
    });
    expect(tilePosition(container, board.spare.id)).toBeUndefined();
  });
});

const pawnOf = (name: string) => screen.getByRole("img", { name }).style.transform;

describe("board-view › Pawns on their squares (game screen)", () => {
  it("Preview carries a pawn: N3 shows the pawn on (2,3) at (3,3)", () => {
    setup({ mine: { row: 2, col: 3 } });
    expect(pawnOf("Pelaaja 1 (sinä)")).toBe(at(2, 3));
    fireEvent.click(arrow("Työnnä ylhäältä sarakkeeseen 4"));
    expect(pawnOf("Pelaaja 1 (sinä)")).toBe(at(3, 3));
    fireEvent.click(screen.getByRole("button", { name: "Peru" }));
    expect(pawnOf("Pelaaja 1 (sinä)")).toBe(at(2, 3));
  });
});

describe("board-view › Move controls", () => {
  const reach = reachableSquares(board, square(0, 0));
  const target = reach.at(-1)!;
  const moveTargets = (container: HTMLElement) => container.querySelectorAll("[data-move-target]");

  it("the test board has somewhere to go from the top-left corner", () => {
    expect(reach.length).toBeGreaterThan(1);
  });

  it("Tap to move: every reachable square is a target; tapping one sends the move once", async () => {
    const { container, move, shift } = setup({ phase: "move" });
    expect(moveTargets(container)).toHaveLength(reach.length);
    expect(container.querySelectorAll("[data-insertion]")).toHaveLength(0);
    expect(screen.queryByRole("button", { name: "Käännä laattaa" })).toBeNull();
    expect(screen.getByText("Sinun vuorosi – siirrä nappulaa")).toBeTruthy();

    await act(async () => {
      fireEvent.click(container.querySelector(`[data-move-target="${target.row},${target.col}"]`)!);
    });
    expect(move).toHaveBeenCalledExactlyOnceWith(target);
    expect(shift).not.toHaveBeenCalled();
  });

  it("Stay: the button and the own square both send the own square", async () => {
    const { container, move } = setup({ phase: "move" });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Jää paikalleen" }));
    });
    expect(move).toHaveBeenLastCalledWith({ row: 0, col: 0 });
    await act(async () => {
      fireEvent.click(container.querySelector(`[data-move-target="0,0"]`)!);
    });
    expect(move).toHaveBeenCalledTimes(2);
    expect(move).toHaveBeenLastCalledWith({ row: 0, col: 0 });
  });

  it("Unreachable square: no target there, so tapping it sends nothing", () => {
    const { container, move } = setup({ phase: "move" });
    const unreachable = [...Array(49).keys()].map((i) => square(Math.floor(i / 7), i % 7)).find((sq) => !isReachable(board, square(0, 0), sq))!;
    expect(container.querySelector(`[data-move-target="${unreachable.row},${unreachable.col}"]`)).toBeNull();
    fireEvent.click(container.querySelector(`[data-tile-id="${board.squares[squareIndex(unreachable)]!.id}"]`)!);
    expect(move).not.toHaveBeenCalled();
  });

  it("Not during the shift: no squares are highlighted", () => {
    const { container } = setup();
    expect(moveTargets(container)).toHaveLength(0);
    expect(screen.queryByRole("button", { name: "Jää paikalleen" })).toBeNull();
  });

  it("pending: move targets and Stay wait", () => {
    const { container, move } = setup({ phase: "move" }, { pending: true });
    expect(moveTargets(container)[0]!.getAttribute("aria-disabled")).toBe("true");
    expect((screen.getByRole("button", { name: "Odotetaan palvelinta…" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(moveTargets(container)[1] ?? moveTargets(container)[0]!);
    expect(move).not.toHaveBeenCalled();
  });

  it("Other player's move step: no targets, no Stay, turn line says player 2 is moving", () => {
    const { container } = setup({ phase: "move", turnSeat: 2 });
    expect(moveTargets(container)).toHaveLength(0);
    expect(screen.queryByRole("button", { name: "Jää paikalleen" })).toBeNull();
    expect(screen.getByText("Pelaaja 2 siirtää")).toBeTruthy();
  });
});
