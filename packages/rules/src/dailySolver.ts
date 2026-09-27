import { connectedNeighbours, tileAt, type Board } from "./board.js";
import { ALL_SQUARES, squareIndex, type Square } from "./geometry.js";
import { INSERTIONS, reverseOf, shiftBoard, type InsertionId } from "./shift.js";
import { openings, ROTATIONS, rotate, type Rotation } from "./tile.js";
import { treasureOf, type TreasureId } from "./tileSet.js";

/** One node of the search: a board after some shifts and every square the pawn could stand on. */
interface Node {
  board: Board;
  squares: Square[];
  last: InsertionId | undefined;
}

/** The spare's rotations that give different tiles (a straight has two, a corner or tee four). */
function distinctRotations(board: Board): Rotation[] {
  const seen = new Set<string>();
  return ROTATIONS.filter((r) => {
    const key = openings(rotate({ ...board.spare, rotation: 0 }, r / 90)).join();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Every square connected to any of `from` (a multi-source flood). */
function reachFrom(board: Board, from: readonly Square[]): Square[] {
  const seen = new Uint8Array(ALL_SQUARES.length);
  const queue: Square[] = [];
  for (const sq of from) {
    const i = squareIndex(sq);
    if (seen[i]) continue;
    seen[i] = 1;
    queue.push(sq);
  }
  for (let q = 0; q < queue.length; q++) {
    for (const next of connectedNeighbours(board, queue[q]!)) {
      const n = squareIndex(next);
      if (seen[n]) continue;
      seen[n] = 1;
      queue.push(next);
    }
  }
  return queue;
}

/**
 * The fewest turns (a shift and a move each) in which a pawn on `start` can end its move on each
 * treasure, searching every shift and rotation up to `maxTurns` turns; treasures not reachable
 * within that are left out. The pawn's own choices never change the board, so each board keeps the
 * set of squares the pawn could be on instead of one node per square.
 */
export function fewestTurns(board: Board, start: Square, maxTurns: number, lastInsertion?: InsertionId): Map<TreasureId, number> {
  const best = new Map<TreasureId, number>();
  let frontier: Node[] = [{ board, squares: [start], last: lastInsertion }];
  for (let turn = 1; turn <= maxTurns && frontier.length > 0; turn++) {
    const next: Node[] = [];
    for (const node of frontier) {
      const forbidden = node.last && reverseOf(node.last);
      const rotations = distinctRotations(node.board);
      for (const insertion of INSERTIONS) {
        if (insertion === forbidden) continue;
        for (const rotation of rotations) {
          const shifted = shiftBoard(node.board, insertion, rotation, node.squares);
          const reach = reachFrom(shifted.board, shifted.pawns);
          for (const sq of reach) {
            const treasure = treasureOf(tileAt(shifted.board, sq).id);
            if (treasure && !best.has(treasure)) best.set(treasure, turn);
          }
          if (turn < maxTurns) next.push({ board: shifted.board, squares: reach, last: insertion });
        }
      }
    }
    frontier = next;
  }
  return best;
}
