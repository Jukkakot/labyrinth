// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { setupBoard, TILE_SET } from "@labyrinth/rules";
import { describe, expect, it } from "vitest";
import "../i18n";
import { Board } from "./Board.tsx";
import { SpareTile } from "./SpareTile.tsx";
import { TileView } from "./TileView.tsx";

const inSvg = (node: React.ReactNode) => render(<svg>{node}</svg>);

describe("board-view › Tiles show their corridors", () => {
  it("Corner tile: corridor arms toward exactly E and S", () => {
    const { container } = inSvg(<TileView tile={{ id: 30, kind: "corner", rotation: 90 }} />);
    const arms = [...container.querySelectorAll("[data-arm]")].map((el) => el.getAttribute("data-arm"));
    expect(arms).toEqual(["E", "S"]);
  });

  it("Fixed tiles recognisable: 16 tiles carry the fixed mark", () => {
    const { container } = render(<Board board={setupBoard(1)} />);
    expect(container.querySelectorAll("[data-tile-id]")).toHaveLength(49);
    expect(container.querySelectorAll("[data-fixed]")).toHaveLength(16);
  });
});

describe("board-view › Treasures shown as icons", () => {
  it("Treasure tile: dragon tile has an icon and a localized accessible name", () => {
    const dragon = TILE_SET.find((t) => t.treasure === "dragon")!;
    const { container } = inSvg(<TileView tile={{ id: dragon.id, kind: dragon.kind, rotation: 0 }} />);
    expect(screen.getByRole("img", { name: "Aarre: lohikäärme" })).toBeTruthy();
    expect(container.querySelector("svg svg")).not.toBeNull();
  });

  it("plain tiles are hidden from assistive technology", () => {
    const { container } = inSvg(<TileView tile={{ id: 16, kind: "straight", rotation: 0 }} />);
    expect(container.querySelector("g")?.getAttribute("aria-hidden")).toBe("true");
  });
});

describe("board-view › Pawns on their squares", () => {
  it("Two players: circle top-left and square top-right, own pawn marked", () => {
    render(
      <Board
        board={setupBoard(1)}
        seats={[
          { seat: 1, sessionId: "a", connected: true, isMe: true, square: { row: 0, col: 0 } },
          { seat: 2, sessionId: "b", connected: true, isMe: false, square: { row: 0, col: 6 } },
        ]}
      />,
    );
    const mine = screen.getByRole("img", { name: "Pelaaja 1 (sinä)" });
    const other = screen.getByRole("img", { name: "Pelaaja 2" });
    expect(mine.style.transform).toBe("translate(0px, 0px)");
    expect(other.style.transform).toBe("translate(600px, 0px)");
    expect(mine.querySelector("circle")).not.toBeNull(); // ownership ring
    expect(other.querySelector("circle")).toBeNull();
  });
});

describe("board-view › Pawns on their squares (shared)", () => {
  it("Shared square: both pawns visible, drawn smaller side by side", () => {
    render(
      <Board
        board={setupBoard(1)}
        seats={[
          { seat: 1, sessionId: "a", connected: true, isMe: true, square: { row: 3, col: 2 } },
          { seat: 2, sessionId: "b", connected: true, isMe: false, square: { row: 3, col: 2 } },
          { seat: 3, sessionId: "c", connected: true, isMe: false, square: { row: 6, col: 6 } },
        ]}
      />,
    );
    const one = screen.getByRole("img", { name: "Pelaaja 1 (sinä)" });
    const two = screen.getByRole("img", { name: "Pelaaja 2" });
    expect(one.style.transform).toBe("translate(200px, 300px)");
    expect(two.style.transform).toBe("translate(200px, 300px)");
    expect(one.getAttribute("data-crowded")).toBe("true");
    expect(two.getAttribute("data-crowded")).toBe("true");
    expect(one.firstElementChild!.getAttribute("transform")).not.toBe(two.firstElementChild!.getAttribute("transform"));
    expect(screen.getByRole("img", { name: "Pelaaja 3" }).getAttribute("data-crowded")).toBeNull();
  });
});

describe("board-view › Spare tile shown", () => {
  it("Spare with treasure: drawn with corridors, icon and label", () => {
    const chestTile = TILE_SET.find((t) => t.treasure === "dragon")!;
    render(<SpareTile tile={{ id: chestTile.id, kind: chestTile.kind, rotation: 0 }} />);
    expect(screen.getByText("Ylimääräinen laatta")).toBeTruthy();
    expect(screen.getByRole("img", { name: "Aarre: lohikäärme" })).toBeTruthy();
  });
});
