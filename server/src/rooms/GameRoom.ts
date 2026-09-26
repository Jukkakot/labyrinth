import type { Client, CloseCode } from "colyseus";
import { LoggedRoom } from "./LoggedRoom.js";
import { GameState, Player } from "./schema/GameState.js";

/** Seconds a dropped player's seat is held before they are removed. */
const RECONNECT_WINDOW_SECONDS = 60;

/** One Labyrinth game. Game rules are added by later changes. */
export class GameRoom extends LoggedRoom<{ state: GameState }> {
  maxClients = 4;
  state = new GameState();

  onJoin(client: Client) {
    super.onJoin(client);
    this.state.players.set(client.sessionId, new Player());
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
