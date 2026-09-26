import { createBoard, isInsertionId, reachableSquares, START_CORNERS, TILE_SET, type Board, type InsertionId, type Rotation, type Square } from "@labyrinth/rules";

/** The synced state as the client receives it (Colyseus schema instances satisfy this shape). */
export interface SyncedState {
  squares?: Iterable<{ id: number; rotation: number }>;
  spare?: { id: number; rotation: number };
  players?: {
    forEach(cb: (player: { seat: number; connected: boolean; row?: number; col?: number }, sessionId: string) => void): void;
  };
  turnSeat?: number;
  phase?: string;
  lastInsertion?: string;
}

export interface SeatView {
  seat: number;
  sessionId: string;
  connected: boolean;
  isMe: boolean;
  /** The square the pawn stands on. */
  square: Square;
}

/** The step of the current turn: first a shift, then a move. */
export type TurnStep = "shift" | "move";

export interface GameView {
  roomId: string;
  board: Board;
  /** Seated players sorted by seat. */
  seats: SeatView[];
  mySeat?: number;
  /** Seat of the current player; 0 when nobody is seated. */
  turnSeat: number;
  isMyTurn: boolean;
  step: TurnStep;
  /** On the viewer's own move step: every square their pawn can reach, its own square first. */
  reachable?: Square[];
  /** The previous shift, whose reverse is forbidden. */
  lastInsertion?: InsertionId;
}

const toTile = ({ id, rotation }: { id: number; rotation: number }) => ({
  id,
  kind: TILE_SET[id]!.kind,
  rotation: rotation as Rotation,
});

/**
 * Builds the immutable view of a game from synced state. Tile kinds come from
 * the static tile set; `createBoard` validates what the server sent. Returns
 * undefined until the board has arrived (right after joining, the state is
 * still empty until the first patch).
 */
export function toGameView(state: SyncedState, roomId: string, mySessionId: string): GameView | undefined {
  const squares = state.squares ? [...state.squares] : [];
  if (squares.length !== 49 || !state.spare) return undefined;

  const board = createBoard({ squares: squares.map(toTile), spare: toTile(state.spare) });
  const seats: SeatView[] = [];
  state.players?.forEach((p, sessionId) => {
    if (p.seat <= 0) return;
    const corner = START_CORNERS[p.seat - 1]!;
    const square = { row: p.row ?? corner.row, col: p.col ?? corner.col };
    seats.push({ seat: p.seat, sessionId, connected: p.connected, isMe: sessionId === mySessionId, square });
  });
  seats.sort((a, b) => a.seat - b.seat);
  const mySeat = seats.find((s) => s.isMe)?.seat;
  const turnSeat = state.turnSeat ?? 0;
  const isMyTurn = mySeat !== undefined && mySeat === turnSeat;
  const step: TurnStep = state.phase === "move" ? "move" : "shift";
  const me = seats.find((s) => s.isMe);
  return {
    roomId,
    board,
    seats,
    mySeat,
    turnSeat,
    isMyTurn,
    step,
    reachable: isMyTurn && step === "move" && me ? reachableSquares(board, me.square) : undefined,
    lastInsertion: isInsertionId(state.lastInsertion) ? state.lastInsertion : undefined,
  };
}
