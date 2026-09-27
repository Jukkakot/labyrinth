import { insertionLine, sameSquare, shortestPath, squareIndex, type Square } from "@labyrinth/rules";
import type { GameView } from "../session/viewModel.ts";

/** What the last turn did, kept until the next shift: the pushed-in tile and the walked route. */
export interface TurnTrace {
  /** Identifies the last seen shift (spare id + insertion); a new value means someone shifted. */
  shiftKey: string;
  /** Seat that made the last shift, and whose route is drawn. */
  seat?: number;
  /** Id of the tile the last shift pushed in. */
  pushedTileId?: number;
  /** The walked route `[from, …, to]`; undefined when the pawn stayed or has not moved yet. */
  route?: Square[];
  /** While a move step runs: the mover's seat and square at its start. */
  moving?: { seat: number; from: Square };
}

type TraceView = Pick<GameView, "board" | "seats" | "turnSeat" | "step" | "lastInsertion" | "finished">;

const keyOf = (view: TraceView) => `${view.board.spare.id}|${view.lastInsertion ?? ""}`;

/**
 * The trace after `view`, derived from the synced state alone. Returns `previous` itself when
 * nothing changed, so it can be kept in React state and updated during render.
 * A client that joins mid-turn has no marks until the next shift.
 */
export function nextTrace(previous: TurnTrace | undefined, view: TraceView): TurnTrace {
  let trace: TurnTrace = previous ?? { shiftKey: keyOf(view) };
  const inMove = view.step === "move" && !view.finished;

  // The move step ended (turn passed or game over): the route from its start to where the pawn is now.
  const moving = trace.moving;
  if (moving && (!inMove || view.turnSeat !== moving.seat)) {
    const to = view.seats.find((s) => s.seat === moving.seat)?.square;
    const route =
      to && !sameSquare(to, moving.from) ? (shortestPath(view.board, moving.from, to) ?? [moving.from, to]) : undefined;
    trace = { ...trace, moving: undefined, route };
  }

  // Someone shifted: mark the pushed-in tile; the previous route is gone.
  const shiftKey = keyOf(view);
  if (shiftKey !== trace.shiftKey) {
    const entry = view.lastInsertion ? insertionLine(view.lastInsertion)[0] : undefined;
    trace = {
      shiftKey,
      seat: view.turnSeat,
      pushedTileId: entry ? view.board.squares[squareIndex(entry)]?.id : undefined,
      route: undefined,
    };
  }

  // The move step starts: remember where the mover stands (after the shift carried it).
  if (inMove && !trace.moving) {
    const from = view.seats.find((s) => s.seat === view.turnSeat)?.square;
    if (from) trace = { ...trace, moving: { seat: view.turnSeat, from } };
  }
  return trace;
}
