import type { CommandResult } from "@labyrinth/protocol";
import {
  allowedShifts,
  applyMove,
  applyShift,
  botRngFor,
  botViewOf,
  chooseBotTurn,
  isInsertionId,
  MAX_SEED,
  ROTATIONS,
  startGame,
  targetOf,
  type BotStrategy,
  type GameState,
  type NewSeat,
  type Rotation,
  type Square,
} from "@labyrinth/rules";
import { log } from "../logging/logger.ts";
import {
  clearLocalGame,
  loadLocalGame,
  localToken,
  newLocalRoomId,
  saveLocalGame,
  type SavedLocalGame,
} from "./localGameStore.ts";
import type { GameRoomLike } from "./useGameSession.ts";
import type { SyncedPlayer, SyncedState } from "./viewModel.ts";

/** The server's bot pauses: the shift this long after the turn starts, the move this long after the shift. */
export const BOT_SHIFT_DELAY_MS = 1_500;
export const BOT_MOVE_DELAY_MS = 1_000;

/** The server's bot names, in seat order after the player. */
const BOT_NAMES = ["Robo", "Pixel", "Byte"] as const;

/** The player's key in the synced players (their session id). */
const ME = "me";

export interface LocalRoomDeps {
  setTimeout(fn: () => void, ms: number): unknown;
  clearTimeout(id: unknown): void;
  /** A fresh game seed. */
  seed(): number;
  strategy: BotStrategy;
}

const defaultDeps = (): LocalRoomDeps => ({
  setTimeout: (fn, ms) => globalThis.setTimeout(fn, ms),
  clearTimeout: (id) => globalThis.clearTimeout(id as ReturnType<typeof setTimeout>),
  seed: () => {
    const [value] = globalThis.crypto.getRandomValues(new Uint32Array(1));
    return value! % (MAX_SEED + 1);
  },
  strategy: chooseBotTurn,
});

/** The seats of a quick game: the player in seat 1, `bots` bots in the next seats. */
function quickSeats(nickname: string, bots: number): NewSeat[] {
  return [{ seat: 1, name: nickname, bot: false }, ...BOT_NAMES.slice(0, bots).map((name, i) => ({ seat: i + 2, name, bot: true }))];
}

/** A new saved game against `bots` bots, replacing any saved one; logs its start. */
function newGame(nickname: string, bots: number, deps: LocalRoomDeps): SavedLocalGame {
  const roomId = newLocalRoomId();
  // The player hosts, so they play first.
  const game = startGame(deps.seed(), quickSeats(nickname, bots), 1);
  const saved = { roomId, game };
  saveLocalGame(saved);
  log.info("client.local.started", { room: roomId, dealSeed: game.seed, seats: game.seats.map((s) => s.seat).join(","), startSeat: game.turnSeat });
  return saved;
}

/**
 * A quick game against bots that runs on this device, behind the same interface as a game room on
 * the server: the session, view model and screens cannot tell the difference. Commands answer like
 * the server; bots play through the same path with the server's pauses; every step is saved.
 */
export class LocalRoom implements GameRoomLike {
  readonly roomId: string;
  readonly sessionId = ME;
  readonly reconnectionToken: string;
  private saved: SavedLocalGame;
  private readonly deps: LocalRoomDeps;
  private stateListeners: ((state: SyncedState) => void)[] = [];
  private leaveListeners: ((code: number) => void)[] = [];
  private botTimer: unknown;
  private gone = false;

  private constructor(saved: SavedLocalGame, deps: LocalRoomDeps) {
    this.saved = saved;
    this.deps = deps;
    this.roomId = saved.roomId;
    this.reconnectionToken = localToken(saved.roomId);
    saveLocalGame(saved);
    this.scheduleBot();
  }

  /** Starts a new game against `bots` bots (1–3) and saves it, replacing any saved one. */
  static create(nickname: string, bots: number, deps: Partial<LocalRoomDeps> = {}): LocalRoom {
    const all = { ...defaultDeps(), ...deps };
    return new LocalRoom(newGame(nickname, bots, all), all);
  }

  /** The saved game `roomId`, continued where it was; undefined when it is gone. */
  static restore(roomId: string, deps: Partial<LocalRoomDeps> = {}): LocalRoom | undefined {
    const saved = loadLocalGame(roomId);
    return saved && new LocalRoom(saved, { ...defaultDeps(), ...deps });
  }

  get game(): GameState {
    return this.saved.game;
  }

  /** The game in the shape the server syncs, as seen by the player. */
  get state(): SyncedState {
    const { game, rematchRoomId } = this.saved;
    const players = new Map<string, SyncedPlayer>(
      game.seats.map((s) => [
        s.bot ? `bot:${s.seat}` : ME,
        {
          seat: s.seat,
          name: s.name,
          bot: s.bot,
          connected: true,
          row: s.pawn.row,
          col: s.pawn.col,
          cards: s.stack.length,
          found: s.found,
          // Hidden information stays hidden: only the player's own target.
          ...(!s.bot && { target: targetOf(s) ?? "" }),
        },
      ]),
    );
    const squares = game.board.squares.map(({ id, rotation }) => ({ id, rotation }));
    return {
      squares,
      spare: { id: game.board.spare.id, rotation: game.board.spare.rotation },
      players,
      turnSeat: game.turnSeat,
      phase: game.step,
      hostSeat: 1,
      lastInsertion: game.lastInsertion ?? "",
      winnerSeat: game.winnerSeat,
      turnDeadline: 0,
      turnExpired: false,
      spectators: 0,
      botSpeed: 1,
      rematchRoomId: rematchRoomId ?? "",
    };
  }

  onStateChange(cb: (state: SyncedState) => void): void {
    this.stateListeners.push(cb);
  }

  onLeave(cb: (code: number) => void): void {
    this.leaveListeners.push(cb);
  }

  onDrop(): void {
    // A game on the device never loses its connection.
  }

  onReconnect(): void {
    // Nor reconnects.
  }

  removeAllListeners(): void {
    this.stateListeners = [];
    this.leaveListeners = [];
  }

  request(type: string, payload: unknown): Promise<CommandResult> {
    return Promise.resolve(this.handle(type, payload, ME));
  }

  /** Leaving on purpose: the game is over and forgotten. */
  leave(): Promise<void> {
    if (!this.gone) {
      this.gone = true;
      this.clearBotTimer();
      if (this.game.step !== "finished") this.logFinished(0);
      clearLocalGame(this.roomId);
    }
    return Promise.resolve();
  }

  private handle(type: string, payload: unknown, actor: string): CommandResult {
    if (this.gone) return { ok: false, code: "WRONG_PHASE" };
    const seat = actor === ME ? 1 : Number(actor.slice("bot:".length));
    switch (type) {
      case "shift": {
        const { insertion, rotation } = (payload ?? {}) as { insertion?: unknown; rotation?: unknown };
        if (!isInsertionId(insertion) || !ROTATIONS.includes(rotation as Rotation)) return { ok: false, code: "INVALID_COMMAND" };
        return this.apply(applyShift(this.game, seat, insertion, rotation as Rotation));
      }
      case "move": {
        const { row, col } = (payload ?? {}) as { row?: unknown; col?: unknown };
        if (!isIndex(row) || !isIndex(col)) return { ok: false, code: "INVALID_COMMAND" };
        return this.apply(applyMove(this.game, seat, { row, col }));
      }
      case "rematch":
        return this.rematch();
      case "setSpeed":
        return { ok: false, code: "NOT_SPECTATOR" };
      default:
        // Waiting-room and kick commands have nothing to act on here.
        return { ok: false, code: "WRONG_PHASE" };
    }
  }

  private apply(result: ReturnType<typeof applyShift>): CommandResult {
    if (!result.ok) return result;
    const finishing = result.state.step === "finished" && this.game.step !== "finished";
    this.update({ ...this.saved, game: result.state });
    if (finishing) this.logFinished(result.state.winnerSeat);
    return { ok: true };
  }

  /** Creates the next game with the same seats and syncs its id; the session then moves there. */
  private rematch(): CommandResult {
    if (this.game.step !== "finished") return { ok: false, code: "WRONG_PHASE" };
    if (this.saved.rematchRoomId) return { ok: true };
    const next = newGame(
      this.game.seats.find((s) => !s.bot)!.name,
      this.game.seats.filter((s) => s.bot).length,
      this.deps,
    );
    // The new game is the saved one now (the session opens it by its id); this one only remembers where it went.
    this.saved = { ...this.saved, rematchRoomId: next.roomId };
    this.emit();
    return { ok: true };
  }

  /** Saves and publishes a new state, then lets a bot on turn play. */
  private update(saved: SavedLocalGame): void {
    this.saved = saved;
    saveLocalGame(saved);
    this.emit();
    this.scheduleBot();
  }

  private emit(): void {
    const state = this.state;
    for (const cb of [...this.stateListeners]) cb(state);
  }

  /** A bot on turn shifts after a pause, then moves after another; nothing when it is a person's turn. */
  private scheduleBot(): void {
    this.clearBotTimer();
    const { game } = this;
    if (this.gone || game.step === "finished") return;
    const current = game.seats.find((s) => s.seat === game.turnSeat);
    if (!current?.bot) return;
    const actor = `bot:${current.seat}`;
    if (game.step === "shift") {
      this.botTimer = this.deps.setTimeout(() => this.playBotShift(current.seat, actor), BOT_SHIFT_DELAY_MS);
    } else {
      this.botTimer = this.deps.setTimeout(() => this.playBotMove(actor, current.pawn), BOT_MOVE_DELAY_MS);
    }
  }

  /** The whole turn is chosen with the shift, as on the server; a rejected choice falls back to an allowed shift and staying. */
  private playBotShift(seat: number, actor: string): void {
    this.botTimer = undefined;
    const turn = this.deps.strategy(botViewOf(this.game, seat), botRngFor(this.game, seat));
    // Remember the move before the shift publishes the move step.
    this.saved = { ...this.saved, botTo: turn.to };
    const result = this.handle("shift", { insertion: turn.insertion, rotation: turn.rotation }, actor);
    if (result.ok) return;
    log.error("client.error", { kind: "bot.fallback", cmd: "shift", code: result.code });
    this.saved = { ...this.saved, botTo: undefined };
    const fallback = allowedShifts(this.game.lastInsertion)[0]!;
    this.handle("shift", fallback, actor);
  }

  private playBotMove(actor: string, stay: Square): void {
    this.botTimer = undefined;
    const to = this.saved.botTo ?? stay;
    this.saved = { ...this.saved, botTo: undefined };
    const result = this.handle("move", to, actor);
    if (!result.ok) {
      log.error("client.error", { kind: "bot.fallback", cmd: "move", code: result.code });
      this.handle("move", stay, actor);
    }
  }

  private clearBotTimer(): void {
    if (this.botTimer !== undefined) this.deps.clearTimeout(this.botTimer);
    this.botTimer = undefined;
  }

  private logFinished(winner: number): void {
    log.info("client.local.finished", { room: this.roomId, winner, turns: this.game.turn });
  }
}

const isIndex = (value: unknown): value is number => Number.isInteger(value) && (value as number) >= 0 && (value as number) <= 6;
