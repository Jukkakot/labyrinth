import { Room, type Client, type CloseCode } from "colyseus";
import { GameState, Player } from "./schema/GameState.js";

/** Seconds a dropped player's seat is held before they are removed. */
const RECONNECT_WINDOW_SECONDS = 60;

/** One Labyrinth game. Game rules are added by later changes. */
export class GameRoom extends Room<{ state: GameState }> {
  maxClients = 4;
  state = new GameState();

  onJoin(client: Client) {
    this.state.players.set(client.sessionId, new Player());
  }

  onLeave(client: Client, _code: CloseCode) {
    this.state.players.delete(client.sessionId);
  }

  /**
   * Unintended disconnect (mobile screen off, network switch): hold the seat so
   * the SDK can reconnect into the same session.
   */
  onDrop(client: Client, _code: CloseCode) {
    const player = this.state.players.get(client.sessionId);
    if (player) player.connected = false;
    // Outcome is routed to onReconnect() or onLeave(); the catch covers disposal.
    this.allowReconnection(client, RECONNECT_WINDOW_SECONDS).catch(() => {});
  }

  onReconnect(client: Client) {
    const player = this.state.players.get(client.sessionId);
    if (player) player.connected = true;
  }
}
