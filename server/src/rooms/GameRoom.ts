import { randomInt } from "node:crypto";
import { StateView } from "@colyseus/schema";
import type { Client, CloseCode, Deferred } from "colyseus";
import { CLOSE_CODES, kickPayloadSchema, movePayloadSchema, shiftPayloadSchema, type TurnPhase } from "@labyrinth/protocol";
import {
  createBoard,
  dealTreasures,
  DISCONNECT_LIMIT_SECONDS,
  isInsertionId,
  isReachable,
  kickRejection,
  MAX_SEED,
  nextSeat,
  reverseOf,
  settleMove,
  setupBoard,
  shiftBoard,
  soleSurvivor,
  START_CORNERS,
  tileSpec,
  TURN_TIME_LIMIT_SECONDS,
  type Board,
  type Rotation,
  type Square,
  type Tile,
  type TreasureId,
} from "@labyrinth/rules";
import { log } from "../logging/logger.js";
import { CommandRejection } from "./command.js";
import { LoggedRoom } from "./LoggedRoom.js";
import { GameState, Player, TileState } from "./schema/GameState.js";

export const MAX_SEATS = 4;

/** Why a player was taken out of the game (`player.removed`). */
type RemovalReason = "left" | "kicked" | "timeout";

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

  /** Turn time limit; room tests shorten it. */
  turnLimitMs = TURN_TIME_LIMIT_SECONDS * 1000;
  /** How long a dropped player keeps their seat; room tests shorten it. */
  disconnectLimitSeconds = DISCONNECT_LIMIT_SECONDS;

  /** Server-only: never part of the synced state. */
  private seed = 0;
  private dealSeed = 0;
  /** Treasure stack of each seat (index = seat − 1), dealt when the game is created. */
  private stacks: TreasureId[][] = [];
  /** True once a shift was made with at least two players seated: from then on the last player left wins. */
  private contested = false;
  private turnTimer?: { clear(): void };
  /** Seat holds of dropped players, by sessionId; rejecting one removes that player at once. */
  private holds = new Map<string, Deferred<Client>>();

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
      if (players.length >= 2) this.contested = true;
      this.setPhase("move");
    }),

    move: this.command("move", movePayloadSchema, (client, target) => {
      this.requireTurn(client, "move");
      const player = this.state.players.get(client.sessionId)!;
      if (!isReachable(this.board(), squareOf(player), target)) {
        throw new CommandRejection("UNREACHABLE", { to: [target.row, target.col] });
      }
      placePawn(player, target);
      const outcome = settleMove(this.board(), {
        seat: player.seat,
        square: target,
        target: (player.target || undefined) as TreasureId | undefined,
      });
      if (outcome.collected) this.collect(player, outcome.collected);
      if (outcome.won) this.finish(player.seat, "home");
      else this.passTurn();
    }),

    kick: this.command("kick", kickPayloadSchema, (client, { seat }) => {
      const kicker = this.state.players.get(client.sessionId);
      if (!kicker) throw new CommandRejection("NOT_SEATED");
      const code = kickRejection({
        kicker: kicker.seat,
        target: seat,
        turnSeat: this.state.turnSeat,
        expired: this.state.turnExpired,
        finished: this.state.phase === "finished",
      });
      if (code) throw new CommandRejection(code, { target: seat });

      const targetId = [...this.state.players.entries()].find(([, p]) => p.seat === seat)![0];
      this.removePlayer(targetId, "kicked", kicker.seat);
      // Then disconnect them: a dropped player's hold ends, a connected one is told why.
      const hold = this.holds.get(targetId);
      if (hold) {
        this.holds.delete(targetId);
        hold.reject(false);
      } else {
        this.clients.find((c) => c.sessionId === targetId)?.leave(CLOSE_CODES.KICKED);
      }
    }),
  };

  protected commandStateFacts() {
    const current = [...this.state.players.values()].find((p) => p.seat === this.state.turnSeat);
    return {
      phase: this.state.phase,
      turnSeat: this.state.turnSeat,
      turnExpired: this.state.turnExpired,
      lastInsertion: this.state.lastInsertion,
      pawn: current ? [current.row, current.col] : undefined,
    };
  }

  /** Adds the treasure to the player's found ones; the next card of the stack (or home) becomes the target. */
  private collect(player: Player, treasure: TreasureId): void {
    player.found.push(treasure);
    player.target = this.stacks[player.seat - 1]![player.found.length] ?? "";
    log.info("treasure.collected", this.logCtx(undefined, { seat: player.seat, treasure, found: player.found.length, cards: player.cards }));
  }

  /** A win ends the game: no further turn, no clock, and quick play no longer joins this room. */
  private finish(winner: number, reason: "home" | "lastPlayer"): void {
    this.state.winnerSeat = winner;
    this.setPhase("finished");
    this.restartClock();
    void this.lock();
    log.info("game.finished", this.logCtx(undefined, { winner, reason }));
  }

  /**
   * The one way out of a running game (left, kicked, disconnected too long): pawn, stack and seat
   * go; then the last player standing wins, or the turn passes if it was theirs.
   */
  private removePlayer(sessionId: string, reason: RemovalReason, by?: number): void {
    const player = this.state.players.get(sessionId);
    if (!player) return;
    const { seat } = player;
    this.state.players.delete(sessionId);
    log.info("player.removed", this.logCtx(undefined, { player: sessionId, seat, reason, ...(by !== undefined && { by }) }));
    if (this.state.phase === "finished") return;
    const survivor = soleSurvivor([...this.state.players.values()].map((p) => p.seat));
    if (this.contested && survivor !== undefined) this.finish(survivor, "lastPlayer");
    else if (seat === this.state.turnSeat) this.passTurn();
    else this.restartClock(true);
  }

  /** The board as the rules see it, rebuilt from the synced state. */
  private board(): Board {
    return createBoard({ squares: this.state.squares.map(toTile), spare: toTile(this.state.spare) });
  }

  /** Rejects unless `client` is seated, holds the turn and the turn is in `phase`. Changes nothing. */
  private requireTurn(client: Client, phase: string): void {
    const player = this.state.players.get(client.sessionId);
    if (!player) throw new CommandRejection("NOT_SEATED");
    // Nobody acts in a finished game, whoever's turn it was.
    if (this.state.phase === "finished") throw new CommandRejection("WRONG_PHASE", { expected: phase });
    if (player.seat !== this.state.turnSeat) throw new CommandRejection("NOT_YOUR_TURN", { seat: player.seat });
    if (this.state.phase !== phase) throw new CommandRejection("WRONG_PHASE", { expected: phase });
  }

  /** Gives the turn to the next taken seat clockwise (the same seat if alone, 0 if nobody is seated). */
  private passTurn(): void {
    this.setTurn(nextSeat([...this.state.players.values()].map((p) => p.seat), this.state.turnSeat));
  }

  /** A new turn always starts with the shift step and a fresh clock. */
  private setTurn(seat: number): void {
    const from = this.state.turnSeat;
    this.state.turnSeat = seat;
    this.state.phase = "shift";
    log.info("turn.changed", this.logCtx(undefined, { from, to: seat }));
    this.restartClock();
  }

  /**
   * Gives the current turn a fresh time limit, or none: in a finished game, with nobody on turn, or
   * while only one player is seated (until the waiting room exists, a lone player waits for company).
   * With `keepRunning`, a clock that already runs is left alone; it only stops if it no longer applies.
   */
  private restartClock(keepRunning = false): void {
    const applies = this.state.phase !== "finished" && this.state.turnSeat !== 0 && this.state.players.size >= 2;
    if (keepRunning && applies && this.state.turnDeadline !== 0) return;
    this.turnTimer?.clear();
    this.turnTimer = undefined;
    this.state.turnExpired = false;
    this.state.turnDeadline = 0;
    if (!applies) return;
    this.state.turnDeadline = Date.now() + this.turnLimitMs;
    this.turnTimer = this.clock.setTimeout(() => {
      this.turnTimer = undefined;
      this.state.turnExpired = true;
      log.info("turn.expired", this.logCtx(undefined, { seat: this.state.turnSeat }));
    }, this.turnLimitMs);
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
    // Until the waiting room exists, every seat gets its own stack of 24 / 4 when the game is created.
    this.dealSeed = randomInt(0, MAX_SEED + 1);
    this.stacks = dealTreasures(this.dealSeed, MAX_SEATS);
    log.info("game.dealt", this.logCtx(undefined, { dealSeed: this.dealSeed, seats: MAX_SEATS }));
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
    const stack = this.stacks[seat - 1]!;
    const player = new Player({ seat, row: corner.row, col: corner.col, cards: stack.length, target: stack[0] ?? "" });
    this.state.players.set(client.sessionId, player);
    this.showOwnPlayer(client, player);
    // Until the waiting room exists, the first player to sit down starts; the clock starts with company.
    if (this.state.turnSeat === 0) this.setTurn(seat);
    else this.restartClock(true);
  }

  /** Consented leave, or a dropped player's hold ran out (a kicked player is already gone). */
  onLeave(client: Client, code?: CloseCode) {
    super.onLeave(client, code);
    this.holds.delete(client.sessionId);
    client.view?.dispose();
    const player = this.state.players.get(client.sessionId);
    if (player) this.removePlayer(client.sessionId, player.connected ? "left" : "timeout");
  }

  /**
   * Unintended disconnect (mobile screen off, network switch): hold the seat so
   * the SDK can reconnect into the same session.
   */
  onDrop(client: Client, code?: CloseCode) {
    const player = this.state.players.get(client.sessionId);
    // Already removed (kicked): nothing to hold; onLeave follows.
    if (!player) return;
    player.connected = false;
    this.holds.set(client.sessionId, this.holdSeat(client, code, this.disconnectLimitSeconds));
  }

  onReconnect(client: Client) {
    super.onReconnect(client);
    this.holds.delete(client.sessionId);
    const player = this.state.players.get(client.sessionId);
    if (player) {
      player.connected = true;
      this.showOwnPlayer(client, player);
    }
  }

  /** The client's view holds its own player only, so it alone receives that player's secret target. */
  private showOwnPlayer(client: Client, player: Player): void {
    client.view ??= new StateView();
    client.view.add(player);
  }
}
