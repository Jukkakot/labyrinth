import { BOARD_SIZE } from "./geometry.js";
import { createBoard, type Board } from "./board.js";
import type { Rotation, Tile, TileKind } from "./tile.js";

const KIND_BY_LETTER: Record<string, TileKind> = { I: "straight", L: "corner", T: "tee" };

function parseToken(token: string, id: number): Tile {
  const match = /^([ILT])(0|90|180|270)$/.exec(token);
  if (!match) throw new Error(`Bad tile token "${token}" (expected e.g. I0, L90, T270)`);
  return { id, kind: KIND_BY_LETTER[match[1]!]!, rotation: Number(match[2]) as Rotation };
}

/**
 * Test fixture: builds a board from 7 lines of 7 tokens plus a spare token.
 * A token is the kind letter (I straight, L corner, T tee) and the rotation,
 * e.g. `L90`. Ids are assigned row-major 0…48; the spare gets 49.
 *
 * ```ts
 * boardFromRows(["L90 I0 T0 …", …], "I90")
 * ```
 */
export function boardFromRows(rows: readonly string[], spare = "I0"): Board {
  if (rows.length !== BOARD_SIZE) throw new Error(`Expected ${BOARD_SIZE} rows, got ${rows.length}`);
  const tokens = rows.flatMap((row) => row.trim().split(/\s+/));
  return createBoard({
    squares: tokens.map((token, i) => parseToken(token, i)),
    spare: parseToken(spare, BOARD_SIZE * BOARD_SIZE),
  });
}

/** A board where every square holds the same token (default: straight, open N and S). */
export function uniformBoard(token = "I0"): Board {
  const row = Array.from({ length: BOARD_SIZE }, () => token).join(" ");
  return boardFromRows(Array.from({ length: BOARD_SIZE }, () => row));
}

/** Returns a copy of `board` with `tile` placed (keeping that square's id) at `index`. */
export function withTile(board: Board, index: number, token: string): Board {
  const squares = board.squares.map((t, i) => (i === index ? parseToken(token, t.id) : t));
  return createBoard({ squares, spare: board.spare });
}
