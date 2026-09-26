import { randomInt } from "node:crypto";
import type { Client, CloseCode } from "colyseus";
import { movePayloadSchema, shiftPayloadSchema, type TurnPhase } from "@labyrinth/protocol";
import {
  createBoard,
  isInsertionId,
  isReachable,
  MAX_SEED,
  reverseOf,
  setupBoard,
  shiftBoard,
  START_CORNERS,
  tileSpec,
  type Board,
  type Rotation,
  type Square,
  type Tile,
} from "@labyrinth/rules";
import { log } from "../logging/logger.js";
import { CommandRejection } from "./command.js";
import { LoggedRoom } from "./LoggedRoom.js";
import { GameState, Player, TileState } from "./schema/GameState.js";

/** Seconds a dropped player's seat is held before they are removed. */
const RECONNECT_WINDOW_SECONDS = 60;
export const MAX_SEATS = 4;

const toTileState = (tile: Tile) => new TileState({ id: tile.id, rotation: tile.rotation });
const toTile = (t: TileState): Tile => ({ id: t.id, kind: tileSpec(t.id).kind, rotation: t.rotation as Rotation });
const squareOf = (player: Player): Square => ({ row: player.row, col: player.col });
const placePawn = (player: Player, sq: Square) => {
  player.row = sq.row;
  player.col = sq.col;
};

/** One Labyrinth game: seeded starting board and up to four seated players. */
export class GameRoom extends LoggedRoom<{ state: GameState }> {
  maxClients = MAX_SEATS;
  state = new GameState();

  /** Server-only: never part of the synced state. */
  private seed = 0;

  messages = {
    shift: this.command("shift", shiftPayloadSchema, (client, { insertion, rotation }) => {
      this.requireTurn(client, "shift");
      const last = this.state.lastInsertion;
      if (isInsertionId(last) && insertion === reverseOf(last)) throw new CommandRejection("REVERSE_PUSH_FORBIDDEN");

      const players = [...this.state.players.values()];
      const { board, pawns } = shiftBoard(this.board(), insertion, rotation, players.map(squareOf));
      board.squares.forEach((tile, i) => {
        const current = this.state.squares[i]!;
        if (current.id !== tile.id || current.rotation !== tile.rotation) this.state.squares[i] = toTileState(tile);
      });
      this.state.spare = toTileState(board.spare);
      players.forEach((player, i) => placePawn(player, pawns[i]!));
      this.state.lastInsertion = insertion;
      this.setPhase("move");
    }),

    move: this.command("move", movePayloadSchema, (client, target) => {
      this.requireTurn(client, "move");
      const player = this.state.players.get(client.sessionId)!;
      if (!isReachable(this.board(), squareOf(player), target)) {
        throw new CommandRejection("UNREACHABLE", { to: [target.row, target.col] });
      }
      placePawn(player, target);
      this.passTurn();
    }),
  };

  protected commandStateFacts() {
    const current = [...this.state.players.values()].find((p) => p.seat === this.state.turnSeat);
    return {
      phase: this.state.phase,
      turnSeat: this.state.turnSeat,
      lastInsertion: this.state.lastInsertion,
      pawn: current ? [current.row, current.col] : undefined,
    };
  }

  /** The board as the rules see it, rebuilt from the synced state. */
  private board(): Board {
    return createBoard({ squares: this.state.squares.map(toTile), spare: toTile(this.state.spare) });
  }

  /** Rejects unless `client` is seated, holds the turn and the turn is in `phase`. Changes nothing. */
  private requireTurn(client: Client, phase: string): void {
    const player = this.state.players.get(client.sessionId);
    if (!player) throw new CommandRejection("NOT_SEATED");
    if (player.seat !== this.state.turnSeat) throw new CommandRejection("NOT_YOUR_TURN", { seat: player.seat });
    if (this.state.phase !== phase) throw new CommandRejection("WRONG_PHASE", { expected: phase });
  }

  /** Gives the turn to the next taken seat clockwise (the same seat if alone, 0 if nobody is seated). */
  private passTurn(): void {
    const from = this.state.turnSeat;
    const taken = new Set([...this.state.players.values()].map((p) => p.seat));
    let to = 0;
    for (let step = 1; step <= MAX_SEATS; step++) {
      const seat = ((from - 1 + step + MAX_SEATS) % MAX_SEATS) + 1;
      if (taken.has(seat)) {
        to = seat;
        break;
      }
    }
    this.setTurn(to);
  }

  /** A new turn always starts with the shift step. */
  private setTurn(seat: number): void {
    const from = this.state.turnSeat;
    this.state.turnSeat = seat;
    this.state.phase = "shift";
    log.info("turn.changed", this.logCtx(undefined, { from, to: seat }));
  }

  /** The next step within the same turn. */
  private setPhase(phase: TurnPhase): void {
    const from = this.state.phase;
    this.state.phase = phase;
    log.info("phase.changed", this.logCtx(undefined, { from, to: phase, turnSeat: this.state.turnSeat }));
  }

  async onCreate(options?: unknown) {
    await super.onCreate(options);
    this.seed = randomInt(0, MAX_SEED + 1);
    const board = setupBoard(this.seed);
    this.state.squares.push(...board.squares.map(toTileState));
    this.state.spare = toTileState(board.spare);
    log.info("game.setup", this.logCtx(undefined, { seed: this.seed }));
  }

  /** The lowest seat 1–4 nobody holds (dropped players keep theirs). */
  private freeSeat(): number {
    const taken = new Set([...this.state.players.values()].map((p) => p.seat));
    for (let seat = 1; seat <= MAX_SEATS; seat++) if (!taken.has(seat)) return seat;
    throw new Error("No free seat"); // maxClients prevents this
  }

  onJoin(client: Client) {
    super.onJoin(client);
    const seat = this.freeSeat();
    const corner = START_CORNERS[seat - 1]!;
    this.state.players.set(client.sessionId, new Player({ seat, row: corner.row, col: corner.col }));
    // Until the waiting room exists, the first player to sit down starts.
    if (this.state.turnSeat === 0) this.setTurn(seat);
  }

  onLeave(client: Client, code?: CloseCode) {
    super.onLeave(client, code);
    const seat = this.state.players.get(client.sessionId)?.seat;
    this.state.players.delete(client.sessionId);
    if (seat !== undefined && seat === this.state.turnSeat) this.passTurn();
  }

  /**
   * Unintended disconnect (mobile screen off, network switch): hold the seat so
   * the SDK can reconnect into the same session.
   */
  onDrop(client: Client, code?: CloseCode) {
    const player = this.state.players.get(client.sessionId);
    if (player) player.connected = false;
    this.holdSeat(client, code, RECONNECT_WINDOW_SECONDS);
  }

  onReconnect(client: Client) {
    super.onReconnect(client);
    const player = this.state.players.get(client.sessionId);
    if (player) player.connected = true;
  }
}
