import { randomInt } from "node:crypto";
import { StateView } from "@colyseus/schema";
import { ErrorCode, ServerError, type Client, type CloseCode, type Deferred } from "colyseus";
import {
  CLOSE_CODES,
  joinOptionsSchema,
  kickPayloadSchema,
  movePayloadSchema,
  shiftPayloadSchema,
  startPayloadSchema,
  type JoinErrorCode,
  type JoinOptions,
  type TurnPhase,
} from "@labyrinth/protocol";
import {
  createBoard,
  dealGame,
  MIN_SEATS,
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

/** At most this many games exist at a time (one 0 € instance); creating more is refused. */
export const MAX_OPEN_GAMES = 100;

/** Listing metadata the lobby's game list shows and filters on. */
export interface GameMetadata {
  /** The host's nickname; "" until the host has joined. */
  host: string;
  /** True while the game is in its waiting room. */
  open: boolean;
  /** Matchmaking pool: "" for real players, set by E2E tests. */
  pool: string;
}

/** Why the room was closed for everyone (`room.closed`). */
type CloseReason = "hostLeft";

/** Why a player was taken out of the game (`player.removed`). */
type RemovalReason = "left" | "kicked" | "timeout";

const toTileState = (tile: Tile) => new TileState({ id: tile.id, rotation: tile.rotation });
const toTile = (t: TileState): Tile => ({ id: t.id, kind: tileSpec(t.id).kind, rotation: t.rotation as Rotation });
const squareOf = (player: Player): Square => ({ row: player.row, col: player.col });
/** Refuses a join or room creation: the client reads `code` from the error message. */
const refuse = (code: JoinErrorCode) =>
  new ServerError(code === "INVALID_NICKNAME" ? ErrorCode.AUTH_FAILED : ErrorCode.APPLICATION_ERROR, code);

const placePawn = (player: Player, sq: Square) => {
  player.row = sq.row;
  player.col = sq.col;
};

/**
 * One Labyrinth game: a seeded starting board and up to four seated players. It starts in the
 * waiting room, where players take seats; the host (the first to join) starts the game.
 */
export class GameRoom extends LoggedRoom<{ state: GameState; metadata: GameMetadata }> {
  maxClients = MAX_SEATS;
  state = new GameState();

  /** Games that exist now, across all rooms of this process. */
  static openGames = 0;
  /** The cap on `openGames`; room tests lower it. */
  static maxOpenGames = MAX_OPEN_GAMES;

  /** Turn time limit; room tests shorten it. */
  turnLimitMs = TURN_TIME_LIMIT_SECONDS * 1000;
  /** How long a dropped player keeps their seat; room tests shorten it. */
  disconnectLimitSeconds = DISCONNECT_LIMIT_SECONDS;

  /** Draws the seed of the deal at the start; room tests replace it to fix the start seat. */
  drawDealSeed = () => randomInt(0, MAX_SEED + 1);

  /** Server-only: never part of the synced state. */
  private seed = 0;
  /** Treasure stack of each seated seat, dealt when the game starts. */
  private stacks = new Map<number, TreasureId[]>();
  /** True while the room is being closed for everyone: dropped connections hold no seat. */
  private closing = false;
  /** True once this room counts towards `openGames`. */
  private counted = false;
  private turnTimer?: { clear(): void };
  /** Seat holds of dropped players, by sessionId; rejecting one removes that player at once. */
  private holds = new Map<string, Deferred<Client>>();

  messages = {
    start: this.command("start", startPayloadSchema, (client) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) throw new CommandRejection("NOT_SEATED");
      if (player.seat !== this.state.hostSeat) throw new CommandRejection("NOT_HOST", { seat: player.seat });
      if (this.state.phase !== "waiting") throw new CommandRejection("WRONG_PHASE", { expected: "waiting" });
      if (this.state.players.size < MIN_SEATS) throw new CommandRejection("NOT_ENOUGH_PLAYERS", { seated: this.state.players.size });

      const seats = this.seats();
      const dealSeed = this.drawDealSeed();
      const { stacks, startSeat } = dealGame(dealSeed, seats);
      this.stacks = stacks;
      for (const p of this.state.players.values()) {
        const stack = stacks.get(p.seat)!;
        p.cards = stack.length;
        p.target = stack[0]!;
      }
      void this.lock();
      void this.setMetadata({ ...this.metadata, open: false });
      log.info("game.started", this.logCtx(undefined, { dealSeed, seats, startSeat }));
      this.setTurn(startSeat);
    }),

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
        waiting: this.state.phase === "waiting",
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
      hostSeat: this.state.hostSeat,
      seated: this.state.players.size,
      turnSeat: this.state.turnSeat,
      turnExpired: this.state.turnExpired,
      lastInsertion: this.state.lastInsertion,
      pawn: current ? [current.row, current.col] : undefined,
    };
  }

  /** Adds the treasure to the player's found ones; the next card of the stack (or home) becomes the target. */
  private collect(player: Player, treasure: TreasureId): void {
    player.found.push(treasure);
    player.target = this.stacks.get(player.seat)![player.found.length] ?? "";
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
   * The one way out of a game (left, kicked, disconnected too long): pawn, stack and seat go. In
   * the waiting room the seat is simply free again, unless the host went: then the room closes.
   * In a started game the last player standing wins, or the turn passes if it was theirs.
   */
  private removePlayer(sessionId: string, reason: RemovalReason, by?: number): void {
    const player = this.state.players.get(sessionId);
    if (!player) return;
    const { seat } = player;
    this.state.players.delete(sessionId);
    log.info("player.removed", this.logCtx(undefined, { player: sessionId, seat, reason, ...(by !== undefined && { by }) }));
    if (this.state.phase === "waiting") {
      if (seat === this.state.hostSeat && !this.closing) this.closeRoom("hostLeft");
      return;
    }
    if (this.state.phase === "finished") return;
    const survivor = soleSurvivor(this.seats());
    if (survivor !== undefined) this.finish(survivor, "lastPlayer");
    else if (seat === this.state.turnSeat) this.passTurn();
    else this.restartClock(true);
  }

  /**
   * Ends the game for everyone before it started: nobody can join, every other connection is
   * closed with a code saying why, and dropped players' holds end. Colyseus then disposes the room.
   */
  private closeRoom(reason: CloseReason): void {
    this.closing = true;
    void this.lock();
    void this.setMetadata({ ...this.metadata, open: false });
    log.info("room.closed", this.logCtx(undefined, { reason }));
    for (const client of this.clients) client.leave(CLOSE_CODES.HOST_LEFT);
    for (const [sessionId, hold] of this.holds) {
      this.holds.delete(sessionId);
      hold.reject(false);
    }
  }

  /** The taken seats, in ascending order. */
  private seats(): number[] {
    return [...this.state.players.values()].map((p) => p.seat).sort((a, b) => a - b);
  }

  /** The board as the rules see it, rebuilt from the synced state. */
  private board(): Board {
    return createBoard({ squares: this.state.squares.map(toTile), spare: toTile(this.state.spare) });
  }

  /** Rejects unless `client` is seated, holds the turn and the turn is in `phase`. Changes nothing. */
  private requireTurn(client: Client, phase: string): void {
    const player = this.state.players.get(client.sessionId);
    if (!player) throw new CommandRejection("NOT_SEATED");
    // Nobody acts before the start or in a finished game, whoever's turn it was.
    if (this.state.phase === "waiting" || this.state.phase === "finished") throw new CommandRejection("WRONG_PHASE", { expected: phase });
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
   * Gives the current turn a fresh time limit, or none: in the waiting room, in a finished game, or
   * with nobody on turn. With `keepRunning`, a clock that already runs is left alone; it only stops
   * if it no longer applies.
   */
  private restartClock(keepRunning = false): void {
    const applies = (this.state.phase === "shift" || this.state.phase === "move") && this.state.turnSeat !== 0;
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
    // Refuse before anything exists: the creator's own join would be refused anyway.
    const parsed = joinOptionsSchema.safeParse(options);
    if (!parsed.success) {
      log.info("room.refused", { reason: "nickname" });
      throw refuse("INVALID_NICKNAME");
    }
    if (GameRoom.openGames >= GameRoom.maxOpenGames) {
      log.warn("room.refused", { reason: "cap", open: GameRoom.openGames });
      throw refuse("SERVER_FULL");
    }
    GameRoom.openGames++;
    this.counted = true;

    await super.onCreate(options);
    if (parsed.data.private) await this.setPrivate(true);
    await this.setMetadata({ host: "", open: true, pool: parsed.data.pool ?? "" });
    this.seed = randomInt(0, MAX_SEED + 1);
    const board = setupBoard(this.seed);
    this.state.squares.push(...board.squares.map(toTileState));
    this.state.spare = toTileState(board.spare);
    log.info("game.setup", this.logCtx(undefined, { seed: this.seed, private: parsed.data.private ?? false }));
  }

  /** Checks the join options before a seat is taken: a player needs a valid nickname. */
  onAuth(_client: Client, options: unknown): JoinOptions {
    const parsed = joinOptionsSchema.safeParse(options);
    if (!parsed.success) {
      log.info("room.refused", this.logCtx(undefined, { reason: "nickname" }));
      throw refuse("INVALID_NICKNAME");
    }
    return parsed.data;
  }

  /** The lowest seat 1–4 nobody holds (dropped players keep theirs). */
  private freeSeat(): number {
    const taken = new Set([...this.state.players.values()].map((p) => p.seat));
    for (let seat = 1; seat <= MAX_SEATS; seat++) if (!taken.has(seat)) return seat;
    throw new Error("No free seat"); // maxClients prevents this
  }

  /** Seats the player in the waiting room (joining is closed once the game starts); the first one hosts. */
  onJoin(client: Client, _options?: unknown, auth?: JoinOptions) {
    const name = auth!.nickname;
    super.onJoin(client, undefined, undefined, { name });
    const seat = this.freeSeat();
    const corner = START_CORNERS[seat - 1]!;
    const player = new Player({ seat, name, row: corner.row, col: corner.col });
    this.state.players.set(client.sessionId, player);
    this.showOwnPlayer(client, player);
    if (this.state.hostSeat === 0) {
      this.state.hostSeat = seat;
      void this.setMetadata({ ...this.metadata, host: name });
    }
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
    // Already removed (kicked), or the room is closing: nothing to hold; onLeave follows.
    if (!player || this.closing) return;
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

  onDispose() {
    super.onDispose();
    this.turnTimer?.clear();
    if (this.counted) GameRoom.openGames--;
  }

  /** The client's view holds its own player only, so it alone receives that player's secret target. */
  private showOwnPlayer(client: Client, player: Player): void {
    client.view ??= new StateView();
    client.view.add(player);
  }
}
