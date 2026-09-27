import {
  createBoard,
  isInsertionId,
  reachableSquares,
  START_CORNERS,
  targetTileId,
  TILE_SET,
  TREASURES,
  type Board,
  type InsertionId,
  type Rotation,
  type Square,
  type TreasureId,
} from "@labyrinth/rules";

/** The synced state as the client receives it (Colyseus schema instances satisfy this shape). */
export interface SyncedState {
  squares?: Iterable<{ id: number; rotation: number }>;
  spare?: { id: number; rotation: number };
  players?: {
    forEach(cb: (player: SyncedPlayer, sessionId: string) => void): void;
  };
  turnSeat?: number;
  phase?: string;
  /** Seat of the host; 0 until someone has joined. */
  hostSeat?: number;
  lastInsertion?: string;
  winnerSeat?: number;
  /** Server epoch ms when the current turn's time runs out; 0 = no clock. */
  turnDeadline?: number;
  turnExpired?: boolean;
}

export interface SyncedPlayer {
  seat: number;
  connected: boolean;
  /** True for a computer-controlled seat. */
  bot?: boolean;
  name?: string;
  row?: number;
  col?: number;
  cards?: number;
  found?: Iterable<string>;
  /** Only present for the viewer's own player; "" = heading home. */
  target?: string;
}

/** The viewer's current target: a treasure, or their start corner once every card is found. */
export type Target = TreasureId | "home";

export interface SeatView {
  seat: number;
  sessionId: string;
  /** The player's nickname. */
  name: string;
  /** Always true for a bot. */
  connected: boolean;
  isMe: boolean;
  /** A computer-controlled seat (never the viewer, never the host). */
  isBot: boolean;
  /** The square the pawn stands on. */
  square: Square;
  /** Size of the seat's treasure stack. */
  cards: number;
  /** Treasures found so far, in order. */
  found: TreasureId[];
}

/** The step of the current turn: first a shift, then a move. */
export type TurnStep = "shift" | "move";

/** Where the game is: the waiting room before the start, the game itself, or finished. */
export type GamePhase = "waiting" | "playing" | "finished";

export interface GameView {
  roomId: string;
  phase: GamePhase;
  /** Seat of the host, who may start the game from the waiting room; 0 until known. */
  hostSeat: number;
  board: Board;
  /** Seated players sorted by seat. */
  seats: SeatView[];
  mySeat?: number;
  /** Seat of the current player; 0 in the waiting room. */
  turnSeat: number;
  isMyTurn: boolean;
  step: TurnStep;
  /** On the viewer's own move step: every square their pawn can reach, its own square first. */
  reachable?: Square[];
  /** The previous shift, whose reverse is forbidden. */
  lastInsertion?: InsertionId;
  /** The viewer's own current target; undefined without a seat or before it has arrived. */
  myTarget?: Target;
  /** Id of the tile the viewer is heading for (their target's tile or their start corner); only while the game runs. */
  targetTileId?: number;
  /** Seat of the winner; 0 while the game runs. */
  winnerSeat: number;
  finished: boolean;
  /** Server epoch ms when the current turn's time runs out; 0 while no clock runs. */
  turnDeadline: number;
  /** The current turn's time is up (the server decides). */
  turnExpired: boolean;
  /** The current player's connection has dropped. */
  turnDisconnected: boolean;
  /** The viewer may kick the current player: seated, not on turn, time up, game running. */
  canKick: boolean;
}

const isTreasure = (value: unknown): value is TreasureId => (TREASURES as readonly unknown[]).includes(value);

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
  let myTarget: Target | undefined;
  state.players?.forEach((p, sessionId) => {
    if (p.seat <= 0) return;
    const corner = START_CORNERS[p.seat - 1]!;
    const square = { row: p.row ?? corner.row, col: p.col ?? corner.col };
    const found = [...(p.found ?? [])].filter(isTreasure);
    const isMe = sessionId === mySessionId;
    if (isMe) myTarget = readTarget(p.target, found.length, p.cards ?? 0);
    const isBot = p.bot === true;
    seats.push({ seat: p.seat, sessionId, name: p.name ?? "", connected: isBot || p.connected, isMe, isBot, square, cards: p.cards ?? 0, found });
  });
  seats.sort((a, b) => a.seat - b.seat);
  const mySeat = seats.find((s) => s.isMe)?.seat;
  const turnSeat = state.turnSeat ?? 0;
  const winnerSeat = state.winnerSeat ?? 0;
  const finished = state.phase === "finished";
  const phase: GamePhase = finished ? "finished" : state.phase === "waiting" ? "waiting" : "playing";
  const isMyTurn = !finished && mySeat !== undefined && mySeat === turnSeat;
  const step: TurnStep = state.phase === "move" ? "move" : "shift";
  const me = seats.find((s) => s.isMe);
  const current = seats.find((s) => s.seat === turnSeat);
  const turnExpired = !finished && (state.turnExpired ?? false);
  return {
    roomId,
    phase,
    hostSeat: state.hostSeat ?? 0,
    board,
    seats,
    mySeat,
    turnSeat,
    isMyTurn,
    step,
    reachable: isMyTurn && step === "move" && me ? reachableSquares(board, me.square) : undefined,
    lastInsertion: isInsertionId(state.lastInsertion) ? state.lastInsertion : undefined,
    myTarget,
    targetTileId:
      !finished && mySeat !== undefined && myTarget !== undefined
        ? targetTileId(mySeat, myTarget === "home" ? undefined : myTarget)
        : undefined,
    winnerSeat,
    finished,
    turnDeadline: finished ? 0 : (state.turnDeadline ?? 0),
    turnExpired,
    turnDisconnected: !finished && current !== undefined && !current.connected,
    canKick: turnExpired && mySeat !== undefined && current !== undefined && mySeat !== turnSeat,
  };
}

/** "" means heading home only once every card is found; before that it just has not arrived yet. */
function readTarget(target: string | undefined, found: number, cards: number): Target | undefined {
  if (isTreasure(target)) return target;
  return target === "" && cards > 0 && found >= cards ? "home" : undefined;
}
