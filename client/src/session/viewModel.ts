import { createBoard, TILE_SET, type Board, type Rotation } from "@labyrinth/rules";

/** The synced state as the client receives it (Colyseus schema instances satisfy this shape). */
export interface SyncedState {
  squares?: Iterable<{ id: number; rotation: number }>;
  spare?: { id: number; rotation: number };
  players?: { forEach(cb: (player: { seat: number; connected: boolean }, sessionId: string) => void): void };
}

export interface SeatView {
  seat: number;
  sessionId: string;
  connected: boolean;
  isMe: boolean;
}

export interface GameView {
  roomId: string;
  board: Board;
  /** Seated players sorted by seat. */
  seats: SeatView[];
  mySeat?: number;
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
    if (p.seat > 0) seats.push({ seat: p.seat, sessionId, connected: p.connected, isMe: sessionId === mySessionId });
  });
  seats.sort((a, b) => a.seat - b.seat);
  return { roomId, board, seats, mySeat: seats.find((s) => s.isMe)?.seat };
}
