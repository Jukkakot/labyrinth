import { randomInt } from "node:crypto";
import type { Client, CloseCode } from "colyseus";
import { MAX_SEED, setupBoard, type Tile } from "@labyrinth/rules";
import { log } from "../logging/logger.js";
import { LoggedRoom } from "./LoggedRoom.js";
import { GameState, Player, TileState } from "./schema/GameState.js";

/** Seconds a dropped player's seat is held before they are removed. */
const RECONNECT_WINDOW_SECONDS = 60;
export const MAX_SEATS = 4;

const toTileState = (tile: Tile) => new TileState({ id: tile.id, rotation: tile.rotation });

/** One Labyrinth game: seeded starting board and up to four seated players. */
export class GameRoom extends LoggedRoom<{ state: GameState }> {
  maxClients = MAX_SEATS;
  state = new GameState();

  /** Server-only: never part of the synced state. */
  private seed = 0;

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
    this.state.players.set(client.sessionId, new Player({ seat: this.freeSeat() }));
  }

  onLeave(client: Client, code?: CloseCode) {
    super.onLeave(client, code);
    this.state.players.delete(client.sessionId);
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
